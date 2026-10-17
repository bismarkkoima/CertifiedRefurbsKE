import Link from 'next/link'
import BrandMark from '@/components/BrandMark'
import DeviceArt from '@/components/DeviceArt'
import Icon from '@/components/Icon'
import ProductRail from '@/components/ProductRail'
import RecentlyViewed from '@/components/RecentlyViewed'
import Shelf from '@/components/Shelf'
import { findProduct, listBrands } from '@/lib/catalog'
import { CATEGORIES, brandSlug, ksh } from '@/lib/format'

const CAT_ICONS = [
  ['/shop?category=phones', 'Phones', 'phones', 'iPhone', '#3f4a59'],
  ['/shop?category=laptops', 'Laptops', 'laptops', 'MacBook', '#7d7e80'],
  ['/shop?category=tablets', 'Tablets', 'tablets', 'iPad', '#a6c5dc'],
  ['/shop?category=accessories&q=watch', 'Watches', 'accessories', 'Watch', '#232a31'],
  ['/shop?category=accessories&q=buds', 'Earbuds', 'accessories', 'AirPods', '#f5f5f3'],
  ['/shop?category=accessories&q=WH-', 'Headphones', 'accessories', 'WH-1000XM5', '#1f1f21'],
  ['/shop?category=phones&q=fold', 'Foldables', 'phones', 'Fold', '#b7c7d6'],
  ['/shop?deal=true', 'Deals', 'phones', 'Deal', '#d82e2e'],
]

const TILE_BG = ['bg-lilac', 'bg-mint', 'bg-sun', 'bg-peach', 'bg-sky', 'bg-sand']

const LATEST = [
  { slug: 'apple-iphone-16-pro', eyebrow: 'New in refurbished', title: 'iPhone 16 Pro', copy: 'Camera Control. Titanium. Apple Intelligence.', dark: true },
  { slug: 'samsung-galaxy-s24-ultra', eyebrow: 'Galaxy AI', title: 'Galaxy S24 Ultra', copy: 'Titanium frame. 200MP. Built-in S Pen.' },
  { slug: 'tecno-camon-30-pro-5g', eyebrow: 'Made for Africa', title: 'Tecno Camon 30 Pro', copy: 'Pro portraits that love every skin tone.' },
  { slug: 'apple-macbook-air-13-m3', eyebrow: 'Lean. Mean.', title: 'MacBook Air M3', copy: 'All-day battery. Fanless. Silent.', dark: true },
  { slug: 'google-pixel-8-pro', eyebrow: 'Helpful AI', title: 'Pixel 8 Pro', copy: 'The all-pro phone engineered by Google.' },
  { slug: 'infinix-zero-30-5g', eyebrow: 'Vlog in 4K', title: 'Infinix Zero 30', copy: '50MP 4K selfie camera. 144Hz curved AMOLED.' },
  { slug: 'samsung-galaxy-z-fold5', eyebrow: 'Unfold more', title: 'Galaxy Z Fold5', copy: 'A tablet that fits in your pocket.', dark: true },
]

const DIFFERENCE = [
  ['🔍', <>72-point inspection. <span className="accent">Every single device.</span></>, 'Engineers test screen, battery, cameras, sensors, network and IMEI before anything is listed.'],
  ['🔒', <>M-Pesa escrow. <span className="accent">Your money stays safe.</span></>, 'We only release payment once you confirm your device arrived exactly as described.'],
  ['🛡️', <>6-month warranty. <span className="accent">On everything.</span></>, 'Free repair or replacement for any hardware fault. 30-day returns, no questions asked.'],
  ['🔁', <>Trade in. <span className="accent">Trade up.</span></>, 'Get an instant quote for your old device and paid straight to M-Pesa — or put it towards a new one.'],
  ['🚚', <>Same-day delivery. <span className="accent">In Nairobi.</span></>, 'Order before 3pm for same-day rider delivery. 1–3 days to all 47 counties.'],
  ['🌍', <>Import for me. <span className="accent">No surprises.</span></>, 'See the full landed cost with KRA duty, VAT and levies before you buy from abroad.'],
]

