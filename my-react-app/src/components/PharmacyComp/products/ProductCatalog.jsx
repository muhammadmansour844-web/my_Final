import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import styles from '../styles/Pharmacy.module.css'
import dStyles from '../../Dashescomp/Dashes.module.css'

const API_PRODUCTS = 'http://localhost:3000/api/products'

const categoryIcons = {
  'Pain Relief': '💊',
  'Antibiotics': '🧬',
  'Vitamins': '🍊',
  'Skincare': '🧴',
  'Heart': '❤️',
  'Diabetes': '🩸',
  'default': '💊'
}

function ProductCatalog({ onAddToCart }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilters, setCategoryFilters] = useState([])
  const [companyFilters, setCompanyFilters] = useState([])
  const [maxPrice, setMaxPrice] = useState(5000)
  const [stockFilter, setStockFilter] = useState('all')
  const [addingId, setAddingId] = useState(null)
  const [dealsTimer, setDealsTimer] = useState('')

  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch(API_PRODUCTS, { headers })
        if (res.ok) setProducts(await res.json())
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Today's Deals countdown — resets every 24h at midnight
  useEffect(() => {
    const getMidnightEnd = () => {
      const now = new Date()
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return end.getTime()
    }
    const endTime = getMidnightEnd()
    const tick = () => {
      const diff = endTime - Date.now()
      if (diff <= 0) { setDealsTimer('00:00:00'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setDealsTimer(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
  const companies = [...new Set(products.map(p => p.manufacturer).filter(Boolean))]

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                        p.manufacturer?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilters.length === 0 || categoryFilters.includes(p.category)
    const matchCompany = companyFilters.length === 0 || companyFilters.includes(p.manufacturer)
    const matchPrice = parseFloat(p.price) <= maxPrice
    let matchStock = true
    if (stockFilter === 'in_stock') matchStock = p.stock_quantity > 0
    else if (stockFilter === 'out_of_stock') matchStock = p.stock_quantity <= 0
    return matchSearch && matchCategory && matchCompany && matchPrice && matchStock
  })

  const toggleCategory = (cat) => {
    setCategoryFilters(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  const toggleCompany = (comp) => {
    setCompanyFilters(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp])
  }

  const clearAllFilters = () => {
    setCategoryFilters([])
    setCompanyFilters([])
    setMaxPrice(5000)
    setStockFilter('all')
  }

  const handleAdd = async (product) => {
    setAddingId(product.id)
    if (onAddToCart) await onAddToCart(product)
    setTimeout(() => setAddingId(null), 800)
  }

  const getDiscountedPrice = (price, discount) => {
    if (!discount) return null
    return (parseFloat(price) * (1 - discount / 100)).toFixed(2)
  }

  const getTimeLeft = (product) => {
    let endDate
    if (product.promotion_end_date) {
      endDate = new Date(product.promotion_end_date).getTime()
    } else {
      const now = new Date()
      const anchor = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
      const days = (product.id % 20) + 15
      const hours = (product.id * 13) % 24
      endDate = anchor + (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000)
      if (endDate < Date.now()) endDate += 30 * 24 * 60 * 60 * 1000
    }
    const diff = endDate - Date.now()
    if (diff <= 0) return 'Expired'
    const d = Math.floor(diff / (1000 * 60 * 60 * 24))
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
    return `${d}d ${h}h left`
  }

  const getFirstImage = (product) => {
    if (product.images && product.images.length > 0) {
      return `http://localhost:3000/uploads/products/${product.images[0]}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className={dStyles.loadingContainer}>
        <div className={dStyles.spinner}></div>
        <p className={dStyles.loadingText}>Loading catalog...</p>
      </div>
    )
  }

  const topDeals = [...products]
    .filter(p => p.discount_percentage > 0)
    .sort((a, b) => b.discount_percentage - a.discount_percentage)
    .slice(0, 5)

  const quickCategories = [
    'Antibiotics', 'Vitamins & Supplements', 'Diabetes Care', 'Cardiology',
    'Oncology', 'Pediatrics', 'Generics', 'Emergency Kit'
  ]

  const supplyClusters = [
    { name: 'IMMUNOLOGY', icon: '🧬' },
    { name: 'TABLETS', icon: '💊' },
    { name: 'SURGICAL', icon: '🩺' },
    { name: 'DIAGNOSTICS', icon: '🧪' },
    { name: 'LAB REAGENTS', icon: '🔬' },
    { name: 'CRITICAL CARE', icon: '⚕️' },
  ]

  return (
    <div className={styles.aliLayout}>

      {/* SECTION 1: Mega Search & Pills */}
      <div className={styles.aliTopBar}>
        <div className={styles.aliMegaSearch}>
          <select className={styles.aliSearchSelect}>
            <option>All Categories</option>
          </select>
          <input
            type="text"
            placeholder="Search molecules, brands, or manufacturers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.aliSearchInput}
          />
          <button className={styles.aliSearchBtn}>🔍</button>
        </div>
        <div className={styles.aliPillStrip}>
          {quickCategories.map((cat, idx) => (
            <button
              key={cat}
              className={`${styles.aliPill} ${categoryFilters.includes(cat) || (idx === 0 && categoryFilters.length === 0) ? styles.aliPillActive : ''}`}
              onClick={() => {
                if (!categoryFilters.includes(cat)) toggleCategory(cat)
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: Hero Banner */}
      <div className={styles.aliHeroBanner}>
        <div className={styles.aliHeroContent}>
          <span className={styles.aliHeroTag}>LIMITED AVAILABILITY</span>
          <h1 className={styles.aliHeroTitle}>Flash Deals — Up to 40% Off</h1>
          <p className={styles.aliHeroSub}>Restock your inventory with clinic-grade precision at wholesale rates.</p>
          <div className={styles.aliHeroActions}>
            <button className={styles.aliHeroBtn}>ORDER NOW</button>
            <div className={styles.aliHeroTimer}>
              ⏱ {dealsTimer.split(':').join(' : ')}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Browse by Manufacturer */}
      <div className={styles.aliSection}>
        <div className={styles.aliSectionHeader}>
          <h3 className={styles.aliSectionTitle}>Browse by Manufacturer</h3>
          {companyFilters.length > 0 && (
            <button
              onClick={() => setCompanyFilters([])}
              style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              CLEAR SELECTION
            </button>
          )}
        </div>
        <div className={styles.aliClusterGrid}>
          {companies.slice(0, 6).map(company => {
            const isActive = companyFilters.includes(company)
            return (
              <div
                key={company}
                className={styles.aliClusterCard}
                onClick={() => toggleCompany(company)}
                style={{
                  cursor: 'pointer',
                  borderColor: isActive ? '#10b981' : '#e2e8f0',
                  background: isActive ? '#f0fdf4' : '#fff'
                }}
              >
                <div className={styles.aliClusterIcon}>🏢</div>
                <div className={styles.aliClusterName}>{company}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 4: Flash Deals Row */}
      {topDeals.length > 0 && (
        <div className={styles.aliFlashSection}>
          <div className={styles.aliFlashHeader}>
            <div className={styles.aliFlashHeaderLeft}>
              <span className={styles.aliFlashIcon}>⚡</span>
              <h3 className={styles.aliFlashTitle}>CLINICAL FLASH DEALS</h3>
              <div className={styles.aliFlashTimerDark}>ENDS IN: {dealsTimer}</div>
            </div>
          </div>
          <div className={styles.aliFlashRow}>
            {topDeals.map(deal => {
              const discountedPrice = getDiscountedPrice(deal.price, deal.discount_percentage)
              const claimedPct = Math.floor(Math.random() * 60) + 20
              const leftCount = deal.stock_quantity
              return (
                <div key={`flash-${deal.id}`} className={styles.aliFlashCard} onClick={() => navigate('/product-details', { state: { product: deal } })}>
                  <div className={styles.aliFlashImgArea}>
                    <span className={styles.aliFlashBadge}>-{parseFloat(deal.discount_percentage).toFixed(0)}%</span>
                    {getFirstImage(deal) ? (
                      <img src={getFirstImage(deal)} alt={deal.name} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>💊</span>
                    )}
                  </div>
                  <div className={styles.aliFlashBody}>
                    <div className={styles.aliFlashName}>{deal.name}</div>
                    <div className={styles.aliFlashPriceRow}>
                      <span className={styles.aliPriceMain}>₪{discountedPrice}</span>
                      <span className={styles.aliPriceOld}>₪{parseFloat(deal.price).toFixed(0)}</span>
                    </div>
                    <div className={styles.aliFlashProgressRow}>
                      <div className={styles.aliProgressText}>
                        <span>{claimedPct}% Claimed</span>
                        <span style={{ color: '#b91c1c' }}>{leftCount} left</span>
                      </div>
                      <div className={styles.aliProgressBar}>
                        <div className={styles.aliProgressFill} style={{ width: `${claimedPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECTION 5: Main Browsing Area */}
      <div className={styles.aliMainGridWrap}>

        {/* Left Filter Sidebar */}
        <aside className={styles.aliSidebar}>
          <div className={styles.aliFilterBlock}>
            <h4 className={styles.aliFilterTitle}>THERAPEUTIC CATEGORY</h4>
            {categories.slice(0, 5).map(c => (
              <label key={c} className={styles.aliFilterCheckbox}>
                <input type="checkbox" checked={categoryFilters.includes(c)} onChange={() => toggleCategory(c)} />
                <span className={styles.aliCheckboxCustom}></span>
                {c}
              </label>
            ))}
          </div>

          <div className={styles.aliFilterBlock}>
            <h4 className={styles.aliFilterTitle}>MANUFACTURER</h4>
            {companies.slice(0, 5).map(c => (
              <label key={c} className={styles.aliFilterCheckbox}>
                <input type="checkbox" checked={companyFilters.includes(c)} onChange={() => toggleCompany(c)} />
                <span className={styles.aliCheckboxCustom}></span>
                {c}
              </label>
            ))}
          </div>

          <div className={styles.aliFilterBlock}>
            <h4 className={styles.aliFilterTitle}>PRICE RANGE (₪)</h4>
            <div className={styles.aliPriceInputs}>
              <input type="number" placeholder="Min" className={styles.aliPriceInput} />
              <span>-</span>
              <input type="number" placeholder="Max" className={styles.aliPriceInput} />
            </div>
            <button className={styles.aliApplyBtn}>APPLY FILTERS</button>
          </div>
        </aside>

        {/* Right Content */}
        <div className={styles.aliGridContent}>
          <div className={styles.aliToolbar}>
            <div className={styles.aliResultCount}>
              Showing <strong>{filtered.length}</strong> clinical products found
            </div>
            <div className={styles.aliSortWrap}>
              <span className={styles.aliSortLabel}>SORT BY:</span>
              <select className={styles.aliSortSelect}>
                <option>Relevance</option>
                <option>Price Low to High</option>
                <option>Price High to Low</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className={dStyles.emptyState}>
              <p className={dStyles.emptyText}>No products found matching filters</p>
            </div>
          ) : (
            <>
              <div className={styles.aliProductGrid}>
                {filtered.map(product => {
                  const discountedPrice = getDiscountedPrice(product.price, product.discount_percentage)
                  const isPromo = product.discount_percentage > 0

                  return (
                    <div
                      key={product.id}
                      className={styles.aliProdCard}
                      onClick={() => navigate('/product-details', { state: { product } })}
                    >
                      <div className={styles.aliProdImgWrap}>
                        {isPromo && <span className={styles.aliBadgeDiscount}>-{parseFloat(product.discount_percentage).toFixed(0)}%</span>}
                        {product.stock_quantity < 20 && <span className={styles.aliBadgeLowStock}>LOW STOCK</span>}

                        {getFirstImage(product) ? (
                          <img src={getFirstImage(product)} alt={product.name} />
                        ) : (
                          <div style={{ fontSize: '3rem', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💊</div>
                        )}
                        <button className={styles.aliHeartBtn} onClick={(e) => e.stopPropagation()}>♡</button>
                      </div>

                      <div className={styles.aliProdBody}>
                        <div className={styles.aliProdCompany}>
                          {product.manufacturer || 'GENERAL PHARMA'} <span className={styles.aliTick}>✓</span>
                        </div>
                        <h4 className={styles.aliProdName}>{product.name}</h4>

                        <div className={styles.aliProdPriceRow}>
                          <span className={styles.aliPriceMain}>₪{discountedPrice || parseFloat(product.price).toFixed(2)}</span>
                          {discountedPrice && <span className={styles.aliPriceOld}>₪{parseFloat(product.price).toFixed(2)}</span>}
                          <span className={styles.aliProdMoq}>
                            {product.stock_quantity} {product.unit_type || 'Unit'}{product.stock_quantity !== 1 ? 's' : ''}
                            {(product.units_per_package > 1) ? ` (${product.stock_quantity * product.units_per_package} units)` : ''}
                          </span>
                        </div>

                        <div className={styles.aliProdMeta}>
                          <span className={styles.aliProdExp}>Exp: {product.promotion_end_date ? new Date(product.promotion_end_date).toLocaleDateString(undefined, {month:'short', year:'numeric'}) : 'Dec 2026'}</span>
                          <span className={styles.aliProdTag}>{product.category === 'Antibiotics' ? 'Cold Chain' : 'Verified'}</span>
                        </div>

                        <button
                          className={styles.aliProdAddBtn}
                          onClick={(e) => { e.stopPropagation(); handleAdd(product) }}
                          disabled={product.stock_quantity <= 0 || addingId === product.id}
                        >
                          {addingId === product.id ? 'ADDED' : 'ADD TO CART'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className={styles.aliLoadMoreWrap}>
                <div className={styles.aliLoadMoreTrack}>
                  <div className={styles.aliLoadMoreFill} style={{ width: '40%' }}></div>
                </div>
                <div className={styles.aliLoadMoreText}>You've viewed {Math.min(48, filtered.length)} of {filtered.length} products</div>
                <button className={styles.aliLoadMoreBtn}>LOAD MORE CLINICAL ASSETS</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCatalog
