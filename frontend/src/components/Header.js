'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { ksh } from '@/lib/format'
import { api } from '@/utils/api'
import { ProductImage } from './DeviceArt'
import Icon from './Icon'
import { useAuth, useCart, useTheme } from './Providers'

const CATS = [
  ['/shop?deal=true', 'Good deals', 'hot'],
  ['/shop?category=phones', 'Smartphones'],
  ['/shop?brand=Apple&category=phones', 'iPhone'],
  ['/shop?brand=Samsung', 'Samsung Galaxy'],
  ['/shop?brand=Tecno,Infinix,itel', 'Tecno, Infinix & itel'],
  ['/shop?category=laptops', 'Laptops'],
  ['/shop?category=tablets', 'Tablets'],
  ['/shop?category=accessories', 'Watches & audio'],
  ['/brands', 'All brands'],
  ['/compare', 'Compare'],
  ['/sell', 'Sell your device'],
  ['/import', 'Import for me'],
]
const QUICK = [
  ['/shop?brand=Apple&category=phones', 'iPhone'],
  ['/shop?brand=Samsung', 'Samsung Galaxy'],
  ['/shop?brand=Tecno,Infinix,itel', 'Tecno, Infinix & itel'],
  ['/shop?category=phones&max_price=20000', 'Phones under KSh 20,000'],
  ['/shop?category=laptops&brand=Apple', 'MacBook'],
  ['/track', 'Track an order'],
]

function SearchBar({ className = '' }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const box = useRef(null)
  const [q, setQ] = useState(params.get('q') || '')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState([])

  useEffect(() => { setQ(params.get('q') || '') }, [params])
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [])
  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const t = setTimeout(() => {
      api.listProducts({ q: q.trim(), page_size: 6 }).then((r) => setResults(r.items)).catch(() => setResults([]))
    }, 180)
    return () => clearTimeout(t)
  }, [q])

  const submit = (e) => {
    e.preventDefault()
    setOpen(false)
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop')
  }

  return (
    <div className={`searchbar ${className}`} ref={box}>
      <form onSubmit={submit} role="search">
        <Icon name="search" size={18} />
        <label htmlFor={`q-${className}`} className="sr-only">Search devices</label>
        <input id={`q-${className}`} value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)}
          placeholder="What are you looking for? Try “iPhone 13” or “Tecno”" autoComplete="off" />
        <button className="go">Search</button>
      </form>
      {open && (
        <div className="suggest">
          {results.length > 0 ? (
            <>
              <p className="flyout-label">Devices</p>
              <ul className="flyout-list">
                {results.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/product/${p.slug}`} onClick={() => setOpen(false)}>
                      <span className="suggest-art"><ProductImage product={p} /></span>
                      {p.brand} {p.name}
                      <span className="price">From {ksh(p.price_from)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="flyout-label">{q.trim() ? 'No devices found — try a brand or model' : 'Popular searches'}</p>
              <ul className="flyout-list">
                {QUICK.map(([href, label]) => (
                  <li key={href}><Link href={href} onClick={() => setOpen(false)}><Icon name="search" size={14} /> {label}</Link></li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function CatBar() {
  const pathname = usePathname()
  const params = useSearchParams()
  const current = `${pathname}${params.toString() ? `?${params}` : ''}`
  return (
    <div className="catbar">
      <nav className="container catbar-inner" aria-label="Categories">
        {CATS.map(([href, label, cls]) => (
          <Link key={href} href={href} className={`${cls || ''} ${current === href ? 'active' : ''}`}>{label}</Link>
        ))}
      </nav>
    </div>
  )
}

export default function Header() {
  const pathname = usePathname()
  const { count } = useCart()
  const { user } = useAuth()
  const { theme, toggle } = useTheme()
  const [menu, setMenu] = useState(false)
  useEffect(() => { setMenu(false) }, [pathname])

  return (
    <header>
      <div className="topline">
        Pay with M-Pesa · your money stays in escrow until your device arrives · <Link href="/how-it-works#escrow">How it works</Link>
      </div>
      <div className="masthead">
        <div className="container masthead-row">
          <Link href="/" className="nav-logo" aria-label="CertifiedRefurbs KE home">
            <span className="nav-logo-mark">✓</span>
            <span>CertifiedRefurbs</span>
          </Link>
          <Suspense fallback={<div className="searchbar desktop" />}><SearchBar className="desktop" /></Suspense>
          <div className="nav-actions">
            <Link href="/how-it-works" className="btn btn-ghost btn-sm hide-sm" style={{ textDecoration: 'none' }}>Help</Link>
            <button className="icon-btn hide-sm" onClick={toggle} aria-label="Toggle dark mode"><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} /></button>
            <Link href="/wishlist" className="icon-btn hide-sm" aria-label="Favourites"><Icon name="heart" size={19} /></Link>
            <Link href={user ? (user.is_admin ? '/admin' : '/account') : '/login'} className="icon-btn" aria-label="Account"><Icon name="user" size={19} /></Link>
            <Link href="/cart" className="icon-btn" aria-label={`Cart, ${count} items`}>
              <Icon name="cart" size={20} />
              {count > 0 && <span className="badge-count">{count}</span>}
            </Link>
            <button className="icon-btn menu-toggle" onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" size={20} /></button>
          </div>
        </div>
        <div className="container"><Suspense><SearchBar className="mobile" /></Suspense></div>
        <Suspense><CatBar /></Suspense>
      </div>

      {menu && (
        <div className="mobile-menu" role="dialog" aria-label="Menu">
          <div className="mobile-menu-head">
            <button className="icon-btn" onClick={() => setMenu(false)} aria-label="Close menu"><Icon name="x" size={20} /></button>
          </div>
          <nav>
            {CATS.map(([href, label]) => <Link key={href} href={href} onClick={() => setMenu(false)}>{label}</Link>)}
          </nav>
          <nav className="small" style={{ marginTop: 24 }}>
            <Link href="/cart">Cart ({count})</Link>
            <Link href="/wishlist">Favourites</Link>
            <Link href={user ? '/account' : '/login'}>{user ? 'Account' : 'Sign in'}</Link>
            {user?.is_admin && <Link href="/admin">Admin</Link>}
            <Link href="/track">Track an order</Link>
            <Link href="/how-it-works">Help & FAQs</Link>
            <a href="#" onClick={(e) => { e.preventDefault(); toggle() }}>{theme === 'dark' ? 'Light' : 'Dark'} mode</a>
          </nav>
        </div>
      )}
    </header>
  )
}
