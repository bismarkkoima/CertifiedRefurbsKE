'use client'

import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { useWishlist } from '@/components/Providers'
import { PRODUCTS } from '@/lib/catalog'

export default function WishlistPage() {
  const { slugs } = useWishlist()
  const items = PRODUCTS.filter((p) => slugs.includes(p.slug))
  return (
    <div className="container section-sm">
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>Your wishlist</h1>
      {items.length ? (
        <div className="products-grid">{items.map((p) => <ProductCard key={p.slug} product={p} />)}</div>
      ) : (
        <div className="empty-state card">
          <div className="big">🤍</div>
          <h2>Nothing saved yet</h2>
          <p>Tap the heart on any device to keep an eye on it.</p>
          <Link href="/shop" className="btn btn-primary">Browse devices</Link>
        </div>
      )}
    </div>
  )
}
