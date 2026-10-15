'use client'

import { useEffect, useState } from 'react'
import { api } from '@/utils/api'
import ProductCard, { ProductSkeletons } from './ProductCard'
import Shelf from './Shelf'

// A shelf (or grid) of products fetched from the catalogue API.
export default function ProductRail({ params, count = 8, grid = false, label, empty = 'No devices to show right now.' }) {
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

  if (error) return <div className="container"><p className="form-error">{error}</p></div>
  if (items?.length === 0) return <div className="container"><p className="muted">{empty}</p></div>
  const cards = items === null ? <ProductSkeletons count={grid ? count : 4} /> : items.map((p) => <ProductCard key={p.id} product={p} />)
  if (grid) return <div className="products-grid">{cards}</div>
  return <Shelf label={label}>{cards}</Shelf>
}
