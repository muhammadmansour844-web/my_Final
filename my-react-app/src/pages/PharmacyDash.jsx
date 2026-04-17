import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Dashescomp/Sidebar'
import DashHeader from '../components/Dashescomp/DashHeader'
import StatsCard from '../components/Dashescomp/StatsCard'
import ProductCatalog from '../components/pharmacycomp/ProductCatalog'
import CartPanel from '../components/pharmacycomp/CartPanel'
import PharmacyOrders from '../components/pharmacycomp/PharmacyOrders'
import ProductDetailLayout from '../components/pharmacycomp/ProductDetailLayout'
import styles from '../components/Dashescomp/Dashes.module.css'

const API_CARTS = 'http://localhost:3000/api/carts'

const tabTitles = {
  catalog: { title: 'Drug Catalog', breadcrumb: 'Pharmacy → Browse Drugs' },
  product: { title: 'Product Details', breadcrumb: 'Pharmacy → Browse Drugs → Details' },
  cart: { title: 'Shopping Cart', breadcrumb: 'Pharmacy → My Cart' },
  orders: { title: 'My Orders', breadcrumb: 'Pharmacy → Order History' },
}

function PharmacyDash() {
  const [activeTab, setActiveTab] = useState('catalog')
  const [selectedProductId, setSelectedProductId] = useState(null) // null = catalog list, number = detail page

  const [cartItems, setCartItems] = useState([])
  const [cartId, setCartId] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Fetch cart on mount
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch(API_CARTS, { headers })
        if (res.ok) {
          const carts = await res.json()
          const activeCart = carts.find(c => c.status === 'active')
          if (activeCart) {
            setCartId(activeCart.id)
            // Fetch cart items
            const itemsRes = await fetch(`${API_CARTS}/${activeCart.id}/items`, { headers })
            if (itemsRes.ok) {
              const data = await itemsRes.json()
              setCartItems(data.items || [])
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch cart:', err)
      }
    }
    fetchCart()
  }, [])

  const handleAddToCart = async (product) => {
    if (!cartId) {
      // Create a cart first
      try {
        const res = await fetch(API_CARTS, { method: 'POST', headers })
        if (res.ok) {
          const data = await res.json()
          setCartId(data.cartId)
          // Now add to the new cart
          await addItemToCart(data.cartId, product)
        }
      } catch {
        showToast('Failed to create cart', 'error')
      }
    } else {
      await addItemToCart(cartId, product)
    }
  }

  const addItemToCart = async (cId, product) => {
    try {
      const res = await fetch(`${API_CARTS}/${cId}/items`, {
        method: 'POST', headers,
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      })
      if (res.ok) {
        showToast(`${product.name} added to cart!`)
        refreshCartItems(cId)
      } else {
        const data = await res.json()
        showToast(data.message || 'Failed to add', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
  }

  const refreshCartItems = async (cId) => {
    try {
      const res = await fetch(`${API_CARTS}/${cId || cartId}/items`, { headers })
      if (res.ok) {
        const data = await res.json()
        setCartItems(data.items || [])
      }
    } catch { /* silently fail */ }
  }

  const handleRemoveItem = async (item) => {
    try {
      const res = await fetch(`${API_CARTS}/${cartId}/items/${item.id}`, {
        method: 'DELETE', headers
      })
      if (res.ok) {
        showToast('Item removed')
        refreshCartItems()
      }
    } catch {
      showToast('Network error', 'error')
    }
  }

  const handleCheckout = async () => {
    if (!cartId || cartItems.length === 0) return
    setCheckoutLoading(true)
    try {
      // For now, use company_id 1 as a placeholder
      const res = await fetch(`${API_CARTS}/${cartId}/checkout`, {
        method: 'POST', headers,
        body: JSON.stringify({ company_id: 1 })
      })
      if (res.ok) {
        showToast('Order placed successfully! 🎉')
        setCartItems([])
        setCartId(null)
        setActiveTab('orders')
      } else {
        const data = await res.json()
        showToast(data.message || 'Checkout failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const current = tabTitles[activeTab] || tabTitles.catalog

  return (
    <div className={styles.dashLayout}>
      <Sidebar role="pharmacy_admin" activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={styles.dashMain}>
        <DashHeader
          title={current.title}
          breadcrumb={current.breadcrumb}
          role="pharmacy_admin"
          userName="Pharmacy"
        />

        <div className={styles.dashContent}>
          {/* Stats */}
          {activeTab === 'catalog' && (
            <div className={styles.statsGrid}>
              <StatsCard title="Cart Items" value={cartItems.length} icon="🛒" color="blue" />
              <StatsCard
                title="Cart Total"
                value={`$${cartItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0).toFixed(2)}`}
                icon="💰"
                color="green"
              />
            </div>
          )}

          {activeTab === 'catalog' && !selectedProductId && <ProductCatalog onAddToCart={handleAddToCart} onSelectProduct={setSelectedProductId} />}
          {/* Product Detail View */}
          {activeTab === 'catalog' && selectedProductId && (
            <div style={{ margin: '-2rem -2.5rem' }}>
              <ProductDetailLayout
                productId={selectedProductId}
                onBack={() => setSelectedProductId(null)}
                onAddToCart={handleAddToCart}
                onProductSelect={(id) => setSelectedProductId(id)}
              />
            </div>
          )}
          {activeTab === 'cart' && (
            <CartPanel
              cartItems={cartItems}
              cartId={cartId}
              onRemove={handleRemoveItem}
              onCheckout={handleCheckout}
              loading={checkoutLoading}
            />
          )}
          {activeTab === 'orders' && <PharmacyOrders />}
        </div>
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </div>
  )
}

export default PharmacyDash
