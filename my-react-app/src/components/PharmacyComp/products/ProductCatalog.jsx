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
    .slice(0, 4)

  return (
    <div className={styles.catalogLayout}>
      {/* Sidebar Filters */}
      <aside className={styles.filterSidebar}>
        <div className={styles.filterGroup}>
          <div className={styles.catalogSearchWrap} style={{ marginBottom: '1.5rem' }}>
            <FiSearch className={styles.catalogSearchIcon} />
            <input
              className={styles.catalogSearch}
              style={{ width: '100%', minWidth: 0 }}
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <h4 className={styles.filterGroupTitle}>Category</h4>
          {categories.map(c => (
            <label key={c} className={styles.filterOption}>
              <input type="checkbox" checked={categoryFilters.includes(c)} onChange={() => toggleCategory(c)} />
              {c}
            </label>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <h4 className={styles.filterGroupTitle}>Price Range</h4>
          <input
            type="range" min="0" max="5000" value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary-color)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>$0</span>
            <span>${maxPrice === 5000 ? '5,000+' : maxPrice}</span>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <h4 className={styles.filterGroupTitle}>Company</h4>
          {companies.map(c => (
            <label key={c} className={styles.filterOption}>
              <input type="checkbox" checked={companyFilters.includes(c)} onChange={() => toggleCompany(c)} />
              {c}
            </label>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <h4 className={styles.filterGroupTitle}>Availability</h4>
          <label className={styles.filterOption}>
            <input type="radio" name="stock" checked={stockFilter === 'in_stock'} onChange={() => setStockFilter('in_stock')} />
            In Stock
          </label>
          <label className={styles.filterOption}>
            <input type="radio" name="stock" checked={stockFilter === 'out_of_stock'} onChange={() => setStockFilter('out_of_stock')} />
            Out of Stock
          </label>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.catalogMain}>
        {/* Today's Deals Banner */}
        {topDeals.length > 0 && (
          <>
            <h2 className={styles.dealsBannerTitle}>Today's deals</h2>
            <div className={styles.dealsBanner}>
              <div className={styles.dealsLeft}>
                <span className={styles.dealsSuper}>SuperDeals</span>
                <div className={styles.dealsTimerTag}>
                  ⏱️ Ends in: {dealsTimer}
                </div>
                <button
                  className={styles.dealsShopBtn}
                  onClick={() => navigate('/pharmacy-dashboard', { state: { tab: 'promotions' } })}
                >
                  Shop now
                </button>
              </div>
              <div className={styles.dealsRight}>
                {topDeals.map(deal => (
                  <div key={deal.id} className={styles.dealsProduct}
                    onClick={() => navigate('/product-details', { state: { product: deal } })}>
                    <div className={styles.dealsProductImgWrap}>
                      {deal.image_url ? (
                        <img src={deal.image_url} alt={deal.name} />
                      ) : (
                        <span style={{ fontSize: '2rem' }}>💊</span>
                      )}
                    </div>
                    <div className={styles.dealsProductTitle}>{deal.name}</div>
                    <div className={styles.dealsPricing}>
                      <span className={styles.dealsCurrentPrice}>${getDiscountedPrice(deal.price, deal.discount_percentage)}</span>
                      <span className={styles.dealsOldPrice}>${parseFloat(deal.price).toFixed(2)}</span>
                    </div>
                    <div className={styles.dealsDiscountBadge}>-{deal.discount_percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Active Filters */}
        <div className={styles.activeFilters}>
          {categoryFilters.map(c => (
            <div key={`cat-${c}`} className={styles.activeFilterTag}>
              Category: {c} <span onClick={() => toggleCategory(c)} style={{ cursor: 'pointer' }}>✕</span>
            </div>
          ))}
          {stockFilter !== 'all' && (
            <div className={styles.activeFilterTag}>
              Availability: {stockFilter === 'in_stock' ? 'In Stock' : 'Out of Stock'}
              <span onClick={() => setStockFilter('all')} style={{ cursor: 'pointer' }}>✕</span>
            </div>
          )}
          {companyFilters.map(c => (
            <div key={`comp-${c}`} className={styles.activeFilterTag}>
              Company: {c} <span onClick={() => toggleCompany(c)} style={{ cursor: 'pointer' }}>✕</span>
            </div>
          ))}
          {maxPrice < 5000 && (
            <div className={styles.activeFilterTag}>
              Max Price: ${maxPrice} <span onClick={() => setMaxPrice(5000)} style={{ cursor: 'pointer' }}>✕</span>
            </div>
          )}
          {(categoryFilters.length > 0 || companyFilters.length > 0 || stockFilter !== 'all' || maxPrice < 5000) && (
            <button onClick={clearAllFilters} style={{
              border: 'none', background: 'none', color: 'var(--text-muted)',
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginLeft: 'auto'
            }}>
              ✕ CLEAR ALL
            </button>
          )}
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className={dStyles.emptyState}>
            <span className={dStyles.emptyIcon}>🔍</span>
            <p className={dStyles.emptyText}>No products found matching filters</p>
          </div>
        ) : (
          <div className={styles.catalogGrid}>
            {filtered.map(product => {
              const discountedPrice = getDiscountedPrice(product.price, product.discount_percentage)
              const icon = categoryIcons[product.category] || categoryIcons.default
              const isPromo = product.discount_percentage > 0
              const timeLeft = isPromo ? getTimeLeft(product) : null

              return (
                <div
                  key={product.id}
                  className={styles.catalogCard}
                  onClick={() => navigate('/product-details', { state: { product } })}
                  style={{ cursor: 'pointer' }}
                >
                  {isPromo && (
                    <span className={styles.catalogCardDiscount}>
                      {parseFloat(product.discount_percentage).toFixed(0)}% OFF
                    </span>
                  )}

                  <div className={styles.catalogCardImage} style={{ position: 'relative' }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name}
                        style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                    ) : icon}
                    {isPromo && (
                      <div className={styles.promoTimerTag}>
                        ⏱️ {timeLeft}
                      </div>
                    )}
                  </div>

                  <div className={styles.catalogCardBody}>
                    <h4 className={styles.catalogCardName}>{product.name}</h4>
                    <p className={styles.catalogCardCategory}>{product.category || 'Uncategorized'}</p>
                    {product.manufacturer && (
                      <p className={styles.catalogCardManufacturer}>by {product.manufacturer}</p>
                    )}

                    <div className={styles.catalogCardPriceRow}>
                      <div>
                        <span className={styles.catalogCardPrice}>
                          ${discountedPrice || parseFloat(product.price).toFixed(2)}
                        </span>
                        {discountedPrice && (
                          <span className={styles.catalogCardPriceOld}>
                            ${parseFloat(product.price).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className={`${styles.catalogCardStock} ${product.stock_quantity < 20 ? styles.catalogCardStockLow : styles.catalogCardStockOk}`}>
                        {product.stock_quantity} in stock
                      </span>
                    </div>

                    <button
                      className={styles.catalogAddBtn}
                      onClick={(e) => { e.stopPropagation(); handleAdd(product) }}
                      disabled={product.stock_quantity <= 0 || addingId === product.id}
                    >
                      {addingId === product.id ? '✓ Added!' : product.stock_quantity <= 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCatalog
