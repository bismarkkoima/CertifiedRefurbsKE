'use client'

import { useState } from 'react'
import { api } from '@/utils/api'

export default function Contact() {
  const [form, setForm] = useState({ full_name: '', email: '', subject: '', message: '' })
  const [state, setState] = useState({ status: 'idle' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setState({ status: 'loading' })
    try {
      const res = await api.contact(form)
      setState({ status: 'ok', message: res.message })
      setForm({ full_name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setState({ status: 'error', message: err.message })
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Contact</span>
          <h1>We’re here to help.</h1>
          <p>Questions about a device, an order or a warranty claim? Our Nairobi team replies within one business day.</p>
        </div>
      </section>
      <section className="container section-sm">
        <div className="panel-grid">
          <form className="card stack" onSubmit={submit}>
            <div className="form-grid">
              <div className="field"><label htmlFor="n">Full name</label><input id="n" className="input" required minLength={2} value={form.full_name} onChange={set('full_name')} /></div>
              <div className="field"><label htmlFor="e">Email</label><input id="e" className="input" type="email" required value={form.email} onChange={set('email')} /></div>
              <div className="field full"><label htmlFor="s">Subject</label><input id="s" className="input" required minLength={2} placeholder="e.g. Warranty claim for CRK-…" value={form.subject} onChange={set('subject')} /></div>
              <div className="field full"><label htmlFor="m">Message</label><textarea id="m" className="textarea" required minLength={5} value={form.message} onChange={set('message')} /></div>
            </div>
            {state.status === 'ok' && <p className="form-success">{state.message}</p>}
            {state.status === 'error' && <p className="form-error">{state.message}</p>}
            <button className="btn btn-primary btn-lg" disabled={state.status === 'loading'}>{state.status === 'loading' ? 'Sending…' : 'Send message'}</button>
          </form>
          <aside className="stack">
            <div className="card card-tight"><h3>Visit us</h3><p className="muted">The Mall, 2nd floor, Westlands, Nairobi<br />Mon–Sat · 9am – 6pm</p></div>
            <div className="card card-tight"><h3>Call or WhatsApp</h3><p className="muted">Mon–Sat · 8am – 8pm</p></div>
            <div className="card card-tight"><h3>Email</h3><p className="muted">hello@certifiedrefurbs.co.ke</p></div>
          </aside>
        </div>
      </section>
    </>
  )
}
