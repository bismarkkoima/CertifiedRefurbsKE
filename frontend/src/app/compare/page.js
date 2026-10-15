import { Suspense } from 'react'
import CompareClient from './CompareClient'

export const metadata = { title: 'Compare devices', description: 'Compare refurbished phones, laptops and tablets side by side — specs, storage, finishes and prices.' }

export default function ComparePage() {
  return <Suspense><CompareClient /></Suspense>
}
