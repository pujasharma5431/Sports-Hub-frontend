import React, { useMemo, useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, User, Search, Menu, X, Plus, Trash, Check, Truck, Package, Clock, ShieldCheck, ChevronRight, LayoutDashboard, Shirt, FileText, ClipboardList, ArrowUpDown, ChevronDown } from 'lucide-react'
import axios from 'axios'
import './App.css'

// API Base URL
const API_URL = 'http://localhost:5001/api'

// --- CONTEXT ---
const CartContext = createContext()

const useCart = () => useContext(CartContext)

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addToCart = (product, size, color, quantity = 1) => {
    const existing = cart.find(item => item.id === product.id && item.size === size && item.color === color)
    if (existing) {
      setCart(cart.map(item => item.id === product.id && item.size === size && item.color === color ? { ...item, quantity: item.quantity + quantity } : item))
    } else {
      setCart([...cart, { ...product, size, color, quantity }])
    }
  }

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const updateQuantity = (index, delta) => {
    setCart(cart.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const clearCart = () => setCart([])

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  )
}

// --- COMPONENTS ---

const Navbar = () => {
  const { cart } = useCart()

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo">ELITE SPORTS HUB</Link>
        <div className="nav-links">
          <NavLink to="/" className="nav-link">Home</NavLink>
          <NavLink to="/shop" className="nav-link">Shop</NavLink>
          <NavLink to="/pages/about" className="nav-link">About</NavLink>
        </div>
        <div className="nav-actions">
          <Link to="/cart" className="btn-ghost" style={{ position: 'relative' }}>
            <ShoppingCart size={22} strokeWidth={2.5} />
            {cart.length > 0 && <span className="badge-cart">{cart.length}</span>}
          </Link>
          <Link to="/admin" className="btn-ghost"><User size={22} strokeWidth={2.5} /></Link>
        </div>
      </div>
    </nav>
  )
}

// --- PAGES ---

