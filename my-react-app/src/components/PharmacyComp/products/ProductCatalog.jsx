import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from '../styles/Pharmacy.module.css'
import dStyles from '../../Dashescomp/Dashes.module.css'

const API_PRODUCTS = 'http://localhost:3000/api/products'

function ProductCatalog({ onAddToCart }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('') // used by toolbar search input
  const [categoryFilters, setCategoryFilters] = useState([])
  const [companyFilters, setCompanyFilters] = useState([])
  const [minPriceInput, setMinPriceInput] = useState('')
  const [maxPriceInput, setMaxPriceInput] = useState('')
  const [appliedMin, setAppliedMin] = useState(0)
  const [appliedMax, setAppliedMax] = useState(Infinity)
  const [sortBy, setSortBy] = useState('relevance')
  const [addingId, setAddingId] = useState(null)
  const [offersTimer, setoffersTimer] = useState('')
  const [quantityMap, setQuantityMap] = useState({})

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
      if (diff <= 0) { setoffersTimer('00:00:00'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setoffersTimer(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
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
    const price = parseFloat(p.price) || 0
    const matchPrice = price >= appliedMin && price <= appliedMax
    return matchSearch && matchCategory && matchCompany && matchPrice
  }).sort((a, b) => {
    const aOut = a.stock_quantity <= 0 ? 1 : 0
    const bOut = b.stock_quantity <= 0 ? 1 : 0
    if (aOut !== bOut) return aOut - bOut
    if (sortBy === 'price_asc') return parseFloat(a.price) - parseFloat(b.price)
    if (sortBy === 'price_desc') return parseFloat(b.price) - parseFloat(a.price)
    return 0
  })

  const toggleCategory = (cat) => {
    setCategoryFilters(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  const toggleCompany = (comp) => {
    setCompanyFilters(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp])
  }

  const getQty = (id) => quantityMap[id] || 1
  const setQty = (id, val) => {
    const n = Math.max(1, parseInt(val) || 1)
    setQuantityMap(prev => ({ ...prev, [id]: n }))
  }

  const handleAdd = async (product) => {
    setAddingId(product.id)
    if (onAddToCart) await onAddToCart(product, getQty(product.id))
    setQuantityMap(prev => ({ ...prev, [product.id]: 1 }))
    setTimeout(() => setAddingId(null), 800)
  }

  const getDiscountedPrice = (price, discount) => {
    if (!discount) return null
    return (parseFloat(price) * (1 - discount / 100)).toFixed(2)
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

  const topOffers = [...products]
    .filter(p => p.discount_percentage > 0)
    .sort((a, b) => b.discount_percentage - a.discount_percentage)
    .slice(0, 5)

  return (
    <div className={styles.aliLayout}>

      {/* SECTION 1: Hero Banner */}
      <div className={styles.aliHeroBanner}>
        <div className={styles.aliHeroContent}>
          <span className={styles.aliHeroTag}>LIMITED AVAILABILITY</span>
          <h1 className={styles.aliHeroTitle}>Flash Offers — Up to 40% Off</h1>
          <p className={styles.aliHeroSub}>Restock your inventory with clinic-grade precision at wholesale rates.</p>
          <div className={styles.aliHeroActions}>
            <button className={styles.aliHeroBtn}>ORDER NOW</button>
            <div className={styles.aliHeroTimer}>
              ⏱ {offersTimer.split(':').join(' : ')}
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
      {topOffers.length > 0 && (
        <div className={styles.aliFlashSection}>
          <div className={styles.aliFlashHeader}>
            <div className={styles.aliFlashHeaderLeft}>
              <span className={styles.aliFlashIcon}>⚡</span>
              <h3 className={styles.aliFlashTitle}>CLINICAL FLASH OFFERS</h3>
              <div className={styles.aliFlashTimerDark}>ENDS IN: {offersTimer}</div>
            </div>
          </div>
          <div className={styles.aliFlashRow}>
            {topOffers.map(offer => {
              const discountedPrice = getDiscountedPrice(offer.price, offer.discount_percentage)
              const maxStock = 200
              const claimedPct = Math.min(95, Math.round(100 - (offer.stock_quantity / maxStock) * 100))
              const leftCount = offer.stock_quantity
              return (
                <div key={`flash-${offer.id}`} className={styles.aliFlashCard} onClick={() => navigate('/product-details', { state: { product: offer } })}>
                  <div className={styles.aliFlashImgArea}>
                    <span className={styles.aliFlashBadge}>-{parseFloat(offer.discount_percentage).toFixed(0)}%</span>
                    {getFirstImage(offer) ? (
                      <img src={getFirstImage(offer)} alt={offer.name} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>💊</span>
                    )}
                  </div>
                  <div className={styles.aliFlashBody}>
                    <div className={styles.aliFlashName}>{offer.name}</div>
                    <div className={styles.aliFlashPriceRow}>
                      <span className={styles.aliPriceMain}>₪{discountedPrice}</span>
                      <span className={styles.aliPriceOld}>₪{parseFloat(offer.price).toFixed(0)}</span>
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
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={minPriceInput}
                onChange={e => setMinPriceInput(e.target.value)}
                className={styles.aliPriceInput}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={maxPriceInput}
                onChange={e => setMaxPriceInput(e.target.value)}
                className={styles.aliPriceInput}
              />
            </div>
            {(appliedMin > 0 || appliedMax < Infinity) && (
              <p style={{ margin: '4px 0 6px', fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                Filtering: ₪{appliedMin} – {appliedMax === Infinity ? '∞' : `₪${appliedMax}`}
              </p>
            )}
            <button
              className={styles.aliApplyBtn}
              onClick={() => {
                setAppliedMin(minPriceInput !== '' ? Math.max(0, parseFloat(minPriceInput)) : 0)
                setAppliedMax(maxPriceInput !== '' ? Math.max(0, parseFloat(maxPriceInput)) : Infinity)
              }}
            >
              APPLY FILTERS
            </button>
            {(appliedMin > 0 || appliedMax < Infinity) && (
              <button
                onClick={() => { setAppliedMin(0); setAppliedMax(Infinity); setMinPriceInput(''); setMaxPriceInput('') }}
                style={{ width: '100%', marginTop: '6px', padding: '6px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Clear Price Filter
              </button>
            )}
          </div>
        </aside>

        {/* Right Content */}
        <div className={styles.aliGridContent}>
          <div className={styles.aliToolbar}>
            <input
              type="text"
              placeholder="Search products or manufacturers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', flex: 1, maxWidth: 280, outline: 'none' }}
            />
            <div className={styles.aliResultCount}>
              Showing <strong>{filtered.length}</strong> products
            </div>
            <div className={styles.aliSortWrap}>
              <span className={styles.aliSortLabel}>SORT BY:</span>
              <select
                className={styles.aliSortSelect}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price Low to High</option>
                <option value="price_desc">Price High to Low</option>
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
                  const isOOS = product.stock_quantity <= 0
                  const discountedPrice = getDiscountedPrice(product.price, product.discount_percentage)
                  const isPromo = product.discount_percentage > 0

                  return (
                    <div
                      key={product.id}
                      className={styles.aliProdCard}
                      onClick={isOOS ? undefined : () => navigate('/product-details', { state: { product } })}
                      style={isOOS ? { cursor: 'default', filter: 'grayscale(0.35)', opacity: 0.78 } : {}}
                    >
                      <div className={styles.aliProdImgWrap}>
                        {isOOS && (
                          <span style={{
                            position: 'absolute', background: '#6b7280', color: '#fff',
                            padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                            top: '8px', left: '8px', zIndex: 2
                          }}>OUT OF STOCK</span>
                        )}
                        {!isOOS && isPromo && <span className={styles.aliBadgeDiscount}>-{parseFloat(product.discount_percentage).toFixed(0)}%</span>}
                        {!isOOS && product.stock_quantity < 20 && <span className={styles.aliBadgeLowStock}>LOW STOCK</span>}

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

                        {!isOOS && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }} onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setQty(product.id, getQty(product.id) - 1)}
                              disabled={getQty(product.id) <= 1}
                              style={{ width: 28, height: 28, borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, color: '#374151', lineHeight: 1 }}
                            >−</button>
                            <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{getQty(product.id)}</span>
                            <button
                              onClick={() => setQty(product.id, getQty(product.id) + 1)}
                              disabled={getQty(product.id) >= product.stock_quantity}
                              style={{ width: 28, height: 28, borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, color: '#374151', lineHeight: 1 }}
                            >+</button>
                          </div>
                        )}
                        <button
                          className={styles.aliProdAddBtn}
                          onClick={(e) => { e.stopPropagation(); if (!isOOS) handleAdd(product) }}
                          disabled={isOOS || addingId === product.id}
                          style={isOOS ? { background: '#9ca3af', cursor: 'not-allowed' } : {}}
                        >
                          {isOOS ? 'OUT OF STOCK' : addingId === product.id ? 'ADDED ✓' : 'ADD TO CART'}
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
