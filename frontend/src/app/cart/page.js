'use client'

import Link from 'next/link'
import DeviceArt from '@/components/DeviceArt'
import Icon from '@/components/Icon'
import { GradeBadge } from '@/components/ProductCard'
import { useCart } from '@/components/Providers'
import ProductRail from '@/components/ProductRail'
import { ksh } from '@/lib/format'

const FREE_AT = 5000

export default function CartPage() {
  const { items, ready, update, remove, subtotal, savings, count } = useCart()

  if (!ready) return <div className="container section"><div className="skeleton" style={{ height: 300 }} /></div>

  if (!items.length) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="big">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Certified devices, up to 40% cheaper than new. Let’s find you something great.</p>
          <Link href="/shop" className="btn btn-primary btn-lg">Start shopping</Link>
        </div>
        <section className="section-sm">
          <div className="section-head"><h2>Popular right now</h2></div>
          <ProductRail params={{ featured: true }} count={4} />
        </section>
      </div>
    )
  }

  const toFree = Math.max(FREE_AT - subtotal, 0)

  return (
    <div className="container section-sm">
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>Your cart <span className="muted" style={{ fontSize: 18 }}>({count})</span></h1>
      <div className="panel-grid">
        <div className="card">
          {items.map((i) => (
            <div className="cart-item" key={i.variant_id}>
              <Link href={`/product/${i.slug}`} className="cart-thumb"><DeviceArt category={i.category} name={i.name} hue={i.hue} /></Link>
              <div>
                <div className="product-brand">{i.brand}</div>
                <h4><Link href={`/product/${i.slug}`} style={{ textDecoration: 'none' }}>{i.name}</Link></h4>
                <div className="subtle" style={{ margin: '2px 0 8px' }}>{i.subtitle} · <GradeBadge grade={i.grade} /></div>
                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  <div className="qty">
                    <button onClick={() => update(i.variant_id, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Decrease">−</button>
                    <span>{i.quantity}</span>
                    <button onClick={() => update(i.variant_id, i.quantity + 1)} disabled={i.quantity >= Math.min(5, i.stock)} aria-label="Increase">+</button>
                  </div>
                  <button className="remove" onClick={() => remove(i.variant_id)}>Remove</button>
                </div>
              </div>
              <div className="cart-line-price">
                {ksh(i.price * i.quantity)}
                {i.quantity > 1 && <div className="subtle">{ksh(i.price)} each</div>}
              </div>
            </div>
          ))}
        </div>

        <aside className="card sticky">
          <h3>Order summary</h3>
          <div className="divider" />
          <div className="row"><span className="muted">Subtotal</span><strong>{ksh(subtotal)}</strong></div>
          <div className="row"><span className="muted">Delivery</span><span>{toFree ? 'From KSh 300' : 'Free in Nairobi'}</span></div>
          {savings > 0 && <div className="row" style={{ color: 'var(--green)' }}><span>You save vs new</span><strong>{ksh(savings)}</strong></div>}
          <div className="divider" />
          <div className="row total"><span>Total</span><span>{ksh(subtotal)}</span></div>
          {toFree > 0 ? (
            <div style={{ marginTop: 12 }}>
              <p className="subtle">Add {ksh(toFree)} more for free Nairobi delivery</p>
              <div className="progress-free"><div style={{ width: `${(subtotal / FREE_AT) * 100}%` }} /></div>
            </div>
          ) : <p className="form-success" style={{ marginTop: 12 }}>🎉 You’ve unlocked free Nairobi delivery</p>}
          <Link href="/checkout" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }}>
            <Icon name="lock" size={16} /> Secure checkout
          </Link>
          <p className="subtle" style={{ textAlign: 'center', marginTop: 12 }}>Pay with M-Pesa · held in escrow until delivery</p>
        </aside>
      </div>
    </div>
  )
}
