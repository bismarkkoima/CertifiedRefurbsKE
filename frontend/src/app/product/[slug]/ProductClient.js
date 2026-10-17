'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ProductImage } from '@/components/DeviceArt'
import Icon from '@/components/Icon'
import ProductCard, { Stars } from '@/components/ProductCard'
import { useAuth, useCart, useCompare, useRecent, useToast, useWishlist } from '@/components/Providers'
import RecentlyViewed from '@/components/RecentlyViewed'
import Shelf from '@/components/Shelf'
import { CATEGORIES, GRADES, formatDay, ksh, savePct } from '@/lib/format'
import { api } from '@/utils/api'

const GRADE_ORDER = ['excellent', 'good', 'fair']
const VIEWS = ['pair', 'front', 'back']
const INCLUDED = {
  phones: ['Certified device', 'Charging cable', 'SIM ejector tool', 'Inspection report'],
  laptops: ['Certified laptop', 'Original-spec charger', 'Fresh OS install', 'Inspection report'],
  tablets: ['Certified tablet', 'Charging cable', 'Inspection report'],
  accessories: ['Certified device', 'Charging cable', 'New ear tips or strap where applicable', 'Sanitisation seal'],
}

function Reviews({ slug }) {
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ author_name: '', rating: 5, title: '', body: '' })
  const [state, setState] = useState({ status: 'idle' })

  const load = () => api.reviews(slug).then(setData).catch(() => setData({ items: [], count: 0, average: 0, distribution: {} }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [slug])
  useEffect(() => { if (user) setForm((f) => ({ ...f, author_name: f.author_name || user.full_name })) }, [user])

  const submit = async (e) => {
    e.preventDefault()
    setState({ status: 'loading' })
    try {
      await api.postReview(slug, form)
      setState({ status: 'idle' })
      setOpen(false)
      setForm((f) => ({ ...f, title: '', body: '', rating: 5 }))
      toast('Thanks — your review is live')
      load()
    } catch (err) {
      setState({ status: 'error', message: err.message })
    }
  }

  if (!data) return <div className="skeleton" style={{ height: 160 }} />
  const max = Math.max(1, ...Object.values(data.distribution || {}))

  return (
    <div className="reviews-layout">
      <div>
        {data.count ? (
          <>
            <div className="rating-big">{data.average.toFixed(1)}</div>
            <Stars rating={data.average} /> <span className="subtle">{data.count} review{data.count === 1 ? '' : 's'}</span>
            <div className="stack-sm" style={{ marginTop: 16 }}>
              {[5, 4, 3, 2, 1].map((n) => (
                <div className="dist-row" key={n}>
                  <span>{n} ★</span>
                  <div className="dist-bar"><div style={{ width: `${((data.distribution[n] || 0) / max) * 100}%` }} /></div>
                  <span>{data.distribution[n] || 0}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">No reviews yet. Bought this device? Be the first to share your experience.</p>
        )}
        <button className="btn btn-outline btn-sm" style={{ marginTop: 18 }} onClick={() => setOpen(!open)}>
          {open ? 'Cancel' : 'Write a review'}
        </button>
        <p className="subtle" style={{ marginTop: 10 }}>Reviews from signed-in customers with a delivered order are marked “Verified purchase”.</p>
      </div>
      <div>
        {open && (
          <form className="card stack" onSubmit={submit} style={{ marginBottom: 20 }}>
            <div className="field">
              <span className="label">Your rating</span>
              <div className="star-input" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} className={n <= form.rating ? 'on' : ''} onClick={() => setForm({ ...form, rating: n })}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-checked={form.rating === n} role="radio">★</button>
                ))}
              </div>
            </div>
            <div className="form-grid">
              <div className="field"><label htmlFor="rv-name">Name</label><input id="rv-name" className="input" required minLength={2} value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} /></div>
              <div className="field"><label htmlFor="rv-title">Title</label><input id="rv-title" className="input" required minLength={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="field full"><label htmlFor="rv-body">Review</label><textarea id="rv-body" className="textarea" required minLength={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
            </div>
            {state.status === 'error' && <p className="form-error">{state.message}</p>}
            <button className="btn btn-primary" disabled={state.status === 'loading'}>{state.status === 'loading' ? 'Posting…' : 'Post review'}</button>
          </form>
        )}
        {data.items.map((r) => (
          <article className="review-item" key={r.id}>
            <Stars rating={r.rating} /> {r.verified && <span className="verified">✓ Verified purchase</span>}
            <h4>{r.title}</h4>
            <p>{r.body}</p>
            <p className="subtle" style={{ marginTop: 6 }}>{r.author_name} · {formatDay(r.created_at)}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function Related({ slug }) {
  const [items, setItems] = useState([])
  useEffect(() => { api.relatedProducts(slug).then(setItems).catch(() => {}) }, [slug])
  if (!items.length) return null
  return <Shelf label="Related devices">{items.map((p) => <ProductCard key={p.slug} product={p} />)}</Shelf>
}

export default function ProductClient({ slug }) {
  const router = useRouter()
  const cart = useCart()
  const wish = useWishlist()
  const cmp = useCompare()
  const recent = useRecent()
  const toast = useToast()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [grade, setGrade] = useState(null)
  const [storage, setStorage] = useState(null)
  const [colorName, setColorName] = useState(null)
  const [qty, setQty] = useState(1)
  const [view, setView] = useState(0)
  const [tab, setTab] = useState('specs')

  useEffect(() => {
    api.getProduct(slug).then((p) => {
      setProduct(p)
      const inStock = p.variants.filter((v) => v.stock > 0)
      const first = inStock.find((v) => v.grade === 'good') || inStock[0] || p.variants[0]
      setGrade(first.grade)
      setStorage(first.storage)
      setColorName(p.colors[0]?.name || '')
      recent.track(p.slug)
    }).catch((e) => setError(e.status === 404 ? 'notfound' : e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const byKey = useMemo(() => {
    const m = {}
    product?.variants.forEach((v) => { m[`${v.grade}|${v.storage}`] = v })
    return m
  }, [product])

  if (error === 'notfound') {
    return (
      <div className="container empty-state">
        <div className="big">📦</div>
        <h2>This device has sold out or moved.</h2>
        <p>Browse similar devices in the store.</p>
        <Link href="/shop" className="btn btn-primary">Back to the store</Link>
      </div>
    )
  }
  if (error) return <div className="container section"><p className="form-error">{error}</p></div>
  if (!product) {
    return (
      <div className="container pdp" style={{ paddingTop: 48 }}>
        <div className="skeleton" style={{ aspectRatio: '1/.9' }} />
        <div className="stack"><div className="skeleton" style={{ height: 60 }} /><div className="skeleton" style={{ height: 240 }} /><div className="skeleton" style={{ height: 160 }} /></div>
      </div>
    )
  }

  const storages = [...new Set(product.variants.map((v) => v.storage))]
  const variant = byKey[`${grade}|${storage}`] || product.variants[0]
  const color = product.colors.find((c) => c.name === colorName) || product.colors[0]
  const save = savePct(variant.price, variant.new_price)
  const saved = wish.has(product.slug)
  const cat = CATEGORIES[product.category]
  const gradeFrom = (g) => {
    const vs = product.variants.filter((v) => v.grade === g && v.stock > 0)
    return vs.length ? Math.min(...vs.map((v) => v.price)) : null
  }
  const storageLabel = product.category === 'accessories' ? 'Size' : product.category === 'laptops' ? 'Storage (SSD)' : 'Storage'

  const chooseGrade = (g) => {
    setGrade(g)
    setQty(1)
    if (!byKey[`${g}|${storage}`]?.stock) {
      const alt = storages.find((s) => byKey[`${g}|${s}`]?.stock > 0)
      if (alt) setStorage(alt)
    }
  }
  const add = (goToBag) => {
    cart.add(product, variant, color, qty)
    if (goToBag) router.push('/cart')
    else toast(`Added to your cart: ${product.name} ${variant.storage}`, { href: '/cart', label: 'View cart' })
  }

  return (
    <>
      <div className="container">
        <div className="buy-head">
          <div>
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href="/">Store</Link>/<Link href={`/shop?category=${product.category}`}>{cat?.short}</Link>/<Link href={`/shop?brand=${encodeURIComponent(product.brand)}`}>{product.brand}</Link>
            </nav>
            {product.deal ? <span className="eyebrow" style={{ color: 'var(--red)' }}>Deal of the week</span> : <span className="eyebrow">Certified refurbished · {product.year}</span>}
            <h1>Buy {product.brand === 'Apple' || product.name.startsWith(product.brand) ? '' : `${product.brand} `}{product.name}</h1>
            {product.reviews_count > 0 && (
              <a href="#reviews" className="product-rating" style={{ textDecoration: 'none', marginTop: 8 }}>
                <Stars rating={product.rating} /> {product.rating} · {product.reviews_count} review{product.reviews_count === 1 ? '' : 's'}
              </a>
            )}
          </div>
          <div className="from">From {ksh(Math.min(...product.variants.map((v) => v.price)))} · {product.tagline}</div>
        </div>

        <div className="pdp">
          <div className="pdp-gallery">
            <div className="pdp-stage">
              <ProductImage product={product} color={color?.hex} view={VIEWS[view]} />
              <span className="stage-label">{color?.name}</span>
            </div>
            <div className="pdp-dots">
              {[0, 1, 2].map((i) => <button key={i} className={view === i ? 'active' : ''} onClick={() => setView(i)} aria-label={`Show ${VIEWS[i]} view`} />)}
            </div>
          </div>

          <div>
            <div className="step-block">
              <h2 className="step-title">Condition. <span className="grey">Which grade is right for you?</span></h2>
              <div className="option-list">
                {GRADE_ORDER.map((g) => {
                  const from = gradeFrom(g)
                  return (
                    <button key={g} className={`option ${grade === g ? 'active' : ''}`} disabled={from === null} onClick={() => chooseGrade(g)}>
                      <span>
                        <strong>{GRADES[g].label}</strong>
                        <small>{GRADES[g].blurb}{product.category !== 'accessories' && ` Battery ${GRADES[g].battery}.`}</small>
                      </span>
                      <span className="opt-price">{from === null ? 'Sold out' : `From ${ksh(from)}`}</span>
                    </button>
                  )
                })}
              </div>
              <Link href="/how-it-works#grading" className="help-link"><Icon name="chat" size={15} /> Which grade should I choose?</Link>
            </div>

            {product.colors.length > 0 && (
              <div className="step-block">
                <h2 className="step-title">Finish. <span className="grey">Pick your favourite.</span></h2>
                <p className="finish-name">{color?.name}</p>
                <div className="finish-row" role="radiogroup" aria-label="Finish">
                  {product.colors.map((c) => (
                    <button key={c.name} className={`finish ${c.name === color?.name ? 'active' : ''}`} style={{ background: c.hex }}
                      onClick={() => setColorName(c.name)} aria-label={c.name} aria-checked={c.name === color?.name} role="radio" title={c.name} />
                  ))}
                </div>
              </div>
            )}

            <div className="step-block">
              <h2 className="step-title">{storageLabel}. <span className="grey">{product.category === 'accessories' ? 'Choose your size.' : 'How much space do you need?'}</span></h2>
              <div className={`option-list ${storages.length > 2 ? 'two' : ''}`}>
                {storages.map((s) => {
                  const v = byKey[`${grade}|${s}`]
                  return (
                    <button key={s} className={`option ${storage === s ? 'active' : ''}`} disabled={!v || v.stock === 0}
                      onClick={() => { setStorage(s); setQty(1) }}>
                      <strong style={{ textTransform: 'none' }}>{s}</strong>
                      <span className="opt-price">{!v || v.stock === 0 ? 'Sold out' : ksh(v.price)}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="step-block">
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <div className="qty" aria-label="Quantity">
                  <button onClick={() => setQty(qty - 1)} disabled={qty <= 1} aria-label="Decrease">−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(qty + 1)} disabled={qty >= Math.min(5, variant.stock)} aria-label="Increase">+</button>
                </div>
                <span className={`stock-note ${variant.stock === 0 ? 'out' : variant.stock <= 2 ? 'low' : 'ok'}`}>
                  {variant.stock === 0 ? 'Sold out in this configuration' : variant.stock <= 2 ? `Only ${variant.stock} left` : '● In stock · delivers today in Nairobi'}
                </span>
              </div>
              <div className="perks" style={{ marginTop: 18 }}>
                <div className="perk"><Icon name="shield" /><div><strong>{product.warranty_months}-month warranty</strong><span>Free repair or replacement</span></div></div>
                <div className="perk"><Icon name="refresh" /><div><strong>30-day free returns</strong><span>No questions asked</span></div></div>
                <div className="perk"><Icon name="lock" /><div><strong>M-Pesa escrow</strong><span>Paid out only after delivery</span></div></div>
                <div className="perk"><Icon name="truck" /><div><strong>Free Nairobi delivery</strong><span>1–3 days countrywide</span></div></div>
              </div>
              <div className="row" style={{ marginTop: 16, justifyContent: 'flex-start', gap: 18 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { wish.toggle(product.slug); toast(saved ? 'Removed from favourites' : '♥ Saved to favourites') }}>
                  <Icon name="heart" size={15} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save for later'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  if (!cmp.toggle(product)) toast('You can compare up to 3 devices', { href: '/compare', label: 'Compare' })
                }}>
                  <Icon name="compare" size={15} /> {cmp.has(product.slug) ? 'Added to compare' : 'Compare'}
                </button>
                <Link href="/sell" className="btn btn-ghost btn-sm"><Icon name="refresh" size={15} /> Trade in your old device</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="buy-bar">
        <div className="container buy-bar-inner">
          <div className="bb-art"><ProductImage product={product} color={color?.hex} /></div>
          <div className="bb-info">
            <strong>{product.name} · {variant.storage}</strong>
            <span>{color?.name} · {GRADES[variant.grade].label}{save > 0 && ` · save ${ksh(variant.new_price - variant.price)} vs new`}</span>
          </div>
          <div className="bb-price">
            <strong>{ksh(variant.price * qty)}</strong>
            <span>Pay with M-Pesa</span>
          </div>
          <button className="btn btn-primary" disabled={variant.stock === 0} onClick={() => add(false)}>Add to cart</button>
          <button className="btn btn-mpesa hide-sm" disabled={variant.stock === 0} onClick={() => add(true)}>Buy now</button>
        </div>
      </div>

      <section className="container section">
        <div className="tabs" role="tablist">
          {[['specs', 'Tech specs'], ['about', 'Overview'], ['box', 'In the box'], ['inspection', 'Inspection']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div style={{ maxWidth: 860 }}>
          {tab === 'specs' && (
            <table className="spec-table"><tbody>
              {Object.entries(product.specs).map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
              <tr><th>{storageLabel}</th><td>{storages.join(' · ')}</td></tr>
              <tr><th>Finishes</th><td>{product.colors.map((c) => c.name).join(' · ')}</td></tr>
              <tr><th>Released</th><td>{product.year}</td></tr>
            </tbody></table>
          )}
          {tab === 'about' && <p className="muted" style={{ fontSize: 19 }}>{product.description}</p>}
          {tab === 'box' && <ul className="stack-sm" style={{ listStyle: 'none' }}>{INCLUDED[product.category].map((i) => <li key={i}>✓ {i}</li>)}</ul>}
          {tab === 'inspection' && (
            <div className="muted stack-sm">
              <p>Every device passes our 72-point inspection before it’s listed:</p>
              <p>✓ Display, touch and colour accuracy · ✓ Cameras, Face ID / fingerprint · ✓ Speakers, microphones and ports · ✓ Battery health {GRADES[variant.grade].battery} · ✓ Network, Wi-Fi and Bluetooth · ✓ IMEI blacklist check · ✓ Full data wipe and factory reset</p>
            </div>
          )}
        </div>
      </section>

      <section className="container section" id="reviews" style={{ paddingTop: 0 }}>
        <div className="section-head"><h2>Customer reviews.</h2></div>
        <Reviews slug={product.slug} />
      </section>

      <section className="section-sm">
        <div className="container section-head">
          <h2>You might also like.</h2>
          <Link href={`/compare?add=${product.slug}`} className="link link-arrow">Compare with others</Link>
        </div>
        <Related slug={product.slug} />
      </section>
      <RecentlyViewed exclude={product.slug} />
    </>
  )
}
