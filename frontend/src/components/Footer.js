'use client'

import Link from 'next/link'
import { useState } from 'react'
import { api } from '@/utils/api'

const COLS = [
  ['Shop and Learn', [['/shop?category=phones', 'Phones'], ['/shop?category=laptops', 'Laptops'], ['/shop?category=tablets', 'Tablets'], ['/shop?category=accessories', 'Wearables & Audio'], ['/brands', 'All brands'], ['/shop?deal=true', 'Deals']]],
  ['Popular brands', [['/brand/apple', 'Apple'], ['/brand/samsung', 'Samsung'], ['/brand/tecno', 'Tecno'], ['/brand/infinix', 'Infinix'], ['/brand/xiaomi', 'Xiaomi'], ['/brand/google', 'Google Pixel']]],
  ['Services', [['/sell', 'Trade In'], ['/import', 'Import for me'], ['/compare', 'Compare devices'], ['/how-it-works#escrow', 'M-Pesa escrow']]],
  ['Account', [['/account', 'Manage your account'], ['/track', 'Order status'], ['/wishlist', 'Favourites'], ['/cart', 'Bag']]],
  ['About CertifiedRefurbs', [['/about', 'About us'], ['/how-it-works#grading', 'Grading guide'], ['/warranty', 'Warranty & returns'], ['/how-it-works#faq', 'Help & FAQs'], ['/contact', 'Contact us']]],
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
        <div className="footer-note">
          <p>Prices include VAT. “New” prices are typical Kenyan retail prices for the same model brand-new and are shown for comparison. Battery health thresholds are guaranteed at the time of delivery. Escrow funds are released to the seller only after you confirm delivery.</p>
          <p>CertifiedRefurbs KE is an independent reseller of refurbished devices and is not affiliated with, sponsored or endorsed by any manufacturer. Apple, iPhone, iPad, Mac, Samsung, Galaxy, Google, Pixel, Tecno, Infinix and all other product names are trademarks of their respective owners.</p>
        </div>
        <div className="newsletter">
          <div>
            <h3>Get the week’s best deals first.</h3>
            <p>New stock drops every Friday. Unsubscribe any time.</p>
          </div>
          <div>
            <form onSubmit={subscribe}>
              <label htmlFor="nl-email" className="sr-only">Email address</label>
              <input id="nl-email" className="input" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn btn-primary btn-sm" disabled={state.status === 'loading'}>{state.status === 'loading' ? 'Joining…' : 'Subscribe'}</button>
            </form>
            {state.message && <p className={state.status === 'ok' ? 'form-success' : 'form-error'} style={{ marginTop: 10 }}>{state.message}</p>}
          </div>
        </div>
        <div className="footer-inner">
          {COLS.map(([title, links]) => (
            <div className="footer-col" key={title}>
              <h4>{title}</h4>
              {links.map(([href, label]) => <Link key={label} href={href}>{label}</Link>)}
            </div>
          ))}
        </div>
        <p style={{ paddingBottom: 12 }}>
          More ways to shop: visit our store at The Mall, Westlands, or <Link href="/contact" className="link">contact us</Link>. Pay with M-Pesa.
        </p>
        <div className="footer-bottom">
          <span>Copyright © {new Date().getFullYear()} CertifiedRefurbs KE. All rights reserved.</span>
          <span>
            <Link href="/about">Privacy Policy</Link>
            <Link href="/warranty">Terms of Sale</Link>
            <Link href="/warranty">Warranty</Link>
            <span style={{ marginLeft: 14 }}>Kenya</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
