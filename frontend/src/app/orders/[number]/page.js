import { Suspense } from 'react'
import OrderClient from './OrderClient'

export const metadata = { title: 'Order status', robots: { index: false } }

export default async function OrderPage({ params }) {
  const { number } = await params
  return (
    <Suspense fallback={<div className="container section"><div className="skeleton" style={{ height: 400 }} /></div>}>
      <OrderClient number={number} />
    </Suspense>
  )
}
