'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import DeviceArt from '@/components/DeviceArt'
import Icon from '@/components/Icon'
import { useAuth, useCart } from '@/components/Providers'
import { GRADES, ksh } from '@/lib/format'
import { api } from '@/utils/api'

const DELIVERY = [
  { key: 'nairobi', title: 'Nairobi same-day delivery', sub: 'Order before 3pm · rider delivery', fee: (s) => (s >= 5000 ? 0 : 300) },
  { key: 'countrywide', title: 'Countrywide courier', sub: '1–3 business days via G4S / Wells Fargo', fee: () => 600 },
  { key: 'pickup', title: 'Pick up in Westlands', sub: 'The Mall, 2nd floor · Mon–Sat 9am–6pm', fee: () => 0 },
]

export default function CheckoutPage() {
  const router = useRouter()
  const cart = useCart()
  const { user } = useAuth()
  const [form, setForm] = useState({ customer_name: '', phone: '', email: '', address: '', city: 'Nairobi', delivery_method: 'nairobi' })
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pay, setPay] = useState(null) // { state: 'waiting'|'success'|'failed', message, simulated }
  const poll = useRef(null)

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, customer_name: f.customer_name || user.full_name, email: f.email || user.email, phone: f.phone || user.phone || '' }))
  }, [user])
  useEffect(() => () => clearInterval(poll.current), [])

  if (!cart.ready) return <div className="container section"><div className="skeleton" style={{ height: 400 }} /></div>
  if (!cart.items.length && !order) {
    return (
      <div className="container empty-state">
        <div className="big">🧾</div>
        <h2>Nothing to check out yet</h2>
        <p>Add a device to your cart first.</p>
        <Link href="/shop" className="btn btn-primary">Browse devices</Link>
      </div>
    )
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const method = DELIVERY.find((d) => d.key === form.delivery_method)
  const lines = cart.items.length ? cart.items : order.items.map((i) => ({ ...i, price: i.unit_price }))
  const subtotal = order ? order.subtotal : cart.subtotal
  const fee = order ? order.delivery_fee : method.fee(subtotal)
  const total = order ? order.total : subtotal + fee

  const startPayment = async (o) => {
    setPay({ state: 'waiting', message: `Check your phone (${form.phone}) and enter your M-Pesa PIN to pay ${ksh(o.total)}.` })
    try {
      const p = await api.stkPush(o.number, form.phone)
      setPay((s) => ({ ...s, simulated: p.simulated }))
      let tries = 0
      clearInterval(poll.current)
      poll.current = setInterval(async () => {
        tries += 1
        try {
          const s = await api.paymentStatus(p.checkout_request_id)
          if (s.status === 'success') {
            clearInterval(poll.current)
            setPay({ state: 'success', message: `Payment confirmed${s.mpesa_receipt ? ` · receipt ${s.mpesa_receipt}` : ''}. Your funds are safely held in escrow.` })
            cart.clear()
            setTimeout(() => router.push(`/orders/${o.number}?phone=${encodeURIComponent(form.phone)}`), 1600)
          } else if (s.status === 'failed' || tries > 40) {
            clearInterval(poll.current)
            setPay({ state: 'failed', message: s.result_desc || 'We didn’t receive a confirmation from M-Pesa.' })
          }
        } catch { /* keep polling */ }
      }, 2500)
    } catch (e) {
      setPay({ state: 'failed', message: e.message })
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const details = form.delivery_method === 'pickup' ? { ...form, address: 'Store pickup — The Mall, Westlands', city: 'Nairobi' } : form
      const o = order || await api.createOrder({ ...details, items: cart.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })) })
      setOrder(o)
      await startPayment(o)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container section-sm">
      <div className="steps">
        <span className="step done"><span className="step-num">✓</span>Cart</span><span className="step-line" />
        <span className={`step ${order ? 'done' : 'active'}`}><span className="step-num">{order ? '✓' : 2}</span>Details</span><span className="step-line" />
        <span className={`step ${order ? 'active' : ''}`}><span className="step-num">3</span>M-Pesa payment</span>
      </div>
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>Checkout</h1>

      <form className="panel-grid" onSubmit={submit}>
        <div className="stack">
          <section className="card">
            <h3>Contact details</h3>
            <p className="subtle" style={{ marginBottom: 16 }}>
              {user ? `Signed in as ${user.email}` : <>Checking out as a guest · <Link href="/login?next=/checkout" className="link">Sign in</Link> to track orders in your account</>}
            </p>
            <div className="form-grid">
              <div className="field full"><label htmlFor="name">Full name</label><input id="name" className="input" required minLength={2} value={form.customer_name} onChange={set('customer_name')} disabled={!!order} autoComplete="name" /></div>
              <div className="field"><label htmlFor="phone">M-Pesa phone number</label>
                <div className="input-prefix"><span>🇰🇪</span><input id="phone" className="input" required inputMode="tel" placeholder="0712 345 678" value={form.phone} onChange={set('phone')} autoComplete="tel" /></div>
                <span className="hint">We’ll send the STK push to this number</span>
              </div>
              <div className="field"><label htmlFor="email">Email</label><input id="email" className="input" type="email" required value={form.email} onChange={set('email')} disabled={!!order} autoComplete="email" /></div>
            </div>
          </section>

          <section className="card">
            <h3>Delivery</h3>
            <div className="radio-cards" style={{ margin: '14px 0 18px' }}>
              {DELIVERY.map((d) => (
                <label key={d.key} className={`radio-card ${form.delivery_method === d.key ? 'active' : ''}`}>
                  <input type="radio" name="delivery" checked={form.delivery_method === d.key} onChange={() => setForm({ ...form, delivery_method: d.key })} disabled={!!order} />
                  <span className="rc-body"><strong>{d.title}</strong><span>{d.sub}</span></span>
                  <span className="rc-price">{d.fee(subtotal) ? ksh(d.fee(subtotal)) : 'Free'}</span>
                </label>
              ))}
            </div>
            {form.delivery_method !== 'pickup' && (
              <div className="form-grid">
                <div className="field full"><label htmlFor="address">Delivery address</label><input id="address" className="input" required minLength={3} placeholder="Building, street, estate" value={form.address} onChange={set('address')} disabled={!!order} autoComplete="street-address" /></div>
                <div className="field"><label htmlFor="city">Town / city</label><input id="city" className="input" required value={form.city} onChange={set('city')} disabled={!!order} autoComplete="address-level2" /></div>
              </div>
            )}
          </section>

          <section className="card">
            <h3>Payment</h3>
            <div className="radio-card active" style={{ marginTop: 14 }}>
              <span style={{ fontSize: 26 }}>📲</span>
              <span className="rc-body"><strong>Lipa na M-Pesa (STK Push)</strong><span>You’ll get a prompt on your phone. Funds are held in escrow until you confirm delivery.</span></span>
              <span className="pay-badge mpesa">M-PESA</span>
            </div>
          </section>
        </div>

        <aside className="card sticky">
          <h3>Order summary</h3>
          <div className="divider" />
          <div className="stack-sm">
            {lines.map((i) => (
              <div className="row" key={`${i.variant_id}-${i.product_slug || i.slug}`} style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="cart-thumb" style={{ width: 52, height: 52 }}>
                    <DeviceArt category={i.category || 'phones'} name={i.name || i.product_name} hue={i.hue ?? 220} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 14 }}>{i.name || i.product_name}</strong>
                    <div className="subtle">{GRADES[i.grade]?.label} · Qty {i.quantity}</div>
                  </div>
                </div>
                <strong>{ksh(i.price * i.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="row"><span className="muted">Subtotal</span><span>{ksh(subtotal)}</span></div>
          <div className="row"><span className="muted">Delivery</span><span>{fee ? ksh(fee) : 'Free'}</span></div>
          <div className="divider" />
          <div className="row total"><span>Total</span><span>{ksh(total)}</span></div>
          {error && <p className="form-error" style={{ marginTop: 14 }}>{error}</p>}
          <button className="btn btn-mpesa btn-lg btn-block" style={{ marginTop: 18 }} disabled={busy || pay?.state === 'waiting'}>
            {busy ? <span className="spinner" /> : <Icon name="phone" size={17} />}
            {order ? 'Resend M-Pesa prompt' : `Pay ${ksh(total)} with M-Pesa`}
          </button>
          <p className="subtle" style={{ textAlign: 'center', marginTop: 12 }}><Icon name="lock" size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> Escrow protected · 30-day returns</p>
          {order && <p className="subtle" style={{ textAlign: 'center' }}>Order <strong>{order.number}</strong></p>}
        </aside>
      </form>

      {pay && (
        <div className="mpesa-modal" role="dialog" aria-modal="true" aria-labelledby="pay-title">
          <div className="mpesa-sheet">
            <div className={`phone-ring ${pay.state === 'failed' ? 'fail' : pay.state === 'success' ? 'ok' : ''}`}>
              {pay.state === 'failed' ? '✕' : pay.state === 'success' ? '✓' : '📲'}
            </div>
            <h2 id="pay-title" style={{ fontSize: 22 }}>
              {pay.state === 'waiting' ? 'Approve on your phone' : pay.state === 'success' ? 'Payment received!' : 'Payment not completed'}
            </h2>
            <p className="muted" style={{ margin: '8px 0 20px' }}>{pay.message}</p>
            {pay.state === 'waiting' && (
              <>
                <p className="subtle" style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}><span className="spinner" /> Waiting for M-Pesa confirmation…</p>
                {pay.simulated && <p className="subtle" style={{ marginTop: 10 }}>Demo mode: payment confirms automatically in a few seconds.</p>}
              </>
            )}
            {pay.state === 'failed' && (
              <div className="hero-cta" style={{ justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={() => setPay(null)}>Close</button>
                <button className="btn btn-mpesa" onClick={() => startPayment(order)} disabled={!order}>Try again</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
