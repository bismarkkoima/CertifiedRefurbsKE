'use client'

import Link from 'next/link'
import { ksh, savePct } from '@/lib/format'
import { ProductImage } from './DeviceArt'
import Icon from './Icon'
import { useCompare, useToast, useWishlist } from './Providers'

export function Stars({ rating }) {
  const full = Math.round(rating)
  return <span className="stars" aria-label={`${rating} out of 5`}>{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
}

export function GradeBadge({ grade }) {
  return <span className={`grade grade-${grade}`}>{grade}</span>
}

export function Swatches({ colors = [], max = 6 }) {
  return (
    <div className="swatches" aria-label={`${colors.length} finishes`}>
      {colors.slice(0, max).map((c) => <span key={c.name} className="swatch-dot" style={{ background: c.hex }} title={c.name} />)}
      {colors.length > max && <span className="swatch-more">+{colors.length - max}</span>}
    </div>
  )
}

const isNew = (p) => p.year >= new Date().getFullYear() - 2

export default function ProductCard({ product, showGrade = false, compare = false }) {
  const wish = useWishlist()
  const cmp = useCompare()
  const toast = useToast()
  const saved = wish.has(product.slug)
  const comparing = cmp.has(product.slug)
  const save = savePct(product.price_from, product.new_price)

  const toggle = (e) => {
    e.preventDefault()
    wish.toggle(product.slug)
    toast(saved ? 'Removed from your favourites' : '♥ Saved to favourites', saved ? null : { href: '/wishlist', label: 'View' })
  }
  const toggleCompare = (e) => {
    e.preventDefault()
    const ok = cmp.toggle(product)
    if (!ok) toast('You can compare up to 3 devices', { href: '/compare', label: 'Compare now' })
  }

  return (
    <Link href={`/product/${product.slug}`} className="product-card">
      <div className="product-tags">
        <span className="cert-pill">✓ Certified</span>
        {product.deal ? <span className="tag tag-deal">Deal</span> : isNew(product) && <span className="tag">New in</span>}
        {!product.in_stock && <span className="tag tag-muted">Sold out</span>}
        {showGrade && <GradeBadge grade={product.best_grade} />}
      </div>
      <button className={`wishlist-btn ${saved ? 'on' : ''}`} onClick={toggle}
        aria-label={saved ? 'Remove from favourites' : 'Save to favourites'} aria-pressed={saved}>
        <Icon name="heart" size={17} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <div className="product-thumb"><ProductImage product={product} view="pair" /></div>
      <Swatches colors={product.colors} />
      <div className="product-brand">{product.brand}</div>
      <div className="product-name">{product.name}</div>
      <div className="product-sub">{product.storages.length > 1 ? `${product.storages[0]} – ${product.storages.at(-1)} · ` : ''}{product.subtitle}</div>
      {product.reviews_count > 0 && (
        <div className="product-rating"><Stars rating={product.rating} /> {product.rating} ({product.reviews_count})</div>
      )}
      <div className="product-pricing">
        <div>
          <div className="price-label">Starting at</div>
          <div className="product-price">{ksh(product.price_from)}</div>
          {save > 0 && <div className="product-was">{ksh(product.new_price)} new</div>}
        </div>
        {save > 0 && <span className="save-pill">−{save}%</span>}
      </div>
      {compare && (
        <label className="compare-toggle" onClick={toggleCompare}>
          <input type="checkbox" checked={comparing} readOnly tabIndex={-1} /> Compare
        </label>
      )}
    </Link>
  )
}

export function ProductSkeletons({ count = 8 }) {
  return Array.from({ length: count }, (_, i) => <div key={i} className="skeleton skeleton-card" />)
}
