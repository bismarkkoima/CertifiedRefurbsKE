'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useAuth } from '@/components/Providers'

function RegisterForm() {
  const { register } = useAuth()
  const router = useRouter()
  const next = useSearchParams().get('next')
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await register({ ...form, phone: form.phone || null })
      router.push(next || '/account')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form className="card auth-card stack" onSubmit={submit}>
      <div>
        <h1>Create your account</h1>
        <p className="muted">Track orders, save devices and check out in seconds.</p>
      </div>
      <div className="field"><label htmlFor="n">Full name</label><input id="n" className="input" required minLength={2} autoComplete="name" value={form.full_name} onChange={set('full_name')} /></div>
      <div className="field"><label htmlFor="e">Email</label><input id="e" className="input" type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></div>
      <div className="field"><label htmlFor="p">M-Pesa phone (optional)</label><input id="p" className="input" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={form.phone} onChange={set('phone')} /></div>
      <div className="field"><label htmlFor="pw">Password</label><input id="pw" className="input" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} /><span className="hint">At least 8 characters</span></div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      <p className="muted" style={{ textAlign: 'center' }}>Already have an account? <Link href="/login" className="link">Sign in</Link></p>
    </form>
  )
}

export default function RegisterPage() {
  return <div className="auth-wrap"><Suspense><RegisterForm /></Suspense></div>
}
