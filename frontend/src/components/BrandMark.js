'use client'

import { BRANDS } from '@/lib/format'
import { useTheme } from './Providers'

// Styled brand name in text (deliberately not the manufacturers' logos).
export default function BrandMark({ name, size, className = '' }) {
  const { theme } = useTheme()
  const b = BRANDS[name] || {}
  return (
    <span className={`wordmark ${className}`} style={{
      color: theme === 'dark' ? b.dark : b.color, fontSize: size,
      textTransform: b.upper ? 'uppercase' : undefined, letterSpacing: b.spacing,
    }}>{name}</span>
  )
}
