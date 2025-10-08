"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

const AUTOSAVE_DELAY = 800
const SAVE_RESET_DELAY = 2000
const SAVE_RETRY_DELAYS = [0, 500, 1000, 2000]

export type Chapter = { id: string; title: string; order_index: number }
export type Scene = { id: string; title: string; order_index: number; chapter_id: string }

type SceneCacheEntry = {
  content: string
  word_count: number
  updated_at: string
}

type SaveState = "idle" | "saving" | "saved" | "error"

type ProjectEditorProps = {
  project: { id: string; title: string; goal: number | null }
  chapters: Chapter[]
  scenes: Scene[]
  initialSceneId: string | null
  initialStats: {
    words: number
    streak: number
  }
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export default function ProjectEditor({ project, chapters, scenes, initialSceneId, initialStats }: ProjectEditorProps) {
  const [tree, setTree] = useState(() =>
    chapters.map((chapter) => ({
      ...chapter,
      scenes: scenes.filter((scene) => scene.chapter_id === chapter.id),
    }))
  )
  const [activeSceneId, setActiveSceneId] = useState<string | null>(initialSceneId)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    initialSceneId ? scenes.find((scene) => scene.id === initialSceneId)?.chapter_id ?? null : chapters[0]?.id ?? null
  )
  const [content, setContent] = useState<string>("")
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [isSceneLoading, setIsSceneLoading] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [statsWords, setStatsWords] = useState(initialStats.words)
  const [statsStreak, setStatsStreak] = useState(initialStats.streak)
  const [lastSavedContent, setLastSavedContent] = useState("")
  const [exportingFormat, setExportingFormat] = useState<"md" | "txt" | null>(null)
  const [reviewScoreData, setReviewScoreData] = useState<{
    summary: string
    clarity: number
    pacing: number
    show_vs_tell: number
    suggestions: string[]
  } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveResetTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sceneCache = useRef<Map<string, SceneCacheEntry>>(new Map())

  const loadSceneContent = useCallback(async (sceneId: string | null) => {
    if (!sceneId) {
      setContent("")
      setLastSavedContent("")
      return
    }

    const cached = sceneCache.current.get(sceneId)
    if (cached) {
      setContent(cached.content)
      setLastSavedContent(cached.content)
      return
    }

    setIsSceneLoading(true)
    try {
      const response = await fetch(`/api/scenes/${sceneId}`)
      if (!response.ok) {
        throw new Error("Failed to load scene")
      }
      const payload = await response.json()
      const contentValue = payload.scene?.content ?? ""
      setContent(contentValue)
      setLastSavedContent(contentValue)
      sceneCache.current.set(sceneId, {
        content: contentValue,
        word_count: payload.scene?.word_count ?? 0,
        updated_at: payload.scene?.updated_at ?? new Date().toISOString(),
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load scene")
    } finally {
      setIsSceneLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSceneContent(activeSceneId ?? null)
  }, [activeSceneId, loadSceneContent])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (saveResetTimeoutRef.current) {
        clearTimeout(saveResetTimeoutRef.current)
      }
    }
  }, [])

  const liveWordCount = useMemo(() => countWords(content), [content])

  useEffect(() => {
    if (!activeSceneId || !activeChapterId) {
      return
    }

    setTree((prev) =>
      prev.map((chapter) =>
        chapter.id === activeChapterId
          ? {
              ...chapter,
              scenes: chapter.scenes.map((scene) =>
                scene.id === activeSceneId
                  ? { ...scene, word_count: liveWordCount }
                  : scene
              ),
            }
          : chapter
      )
    )

    sceneCache.current.set(activeSceneId, {
      content,
      word_count: liveWordCount,
      updated_at: new Date().toISOString(),
    })
  }, [content, liveWordCount, activeChapterId, activeSceneId])

  const optimisticWords = useMemo(() => Math.max(statsWords, liveWordCount), [statsWords, liveWordCount])
  const optimisticStreak = useMemo(() => {
    if (!project.goal || project.goal <= 0) {
      return statsStreak
    }
    if (statsWords >= project.goal) {
      return statsStreak
    }
    if (optimisticWords >= project.goal) {
      return Math.max(statsStreak, statsStreak || 1)
    }
    return statsStreak
  }, [project.goal, statsStreak, statsWords, optimisticWords])

  const todaysProgress = useMemo(() => {
    if (!project.goal || project.goal <= 0) {
      return `Today ${optimisticWords} words`
    }
    return `Today ${optimisticWords}/${project.goal} words`
  }, [optimisticWords, project.goal])

  const saveSceneContent = useCallback(
    async (sceneId: string, body: string) => {
      let lastError: unknown

      for (let attempt = 0; attempt < SAVE_RETRY_DELAYS.length; attempt += 1) {
        const delay = SAVE_RETRY_DELAYS[attempt]
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        try {
          const response = await fetch(`/api/scenes/${sceneId}/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: body, projectId: project.id }),
          })

         const payload = await response.json().catch(() => ({ ok: false }))
         if (!response.ok || !payload.ok) {
           throw new Error(payload?.message ?? 'Save failed')
         }

         setLastSavedContent(body)
         setSaveState('saved')
          sceneCache.current.set(sceneId, {
            content: body,
            word_count: countWords(body),
            updated_at: new Date().toISOString(),
          })
          const serverWords = payload.stats?.words
          const serverStreak = payload.stats?.streak
          if (typeof serverWords === 'number') {
            setStatsWords(serverWords)
          }
          if (typeof serverStreak === 'number') {
            setStatsStreak(serverStreak)
          }
          if (saveResetTimeoutRef.current) {
            clearTimeout(saveResetTimeoutRef.current)
          }
          saveResetTimeoutRef.current = setTimeout(() => {
            setSaveState('idle')
          }, SAVE_RESET_DELAY)
          return
        } catch (error) {
          lastError = error
        }
      }

      setSaveState('error')
      toast.error(lastError instanceof Error ? lastError.message : 'Failed to autosave')
    },
    [project.id]
  )

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    if (!activeSceneId) {
      return
    }

    if (content === lastSavedContent) {
      setSaveState('idle')
      return
    }

    setSaveState('saving')
    if (saveResetTimeoutRef.current) {
      clearTimeout(saveResetTimeoutRef.current)
      saveResetTimeoutRef.current = null
    }

    saveTimeoutRef.current = setTimeout(() => {
      void saveSceneContent(activeSceneId, content)
    }, AUTOSAVE_DELAY)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, lastSavedContent, activeSceneId, saveSceneContent])

  const handleSelectScene = useCallback(
    (chapterId: string, sceneId: string) => {
      if (sceneId === activeSceneId) {
        return
      }

      setActiveSceneId(sceneId)
      setActiveChapterId(chapterId)
      setSaveState('idle')
    },
    [activeSceneId]
  )

  const todaysChip = useMemo(() => {
    if (saveState === 'saving') return 'Saving…'
    if (saveState === 'saved') return 'Saved'
    if (saveState === 'error') return 'Save failed'
    return null
  }, [saveState])

  const handleExport = useCallback(
    async (format: 'md' | 'txt') => {
      if (!project.id) {
        return
      }

      setExportingFormat(format)
      try {
        const response = await fetch(`/api/export?projectId=${project.id}&format=${format}`)
        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.message ?? 'Export failed')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const disposition = response.headers.get('content-disposition') ?? ''
        const match = disposition.match(/filename="?([^";]+)"?/)
        const filename = match?.[1] ?? `project.${format}`

        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Export failed')
      } finally {
        setExportingFormat(null)
      }
    },
    [project.id]
  )

  return (
    <div className="relative space-y-6">
      <header className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{project.title}</h1>
          <p className="text-sm text-slate-400">{todaysProgress}</p>
        </div>
        {todaysChip ? (
          <span className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-slate-300">
            {todaysChip}
          </span>
        ) : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleExport('md')}
            disabled={exportingFormat !== null}
            className="rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 transition hover:border-sky-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exportingFormat === 'md' ? 'Exporting…' : 'Export Markdown'}
          </button>
          <button
            type="button"
            onClick={() => void handleExport('txt')}
            disabled={exportingFormat !== null}
            className="rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 transition hover:border-sky-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exportingFormat === 'txt' ? 'Exporting…' : 'Export Plain'}
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chapters</h2>
          <div className="space-y-3">
            {tree.map((chapter) => (
              <div key={chapter.id} className="rounded-lg bg-slate-900/60 p-3">
                <p className="text-sm font-semibold text-slate-100">{chapter.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-400">
                  {chapter.scenes.map((scene) => (
                    <li key={scene.id}>
                      <button
                        onClick={() => handleSelectScene(chapter.id, scene.id)}
                        className={`w-full rounded-md px-2 py-1 text-left transition ${
                          activeSceneId === scene.id
                            ? 'bg-sky-500/20 text-sky-100'
                            : 'hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        {scene.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:p-6">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm text-slate-400">
              {isSceneLoading ? 'Loading scene…' : `${liveWordCount} words`}
            </span>
            <span className="text-xs text-slate-500">
              {saveState === 'saving' && 'Saving…'}
              {saveState === 'saved' && 'Saved'}
              {saveState === 'error' && 'Save failed'}
            </span>
          </header>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="editor-textarea editor-content column-ruler flex-1 h-full w-full resize-none bg-slate-900/60 px-6 py-5 text-base text-slate-100 rounded-xl ring-1 ring-slate-800 focus:outline-none focus:ring-sky-500"
            placeholder="Start writing your scene…"
          />
        </section>

        <aside className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Buddy Review</h2>
          <button
            onClick={async () => {
              if (!activeSceneId) {
                toast.error('Select a scene first')
                return
              }

              setReviewLoading(true)
              try {
                const response = await fetch('/api/review', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ projectId: project.id, sceneId: activeSceneId }),
                })
                if (!response.ok) {
                  throw new Error('Review request failed')
                }
                const payload = await response.json()
                if (!payload?.ok) {
                  throw new Error(payload?.message ?? 'Review failed')
                }
                setReviewScoreData(payload.review)
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Unable to run review')
              } finally {
                setReviewLoading(false)
              }
            }}
            className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
            disabled={reviewLoading}
          >
            {reviewLoading ? 'Requesting…' : 'Run Review'}
          </button>

          {reviewScoreData ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-slate-900/60 p-4">
                <h3 className="text-sm font-semibold text-slate-100">Summary</h3>
                <p className="mt-2 text-sm text-slate-300">{reviewScoreData.summary}</p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'clarity', label: 'Clarity', value: reviewScoreData.clarity },
                  { key: 'pacing', label: 'Pacing', value: reviewScoreData.pacing },
                  { key: 'show_vs_tell', label: 'Show vs Tell', value: reviewScoreData.show_vs_tell },
                ].map(({ key, label, value }) => {
                  const score = Math.max(0, Math.min(10, value))
                  return (
                    <div key={key} className="rounded-lg border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-200">
                      <div className="flex items-center justify-between">
                        <span>{label}</span>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-100">
                          {score}/10
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-sky-500"
                          style={{ width: `${(score / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-lg border border-white/10 bg-slate-900/60 p-4">
                <h3 className="text-sm font-semibold text-slate-100">Suggestions</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {reviewScoreData.suggestions.map((suggestion, index) => (
                    <li key={`suggestion-${index}`}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Run a review to get AI feedback.</p>
          )}
        </aside>
      </div>
      <div className="pointer-events-none fixed bottom-4 right-4 flex gap-2">
        <span className="pointer-events-auto rounded-full bg-slate-900/90 px-3 py-1 text-xs text-slate-300 shadow-lg shadow-black/40">
          Today: <span className="text-slate-100">{optimisticWords}</span>
          {project.goal ? <span className="text-slate-500">/{project.goal}</span> : null}
        </span>
        <span className="pointer-events-auto rounded-full bg-slate-900/90 px-3 py-1 text-xs text-slate-300 shadow-lg shadow-black/40">
          Streak: <span className="text-slate-100">{optimisticStreak}</span> days
        </span>
      </div>
    </div>
  )
}
