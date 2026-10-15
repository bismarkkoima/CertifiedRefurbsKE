'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Icon from '@/components/Icon'
import ProductCard, { ProductSkeletons } from '@/components/ProductCard'
import { CATEGORIES, GRADES, ksh } from '@/lib/format'
import { api } from '@/utils/api'

const SORTS = [
  ['featured', 'Recommended'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['discount', 'Biggest savings'],
  ['rating', 'Best rated'],
  ['newest', 'Newest'],
]
const PRICE_BANDS = [
  ['Under 30,000', '', '30000'],
  ['30,000 – 60,000', '30000', '60000'],
  ['60,000 – 100,000', '60000', '100000'],
  ['Over 100,000', '100000', ''],
]

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="filter-section">
      <button className="filter-title" aria-expanded={open} onClick={() => setOpen(!open)}>
        {title} <Icon name="chevron" size={14} className="chev" />
      </button>
      {open && <div className="filter-body">{children}</div>}
    </div>
  )
}

export default function ShopClient() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const params = useMemo(() => Object.fromEntries(sp.entries()), [sp])
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [drawer, setDrawer] = useState(false)
  const [price, setPrice] = useState({ min: params.min_price || '', max: params.max_price || '' })

  useEffect(() => { setPrice({ min: params.min_price || '', max: params.max_price || '' }) }, [params.min_price, params.max_price])

  useEffect(() => {
    let live = true
    setData((d) => (d ? { ...d, loading: true } : null))
    api.listProducts({ page_size: 12, ...params })
      .then((r) => { if (live) { setData(r); setError('') } })
      .catch((e) => live && setError(e.message))
    return () => { live = false }
  }, [params])

  const setParams = (changes) => {
    const next = new URLSearchParams(sp)
    Object.entries(changes).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)))
    if (!('page' in changes)) next.delete('page')
    router.push(`${pathname}?${next}`, { scroll: false })
  }
  const list = (key) => (params[key] ? params[key].split(',') : [])
  const toggleList = (key, value) => {
    const cur = list(key)
    setParams({ [key]: (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]).join(',') })
  }

  const category = params.category
  const title = params.q ? `Results for “${params.q}”`
    : params.deal ? 'Deals of the week'
    : category ? CATEGORIES[category]?.label || 'Shop'
    : params.brand && !params.brand.includes(',') ? `Refurbished ${params.brand}`
    : 'All refurbished devices'

  const chips = [
    params.q && ['q', `“${params.q}”`],
    category && ['category', CATEGORIES[category]?.short],
    ...list('brand').map((b) => ['brand', b, b]),
    ...list('storage').map((s) => ['storage', s, s]),
    params.grade && ['grade', `${GRADES[params.grade]?.label} grade`],
    (params.min_price || params.max_price) && ['price', `${params.min_price ? ksh(params.min_price) : 'Any'} – ${params.max_price ? ksh(params.max_price) : 'Any'}`],
    params.deal && ['deal', 'Deals only'],
  ].filter(Boolean)

  const removeChip = ([key, , value]) => {
    if (value) return toggleList(key, value)
    if (key === 'price') return setParams({ min_price: '', max_price: '' })
    setParams({ [key]: '' })
  }

  const facets = data?.facets || { brand: [], storage: [], category: [] }

  return (
    <div className="container">
      <div className="shop-head">
        <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link>/<Link href="/shop">Shop</Link>{category && <>/<span>{CATEGORIES[category]?.short}</span></>}</nav>
        <h1>{title}</h1>
      </div>

      <div className="shop-layout">
        {drawer && <div className="mobile-menu" style={{ zIndex: 440 }} onClick={() => setDrawer(false)} />}
        <aside className={`sidebar ${drawer ? 'open' : ''}`} aria-label="Filters">
          <div className="drawer-head">
            <strong>Filters</strong>
            <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close filters"><Icon name="x" /></button>
          </div>

          <Section title="Category">
            <label className="filter-option">
              <input type="radio" name="cat" checked={!category} onChange={() => setParams({ category: '', brand: '', storage: '' })} />
              All devices
            </label>
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <label className="filter-option" key={key}>
                <input type="radio" name="cat" checked={category === key} onChange={() => setParams({ category: key, brand: '', storage: '' })} />
                {c.label}
                <span className="filter-count">{facets.category.find((f) => f.value === key)?.count ?? 0}</span>
              </label>
            ))}
          </Section>

          <Section title="Condition">
            <div className="pill-row">
              <button className={`pill ${!params.grade ? 'active' : ''}`} onClick={() => setParams({ grade: '' })}>Any</button>
              {Object.entries(GRADES).map(([g, info]) => (
                <button key={g} className={`pill ${params.grade === g ? 'active' : ''}`} onClick={() => setParams({ grade: g })}>{info.label}</button>
              ))}
            </div>
            <p className="subtle" style={{ marginTop: 10 }}>
              {params.grade ? GRADES[params.grade].blurb : 'Prices shown are for the best-value grade in stock.'}
            </p>
          </Section>

          <Section title="Brand">
            {facets.brand.map((f) => (
              <label className="filter-option" key={f.value}>
                <input type="checkbox" checked={list('brand').includes(f.value)} onChange={() => toggleList('brand', f.value)} />
                {f.value}<span className="filter-count">{f.count}</span>
              </label>
            ))}
          </Section>

          <Section title="Price (KSh)">
            <form className="price-range" onSubmit={(e) => { e.preventDefault(); setParams({ min_price: price.min, max_price: price.max }) }}>
              <input className="input input-sm" inputMode="numeric" placeholder="Min" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value.replace(/\D/g, '') })} aria-label="Minimum price" />
              <input className="input input-sm" inputMode="numeric" placeholder="Max" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value.replace(/\D/g, '') })} aria-label="Maximum price" />
              <button className="btn btn-dark btn-sm" aria-label="Apply price">Go</button>
            </form>
            <div className="divider" />
            {PRICE_BANDS.map(([label, min, max]) => (
              <label className="filter-option" key={label}>
                <input type="radio" name="band" checked={(params.min_price || '') === min && (params.max_price || '') === max && (min || max) !== ''}
                  onChange={() => setParams({ min_price: min, max_price: max })} />
                {label}
              </label>
            ))}
          </Section>

          <Section title="Storage / size" defaultOpen={false}>
            {facets.storage.map((f) => (
              <label className="filter-option" key={f.value}>
                <input type="checkbox" checked={list('storage').includes(f.value)} onChange={() => toggleList('storage', f.value)} />
                {f.value}<span className="filter-count">{f.count}</span>
              </label>
            ))}
          </Section>

          <Section title="Offers" defaultOpen={false}>
            <label className="filter-option">
              <input type="checkbox" checked={params.deal === 'true'} onChange={() => setParams({ deal: params.deal ? '' : 'true' })} />
              Deals of the week
            </label>
          </Section>

          {chips.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => router.push(pathname)}>Clear all filters</button>}
        </aside>

        <div>
          <div className="trust-strip" style={{ marginBottom: 14 }}>
            <span className="trust-item">✓ 72-point inspection</span>
            <span className="trust-item">✓ 6-month warranty</span>
            <span className="trust-item">✓ 30-day free returns</span>
            <span className="trust-item">✓ M-Pesa escrow</span>
          </div>

          <div className="toolbar">
            <div className="results-count">
              {data ? <><strong>{data.total} device{data.total === 1 ? '' : 's'}</strong> found</> : 'Loading devices…'}
            </div>
            <div className="toolbar-right">
              <button className="btn btn-outline btn-sm filters-btn" onClick={() => setDrawer(true)}><Icon name="filter" size={14} /> Filters</button>
              <label className="sr-only" htmlFor="sort">Sort by</label>
              <select id="sort" className="select input-sm" style={{ width: 'auto', borderRadius: 100 }} value={params.sort || 'featured'} onChange={(e) => setParams({ sort: e.target.value })}>
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="active-filters">
              {chips.map((c) => (
                <button key={c.join()} className="chip-x" onClick={() => removeChip(c)}>{c[1]} <Icon name="x" size={12} /></button>
              ))}
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="products-grid cols-3" style={{ opacity: data?.loading ? 0.55 : 1, transition: 'opacity .2s' }}>
            {!data ? <ProductSkeletons count={6} /> : data.items.map((p) => <ProductCard key={p.id} product={p} showGrade={!!params.grade} />)}
          </div>

          {data && data.total === 0 && (
            <div className="empty-state card">
              <div className="big">🔍</div>
              <h2>No devices match those filters</h2>
              <p>Try removing a filter — or ask us to import exactly what you want.</p>
              <div className="hero-cta" style={{ justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={() => router.push(pathname)}>Clear filters</button>
                <Link href="/import" className="btn btn-primary">Import for me</Link>
              </div>
            </div>
          )}

          {data && data.pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button className="page-btn" disabled={data.page <= 1} onClick={() => setParams({ page: data.page - 1 })} aria-label="Previous page">‹</button>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={`page-btn ${n === data.page ? 'active' : ''}`} onClick={() => setParams({ page: n })} aria-current={n === data.page ? 'page' : undefined}>{n}</button>
              ))}
              <button className="page-btn" disabled={data.page >= data.pages} onClick={() => setParams({ page: data.page + 1 })} aria-label="Next page">›</button>
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
