export const ksh = (n) => `KSh ${Math.round(Number(n) || 0).toLocaleString('en-KE')}`

export const savePct = (price, was) => (was > price ? Math.round((1 - price / was) * 100) : 0)

export const GRADES = {
  excellent: { label: 'Excellent', blurb: 'Looks like new. No visible scratches from 30cm.', battery: '≥ 95%' },
  good: { label: 'Good', blurb: 'Light signs of use on the body. Flawless screen.', battery: '≥ 89%' },
  fair: { label: 'Fair', blurb: 'Visible micro-scratches. Works perfectly.', battery: '≥ 84%' },
}

export const CATEGORIES = {
  phones: { label: 'Smartphones', short: 'Phones', blurb: 'Every major brand, from KSh 9,500', title: 'Phones.', tagline: 'Every brand you love. Certified.' },
  laptops: { label: 'Laptops', short: 'Laptops', blurb: 'MacBook, ThinkPad, XPS, ROG', title: 'Laptops.', tagline: 'Work, study and play — for less.' },
  tablets: { label: 'Tablets', short: 'Tablets', blurb: 'iPad, Galaxy Tab, Surface', title: 'Tablets.', tagline: 'Big screens. Smaller prices.' },
  accessories: { label: 'Wearables & Audio', short: 'Wearables', blurb: 'Watches, earbuds, headphones', title: 'Wearables & Audio.', tagline: 'Sound and style, certified.' },
}

// Display styling for brand names. Plain text treatments — not the brands' logos.
export const BRANDS = {
  Apple: { color: '#1D1D1F', dark: '#F5F5F7', tagline: 'iPhone, Mac, iPad, Watch and AirPods.' },
  Samsung: { color: '#1428A0', dark: '#8AA2FF', tagline: 'Galaxy S, Z Fold, Z Flip, A series and Tab.', upper: true, spacing: '.06em' },
  Google: { color: '#4285F4', dark: '#8AB4F8', tagline: 'Pixel phones and Pixel Watch.' },
  Tecno: { color: '#0A5BD8', dark: '#6EA8FF', tagline: 'Camon, Spark, Pova and Phantom.', upper: true },
  Infinix: { color: '#0B7D3E', dark: '#4CD58A', tagline: 'Zero, Note, Hot, GT and Smart.' },
  itel: { color: '#E60012', dark: '#FF6B76', tagline: 'Smart phones at smart prices.' },
  Xiaomi: { color: '#FF6900', dark: '#FF9A4D', tagline: 'Xiaomi, Redmi and Pad.' },
  Oppo: { color: '#1F7A4C', dark: '#5BD39A', tagline: 'Reno and A series.', upper: true },
  Vivo: { color: '#415FFF', dark: '#8EA0FF', tagline: 'V and Y series.' },
  Realme: { color: '#C9A100', dark: '#FFD83D', tagline: 'Number series and C series.' },
  OnePlus: { color: '#EB0029', dark: '#FF5C77', tagline: 'Flagship killers since day one.' },
  Nokia: { color: '#124191', dark: '#7FA3E8', tagline: 'Built to last. Repair-friendly.', upper: true },
  Huawei: { color: '#C7000B', dark: '#FF5A62', tagline: 'P series and nova.', upper: true },
  Honor: { color: '#1D1D1F', dark: '#F5F5F7', tagline: 'Magic, number series and X series.', upper: true },
  Motorola: { color: '#001428', dark: '#9FB7D9', tagline: 'Edge and razr.' },
  Sony: { color: '#1D1D1F', dark: '#F5F5F7', tagline: 'Xperia and award-winning audio.', upper: true, spacing: '.08em' },
  HP: { color: '#0096D6', dark: '#5CC6F5', tagline: 'EliteBook, Spectre and ProBook.' },
  Dell: { color: '#007DB8', dark: '#5EC2F2', tagline: 'XPS, Latitude and Inspiron.', upper: true },
  Lenovo: { color: '#E2231A', dark: '#FF6A62', tagline: 'ThinkPad, IdeaPad, Legion and Tab.' },
  Asus: { color: '#00539B', dark: '#6FA9E6', tagline: 'Zenbook and ROG.', upper: true },
  Acer: { color: '#83B81A', dark: '#A9DE45', tagline: 'Swift and Nitro.' },
  Microsoft: { color: '#5E5E5E', dark: '#C8C8C8', tagline: 'Surface Laptop and Surface Pro.' },
}

export const brandSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
export const brandFromSlug = (slug) => Object.keys(BRANDS).find((b) => brandSlug(b) === slug) || null

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

export const formatDay = (iso) => new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
