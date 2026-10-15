'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Icon from '@/components/Icon'

export default function TrackPage() {
  const router = useRouter()
  const [number, setNumber] = useState('')
  const [phone, setPhone] = useState('')
  const submit = (e) => {
    e.preventDefault()
    router.push(`/orders/${number.trim().toUpperCase()}?phone=${encodeURIComponent(phone.trim())}`)
  }
  return (
    <div className="auth-wrap">
      <form className="card auth-card stack" onSubmit={submit}>
        <div>
          <span className="eyebrow"><Icon name="truck" size={14} /> Order tracking</span>
          <h1 style={{ marginTop: 8 }}>Track your order</h1>
          <p className="muted">Enter the order number from your confirmation and the phone number you paid with.</p>
        </div>
        <div className="field"><label htmlFor="num">Order number</label><input id="num" className="input" required placeholder="CRK-XXXXXXX" value={number} onChange={(e) => setNumber(e.target.value)} /></div>
        <div className="field"><label htmlFor="ph">Phone number</label><input id="ph" className="input" required inputMode="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <button className="btn btn-primary btn-lg btn-block">Track order</button>
      </form>
    </div>
  )
}
