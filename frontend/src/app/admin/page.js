'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAuth, useToast } from '@/components/Providers'
import { ORDER_STATUS, formatDate, ksh } from '@/lib/format'
import { api } from '@/utils/api'

const NEXT = { paid: 'processing', processing: 'shipped', shipped: 'delivered' }

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => api.adminStats().then(setStats).catch((e) => setError(e.message)), [])

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/login?next=/admin')
    else if (!user.is_admin) router.replace('/account')
    else load()
  }, [user, loading, router, load])

  const advance = async (o, status) => {
    try {
      await api.adminUpdateOrder(o.number, status)
      toast(`${o.number} → ${ORDER_STATUS[status]}`)
      load()
    } catch (e) {
      toast(e.message)
    }
  }

  if (!user?.is_admin) return <div className="container section"><div className="skeleton" style={{ height: 300 }} /></div>

  const tiles = stats ? [
    ['Revenue (paid)', ksh(stats.revenue)],
    ['Orders', `${stats.orders} · ${stats.pending_orders} awaiting payment`],
    ['Units in stock', `${stats.units_in_stock} across ${stats.products} listings`],
    ['Customers', stats.customers],
    ['Import requests', stats.import_requests],
    ['Trade-in requests', stats.trade_ins],
  ] : []

  return (
    <div className="container section-sm">
      <div className="section-head">
        <div><span className="eyebrow">Admin</span><h2>Store dashboard</h2></div>
        <button className="btn btn-outline btn-sm" onClick={load}>Refresh</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="stat-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
        {stats ? tiles.map(([l, v]) => <div className="stat" key={l}><span>{l}</span><strong style={{ fontSize: 24 }}>{v}</strong></div>)
          : Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 92 }} />)}
      </div>

      <h3 style={{ fontSize: 20, marginBottom: 12 }}>Recent orders</h3>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Total</th><th>Status</th><th>Escrow</th><th>Actions</th></tr></thead>
          <tbody>
            {stats?.recent_orders.length === 0 && <tr><td colSpan={7} className="muted">No orders yet.</td></tr>}
            {stats?.recent_orders.map((o) => (
              <tr key={o.number}>
                <td><Link href={`/orders/${o.number}`} className="link">{o.number}</Link></td>
                <td>{o.customer_name}<div className="subtle">{o.phone}</div></td>
                <td>{formatDate(o.created_at)}</td>
                <td>{ksh(o.total)}</td>
                <td><span className={`status-pill ${o.status}`}>{ORDER_STATUS[o.status]}</span></td>
                <td><span className={`status-pill ${o.escrow_status}`}>{o.escrow_status.replace('_', ' ')}</span></td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {NEXT[o.status] && <button className="btn btn-primary btn-sm" onClick={() => advance(o, NEXT[o.status])}>Mark {ORDER_STATUS[NEXT[o.status]].toLowerCase()}</button>}
                  {!['completed', 'cancelled'].includes(o.status) && <button className="btn btn-ghost btn-sm" onClick={() => advance(o, 'cancelled')}>Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
