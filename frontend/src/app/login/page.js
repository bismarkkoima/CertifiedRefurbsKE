'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useAuth } from '@/components/Providers'

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const next = useSearchParams().get('next')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await login(form.email, form.password)
      router.push(next || (user.is_admin ? '/admin' : '/account'))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form className="card auth-card stack" onSubmit={submit}>
      <div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to track orders and check out faster.</p>
      </div>
      <div className="field"><label htmlFor="email">Email</label><input id="email" className="input" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div className="field"><label htmlFor="pw">Password</label><input id="pw" className="input" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="muted" style={{ textAlign: 'center' }}>New here? <Link href={`/register${next ? `?next=${next}` : ''}`} className="link">Create an account</Link></p>
    </form>
  )
}

export default function LoginPage() {
  return <div className="auth-wrap"><Suspense><LoginForm /></Suspense></div>
}
