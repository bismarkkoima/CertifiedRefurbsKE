import { findProduct, listBrands, queryProducts, relatedProducts } from '@/lib/catalog'

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

const token = () => {
  try { return localStorage.getItem('crk_token') } catch { return null }
}

export async function request(path, { method = 'GET', body, params, auth = true } = {}) {
  const url = new URL(`${API_URL}/api/v1${path}`)
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  })
  const headers = { 'Content-Type': 'application/json' }
  const t = auth && token()
  if (t) headers.Authorization = `Bearer ${t}`

  let res
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError('We can’t reach our servers right now. Check your connection and try again.', 0)
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    const detail = data?.detail
    const message = Array.isArray(detail)
      ? detail.map((d) => `${d.loc?.slice(-1)[0] ?? 'field'}: ${d.msg}`).join(' · ')
      : detail || `Request failed (${res.status})`
    throw new ApiError(message, res.status)
  }
  return data
}

// Catalogue reads fall back to the bundled catalogue when the API is offline.
const offline = (fn) => (err) => {
  if (err.status === 0) return fn()
  throw err
}

export const api = {
  listProducts: (params) => request('/listings', { params }).catch(offline(() => queryProducts(params))),
  getProduct: (slug) => request(`/listings/${slug}`).catch(offline(() => {
    const p = findProduct(slug)
    if (!p) throw new ApiError('Product not found', 404)
    return p
  })),
  relatedProducts: (slug) => request(`/listings/${slug}/related`, { params: { limit: 10 } }).catch(offline(() => relatedProducts(slug, 10))),
  brands: () => request('/listings/brands').catch(offline(listBrands)),
  reviews: (slug) => request(`/listings/${slug}/reviews`).catch(offline(() => ({ items: [], average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }))),
  postReview: (slug, body) => request(`/listings/${slug}/reviews`, { method: 'POST', body }),
  validateCoupon: (code, subtotal) => request('/orders/validate-coupon', { method: 'POST', body: { code, subtotal } }),

  createOrder: (body) => request('/orders', { method: 'POST', body }),
  getOrder: (number, phone) => request(`/orders/${number}`, { params: { phone } }),
  myOrders: () => request('/orders/mine'),
  confirmDelivery: (number, phone) => request(`/orders/${number}/confirm-delivery`, { method: 'POST', params: { phone } }),

  stkPush: (order_number, phone) => request('/payments/mpesa/stkpush', { method: 'POST', body: { order_number, phone } }),
  paymentStatus: (id) => request(`/payments/${id}`),

  importQuote: (body) => request('/imports/quote', { method: 'POST', body }),
  importRequest: (body) => request('/imports/requests', { method: 'POST', body }),
  tradeInRequest: (body) => request('/sell/requests', { method: 'POST', body }),

  register: (body) => request('/auth/register', { method: 'POST', body, auth: false }),
  login: (body) => request('/auth/login', { method: 'POST', body, auth: false }),
  me: () => request('/auth/me'),

  newsletter: (email) => request('/site/newsletter', { method: 'POST', body: { email } }),
  contact: (body) => request('/site/contact', { method: 'POST', body }),

  adminStats: () => request('/admin/stats'),
  adminUpdateOrder: (number, status) => request(`/admin/orders/${number}`, { method: 'PATCH', body: { status } }),
  adminProducts: () => request('/admin/products'),
  adminCreateProduct: (body) => request('/admin/products', { method: 'POST', body }),
  adminUpdateProduct: (id, body) => request(`/admin/products/${id}`, { method: 'PATCH', body }),
  adminUpdateVariant: (id, body) => request(`/admin/variants/${id}`, { method: 'PATCH', body }),
  adminCoupons: () => request('/admin/coupons'),
  adminCreateCoupon: (body) => request('/admin/coupons', { method: 'POST', body }),
  adminToggleCoupon: (id) => request(`/admin/coupons/${id}`, { method: 'PATCH' }),
  adminDeleteReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
}
