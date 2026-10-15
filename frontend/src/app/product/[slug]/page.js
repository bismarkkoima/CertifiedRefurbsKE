import { findProduct } from '@/lib/catalog'
import ProductClient from './ProductClient'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const p = findProduct(slug)
  if (!p) return { title: 'Refurbished device' }
  return {
    title: `Buy refurbished ${p.brand} ${p.name}`,
    description: `${p.brand} ${p.name} — ${p.tagline} Certified refurbished from KSh ${p.price_from.toLocaleString()} in ${p.storages.join(', ')}. 6-month warranty, free returns and M-Pesa escrow.`,
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params
  return <ProductClient slug={slug} />
}
