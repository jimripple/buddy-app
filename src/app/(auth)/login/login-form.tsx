'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { getBrowserSupabase } from '@/lib/supabase/client'
import { loginSchema } from './schema'

type Status = 'idle' | 'loading' | 'success' | 'error'

type LoginFormProps = {
  redirectTo?: string
  initialSuccess?: string
  initialError?: string
}

export function LoginForm({ redirectTo, initialSuccess, initialError }: LoginFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(
    initialSuccess ? 'success' : initialError ? 'error' : 'idle'
  )
  const successMessage =
    initialSuccess && initialSuccess !== '1'
      ? initialSuccess
      : initialSuccess === '1'
      ? 'Check your email for the magic link.'
      : undefined
  const [message, setMessage] = useState<string>(successMessage ?? initialError ?? '')
  const passwordLoginEnabled = process.env.NEXT_PUBLIC_PASSWORD_LOGIN === '1'
  const [mode, setMode] = useState<'magic' | 'password'>(
    passwordLoginEnabled ? 'magic' : 'magic'
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const emailValue = formData.get('email')
    const passwordValue = formData.get('password')

    if (typeof emailValue !== 'string' || !emailValue.trim()) {
      setStatus('error')
      setMessage('Enter your email')
      return
    }

    const parsed = loginSchema.safeParse({
      email: emailValue,
      redirectTo,
    })

    if (!parsed.success) {
      setStatus('error')
      setMessage(parsed.error.issues[0]?.message ?? 'Invalid email')
      return
    }

    setStatus('loading')
    setMessage('')

    const supabase = getBrowserSupabase()
    if (mode === 'password') {
      if (typeof passwordValue !== 'string' || !passwordValue.trim()) {
        setStatus('error')
        setMessage('Enter your password')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: passwordValue,
      })

      if (error) {
        setStatus('error')
        setMessage(error.message ?? 'Unable to sign in')
        return
      }

      setStatus('success')
      setMessage('Signed in! Redirecting...')
      router.replace(redirectTo ?? '/projects')
      return
    }

    const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
    if (redirectTo) {
      callbackUrl.searchParams.set('redirect', redirectTo)
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    })

    if (error) {
      setStatus('error')
      setMessage(error.message ?? 'Unable to send magic link')
      return
    }

    setStatus('success')
    setMessage('Check your email for the magic link.')
  }

  const isLoading = status === 'loading'
  const messageColor =
    status === 'success' ? 'text-emerald-400' : status === 'error' ? 'text-rose-400' : ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-slate-200">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-4 py-2.5 text-base text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          placeholder="you@example.com"
          aria-label="Email address"
        />
      </div>
      {mode === 'password' ? (
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-slate-200">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-4 py-2.5 text-base text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            placeholder="••••••••"
            aria-label="Password"
          />
        </div>
      ) : null}
      {redirectTo ? <input type="hidden" name="redirect" value={redirectTo} /> : null}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading
          ? 'Sending...'
          : mode === 'password'
          ? 'Sign In'
          : 'Send Magic Link'}
      </button>
      {passwordLoginEnabled ? (
        <button
          type="button"
          onClick={() => {
            setStatus('idle')
            setMessage('')
            setMode((prev) => (prev === 'magic' ? 'password' : 'magic'))
          }}
          className="text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          {mode === 'magic' ? 'Use password instead' : 'Use magic link instead'}
        </button>
      ) : null}
      <div className="min-h-[24px]" aria-live="polite">
        {message ? <p className={`${messageColor} text-sm`}>{message}</p> : null}
      </div>
    </form>
  )
}
