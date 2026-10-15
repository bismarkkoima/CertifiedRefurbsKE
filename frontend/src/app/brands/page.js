import Link from 'next/link'
import BrandMark from '@/components/BrandMark'
import { listBrands } from '@/lib/catalog'
import { BRANDS, CATEGORIES, brandSlug, ksh } from '@/lib/format'

export const metadata = { title: 'All brands', description: 'Shop certified refurbished devices from Apple, Samsung, Google, Tecno, Infinix, itel, Xiaomi, Oppo, Vivo and more.' }

export default function BrandsPage() {
  const brands = listBrands()
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{brands.length} brands</span>
          <h1>Every brand you love. One store you can trust.</h1>
          <p>From iPhone and Galaxy to Tecno, Infinix and itel — every device certified, graded and backed by our warranty.</p>
        </div>
      </section>
      <section className="container section-sm">
        <div className="brand-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {brands.map((b) => (
            <Link key={b.name} href={`/brand/${brandSlug(b.name)}`} className="brand-tile" style={{ minHeight: 180 }}>
              <BrandMark name={b.name} size={28} />
              <span className="muted" style={{ fontSize: 14, marginTop: 8 }}>{BRANDS[b.name]?.tagline}</span>
              <span className="subtle">
                {b.count} device{b.count === 1 ? '' : 's'} · {b.categories.map((c) => CATEGORIES[c]?.short).join(', ')}<br />From {ksh(b.price_from)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
