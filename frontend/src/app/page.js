import './globals.css'

const products = [
  { id:1, emoji:'📱', brand:'Apple',   name:'iPhone 13',         storage:'128GB · Midnight',       price:'KSh 52,000', was:'KSh 75,000', save:'31%', rating:'4.7', reviews:842,  condition:'Excellent', condClass:'cond-excellent' },
  { id:2, emoji:'💻', brand:'Apple',   name:'MacBook Air M1',    storage:'8GB · 256GB SSD',        price:'KSh 88,000', was:'KSh 130,000',save:'32%', rating:'4.8', reviews:1204, condition:'Excellent', condClass:'cond-excellent' },
  { id:3, emoji:'📱', brand:'Samsung', name:'Galaxy S21',        storage:'256GB · Phantom Grey',   price:'KSh 38,500', was:'KSh 58,000', save:'34%', rating:'4.5', reviews:613,  condition:'Good',      condClass:'cond-good' },
  { id:4, emoji:'💻', brand:'HP',      name:'EliteBook 840 G7',  storage:'16GB · 512GB SSD · i7',  price:'KSh 62,000', was:'KSh 95,000', save:'35%', rating:'4.6', reviews:389,  condition:'Excellent', condClass:'cond-excellent' },
  { id:5, emoji:'📱', brand:'Samsung', name:'Galaxy S22 Ultra',  storage:'256GB · Phantom Black',  price:'KSh 68,000', was:'KSh 105,000',save:'35%', rating:'4.7', reviews:521,  condition:'Good',      condClass:'cond-good' },
  { id:6, emoji:'💻', brand:'Lenovo',  name:'ThinkPad X1 Carbon',storage:'16GB · 512GB SSD · i5', price:'KSh 55,000', was:'KSh 82,000', save:'33%', rating:'4.5', reviews:276,  condition:'Good',      condClass:'cond-good' },
  { id:7, emoji:'📱', brand:'Apple',   name:'iPhone 12 Pro',     storage:'128GB · Pacific Blue',   price:'KSh 44,500', was:'KSh 65,000', save:'32%', rating:'4.6', reviews:934,  condition:'Fair',      condClass:'cond-fair' },
  { id:8, emoji:'💻', brand:'Dell',    name:'XPS 13',            storage:'16GB · 512GB SSD · i7',  price:'KSh 72,000', was:'KSh 110,000',save:'35%', rating:'4.7', reviews:418,  condition:'Excellent', condClass:'cond-excellent' },
  { id:9, emoji:'📱', brand:'Google',  name:'Pixel 7 Pro',       storage:'128GB · Obsidian',       price:'KSh 46,000', was:'KSh 68,000', save:'32%', rating:'4.6', reviews:312,  condition:'Good',      condClass:'cond-good' },
]

