'use client'

import { useMemo, useState } from 'react'
import DeviceArt from '@/components/DeviceArt'
import Icon from '@/components/Icon'
import { importQuote } from '@/lib/catalog'
import { ksh } from '@/lib/format'
import { api } from '@/utils/api'

const CATS = [['phones', 'Phone', 225], ['laptops', 'Laptop', 215], ['tablets', 'Tablet', 205], ['accessories', 'Accessory', 240]]

export default function ImportPage() {
  const [price, setPrice] = useState(650)
  const [category, setCategory] = useState('phones')
  const [shipping, setShipping] = useState(0)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', item_url: '', item_description: '' })
  const [state, setState] = useState({ status: 'idle' })
  const quote = useMemo(() => importQuote(Number(price) || 0, category, Number(shipping) || 0), [price, category, shipping])
  const local = Math.round(quote.total * 1.18 / 100) * 100

  const submit = async (e) => {
    e.preventDefault()
    setState({ status: 'loading' })
    try {
      const res = await api.importRequest({ ...form, item_price_usd: Number(price), category, shipping_usd: Number(shipping) || 0 })
      setState({ status: 'ok', res })
    } catch (err) {
      setState({ status: 'error', message: err.message })
    }
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow"><Icon name="globe" size={14} /> Import for me</span>
          <h1>Buy from the US, UK or Dubai. We’ll land it in Nairobi.</h1>
          <p>See the true landed cost — freight, KRA duty, VAT and levies — before you spend a shilling. We buy, inspect, ship and clear customs for you.</p>
        </div>
      </section>

      <section className="container section-sm">
        <div className="calc">
          <div className="stack">
            <div className="card">
              <div className="wizard-step"><b>1</b> What are you importing?</div>
              <div className="option-grid">
                {CATS.map(([key, label, hue]) => (
                  <button key={key} type="button" className={`option-tile ${category === key ? 'active' : ''}`} onClick={() => setCategory(key)}>
                    <DeviceArt category={key} name={key === 'accessories' ? 'Watch' : label} hue={hue} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="wizard-step"><b>2</b> Item price</div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="usd">Price (USD)</label>
                  <div className="input-prefix"><span>$</span><input id="usd" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))} /></div>
                </div>
                <div className="field">
                  <label htmlFor="ship">Seller’s shipping to our hub (USD)</label>
                  <div className="input-prefix"><span>$</span><input id="ship" className="input" inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value.replace(/[^\d.]/g, ''))} /></div>
                </div>
                <div className="field full">
                  <input type="range" min="50" max="3000" step="10" value={Number(price) || 0} onChange={(e) => setPrice(e.target.value)} aria-label="Price slider" />
                  <span className="hint">Exchange rate used: 1 USD = KSh {quote.exchange_rate}</span>
                </div>
              </div>
            </div>

            <form className="card" onSubmit={submit}>
              <div className="wizard-step"><b>3</b> Request this import</div>
              {state.status === 'ok' ? (
                <div className="form-success">
                  <strong>Request received — reference {state.res.reference}.</strong><br />
                  Our import desk will confirm availability and send an M-Pesa payment link within 2 business hours.
                </div>
              ) : (
                <div className="form-grid">
                  <div className="field full"><label htmlFor="desc">Item</label><input id="desc" className="input" required minLength={2} placeholder="e.g. Pixel 8 Pro 256GB, Bay" value={form.item_description} onChange={set('item_description')} /></div>
                  <div className="field full"><label htmlFor="url">Link to the listing (optional)</label><input id="url" className="input" type="url" placeholder="https://" value={form.item_url} onChange={set('item_url')} /></div>
                  <div className="field"><label htmlFor="fn">Full name</label><input id="fn" className="input" required minLength={2} value={form.full_name} onChange={set('full_name')} /></div>
                  <div className="field"><label htmlFor="ph">Phone</label><input id="ph" className="input" required inputMode="tel" placeholder="0712 345 678" value={form.phone} onChange={set('phone')} /></div>
                  <div className="field full"><label htmlFor="em">Email</label><input id="em" className="input" type="email" required value={form.email} onChange={set('email')} /></div>
                  {state.status === 'error' && <p className="form-error full">{state.message}</p>}
                  <button className="btn btn-primary btn-lg full" disabled={state.status === 'loading' || !(Number(price) > 0)}>
                    {state.status === 'loading' ? 'Sending…' : `Request import · ${ksh(quote.total)}`}
                  </button>
                </div>
              )}
            </form>
          </div>

          <aside className="quote-card sticky" aria-live="polite">
            <div className="quote-head">
              <span className="subtle">Estimated landed cost · {quote.category_label}</span>
              <div className="quote-total">{ksh(quote.total)}</div>
              <span className="subtle">Delivered to your door in {quote.eta_days} days</span>
            </div>
            <div className="quote-body">
              {quote.lines.map((l) => <div className="quote-line" key={l.label}><span>{l.label}</span><strong>{ksh(l.amount)}</strong></div>)}
              <div className="divider" />
              <div className="quote-line"><span>Total taxes & levies</span><strong>{ksh(quote.total_taxes)}</strong></div>
              <div className="compare">
                <div><span className="subtle">Typical Nairobi retail (est.)</span><strong>{ksh(local)}</strong></div>
                <div style={{ background: 'var(--green-lt)', color: 'var(--green)' }}><span>You could save</span><strong>{ksh(Math.max(local - quote.total, 0))}</strong></div>
              </div>
              <p className="subtle" style={{ marginTop: 14 }}>Indicative KRA rates applied on CIF value. Final duty is assessed by KRA at clearance; we refund any difference.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="container section-sm">
        <div className="steps-grid">
          {[
            ['Send us the link', 'Share any listing from Amazon, eBay, Back Market, Swappa or a Dubai store.'],
            ['Pay into escrow', 'Pay the quoted amount via M-Pesa. It’s held until your device lands.'],
            ['We inspect & ship', 'Our partner hub checks the device before air-freighting it to JKIA.'],
            ['Cleared & delivered', 'We handle KRA clearance and deliver to your door, warranty included.'],
          ].map(([t, d]) => <div className="step-card" key={t}><h3>{t}</h3><p>{d}</p></div>)}
        </div>
      </section>
    </>
  )
}
