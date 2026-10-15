export const ksh = (n) => `KSh ${Math.round(Number(n) || 0).toLocaleString('en-KE')}`

export const savePct = (price, was) => (was > price ? Math.round((1 - price / was) * 100) : 0)

export const GRADES = {
  excellent: { label: 'Excellent', blurb: 'Looks like new. No visible scratches from 30cm.', battery: '≥ 95%' },
  good: { label: 'Good', blurb: 'Light signs of use on the body. Flawless screen.', battery: '≥ 89%' },
  fair: { label: 'Fair', blurb: 'Visible micro-scratches. Works perfectly.', battery: '≥ 84%' },
}

export const CATEGORIES = {
  phones: { label: 'Smartphones', short: 'Phones', blurb: 'iPhone, Galaxy, Pixel & more' },
  laptops: { label: 'Laptops', short: 'Laptops', blurb: 'MacBook, ThinkPad, XPS, EliteBook' },
  tablets: { label: 'Tablets', short: 'Tablets', blurb: 'iPad & Galaxy Tab' },
  accessories: { label: 'Wearables & Audio', short: 'Accessories', blurb: 'Watches & earbuds' },
}

export const ORDER_STATUS = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid · in escrow',
  processing: 'Quality check',
  shipped: 'Out for delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
