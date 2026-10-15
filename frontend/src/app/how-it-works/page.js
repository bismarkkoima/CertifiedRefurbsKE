import Link from 'next/link'
import Icon from '@/components/Icon'
import { GRADES } from '@/lib/format'

export const metadata = {
  title: 'How it works — grading, inspection & M-Pesa escrow',
  description: 'How CertifiedRefurbs KE inspects, grades and protects every purchase with M-Pesa escrow, a 6-month warranty and 30-day returns.',
}

const FAQ = [
  ['Is refurbished the same as second-hand?', 'No. Second-hand devices are sold as-is. Every refurbished device we sell is fully tested on 72 points, repaired with quality parts where needed, data-wiped and backed by a 6-month warranty.'],
  ['How does M-Pesa escrow work?', 'When you pay, the money goes into a held escrow balance — not to the seller. It’s only released once you confirm you’ve received your device and it matches the listing. If it doesn’t, you get a full refund.'],
  ['What does the warranty cover?', 'Any hardware fault that isn’t caused by accidental damage or liquid — including battery, screen, cameras, buttons and charging. We repair or replace the device at no cost.'],
  ['Can I return a device if I change my mind?', 'Yes. You have 30 days to return any device for a full refund, no questions asked, as long as it’s in the condition you received it.'],
  ['Are the phones unlocked?', 'Yes. All phones are network-unlocked and work with Safaricom, Airtel and Telkom. We also check every IMEI against global blacklists.'],
  ['Do you deliver outside Nairobi?', 'We deliver to all 47 counties via trusted couriers in 1–3 business days, or you can pick up from our Westlands store.'],
]

export default function HowItWorks() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow"><Icon name="shield" size={14} /> How it works</span>
          <h1>Refurbished, but make it trustworthy.</h1>
          <p>From inspection to doorstep, every step is designed so buying refurbished feels as safe as buying new.</p>
        </div>
      </section>

      <section className="container section">
        <div className="steps-grid">
          {[
            ['Sourced responsibly', 'Devices come from vetted corporate leases, trade-ins and certified international suppliers.'],
            ['72-point inspection', 'Engineers test screens, batteries, cameras, sensors, ports, networks and IMEI status.'],
            ['Graded honestly', 'Each device gets an Excellent, Good or Fair grade with clear cosmetic and battery standards.'],
            ['Delivered & protected', 'Pay via M-Pesa escrow, get it delivered, enjoy 6 months warranty and 30-day returns.'],
          ].map(([t, d]) => <div className="step-card" key={t}><h3>{t}</h3><p>{d}</p></div>)}
        </div>
      </section>

      <section className="container section" id="grading" style={{ paddingTop: 0 }}>
        <div className="section-head"><div><span className="eyebrow">Grading system</span><h2>Know exactly what you’re getting</h2><p>Every grade works perfectly — grades only describe cosmetics and battery health.</p></div></div>
        <div className="grade-table">
          {Object.entries(GRADES).map(([g, info]) => (
            <div className="grade-col" key={g}>
              <span className={`grade grade-${g}`}>{info.label}</span>
              <h3>{info.label}</h3>
              <p className="muted">{info.blurb}</p>
              <ul>
                <li>Battery health {info.battery}</li>
                <li>100% functional, all features tested</li>
                <li>{g === 'excellent' ? 'Pristine screen and body' : g === 'good' ? 'Flawless screen, light body marks' : 'Light screen micro-scratches possible'}</li>
                <li>6-month warranty & 30-day returns</li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="container section-sm" id="escrow">
        <div className="band dark">
          <div>
            <span className="eyebrow" style={{ color: '#7FD4A6' }}>M-Pesa escrow</span>
            <h2 style={{ marginTop: 10 }}>Your money is never at risk.</h2>
            <p>Escrow means we hold your payment safely until you’ve received your device and you’re happy with it. Only then do we release the funds. If something’s wrong, don’t confirm — we’ll make it right or refund you in full.</p>
          </div>
          <div className="mpesa-steps">
            <div><b>1</b> Pay via M-Pesa STK push at checkout</div>
            <div><b>2</b> Funds held in escrow — status visible on your order page</div>
            <div><b>3</b> Device delivered — inspect it at your door</div>
            <div><b>4</b> Tap “release funds” — or raise an issue for a refund</div>
          </div>
        </div>
      </section>

      <section className="container section" id="faq">
        <div className="section-head"><div><span className="eyebrow">FAQ</span><h2>Questions, answered</h2></div></div>
        <div className="faq">
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
        <p className="muted" style={{ marginTop: 20 }}>Still curious? <Link href="/contact" className="link">Talk to our team</Link>.</p>
      </section>
    </>
  )
}
