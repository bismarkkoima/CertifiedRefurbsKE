import { findProduct } from '@/lib/catalog'
import ProductClient from './ProductClient'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const p = findProduct(slug)
  if (!p) return { title: 'Refurbished device' }
  return {
    title: `Refurbished ${p.brand} ${p.name} ${p.storage}`,
    description: `${p.brand} ${p.name} (${p.subtitle}) certified refurbished from KSh ${p.price_from.toLocaleString()}. 6-month warranty, free returns and M-Pesa escrow.`,
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params
  return <ProductClient slug={slug} />
}
