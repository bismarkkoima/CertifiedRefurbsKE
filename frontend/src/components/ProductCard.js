'use client'

import Link from 'next/link'
import { ksh, savePct } from '@/lib/format'
import DeviceArt from './DeviceArt'
import Icon from './Icon'
import { useToast, useWishlist } from './Providers'

export function Stars({ rating }) {
  const full = Math.round(rating)
  return <span className="stars" aria-label={`${rating} out of 5`}>{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
}

export function GradeBadge({ grade }) {
  return <span className={`grade grade-${grade}`}>{grade}</span>
}

export default function ProductCard({ product, showGrade = false }) {
  const wish = useWishlist()
  const toast = useToast()
  const saved = wish.has(product.slug)
  const save = savePct(product.price_from, product.new_price)

  const toggle = (e) => {
    e.preventDefault()
    wish.toggle(product.slug)
    toast(saved ? 'Removed from wishlist' : '♥ Saved to wishlist', saved ? null : { href: '/wishlist', label: 'View' })
  }

  return (
    <Link href={`/product/${product.slug}`} className="product-card">
      <div className="product-thumb">
        <div className="product-tags">
          {product.deal && <span className="tag tag-deal">Deal</span>}
          {showGrade && <GradeBadge grade={product.best_grade} />}
          {!product.in_stock && <span className="tag">Sold out</span>}
        </div>
        <button className={`wishlist-btn ${saved ? 'on' : ''}`} onClick={toggle}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={saved}>
          <Icon name="heart" size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
        <DeviceArt category={product.category} name={product.name} hue={product.hue} />
      </div>
      <div className="product-brand">{product.brand}</div>
      <div className="product-name">{product.name}</div>
      <div className="product-sub">{product.subtitle}</div>
      <div className="product-rating">
        <Stars rating={product.rating} /> {product.rating} ({product.reviews_count.toLocaleString()})
      </div>
      <div className="product-pricing">
        <div>
          <div className="product-from">From</div>
          <div className="product-price">{ksh(product.price_from)}</div>
          <div className="product-was">New {ksh(product.new_price)}</div>
        </div>
        {save > 0 && <span className="save-pill">−{save}%</span>}
      </div>
      <div className="product-foot">
        <span className="mpesa-dot" /> M-Pesa · {product.in_stock ? 'In stock' : 'Sold out'} · 6-mo warranty
      </div>
    </Link>
  )
}

export function ProductSkeletons({ count = 8 }) {
  return Array.from({ length: count }, (_, i) => <div key={i} className="skeleton skeleton-card" />)
}
