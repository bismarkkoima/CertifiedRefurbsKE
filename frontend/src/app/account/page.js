'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/Providers'
import { ORDER_STATUS, formatDate, initials, ksh } from '@/lib/format'
import { api } from '@/utils/api'

export default function AccountPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login?next=/account'); return }
    api.myOrders().then(setOrders).catch((e) => setError(e.message))
  }, [user, loading, router])

  if (!user) return <div className="container section"><div className="skeleton" style={{ height: 300 }} /></div>

  return (
    <div className="container section-sm">
      <div className="row" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="avatar" style={{ background: 'var(--accent)', width: 56, height: 56, fontSize: 20 }}>{initials(user.full_name)}</span>
          <div>
            <h1 style={{ fontSize: 28 }}>Hi, {user.full_name.split(' ')[0]}</h1>
            <p className="muted">{user.email}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {user.is_admin && <Link href="/admin" className="btn btn-dark btn-sm">Admin dashboard</Link>}
          <button className="btn btn-outline btn-sm" onClick={() => { logout(); router.push('/') }}>Sign out</button>
        </div>
      </div>

      <h2 style={{ fontSize: 22, marginBottom: 14 }}>Your orders</h2>
      {error && <p className="form-error">{error}</p>}
      {orders === null && !error && <div className="skeleton" style={{ height: 160 }} />}
      {orders?.length === 0 && (
        <div className="empty-state card">
          <div className="big">📦</div>
          <h2>No orders yet</h2>
          <p>When you buy a device, you’ll be able to track it here.</p>
          <Link href="/shop" className="btn btn-primary">Start shopping</Link>
        </div>
      )}
      {orders?.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Escrow</th><th /></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.number}>
                  <td><strong>{o.number}</strong></td>
                  <td>{formatDate(o.created_at)}</td>
                  <td>{o.items.map((i) => i.product_name).join(', ')}</td>
                  <td>{ksh(o.total)}</td>
                  <td><span className={`status-pill ${o.status}`}>{ORDER_STATUS[o.status]}</span></td>
                  <td><span className={`status-pill ${o.escrow_status}`}>{o.escrow_status.replace('_', ' ')}</span></td>
                  <td><Link href={`/orders/${o.number}`} className="link">View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
