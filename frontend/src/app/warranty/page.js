import Link from 'next/link'

export const metadata = { title: 'Warranty & returns', description: '6-month warranty and 30-day free returns on every CertifiedRefurbs KE device.' }

export default function Warranty() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Warranty & returns</span>
          <h1>6-month warranty. 30-day returns. Zero stress.</h1>
          <p>If anything goes wrong, we fix it, replace it or refund you — simple as that.</p>
        </div>
      </section>
      <section className="container section">
        <div className="prose">
          <h2>What’s covered</h2>
          <ul>
            <li>Any hardware fault under normal use: battery, display, cameras, speakers, microphones, buttons, charging port and connectivity.</li>
            <li>Battery health falling below 80% within the warranty period.</li>
            <li>Software issues we can’t resolve remotely.</li>
          </ul>
          <h2>What’s not covered</h2>
          <ul>
            <li>Accidental damage such as drops, cracked screens or liquid damage.</li>
            <li>Devices opened or repaired by a third party.</li>
            <li>Cosmetic wear that occurs after delivery.</li>
          </ul>
          <h2>30-day returns</h2>
          <p>Changed your mind? Return any device within 30 days of delivery for a full refund to your M-Pesa. The device should be in the same condition you received it, with any accessories included. Returns are free from Nairobi and via our courier partners countrywide.</p>
          <h2>How to make a claim</h2>
          <p>Send us your order number and a short description of the issue through our <Link href="/contact" className="link">contact page</Link>. We’ll arrange a free pickup and have your repaired or replacement device back within 5 business days.</p>
        </div>
      </section>
    </>
  )
}
