'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth, useToast } from '@/components/Providers'
import { CATEGORIES, GRADES, ORDER_STATUS, formatDate, ksh } from '@/lib/format'
import { api } from '@/utils/api'

const NEXT = { paid: 'processing', processing: 'shipped', shipped: 'delivered' }

function Orders({ stats, reload }) {
  const toast = useToast()
  const advance = async (o, status) => {
    try {
      await api.adminUpdateOrder(o.number, status)
      toast(`${o.number} → ${ORDER_STATUS[status]}`)
      reload()
    } catch (e) {
      toast(e.message)
    }
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Total</th><th>Status</th><th>Escrow</th><th>Actions</th></tr></thead>
        <tbody>
          {stats.recent_orders.length === 0 && <tr><td colSpan={7} className="muted">No orders yet.</td></tr>}
          {stats.recent_orders.map((o) => (
            <tr key={o.number}>
              <td><Link href={`/orders/${o.number}`} className="link">{o.number}</Link>{o.coupon_code && <div className="subtle">{o.coupon_code}</div>}</td>
              <td>{o.customer_name}<div className="subtle">{o.phone}</div></td>
              <td>{formatDate(o.created_at)}</td>
              <td>{ksh(o.total)}</td>
              <td><span className={`status-pill ${o.status}`}>{ORDER_STATUS[o.status]}</span></td>
              <td><span className={`status-pill ${o.escrow_status}`}>{o.escrow_status.replace('_', ' ')}</span></td>
              <td style={{ display: 'flex', gap: 6 }}>
                {NEXT[o.status] && <button className="btn btn-primary btn-sm" onClick={() => advance(o, NEXT[o.status])}>Mark {ORDER_STATUS[NEXT[o.status]].toLowerCase()}</button>}
                {!['completed', 'cancelled'].includes(o.status) && <button className="btn btn-ghost btn-sm" onClick={() => advance(o, 'cancelled')}>Cancel</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VariantRow({ v, onSaved }) {
  const toast = useToast()
  const [price, setPrice] = useState(v.price)
  const [stock, setStock] = useState(v.stock)
  const dirty = Number(price) !== v.price || Number(stock) !== v.stock
  const save = async () => {
    try {
      onSaved(await api.adminUpdateVariant(v.id, { price: Number(price), stock: Number(stock) }))
      toast('Variant updated')
    } catch (e) {
      toast(e.message)
    }
  }
  return (
    <tr>
      <td style={{ paddingLeft: 40 }}>{v.storage}</td>
      <td><span className={`grade grade-${v.grade}`}>{GRADES[v.grade].label}</span></td>
      <td><input className="input input-sm" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} aria-label="Price" /></td>
      <td><input className="input input-sm" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ''))} aria-label="Stock" /></td>
      <td>{dirty && <button className="btn btn-primary btn-sm" onClick={save}>Save</button>}</td>
    </tr>
  )
}

const EMPTY = { name: '', brand: '', category: 'phones', year: new Date().getFullYear(), tagline: '', subtitle: '', description: '', price: '', new_price: '', storages: '128GB, 256GB', colors: 'Black:#1f2023, White:#f2f2f0', stock: 2, image_url: '', specs: '' }

function NewProduct({ onCreated }) {
  const toast = useToast()
  const [f, setF] = useState(EMPTY)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const body = {
        ...f, year: Number(f.year), price: Number(f.price), new_price: Number(f.new_price), stock: Number(f.stock),
        image_url: f.image_url || null,
        storages: f.storages.split(',').map((s) => s.trim()).filter(Boolean),
        colors: f.colors.split(',').map((c) => c.trim()).filter(Boolean).map((c) => { const [name, hex] = c.split(':'); return { name: name.trim(), hex: (hex || '#888888').trim() } }),
        specs: Object.fromEntries(f.specs.split('\n').map((l) => l.split(':')).filter((p) => p.length >= 2).map(([k, ...v]) => [k.trim(), v.join(':').trim()])),
      }
      const p = await api.adminCreateProduct(body)
      toast(`Created ${p.name}`)
      setF(EMPTY)
      onCreated(p)
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <form className="card stack" onSubmit={submit} style={{ marginBottom: 20 }}>
      <h3>Add a product</h3>
      <div className="form-grid">
        <div className="field"><label htmlFor="np-brand">Brand</label><input id="np-brand" className="input" required value={f.brand} onChange={set('brand')} /></div>
        <div className="field"><label htmlFor="np-name">Model name</label><input id="np-name" className="input" required value={f.name} onChange={set('name')} /></div>
        <div className="field"><label htmlFor="np-cat">Category</label>
          <select id="np-cat" className="select" value={f.category} onChange={set('category')}>{Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}</select>
        </div>
        <div className="field"><label htmlFor="np-year">Release year</label><input id="np-year" className="input" required inputMode="numeric" value={f.year} onChange={set('year')} /></div>
        <div className="field full"><label htmlFor="np-tag">Tagline</label><input id="np-tag" className="input" value={f.tagline} onChange={set('tagline')} /></div>
        <div className="field full"><label htmlFor="np-sub">Subtitle</label><input id="np-sub" className="input" required placeholder='6.7" · Snapdragon 8 Gen 2' value={f.subtitle} onChange={set('subtitle')} /></div>
        <div className="field"><label htmlFor="np-price">Excellent price, base storage (KSh)</label><input id="np-price" className="input" required inputMode="numeric" value={f.price} onChange={set('price')} /></div>
        <div className="field"><label htmlFor="np-new">New price (KSh)</label><input id="np-new" className="input" required inputMode="numeric" value={f.new_price} onChange={set('new_price')} /></div>
        <div className="field"><label htmlFor="np-st">Storage tiers (comma separated)</label><input id="np-st" className="input" required value={f.storages} onChange={set('storages')} /></div>
        <div className="field"><label htmlFor="np-stock">Starting stock per variant</label><input id="np-stock" className="input" inputMode="numeric" value={f.stock} onChange={set('stock')} /></div>
        <div className="field full"><label htmlFor="np-col">Finishes (Name:#hex, …)</label><input id="np-col" className="input" required value={f.colors} onChange={set('colors')} /></div>
        <div className="field full"><label htmlFor="np-img">Photo URL (optional)</label><input id="np-img" className="input" type="url" value={f.image_url} onChange={set('image_url')} /></div>
        <div className="field full"><label htmlFor="np-specs">Specs (one “Key: value” per line)</label><textarea id="np-specs" className="textarea" value={f.specs} onChange={set('specs')} placeholder={'Display: 6.7" AMOLED\nChip: Snapdragon 8 Gen 2'} /></div>
        <div className="field full"><label htmlFor="np-desc">Description</label><textarea id="np-desc" className="textarea" required minLength={10} value={f.description} onChange={set('description')} /></div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary">Create product</button>
    </form>
  )
}

function Products() {
  const toast = useToast()
  const [items, setItems] = useState(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const [adding, setAdding] = useState(false)
  useEffect(() => { api.adminProducts().then(setItems).catch((e) => toast(e.message)) }, [toast])
  const replace = (p) => setItems((cur) => cur.map((x) => (x.id === p.id ? p : x)))
  const flip = async (p, key) => {
    try { replace(await api.adminUpdateProduct(p.id, { [key]: !p[key] })) } catch (e) { toast(e.message) }
  }
  const filtered = useMemo(() => (items || []).filter((p) => `${p.brand} ${p.name}`.toLowerCase().includes(q.toLowerCase())), [items, q])
  if (!items) return <div className="skeleton" style={{ height: 300 }} />
  return (
    <>
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <input className="input input-sm" style={{ maxWidth: 320 }} placeholder={`Search ${items.length} products…`} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(!adding)}>{adding ? 'Close' : 'Add product'}</button>
      </div>
      {adding && <NewProduct onCreated={(p) => { setItems((cur) => [p, ...cur]); setAdding(false) }} />}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Product</th><th>Category</th><th>From</th><th>Units</th><th>Featured</th><th>Deal</th><th /></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <Fragment key={p.id}>
                <tr>
                  <td><strong>{p.brand} {p.name}</strong><div className="subtle">{p.storages.join(' · ')} · {p.colors.length} finishes</div></td>
                  <td>{CATEGORIES[p.category]?.short}</td>
                  <td>{ksh(p.price_from)}</td>
                  <td><span className={`status-pill ${p.variants.some((v) => v.stock) ? 'on' : 'off'}`}>{p.variants.reduce((s, v) => s + v.stock, 0)}</span></td>
                  <td><input type="checkbox" checked={p.featured} onChange={() => flip(p, 'featured')} aria-label="Featured" /></td>
                  <td><input type="checkbox" checked={p.deal} onChange={() => flip(p, 'deal')} aria-label="Deal" /></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? 'Hide' : 'Stock & prices'}</button></td>
                </tr>
                {open === p.id && p.variants.map((v) => <VariantRow key={v.id} v={v} onSaved={replace} />)}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Coupons() {
  const toast = useToast()
  const [items, setItems] = useState(null)
  const [f, setF] = useState({ code: '', description: '', percent_off: '', amount_off: '', max_discount: '', min_subtotal: '', max_uses: '' })
  const load = useCallback(() => api.adminCoupons().then(setItems).catch((e) => toast(e.message)), [toast])
  useEffect(() => { load() }, [load])
  const num = (v) => (v === '' ? null : Number(v))
  const create = async (e) => {
    e.preventDefault()
    try {
      await api.adminCreateCoupon({ code: f.code, description: f.description, percent_off: num(f.percent_off) || 0, amount_off: num(f.amount_off) || 0, max_discount: num(f.max_discount), min_subtotal: num(f.min_subtotal) || 0, max_uses: num(f.max_uses) })
      toast(`Created ${f.code.toUpperCase()}`)
      setF({ code: '', description: '', percent_off: '', amount_off: '', max_discount: '', min_subtotal: '', max_uses: '' })
      load()
    } catch (err) {
      toast(err.message)
    }
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <>
      <form className="card" onSubmit={create} style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 14 }}>New promo code</h3>
        <div className="form-grid">
          <div className="field"><label htmlFor="c-code">Code</label><input id="c-code" className="input" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></div>
          <div className="field"><label htmlFor="c-desc">Description</label><input id="c-desc" className="input" value={f.description} onChange={set('description')} /></div>
          <div className="field"><label htmlFor="c-pct">% off</label><input id="c-pct" className="input" inputMode="numeric" value={f.percent_off} onChange={set('percent_off')} /></div>
          <div className="field"><label htmlFor="c-amt">or KSh off</label><input id="c-amt" className="input" inputMode="numeric" value={f.amount_off} onChange={set('amount_off')} /></div>
          <div className="field"><label htmlFor="c-max">Max discount (KSh)</label><input id="c-max" className="input" inputMode="numeric" value={f.max_discount} onChange={set('max_discount')} /></div>
          <div className="field"><label htmlFor="c-min">Minimum spend (KSh)</label><input id="c-min" className="input" inputMode="numeric" value={f.min_subtotal} onChange={set('min_subtotal')} /></div>
          <div className="field"><label htmlFor="c-uses">Max uses</label><input id="c-uses" className="input" inputMode="numeric" value={f.max_uses} onChange={set('max_uses')} /></div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 16 }}>Create code</button>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Code</th><th>Discount</th><th>Min spend</th><th>Uses</th><th>Status</th><th /></tr></thead>
          <tbody>
            {(items || []).map((c) => (
              <tr key={c.id}>
                <td><strong>{c.code}</strong><div className="subtle">{c.description}</div></td>
                <td>{c.percent_off ? `${c.percent_off}%` : ''}{c.amount_off ? ksh(c.amount_off) : ''}{c.max_discount ? ` (max ${ksh(c.max_discount)})` : ''}</td>
                <td>{c.min_subtotal ? ksh(c.min_subtotal) : '—'}</td>
                <td>{c.uses}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                <td><span className={`status-pill ${c.active ? 'on' : 'off'}`}>{c.active ? 'Active' : 'Paused'}</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => api.adminToggleCoupon(c.id).then(load)}>{c.active ? 'Pause' : 'Activate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('orders')

  const load = useCallback(() => api.adminStats().then(setStats).catch((e) => setError(e.message)), [])

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/login?next=/admin')
    else if (!user.is_admin) router.replace('/account')
    else load()
  }, [user, loading, router, load])

  if (!user?.is_admin) return <div className="container section"><div className="skeleton" style={{ height: 300 }} /></div>

  const tiles = stats ? [
    ['Revenue (paid)', ksh(stats.revenue)],
    ['Orders', `${stats.orders} · ${stats.pending_orders} awaiting payment`],
    ['Units in stock', `${stats.units_in_stock} across ${stats.products} listings`],
    ['Customers', stats.customers],
    ['Import requests', stats.import_requests],
    ['Trade-in requests', stats.trade_ins],
  ] : []

  return (
    <div className="container section-sm">
      <div className="section-head">
        <div><span className="eyebrow">Admin</span><h2>Store dashboard.</h2></div>
        <button className="btn btn-outline btn-sm" onClick={load}>Refresh</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="stat-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 28 }}>
        {stats ? tiles.map(([l, v]) => <div className="stat" key={l}><span>{l}</span><strong style={{ fontSize: 24 }}>{v}</strong></div>)
          : Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 92 }} />)}
      </div>
      <div className="admin-tabs" role="tablist">
        {[['orders', 'Recent orders'], ['products', 'Products & stock'], ['coupons', 'Promo codes']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`pill ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'orders' && stats && <Orders stats={stats} reload={load} />}
      {tab === 'products' && <Products />}
      {tab === 'coupons' && <Coupons />}
    </div>
  )
}
