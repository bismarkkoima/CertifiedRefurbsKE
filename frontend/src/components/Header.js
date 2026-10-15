'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Icon from './Icon'
import { useAuth, useCart, useTheme, useWishlist } from './Providers'

const LINKS = [
  ['/shop', 'Shop'],
  ['/import', 'Import for me'],
  ['/sell', 'Sell your device'],
  ['/how-it-works', 'How it works'],
  ['/track', 'Track order'],
]

const CATS = [
  ['/shop', 'All devices'],
  ['/shop?category=phones', 'Smartphones'],
  ['/shop?category=laptops', 'Laptops'],
  ['/shop?category=tablets', 'Tablets'],
  ['/shop?category=accessories', 'Wearables & audio'],
  ['/shop?brand=Apple', 'Apple'],
  ['/shop?brand=Samsung', 'Samsung'],
  ['/shop?deal=true', '🔥 Deals of the week'],
]

function SearchBox({ className = '' }) {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  useEffect(() => { setQ(params.get('q') || '') }, [params])
  const submit = (e) => {
    e.preventDefault()
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop')
  }
  return (
    <form className={`nav-search ${className}`} onSubmit={submit} role="search">
      <label className="sr-only" htmlFor={`search-${className}`}>Search devices</label>
      <input id={`search-${className}`} value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Search iPhone 13, MacBook Air, Galaxy S22…" />
      <button type="submit" aria-label="Search"><Icon name="search" size={16} /></button>
    </form>
  )
}

function CatStrip() {
  const pathname = usePathname()
  const params = useSearchParams()
  const current = pathname === '/shop' ? `/shop${params.toString() ? `?${params}` : ''}` : null
  return (
    <div className="cat-strip">
      <div className="container cat-strip-inner">
        {CATS.map(([href, label]) => (
          <Link key={href} href={href}
            className={`cat-tab ${current === href ? 'active' : ''} ${href.includes('deal') ? 'hot' : ''}`}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Header() {
  const pathname = usePathname()
  const { count } = useCart()
  const { slugs } = useWishlist()
  const { user } = useAuth()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [pathname])

  return (
    <header>
      <div className="topbar">
        <strong>Free delivery</strong> in Nairobi over KSh 5,000
        <span className="topbar-sep">·</span><strong>6-month warranty</strong> on every device
        <span className="topbar-extra"><span className="topbar-sep">·</span>Pay with <strong>M-Pesa</strong> — protected by escrow</span>
      </div>
      <nav className="nav" aria-label="Main">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo" aria-label="CertifiedRefurbs KE home">
            <span className="nav-logo-mark">✓</span>
            <span>Certified<span className="dot">.</span>Refurbs</span>
          </Link>
          <Suspense fallback={<div className="nav-search" />}><SearchBox /></Suspense>
          <div className="nav-links">
            {LINKS.map(([href, label]) => (
              <Link key={href} href={href} className={pathname.startsWith(href) ? 'active' : ''}>{label}</Link>
            ))}
          </div>
          <div className="nav-actions">
            <button className="icon-btn" onClick={toggle} aria-label="Toggle dark mode">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <Link href="/wishlist" className="icon-btn hide-sm" aria-label="Wishlist">
              <Icon name="heart" />
              {slugs.length > 0 && <span className="badge-count">{slugs.length}</span>}
            </Link>
            <Link href={user ? (user.is_admin ? '/admin' : '/account') : '/login'} className="icon-btn hide-sm" aria-label="Account">
              <Icon name="user" />
            </Link>
            <Link href="/cart" className="icon-btn primary" aria-label={`Cart, ${count} items`}>
              <Icon name="cart" />
              {count > 0 && <span className="badge-count">{count}</span>}
            </Link>
            <button className="icon-btn menu-toggle" onClick={() => setOpen(true)} aria-label="Open menu">
              <Icon name="menu" />
            </button>
          </div>
        </div>
        <div className="container"><Suspense><SearchBox className="mobile" /></Suspense></div>
        <Suspense><CatStrip /></Suspense>
      </nav>

      {open && (
        <div className="mobile-menu" onClick={() => setOpen(false)}>
          <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-head">
              <span className="nav-logo"><span className="nav-logo-mark">✓</span>Menu</span>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close menu"><Icon name="x" /></button>
            </div>
            {LINKS.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
            <div className="divider" />
            <Link href="/cart">Cart ({count})</Link>
            <Link href="/wishlist">Wishlist ({slugs.length})</Link>
            <Link href={user ? '/account' : '/login'}>{user ? 'My account' : 'Sign in'}</Link>
            {user?.is_admin && <Link href="/admin">Admin dashboard</Link>}
            <div className="divider" />
            <Link href="/about">About us</Link>
            <Link href="/warranty">Warranty & returns</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      )}
    </header>
  )
}
