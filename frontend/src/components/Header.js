'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ksh } from '@/lib/format'
import { api } from '@/utils/api'
import { ProductImage } from './DeviceArt'
import Icon from './Icon'
import { useAuth, useCart, useTheme } from './Providers'

const LINKS = [
  ['/', 'Store'],
  ['/shop?category=phones', 'Phones'],
  ['/shop?category=laptops', 'Laptops'],
  ['/shop?category=tablets', 'Tablets'],
  ['/shop?category=accessories', 'Wearables'],
  ['/brands', 'Brands'],
  ['/compare', 'Compare'],
  ['/shop?deal=true', 'Deals'],
  ['/sell', 'Trade In'],
  ['/import', 'Import'],
  ['/how-it-works', 'Support'],
]
const QUICK = [
  ['/shop?brand=Apple&category=phones', 'iPhone'],
  ['/shop?brand=Samsung', 'Samsung Galaxy'],
  ['/shop?brand=Tecno,Infinix,itel', 'Tecno, Infinix & itel'],
  ['/shop?category=phones&max_price=20000', 'Phones under KSh 20,000'],
  ['/shop?category=laptops&brand=Apple', 'MacBook'],
  ['/track', 'Track an order'],
]

function SearchFlyout({ onClose }) {
  const router = useRouter()
  const input = useRef(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    input.current?.focus()
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const t = setTimeout(() => {
      api.listProducts({ q: q.trim(), page_size: 6 }).then((r) => setResults(r.items)).catch(() => setResults([]))
    }, 180)
    return () => clearTimeout(t)
  }, [q])

  const submit = (e) => {
    e.preventDefault()
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop')
    onClose()
  }

  return (
    <>
      <div className="flyout-backdrop" onClick={onClose} />
      <div className="flyout" role="dialog" aria-label="Search">
        <div className="container" style={{ maxWidth: 760 }}>
          <form className="flyout-search" onSubmit={submit} role="search">
            <Icon name="search" size={24} />
            <label htmlFor="flyout-q" className="sr-only">Search the store</label>
            <input id="flyout-q" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search CertifiedRefurbs" autoComplete="off" />
          </form>
          {results.length > 0 ? (
            <>
              <p className="flyout-label">Suggested devices</p>
              <ul className="flyout-list">
                {results.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/product/${p.slug}`} onClick={onClose}>
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
              <p className="flyout-label">{q.trim() ? 'No devices found — try a brand or model' : 'Quick links'}</p>
              <ul className="flyout-list">
                {QUICK.map(([href, label]) => (
                  <li key={href}><Link href={href} onClick={onClose}><Icon name="arrow" size={14} /> {label}</Link></li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function Header() {
  const pathname = usePathname()
  const { count } = useCart()
  const { user } = useAuth()
  const { theme, toggle } = useTheme()
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  useEffect(() => { setMenu(false); setSearch(false) }, [pathname])

  return (
    <header>
      <nav className="nav" aria-label="Main">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo" aria-label="CertifiedRefurbs KE home">
            <span className="nav-logo-mark">✓</span>
            <span className="hide-sm">Certified<span className="dot">.</span>Refurbs</span>
          </Link>
          <div className="nav-links">
            {LINKS.map(([href, label]) => (
              <Link key={href} href={href} className={pathname === href ? 'active' : ''}>{label}</Link>
            ))}
          </div>
          <div className="nav-actions">
            <button className="icon-btn" onClick={() => setSearch((s) => !s)} aria-label="Search" aria-expanded={search}><Icon name="search" size={17} /></button>
            <button className="icon-btn hide-sm" onClick={toggle} aria-label="Toggle dark mode"><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} /></button>
            <Link href={user ? (user.is_admin ? '/admin' : '/account') : '/login'} className="icon-btn" aria-label="Account"><Icon name="user" size={17} /></Link>
            <Link href="/cart" className="icon-btn" aria-label={`Bag, ${count} items`}>
              <Icon name="bag" size={18} />
              {count > 0 && <span className="badge-count">{count}</span>}
            </Link>
            <button className="icon-btn menu-toggle" onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" size={18} /></button>
          </div>
        </div>
      </nav>
      {search && <SearchFlyout onClose={() => setSearch(false)} />}
      <div className="ribbon">
        Pay with M-Pesa — your money stays in escrow until your device arrives. <Link href="/how-it-works#escrow" className="link-arrow">Learn more</Link>
      </div>

      {menu && (
        <div className="mobile-menu" role="dialog" aria-label="Menu">
          <div className="mobile-menu-head">
            <button className="icon-btn" onClick={() => setMenu(false)} aria-label="Close menu"><Icon name="x" size={20} /></button>
          </div>
          <nav>
            {LINKS.map(([href, label]) => <Link key={href} href={href} onClick={() => setMenu(false)}>{label}</Link>)}
          </nav>
          <nav className="small" style={{ marginTop: 24 }}>
            <Link href="/cart">Bag ({count})</Link>
            <Link href="/wishlist">Favourites</Link>
            <Link href={user ? '/account' : '/login'}>{user ? 'Account' : 'Sign in'}</Link>
            {user?.is_admin && <Link href="/admin">Admin</Link>}
            <Link href="/track">Track an order</Link>
            <a href="#" onClick={(e) => { e.preventDefault(); toggle() }}>{theme === 'dark' ? 'Light' : 'Dark'} appearance</a>
          </nav>
        </div>
      )}
    </header>
  )
}
