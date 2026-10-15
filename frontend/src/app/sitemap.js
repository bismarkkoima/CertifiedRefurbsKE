import { PRODUCTS } from '@/lib/catalog'
import { brandSlug } from '@/lib/format'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const PAGES = ['', '/shop', '/brands', '/compare', '/import', '/sell', '/how-it-works', '/about', '/warranty', '/contact', '/track']

export default function sitemap() {
  return [
    ...PAGES.map((p) => ({ url: `${BASE}${p}`, changeFrequency: 'weekly', priority: p ? 0.7 : 1 })),
    ...[...new Set(PRODUCTS.map((p) => p.brand))].map((b) => ({ url: `${BASE}/brand/${brandSlug(b)}`, changeFrequency: 'weekly', priority: 0.7 })),
    ...PRODUCTS.map((p) => ({ url: `${BASE}/product/${p.slug}`, changeFrequency: 'daily', priority: 0.8 })),
  ]
}
