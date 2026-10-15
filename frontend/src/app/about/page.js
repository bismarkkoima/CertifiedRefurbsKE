import Link from 'next/link'

export const metadata = { title: 'About us', description: 'CertifiedRefurbs KE makes premium technology affordable and sustainable for every Kenyan.' }

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">About CertifiedRefurbs KE</span>
          <h1>Making premium tech accessible to every Kenyan.</h1>
          <p>We started in Nairobi with a simple idea: buying a refurbished phone shouldn’t feel like a gamble. Today we’re building Kenya’s most trusted marketplace for certified pre-owned technology.</p>
        </div>
      </section>
      <section className="container section">
        <div className="stat-row">
          <div className="stat"><strong>72</strong><span>Inspection checkpoints per device</span></div>
          <div className="stat"><strong>6 mo</strong><span>Warranty on every device</span></div>
          <div className="stat"><strong>30 days</strong><span>Free returns, no questions</span></div>
          <div className="stat"><strong>47</strong><span>Counties we deliver to</span></div>
        </div>
      </section>
      <section className="container section" style={{ paddingTop: 0 }}>
        <div className="prose">
          <h2>Our mission</h2>
          <p>New flagship phones and laptops cost more than many Kenyans earn in months. Meanwhile, perfectly good devices sit unused in drawers across the world. We bridge that gap — sourcing, inspecting and certifying devices so you get flagship quality at a fair price.</p>
          <h2>Trust, built in</h2>
          <p>Kenya’s grey market is full of refurbished devices with fake batteries, hidden faults and blacklisted IMEIs. That’s why every device we sell is tested by engineers, graded transparently and paid for through M-Pesa escrow — so your money is only released when you’re happy.</p>
          <h2 id="impact">Our impact</h2>
          <p>Manufacturing a single smartphone produces around 55kg of CO₂ — most of its lifetime footprint. Giving a device a second life avoids most of that and keeps toxic e-waste out of landfills like Dandora.</p>
          <ul>
            <li>Every device we refurbish extends its useful life by years.</li>
            <li>Devices that can’t be repaired are recycled through NEMA-licensed partners.</li>
            <li>Our trade-in programme pays Kenyans for devices that would otherwise gather dust.</li>
          </ul>
          <p style={{ marginTop: 24 }}><Link href="/shop" className="btn btn-primary">Shop refurbished</Link></p>
        </div>
      </section>
    </>
  )
}
