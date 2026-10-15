import Link from 'next/link'
import { notFound } from 'next/navigation'
import BrandMark from '@/components/BrandMark'
import ProductRail from '@/components/ProductRail'
import { PRODUCTS } from '@/lib/catalog'
import { BRANDS, CATEGORIES, brandFromSlug, brandSlug } from '@/lib/format'

export function generateStaticParams() {
  return [...new Set(PRODUCTS.map((p) => p.brand))].map((b) => ({ slug: brandSlug(b) }))
}

export async function generateMetadata({ params }) {
  const brand = brandFromSlug((await params).slug)
  return brand
    ? { title: `Refurbished ${brand}`, description: `Certified refurbished ${brand} devices — ${BRANDS[brand]?.tagline} 6-month warranty and M-Pesa escrow.` }
    : { title: 'Brand' }
}

export default async function BrandPage({ params }) {
  const brand = brandFromSlug((await params).slug)
  if (!brand) notFound()
  const cats = Object.keys(CATEGORIES).filter((c) => PRODUCTS.some((p) => p.brand === brand && p.category === c))
  return (
    <>
      <section className="brand-hero">
        <div className="container">
          <nav className="crumbs" style={{ justifyContent: 'center' }} aria-label="Breadcrumb"><Link href="/">Store</Link>/<Link href="/brands">Brands</Link>/<span>{brand}</span></nav>
          <BrandMark name={brand} />
          <p>{BRANDS[brand]?.tagline} Certified refurbished.</p>
          <div className="pill-row" style={{ justifyContent: 'center', marginTop: 22 }}>
            {cats.map((c) => <Link key={c} href={`/shop?brand=${encodeURIComponent(brand)}&category=${c}`} className="pill">{CATEGORIES[c].label}</Link>)}
            <Link href={`/shop?brand=${encodeURIComponent(brand)}`} className="pill active">Shop all {brand}</Link>
          </div>
        </div>
      </section>
      {cats.map((c) => (
        <section className="section-sm" key={c}>
          <div className="container section-head">
            <h2>{CATEGORIES[c].label}. <span className="grey">{CATEGORIES[c].tagline}</span></h2>
            <Link href={`/shop?brand=${encodeURIComponent(brand)}&category=${c}`} className="link link-arrow">See all</Link>
          </div>
          <ProductRail params={{ brand, category: c, sort: 'newest' }} count={12} label={`${brand} ${c}`} />
        </section>
      ))}
    </>
  )
}