const Home = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_URL}/products`).then(res => {
      setProducts(res.data.slice(0, 4))
      setLoading(false)
    })
  }, [])

  return (
    <div className="container">
      <section className="hero">
        <span style={{ color: 'var(--primary-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 }}>New Collection 2026</span>
        <h1 style={{ color: 'var(--text-main)', fontWeight: 800 }}>Engineered for Performance. Styled for Victory.</h1>
        <p style={{ color: 'var(--text-dim)', fontWeight: 600 }}>From the stadium to the streets, we provide the highest quality jerseys for elites. Customized, breathable, and authentic.</p>
        <Link to="/shop" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: 16, borderRadius: 'var(--radius-lg)' }}>SHOP ALL JERSEYS <ChevronRight size={20} strokeWidth={3} /></Link>
      </section>

      <div style={{ marginTop: 80 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800 }}>Featured Jerseys</h2>
          <Link to="/shop" className="nav-link" style={{ fontWeight: 700 }}>View all <ChevronRight size={16} /></Link>
        </div>
        {loading ? <div className="loading"><div className="spinner"></div></div> : (
          <div className="product-grid">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <section style={{ margin: '120px 0', background: 'var(--primary)', color: 'var(--background)', padding: '100px 40px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
        <div className="grid grid-cols-3">
          <div style={{ padding: '0 20px' }}>
            <div style={{ background: 'var(--primary-accent)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <ShieldCheck size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Premium Quality</h3>
            <p style={{ opacity: 0.8, fontWeight: 500 }}>Durable fabrics and professional stitching for professional performance.</p>
          </div>
          <div style={{ padding: '0 20px' }}>
             <div style={{ background: 'var(--primary-accent)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Truck size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Express Delivery</h3>
            <p style={{ opacity: 0.8, fontWeight: 500 }}>Fast delivery throughout Nepal with our advanced landmark tracking system.</p>
          </div>
          <div style={{ padding: '0 20px' }}>
             <div style={{ background: 'var(--primary-accent)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Clock size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Elite Support</h3>
            <p style={{ opacity: 0.8, fontWeight: 500 }}>Our specialist team is always here to assist your elite sporting needs.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

const Shop = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({
    q: '',
    brand: '',
    audience: '',
    size: '',
    player: '',
    sort: 'price-desc',
    inStockOnly: false,
  })

  useEffect(() => {
    axios.get(`${API_URL}/products`).then(res => {
      setProducts(res.data)
      setLoading(false)
    })
  }, [])

  const brandOptions = useMemo(() => {
    const brands = new Set()
    for (const p of products) {
      if (p?.brand) brands.add(p.brand)
    }
    return Array.from(brands).sort((a, b) => a.localeCompare(b))
  }, [products])

  const filtered = useMemo(() => {
    let result = [...products]

    if (filters.q.trim()) {
      const q = filters.q.trim().toLowerCase()
      result = result.filter(p =>
        `${p.name ?? ''} ${p.brand ?? ''} ${p.category ?? ''} ${p.player ?? ''}`.toLowerCase().includes(q)
      )
    }

    if (filters.brand) result = result.filter(p => (p.brand ?? '') === filters.brand)
    if (filters.audience) result = result.filter(p => (p.audience ?? 'Unisex') === filters.audience)
    if (filters.size) {
      result = result.filter(p => {
        const stock = p?.stock ?? {}
        const qty = Number(stock[filters.size] ?? 0)
        return qty > 0
      })
    }
    if (filters.player.trim()) {
      const pq = filters.player.trim().toLowerCase()
      result = result.filter(p => (p.player ?? '').toLowerCase().includes(pq))
    }

    if (filters.inStockOnly) {
      result = result.filter(p => {
        const stock = p?.stock ?? {}
        if (!stock || typeof stock !== 'object') return false
        return Object.values(stock).some(v => Number(v) > 0)
      })
    }

    switch (filters.sort) {
      case 'price-asc':
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        break
      case 'price-desc':
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        break
      case 'name-asc':
        result.sort((a, b) => `${a.name ?? ''}`.localeCompare(`${b.name ?? ''}`))
        break
      default:
        break
    }

    return result
  }, [products, filters])

  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0, whiteSpace: 'nowrap' }}>Elite Collection</h1>
        <div className="filters-shell" style={{ flex: 1, marginTop: 0 }}>
          <div className="filters-search" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              className="filter-input"
              placeholder="Search jerseys..."
              value={filters.q}
              onChange={e => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
          <div className="filters-actions">
            <button
              className="btn btn-outline filters-toggle"
              style={{ padding: '8px 16px' }}
              type="button"
              onClick={() => setFiltersOpen(v => !v)}
            >
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="filters-shell-bottom">
        <div className="filters-sort-wrap">
          <div className="filters-sort">
            <div className="sort-pill">
              <ArrowUpDown size={18} />
              <span>Sort</span>
              <ChevronDown size={18} />
              <select
                className="sort-select"
                value={filters.sort}
                onChange={e => setFilters({ ...filters, sort: e.target.value })}
                aria-label="Sort products"
              >
                <option value="price-desc">Price: High → Low</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="name-asc">Name: A → Z</option>
              </select>
            </div>
          </div>

          <div className="filters-count-below">
            {loading ? '' : `${filtered.length} item${filtered.length === 1 ? '' : 's'}`}
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="filters-panel compact">
          <div className="filters-grid">
            <div className="filter-field">
              <label className="filter-label">Audience</label>
              <select
                className="filter-control"
                value={filters.audience}
                onChange={e => setFilters({ ...filters, audience: e.target.value })}
              >
                <option value="">All</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div className="filter-field">
              <label className="filter-label">Brand</label>
              <select
                className="filter-control"
                value={filters.brand}
                onChange={e => setFilters({ ...filters, brand: e.target.value })}
              >
                <option value="">All</option>
                {brandOptions.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="filter-label">Available Size</label>
              <select
                className="filter-control"
                value={filters.size}
                onChange={e => setFilters({ ...filters, size: e.target.value })}
              >
                <option value="">All Sizes</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="2XL">2XL</option>
              </select>
            </div>

            <div className="filter-field">
              <label className="filter-label">Player</label>
              <input
                className="filter-control"
                placeholder="e.g. Haaland"
                value={filters.player}
                onChange={e => setFilters({ ...filters, player: e.target.value })}
              />
            </div>
          </div>

          <div className="filters-bottom">
            <button
              className={`toggle-chip ${filters.inStockOnly ? 'active' : ''}`}
              onClick={() => setFilters({ ...filters, inStockOnly: !filters.inStockOnly })}
              type="button"
            >
              In stock only
            </button>
          </div>
        </div>
      )}

      {loading ? <div className="loading"><div className="spinner"></div></div> : (
        <div className="product-grid">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()

  return (
    <div className="product-card">
      <div className="product-image-container">
         <img src={product.images[0] || 'https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=300'} className="product-image" alt={product.name} />
      </div>
      <div className="product-info">
        <div className="product-brand">{product.brand}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-footer">
          <div className="price-row">
            <div className="product-price">Rs. {product.price.toLocaleString()}</div>
          </div>
          <div className="action-row">
             <Link to={`/product/${product.id}`} className="btn btn-outline" style={{ padding: '10px' }}>Details</Link>
             <button onClick={() => addToCart(product, 'M', 'Home')} className="btn btn-primary" style={{ padding: '10px' }}>Add Cart</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProductDetail = () => {
  const [product, setProduct] = useState(null)
  const [size, setSize] = useState('M')
  const [color, setColor] = useState('Home')
  const [activeImg, setActiveImg] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' })
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    const id = window.location.pathname.split('/').pop()
    setLoading(true)
    axios.get(`${API_URL}/products/${id}`).then(res => {
      setProduct(res.data)
      const firstAvailableSize = Object.entries(res.data.stock || {}).find(([, qty]) => Number(qty) > 0)?.[0]
      if (firstAvailableSize) setSize(firstAvailableSize)
      const stored = localStorage.getItem(`reviews:${res.data.id}`)
      if (stored) {
        try {
          setReviews(JSON.parse(stored))
        } catch {
          setReviews([])
        }
      } else {
        setReviews([])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner"></div></div>
  if (!product) return <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}><h2>Product not found</h2><Link to="/shop" className="btn btn-primary">Back to Shop</Link></div>

  const sizeOptions = ['S', 'M', 'L', 'XL', '2XL']
  const kitOptions = ['Home', 'Away', 'Third']
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : '4.8'
  
  const displayImages = (product.images || []).filter(img => !/\.heic$/i.test(String(img)))
  const galleryImages = displayImages.length ? displayImages : ['https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=1200']
  const selectedImage = galleryImages[activeImg] || galleryImages[0]

  const saveReview = (e) => {
    e.preventDefault()
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) return

    const newReviews = [
      {
        id: Date.now(),
        name: reviewForm.name.trim(),
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      },
      ...reviews,
    ]
    setReviews(newReviews)
    localStorage.setItem(`reviews:${product.id}`, JSON.stringify(newReviews))
    setReviewForm({ name: '', rating: 5, comment: '' })
  }

  return (
    <div className="container product-detail-page">
      <div className="pd-hero">
        <div className="pd-media-card">
          <img
            src={selectedImage}
            className="pd-main-image"
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=1200'
            }}
          />
          <div className="pd-thumbs">
            {galleryImages.map((img, i) => (
              <button key={i} className={`pd-thumb-btn ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                <img src={img} className="pd-thumb-image" alt={`${product.name} ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="pd-info-card">
          <div className="pd-heading-row">
            <p className="pd-brand">{product.brand || 'Elite Sports Hub'}</p>
            <span className="pd-badge">Bestseller</span>
          </div>
          <h1 className="pd-title" style={{ fontSize: 28, marginBottom: 8, fontWeight: 900 }}>{product.name}</h1>
          <div className="pd-price-rating-row">
            <p className="pd-price">Rs. {product.price.toLocaleString()}</p>
            <div className="pd-rating">
              <span style={{ color: 'var(--accent)' }}>★</span> {avgRating} ({reviews.length || 18} reviews)
            </div>
          </div>
          <p className="pd-description" style={{ marginBottom: 12, fontSize: 13, lineHeight: 1.5 }}>{product.description || 'Experience the elite performance of this authentic jersey, designed with moisture-wicking technology and premium breathable fabrics.'}</p>

          <div className="pd-group">
            <label>
              Choose Size
              <button type="button" className="pd-size-guide">Size Guide</button>
            </label>
            <div className="pd-options">
              {sizeOptions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`pd-chip ${size === s ? 'active' : ''}`}
                  disabled={Number(product.stock?.[s] || 0) <= 0}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pd-group">
            <label>Choose Kit Variation</label>
            <div className="pd-options">
              {kitOptions.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`pd-chip pd-chip-wide ${color === c ? 'active' : ''}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="pd-purchase-grid">
            <div className="pd-qty">
              <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(q => Math.min(Number(product.stock?.[size] || 1), q + 1))}>+</button>
            </div>
            <button className="btn btn-primary pd-add-btn" onClick={() => addToCart(product, size, color, quantity)}>
              ADD TO CART
            </button>
          </div>
          
          <div className="pd-stock" style={{ marginTop: 8, fontSize: 12 }}>
            {Number(product.stock?.[size] || 0) > 0 ? (
              <span>Only {product.stock?.[size]} items left in stock – Order soon!</span>
            ) : (
              <span style={{ color: 'red' }}>Out of stock in this size</span>
            )}
          </div>
          
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 700 }}>
              <Truck size={18} color="var(--primary-accent)" /> 2-3 Day Delivery
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 700 }}>
              <ShieldCheck size={18} color="var(--primary-accent)" /> Genuine Product
            </div>
          </div>
          
        </div>
      </div>

      <div className="pd-bottom-grid">
        <div className="pd-panel">
          <h2>Product Details</h2>
          <p style={{ lineHeight: 1.8, color: 'var(--text-dim)' }}>
            This {product.name} is engineered for performance whether you're on the pitch or cheering from the stands.
            Featuring the latest moisture-management technology to keep you dry and comfortable.
          </p>
          <div className="pd-meta">
            <span><strong>Category</strong> {product.category || 'Jersey'}</span>
            <span><strong>Audience</strong> {product.audience || 'Unisex'}</span>
            {product.player ? <span><strong>Player Edition</strong> {product.player}</span> : null}
            <span><strong>Material</strong> 100% Recycled Polyester</span>
            <span><strong>Care</strong> Machine Wash Cold</span>
          </div>
        </div>

        <div className="pd-panel">
          <h2>Customer Reviews</h2>
          <form className="pd-review-form" onSubmit={saveReview}>
            <div className="pd-review-form-grid">
              <input
                className="form-input"
                placeholder="Full Name"
                value={reviewForm.name}
                required
                onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
              />
              <select
                className="form-input"
                value={reviewForm.rating}
                onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })}
              >
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </div>
            <textarea
              className="form-input"
              rows="3"
              placeholder="What did you think of the quality and fit?"
              value={reviewForm.comment}
              required
              style={{ marginBottom: 16 }}
              onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
            />
            <button className="btn btn-primary" style={{ padding: '12px 32px' }} type="submit">Submit Review</button>
          </form>

          <div className="pd-review-list">
            {reviews.length === 0 ? (
              <p className="empty-review">No reviews yet. Be the first one to share your experience!</p>
            ) : (
              reviews.map(r => (
                <div className="pd-review-card" key={r.id}>
                  <div className="pd-review-head">
                    <span className="pd-review-user">{r.name}</span>
                    <span className="pd-review-rating">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                  </div>
                  <p className="pd-review-text">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, total } = useCart()
  const navigate = useNavigate()
  const deliveryCharge = 170

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      {cart.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40, marginBottom: 20 }}>
          <h1 style={{ margin: 0 }}>Your Shopping Cart</h1>
          <Link to="/shop" className="nav-link" style={{ fontWeight: 700, fontSize: 16 }}>&lsaquo; Continue Shopping</Link>
        </div>
      )}
      
      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <h1 style={{ marginBottom: 20 }}>Your cart is empty</h1>
          <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="cart-page">
          <div className="cart-items-list">
            {cart.map((item, i) => (
              <div key={i} className="cart-item">
                <img 
                  src={item.images?.[0] || 'https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=200'} 
                  className="cart-item-img" 
                  alt={item.name} 
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=200' }}
                />
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <div className="cart-item-meta">
                    <span>Size: {item.size}</span>
                    <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
                    <span>Variation: {item.color || 'Home'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 12 }}>
                    <div className="pd-qty" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                      <button type="button" onClick={() => updateQuantity(i, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(i, 1)}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(i)} className="cart-remove-btn" style={{ margin: 0 }}>
                      <Trash size={14} /> Remove
                    </button>
                  </div>
                </div>
                <div className="cart-item-price-col">
                  <div className="cart-item-price">Rs. {(item.price * item.quantity).toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                    Rs. {item.price.toLocaleString()} each
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary-card">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>Rs. {total.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Charge</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>Rs. {deliveryCharge.toLocaleString()}</span>
            </div>
            
            <div className="summary-total">
              <span className="label">Total Amount</span>
              <span className="value">Rs. {(total + deliveryCharge).toLocaleString()}</span>
            </div>

            <button className="btn btn-primary checkout-btn" onClick={() => navigate('/checkout')}>
              PROCEED TO SECURE CHECKOUT
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', marginTop: 24 }}>
              Secure 256-bit SSL Encrypted Payment
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

const Checkout = () => {
  const { cart, total, clearCart } = useCart()
  const [orderData, setOrderData] = useState({ customer_name: '', phone: '', email: '', district: '', location: '', landmark: '', payment_method: 'COD' })
  const navigate = useNavigate()

  // List of districts in Nepal
  const districts = [
    "Kathmandu", "Lalitpur", "Bhaktapur", "Kaski", "Chitwan", "Morang", "Sunsari", "Jhapa", 
    "Rupandehi", "Banke", "Parsa", "Makwanpur", "Dhanusha", "Kailali", "Kanchanpur",
    "Achham", "Arghakhanchi", "Baglung", "Baitadi", "Bajhang", "Bajura", "Bardiya", "Bhojpur", 
    "Dadeldhura", "Dailekh", "Dang", "Darchula", "Dhading", "Dhankuta", "Dolakha", "Dolpa", "Doti", 
    "Gorkha", "Gulmi", "Humla", "Ilam", "Jajarkot", "Jumla", "Kalikot", "Kapilvastu", "Kavrepalanchok", 
    "Khotang", "Lamjung", "Mahottari", "Manang", "Mugu", "Mustang", "Myagdi", "Nawalpur", "Nuwakot", 
    "Okhaldhunga", "Palpa", "Panchthar", "Parbat", "Pyuthan", "Ramechhap", "Rasuwa", "Rautahat", 
    "Rolpa", "Rukum East", "Rukum West", "Salyan", "Sankhuwasabha", "Saptari", "Sarlahi", "Sindhuli", 
    "Sindhupalchok", "Siraha", "Solukhumbu", "Surkhet", "Syangja", "Tanahu", "Taplejung", "Terhathum", 
    "Udayapur"
  ].sort()

  const handleOrder = async (e) => {
    e.preventDefault()
    if (cart.length === 0) return alert('Your cart is empty')
    try {
      const res = await axios.post(`${API_URL}/orders`, { ...orderData, items: cart, total_amount: total + 170 })
      clearCart()
      navigate('/order-success', { state: { orderId: res.data.id } })
    } catch (err) {
      console.error(err)
      alert('Error placing order')
    }
  }

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* Flattened Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Secure Checkout</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>Step 3 of 3: Payment & Delivery</p>
        </div>
        <div style={{ fontSize: 13, display: 'flex', gap: 16 }}>
          <span style={{ color: '#10b981', fontWeight: 700 }}>● Secure Server</span>
          <span style={{ color: 'var(--text-dim)' }}>Order Ref: #ESH-{Date.now().toString().slice(-6)}</span>
        </div>
      </div>

      <form onSubmit={handleOrder} style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="pd-bottom-grid" style={{ gridTemplateColumns: 'minmax(0, 1.3fr) 1fr', gap: 20, marginTop: 0, alignItems: 'flex-start' }}>
          
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Section 1: Customer Info */}
            <div className="pd-panel" style={{ padding: 22 }}>
              <h2 style={{ fontSize: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16, fontWeight: 800 }}>1. Customer Details</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="form-group">
                  <label style={{ marginBottom: 6, fontSize: 12 }}>Full Name</label>
                  <input 
                    className="form-input" 
                    placeholder="First & Last Name" 
                    required 
                    onChange={e => setOrderData({ ...orderData, customer_name: e.target.value })} 
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                <div className="grid grid-cols-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label style={{ marginBottom: 6, fontSize: 12 }}>Phone Number</label>
                    <input 
                      type="tel"
                      className="form-input" 
                      placeholder="e.g. 9841xxxxxx" 
                      required 
                      onChange={e => setOrderData({ ...orderData, phone: e.target.value })} 
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ marginBottom: 6, fontSize: 12 }}>Email Address</label>
                    <input 
                      type="email"
                      className="form-input" 
                      placeholder="e.g. name@email.com" 
                      required 
                      onChange={e => setOrderData({ ...orderData, email: e.target.value })} 
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Delivery Address */}
            <div className="pd-panel" style={{ padding: 22 }}>
              <h2 style={{ fontSize: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16, fontWeight: 800 }}>2. Delivery Address</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="form-group">
                  <label style={{ marginBottom: 6, fontSize: 12 }}>District</label>
                  <select 
                    className="form-input" 
                    required 
                    onChange={e => setOrderData({ ...orderData, district: e.target.value })}
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="">-- Choose your district --</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label style={{ marginBottom: 6, fontSize: 12 }}>City / Area / Street</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. New Baneshwor, Kathmandu" 
                      required 
                      onChange={e => setOrderData({ ...orderData, location: e.target.value })} 
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ marginBottom: 6, fontSize: 12 }}>Landmark</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. Near Kalanki Temple" 
                      required 
                      onChange={e => setOrderData({ ...orderData, landmark: e.target.value })} 
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16, height: 'fit-content', position: 'sticky', top: 100 }}>
            {/* Section 3: Payment */}
            <div className="pd-panel" style={{ padding: 22 }}>
              <h2 style={{ fontSize: 16, marginBottom: 16, fontWeight: 800 }}>3. Payment Method</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { id: 'COD', label: 'Cash on Delivery', sub: 'Inc. Rs. 170 Charge' },
                  { id: 'QR', label: 'E-Banking QR', sub: 'Secure Mobile Banking' },
                  { id: 'Esewa', label: 'eSewa Wallet', sub: 'Instant Wallet Payment' }
                ].map(pm => (
                  <button 
                    key={pm.id}
                    type="button" 
                    onClick={() => setOrderData({ ...orderData, payment_method: pm.id })} 
                    style={{ 
                      textAlign: 'left', 
                      padding: '12px 16px', 
                      borderRadius: 12, 
                      border: '2px solid',
                      borderColor: orderData.payment_method === pm.id ? 'var(--primary-accent)' : 'var(--border)',
                      background: orderData.payment_method === pm.id ? 'rgba(37, 99, 235, 0.05)' : 'var(--background)',
                      transition: '0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: 13 }}>{pm.label}</span>
                      {orderData.payment_method === pm.id && <Check size={16} color="var(--primary-accent)" />}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{pm.sub}</div>
                  </button>
                ))}
              </div>

              {orderData.payment_method === 'QR' && (
                <div style={{ background: 'var(--background)', border: '1px solid var(--border)', padding: 12, borderRadius: 12, textAlign: 'center', marginTop: 16 }}>
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=EliteSportsHubPay" alt="QR" style={{ borderRadius: 8, marginBottom: 8 }} />
                  <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Scan with Banking or eSewa</p>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 16, marginTop: 24, fontSize: 14, letterSpacing: 1 }}>
                CONFIRM & PAY RS. {(total + 170).toLocaleString()}
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                <ShieldCheck size={14} color="#10b981" />
                <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Secure 256-bit SSL Checkout</span>
              </div>
            </div>

            <div className="pd-panel" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, alignItems: 'center' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Final Grand Total</span>
                <span style={{ color: 'var(--primary-accent)', fontSize: 20 }}>Rs. {(total + 170).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

const OrderSuccess = () => {
  const location = useLocation()
  const orderId = location.state?.orderId || "N/A"

  return (
    <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
      <div className="pd-panel" style={{ maxWidth: 600, margin: '0 auto', padding: 60, borderRadius: 32 }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: '50%', background: '#10b981', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 24px', color: 'white' 
        }}>
          <Check size={40} strokeWidth={3} />
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>Order Placed!</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 18, lineHeight: 1.6, marginBottom: 12 }}>
          Thank you for choosing <span style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Elite Sports Hub</span>. <br/>
          Your order has been received and is being processed.
        </p>
        
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 32, opacity: 0.8 }}>
          ORDER ID: #ESH-{orderId.toString().padStart(6, '0')}
        </p>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 20, marginBottom: 40, border: '1px solid var(--border)' }}>
          <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: 'var(--text-dim)' }}>Estimate Delivery</span>
            <span style={{ fontWeight: 700 }}>2-4 Business Days</span>
          </p>
          <p style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Support</span>
            <span style={{ fontWeight: 700 }}>+977 98xxxxxxx</span>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Link to="/shop" className="btn btn-primary" style={{ padding: '16px', borderRadius: 14 }}>Continue Shopping</Link>
          <Link to="/" className="btn btn-outline" style={{ padding: '16px', borderRadius: 14 }}>Back to Home</Link>
        </div>
      </div>
    </div>
  )
}

