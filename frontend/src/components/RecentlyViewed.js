'use client'

import { PRODUCTS } from '@/lib/catalog'
import ProductCard from './ProductCard'
import { useRecent } from './Providers'
import Shelf from './Shelf'

export default function RecentlyViewed({ exclude }) {
  const { slugs } = useRecent()
  const items = slugs.filter((s) => s !== exclude).map((s) => PRODUCTS.find((p) => p.slug === s)).filter(Boolean)
  if (!items.length) return null
  return (
    <section className="section-sm">
      <div className="container section-head"><h2>Recently viewed. <span className="grey">Pick up where you left off.</span></h2></div>
      <Shelf label="Recently viewed">{items.map((p) => <ProductCard key={p.slug} product={p} />)}</Shelf>
    </section>
  )
}
