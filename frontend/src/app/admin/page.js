'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth, useToast } from '@/components/Providers'
import { CATEGORIES, GRADES, ORDER_STATUS, formatDate, ksh } from '@/lib/format'
import { api } from '@/utils/api'

const NEXT = { paid: 'processing', processing: 'shipped', shipped: 'delivered' }
const REQUEST_STATUSES = ['received', 'quoted', 'in_progress', 'completed', 'rejected']

const confirmDelete = (what) => window.confirm(`Delete ${what}? This can’t be undone.`)

// Turns "Name:#hex, Name:#hex" and "Key: value" lines into API shapes and back.
const colorsToText = (colors = []) => colors.map((c) => `${c.name}:${c.hex}`).join(', ')
const textToColors = (t) => t.split(',').map((c) => c.trim()).filter(Boolean).map((c) => {
  const i = c.lastIndexOf(':')
  return i > 0 ? { name: c.slice(0, i).trim(), hex: c.slice(i + 1).trim() } : { name: c, hex: '#888888' }
})
const specsToText = (specs = {}) => Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join('\n')
const textToSpecs = (t) => Object.fromEntries(t.split('\n').map((l) => l.split(':')).filter((p) => p.length >= 2 && p[0].trim())
  .map(([k, ...v]) => [k.trim(), v.join(':').trim()]))

function useLoader(fn) {
  const toast = useToast()
  const [data, setData] = useState(null)
  const load = useCallback(() => fn().then(setData).catch((e) => toast(e.message)), [fn, toast])
  useEffect(() => { load() }, [load])
  return [data, load, setData]
}

/* ── Orders ── */
function Orders({ stats, reload }) {
  const toast = useToast()
  const run = async (fn, msg) => {
    try { await fn(); toast(msg); reload() } catch (e) { toast(e.message) }
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
              <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {NEXT[o.status] && <button className="btn btn-primary btn-sm" onClick={() => run(() => api.adminUpdateOrder(o.number, NEXT[o.status]), `${o.number} → ${ORDER_STATUS[NEXT[o.status]]}`)}>Mark {ORDER_STATUS[NEXT[o.status]].toLowerCase()}</button>}
                {!['completed', 'cancelled'].includes(o.status) && <button className="btn btn-ghost btn-sm" onClick={() => window.confirm(`Cancel ${o.number}?`) && run(() => api.adminUpdateOrder(o.number, 'cancelled'), `${o.number} cancelled`)}>Cancel</button>}
                {['pending_payment', 'cancelled'].includes(o.status) && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => confirmDelete(`order ${o.number}`) && run(() => api.adminDeleteOrder(o.number), `${o.number} deleted`)}>Delete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Products ── */
function VariantRow({ v, onSaved }) {
  const toast = useToast()
  const [price, setPrice] = useState(v.price)
  const [stock, setStock] = useState(v.stock)
  const dirty = Number(price) !== v.price || Number(stock) !== v.stock
  const save = async () => {
    try { onSaved(await api.adminUpdateVariant(v.id, { price: Number(price), stock: Number(stock) })); toast('Option updated') } catch (e) { toast(e.message) }
  }
  const remove = async () => {
    if (!confirmDelete(`the ${v.storage} ${GRADES[v.grade].label} option`)) return
    try { onSaved(await api.adminDeleteVariant(v.id)); toast('Option deleted') } catch (e) { toast(e.message) }
  }
  return (
    <tr>
      <td>{v.storage}</td>
      <td><span className={`grade grade-${v.grade}`}>{GRADES[v.grade].label}</span></td>
      <td><input className="input input-sm" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} aria-label="Price" /></td>
      <td><input className="input input-sm" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ''))} aria-label="Stock" /></td>
      <td style={{ display: 'flex', gap: 6 }}>
        {dirty && <button className="btn btn-primary btn-sm" onClick={save}>Save</button>}
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={remove}>Delete</button>
      </td>
    </tr>
  )
}

function AddVariant({ product, onSaved }) {
  const toast = useToast()
  const [f, setF] = useState({ grade: 'excellent', storage: '', price: '', new_price: product.new_price, stock: 1 })
  const submit = async (e) => {
    e.preventDefault()
    try {
      onSaved(await api.adminCreateVariant(product.id, { ...f, price: Number(f.price), new_price: Number(f.new_price), stock: Number(f.stock) }))
      toast(`Added ${f.storage} ${GRADES[f.grade].label}`)
      setF({ ...f, storage: '', price: '' })
    } catch (err) { toast(err.message) }
  }
  return (
    <form onSubmit={submit} className="row" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8, marginTop: 12 }}>
      <strong style={{ fontSize: 14 }}>Add option:</strong>
      <select className="select input-sm" style={{ width: 130 }} value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value })} aria-label="Grade">
        {Object.entries(GRADES).map(([k, g]) => <option key={k} value={k}>{g.label}</option>)}
      </select>
      <input className="input input-sm" style={{ width: 110 }} required placeholder="e.g. 256GB" value={f.storage} onChange={(e) => setF({ ...f, storage: e.target.value })} aria-label="Storage" />
      <input className="input input-sm" style={{ width: 110 }} required inputMode="numeric" placeholder="Price" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, '') })} aria-label="Price" />
      <input className="input input-sm" style={{ width: 110 }} required inputMode="numeric" placeholder="New price" value={f.new_price} onChange={(e) => setF({ ...f, new_price: e.target.value.replace(/\D/g, '') })} aria-label="New price" />
      <input className="input input-sm" style={{ width: 80 }} inputMode="numeric" placeholder="Stock" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value.replace(/\D/g, '') })} aria-label="Stock" />
      <button className="btn btn-dark btn-sm">Add</button>
    </form>
  )
}

function ProductFields({ f, set }) {
  return (
    <div className="form-grid">
      <div className="field"><label>Brand</label><input className="input" required value={f.brand} onChange={set('brand')} /></div>
      <div className="field"><label>Model name</label><input className="input" required value={f.name} onChange={set('name')} /></div>
      <div className="field"><label>Category</label>
        <select className="select" value={f.category} onChange={set('category')}>{Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}</select>
      </div>
      <div className="field"><label>Release year</label><input className="input" required inputMode="numeric" value={f.year} onChange={set('year')} /></div>
      <div className="field full"><label>Tagline</label><input className="input" value={f.tagline} onChange={set('tagline')} /></div>
      <div className="field full"><label>Subtitle</label><input className="input" required placeholder='6.7" · Snapdragon 8 Gen 2' value={f.subtitle} onChange={set('subtitle')} /></div>
      <div className="field"><label>New price (KSh)</label><input className="input" required inputMode="numeric" value={f.new_price} onChange={set('new_price')} /></div>
      <div className="field"><label>Photo URL (optional)</label><input className="input" type="url" value={f.image_url} onChange={set('image_url')} /></div>
      <div className="field full"><label>Finishes (Name:#hex, …)</label><input className="input" required value={f.colors} onChange={set('colors')} /></div>
      <div className="field full"><label>Specs (one “Key: value” per line)</label><textarea className="textarea" value={f.specs} onChange={set('specs')} placeholder={'Display: 6.7" AMOLED\nChip: Snapdragon 8 Gen 2'} /></div>
      <div className="field full"><label>Description</label><textarea className="textarea" required minLength={10} value={f.description} onChange={set('description')} /></div>
    </div>
  )
}

function EditProduct({ product, onSaved, onRemoved }) {
  const toast = useToast()
  const [f, setF] = useState({
    ...product, image_url: product.image_url || '', colors: colorsToText(product.colors), specs: specsToText(product.specs),
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async (e) => {
    e.preventDefault()
    try {
      onSaved(await api.adminUpdateProduct(product.id, {
        name: f.name, brand: f.brand, category: f.category, year: Number(f.year), tagline: f.tagline, subtitle: f.subtitle,
        description: f.description, new_price: Number(f.new_price), image_url: f.image_url || null,
        colors: textToColors(f.colors), specs: textToSpecs(f.specs),
      }))
      toast('Product saved')
    } catch (err) { toast(err.message) }
  }
  const archive = async () => {
    try { onSaved(await api.adminUpdateProduct(product.id, { active: !product.active })); toast(product.active ? 'Hidden from the store' : 'Back in the store') } catch (e) { toast(e.message) }
  }
  const remove = async () => {
    if (!confirmDelete(`${product.brand} ${product.name}`)) return
    try {
      const res = await api.adminDeleteProduct(product.id)
      toast(res.message)
      if (res.deleted) onRemoved(product.id)
      else onSaved({ ...product, active: false })
    } catch (e) { toast(e.message) }
  }
  return (
    <div className="card" style={{ margin: '4px 0 16px', boxShadow: 'none', background: 'var(--surface-2)' }}>
      <form onSubmit={save} className="stack">
        <ProductFields f={f} set={set} />
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm">Save changes</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={archive}>{product.active ? 'Hide from store' : 'Show in store'}</button>
            <button type="button" className="btn btn-sm" style={{ background: 'var(--red)', color: '#fff' }} onClick={remove}>Delete product</button>
          </div>
        </div>
      </form>
      <div className="divider" />
      <h3 style={{ fontSize: 17, marginBottom: 10 }}>Options, prices & stock</h3>
      <div className="table-wrap" style={{ boxShadow: 'none' }}>
        <table className="table" style={{ minWidth: 560 }}>
          <thead><tr><th>Storage</th><th>Grade</th><th>Price (KSh)</th><th>Stock</th><th /></tr></thead>
          <tbody>{product.variants.map((v) => <VariantRow key={`${v.id}-${v.price}-${v.stock}`} v={v} onSaved={onSaved} />)}</tbody>
        </table>
      </div>
      <AddVariant product={product} onSaved={onSaved} />
    </div>
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
      const p = await api.adminCreateProduct({
        ...f, year: Number(f.year), price: Number(f.price), new_price: Number(f.new_price), stock: Number(f.stock),
        image_url: f.image_url || null, storages: f.storages.split(',').map((s) => s.trim()).filter(Boolean),
        colors: textToColors(f.colors), specs: textToSpecs(f.specs),
      })
      toast(`Created ${p.name}`)
      setF(EMPTY)
      onCreated(p)
    } catch (err) { setError(err.message) }
  }
  return (
    <form className="card stack" onSubmit={submit} style={{ marginBottom: 20 }}>
      <h3>Add a product</h3>
      <ProductFields f={f} set={set} />
      <div className="form-grid">
        <div className="field"><label>Excellent price, smallest storage (KSh)</label><input className="input" required inputMode="numeric" value={f.price} onChange={set('price')} /></div>
        <div className="field"><label>Starting stock per option</label><input className="input" inputMode="numeric" value={f.stock} onChange={set('stock')} /></div>
        <div className="field full"><label>Storage options (comma separated)</label><input className="input" required value={f.storages} onChange={set('storages')} />
          <span className="hint">Good and Fair prices and larger storage prices are worked out automatically. You can change them after creating.</span></div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary">Create product</button>
    </form>
  )
}

function Products() {
  const toast = useToast()
  const [items, , setItems] = useLoader(api.adminProducts)
  const [q, setQ] = useState('')
  const [show, setShow] = useState('all')
  const [open, setOpen] = useState(null)
  const [adding, setAdding] = useState(false)
  const replace = (p) => setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, ...p } : x)))
  const removeLocal = (id) => { setItems((cur) => cur.filter((x) => x.id !== id)); setOpen(null) }
  const flip = async (p, key) => {
    try { replace(await api.adminUpdateProduct(p.id, { [key]: !p[key] })) } catch (e) { toast(e.message) }
  }
  const filtered = useMemo(() => (items || [])
    .filter((p) => show === 'all' || (show === 'hidden' ? !p.active : show === 'out' ? !p.variants.some((v) => v.stock) : p.active))
    .filter((p) => `${p.brand} ${p.name}`.toLowerCase().includes(q.toLowerCase())), [items, q, show])
  if (!items) return <div className="skeleton" style={{ height: 300 }} />
  return (
    <>
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="input input-sm" style={{ width: 260 }} placeholder={`Search ${items.length} products…`} value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select input-sm" style={{ width: 170 }} value={show} onChange={(e) => setShow(e.target.value)} aria-label="Filter">
            <option value="all">All products</option><option value="live">In the store</option><option value="hidden">Hidden</option><option value="out">Out of stock</option>
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(!adding)}>{adding ? 'Close' : '+ Add product'}</button>
      </div>
      {adding && <NewProduct onCreated={(p) => { setItems((cur) => [p, ...cur]); setAdding(false); setOpen(p.id) }} />}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Product</th><th>Category</th><th>From</th><th>Units</th><th>Featured</th><th>Deal</th><th>Status</th><th /></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <Fragment key={p.id}>
                <tr>
                  <td><strong>{p.brand} {p.name}</strong><div className="subtle">{p.storages.join(' · ')} · {p.colors.length} finishes</div></td>
                  <td>{CATEGORIES[p.category]?.short}</td>
                  <td>{ksh(p.price_from)}</td>
                  <td>{p.variants.reduce((s, v) => s + v.stock, 0)}</td>
                  <td><input type="checkbox" checked={p.featured} onChange={() => flip(p, 'featured')} aria-label="Featured" /></td>
                  <td><input type="checkbox" checked={p.deal} onChange={() => flip(p, 'deal')} aria-label="Deal" /></td>
                  <td><span className={`status-pill ${p.active ? 'on' : 'off'}`}>{p.active ? 'Live' : 'Hidden'}</span></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? 'Close' : 'Edit'}</button></td>
                </tr>
                {open === p.id && <tr><td colSpan={8} style={{ padding: '0 16px' }}><EditProduct product={p} onSaved={replace} onRemoved={removeLocal} /></td></tr>}
              </Fragment>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="muted">No products match.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ── Promo codes ── */
const EMPTY_COUPON = { code: '', description: '', percent_off: '', amount_off: '', max_discount: '', min_subtotal: '', max_uses: '' }

function Coupons() {
  const toast = useToast()
  const [items, load] = useLoader(api.adminCoupons)
  const [f, setF] = useState(EMPTY_COUPON)
  const num = (v) => (v === '' ? null : Number(v))
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const create = async (e) => {
    e.preventDefault()
    try {
      await api.adminCreateCoupon({ code: f.code, description: f.description, percent_off: num(f.percent_off) || 0, amount_off: num(f.amount_off) || 0, max_discount: num(f.max_discount), min_subtotal: num(f.min_subtotal) || 0, max_uses: num(f.max_uses) })
      toast(`Created ${f.code.toUpperCase()}`)
      setF(EMPTY_COUPON)
      load()
    } catch (err) { toast(err.message) }
  }
  const remove = async (c) => {
    if (!confirmDelete(`promo code ${c.code}`)) return
    try { await api.adminDeleteCoupon(c.id); toast(`${c.code} deleted`); load() } catch (e) { toast(e.message) }
  }
  return (
    <>
      <form className="card" onSubmit={create} style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 14 }}>New promo code</h3>
        <div className="form-grid">
          <div className="field"><label>Code</label><input className="input" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></div>
          <div className="field"><label>Description</label><input className="input" value={f.description} onChange={set('description')} /></div>
          <div className="field"><label>% off</label><input className="input" inputMode="numeric" value={f.percent_off} onChange={set('percent_off')} /></div>
          <div className="field"><label>or KSh off</label><input className="input" inputMode="numeric" value={f.amount_off} onChange={set('amount_off')} /></div>
          <div className="field"><label>Max discount (KSh)</label><input className="input" inputMode="numeric" value={f.max_discount} onChange={set('max_discount')} /></div>
          <div className="field"><label>Minimum spend (KSh)</label><input className="input" inputMode="numeric" value={f.min_subtotal} onChange={set('min_subtotal')} /></div>
          <div className="field"><label>Max uses</label><input className="input" inputMode="numeric" value={f.max_uses} onChange={set('max_uses')} /></div>
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
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => api.adminToggleCoupon(c.id).then(load)}>{c.active ? 'Pause' : 'Activate'}</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
            {items?.length === 0 && <tr><td colSpan={6} className="muted">No promo codes yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ── Generic list with delete (reviews, requests, messages, subscribers) ── */
function DataTable({ title, loader, columns, onDelete, describe, extra, csv }) {
  const toast = useToast()
  const [items, load] = useLoader(loader)
  const [q, setQ] = useState('')
  const filtered = (items || []).filter((i) => JSON.stringify(i).toLowerCase().includes(q.toLowerCase()))
  const remove = async (item) => {
    if (!confirmDelete(describe(item))) return
    try { await onDelete(item); toast('Deleted'); load() } catch (e) { toast(e.message) }
  }
  const download = () => {
    const rows = [csv.map(([h]) => h), ...filtered.map((i) => csv.map(([, f]) => String(f(i) ?? '').replaceAll('"', '""')))]
    const blob = new Blob([rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${title.toLowerCase().replace(/\W+/g, '-')}.csv` })
    a.click()
    URL.revokeObjectURL(a.href)
  }
  if (!items) return <div className="skeleton" style={{ height: 240 }} />
  return (
    <>
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <input className="input input-sm" style={{ width: 280 }} placeholder={`Search ${items.length} ${title.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
        {csv && items.length > 0 && <button className="btn btn-outline btn-sm" onClick={download}>Export CSV</button>}
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr>{columns.map(([h]) => <th key={h}>{h}</th>)}<th /></tr></thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                {columns.map(([h, render]) => <td key={h}>{render(item, load)}</td>)}
                <td style={{ display: 'flex', gap: 6 }}>
                  {extra?.(item, load)}
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => remove(item)}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={columns.length + 1} className="muted">Nothing here yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}

function StatusSelect({ kind, item, reload }) {
  const toast = useToast()
  return (
    <select className="select input-sm" style={{ width: 140 }} value={item.status} aria-label="Status"
      onChange={(e) => api.adminSetStatus(kind, item.id, e.target.value).then(() => { toast('Status updated'); reload() }).catch((err) => toast(err.message))}>
      {REQUEST_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
    </select>
  )
}

const listOf = (kind) => () => api.adminList(kind)

function Requests() {
  const [kind, setKind] = useState('trade-ins')
  return (
    <>
      <div className="admin-tabs">
        <button className={`pill ${kind === 'trade-ins' ? 'active' : ''}`} onClick={() => setKind('trade-ins')}>Trade-ins</button>
        <button className={`pill ${kind === 'imports' ? 'active' : ''}`} onClick={() => setKind('imports')}>Import requests</button>
      </div>
      {kind === 'trade-ins' ? (
        <DataTable key="t" title="Trade-ins" loader={TRADE_LOADER} onDelete={(i) => api.adminDelete('trade-ins', i.id)} describe={(i) => `trade-in ${i.reference}`}
          columns={[
            ['Ref', (i) => <><strong>{i.reference}</strong><div className="subtle">{formatDate(i.created_at)}</div></>],
            ['Customer', (i) => <>{i.full_name}<div className="subtle">{i.phone} · {i.email}</div></>],
            ['Device', (i) => <>{i.brand} {i.model}<div className="subtle">{i.storage} · {i.condition.replace('_', ' ')}</div></>],
            ['Quote', (i) => ksh(i.quoted_price)],
            ['Status', (i, reload) => <StatusSelect kind="trade-ins" item={i} reload={reload} />],
          ]}
          csv={[['Reference', (i) => i.reference], ['Name', (i) => i.full_name], ['Phone', (i) => i.phone], ['Email', (i) => i.email], ['Device', (i) => `${i.brand} ${i.model} ${i.storage}`], ['Condition', (i) => i.condition], ['Quote', (i) => i.quoted_price], ['Status', (i) => i.status]]}
        />
      ) : (
        <DataTable key="i" title="Import requests" loader={IMPORT_LOADER} onDelete={(i) => api.adminDelete('imports', i.id)} describe={(i) => `import request ${i.reference}`}
          columns={[
            ['Ref', (i) => <><strong>{i.reference}</strong><div className="subtle">{formatDate(i.created_at)}</div></>],
            ['Customer', (i) => <>{i.full_name}<div className="subtle">{i.phone} · {i.email}</div></>],
            ['Item', (i) => <>{i.item_description}{i.item_url && <div><a href={i.item_url} target="_blank" rel="noreferrer" className="link subtle">Listing ↗</a></div>}</>],
            ['Quote', (i) => <>{ksh(i.quote.total)}<div className="subtle">${i.quote.item_price_usd}</div></>],
            ['Status', (i, reload) => <StatusSelect kind="imports" item={i} reload={reload} />],
          ]}
          csv={[['Reference', (i) => i.reference], ['Name', (i) => i.full_name], ['Phone', (i) => i.phone], ['Email', (i) => i.email], ['Item', (i) => i.item_description], ['USD', (i) => i.quote.item_price_usd], ['Quote KSh', (i) => i.quote.total], ['Status', (i) => i.status]]}
        />
      )}
    </>
  )
}

const TRADE_LOADER = listOf('trade-ins')
const IMPORT_LOADER = listOf('imports')
const MESSAGE_LOADER = listOf('messages')
const SUBSCRIBER_LOADER = listOf('subscribers')
const USER_LOADER = () => api.adminList('users')

function Customers({ me }) {
  const toast = useToast()
  const [f, setF] = useState({ full_name: '', email: '', phone: '', password: '', is_admin: true })
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const create = async (e) => {
    e.preventDefault()
    try {
      await api.adminCreateUser({ ...f, phone: f.phone || null })
      toast(`Created account for ${f.email}`)
      setF({ full_name: '', email: '', phone: '', password: '', is_admin: true })
      setOpen(false)
      setVersion((v) => v + 1)
    } catch (err) { toast(err.message) }
  }
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(!open)}>{open ? 'Close' : '+ Add account'}</button>
      </div>
      {open && (
        <form className="card" onSubmit={create} style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 14 }}>New account</h3>
          <div className="form-grid">
            <div className="field"><label>Full name</label><input className="input" required minLength={2} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
            <div className="field"><label>Email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="field"><label>Phone (optional)</label><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div className="field"><label>Temporary password</label><input className="input" type="password" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
            <label className="filter-option full"><input type="checkbox" checked={f.is_admin} onChange={(e) => setF({ ...f, is_admin: e.target.checked })} /> Give admin access (staff)</label>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16 }}>Create account</button>
        </form>
      )}
      <DataTable key={version} title="Accounts" loader={USER_LOADER} onDelete={(u) => api.adminDeleteUser(u.id)} describe={(u) => `the account ${u.email} (their orders are kept)`}
        columns={[
          ['Name', (u) => <><strong>{u.full_name}</strong>{u.id === me.id && <span className="subtle"> (you)</span>}</>],
          ['Email', (u) => <>{u.email}<div className="subtle">{u.phone}</div></>],
          ['Joined', (u) => formatDate(u.created_at)],
          ['Orders', (u) => u.order_count],
          ['Role', (u) => <span className={`status-pill ${u.is_admin ? 'shipped' : ''}`}>{u.is_admin ? 'Admin' : 'Customer'}</span>],
        ]}
        extra={(u, reload) => u.id !== me.id && (
          <button className="btn btn-ghost btn-sm" onClick={() => api.adminToggleAdmin(u.id).then(() => { toast('Role updated'); reload() }).catch((e) => toast(e.message))}>
            {u.is_admin ? 'Remove admin' : 'Make admin'}
          </button>
        )}
        csv={[['Name', (u) => u.full_name], ['Email', (u) => u.email], ['Phone', (u) => u.phone], ['Orders', (u) => u.order_count], ['Admin', (u) => u.is_admin]]}
      />
    </>
  )
}

const TABS = [
  ['orders', 'Orders'], ['products', 'Products & stock'], ['coupons', 'Promo codes'], ['reviews', 'Reviews'],
  ['requests', 'Trade-ins & imports'], ['messages', 'Messages'], ['customers', 'Accounts'], ['subscribers', 'Subscribers'],
]

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
  useEffect(() => {
    try { const t = sessionStorage.getItem('crk_admin_tab'); if (t) setTab(t) } catch {}
  }, [])
  const pick = (t) => { setTab(t); try { sessionStorage.setItem('crk_admin_tab', t) } catch {} }

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
      <div className="stat-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 28 }}>
        {stats ? tiles.map(([l, v]) => <div className="stat" key={l}><span>{l}</span><strong style={{ fontSize: 22 }}>{v}</strong></div>)
          : Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 92 }} />)}
      </div>
      <div className="admin-tabs" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`pill ${tab === k ? 'active' : ''}`} onClick={() => pick(k)}>{l}</button>)}
      </div>

      {tab === 'orders' && stats && <Orders stats={stats} reload={load} />}
      {tab === 'products' && <Products />}
      {tab === 'coupons' && <Coupons />}
      {tab === 'reviews' && (
        <DataTable title="Reviews" loader={api.adminReviews} onDelete={(r) => api.adminDeleteReview(r.id)} describe={(r) => `the review “${r.title}”`}
          columns={[
            ['Product', (r) => <Link href={`/product/${r.product_slug}`} className="link">{r.product_name}</Link>],
            ['Rating', (r) => <span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>],
            ['Review', (r) => <><strong>{r.title}</strong><div className="subtle" style={{ maxWidth: 420 }}>{r.body}</div></>],
            ['By', (r) => <>{r.author_name}{r.verified && <div className="verified">✓ Verified</div>}<div className="subtle">{formatDate(r.created_at)}</div></>],
          ]}
        />
      )}
      {tab === 'requests' && <Requests />}
      {tab === 'messages' && (
        <DataTable title="Messages" loader={MESSAGE_LOADER} onDelete={(m) => api.adminDelete('messages', m.id)} describe={(m) => `the message from ${m.full_name}`}
          columns={[
            ['From', (m) => <><strong>{m.full_name}</strong><div><a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="link subtle">{m.email}</a></div></>],
            ['Message', (m) => <><strong>{m.subject}</strong><div className="subtle" style={{ maxWidth: 480, whiteSpace: 'pre-wrap' }}>{m.message}</div></>],
            ['Received', (m) => formatDate(m.created_at)],
          ]}
          csv={[['Name', (m) => m.full_name], ['Email', (m) => m.email], ['Subject', (m) => m.subject], ['Message', (m) => m.message], ['Received', (m) => m.created_at]]}
        />
      )}
      {tab === 'customers' && <Customers me={user} />}
      {tab === 'subscribers' && (
        <DataTable title="Subscribers" loader={SUBSCRIBER_LOADER} onDelete={(s) => api.adminDelete('subscribers', s.id)} describe={(s) => s.email}
          columns={[['Email', (s) => s.email], ['Joined', (s) => formatDate(s.created_at)]]}
          csv={[['Email', (s) => s.email], ['Joined', (s) => s.created_at]]}
        />
      )}
    </div>
  )
}
