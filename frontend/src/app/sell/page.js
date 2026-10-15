'use client'

import { useMemo, useState } from 'react'
import DeviceArt from '@/components/DeviceArt'
import Icon from '@/components/Icon'
import { tradeInQuote } from '@/lib/catalog'
import { ksh } from '@/lib/format'
import { api } from '@/utils/api'

const CATS = [['phones', 'Phone', 160], ['laptops', 'Laptop', 215], ['tablets', 'Tablet', 205], ['accessories', 'Watch / audio', 240]]
const BRANDS = { phones: ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Other'], laptops: ['Apple', 'Dell', 'HP', 'Lenovo', 'Other'], tablets: ['Apple', 'Samsung', 'Other'], accessories: ['Apple', 'Samsung', 'Other'] }
const STORAGE = ['64GB', '128GB', '256GB', '512GB', '1TB']
const CONDITIONS = [
  ['like_new', 'Like new', 'No scratches, everything works, battery healthy'],
  ['good', 'Good', 'Light scratches, everything works'],
  ['worn', 'Worn', 'Visible scratches or dents, fully working'],
  ['broken', 'Broken', 'Cracked screen, faulty parts or won’t turn on'],
]

export default function SellPage() {
  const [d, setD] = useState({ category: 'phones', brand: 'Apple', model: 'iPhone 12', storage: '128GB', condition: 'good' })
  const [contact, setContact] = useState({ full_name: '', phone: '', email: '' })
  const [state, setState] = useState({ status: 'idle' })
  const quote = useMemo(() => (d.model.trim() ? tradeInQuote(d) : 0), [d])

  const submit = async (e) => {
    e.preventDefault()
    setState({ status: 'loading' })
    try {
      setState({ status: 'ok', res: await api.tradeInRequest({ ...d, ...contact }) })
    } catch (err) {
      setState({ status: 'error', message: err.message })
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow"><Icon name="tag" size={14} /> Sell or trade in</span>
          <h1>Turn your old device into M-Pesa cash — today.</h1>
          <p>Instant quote, free pickup in Nairobi, a certified data wipe and payment sent straight to your phone.</p>
        </div>
      </section>

      <section className="container section-sm">
        <div className="calc">
          <form className="stack" onSubmit={submit}>
            <div className="card">
              <div className="wizard-step"><b>1</b> Device type</div>
              <div className="option-grid">
                {CATS.map(([key, label, hue]) => (
                  <button key={key} type="button" className={`option-tile ${d.category === key ? 'active' : ''}`}
                    onClick={() => setD({ ...d, category: key, brand: BRANDS[key][0], model: '' })}>
                    <DeviceArt category={key} name={key === 'accessories' ? 'Watch' : label} hue={hue} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="wizard-step"><b>2</b> Which model?</div>
              <div className="form-grid">
                <div className="field"><label htmlFor="brand">Brand</label>
                  <select id="brand" className="select" value={d.brand} onChange={(e) => setD({ ...d, brand: e.target.value })}>
                    {BRANDS[d.category].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="field"><label htmlFor="model">Model</label>
                  <input id="model" className="input" required placeholder="e.g. iPhone 12 Pro, Galaxy S21" value={d.model} onChange={(e) => setD({ ...d, model: e.target.value })} />
                </div>
                <div className="field full"><span className="label">Storage</span>
                  <div className="pill-row">{STORAGE.map((s) => <button type="button" key={s} className={`pill ${d.storage === s ? 'active' : ''}`} onClick={() => setD({ ...d, storage: s })}>{s}</button>)}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="wizard-step"><b>3</b> Condition</div>
              <div className="radio-cards">
                {CONDITIONS.map(([key, title, sub]) => (
                  <label key={key} className={`radio-card ${d.condition === key ? 'active' : ''}`}>
                    <input type="radio" name="cond" checked={d.condition === key} onChange={() => setD({ ...d, condition: key })} />
                    <span className="rc-body"><strong>{title}</strong><span>{sub}</span></span>
                  </label>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="wizard-step"><b>4</b> Lock in your quote</div>
              {state.status === 'ok' ? (
                <div className="form-success">
                  <strong>Quote locked — reference {state.res.reference} for {ksh(state.res.quoted_price)}.</strong><br />
                  We’ll call you within the hour to book a free pickup. Payment goes to your M-Pesa after a 10-minute check.
                </div>
              ) : (
                <div className="form-grid">
                  <div className="field full"><label htmlFor="fn">Full name</label><input id="fn" className="input" required minLength={2} value={contact.full_name} onChange={(e) => setContact({ ...contact, full_name: e.target.value })} /></div>
                  <div className="field"><label htmlFor="ph">M-Pesa phone</label><input id="ph" className="input" required inputMode="tel" placeholder="0712 345 678" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></div>
                  <div className="field"><label htmlFor="em">Email</label><input id="em" className="input" type="email" required value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
                  {state.status === 'error' && <p className="form-error full">{state.message}</p>}
                  <button className="btn btn-mpesa btn-lg full" disabled={state.status === 'loading' || !quote}>
                    {state.status === 'loading' ? 'Locking quote…' : `Get ${ksh(quote)} to M-Pesa`}
                  </button>
                </div>
              )}
            </div>
          </form>

          <aside className="quote-card sticky" aria-live="polite">
            <div className="quote-head">
              <span className="subtle">Your instant quote</span>
              <div className="quote-total">{quote ? ksh(quote) : '—'}</div>
              <span className="subtle">Valid for 7 days · paid via M-Pesa</span>
            </div>
            <div className="quote-body">
              <div className="quote-line"><span>Device</span><strong>{d.brand} {d.model || '—'}</strong></div>
              <div className="quote-line"><span>Storage</span><strong>{d.storage}</strong></div>
              <div className="quote-line"><span>Condition</span><strong>{CONDITIONS.find((c) => c[0] === d.condition)[1]}</strong></div>
              <div className="divider" />
              <div className="stack-sm subtle">
                <span>✓ Free pickup in Nairobi, free drop-off countrywide</span>
                <span>✓ Certified data wipe with certificate</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
