import { PRODUCTS } from '@/lib/catalog'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const PAGES = ['', '/shop', '/import', '/sell', '/how-it-works', '/about', '/warranty', '/contact', '/track']

export default function sitemap() {
  return [
    ...PAGES.map((p) => ({ url: `${BASE}${p}`, changeFrequency: 'weekly', priority: p ? 0.7 : 1 })),
    ...PRODUCTS.map((p) => ({ url: `${BASE}/product/${p.slug}`, changeFrequency: 'daily', priority: 0.8 })),
  ]
}
