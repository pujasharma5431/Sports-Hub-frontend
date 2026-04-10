import React, { useMemo, useState, useEffect, useRef, createContext, useContext, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, User, Search, MessageCircle, Menu, X, Plus, Trash, Check, Truck, Package, Clock, ShieldCheck, ChevronRight, LayoutDashboard, Shirt, FileText, ClipboardList, ArrowUpDown, ChevronDown, Edit, Trash2, GripVertical, Sun, Moon, Download, Mail, Phone, Heart, Share2 } from 'lucide-react'
import axios from 'axios'
import './App.css'

// API Base URL
// Backend routes are mounted under `/api/...`
const API_URL = 'https://sports-hub-backend-c1ba.onrender.com/api'

// --- CONTEXT ---
const ThemeContext = createContext()
const useTheme = () => useContext(ThemeContext)
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme')
    const initial = stored || 'dark' // Always start in dark for first-time visitors
    document.documentElement.setAttribute('data-theme', initial)
    return initial
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

const AuthContext = createContext()
const useAuth = () => useContext(AuthContext)
const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('admin_token') === 'admin-secret-token')
  const login = (token) => {
    localStorage.setItem('admin_token', token)
    setIsAdmin(true)
  }
  const logout = () => {
    localStorage.removeItem('admin_token')
    setIsAdmin(false)
  }
  return <AuthContext.Provider value={{ isAdmin, login, logout }}>{children}</AuthContext.Provider>
}

const ProtectedRoute = ({ children }) => {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <AdminLogin />
  return children
}

const CartContext = createContext()
const useCart = () => useContext(CartContext)
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartNotice, setCartNotice] = useState('')
  const addToCart = (product, size, color, quantity = 1) => {
    const existing = cart.find(item => item.id === product.id && item.size === size && item.color === color)
    if (existing) {
      setCart(cart.map(item => item.id === product.id && item.size === size && item.color === color ? { ...item, quantity: item.quantity + quantity } : item))
    } else {
      setCart([...cart, { ...product, size, color, quantity }])
    }
    setCartNotice(`Added ${quantity} x ${product?.name || 'item'} to cart`)
  }
  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index))
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
  const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  useEffect(() => {
    if (!cartNotice) return
    const t = setTimeout(() => setCartNotice(''), 1700)
    return () => clearTimeout(t)
  }, [cartNotice])

  return (
    <CartContext.Provider value={{ cart, cartCount, cartNotice, setCartNotice, addToCart, removeFromCart, updateQuantity, clearCart, total, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  )
}

const AdminLogin = () => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const resp = await axios.post(`${API_URL}/admin/login`, { password })
      login(resp.data.token)
      navigate('/admin')
    } catch (err) {
      setError('Invalid admin password')
    }
  }

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="pd-panel" style={{ width: 400, textAlign: 'center' }}>
        <img src="/logo.png" style={{ height: 80, marginBottom: 20 }} alt="Elite Sports Hub" />
        <h2 style={{ marginBottom: 20 }}>Elite Admin Access</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            className="form-input" 
            placeholder="Enter Admin Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ marginBottom: 12, textAlign: 'center' }}
          />
          {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" style={{ width: '100%' }}>LOG IN TO DASHBOARD</button>
        </form>
      </div>
    </div>
  )
}

// --- COMPONENTS ---

const Navbar = () => {
  const { cartCount } = useCart()
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo">
          <img src="/logo.png" style={{ height: 60, width: 'auto', borderRadius: 8 }} alt="Elite Sports Hub Logo" />
        </Link>
        <div className="nav-links">
          <NavLink to="/shop" className="nav-link">Shop</NavLink>
          <NavLink to="/home" className="nav-link">Home</NavLink>
          <NavLink to="/pages/about" className="nav-link">About</NavLink>
        </div>
        <div className="nav-actions">
          <button onClick={toggleTheme} className="btn-ghost" style={{ padding: 8 }}>
            {theme === 'dark' ? <Sun size={22} strokeWidth={2.5} /> : <Moon size={22} strokeWidth={2.5} />}
          </button>
          <Link to="/cart" className="btn-ghost" style={{ position: 'relative' }}>
            <ShoppingCart size={26} strokeWidth={2.5} />
            {cartCount > 0 && <span className="badge-cart">{cartCount > 99 ? '99+' : cartCount}</span>}
          </Link>
        </div>
      </div>
    </nav>
  )
}

// --- PAGES ---

