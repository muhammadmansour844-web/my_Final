import React, { useState, useEffect } from 'react'
import { FiSearch } from 'react-icons/fi'
import styles from '../styles/Pharmacy.module.css'
import dStyles from '../../Dashescomp/Dashes.module.css'

const API_PRODUCTS = 'http://localhost:3000/api/products'

// Category icons mapping
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
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
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
        if (res.ok) setProducts(await res.json())
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))]

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                        p.manufacturer?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
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
    if (!discount) return null
    return (parseFloat(price) * (1 - discount / 100)).toFixed(2)
  }

  if (loading) {
    return (
      <div className={dStyles.loadingContainer}>
        <div className={dStyles.spinner}></div>
        <p className={dStyles.loadingText}>Loading catalog...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className={styles.catalogToolbar}>
        <div className={styles.catalogSearchWrap}>
          <FiSearch className={styles.catalogSearchIcon} />
          <input
            className={styles.catalogSearch}
            placeholder="Search drugs by name or manufacturer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.catalogFilter}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Categories' : c}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className={dStyles.emptyState}>
          <span className={dStyles.emptyIcon}>🔍</span>
          <p className={dStyles.emptyText}>No products found</p>
        </div>
      ) : (
        <div className={styles.catalogGrid}>
          {filtered.map(product => {
            const discountedPrice = getDiscountedPrice(product.price, product.discount_percentage)
            const icon = categoryIcons[product.category] || categoryIcons.default

            return (
              <div key={product.id} className={styles.catalogCard}>
                {product.discount_percentage > 0 && (
                  <span className={styles.catalogCardDiscount}>-{product.discount_percentage}%</span>
                )}

                <div className={styles.catalogCardImage}>{icon}</div>

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
                    onClick={() => handleAdd(product)}
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
  )
}

export default ProductCatalog
