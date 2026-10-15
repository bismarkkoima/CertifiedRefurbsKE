'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DeviceArt from '@/components/DeviceArt'
import Icon from '@/components/Icon'
import ProductCard, { GradeBadge, Stars } from '@/components/ProductCard'
import { useCart, useToast, useWishlist } from '@/components/Providers'
import { CATEGORIES, GRADES, ksh, savePct } from '@/lib/format'
import { api } from '@/utils/api'

const INCLUDED = {
  phones: ['Certified device', 'USB-C / Lightning cable', 'SIM ejector', 'Inspection report'],
  laptops: ['Certified laptop', 'Original-spec charger', 'Inspection report', 'Fresh OS install'],
  tablets: ['Certified tablet', 'Charging cable', 'Inspection report'],
  accessories: ['Certified device', 'Charging cable', 'New ear tips / strap where applicable'],
}

export default function ProductClient({ slug }) {
  const router = useRouter()
  const cart = useCart()
  const wish = useWishlist()
  const toast = useToast()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [error, setError] = useState('')
  const [grade, setGrade] = useState(null)
  const [qty, setQty] = useState(1)
  const [view, setView] = useState(0)
  const [tab, setTab] = useState('specs')

  useEffect(() => {
    api.getProduct(slug).then((p) => {
      setProduct(p)
      const firstInStock = p.variants.find((v) => v.grade === 'good' && v.stock > 0) || p.variants.find((v) => v.stock > 0)
      setGrade((firstInStock || p.variants[0]).grade)
    }).catch((e) => setError(e.status === 404 ? 'notfound' : e.message))
    api.relatedProducts(slug).then(setRelated).catch(() => {})
  }, [slug])

  if (error === 'notfound') {
    return (
      <div className="container empty-state">
        <div className="big">📦</div>
        <h2>This device has sold out or moved</h2>
        <p>Browse similar devices in our shop.</p>
        <Link href="/shop" className="btn btn-primary">Back to shop</Link>
      </div>
    )
  }
  if (error) return <div className="container section"><p className="form-error">{error}</p></div>
  if (!product) {
    return (
      <div className="container pdp" style={{ paddingTop: 32 }}>
        <div className="skeleton" style={{ aspectRatio: '1/.85' }} />
        <div className="stack"><div className="skeleton" style={{ height: 40 }} /><div className="skeleton" style={{ height: 200 }} /><div className="skeleton" style={{ height: 120 }} /></div>
      </div>
    )
  }

  const variant = product.variants.find((v) => v.grade === grade) || product.variants[0]
  const save = savePct(variant.price, product.new_price)
  const saved = wish.has(product.slug)
  const cat = CATEGORIES[product.category]

  const add = (goToCart) => {
    cart.add(product, variant, qty)
    if (goToCart) router.push('/cart')
    else toast(`Added ${product.name} (${GRADES[variant.grade].label}) to cart`, { href: '/cart', label: 'View cart' })
  }

  return (
    <div className="container">
      <nav className="crumbs" style={{ paddingTop: 22 }} aria-label="Breadcrumb">
        <Link href="/">Home</Link>/<Link href="/shop">Shop</Link>/<Link href={`/shop?category=${product.category}`}>{cat?.short}</Link>/<span>{product.name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp-gallery">
          <div className="pdp-stage">
            <div className="product-tags">
              {product.deal && <span className="tag tag-deal">Deal</span>}
              <GradeBadge grade={variant.grade} />
            </div>
            <DeviceArt category={product.category} name={product.name} hue={product.hue} variant={view} />
          </div>
          <div className="pdp-thumbs">
            {[0, 1, 2, 3].map((i) => (
              <button key={i} className={`pdp-thumb ${view === i ? 'active' : ''}`} onClick={() => setView(i)} aria-label={`View ${i + 1}`}>
                <DeviceArt category={product.category} name={product.name} hue={product.hue} variant={i} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="product-brand">{product.brand} · Certified refurbished</div>
          <h1>{product.name}</h1>
          <p className="muted">{product.subtitle}</p>
          <div className="product-rating" style={{ marginTop: 10 }}>
            <Stars rating={product.rating} /> <strong>{product.rating}</strong> · {product.reviews_count.toLocaleString()} verified reviews
          </div>

          <div className="pdp-price">
            <strong>{ksh(variant.price)}</strong>
            <span className="product-was">New {ksh(product.new_price)}</span>
            {save > 0 && <span className="save-pill">You save {ksh(product.new_price - variant.price)} ({save}%)</span>}
          </div>

          <div className="pdp-section-label"><span>Condition</span><Link href="/how-it-works#grading" className="link" style={{ fontSize: 13 }}>Grading guide</Link></div>
          <div className="grade-options">
            {product.variants.map((v) => (
              <button key={v.id} className={`grade-option ${v.grade === grade ? 'active' : ''}`} disabled={v.stock === 0}
                onClick={() => { setGrade(v.grade); setQty(1) }}>
                <strong>{GRADES[v.grade].label}</strong>
                <span>{v.stock === 0 ? 'Sold out' : ksh(v.price)}</span>
              </button>
            ))}
          </div>
          <p className="subtle" style={{ marginTop: 10 }}>
            {GRADES[variant.grade].blurb} {product.category !== 'accessories' && <>Battery health {GRADES[variant.grade].battery}.</>}
          </p>

          <div className="pdp-actions" style={{ alignItems: 'center' }}>
            <div className="qty" aria-label="Quantity">
              <button onClick={() => setQty(qty - 1)} disabled={qty <= 1} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)} disabled={qty >= Math.min(5, variant.stock)} aria-label="Increase">+</button>
            </div>
            <span className={`stock-note ${variant.stock <= 4 ? 'low' : 'ok'}`}>
              {variant.stock === 0 ? 'Sold out' : variant.stock <= 4 ? `Only ${variant.stock} left in this grade` : '● In stock — ships today'}
            </span>
          </div>

          <div className="pdp-actions">
            <button className="btn btn-primary btn-lg" disabled={variant.stock === 0} onClick={() => add(false)}>
              <Icon name="cart" size={17} /> Add to cart
            </button>
            <button className="btn btn-mpesa btn-lg" disabled={variant.stock === 0} onClick={() => add(true)}>Buy now with M-Pesa</button>
            <button className={`icon-btn ${saved ? '' : ''}`} style={{ width: 50, height: 50, borderRadius: 100, color: saved ? 'var(--red)' : undefined }}
              onClick={() => { wish.toggle(product.slug); toast(saved ? 'Removed from wishlist' : '♥ Saved to wishlist') }}
              aria-label="Save to wishlist" aria-pressed={saved}>
              <Icon name="heart" fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="perks">
            <div className="perk"><Icon name="shield" /><div><strong>{product.warranty_months}-month warranty</strong><span>Free repair or replacement</span></div></div>
            <div className="perk"><Icon name="refresh" /><div><strong>30-day free returns</strong><span>No questions asked</span></div></div>
            <div className="perk"><Icon name="lock" /><div><strong>M-Pesa escrow</strong><span>Paid out only after delivery</span></div></div>
            <div className="perk"><Icon name="truck" /><div><strong>Same-day Nairobi delivery</strong><span>1–3 days countrywide</span></div></div>
          </div>

          <div className="tabs" role="tablist">
            {[['specs', 'Specifications'], ['about', 'About'], ['box', 'In the box'], ['inspection', 'Inspection']].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          {tab === 'specs' && (
            <table className="spec-table"><tbody>
              {Object.entries(product.specs).map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
              <tr><th>Storage / size</th><td>{product.storage}</td></tr>
              <tr><th>Colour</th><td>{product.color}</td></tr>
            </tbody></table>
          )}
          {tab === 'about' && <p className="muted">{product.description}</p>}
          {tab === 'box' && <ul className="stack-sm" style={{ listStyle: 'none' }}>{INCLUDED[product.category].map((i) => <li key={i}>✓ {i}</li>)}</ul>}
          {tab === 'inspection' && (
            <div className="muted stack-sm">
              <p>Every device passes our 72-point inspection before listing:</p>
              <p>✓ Display, touch & True Tone · ✓ Cameras & Face ID / fingerprint · ✓ Speakers, mics & ports · ✓ Battery health ≥ {GRADES[variant.grade].battery.replace('≥ ', '')} · ✓ Network & IMEI blacklist check · ✓ Full data wipe & factory reset</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head"><h2>You might also like</h2></div>
          <div className="products-grid">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  )
}
