'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

type NewProjectModalProps = {
  action: (formData: FormData) => Promise<void>
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="rounded-md bg-sky-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? 'Creating…' : 'Create Project'}
    </button>
  )
}

export default function NewProjectModal({ action }: NewProjectModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="rounded-md bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700"
        onClick={() => setOpen(true)}
      >
        New Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 p-5 shadow-xl text-slate-100">
            <h2 className="mb-4 text-lg font-semibold">Create a new project</h2>

            <form action={action} className="space-y-4" onSubmit={() => setOpen(false)}>
              <div className="space-y-1">
                <label className="text-sm text-slate-300">Title</label>
                <input
                  name="title"
                  type="text"
                  required
                  minLength={1}
                  maxLength={80}
                  placeholder="My Awesome Book"
                  className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-300">Daily goal (words)</label>
                <input
                  name="goal"
                  type="number"
                  min={100}
                  max={5000}
                  defaultValue={500}
                  className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-slate-300 hover:text-slate-100"
                >
                  Cancel
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
