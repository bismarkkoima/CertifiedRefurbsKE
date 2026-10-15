'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import DeviceArt from '@/components/DeviceArt'
import { Swatches } from '@/components/ProductCard'
import { useCompare } from '@/components/Providers'
import { PRODUCTS, findProduct } from '@/lib/catalog'
import { CATEGORIES, ksh } from '@/lib/format'

function Picker({ value, onChange, category }) {
  const groups = Object.keys(CATEGORIES).filter((c) => !category || c === category)
  return (
    <select className="select input-sm" value={value || ''} onChange={(e) => onChange(e.target.value)} aria-label="Choose a device">
      <option value="">Choose a device…</option>
      {groups.map((c) => (
        <optgroup key={c} label={CATEGORIES[c].label}>
          {PRODUCTS.filter((p) => p.category === c).map((p) => <option key={p.slug} value={p.slug}>{p.brand} {p.name}</option>)}
        </optgroup>
      ))}
    </select>
  )
}

export default function CompareClient() {
  const { slugs, set } = useCompare()
  const add = useSearchParams().get('add')
  useEffect(() => {
    if (add && findProduct(add) && !slugs.includes(add)) set((s) => [add, ...s.filter((x) => x !== add)].slice(0, 3))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [add])

  const products = slugs.map(findProduct).filter(Boolean)
  const cols = [0, 1, 2].map((i) => products[i] || null)
  const category = products[0]?.category
  const setCol = (i, slug) => {
    const next = [...cols.map((p) => p?.slug || null)]
    next[i] = slug || null
    set(next.filter(Boolean).filter((s, idx, a) => a.indexOf(s) === idx))
  }
  const specKeys = [...new Set(products.flatMap((p) => Object.keys(p.specs)))]
  const rows = [
    ['From', (p) => <strong>{ksh(p.price_from)}</strong>],
    ['New price', (p) => <span className="muted">{ksh(p.new_price)}</span>],
    ['Brand', (p) => p.brand],
    ['Released', (p) => p.year],
    ...specKeys.map((k) => [k, (p) => p.specs[k] || '—']),
    [category === 'accessories' ? 'Sizes' : 'Storage', (p) => p.storages.join(' · ')],
    ['Finishes', (p) => <><Swatches colors={p.colors} max={8} /><span className="subtle">{p.colors.length} finishes</span></>],
  ]

  return (
    <>
      <section className="page-hero" style={{ paddingBottom: 24 }}>
        <div className="container">
          <h1>Compare models.</h1>
          <p>Choose up to three devices to see how they stack up.</p>
        </div>
      </section>
      <section className="container section-sm" style={{ overflowX: 'auto' }}>
        <table className="compare-table" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th scope="row" />
              {cols.map((p, i) => (
                <td key={i}>
                  <Picker value={p?.slug} onChange={(s) => setCol(i, s)} category={i > 0 ? category : undefined} />
                  {p && (
                    <div style={{ marginTop: 18 }}>
                      <div className="compare-col-art"><DeviceArt category={p.category} name={p.name} hue={p.hue} color={p.colors[0]?.hex} view="pair" /></div>
                      <div className="product-brand">{p.brand}</div>
                      <div className="product-name" style={{ fontSize: 19 }}>{p.name}</div>
                      <p className="subtle" style={{ margin: '4px 0 12px' }}>{p.tagline}</p>
                      <Link href={`/product/${p.slug}`} className="btn btn-primary btn-sm">Buy</Link>
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </thead>
          {products.length > 0 && (
            <tbody>
              {rows.map(([label, render]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {cols.map((p, i) => <td key={i}>{p ? render(p) : ''}</td>)}
                </tr>
              ))}
            </tbody>
          )}
        </table>
        {!products.length && <p className="muted" style={{ textAlign: 'center', marginTop: 24 }}>Pick a device above, or tick “Compare” on any product in the <Link href="/shop" className="link">store</Link>.</p>}
      </section>
    </>
  )
}