export default function Home() {
  return (
    <>
      <div className="topbar">
        <strong>Free delivery</strong> to Nairobi on orders over KSh 5,000 · <strong>6-month warranty</strong> on every device
      </div>

      <header>
        <nav className="nav">
          <div className="nav-inner">
            <a href="/" className="nav-logo">Certified<span className="dot">.</span>Refurbs KE</a>
            <div className="nav-search">
              <input type="text" placeholder="Search phones, laptops, tablets…" defaultValue="Samsung" />
              <button className="nav-search-btn" aria-label="Search">🔍</button>
            </div>
            <nav className="nav-links">
              <a href="#">Phones</a>
              <a href="#">Laptops</a>
              <a href="#">Tablets</a>
              <a href="#">Sell</a>
            </nav>
            <a href="#" className="nav-cart" aria-label="Cart">🛒</a>
          </div>
        </nav>
        <div className="cat-strip">
          <div className="cat-strip-inner">
            <a href="#" className="cat-tab active">All devices</a>
            <a href="#" className="cat-tab">Smartphones</a>
            <a href="#" className="cat-tab">Laptops</a>
            <a href="#" className="cat-tab">Tablets</a>
            <a href="#" className="cat-tab">Accessories</a>
            <a href="#" className="cat-tab">Deals of the week</a>
          </div>
        </div>
      </header>

      <div className="page-body">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="filter-section">
            <div className="filter-title">Condition <span className="filter-title-chevron">▾</span></div>
            <div className="filter-body">
              <div className="grade-pills">
                <div className="grade-pill active">Excellent</div>
                <div className="grade-pill">Good</div>
                <div className="grade-pill">Fair</div>
              </div>
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-title">Brand <span className="filter-title-chevron">▾</span></div>
            <div className="filter-body">
              {[['Apple','4'],['Samsung','6'],['HP','3'],['Lenovo','2'],['Dell','2'],['Google','1']].map(([b,c]) => (
                <label className="filter-option" key={b}>
                  <input type="checkbox" defaultChecked={b==='Samsung'} />
                  {b}
                  <span className="filter-count">{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-title">Price (KSh) <span className="filter-title-chevron">▾</span></div>
            <div className="filter-body">
              <div className="price-range">
                <input className="price-input" placeholder="Min" defaultValue="10000" />
                <input className="price-input" placeholder="Max" defaultValue="120000" />
              </div>
              <div className="filter-divider" />
              {[['Under 30,000','2'],['30,000–60,000','5'],['60,000–100,000','4'],['Over 100,000','1']].map(([r,c]) => (
                <label className="filter-option" key={r}>
                  <input type="checkbox" />
                  {r}
                  <span className="filter-count">{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-title">Storage <span className="filter-title-chevron">▾</span></div>
            <div className="filter-body">
              {[['128GB','6'],['256GB','5'],['512GB','4'],['1TB','1']].map(([s,c]) => (
                <label className="filter-option" key={s}>
                  <input type="checkbox" />
                  {s}
                  <span className="filter-count">{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-title">Seller rating <span className="filter-title-chevron">▾</span></div>
            <div className="filter-body">
              {[['4★ and above','11'],['3★ and above','14']].map(([r,c]) => (
                <label className="filter-option" key={r}>
                  <input type="checkbox" defaultChecked={r.startsWith('4')} />
                  {r}
                  <span className="filter-count">{c}</span>
                </label>
              ))}
            </div>
          </div>

          <span className="clear-filters">Clear all filters</span>
        </aside>

        {/* MAIN */}
        <main>
          <div className="promo-banner">
            <div className="promo-text">
              <h3>M-Pesa accepted on all orders 📲</h3>
              <p>Pay via Lipa Na M-Pesa · Instant confirmation · Zero extra fees</p>
            </div>
            <a href="#" className="promo-btn">Shop now</a>
          </div>

          <div className="trust-strip">
            <div className="trust-item">✅ 72-point inspection</div>
            <div className="trust-item">✅ 6-month warranty</div>
            <div className="trust-item">✅ 30-day free returns</div>
            <div className="trust-item">✅ Engineer certified</div>
          </div>

          <div className="main-header">
            <div className="results-count"><strong>9 results</strong> for &ldquo;Samsung&rdquo; · All devices</div>
            <div className="sort-row">
              <span className="sort-label">Sort by:</span>
              <select className="sort-select">
                <option>Best match</option>
                <option>Price: low to high</option>
                <option>Price: high to low</option>
                <option>Best rated</option>
                <option>Newest</option>
              </select>
            </div>
          </div>

          <div className="products-grid">
            {products.map(p => (
              <a href="#" className="product-card" key={p.id}>
                <div className="product-thumb">
                  {p.emoji}
                  <span className={`product-condition ${p.condClass}`}>{p.condition}</span>
                  <button className="wishlist-btn" aria-label="Save">🤍</button>
                </div>
                <div className="product-brand">{p.brand}</div>
                <div className="product-name">{p.name}</div>
                <div className="product-storage">{p.storage}</div>
                <div className="product-rating">
                  <span className="stars">★★★★★</span>
                  {p.rating} ({p.reviews.toLocaleString()})
                </div>
                <div className="product-pricing">
                  <div className="product-from">From</div>
                  <div className="product-price">{p.price}</div>
                  <div className="product-was">Was {p.was}</div>
                  <span className="product-save">Save {p.save}</span>
                </div>
                <div className="mpesa-pill">
                  <div className="mpesa-dot"></div>
                  M-Pesa · Free delivery
                </div>
              </a>
            ))}
          </div>

          <div className="pagination">
            <button className="page-btn">‹</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <span style={{padding:'0 4px',color:'var(--text-3)'}}>…</span>
            <button className="page-btn">12</button>
            <button className="page-btn">›</button>
          </div>
        </main>
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-col">
            <h4>CertifiedRefurbs KE</h4>
            <a href="#">About us</a>
            <a href="#">How it works</a>
            <a href="#">Our grading system</a>
            <a href="#">Careers</a>
            <a href="#">Press</a>
          </div>
          <div className="footer-col">
            <h4>Buying</h4>
            <a href="#">Browse all devices</a>
            <a href="#">Smartphones</a>
            <a href="#">Laptops</a>
            <a href="#">Tablets</a>
            <a href="#">Deals</a>
          </div>
          <div className="footer-col">
            <h4>Help & Support</h4>
            <a href="#">Warranty policy</a>
            <a href="#">Returns</a>
            <a href="#">Payment methods</a>
            <a href="#">Track your order</a>
            <a href="#">Contact us</a>
          </div>
          <div className="footer-col">
            <h4>Sell with us</h4>
            <a href="#">Become a seller</a>
            <a href="#">Seller guidelines</a>
            <a href="#">Seller dashboard</a>
            <a href="#">Seller support</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 CertifiedRefurbs KE · Nairobi, Kenya</span>
          <span>Privacy · Terms · Cookies</span>
        </div>
      </footer>
    </>
  )
}