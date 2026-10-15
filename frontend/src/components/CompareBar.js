'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCompare } from './Providers'

export default function CompareBar() {
  const { slugs, clear } = useCompare()
  const pathname = usePathname()
  if (!slugs.length || pathname.startsWith('/compare')) return null
  return (
    <div className="compare-bar" role="status">
      {slugs.length} of 3 selected to compare
      <button className="btn btn-sm" style={{ color: '#A1A1A6' }} onClick={clear}>Clear</button>
      <Link href="/compare" className="btn btn-primary btn-sm">Compare</Link>
    </div>
  )
}
