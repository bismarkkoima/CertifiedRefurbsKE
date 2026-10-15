'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { api } from '@/utils/api'

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

/* ── Toasts ── */
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((message, link) => {
    const id = Math.random()
    setToasts((t) => [...t.slice(-2), { id, message, link }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            {t.message}
            {t.link && <Link href={t.link.href}>{t.link.label}</Link>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ── Bag (cart) ── */
const CartCtx = createContext(null)
export const useCart = () => useContext(CartCtx)
export const lineKey = (variantId, color) => `${variantId}:${color || ''}`

function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [ready, setReady] = useState(false)
  useEffect(() => { setItems(read('crk_bag', []).filter((i) => i.key)); setReady(true) }, [])
  useEffect(() => { if (ready) write('crk_bag', items) }, [items, ready])

  const value = useMemo(() => {
    const add = (product, variant, color, quantity = 1) => setItems((cur) => {
      const key = lineKey(variant.id, color?.name)
      const existing = cur.find((i) => i.key === key)
      if (existing) {
        return cur.map((i) => (i.key === key ? { ...i, quantity: Math.min(i.quantity + quantity, 5, variant.stock) } : i))
      }
      return [...cur, {
        key, variant_id: variant.id, grade: variant.grade, storage: variant.storage, price: variant.price,
        new_price: variant.new_price, stock: variant.stock, color: color?.name || '', colorHex: color?.hex || null,
        slug: product.slug, name: product.name, brand: product.brand, category: product.category,
        hue: product.hue, image_url: product.image_url || null, quantity,
      }]
    })
    const update = (key, quantity) => setItems((cur) =>
      cur.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(quantity, 5, i.stock)) } : i)))
    const remove = (key) => setItems((cur) => cur.filter((i) => i.key !== key))
    const clear = () => setItems([])
    const count = items.reduce((s, i) => s + i.quantity, 0)
    const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0)
    const savings = items.reduce((s, i) => s + i.quantity * Math.max(i.new_price - i.price, 0), 0)
    return { items, ready, add, update, remove, clear, count, subtotal, savings }
  }, [items, ready])

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

/* ── Saved lists: favourites, compare, recently viewed ── */
function useStoredList(key) {
  const [list, setList] = useState([])
  const [ready, setReady] = useState(false)
  useEffect(() => { setList(read(key, [])); setReady(true) }, [key])
  useEffect(() => { if (ready) write(key, list) }, [key, list, ready])
  return [list, setList]
}

const WishCtx = createContext(null)
export const useWishlist = () => useContext(WishCtx)
const CompareCtx = createContext(null)
export const useCompare = () => useContext(CompareCtx)
const RecentCtx = createContext(null)
export const useRecent = () => useContext(RecentCtx)

function ListsProvider({ children }) {
  const [slugs, setSlugs] = useStoredList('crk_wishlist')
  const [compare, setCompare] = useStoredList('crk_compare')
  const [recent, setRecent] = useStoredList('crk_recent')

  const wish = useMemo(() => ({
    slugs,
    has: (slug) => slugs.includes(slug),
    toggle: (slug) => setSlugs((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug])),
  }), [slugs, setSlugs])

  const cmp = useMemo(() => ({
    slugs: compare,
    has: (slug) => compare.includes(slug),
    toggle: (product) => {
      if (compare.includes(product.slug)) { setCompare(compare.filter((x) => x !== product.slug)); return true }
      if (compare.length >= 3) return false
      setCompare([...compare, product.slug])
      return true
    },
    set: setCompare,
    clear: () => setCompare([]),
  }), [compare, setCompare])

  const rec = useMemo(() => ({
    slugs: recent,
    track: (slug) => setRecent((r) => [slug, ...r.filter((x) => x !== slug)].slice(0, 12)),
  }), [recent, setRecent])

  return (
    <WishCtx.Provider value={wish}>
      <CompareCtx.Provider value={cmp}>
        <RecentCtx.Provider value={rec}>{children}</RecentCtx.Provider>
      </CompareCtx.Provider>
    </WishCtx.Provider>
  )
}

/* ── Auth ── */
const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = read('crk_user', null)
    if (!cached) { setLoading(false); return }
    setUser(cached)
    api.me().then((u) => { setUser(u); write('crk_user', u) })
      .catch((e) => { if (e.status === 401) logout() })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = ({ access_token, user: u }) => {
    try { localStorage.setItem('crk_token', access_token) } catch {}
    write('crk_user', u)
    setUser(u)
    return u
  }
  const logout = () => {
    try { localStorage.removeItem('crk_token'); localStorage.removeItem('crk_user') } catch {}
    setUser(null)
  }
  const value = {
    user, loading, logout,
    login: async (email, password) => save(await api.login({ email, password })),
    register: async (data) => save(await api.register(data)),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

/* ── Theme ── */
const ThemeCtx = createContext(null)
export const useTheme = () => useContext(ThemeCtx)

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || 'light')
  }, [])
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('crk_theme', next) } catch {}
    setTheme(next)
  }
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ListsProvider>
            <CartProvider>{children}</CartProvider>
          </ListsProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
