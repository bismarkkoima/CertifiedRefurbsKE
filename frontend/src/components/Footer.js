'use client'

import Link from 'next/link'
import { useState } from 'react'
import { api } from '@/utils/api'

const COLS = [
  ['Shop', [['/shop?category=phones', 'Smartphones'], ['/shop?category=laptops', 'Laptops'], ['/shop?category=tablets', 'Tablets'], ['/shop?category=accessories', 'Wearables & audio'], ['/shop?deal=true', 'Deals of the week']]],
  ['Services', [['/import', 'Import for me'], ['/sell', 'Sell / trade in'], ['/track', 'Track your order'], ['/how-it-works#escrow', 'M-Pesa escrow']]],
  ['Help', [['/warranty', 'Warranty & returns'], ['/how-it-works#grading', 'Our grading system'], ['/how-it-works#faq', 'FAQs'], ['/contact', 'Contact us']]],
  ['Company', [['/about', 'About us'], ['/about#impact', 'Our impact'], ['/contact', 'Partner with us'], ['/account', 'My account']]],
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ status: 'idle', message: '' })

  const subscribe = async (e) => {
    e.preventDefault()
    setState({ status: 'loading', message: '' })
    try {
      const res = await api.newsletter(email)
      setState({ status: 'ok', message: res.message })
      setEmail('')
    } catch (err) {
      setState({ status: 'error', message: err.message })
    }
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="newsletter">
          <div>
            <h3>Get the week’s best deals first</h3>
            <p className="muted">New stock drops every Friday. No spam — unsubscribe any time.</p>
          </div>
          <div>
            <form onSubmit={subscribe}>
              <label htmlFor="nl-email" className="sr-only">Email address</label>
              <input id="nl-email" className="input" type="email" required placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn btn-primary" disabled={state.status === 'loading'}>
                {state.status === 'loading' ? 'Joining…' : 'Subscribe'}
              </button>
            </form>
            {state.message && (
              <p className={state.status === 'ok' ? 'form-success' : 'form-error'} style={{ marginTop: 10 }}>{state.message}</p>
            )}
          </div>
        </div>

        <div className="footer-inner">
          <div className="footer-brand">
            <Link href="/" className="nav-logo"><span className="nav-logo-mark">✓</span><span>Certified<span className="dot">.</span>Refurbs KE</span></Link>
            <p>Kenya’s trusted home for certified refurbished phones, laptops and tablets — inspected by engineers, backed by warranty, paid safely through M-Pesa escrow.</p>
            <div className="pay-badges">
              <span className="pay-badge mpesa">M-PESA</span>
              <span className="pay-badge">Escrow protected</span>
              <span className="pay-badge">6-mo warranty</span>
            </div>
          </div>
          {COLS.map(([title, links]) => (
            <div className="footer-col" key={title}>
              <h4>{title}</h4>
              {links.map(([href, label]) => <Link key={label} href={href}>{label}</Link>)}
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} CertifiedRefurbs KE · Westlands, Nairobi</span>
          <span>
            <Link href="/warranty">Warranty</Link>
            <Link href="/about">Privacy</Link>
            <Link href="/about">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