const Home = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFeatured = useCallback(() => {
    axios.get(`${API_URL}/products`).then(res => {
      const all = res.data
      const featured = all.filter(p => p?.featured)
      setProducts(featured.length ? featured : all.slice(0, 4))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchFeatured()
  }, [fetchFeatured])

  return (
    <div style={{ padding: 0 }}>
      <section className="hero" style={{ background: `linear-gradient(rgba(2, 6, 23, 0.7), rgba(2, 6, 23, 0.7)), url('https://res.cloudinary.com/dhnl3qh1i/image/upload/f_auto,q_auto/v1/pexels-pixabay-274422_ncomtw') center/cover` }}>
        <span style={{ color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 }}>Elite Sports Arena</span>
        <h1>Engineered for Performance.<br/>Styled for Victory.</h1>
        <p>Providing the highest quality, authentic jerseys for Nepal's elite athletes. Designed for breathability, comfort, and professional style.</p>
        <Link to="/shop" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: 16, borderRadius: 'var(--radius-lg)' }}>EXPLORE COLLECTION <ChevronRight size={20} strokeWidth={3} /></Link>
      </section>

      <div className="container" style={{ marginTop: 80 }}>
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

      <section style={{ margin: '120px 0', padding: '160px 40px', textAlign: 'center', background: `linear-gradient(rgba(37, 99, 235, 0.8), rgba(2, 6, 23, 0.9)), url('https://res.cloudinary.com/dhnl3qh1i/image/upload/f_auto,q_auto/v1/pexels-tima-miroshnichenko-6077789_i8jgeu') center/cover`, color: '#fff' }}>
        <h2 style={{ fontSize: 48, fontWeight: 900, marginBottom: 20 }}>Elevate Your Game</h2>
        <p style={{ fontSize: 18, maxWidth: 800, margin: '0 auto 40px', opacity: 0.9, fontWeight: 600 }}>Elite Sports Hub provides the gear you need to dominate. From the basketball court to the high-stakes soccer pitch, we are with you at every step of your journey.</p>
        <Link to="/shop" className="btn btn-primary" style={{ background: '#fff', color: '#000', fontWeight: 900 }}>DISCOVER VANGUARD APPAREL</Link>
      </section>

      <div className="container" style={{ margin: '120px auto' }}>
        <div className="grid grid-cols-3 home-feature-cards" style={{ gap: 40 }}>
          <div className="pd-panel" style={{ textAlign: 'center', padding: 40, border: '1px solid var(--border)' }}>
            <div style={{ background: 'rgba(37, 99, 235, 0.1)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <ShieldCheck size={40} style={{ color: 'var(--primary-accent)' }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Premium Quality</h3>
            <p style={{ color: 'var(--text-dim)', fontWeight: 500, fontSize: 16 }}>Durable fabrics and professional stitching for elite athletic performance.</p>
          </div>
          <div className="pd-panel" style={{ textAlign: 'center', padding: 40, border: '1px solid var(--border)' }}>
             <div style={{ background: 'rgba(37, 99, 235, 0.1)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Truck size={40} style={{ color: 'var(--primary-accent)' }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Express Delivery</h3>
            <p style={{ color: 'var(--text-dim)', fontWeight: 500, fontSize: 16 }}>Fast, reliable delivery throughout Nepal with real-time landmark tracking.</p>
          </div>
          <div className="pd-panel" style={{ textAlign: 'center', padding: 40, border: '1px solid var(--border)' }}>
             <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Clock size={40} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Elite Support</h3>
            <p style={{ color: 'var(--text-dim)', fontWeight: 500, fontSize: 16 }}>Our dedicated support team is available to assist you with every order.</p>
          </div>
        </div>
      </div>

      <section className="hero" style={{ padding: '120px 40px', margin: '120px 0 0', background: `linear-gradient(rgba(2, 6, 23, 0.7), rgba(2, 6, 23, 0.7)), url('https://res.cloudinary.com/dhnl3qh1i/image/upload/f_auto,q_auto/v1/pexels-aleksandar069-3684116_b9dvjb') center/cover`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 24 }}>Ready to Wear the Victory?</h2>
            <Link to="/shop" className="btn btn-primary" style={{ padding: '16px 48px' }}>START SHOPPING NOW</Link>
          </div>
      </section>
    </div>
  )
}

const Shop = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const [featuredPaused, setFeaturedPaused] = useState(false)
  const [visibleCount, setVisibleCount] = useState(24)
  const loadMoreRef = useRef(null)
  const [heroPrevImg, setHeroPrevImg] = useState(null)
  const [heroImg, setHeroImg] = useState(null)
  const [heroFading, setHeroFading] = useState(false)
  const [filters, setFilters] = useState({
    q: '',
    brand: '',
    audience: '',
    size: '',
    player: '',
    sort: 'price-desc',
    inStockOnly: false,
    onSale: false,
  })

  const clearFilters = () => {
    setFilters({
      q: '',
      brand: '',
      audience: '',
      size: '',
      player: '',
      sort: 'price-desc',
      inStockOnly: false,
      onSale: false
    })
  }

  const hasActiveFilters = useMemo(() => {
    return filters.q !== '' || filters.brand !== '' || filters.audience !== '' || 
           filters.size !== '' || filters.player !== '' || filters.inStockOnly || filters.onSale
  }, [filters])

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

    if (filters.onSale) {
      result = result.filter(p => p.discount_price && Number(p.discount_price) > 0)
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

  // Lazy-load products (infinite scroll)
  useEffect(() => {
    // Reset when filters change so user sees top results first
    setVisibleCount(24)
  }, [filters])

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    if (loading) return
    if (visibleCount >= filtered.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting) return
        setVisibleCount((c) => Math.min(filtered.length, c + 36))
      },
      { root: null, rootMargin: '2400px 0px', threshold: 0.01 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [filtered.length, loading, visibleCount])

  const featuredSlides = useMemo(() => {
    const featured = products.filter(p => p?.featured)
    const base = featured.length ? featured : products.slice(0, 4)
    const slides = []
    for (const p of base) {
      const imgs = (p?.images || [])
        .map(x => String(x || ''))
        .filter(Boolean)
        .filter(img => !/\.heic$/i.test(img))
        .slice(0, 4)
      for (let i = 0; i < imgs.length; i++) {
        slides.push({ id: `${p.id || 'p'}-${i}`, product: p, image: imgs[i] })
      }
      if (!imgs.length) {
        slides.push({
          id: `${p.id || 'p'}-fallback`,
          product: p,
          image: 'https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=1400'
        })
      }
    }
    // keep it clean + performant
    return slides.slice(0, 10)
  }, [products])

  useEffect(() => {
    if (featuredIdx > Math.max(0, featuredSlides.length - 1)) setFeaturedIdx(0)
  }, [featuredIdx, featuredSlides.length])

  useEffect(() => {
    if (featuredPaused) return
    if (featuredSlides.length <= 1) return
    const t = setInterval(() => {
      setFeaturedIdx(i => (i + 1) % featuredSlides.length)
    }, 3200)
    return () => clearInterval(t)
  }, [featuredPaused, featuredSlides.length])

  const activeSlide = featuredSlides[featuredIdx] || null
  const activeFeatured = activeSlide?.product || null
  const featuredImage = activeSlide?.image || 'https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=1400'

  // Smooth cross-fade between featured images
  useEffect(() => {
    if (!featuredImage) return
    if (!heroImg) {
      setHeroImg(featuredImage)
      return
    }
    if (featuredImage === heroImg) return

    setHeroPrevImg(heroImg)
    setHeroImg(featuredImage)
    setHeroFading(true)

    const t = setTimeout(() => {
      setHeroPrevImg(null)
      setHeroFading(false)
    }, 650)

    return () => clearTimeout(t)
  }, [featuredImage, heroImg])

  const scrollToProducts = () => {
    const el = document.getElementById('shop-products')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="shop-page">
      <div
        className="shop-feature-hero"
        onMouseEnter={() => setFeaturedPaused(true)}
        onMouseLeave={() => setFeaturedPaused(false)}
        onFocusCapture={() => setFeaturedPaused(true)}
        onBlurCapture={() => setFeaturedPaused(false)}
      >
        <div className="shop-feature-media" aria-hidden="true">
          {heroPrevImg && (
            <img
              src={heroPrevImg}
              alt=""
              className="shop-feature-bg is-prev"
              loading="eager"
            />
          )}
          <img
            src={heroImg || featuredImage}
            alt=""
            className={`shop-feature-bg is-current ${heroFading ? 'fade-in' : ''}`}
            loading="eager"
          />
        </div>
        <div className="shop-feature-overlay" />
        <div className="shop-feature-inner">
          <div className="shop-feature-top">
            <div className="shop-kicker">Featured</div>
            <div className="shop-feature-controls">
              <button
                type="button"
                className="shop-feature-nav"
                onClick={() => setFeaturedIdx(i => (i - 1 + featuredSlides.length) % Math.max(1, featuredSlides.length))}
                aria-label="Previous featured"
              >
                ‹
              </button>
              <button
                type="button"
                className="shop-feature-nav"
                onClick={() => setFeaturedIdx(i => (i + 1) % Math.max(1, featuredSlides.length))}
                aria-label="Next featured"
              >
                ›
              </button>
            </div>
          </div>

          <div className="shop-feature-content">
            <div className="shop-feature-card">
              <h1 className="shop-feature-title">{activeFeatured ? activeFeatured.name : 'Elite Collection'}</h1>
              <p className="shop-feature-subtitle">
                {activeFeatured
                  ? `${activeFeatured.brand ? `${activeFeatured.brand} • ` : ''}${activeFeatured.audience || 'Unisex'} • Premium quality kits`
                  : 'Premium quality kits, fast delivery across Nepal.'}
              </p>

              {activeFeatured && (
                <div className="shop-feature-meta">
                  {activeFeatured.category && <span className="shop-badge">{activeFeatured.category}</span>}
                  <span className="shop-badge">Rs. {(activeFeatured.discount_price || activeFeatured.price || 0).toLocaleString()}</span>
                  {activeFeatured.player && <span className="shop-badge">{activeFeatured.player}</span>}
                </div>
              )}

              <div className="shop-feature-actions">
                <button type="button" className="btn btn-primary shop-now-btn" onClick={scrollToProducts}>
                  Shop Now
                </button>
                {activeFeatured && (
                  <Link to={`/product/${activeFeatured.id}`} className="btn btn-outline shop-view-btn">
                    View Product
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="shop-feature-dots" aria-label="Featured carousel">
            {featuredSlides.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                className={`shop-dot ${idx === featuredIdx ? 'active' : ''}`}
                onClick={() => setFeaturedIdx(idx)}
                aria-label={`Featured item ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 12 }}>
        <div className="shop-toolbar-card">
          <div className="shop-toolbar">
            <div className="filters-search shop-search" style={{ flex: 1 }}>
              <Search size={16} />
              <input
                className="filter-input"
                placeholder="Search by team, brand, category, or player..."
                value={filters.q}
                onChange={e => setFilters({ ...filters, q: e.target.value })}
              />
            </div>

            <div className="shop-toolbar-actions">
              {hasActiveFilters && (
                <button className="btn btn-ghost shop-clear" onClick={clearFilters} type="button">
                  Clear
                </button>
              )}
              <button className="btn btn-outline filters-toggle" type="button" onClick={() => setFiltersOpen(v => !v)}>
                {filtersOpen ? 'Hide Filters' : 'More Filters'}
              </button>
            </div>
          </div>

          <div className="shop-quick-filters">
            <button type="button" className={`shop-chip ${filters.audience === '' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, audience: '' })}>All</button>
            <button type="button" className={`shop-chip ${filters.audience === 'Men' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, audience: 'Men' })}>Men</button>
            <button type="button" className={`shop-chip ${filters.audience === 'Women' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, audience: 'Women' })}>Women</button>
            <button type="button" className={`shop-chip ${filters.audience === 'Kids' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, audience: 'Kids' })}>Kids</button>
            <button type="button" className={`shop-chip ${filters.inStockOnly ? 'active' : ''}`} onClick={() => setFilters({ ...filters, inStockOnly: !filters.inStockOnly })}>In Stock</button>
            <button type="button" className={`shop-chip ${filters.onSale ? 'active sale' : ''}`} onClick={() => setFilters({ ...filters, onSale: !filters.onSale })}>On Sale</button>
          </div>
        </div>

      {filtersOpen && (
        <div className="filters-panel compact" style={{ marginBottom: 24 }}>
          <div className="filters-grid">
            <div className="filter-field">
              <label className="filter-label" style={{ opacity: 0.5 }}>Audience</label>
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
              <label className="filter-label" style={{ opacity: 0.5 }}>Brand</label>
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
              <label className="filter-label" style={{ opacity: 0.5 }}>Available Size</label>
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
              <label className="filter-label" style={{ opacity: 0.5 }}>Player Search</label>
              <input
                className="filter-control"
                placeholder="e.g. Haaland"
                value={filters.player}
                onChange={e => setFilters({ ...filters, player: e.target.value })}
              />
            </div>
          </div>

          <div className="filters-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
                <button
                className={`toggle-chip ${filters.inStockOnly ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, inStockOnly: !filters.inStockOnly })}
                type="button"
                >
                In stock only
                </button>
                <button
                className={`toggle-chip ${filters.onSale ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, onSale: !filters.onSale })}
                type="button"
                style={{ borderColor: filters.onSale ? '#ff4444' : 'var(--border)', color: filters.onSale ? '#ff4444' : 'var(--text-dim)' }}
                >
                On Sale
                </button>
            </div>
            <button 
                type="button" 
                className="btn btn-primary" 
                style={{ padding: '10px 32px', fontSize: 13, background: 'var(--primary-accent)', color: '#000', fontWeight: 900 }}
                onClick={() => setFiltersOpen(false)}
            >
                Apply Filters
            </button>
          </div>
        </div>
      )}

      <div className="filters-shell-bottom">
        <div className="filters-sort-wrap" style={{ justifyContent: 'flex-end', borderTop: filtersOpen ? 'none' : '1px solid var(--border)' }}>
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

          <div className="filters-count-below" style={{ color: 'var(--text-dim)', opacity: 0.6 }}>
            {loading ? '' : `${filtered.length} Elite Items Found`}
          </div>
        </div>
      </div>

        {loading ? <div className="loading"><div className="spinner"></div></div> : (
          <div id="shop-products" className="product-grid">
            {filtered.slice(0, visibleCount).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && visibleCount < filtered.length && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 0 10px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setVisibleCount(c => Math.min(filtered.length, c + 36))}
            >
              Load more
            </button>
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        <div ref={loadMoreRef} style={{ height: 1 }} />
      </div>
    </div>
  )
}

const handleShareProduct = async (product, setNotice) => {
  const shareData = {
    title: product.name,
    text: `Check out this ${product.name} on Elite Sports Hub!`,
    url: `${window.location.origin}/product/${product.id}`
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(shareData.url)
      setNotice?.('Product link copied to clipboard!')
    }
  } catch (err) {
    console.error('Error sharing:', err)
  }
}

const ProductCard = ({ product, showFeaturedToggle = false, onToggleFeatured }) => {
  const { addToCart, setCartNotice } = useCart()
  const [added, setAdded] = useState(false)
  const addedTimer = useRef(null)

  useEffect(() => {
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current)
    }
  }, [])

  const handleAdd = () => {
    addToCart(product, 'M', 'Home')
    setAdded(true)
    if (addedTimer.current) clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div className="product-card">
      <div className="product-image-container">
         <img src={product.images[0] || 'https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=300'} className="product-image" alt={product.name} />
         {(product.is_limited || Object.values(product.stock || {}).some(v => v > 0 && v < 5)) && (
           <div style={{ position: 'absolute', top: 8, left: 8, background: '#ff9933', color: '#000', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.5px' }}>LIMITED STOCK</div>
         )}
         {product.is_sale && (
           <div style={{ position: 'absolute', top: 8, right: 8, background: '#ff4444', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 4 }}>SALE</div>
         )}
         <button 
           className="product-share-btn" 
           onClick={(e) => {
             e.preventDefault()
             e.stopPropagation()
             handleShareProduct(product, setCartNotice)
           }}
           aria-label="Share product"
         >
           <Share2 size={16} />
         </button>
      </div>
      <div className="product-info">
        <div className="product-brand">{product.brand}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-footer">
          <div className="price-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(product.discount_price || product.is_sale) ? (
              <>
                <div className="product-price" style={{ color: '#ff4444', fontWeight: 800 }}>Rs. {(product.discount_price || product.price).toLocaleString()}</div>
                {product.discount_price && <div style={{ textDecoration: 'line-through', color: 'var(--text-dim)', fontSize: 11, opacity: 0.6 }}>Rs. {product.price.toLocaleString()}</div>}
              </>
            ) : (
              <div className="product-price">Rs. {product.price.toLocaleString()}</div>
            )}
          </div>
          <div className="action-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
             <Link to={`/product/${product.id}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', fontSize: 13, borderRadius: 10 }}>Details</Link>
             <button onClick={handleAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', fontSize: 13, borderRadius: 10, background: added ? '#16a34a' : undefined }}>
               {added ? 'Added ✓' : 'Add Cart'}
             </button>
          </div>

          {showFeaturedToggle && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <button
                type="button"
                className={`featured-heart-btn ${product?.featured ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleFeatured?.(product)
                }}
                aria-label={product?.featured ? 'Remove from featured' : 'Add to featured'}
              >
                <Heart size={18} fill={product?.featured ? 'var(--primary-accent)' : 'transparent'} />
              </button>
            </div>
          )}
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
  const [addedToCart, setAddedToCart] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' })
  const [loading, setLoading] = useState(true)
  const { addToCart, setCartNotice } = useCart()

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
    : null
  
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button 
                className="btn-ghost pd-share-btn" 
                onClick={() => handleShareProduct(product, setCartNotice)}
                title="Share product"
              >
                <Share2 size={20} />
              </button>
              <span className="pd-badge">Bestseller</span>
            </div>
          </div>
          <h1 className="pd-title" style={{ fontSize: 28, marginBottom: 8, fontWeight: 900 }}>{product.name}</h1>
          <div className="pd-price-rating-row" style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
            {product.discount_price ? (
                <>
                    <p className="pd-price" style={{ color: '#ff4444', fontSize: 32, fontWeight: 900, margin: 0 }}>Rs. {product.discount_price.toLocaleString()}</p>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)', fontSize: 16, opacity: 0.5 }}>Rs. {product.price.toLocaleString()}</span>
                    <span style={{ background: '#ff4444', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 4 }}>SALE</span>
                </>
            ) : (
                <p className="pd-price" style={{ margin: 0 }}>Rs. {product.price.toLocaleString()}</p>
            )}
            <div className="pd-rating" style={{ marginLeft: 'auto' }}>
              {reviews.length > 0 ? (
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {avgRating} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span></span>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>★ 0 reviews</span>
              )}
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
            <button className="btn btn-primary pd-add-btn" onClick={() => {
              addToCart(product, size, color, quantity)
              setAddedToCart(true)
              setTimeout(() => setAddedToCart(false), 1400)
            }} style={{ background: addedToCart ? '#16a34a' : undefined }}>
              {addedToCart ? 'ADDED ✓' : 'ADD TO CART'}
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
                      pattern="[0-9]{10}"
                      maxLength="10"
                      title="Must be exactly 10 digits"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault()
                        }
                      }}
                      required 
                      onChange={e => setOrderData({ ...orderData, phone: e.target.value })} 
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ marginBottom: 6, fontSize: 12 }}>Email Address <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(Optional)</span></label>
                    <input 
                      type="email"
                      className="form-input" 
                      placeholder="e.g. name@email.com" 
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
                <div style={{ background: 'var(--background)', border: '1px solid var(--border)', padding: '16px 12px', borderRadius: 14, textAlign: 'center', marginTop: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', letterSpacing: 1.5, marginBottom: 10 }}>SCAN TO PAY · FONEPAY</div>
                  <img 
                    src="/fonepay-qr.jpg" 
                    alt="Fonepay QR Code" 
                    style={{ width: 170, height: 'auto', borderRadius: 10, border: '3px solid var(--border)', display: 'block', margin: '0 auto 12px' }} 
                  />
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)', marginBottom: 2 }}>ELITE SPORTS HUB</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Terminal: 2222060016219877</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 10 }}>Branch: HORIZONCHOWK</div>
                  <div style={{ fontSize: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '6px 12px', borderRadius: 8, fontWeight: 700 }}>
                    📸 Screenshot your payment receipt and keep it safe
                  </div>
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
    <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div className="pd-panel" style={{ maxWidth: 500, margin: '0 auto', padding: '40px 32px', borderRadius: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ 
          width: 64, height: 64, borderRadius: '20px', background: '#10b981', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 20px', color: 'white',
          boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)'
        }}>
          <Check size={32} strokeWidth={3} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Order Placed!</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.5, marginBottom: 8 }}>
          Thank you for choosing <span style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Elite Sports Hub</span>. <br/>
          Your order is being processed.
        </p>
        
        <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginBottom: 24, letterSpacing: 0.5 }}>
          ID: #ESH-{orderId.toString().slice(-6).toUpperCase()}
        </p>

        <div style={{ background: 'var(--surface-alt)', padding: 16, borderRadius: 16, marginBottom: 32, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text-dim)' }}>Estimated Delivery</span>
            <span style={{ fontWeight: 800 }}>2-4 Business Days</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-dim)' }}>Support Contact</span>
            <span style={{ fontWeight: 800 }}>+977 9821952621</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Link to="/shop" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: 12, fontSize: 14 }}>Continue Shop</Link>
          <Link to="/" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}>Home</Link>
        </div>
      </div>
    </div>
  )
}

// --- ADMIN PAGES ---

const AdminLayout = ({ children }) => {
  const { logout } = useAuth()
  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <img src="/logo.png" style={{ height: 40, width: 'auto', borderRadius: 4 }} alt="Logo" />
          <h2 className="admin-title" style={{ margin: 0 }}>Admin Hub</h2>
        </div>
        <div className="sidebar-nav" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <NavLink to="/admin/orders" className="sidebar-link"><ClipboardList size={20} /> Orders</NavLink>
          <NavLink to="/admin/products" className="sidebar-link"><Shirt size={20} /> Products</NavLink>
          <NavLink to="/admin/pages" className="sidebar-link"><FileText size={20} /> Manage Pages</NavLink>
          <Link to="/" className="sidebar-link admin-back-link" style={{ marginTop: 'auto' }}>&lsaquo; Back to Store</Link>
          <button onClick={logout} className="sidebar-link" style={{ color: '#ff4444', borderColor: 'rgba(255,68,68,0.2)' }}>Logout</button>
        </div>
      </div>
      <div className="admin-content">
        {children}
      </div>
    </div>
  )
}

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showInvoice, setShowInvoice] = useState(null)

  useEffect(() => {
    axios.get(`${API_URL}/admin/orders`).then(res => setOrders(res.data))
  }, [])

  const updateStatus = async (id, status) => {
    await axios.put(`${API_URL}/admin/orders/${id}/status`, { status })
    const updatedOrders = orders.map(o => o.id === id ? { ...o, status } : o)
    setOrders(updatedOrders)
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
        <div className="admin-header" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, margin: '0 0 4px 0' }}>Order Hub</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Review logistics and dispatch requests.</p>
      </div>

      <div className="admin-orders-container" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 24, width: 110 }}>REF</th>
              <th style={{ width: 160 }}>CUSTOMER</th>
              <th style={{ width: 80, textAlign: 'center' }}>ITEMS</th>
              <th style={{ width: 110, textAlign: 'right' }}>TOTAL</th>
              <th style={{ width: 100, textAlign: 'center' }}>STATUS</th>
              <th style={{ width: 120, textAlign: 'center' }}>ACTION</th>
              <th style={{ width: 90, textAlign: 'center', paddingRight: 24 }}>INVOICE</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map(o => (
              <React.Fragment key={o.id}>
                <tr className={`order-row-status-${o.status}`} style={{ cursor: 'pointer', height: 60 }} onClick={() => setSelectedOrder(selectedOrder?.id === o.id ? null : o)}>
                  <td style={{ paddingLeft: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {selectedOrder?.id === o.id ? <ChevronDown size={13} style={{ color: 'var(--primary-accent)', flexShrink: 0 }} /> : <ChevronRight size={13} style={{ opacity: 0.25, flexShrink: 0 }} />}
                      <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: 0.3 }}>#{o.id.toString().slice(-6).toUpperCase()}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{o.customer_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{o.phone}</div>
                  </td>
                  <td style={{ fontSize: 12, textAlign: 'center', color: 'var(--text-dim)' }}>{o.items.length} {o.items.length === 1 ? 'item' : 'items'}</td>
                  <td style={{ fontWeight: 800, fontSize: 13, textAlign: 'right' }}>Rs. {o.total_amount.toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge status-${o.status}`} style={{ fontSize: 10, padding: '3px 10px', textTransform: 'capitalize', display: 'inline-block' }}>{o.status}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div onClick={e => e.stopPropagation()}>
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="admin-select"
                        style={{ fontSize: 11, padding: '4px 8px', height: 28, minWidth: 100 }}
                      >
                        <option value="pending">Pending</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="done">Done</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', paddingRight: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                      {(o.status === 'done' || o.status === 'dispatched') ? (
                        <>
                          <button
                            title="View Invoice"
                            onClick={() => setShowInvoice(o)}
                            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            title="Download PDF"
                            onClick={() => { setShowInvoice(o); setTimeout(() => window.print(), 300) }}
                            style={{ background: 'var(--primary-accent)', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
                          >
                            <Download size={14} />
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', opacity: 0.4 }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
                {selectedOrder?.id === o.id && (
                  <tr className="order-details-expanded" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td colSpan="7" style={{ padding: '0 24px 24px 24px', borderTop: 'none' }}>
                      <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 20, border: '1px solid var(--border)', padding: '24px', display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: 32 }}>
                        <div className="details-col-left" style={{ borderRight: '1px solid var(--border)', paddingRight: 24 }}>
                          <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)', marginBottom: 16 }}>Logistics</h4>
                          <div style={{ display: 'grid', gap: 12 }}>
                             {[
                               { label: 'Carrier Detail', val: o.customer_name + ' (' + o.phone + ')', bold: true },
                               { label: 'Address', val: o.location + ', ' + o.district },
                               { label: 'Landmark', val: o.landmark || 'N/A', color: o.landmark ? 'var(--primary-accent)' : null },
                               { label: 'Payment', val: o.payment_method, tag: true }
                             ].map((item, i) => (
                               <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 800 }}>{item.label}</span>
                                  {item.tag ? (
                                    <span style={{ fontSize: 10, fontWeight: 900, background: 'var(--primary-accent)', color: '#fff', padding: '1px 6px', borderRadius: 4, alignSelf: 'flex-start' }}>{item.val.toUpperCase()}</span>
                                  ) : (
                                    <span style={{ fontSize: 12, fontWeight: item.bold ? 800 : 500, color: item.color || 'var(--text-main)', marginTop: 2 }}>{item.val}</span>
                                  )}
                               </div>
                             ))}
                          </div>
                        </div>
                        <div className="details-col-right">
                           <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)', marginBottom: 16 }}>Items Overview</h4>
                           <div style={{ display: 'grid', gap: 8 }}>
                              {o.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--surface)', padding: '6px 12px', borderRadius: 12, border: '1px solid var(--border)' }}>
                                   <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--border)' }}>
                                      <img src={item.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=60' }} />
                                   </div>
                                   <div style={{ flex: 1 }}>
                                      <p style={{ margin: 0, fontWeight: 800, fontSize: 13 }}>{item.name}</p>
                                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-dim)' }}>{item.size} | {item.color || 'Kit'} | {item.quantity}x</p>
                                   </div>
                                   <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary-accent)' }}>Rs. {item.price.toLocaleString()}</div>
                                </div>
                              ))}
                              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 40, alignItems: 'center' }}>
                                 <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: 9, color: 'var(--text-dim)', fontWeight: 800 }}>SUBTOTAL</p>
                                    <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--primary-accent)' }}>Rs. {o.total_amount.toLocaleString()}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

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
  const handlePrint = () => window.print()

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  return (
    <div className="invoice-container">
      {/* Screen-only utility bar */}
      <div className="invoice-utility-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={18} color="var(--primary-accent)" />
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.5, color: '#1a1a1a' }}>Invoice #{order.id.toString().slice(-6).toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 800, background: 'var(--primary-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <Download size={15} /> Save PDF
          </button>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#f1f1f1', color: '#333', border: '1px solid #ddd', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>

      {/* Printable invoice body */}
      <div style={{ background: '#fff', color: '#1a1a1a' }}>
        {/* Accent top stripe */}
        <div style={{ height: 6, background: 'var(--primary-accent)', width: '100%' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 32px 16px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logo.png" style={{ height: 44, width: 'auto' }} alt="Elite Sports Hub" />
            <div>
              <div style={{ fontSize: 10, color: '#999', fontWeight: 700, letterSpacing: 1, marginBottom: 1 }}>PAN: 141845067</div>
              <div style={{ fontSize: 10, color: '#bbb' }}>Butwal-11, Devinagar, Sagarmatha Path</div>
              <div style={{ fontSize: 10, color: '#bbb' }}>+977 9821952621</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#111', letterSpacing: -0.5, lineHeight: 1 }}>INVOICE</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary-accent)', marginTop: 4 }}>#{order.id.toString().slice(-6).toUpperCase()}</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>Date: {dateStr}</div>
            <div style={{ fontSize: 11, color: '#555' }}>Status: <strong>{capitalize(order.status)}</strong></div>
          </div>
        </div>

        {/* Billing & Shipping */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '16px 32px', gap: 24, borderBottom: '1px solid #eee', background: '#fafafa' }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#aaa', letterSpacing: 2, marginBottom: 8 }}>BILL TO</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 3 }}>{order.customer_name}</div>
            <div style={{ fontSize: 12, color: '#555' }}>{order.phone}</div>
            <div style={{ fontSize: 12, color: '#555' }}>{order.email || 'No email'}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#aaa', letterSpacing: 2, marginBottom: 8 }}>SHIP TO</div>
            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.8 }}>
              <span style={{ color: '#aaa', fontSize: 10 }}>District</span> &nbsp; <strong>{order.district}</strong><br/>
              <span style={{ color: '#aaa', fontSize: 10 }}>Address</span> &nbsp; <strong>{order.location}</strong><br/>
              <span style={{ color: '#aaa', fontSize: 10 }}>Landmark</span> &nbsp; <strong>{order.landmark || 'N/A'}</strong><br/>
              <span style={{ color: '#aaa', fontSize: 10 }}>Payment</span> &nbsp; <strong>{order.payment_method.toUpperCase()}</strong>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ padding: '0 32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #222' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1 }}>DESCRIPTION</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1 }}>SIZE</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1 }}>QTY</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1 }}>UNIT</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1 }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>Kit: {item.color || 'Home'}</div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '14px 12px', fontSize: 13, color: '#333' }}>{item.size}</td>
                  <td style={{ textAlign: 'center', padding: '14px 12px', fontSize: 13, color: '#333' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '14px 12px', fontSize: 13, color: '#333' }}>Rs. {item.price.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '14px 12px', fontSize: 14, fontWeight: 800, color: '#111' }}>Rs. {(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 32px 10px' }}>
          <div style={{ minWidth: 220, borderTop: '2px solid #222', paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#555' }}>
              <span>Delivery Charge</span><span>Rs. 150</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, padding: '8px 0 0', borderTop: '1px solid #eee', marginTop: 6, color: '#111' }}>
              <span>Total Amount</span>
              <span style={{ color: 'var(--primary-accent)' }}>Rs. {order.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes only */}
        <div style={{ padding: '12px 32px 24px', borderTop: '1px solid #eee' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#aaa', letterSpacing: 2, marginBottom: 6 }}>NOTES & TERMS</div>
          <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.7 }}>
            1. Keep this invoice for exchange claims within 7 days.<br/>
            2. Goods only exchangeable if tags remain intact.
          </div>
        </div>
      </div>
    </div>
  )
}

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    price: '',
    discount_price: '',
    is_sale: false,
    is_limited: false,
    description: '',
    category: '',
    audience: 'Unisex',
    player: '',
    stock: { S: '', M: '', L: '', XL: '', '2XL': '' },
  })
  
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [tempCategory, setTempCategory] = useState('')
  
  const [imageItems, setImageItems] = useState([]) // Array of { type: 'file' | 'url', data: File | string, id: string }
  const [urlInput, setUrlInput] = useState('')
  const [draggedIdx, setDraggedIdx] = useState(null)

  const handleDragStart = (idx) => setDraggedIdx(idx)
  const handleDragOver = (e) => e.preventDefault()
  const handleDrop = (targetIdx) => {
    if (draggedIdx === null) return
    const newItems = [...imageItems]
    const item = newItems.splice(draggedIdx, 1)[0]
    newItems.splice(targetIdx, 0, item)
    setImageItems(newItems)
    setDraggedIdx(null)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = () => {
    axios.get(`${API_URL}/products`).then(res => setProducts(res.data))
  }

  const toggleFeatured = async (p, e) => {
    e?.stopPropagation()
    const next = !p?.featured
    try {
      await axios.put(`${API_URL}/admin/products/${p.id}/featured`, { featured: next })
      fetchProducts()
    } catch (err) {
      console.error('Failed to toggle featured', err)
    }
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setNewProduct({
      name: '', brand: '', price: '', discount_price: '', is_sale: false, is_limited: false, description: '', category: '', audience: 'Unisex', player: '',
      stock: { S: '', M: '', L: '', XL: '', '2XL': '' }
    })
    setImageItems([])
    setIsCreatingCategory(false)
    setIsModalOpen(true)
  }

  const openEditModal = (p) => {
    setEditingProduct(p)
    setNewProduct({
        name: p.name, brand: p.brand || '', price: p.price, discount_price: p.discount_price || '', 
        is_sale: p.is_sale || false, is_limited: p.is_limited || false,
        description: p.description || '', 
        category: p.category || '', audience: p.audience || 'Unisex', player: p.player || '',
        stock: p.stock
    })
    // Map existing images back into manager
    const items = p.images.map((url, i) => ({ type: 'url', data: url, id: `exist-${i}` }))
    setImageItems(items)
    setIsCreatingCategory(false)
    setIsModalOpen(true)
  }

  const addUrlImage = () => {
    if (!urlInput.trim()) return
    setImageItems([...imageItems, { type: 'url', data: urlInput.trim(), id: Date.now().toString() }])
    setUrlInput('')
  }

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
    const newItems = selected.map(f => ({ type: 'file', data: f, id: Math.random().toString(36).substr(2, 9) }))
    setImageItems([...imageItems, ...newItems])
  }

  const removeImage = (id) => setImageItems(imageItems.filter(item => item.id !== id))

  const moveItem = (index, direction) => {
    const newItems = [...imageItems]
    const target = index + direction
    if (target < 0 || target >= newItems.length) return
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]]
    setImageItems(newItems)
  }

  const handleDelete = async (id) => {
      if(!window.confirm('Are you sure you want to PERMANENTLY delete this product? This action cannot be undone.')) return
      await axios.delete(`${API_URL}/products/${id}`)
      setIsModalOpen(false)
      fetchProducts()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('name', newProduct.name)
    formData.append('brand', newProduct.brand)
    formData.append('price', newProduct.price)
    formData.append('discount_price', newProduct.discount_price)
    formData.append('is_sale', newProduct.is_sale)
    formData.append('is_limited', newProduct.is_limited)
    formData.append('description', newProduct.description)
    formData.append('category', newProduct.category)
    formData.append('audience', newProduct.audience)
    formData.append('player', newProduct.player)
    formData.append('stock', JSON.stringify(newProduct.stock))

    const remoteUrls = []
    const orderData = []

    imageItems.forEach((item, idx) => {
        if (item.type === 'url') {
            remoteUrls.push({ url: item.data, position: idx })
        } else {
            formData.append('images', item.data)
            orderData.push({ type: 'file', position: idx })
        }
    })

    formData.append('remote_urls', JSON.stringify(remoteUrls))
    formData.append('file_order', JSON.stringify(orderData))

    if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct.id}`, formData)
    } else {
        await axios.post(`${API_URL}/products`, formData)
    }
    
    setIsModalOpen(false)
    setImageItems([])
    fetchProducts()
  }

  const existingCategories = useMemo(() => {
    const cats = products.map(p => p.category)
    return [...new Set(cats.filter(Boolean))]
  }, [products])

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>Inventory</h1>
        <button className="btn btn-primary" onClick={openAddModal}><Plus size={18} /> Add Product</button>
      </div>
      
      <div className="admin-products-grid">
        {products.map(p => (
           <div key={p.id} className="admin-product-card clickable-card" onClick={() => openEditModal(p)} style={{ cursor: 'pointer', position: 'relative' }}>
             <div className="card-image-wrapper" style={{ position: 'relative' }}>
                <img src={p.images[0] || 'https://images.unsplash.com/photo-1577224969296-c27e7cb3d676?q=80&w=400'} className="admin-product-image" />
                <div className="edit-card-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s ease', borderRadius: 12 }}>
                   <div style={{ background: 'var(--primary-accent)', color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Edit size={14} /> EDIT
                   </div>
                </div>
             </div>
             <h4 className="admin-product-name">{p.name}</h4>
             <p className="admin-product-price">Rs. {p.price}</p>

             <div className="admin-featured-heart-wrap">
               <button
                 type="button"
                 className={`featured-heart-btn admin-featured-heart-btn ${p?.featured ? 'active' : ''}`}
                 onClick={(e) => toggleFeatured(p, e)}
                 aria-label={p?.featured ? 'Remove from featured' : 'Mark as featured'}
               >
                 <Heart size={18} fill={p?.featured ? 'var(--primary-accent)' : 'transparent'} />
               </button>
             </div>
           </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content admin-modal-content" style={{ maxWidth: 880, padding: 0, height: 'auto', maxHeight: '95vh' }}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                 <div style={{ padding: 6, background: 'rgba(58, 65, 229, 0.1)', borderRadius: 8, color: 'var(--primary-accent)' }}>
                    {editingProduct ? <Edit size={16}/> : <Package size={16} />}
                 </div>
                 <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="admin-product-form">
               <div className="modal-body" style={{ padding: '24px 32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 40 }}>
                     {/* LEFT COLUMN: Metadata */}
                     <div className="form-col-details">
                        <p className="form-section-title" style={{ fontSize: 10, letterSpacing: '1px', marginBottom: 16, opacity: 0.5 }}>PRIMARY INFORMATION</p>
                        
                        <div className="form-group" style={{ marginBottom: 14 }}>
                           <label style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, display: 'block' }}>Product Name</label>
                           <input className="form-input" value={newProduct.name} style={{ width: '100%', fontSize: 14, padding: '11px 16px' }} required placeholder="Real Madrid 2026 Kit" onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
                            <div className="form-group">
                               <label style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Brand</label>
                               <input className="form-input" value={newProduct.brand} style={{ width: '100%', padding: '10px 14px' }} placeholder="Adidas..." onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} />
                            </div>
                            <div className="form-group">
                               <label style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Retail (Rs.)</label>
                               <input className="form-input" value={newProduct.price} style={{ width: '100%', padding: '10px 14px' }} type="number" required placeholder="5500" onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                            </div>
                            <div className="form-group">
                               <label style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Sale (Optional)</label>
                               <input className="form-input" value={newProduct.discount_price} style={{ width: '100%', padding: '10px 14px', borderColor: newProduct.discount_price ? 'var(--primary-accent)' : 'var(--border)' }} type="number" placeholder="4500" onChange={e => setNewProduct({ ...newProduct, discount_price: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px dashed var(--border)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12 }}>
                                <input type="checkbox" checked={newProduct.is_sale} onChange={e => setNewProduct({ ...newProduct, is_sale: e.target.checked })} />
                                <span>Show Sale Badge</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12 }}>
                                <input type="checkbox" checked={newProduct.is_limited} onChange={e => setNewProduct({ ...newProduct, is_limited: e.target.checked })} />
                                <span>Show Limited Badge</span>
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                            <div className="form-group">
                                <label style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Category</label>
                                {!isCreatingCategory ? (
                                    <select className="form-input" style={{ width: '100%', padding: '10px 14px' }} value={newProduct.category} 
                                        onChange={(e) => { 
                                            if (e.target.value === 'CREATE_NEW') { setIsCreatingCategory(true); setNewProduct({ ...newProduct, category: '' }) } 
                                            else { setNewProduct({ ...newProduct, category: e.target.value }) }
                                        }}>
                                        <option value="">Select...</option>
                                        {existingCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                                        <option value="CREATE_NEW" style={{ fontWeight: 800 }}>+ Create New...</option>
                                    </select>
                                ) : (
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <input className="form-input" style={{ flex: 1, padding: '10px 14px' }} autoFocus placeholder="New..." value={tempCategory} onChange={(e) => { setTempCategory(e.target.value); setNewProduct({ ...newProduct, category: e.target.value })}} />
                                        <button type="button" className="btn btn-outline" style={{ padding: '0 10px' }} onClick={() => { setIsCreatingCategory(false); setTempCategory('') }}>&times;</button>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Audience</label>
                                <select className="form-input" style={{ width: '100%', padding: '10px 14px' }} required value={newProduct.audience} onChange={e => setNewProduct({ ...newProduct, audience: e.target.value })}>
                                    <option value="Unisex">Unisex</option>
                                    <option value="Men">Men</option>
                                    <option value="Women">Women</option>
                                    <option value="Kids">Kids</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Description</label>
                            <textarea className="form-input" value={newProduct.description} rows="2" style={{ width: '100%', padding: '12px 16px', resize: 'none' }} placeholder="Brief product story..." onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}></textarea>
                        </div>
                     </div>

                     <div className="form-col-media">
                        <p className="form-section-title" style={{ fontSize: 11, marginBottom: 12, opacity: 0.6 }}>MEDIA & INVENTORY</p>

                        <div className="form-group" style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, marginBottom: 4 }}>Images Gallery</label>
                            <div className="image-manager-card" style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ padding: 12, borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                        <input className="form-input" style={{ background: 'var(--bg-main)', height: 36, padding: '0 12px' }} placeholder="Image URL..." value={urlInput} onChange={e => setUrlInput(e.target.value)} />
                                        <button type="button" className="btn btn-primary" style={{ height: 36, width: 36, padding: 0 }} onClick={addUrlImage}><Plus size={16}/></button>
                                    </div>
                                    <div className="file-upload-trigger" style={{ position: 'relative' }}>
                                       <button type="button" className="btn btn-outline" style={{ width: '100%', height: 32, fontSize: 12, borderStyle: 'dashed' }}>Upload Files</button>
                                       <input type="file" multiple style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} onChange={handleFileChange} />
                                    </div>
                                </div>
                                <div className="image-list-scroll" style={{ maxHeight: 110, overflowY: 'auto', padding: 8 }}>
                                    {imageItems.length === 0 ? (
                                        <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>No images added</div>
                                    ) : (
                                        imageItems.map((item, idx) => (
                                            <div 
                                                key={item.id} 
                                                draggable
                                                onDragStart={() => handleDragStart(idx)}
                                                onDragOver={handleDragOver}
                                                onDrop={() => handleDrop(idx)}
                                                className="image-item-row" 
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', 
                                                    background: 'var(--bg-main)', borderRadius: 10, border: '1px solid var(--border)', 
                                                    marginBottom: 6, cursor: 'grab', transition: 'all 0.2s ease',
                                                    opacity: draggedIdx === idx ? 0.3 : 1
                                                }}>
                                                <div style={{ color: 'var(--text-dim)', cursor: 'grab' }}>
                                                    <GripVertical size={14} />
                                                </div>
                                                <div style={{ color: 'var(--primary-accent)', fontSize: 11, fontWeight: 900, width: 14 }}>{idx + 1}</div>
                                                <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: '#000' }}>
                                                    {item.type === 'url' ? <img src={item.data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 8, color: '#fff', textAlign: 'center', lineHeight: '32px' }}>FILE</div>}
                                                </div>
                                                <div style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>{item.type === 'url' ? item.data : item.data.name}</div>
                                                <div style={{ display: 'flex', gap: 2 }}>
                                                    <button type="button" onClick={() => moveItem(idx, -1)} className="btn-icon" style={{ padding: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>↑</button>
                                                    <button type="button" onClick={() => moveItem(idx, 1)} className="btn-icon" style={{ padding: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>↓</button>
                                                    <button type="button" onClick={() => removeImage(item.id)} className="btn-icon" style={{ color: '#ff4d4d', padding: 4, background: 'rgba(255,77,77,0.1)', borderRadius: 4 }}>×</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 0 }}>
                            <label style={{ fontSize: 11, marginBottom: 4 }}>Stock Units per Size</label>
                            <div className="stock-grid-modern" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                {['S', 'M', 'L', 'XL', '2XL'].map(sz => (
                                    <div key={sz} style={{ borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '8px 4px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, fontWeight: 900, marginBottom: 4 }}>{sz}</div>
                                        <input type="number" className="form-input" value={newProduct.stock[sz]} style={{ textAlign: 'center', padding: 2, height: 28, fontSize: 12 }} min="0" placeholder="0" onChange={e => setNewProduct({ ...newProduct, stock: { ...newProduct.stock, [sz]: e.target.value }})} />
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                  </div>
               </div>

              <div className="modal-footer" style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                {editingProduct ? (
                   <button type="button" className="action-btn-danger" style={{ background: 'transparent', border: 'none', color: '#ff4d4d', fontSize: 13, fontWeight: 700, padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDelete(editingProduct.id)}>
                     <Trash2 size={14} /> DELETE PRODUCT
                   </button>
                ) : <div />}
                
                <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-outline" style={{ padding: '10px 24px', fontSize: 13, borderRadius: 10, minWidth: 100 }} onClick={() => setIsModalOpen(false)}>Discard</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 32px', fontSize: 13, borderRadius: 10, fontWeight: 800 }}>
                        {editingProduct ? 'Update Inventory' : 'Confirm & Launch Product'}
                    </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const DynamicPage = () => {
    const slug = window.location.pathname.split('/').pop()
    const aboutSupportEmail = 'elitesportsh@gmail.com'
    const isAbout = slug === 'about'

    // Always render About even if the pages API is down / empty.
    const aboutFallback = useMemo(() => ({
      slug: 'about',
      title: 'About Elite Sports Hub',
      content: ''
    }), [])

    const [page, setPage] = useState(() => (isAbout ? aboutFallback : null))

    useEffect(() => {
        axios.get(`${API_URL}/pages`).then(res => {
            const p = (res.data || []).find(x => x.slug === slug)
            if (p) setPage(p)
            else if (isAbout) setPage(aboutFallback)
        }).catch(() => {
            if (isAbout) setPage(aboutFallback)
        })
    }, [slug, isAbout, aboutFallback])

    if (!page) return <div className="loading"><div className="spinner"></div></div>

    const aboutHtml = isAbout
        ? `
          <p><strong>Elite Sports Hub</strong> is Nepal 🇳🇵’s destination for authentic jerseys and elite sportswear.</p>
          <p>We are based in <strong>Butwal, Nepal 🇳🇵</strong> and deliver nationwide with a focus on quality, comfort, and authenticity.</p>
          <p>
            For <strong>support</strong> or <strong>collaboration</strong>, reach out anytime via email below.
          </p>
          <p style="margin-top: 18px;"><strong>Follow us</strong></p>
          <div class="about-social-icons" aria-label="Elite Sports Hub social links">
            <a class="about-social-btn" href="https://www.instagram.com/the.elitesports.hub/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <img src="https://img.icons8.com/ios-filled/24/ffffff/instagram-new.png" alt="" />
            </a>
            <a class="about-social-btn" href="https://www.facebook.com/profile.php?id=61564282143433" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src="https://img.icons8.com/ios-filled/24/ffffff/facebook-new.png" alt="" />
            </a>
            <a class="about-social-btn" href="https://www.tiktok.com/@elite.sports.hub" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <img src="https://img.icons8.com/ios-filled/24/ffffff/tiktok.png" alt="" />
            </a>
          </div>
        `
        : ''

    return (
        <div className="container" style={{ padding: '80px 0 64px' }}>
            {isAbout ? (
              <div className="about-page-hero">
                <div className="about-country-pill">
                  <span className="about-country-text">Nepal 🇳🇵</span>
                </div>

                <h1 className="about-page-title page-title">{page.title}</h1>

                <div className="about-content" dangerouslySetInnerHTML={{ __html: aboutHtml }} />

                <div className="about-support-card">
                  <h2>Contact & Support</h2>
                  <div className="about-support-row">
                    <Mail size={18} />
                    <a href={`mailto:${aboutSupportEmail}`}>{aboutSupportEmail}</a>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="page-title">{page.title}</h1>
                <div className="page-rich-content" dangerouslySetInnerHTML={{ __html: page.content }} />
              </>
            )}
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

const ContactPage = () => {
  const phone = '+977 9821952621'
  const email = 'elitesportsh@gmail.com'

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <div className="pd-panel" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 8 }}>Contact Us</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: 22 }}>
          Reach out to us for support, orders, or any questions.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
          <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--primary-accent)', fontWeight: 900, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
              Phone
            </div>
            <div style={{ fontWeight: 800, display: 'flex', gap: 10, alignItems: 'center' }}>
              <Phone size={18} />
              <a href={`tel:${phone.replace(/\\s+/g, '')}`} style={{ color: 'inherit' }}>
                {phone}
              </a>
            </div>
          </div>

          <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--primary-accent)', fontWeight: 900, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
              Email
            </div>
            <div style={{ fontWeight: 800, display: 'flex', gap: 10, alignItems: 'center' }}>
              <Mail size={18} />
              <a href={`mailto:${email}`} style={{ color: 'inherit' }}>
                {email}
              </a>
            </div>
          </div>

          <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--primary-accent)', fontWeight: 900, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>
              Social
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <a href="https://www.facebook.com/profile.php?id=61564282143433" target="_blank" rel="noopener noreferrer" className="footer-link">
                Facebook
              </a>
              <a href="https://www.instagram.com/the.elitesports.hub/" target="_blank" rel="noopener noreferrer" className="footer-link">
                Instagram (@the.elitesports.hub)
              </a>
              <a href="https://www.tiktok.com/@elite.sports.hub" target="_blank" rel="noopener noreferrer" className="footer-link">
                TikTok (@elite.sports.hub)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Footer = () => {
    const currentYear = new Date().getFullYear()
    return (
        <footer className="site-footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)', padding: '64px 0 28px', marginTop: 80 }}>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
                {/* Brand & Mission */}
                <div className="footer-brand-sec">
                    <Link to="/" className="logo-text" style={{ padding: 0, marginBottom: 20, display: 'block' }}>
                        <img src="/logo.png" style={{ height: 100, width: 'auto', borderRadius: 8 }} alt="Elite Sports Hub Official Logo" />
                    </Link>
                    <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                        High-performance athletic wear and authentic jerseys for Nepal's elite sports community.
                    </p>
                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'center', margin: '0 auto' }}>
                        <a href="https://www.facebook.com/profile.php?id=61564282143433" className="social-link-icon" target="_blank" rel="noopener noreferrer">
                            <img src="https://img.icons8.com/ios-filled/24/ffffff/facebook-new.png" style={{ transition: '0.2s' }} alt="Facebook" />
                        </a>
                        <a href="https://www.instagram.com/the.elitesports.hub/" className="social-link-icon" target="_blank" rel="noopener noreferrer">
                            <img src="https://img.icons8.com/ios-filled/24/ffffff/instagram-new.png" style={{ transition: '0.2s' }} alt="Instagram" />
                        </a>
                        <a href="https://www.tiktok.com/@elite.sports.hub" className="social-link-icon" target="_blank" rel="noopener noreferrer">
                            <img src="https://img.icons8.com/ios-filled/24/ffffff/tiktok.png" style={{ transition: '0.2s' }} alt="TikTok" />
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="footer-links-sec">
                    <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 24, fontWeight: 800 }}>QUICK LINKS</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12 }}><Link to="/" className="footer-link">Home</Link></li>
                        <li style={{ marginBottom: 12 }}><Link to="/shop" className="footer-link">Shop</Link></li>
                        <li style={{ marginBottom: 12 }}><Link to="/pages/about" className="footer-link">About</Link></li>
                    </ul>
                </div>

                {/* Information */}
                <div className="footer-links-sec">
                    <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 24, fontWeight: 800 }}>COMPANY</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12 }}><Link to="/pages/about" className="footer-link">Our Story</Link></li>
                        <li style={{ marginBottom: 12 }}>
                          <a href="mailto:elitesportsh@gmail.com" className="footer-link">Contact Us</a>
                        </li>
                    </ul>
                </div>

                {/* Support */}
                <div className="footer-links-sec">
                    <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 24, fontWeight: 800 }}>SUPPORT</h4>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--primary-accent)', fontWeight: 800, marginBottom: 4 }}>EMAIL SUPPORT</div>
                        <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Mail size={16} />
                            <a href="mailto:elitesportsh@gmail.com" style={{ color: 'inherit' }}>elitesportsh@gmail.com</a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ marginTop: 80, paddingTop: 40, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                  © 2026 Elite Sports Hub. created by{' '}
                  <a href="https://www.apdigitalhub.com/" target="_blank" rel="noopener noreferrer">
                    AP Digital Hub
                  </a>
                </p>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <img src="https://img.icons8.com/color/48/000000/visa.png" style={{ height: 20, opacity: 0.6 }} />
                    <img src="https://img.icons8.com/color/48/000000/mastercard.png" style={{ height: 20, opacity: 0.6 }} />
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4 }}>ESEWA / KHALTI</div>
                </div>
            </div>
        </footer>
    )
}

function App() {
  const CartNotice = () => {
    const { cartNotice } = useCart()
    if (!cartNotice) return null
    return <div className="cart-toast">{cartNotice}</div>
  }

  return (
    <ThemeProvider>
    <AuthProvider>
    <CartProvider>
      <Router>
        <Navbar />
        <CartNotice />
        <Routes>
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/admin" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/pages" element={<ProtectedRoute><AdminPages /></ProtectedRoute>} />
          <Route path="/pages/contact" element={<ContactPage />} />
          <Route path="/pages/:slug" element={<DynamicPage />} />
        </Routes>
        <Footer />
        <a href="https://wa.me/9779821952621" className="whatsapp-float" target="_blank" rel="noopener noreferrer">
          <MessageCircle size={32} fill="#fff" />
          <span className="whatsapp-badge"></span>
        </a>
      </Router>
    </CartProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App