// --- ADMIN PAGES ---

const AdminLayout = ({ children }) => (
  <div className="admin-layout">
    <div className="admin-sidebar">
      <h2 className="admin-title">Admin Hub</h2>
      <div className="sidebar-nav">
        <NavLink to="/admin/orders" className="sidebar-link"><ClipboardList size={20} /> Orders</NavLink>
        <NavLink to="/admin/products" className="sidebar-link"><Shirt size={20} /> Products</NavLink>
        <NavLink to="/admin/pages" className="sidebar-link"><FileText size={20} /> Manage Pages</NavLink>
        <Link to="/" className="sidebar-link admin-back-link">&lsaquo; Back to Store</Link>
      </div>
    </div>
    <div className="admin-content">
      {children}
    </div>
  </div>
)

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showInvoice, setShowInvoice] = useState(null)

  useEffect(() => {
    axios.get(`${API_URL}/admin/orders`).then(res => setOrders(res.data))
  }, [])

  const updateStatus = async (id, status) => {
    await axios.put(`${API_URL}/admin/orders/${id}/status`, { status })
    // Refresh to apply sorting naturally if needed, but local update is faster
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
    if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status })
  }

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      // 1. Pending always on top
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
      
      // 2. Dispatched always at bottom
      if (a.status === 'dispatched' && b.status !== 'dispatched') return 1
      if (a.status !== 'dispatched' && b.status === 'dispatched') return -1

      // 3. Otherwise latest first
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [orders])

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>Order Management</h1>
        <p style={{ color: 'var(--text-dim)' }}>Manage your latest requests and generate invoices.</p>
      </div>

      <div className="admin-orders-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map(o => (
              <tr key={o.id} className={`order-row-status-${o.status}`}>
                <td>
                  <button onClick={() => setSelectedOrder(o)} className="btn-link" style={{ fontWeight: 800 }}>
                    #ESH-{o.id.toString().padStart(6, '0')}
                  </button>
                </td>
                <td>
                  <div style={{ fontWeight: 700 }}>{o.customer_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{o.phone}</div>
                </td>
                <td>{o.items.length} items</td>
                <td style={{ fontWeight: 800 }}>Rs. {o.total_amount.toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-${o.status}`}>{o.status}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <select 
                      value={o.status} 
                      onChange={(e) => updateStatus(o.id, e.target.value)} 
                      className="admin-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="pending">Pending</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="done">Done</option>
                      <option value="completed">Completed</option>
                    </select>
                    {o.status === 'done' && (
                      <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setShowInvoice(o)}>
                        Invoice
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content admin-order-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 850 }}>
            <div className="modal-header">
              <h3>Order Details: #ESH-{selectedOrder.id.toString().padStart(6, '0')}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}><X size={20} /></button>
            </div>
            
            <div className="order-details-grid">
              <div className="details-main">
                <div className="details-section">
                  <h4>Delivery Address</h4>
                  <div className="details-box">
                    <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                    <p><strong>Email:</strong> {selectedOrder.email || 'N/A'}</p>
                    <p><strong>District:</strong> {selectedOrder.district || 'N/A'}</p>
                    <p><strong>Location:</strong> {selectedOrder.location}</p>
                    <p><strong>Landmark:</strong> {selectedOrder.landmark || 'N/A'}</p>
                  </div>
                </div>

                <div className="details-section" style={{ marginTop: 24 }}>
                  <h4>Order Items</h4>
                  <div className="details-items-list">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="order-item-detail">
                        <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=100'} alt={item.name} />
                        <div className="item-info">
                          <p className="item-name">{item.name}</p>
                          <p className="item-meta">Size: <strong>{item.size}</strong> | Qty: <strong>{item.quantity}</strong></p>
                          <p className="item-price">Rs. {item.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="details-sidebar">
                <div className="details-box summary">
                  <h4>Summary</h4>
                  <div className="row"><span className="label">Status:</span> <span className={`status-badge status-${selectedOrder.status}`}>{selectedOrder.status}</span></div>
                  <div className="row"><span className="label">Payment:</span> <strong>{selectedOrder.payment_method}</strong></div>
                  <div className="row"><span className="label">Date:</span> <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span></div>
                  <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
                  <div className="total-row"><span>Grand Total:</span> <strong>Rs. {selectedOrder.total_amount.toLocaleString()}</strong></div>
                </div>
                
                <div className="details-actions" style={{ marginTop: 20 }}>
                   <label style={{ fontSize: 12, display: 'block', marginBottom: 8, color: 'var(--text-dim)', fontWeight: 700 }}>Update Stage</label>
                   <select 
                      value={selectedOrder.status} 
                      onChange={(e) => updateStatus(selectedOrder.id, e.target.value)} 
                      className="form-input"
                    >
                      <option value="pending">Pending</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="done">Done</option>
                      <option value="completed">Completed</option>
                    </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal/Printable */}
      {showInvoice && (
        <div className="modal-overlay" onClick={() => setShowInvoice(null)}>
          <div className="modal-content invoice-printable" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, padding: 0 }}>
             <Invoice order={showInvoice} onClose={() => setShowInvoice(null)} />
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const Invoice = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="invoice-container">
      <div className="invoice-header">
        <div className="invoice-top-bar"></div>
        <div className="invoice-row header-main">
          <div className="invoice-logo-section">
             <h2 className="invoice-brand">ELITE <span style={{ color: 'var(--primary-accent)' }}>SPORTS HUB</span></h2>
             <div className="business-details">
                <p><strong>PAN:</strong> 141845067</p>
                <p>Butwal-11 devinagar, sagarmatha path</p>
                <p>Ph: +977 9821952621</p>
             </div>
          </div>
          <div className="invoice-id-section">
             <h1>INVOICE</h1>
             <p className="invoice-id-badge">#INV-{order.id}-{Math.floor(Math.random() * 9000 + 1000)}</p>
             <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
             <p><strong>Status:</strong> {order.status.toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="invoice-billing-grid">
        <div className="billing-col">
          <p className="section-label">BILL TO</p>
          <div className="info-card">
            <h3 className="customer-name">{order.customer_name}</h3>
            <p className="customer-sub">{order.phone}</p>
            <p className="customer-sub">{order.email || 'No Email Provided'}</p>
          </div>
        </div>
        <div className="billing-col">
          <p className="section-label">SHIP TO</p>
          <div className="info-card ship-info">
            <p><strong>District:</strong> {order.district}</p>
            <p><strong>Address:</strong> {order.location}</p>
            <p><strong>Landmark:</strong> {order.landmark || 'None'}</p>
            <p><strong>Method:</strong> {order.payment_method}</p>
          </div>
        </div>
      </div>

      <div className="invoice-table-container">
        <table className="invoice-main-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Product Description</th>
              <th style={{ textAlign: 'center' }}>Size</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>ID: ESH-P{item.id || idx}</div>
                </td>
                <td style={{ textAlign: 'center' }}>{item.size}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>Rs. {item.price.toLocaleString()}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. {(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="invoice-summary-row">
        <div className="summary-empty"></div>
        <div className="summary-details">
           <div className="sum-line"><span className="sum-label">Subtotal</span> <span className="sum-val">Rs. {(order.total_amount - 170).toLocaleString()}</span></div>
           <div className="sum-line"><span className="sum-label">Delivery Charge</span> <span className="sum-val">Rs. 170</span></div>
           <div className="sum-line grand-total-line"><span className="sum-label">TOTAL AMOUNT</span> <span className="sum-val">Rs. {order.total_amount.toLocaleString()}</span></div>
        </div>
      </div>

      <div className="invoice-footer-author">
        <div className="footer-notes">
           <p className="section-label">NOTES & TERMS</p>
           <p>1. Please keep this invoice for any return or exchange claims.</p>
           <p>2. Goods once sold are only exchangeable within 7 days.</p>
        </div>
        <div className="signature-section">
           <div className="sig-line"></div>
           <p>Authorized Signature</p>
        </div>
      </div>

      <div className="invoice-controls no-print">
         <button className="btn btn-outline" style={{ borderRadius: 12 }} onClick={onClose}>Cancel View</button>
         <button className="btn btn-primary" style={{ padding: '14px 32px', borderRadius: 12, fontWeight: 800 }} onClick={handlePrint}>Download PDF / Print</button>
      </div>
    </div>
  )
}

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    price: '',
    description: '',
    category: 'Jersey',
    audience: 'Unisex',
    player: '',
    stock: { S: '', M: '', L: '', XL: '', '2XL': '' },
  })
  const [files, setFiles] = useState([])

  useEffect(() => {
    axios.get(`${API_URL}/products`).then(res => setProducts(res.data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('name', newProduct.name)
    formData.append('brand', newProduct.brand)
    formData.append('price', newProduct.price)
    formData.append('description', newProduct.description)
    formData.append('category', newProduct.category)
    formData.append('audience', newProduct.audience)
    formData.append('player', newProduct.player)
    formData.append(
      'stock',
      JSON.stringify({
        S: Number(newProduct.stock.S || 0),
        M: Number(newProduct.stock.M || 0),
        L: Number(newProduct.stock.L || 0),
        XL: Number(newProduct.stock.XL || 0),
        '2XL': Number(newProduct.stock['2XL'] || 0),
      })
    )
    for (let f of files) formData.append('images', f)

    await axios.post(`${API_URL}/products`, formData)
    setIsModalOpen(false)
    // refresh
    axios.get(`${API_URL}/products`).then(res => setProducts(res.data))
  }

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>Inventory</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Add Product</button>
      </div>
      
      <div className="admin-products-grid">
        {products.map(p => (
           <div key={p.id} className="admin-product-card">
             <img src={p.images[0] || 'https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=400'} className="admin-product-image" />
             <h4 className="admin-product-name">{p.name}</h4>
             <p className="admin-product-price">Rs. {p.price}</p>
           </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content admin-modal-content">
            <div className="modal-header">
              <h3>Add Product</h3>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Close add product form"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-product-form">
              <div className="form-group">
                <label>Name</label>
                <input className="form-input" required onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label>Brand</label>
                  <input className="form-input" placeholder="Optional" onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Price (Rs.)</label>
                  <input className="form-input" type="number" required onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-input" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                  <option value="Jersey">Jersey</option>
                  <option value="Jerseys">Jerseys</option>
                  <option value="Kit">Kit</option>
                  <option value="Training">Training</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" rows="3" onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}></textarea>
              </div>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label>Audience</label>
                  <select className="form-input" value={newProduct.audience} onChange={e => setNewProduct({ ...newProduct, audience: e.target.value })}>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Player (optional)</label>
                  <input className="form-input" placeholder="e.g. Haaland" onChange={e => setNewProduct({ ...newProduct, player: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Size & Stock</label>
                <div className="stock-grid">
                  {['S', 'M', 'L', 'XL', '2XL'].map(size => (
                    <div key={size} className="stock-item">
                      <span>{size}</span>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newProduct.stock[size]}
                        onChange={e =>
                          setNewProduct({
                            ...newProduct,
                            stock: { ...newProduct.stock, [size]: e.target.value },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Images (Front, Back, etc.)</label>
                <input type="file" multiple className="form-input" onChange={e => setFiles(Array.from(e.target.files || []))} />
              </div>
              <div className="flex justify-between modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const DynamicPage = () => {
    const [page, setPage] = useState(null)
    const slug = window.location.pathname.split('/').pop()

    useEffect(() => {
        // Fetch specific page by slug (logic simplified for demo)
        axios.get(`${API_URL}/pages`).then(res => {
            const p = res.data.find(x => x.slug === slug)
            setPage(p)
        })
    }, [slug])

    if (!page) return <div className="loading"><div className="spinner"></div></div>

    return (
        <div className="container" style={{ padding: '80px 0' }}>
            <h1>{page.title}</h1>
            <div style={{ marginTop: 40 }} dangerouslySetInnerHTML={{ __html: page.content }}></div>
        </div>
    )
}

const AdminPages = () => {
    const [pages, setPages] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newPage, setNewPage] = useState({ slug: '', title: '', content: '' })

    useEffect(() => {
        axios.get(`${API_URL}/pages`).then(res => setPages(res.data))
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        await axios.post(`${API_URL}/pages`, newPage)
        setIsModalOpen(false)
        axios.get(`${API_URL}/pages`).then(res => setPages(res.data))
    }

    return (
        <AdminLayout>
            <div className="flex justify-between items-center">
                <h1>Dynamic Pages</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> New Page</button>
            </div>
            <table style={{ width: '100%', marginTop: 32, borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: 12 }}>Title</th>
                        <th style={{ padding: 12 }}>Slug</th>
                        <th style={{ padding: 12 }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {pages.map(p => (
                        <tr key={p.id}>
                            <td style={{ padding: 12 }}>{p.title}</td>
                            <td style={{ padding: 12 }}>/{p.slug}</td>
                            <td style={{ padding: 12 }}>
                                <Link to={`/pages/${p.slug}`} className="nav-link" style={{ color: 'var(--primary-accent)' }}>View &rarr;</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create New Page</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
                            <div className="form-group">
                                <label>Page Title</label>
                                <input className="form-input" required onChange={e => setNewPage({ ...newPage, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Slug (URL Path)</label>
                                <input className="form-input" placeholder="e.g. delivery-info" required onChange={e => setNewPage({ ...newPage, slug: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Content (HTML Supported)</label>
                                <textarea className="form-input" rows="10" required onChange={e => setNewPage({ ...newPage, content: e.target.value })}></textarea>
                            </div>
                            <div className="flex justify-between" style={{ marginTop: 32 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Page</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}

function App() {
  return (
    <CartProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/admin" element={<AdminOrders />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/pages" element={<AdminPages />} />
          <Route path="/pages/:slug" element={<DynamicPage />} />
        </Routes>
      </Router>
    </CartProvider>
  )
}

export default App
