'use client'

import { useEffect, useState } from 'react'
import { api } from '@/utils/api'
import ProductCard, { ProductSkeletons } from './ProductCard'

export default function ProductRail({ params, count = 8, empty = 'No devices to show right now.' }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const key = JSON.stringify(params)

  useEffect(() => {
    let live = true
    api.listProducts({ page_size: count, ...params })
      .then((r) => live && setItems(r.items))
      .catch((e) => live && setError(e.message))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, count])

  if (error) return <p className="form-error">{error}</p>
  return (
    <div className="products-grid">
      {items === null ? <ProductSkeletons count={count} /> : items.length === 0 ? <p className="muted">{empty}</p>
        : items.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
