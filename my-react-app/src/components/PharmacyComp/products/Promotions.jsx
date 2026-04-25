import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from '../styles/Promotions.module.css'
import dStyles from '../../Dashescomp/Dashes.module.css'

const API_PRODUCTS = 'http://localhost:3000/api/products'

function Promotions({ onAddToCart }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [addingId, setAddingId] = useState(null)

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
        if (res.ok) {
          const allProducts = await res.json()
          // Only keep products that have a discount
          const discounted = allProducts.filter(p => p.discount_percentage && p.discount_percentage > 0)
          setProducts(discounted)
        }
      } catch (err) {
        console.error('Failed to fetch promotions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Derive categories from filtered products
  const availableCategories = ['All', 'Antibiotics', 'Analgesics', 'Cardiovascular', 'Biologics', ...new Set(products.map(p => p.category).filter(Boolean))]
  const uniqueCategories = [...new Set(availableCategories)]

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                        p.manufacturer?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'All' || p.category === categoryFilter || 
                          // Map generic categories if real ones are missing for demo purposes
                          (categoryFilter === 'Antibiotics' && p.category?.includes('Anti')) ||
                          (categoryFilter === 'Analgesics' && p.category?.includes('Pain'))
    
    return matchSearch && matchCategory
  })

  const handleAdd = async (product) => {
    setAddingId(product.id)
    if (onAddToCart) {
      await onAddToCart(product)
    }
    setTimeout(() => setAddingId(null), 800)
  }

  const getDiscountedPrice = (price, discount) => {
    return (parseFloat(price) * (1 - discount / 100)).toFixed(2)
  }

  const getImageForProduct = (product) => {
    const cat = (product.category || '').toLowerCase()
    if (cat.includes('respiratory') || cat.includes('asthma')) return '🩺'
    if (cat.includes('vaccine') || cat.includes('inject') || cat.includes('biologic')) return '💉'
    return '💊'
  }

  // Generate a random time left for the demo (or use expiry date if close)
  const getRandomTimeLeft = (id) => {
    const days = (id % 5) + 1;
    const hours = (id * 7) % 24;
    return `${days}d ${hours}h left`;
  }

  if (loading) {
    return (
      <div className={dStyles.loadingContainer}>
        <div className={dStyles.spinner}></div>
        <p className={dStyles.loadingText}>Loading promotions...</p>
      </div>
    )
  }

  return (
    <div className={styles.promotionsLayout}>
      {/* Top Header */}
      <div className={styles.promoHeader}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search promotions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Hero Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroTag}>FLASH SALE</div>
        <h1 className={styles.heroTitle}>Quarterly Stock Clearance: Up to 45% Off Essential Catalog</h1>
        <p className={styles.heroSubtitle}>
          Inventory optimization for certified pharmacies. Secured logistics included with every order.
        </p>
        <button className={styles.heroButton}>VIEW ALL OFFERS</button>
      </div>

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <div className={styles.categories}>
          {uniqueCategories.slice(0, 5).map(c => (
            <div
              key={c}
              className={`${styles.categoryPill} ${categoryFilter === c ? styles.categoryPillActive : ''}`}
              onClick={() => setCategoryFilter(c)}
            >
              {c}
            </div>
          ))}
        </div>
        <div className={styles.sortWrap}>
          Sort by: 
          <select className={styles.sortSelect}>
            <option>Expiration Date</option>
            <option>Discount %</option>
            <option>Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No active promotions found for the selected criteria.</p>
        </div>
      ) : (
        <div className={styles.promoGrid}>
          {filtered.map(product => {
            const discountedPrice = getDiscountedPrice(product.price, product.discount_percentage)
            const productImage = getImageForProduct(product)
            const timeLeft = getRandomTimeLeft(product.id)
            const batchNum = `BTH-${product.id * 1024}`.substring(0, 8)

            return (
              <div 
                key={product.id} 
                className={styles.promoCard}
                onClick={() => navigate('/product-details', { state: { product } })}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.cardImageWrap}>
                  <span className={styles.discountBadge}>{product.discount_percentage}% OFF</span>
                  <div className={styles.cardImage} style={{ fontSize: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', height: '140px', width: '100%' }}>
                    {productImage}
                  </div>
                  <div className={styles.timeLeft}>
                    ⏱️ {timeLeft}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardCategoryRow}>
                    <span className={styles.cardCategory}>{product.category || 'General'}</span>
                    <span className={styles.cardSaveIcon} style={{cursor: 'pointer'}} onClick={(e) => e.stopPropagation()}>🔖</span>
                  </div>
                  
                  <h4 className={styles.cardName}>{product.name}</h4>
                  
                  <div className={styles.cardPriceRow}>
                    <span className={styles.cardPrice}>${discountedPrice}</span>
                    <span className={styles.cardOldPrice}>${parseFloat(product.price).toFixed(2)}</span>
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.cardBatch}>Batch: {batchNum}</span>
                    <button
                      className={styles.cardAddBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAdd(product)
                      }}
                      disabled={product.stock_quantity <= 0 || addingId === product.id}
                      title="Add to Cart"
                    >
                      {addingId === product.id ? '✓' : '🛒'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div className={styles.loadMoreWrap}>
          <button className={styles.loadMoreBtn}>
            Load More Promotions ⬇️
          </button>
          <span className={styles.loadMoreText}>Showing {filtered.length} current offers</span>
        </div>
      )}
    </div>
  )
}

export default Promotions
