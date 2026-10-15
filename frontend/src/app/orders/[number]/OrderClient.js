'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAuth, useToast } from '@/components/Providers'
import { GRADES, ORDER_STATUS, formatDate, ksh } from '@/lib/format'
import { api } from '@/utils/api'

const FLOW = ['pending_payment', 'paid', 'processing', 'shipped', 'completed']
const FLOW_LABELS = ['Placed', 'Paid', 'Quality check', 'On the way', 'Completed']
const ESCROW = {
  awaiting_funds: ['Awaiting payment', 'Complete your M-Pesa payment to start your order.'],
  held: ['Held in escrow', 'Your money is protected. It’s released to the seller only after you confirm delivery.'],
  released: ['Released to seller', 'You confirmed delivery — thanks for shopping with us!'],
  refunded: ['Refunded', 'Your payment has been returned to your M-Pesa.'],
}

export default function OrderClient({ number }) {
  const phone = useSearchParams().get('phone') || ''
  const { loading: authLoading } = useAuth()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => api.getOrder(number, phone).then(setOrder)
    .catch((e) => setError(e.status === 404 ? 'notfound' : e.message)), [number, phone])

  useEffect(() => { if (!authLoading) load() }, [authLoading, load])
  useEffect(() => {
    if (!order || ['completed', 'cancelled'].includes(order.status)) return
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [order, load])

  const confirm = async () => {
    setBusy(true)
    try {
      setOrder(await api.confirmDelivery(number, phone))
      toast('✓ Delivery confirmed — escrow released')
    } catch (e) {
      toast(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (error === 'notfound') {
    return (
      <div className="container empty-state">
        <div className="big">🔎</div>
        <h2>We couldn’t find that order</h2>
        <p>Check the order number and the phone number you used at checkout.</p>
        <Link href="/track" className="btn btn-primary">Track an order</Link>
      </div>
    )
  }
  if (error) return <div className="container section"><p className="form-error">{error}</p></div>
  if (!order) return <div className="container section"><div className="skeleton" style={{ height: 420 }} /></div>

  const step = order.status === 'delivered' ? 3 : Math.max(FLOW.indexOf(order.status), 0)
  const [escrowTitle, escrowText] = ESCROW[order.escrow_status]
  const tone = order.status === 'completed' ? 'green' : order.status === 'pending_payment' ? 'amber' : ''
  const canConfirm = order.escrow_status === 'held' && ['shipped', 'delivered'].includes(order.status)

  return (
    <div className="container section-sm">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link>/<Link href="/track">Orders</Link>/<span>{order.number}</span></nav>
      <div className={`status-banner ${tone}`}>
        <div className="icon">{order.status === 'completed' ? '✓' : order.status === 'pending_payment' ? '⏳' : order.status === 'cancelled' ? '✕' : '📦'}</div>
        <div>
          <p className="subtle">Order {order.number} · placed {formatDate(order.created_at)}</p>
          <h2>{ORDER_STATUS[order.status]}</h2>
        </div>
      </div>

      {order.status !== 'cancelled' && (
        <div className="progress-track" aria-label="Order progress">
          {FLOW_LABELS.map((l, i) => <div key={l} className={i <= step ? 'on' : ''}>{l}</div>)}
        </div>
      )}

      <div className="panel-grid">
        <div className="stack">
          <section className="card">
            <h3>Order timeline</h3>
            <div className="divider" />
            <ol className="timeline">
              {order.events.map((e, i) => (
                <li key={i}>
                  <strong>{e.title}</strong>
                  {e.detail && <p>{e.detail}</p>}
                  <time>{formatDate(e.created_at)}</time>
                </li>
              ))}
            </ol>
          </section>

          <section className="card">
            <h3>Items</h3>
            <div className="divider" />
            {order.items.map((i) => (
              <div className="row" key={i.product_slug + i.grade}>
                <div>
                  <Link href={`/product/${i.product_slug}`} style={{ fontWeight: 600, textDecoration: 'none' }}>{i.product_name}</Link>
                  <div className="subtle">{GRADES[i.grade]?.label} · Qty {i.quantity}</div>
                </div>
                <strong>{ksh(i.unit_price * i.quantity)}</strong>
              </div>
            ))}
            <div className="divider" />
            <div className="row"><span className="muted">Subtotal</span><span>{ksh(order.subtotal)}</span></div>
            <div className="row"><span className="muted">Delivery</span><span>{order.delivery_fee ? ksh(order.delivery_fee) : 'Free'}</span></div>
            <div className="row total"><span>Total</span><span>{ksh(order.total)}</span></div>
          </section>
        </div>

        <aside className="stack sticky">
          <div className="escrow-card">
            <span className="escrow-state">🔒 {escrowTitle}</span>
            <div className="escrow-amount">{ksh(order.total)}</div>
            <p>{escrowText}</p>
            {canConfirm && (
              <button className="btn btn-white btn-block" style={{ marginTop: 16 }} onClick={confirm} disabled={busy}>
                {busy ? 'Confirming…' : 'I’ve received my order — release funds'}
              </button>
            )}
          </div>
          <section className="card card-tight">
            <h3>Delivery details</h3>
            <p className="muted" style={{ marginTop: 6 }}>{order.customer_name}<br />{order.address}, {order.city}<br />{order.phone}</p>
          </section>
          <section className="card card-tight">
            <h3>Need help?</h3>
            <p className="muted" style={{ marginTop: 6 }}>Something not right? Don’t confirm delivery — <Link href="/contact" className="link">contact us</Link> and your escrow funds stay protected.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
