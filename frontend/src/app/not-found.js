import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container empty-state" style={{ padding: '96px 24px' }}>
      <div className="big">🛰️</div>
      <h2>Page not found</h2>
      <p>The page you’re looking for has been moved, sold out or never existed.</p>
      <div className="hero-cta" style={{ justifyContent: 'center' }}>
        <Link href="/" className="btn btn-outline">Go home</Link>
        <Link href="/shop" className="btn btn-primary">Shop devices</Link>
      </div>
    </div>
  )
}
