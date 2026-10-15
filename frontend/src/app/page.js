import Link from 'next/link'
import DeviceArt from '@/components/DeviceArt'
import Icon from '@/components/Icon'
import ProductRail from '@/components/ProductRail'
import { CATEGORIES } from '@/lib/format'

const CAT_ART = { phones: 225, laptops: 215, tablets: 205, accessories: 240 }

const REVIEWS = [
  { name: 'Wanjiru M.', where: 'Kilimani, Nairobi', color: '#2B5CE6', device: 'iPhone 13 · Excellent',
    text: 'Honestly couldn’t tell it apart from new. Battery was at 97% and the M-Pesa escrow made me comfortable paying upfront.' },
  { name: 'Brian O.', where: 'Kisumu', color: '#1A7A4A', device: 'ThinkPad X1 Carbon · Good',
    text: 'Delivered to Kisumu in two days. The laptop came with a full inspection report and has been flawless for my design work.' },
  { name: 'Aisha K.', where: 'Nyali, Mombasa', color: '#B45309', device: 'Traded in Galaxy S20',
    text: 'Got a quote in 30 seconds, a rider picked up my old phone and the money hit my M-Pesa the same afternoon.' },
]

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="reveal">
            <span className="eyebrow"><Icon name="shield" size={15} /> Certified · Inspected · Guaranteed</span>
            <h1 style={{ marginTop: 14 }}>Premium tech, <em>without the premium price.</em></h1>
            <p className="hero-lead">
              Engineer-certified refurbished iPhones, Galaxys and MacBooks — up to 40% cheaper than new,
              backed by a 6-month warranty and paid safely through M-Pesa escrow.
            </p>
            <div className="hero-cta">
              <Link href="/shop" className="btn btn-primary btn-lg">Shop devices <Icon name="arrow" size={16} /></Link>
              <Link href="/sell" className="btn btn-outline btn-lg">Get cash for your phone</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><strong>25,000+</strong><span>Devices delivered</span></div>
              <div className="hero-stat"><strong>4.8 ★</strong><span>Average rating</span></div>
              <div className="hero-stat"><strong>47</strong><span>Counties served</span></div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-card main">
              <DeviceArt category="phones" name="iPhone 13 Pro" hue={205} />
              <div className="row" style={{ marginTop: 10 }}>
                <div>
                  <div className="product-brand">Apple</div>
                  <strong>iPhone 13 Pro · 256GB</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="product-was">New KSh 110,000</div>
                  <strong className="product-price">KSh 60,000</strong>
                </div>
              </div>
            </div>
            <div className="hero-card chip one"><span className="chip-dot" /> M-Pesa payment received</div>
            <div className="hero-card chip two">🔒 Funds held in escrow</div>
            <div className="hero-card chip three">🔋 Battery 96%</div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="trust-bar">
        <div className="container trust-bar-inner">
          {[
            ['shield', '72-point inspection', 'Every device, by certified engineers'],
            ['refresh', '30-day free returns', 'Change your mind? No problem'],
            ['lock', 'M-Pesa escrow', 'Funds released only on delivery'],
            ['truck', 'Fast delivery', 'Same day in Nairobi, 1–3 days countrywide'],
          ].map(([icon, title, sub]) => (
            <div className="trust-tile" key={title}>
              <div className="trust-icon"><Icon name={icon} /></div>
              <div><strong>{title}</strong><span>{sub}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Shop by category</span>
              <h2>Find your next device</h2>
            </div>
            <Link href="/shop" className="btn btn-outline btn-sm">Browse everything <Icon name="arrow" size={14} /></Link>
          </div>
          <div className="cat-grid">
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <Link href={`/shop?category=${key}`} className="cat-card" key={key}>
                <h3>{c.label}</h3>
                <p>{c.blurb}</p>
                <span className="arrow"><Icon name="arrow" size={14} /></span>
                <DeviceArt category={key} name={key === 'accessories' ? 'Watch' : key} hue={CAT_ART[key]} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Customer favourites</span>
              <h2>Bestsellers this week</h2>
            </div>
            <Link href="/shop?sort=rating" className="link">See top rated →</Link>
          </div>
          <ProductRail params={{ featured: true }} count={8} />
        </div>
      </section>

      {/* MPESA BAND */}
      <section className="section-sm">
        <div className="container">
          <div className="band dark">
            <div>
              <span className="eyebrow" style={{ color: '#7FD4A6' }}>Lipa na M-Pesa · Escrow protected</span>
              <h2 style={{ marginTop: 10 }}>Pay with M-Pesa. Your money stays safe until your device arrives.</h2>
              <p>Approve an STK push on your phone — we hold the funds in escrow and only release them once you confirm your delivery. If anything’s wrong, you get a full refund.</p>
              <div style={{ marginTop: 22 }}><Link href="/how-it-works#escrow" className="btn btn-white">How escrow works</Link></div>
            </div>
            <div className="mpesa-steps">
              <div><b>1</b> Choose your device & check out</div>
              <div><b>2</b> Enter your M-Pesa PIN on the STK prompt</div>
              <div><b>3</b> Funds held securely in escrow</div>
              <div><b>4</b> Confirm delivery → seller gets paid</div>
            </div>
          </div>
        </div>
      </section>

      {/* DEALS */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow" style={{ color: 'var(--red)' }}><Icon name="bolt" size={14} /> Limited stock</span>
              <h2>Deals of the week</h2>
              <p>Hand-picked price drops on devices our engineers love. Refreshed every Friday.</p>
            </div>
            <Link href="/shop?deal=true" className="btn btn-outline btn-sm">All deals <Icon name="arrow" size={14} /></Link>
          </div>
          <ProductRail params={{ deal: true, sort: 'discount' }} count={4} />
        </div>
      </section>

      {/* SERVICES */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">More than a shop</span>
              <h2>Everything tech, one trusted place</h2>
            </div>
          </div>
          <div className="feature-grid">
            <Link href="/import" className="feature" style={{ textDecoration: 'none' }}>
              <div className="feature-icon">🌍</div>
              <h3>Import for me</h3>
              <p>Found a device abroad? Our calculator shows the full landed cost — freight, KRA duty, VAT and levies — before you commit.</p>
              <p className="link" style={{ marginTop: 12 }}>Calculate import cost →</p>
            </Link>
            <Link href="/sell" className="feature" style={{ textDecoration: 'none' }}>
              <div className="feature-icon">💸</div>
              <h3>Sell or trade in</h3>
              <p>Get an instant quote for your old phone or laptop. Free pickup in Nairobi and payment straight to M-Pesa.</p>
              <p className="link" style={{ marginTop: 12 }}>Get a quote →</p>
            </Link>
            <Link href="/how-it-works#grading" className="feature" style={{ textDecoration: 'none' }}>
              <div className="feature-icon">🔍</div>
              <h3>Honest grading</h3>
              <p>Excellent, Good or Fair — every grade is clearly defined with battery health guarantees, so you know exactly what you’re getting.</p>
              <p className="link" style={{ marginTop: 12 }}>See our grades →</p>
            </Link>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">4.8 ★ from 6,000+ reviews</span>
              <h2>Kenyans love buying refurbished</h2>
            </div>
          </div>
          <div className="reviews-grid">
            {REVIEWS.map((r) => (
              <figure className="review" key={r.name}>
                <span className="stars" style={{ fontSize: 15 }}>★★★★★</span>
                <blockquote><p>“{r.text}”</p></blockquote>
                <figcaption className="review-who">
                  <span className="avatar" style={{ background: r.color }}>{r.name[0]}</span>
                  <span><strong>{r.name}</strong><span>{r.where} · {r.device}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm">
        <div className="container">
          <div className="band">
            <div>
              <h2>Better for your wallet. Better for the planet.</h2>
              <p>Every refurbished device saves around 80% of the carbon of making a new one — and keeps e-waste out of Dandora.</p>
            </div>
            <div className="band-actions">
              <Link href="/shop" className="btn btn-white btn-lg">Start shopping</Link>
              <Link href="/about#impact" className="btn btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>Our impact</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
