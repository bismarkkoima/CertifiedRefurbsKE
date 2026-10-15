'use client'

import Link from 'next/link'
import { ProductImage } from '@/components/DeviceArt'
import { GradeBadge } from '@/components/ProductCard'
import ProductRail from '@/components/ProductRail'
import { useCart } from '@/components/Providers'
import { ksh } from '@/lib/format'

const FREE_AT = 5000
const art = (i) => ({ slug: i.slug, name: i.name, brand: i.brand, category: i.category, hue: i.hue, image_url: i.image_url, colors: [] })

export default function BagPage() {
  const { items, ready, update, remove, subtotal, savings, count } = useCart()

  if (!ready) return <div className="container section"><div className="skeleton" style={{ height: 300 }} /></div>

  if (!items.length) {
    return (
      <>
        <div className="container bag-head">
          <h1>Your bag is empty.</h1>
          <p>Certified devices from 22 brands, up to 50% less than new.</p>
          <Link href="/" className="btn btn-primary">Continue shopping</Link>
        </div>
        <section className="section-sm">
          <div className="container section-head"><h2>Popular right now.</h2></div>
          <ProductRail params={{ featured: true }} count={10} label="Popular" />
        </section>
      </>
    )
  }

  const toFree = Math.max(FREE_AT - subtotal, 0)

  return (
    <div className="container">
      <div className="bag-head">
        <h1>Your bag total is {ksh(subtotal)}.</h1>
        <p>Free delivery in Nairobi{toFree ? ` on orders over ${ksh(FREE_AT)}` : ''}. Pay with M-Pesa — held in escrow until delivery.</p>
        <Link href="/checkout" className="btn btn-primary btn-lg" style={{ minWidth: 240 }}>Check Out</Link>
      </div>

      <div style={{ borderTop: '1px solid var(--border-lt)' }}>
        {items.map((i) => (
          <div className="cart-item" key={i.key}>
            <Link href={`/product/${i.slug}`} className="cart-thumb"><ProductImage product={art(i)} color={i.colorHex} /></Link>
            <div>
              <h4><Link href={`/product/${i.slug}`} style={{ textDecoration: 'none' }}>{i.brand === 'Apple' ? '' : `${i.brand} `}{i.name}</Link></h4>
              <p className="muted" style={{ margin: '4px 0 10px' }}>{i.storage}{i.color && ` · ${i.color}`} · <GradeBadge grade={i.grade} /></p>
              <div className="row" style={{ justifyContent: 'flex-start', gap: 18 }}>
                <div className="qty">
                  <button onClick={() => update(i.key, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Decrease">−</button>
                  <span>{i.quantity}</span>
                  <button onClick={() => update(i.key, i.quantity + 1)} disabled={i.quantity >= Math.min(5, i.stock)} aria-label="Increase">+</button>
                </div>
              </div>
              <button className="remove" onClick={() => remove(i.key)}>Remove</button>
            </div>
            <div className="cart-line-price">
              {ksh(i.price * i.quantity)}
              {i.new_price > i.price && <div className="subtle" style={{ fontWeight: 400 }}>{ksh(i.new_price * i.quantity)} new</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="bag-summary">
        <div className="row"><span className="muted">Subtotal ({count} item{count === 1 ? '' : 's'})</span><span>{ksh(subtotal)}</span></div>
        <div className="row"><span className="muted">Delivery</span><span>{toFree ? 'Calculated at checkout' : 'FREE in Nairobi'}</span></div>
        {savings > 0 && <div className="row" style={{ color: 'var(--green)' }}><span>You save vs. new</span><span>{ksh(savings)}</span></div>}
        <div className="divider" />
        <div className="row total"><span>Total</span><span>{ksh(subtotal)}</span></div>
        <p className="subtle" style={{ marginTop: 10 }}>Have a promo code? Add it at checkout.</p>
        <Link href="/checkout" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 22 }}>Check Out</Link>
      </div>
    </div>
  )
}
