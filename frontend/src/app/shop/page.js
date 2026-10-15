import { Suspense } from 'react'
import ShopClient from './ShopClient'

export const metadata = {
  title: 'Shop refurbished phones, laptops & tablets',
  description: 'Browse certified refurbished iPhones, Samsung Galaxy phones, MacBooks, ThinkPads and iPads with warranty and M-Pesa escrow.',
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container section"><div className="skeleton" style={{ height: 400 }} /></div>}>
      <ShopClient />
    </Suspense>
  )
}
