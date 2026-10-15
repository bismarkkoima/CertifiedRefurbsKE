// Offline mirror of the backend catalogue so the storefront still renders when
// the API is unreachable (e.g. a static preview deploy). Kept in step with
// backend/app/db/seed.py and backend/app/services/pricing.py.
import raw from '@/data/catalog.json'

const MULT = { excellent: 1, good: 0.92, fair: 0.84 }
const STOCK = { excellent: 6, good: 9, fair: 4 }
const BATTERY = { excellent: 95, good: 89, fair: 84 }
const round500 = (v) => Math.floor(v / 500 + 0.5) * 500
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const PRODUCTS = raw.map((item, i) => {
  const variants = ['excellent', 'good', 'fair'].map((grade, g) => ({
    id: i * 3 + g + 1,
    grade,
    price: round500(item.price * MULT[grade]),
    stock: STOCK[grade],
    battery_health: BATTERY[grade],
  }))
  const cheapest = variants[variants.length - 1]
  return {
    ...item,
    id: i + 1,
    slug: slugify(`${item.brand} ${item.name} ${item.storage}`),
    warranty_months: 6,
    variants,
    price_from: cheapest.price,
    best_grade: cheapest.grade,
    in_stock: true,
    created_at: i,
  }
})

const facet = (list, key) => {
  const counts = {}
  list.forEach((p) => { counts[p[key]] = (counts[p[key]] || 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }))
}

const summary = (p, grade) => {
  if (!grade) return p
  const v = p.variants.find((x) => x.grade === grade)
  return { ...p, price_from: v.price, best_grade: grade }
}

export function queryProducts(params = {}) {
  const { q, category, brand, storage, grade, min_price, max_price, deal, featured, sort = 'featured' } = params
  const page = Number(params.page) || 1
  const pageSize = Number(params.page_size) || 12
  const terms = (q || '').toLowerCase().split(/\s+/).filter(Boolean)
  const matchQ = (p) => terms.every((t) => `${p.name} ${p.brand} ${p.subtitle} ${p.category}`.toLowerCase().includes(t))

  const byQ = PRODUCTS.filter(matchQ)
  const base = byQ.filter((p) => !category || p.category === category)
  const brands = brand ? brand.split(',') : []
  const storages = storage ? storage.split(',') : []

  let list = base.map((p) => summary(p, grade)).filter((p) =>
    (!brands.length || brands.includes(p.brand)) &&
    (!storages.length || storages.includes(p.storage)) &&
    (min_price == null || min_price === '' || p.price_from >= Number(min_price)) &&
    (max_price == null || max_price === '' || p.price_from <= Number(max_price)) &&
    (deal == null || String(p.deal) === String(deal)) &&
    (featured == null || String(p.featured) === String(featured)))

  const sorters = {
    featured: (a, b) => b.featured - a.featured || b.reviews_count - a.reviews_count,
    price_asc: (a, b) => a.price_from - b.price_from,
    price_desc: (a, b) => b.price_from - a.price_from,
    rating: (a, b) => b.rating - a.rating || b.reviews_count - a.reviews_count,
    newest: (a, b) => b.created_at - a.created_at,
    discount: (a, b) => a.price_from / a.new_price - b.price_from / b.new_price,
  }
  list = [...list].sort(sorters[sort] || sorters.featured)

  return {
    items: list.slice((page - 1) * pageSize, page * pageSize),
    total: list.length,
    page,
    pages: Math.max(1, Math.ceil(list.length / pageSize)),
    facets: { brand: facet(base, 'brand'), storage: facet(base, 'storage'), category: facet(byQ, 'category') },
  }
}

export const findProduct = (slug) => PRODUCTS.find((p) => p.slug === slug) || null

export const relatedProducts = (slug, limit = 4) => {
  const p = findProduct(slug)
  if (!p) return []
  return PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id)
    .sort((a, b) => (b.brand === p.brand) - (a.brand === p.brand) || b.rating - a.rating)
    .slice(0, limit)
}

// ── Calculators (instant client-side estimates; the API stores the official quote) ──
const PROFILES = {
  phones: { label: 'Smartphone', weight: 0.6, duty: 0, excise: 0.1 },
  laptops: { label: 'Laptop', weight: 2.5, duty: 0, excise: 0 },
  tablets: { label: 'Tablet', weight: 1, duty: 0, excise: 0 },
  accessories: { label: 'Accessory', weight: 0.4, duty: 0.25, excise: 0 },
}

export function importQuote(priceUsd, category = 'phones', shippingUsd = 0, fx = 129) {
  const p = PROFILES[category] || PROFILES.accessories
  const item = priceUsd * fx
  const freight = Math.max(p.weight * 12, 15) * fx + shippingUsd * fx
  const insurance = item * 0.015
  const cif = item + freight + insurance
  const duty = cif * p.duty
  const excise = (cif + duty) * p.excise
  const vat = (cif + duty + excise) * 0.16
  const idf = cif * 0.025
  const rdl = cif * 0.02
  const service = item * 0.07
  const taxes = duty + excise + vat + idf + rdl
  const lines = [
    ['Item price', item], ['Air freight & handling', freight], ['Transit insurance', insurance],
    ['Import duty', duty], ['Excise duty', excise], ['VAT (16%)', vat],
    ['Import Declaration Fee (2.5%)', idf], ['Railway Development Levy (2%)', rdl],
    ['CertifiedRefurbs service fee', service],
  ].map(([label, amount]) => ({ label, amount: Math.round(amount) })).filter((l) => l.amount > 0)
  return {
    category, category_label: p.label, exchange_rate: fx, item_price_usd: priceUsd, lines,
    cif_value: Math.round(cif), total_taxes: Math.round(taxes),
    total: Math.floor((cif + taxes + service) / 100 + 0.5) * 100, eta_days: '7–12',
  }
}

const TRADE_BASE = { phones: 22000, laptops: 30000, tablets: 16000, accessories: 6000 }
const BRAND = { apple: 1.45, samsung: 1.1, google: 1.05, dell: 1.05, hp: 1, lenovo: 1 }
const CONDITION = { like_new: 1, good: 0.82, worn: 0.62, broken: 0.3 }

export function tradeInQuote({ category, brand, model, storage, condition }) {
  const m = /(\d+)\s*(TB|GB)/i.exec(storage || '')
  const gb = m ? Number(m[1]) * (m[2].toUpperCase() === 'TB' ? 1024 : 1) : 128
  const sf = gb <= 64 ? 0.85 : gb <= 128 ? 1 : gb <= 256 ? 1.12 : 1.25
  const nums = (model.match(/\d+/g) || []).map(Number).filter((n) => n < 100)
  const af = nums.length ? Math.min(Math.max(0.7 + Math.max(...nums) * 0.04, 0.75), 1.9) : 1
  const v = (TRADE_BASE[category] || 6000) * (BRAND[brand.trim().toLowerCase()] ?? 0.9) * sf * af * (CONDITION[condition] ?? 0.6)
  return Math.max(Math.floor(v / 250 + 0.5) * 250, 1000)
}