export default function Store() {
  const brands = listBrands()
  return (
    <>
      <div className="container">
        <section className="hero-bm">
          <div className="hero-main reveal">
            <div className="rings" aria-hidden="true" />
            <span className="eyebrow">Certified refurbished · 22 brands</span>
            <h1 style={{ marginTop: 10 }}>Great tech, kinder prices.</h1>
            <p>Phones, laptops and tablets checked by engineers, backed by a 6-month warranty and paid safely through M-Pesa escrow.</p>
            <div className="hero-cta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/shop?category=phones" className="btn btn-primary btn-lg">Shop smartphones</Link>
              <Link href="/sell" className="btn btn-outline btn-lg">Sell your phone</Link>
            </div>
            <div className="hero-art" aria-hidden="true"><DeviceArt category="phones" name="iPhone 15 Pro" hue={250} color="#3f4a59" view="pair" /></div>
          </div>
          <div className="hero-side">
            <Link href="/shop?brand=Tecno,Infinix,itel" className="promo bg-sun">
              <div className="stripes" aria-hidden="true" />
              <div className="promo-art" aria-hidden="true"><DeviceArt category="phones" name="Camon 30 Pro" hue={90} color="#1d1f26" view="pair" /></div>
              <h3>Tecno, Infinix & itel</h3>
              <p>Big batteries and bright screens from KSh 9,500.</p>
            </Link>
            <Link href="/shop?category=laptops" className="promo bg-mint">
              <div className="stripes" aria-hidden="true" />
              <div className="promo-art" aria-hidden="true"><DeviceArt category="laptops" name="MacBook" hue={215} color="#7d7e80" /></div>
              <h3>Laptops for work & school</h3>
              <p>MacBook, ThinkPad, XPS and more — up to 50% off new.</p>
            </Link>
          </div>
        </section>

        <div className="reassure">
          <div><Icon name="shield" size={22} /><span><strong>6-month warranty</strong><span>On every device</span></span></div>
          <div><Icon name="refresh" size={22} /><span><strong>30-day free returns</strong><span>Change your mind? No problem</span></span></div>
          <div><Icon name="lock" size={22} /><span><strong>M-Pesa escrow</strong><span>Paid out only after delivery</span></span></div>
          <div><Icon name="truck" size={22} /><span><strong>Fast delivery</strong><span>Same day in Nairobi, 47 counties</span></span></div>
        </div>
      </div>

      <section className="section-sm">
        <div className="container section-head"><h2>Shop by category</h2></div>
        <div className="container">
          <nav className="cat-tiles" aria-label="Shop by category">
            {CAT_ICONS.map(([href, label, cat, name, color], i) => (
              <Link href={href} key={label} className={`cat-tile ${TILE_BG[i % TILE_BG.length]}`}>
                <div className="ct-art"><DeviceArt category={cat} name={name} color={color} hue={cat === 'phones' ? 220 : 210} /></div>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="section-sm">
        <div className="container section-head"><h2>New in certified <span className="grey">The latest models, inspected and ready to ship.</span></h2></div>
        <Shelf variant="wide" label="Latest devices">
          {LATEST.map((t) => {
            const p = findProduct(t.slug)
            if (!p) return null
            return (
              <Link href={`/product/${p.slug}`} key={t.slug} className={`tile ${t.dark ? 'dark' : ''}`}>
                <span className="eyebrow">{t.eyebrow}</span>
                <h3>{t.title}</h3>
                <p>{t.copy}</p>
                <p className="tile-price">From {ksh(p.price_from)} · save up to {Math.round((1 - p.price_from / p.new_price) * 100)}%</p>
                <div className="tile-art"><DeviceArt category={p.category} name={p.name} hue={p.hue} color={p.colors[0]?.hex} view="pair" /></div>
              </Link>
            )
          })}
        </Shelf>
      </section>

      <section className="section-sm">
        <div className="container section-head">
          <h2>Shop by brand <span className="grey">Over 20 brands, one trusted store.</span></h2>
          <Link href="/brands" className="link link-arrow">All brands</Link>
        </div>
        <div className="container">
          <div className="brand-grid">
            {brands.slice(0, 12).map((b) => (
              <Link key={b.name} href={`/brand/${brandSlug(b.name)}`} className="brand-tile">
                <BrandMark name={b.name} size={b.name.length > 8 ? 20 : 24} />
                <span className="subtle">{b.count} device{b.count === 1 ? '' : 's'} · from {ksh(b.price_from)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container section-head"><h2>Why buy refurbished with us? <span className="grey">Even more reasons to shop with us.</span></h2></div>
        <Shelf variant="narrow" label="Why shop with us">
          {DIFFERENCE.map(([icon, title, copy], i) => (
            <div className="info-card" key={i}>
              <span className="ic-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </Shelf>
      </section>

      <section className="section-sm">
        <div className="container section-head">
          <h2>iPhone <span className="grey">Every model, every finish.</span></h2>
          <Link href="/shop?brand=Apple&category=phones" className="link link-arrow">Shop iPhone</Link>
        </div>
        <ProductRail params={{ brand: 'Apple', category: 'phones', sort: 'newest' }} count={10} label="iPhone" />
      </section>

      <section className="section-sm">
        <div className="container section-head">
          <h2>Galaxy & Pixel <span className="grey">The best of Android.</span></h2>
          <Link href="/shop?brand=Samsung,Google,OnePlus&category=phones" className="link link-arrow">Shop Android flagships</Link>
        </div>
        <ProductRail params={{ brand: 'Samsung,Google,OnePlus,Xiaomi', category: 'phones', sort: 'newest' }} count={10} label="Android flagships" />
      </section>

      <section className="section-sm">
        <div className="container section-head">
          <h2>Under KSh 30,000 <span className="grey">Tecno, Infinix, itel, Redmi and more.</span></h2>
          <Link href="/shop?category=phones&max_price=30000&sort=price_asc" className="link link-arrow">Shop budget phones</Link>
        </div>
        <ProductRail params={{ category: 'phones', max_price: 30000, sort: 'newest' }} count={12} label="Budget phones" />
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="band dark">
            <div>
              <span className="eyebrow" style={{ color: '#30D158' }}>Lipa na M-Pesa · Escrow protected</span>
              <h2 style={{ marginTop: 10 }}>Pay with M-Pesa. Your money stays safe until your device arrives.</h2>
              <p>Approve the STK push on your phone. We hold the funds in escrow and release them only once you confirm delivery.</p>
              <div style={{ marginTop: 24 }}><Link href="/how-it-works#escrow" className="btn btn-white">How escrow works</Link></div>
            </div>
            <div className="mpesa-steps">
              <div><b>1</b> Choose your device & check out</div>
              <div><b>2</b> Enter your M-Pesa PIN on the prompt</div>
              <div><b>3</b> Funds held securely in escrow</div>
              <div><b>4</b> Confirm delivery → seller gets paid</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container section-head">
          <h2>Mac & laptops <span className="grey">Work smarter for less.</span></h2>
          <Link href="/shop?category=laptops" className="link link-arrow">Shop laptops</Link>
        </div>
        <ProductRail params={{ category: 'laptops' }} count={10} label="Laptops" />
      </section>

      <section className="section-sm">
        <div className="container section-head">
          <h2>Good deals <span className="grey">Hand-picked price drops, refreshed every Friday.</span></h2>
          <Link href="/shop?deal=true" className="link link-arrow">All deals</Link>
        </div>
        <ProductRail params={{ deal: true, sort: 'discount' }} count={10} label="Deals" />
      </section>

      <section className="section-sm">
        <div className="container section-head">
          <h2>Watches & audio <span className="grey">Sound and style, certified.</span></h2>
          <Link href="/shop?category=accessories" className="link link-arrow">Shop wearables</Link>
        </div>
        <ProductRail params={{ category: 'accessories' }} count={10} label="Wearables" />
      </section>

      <RecentlyViewed />

      <section className="section-sm">
        <div className="container section-head"><h2>Help is here <span className="grey">Whenever and however you need it.</span></h2></div>
        <div className="container">
          <div className="feature-grid">
            <Link href="/compare" className="feature" style={{ textDecoration: 'none' }}>
              <div className="feature-icon"><Icon name="compare" size={34} /></div>
              <h3>Compare models</h3>
              <p>Put up to three devices side by side — screen, chip, camera, battery and price.</p>
            </Link>
            <Link href="/sell" className="feature" style={{ textDecoration: 'none' }}>
              <div className="feature-icon">💸</div>
              <h3>Trade in your old phone</h3>
              <p>Instant quote, free pickup in Nairobi, and payment straight to M-Pesa.</p>
            </Link>
            <Link href="/how-it-works#grading" className="feature" style={{ textDecoration: 'none' }}>
              <div className="feature-icon">🏷️</div>
              <h3>Excellent, Good or Fair?</h3>
              <p>Every grade works perfectly. Grades only describe cosmetics and battery health.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container section-head"><h2>All categories <span className="grey">Find exactly what you need.</span></h2></div>
        <div className="container">
          <div className="feature-grid four">
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <Link href={`/shop?category=${key}`} key={key} className="feature" style={{ textDecoration: 'none' }}>
                <h3>{c.label}</h3>
                <p>{c.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
