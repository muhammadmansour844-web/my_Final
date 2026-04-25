import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PharmaBridgeSidebar from '../components/PharmacyComp/layout/PharmaBridgeSidebar'
import PharmaBridgeHeader from '../components/PharmacyComp/layout/PharmaBridgeHeader'
import PharmaDashboardHome from '../components/PharmacyComp/dashboard/PharmaDashboardHome'
import ProductCatalog from '../components/PharmacyComp/products/ProductCatalog'
import Promotions from '../components/PharmacyComp/products/Promotions'
import CartPanel from '../components/PharmacyComp/cart/CartPanel'
import PharmacyOrders from '../components/PharmacyComp/orders/PharmacyOrders'
import shell from '../components/PharmacyComp/styles/PharmaDashboardShell.module.css'
import ds from '../components/Dashescomp/Dashes.module.css'

const API_CARTS = 'http://localhost:3000/api/carts'

const tabMeta = {
  dashboard: { title: 'Dashboard', breadcrumb: 'PharmaBridge → Overview' },
  products: { title: 'Products', breadcrumb: 'PharmaBridge → Catalog' },
  cart: { title: 'Cart', breadcrumb: 'PharmaBridge → Cart' },
  my_orders: { title: 'My Orders', breadcrumb: 'PharmaBridge → Orders' },
  incoming_orders: { title: 'Incoming Orders', breadcrumb: 'PharmaBridge → Incoming' },
  my_products: { title: 'My Products', breadcrumb: 'PharmaBridge → Inventory' },
  promotions: { title: 'Promotions', breadcrumb: 'PharmaBridge → Promotions' },
  reports: { title: 'Reports', breadcrumb: 'PharmaBridge → Reports' },
  settings: { title: 'Settings', breadcrumb: 'PharmaBridge → Settings' },
}

function PharmacyDash() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'products')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [cartItems, setCartItems] = useState([])
  const [cartId, setCartId] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const userName = localStorage.getItem('user_name') || 'Dr. Aris'
  const pharmacyDisplayName = localStorage.getItem('pharmacy_display_name') || 'St. Jude Pharmacy'

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch(API_CARTS, { headers })
        if (res.ok) {
          const carts = await res.json()
          const activeCart = carts.find((c) => c.status === 'active')
          if (activeCart) {
            setCartId(activeCart.id)
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
      try {
        const res = await fetch(API_CARTS, { method: 'POST', headers })
        if (res.ok) {
          const data = await res.json()
          setCartId(data.cartId)
          await addItemToCart(data.cartId, product)
        } else {
          const data = await res.json()
          showToast(data.message || 'Failed to create cart', 'error')
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
        method: 'POST',
        headers,
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
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
    } catch { /* ignore */ }
  }

  const handleRemoveItem = async (item) => {
    try {
      const res = await fetch(`${API_CARTS}/${cartId}/items/${item.id}`, {
        method: 'DELETE',
        headers,
      })
      if (res.ok) {
        showToast('Item removed')
        refreshCartItems()
      }
    } catch {
      showToast('Network error', 'error')
    }
  }

  const handleUpdateQty = async (item, newQty) => {
    if (newQty < 1) return
    try {
      const delRes = await fetch(`${API_CARTS}/${cartId}/items/${item.id}`, {
        method: 'DELETE',
        headers,
      })
      if (!delRes.ok) {
        showToast('Failed to update quantity', 'error')
        return
      }
      const addRes = await fetch(`${API_CARTS}/${cartId}/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ product_id: item.product_id || item.id, quantity: newQty }),
      })
      if (addRes.ok) {
        refreshCartItems()
      } else {
        const data = await addRes.json()
        showToast(data.message || 'Failed to update quantity', 'error')
        refreshCartItems()
      }
    } catch {
      showToast('Network error', 'error')
    }
  }

  const handleCheckout = () => {
    if (!cartId || cartItems.length === 0) return
    navigate('/payment', { state: { cartItems, cartId } })
  }

  const current = tabMeta[activeTab] || tabMeta.dashboard

  const goTab = (id) => setActiveTab(id)

  const pageIntro = activeTab !== 'dashboard' ? (
    <div className={shell.pbPageBar}>
      <h1>{current.title}</h1>
      <p>{current.breadcrumb}</p>
    </div>
  ) : null

  return (
    <div className={shell.pbLayout}>
      {mobileMenuOpen && (
        <div
          className={`${shell.pbBackdrop} ${shell.pbBackdropOpen}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      <PharmaBridgeSidebar
        activeTab={activeTab}
        onTabChange={goTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className={shell.pbMain}>
        <PharmaBridgeHeader
          onMenuClick={() => setMobileMenuOpen((o) => !o)}
          pharmacyName={pharmacyDisplayName}
          userName={userName}
        />

        <div className={shell.pbContent}>
          {activeTab === 'dashboard' && (
            <PharmaDashboardHome
              onViewAllOrders={() => goTab('my_orders')}
              onCheckRestock={() => goTab('products')}
              onOpenProducts={() => goTab('products')}
              onPromoTab={(t) => goTab(t)}
            />
          )}

          {activeTab !== 'dashboard' && (
            <>
              {pageIntro}

              {activeTab === 'products' && <ProductCatalog onAddToCart={handleAddToCart} />}

              {activeTab === 'cart' && (
                <CartPanel
                  cartItems={cartItems}
                  cartId={cartId}
                  onUpdateQty={handleUpdateQty}
                  onRemove={handleRemoveItem}
                  onCheckout={handleCheckout}
                  loading={checkoutLoading}
                />
              )}

              {activeTab === 'my_orders' && <PharmacyOrders />}
              {activeTab === 'incoming_orders' && <PharmacyOrders incomingOnly />}

              {activeTab === 'my_products' && (
                <div className={shell.pbPlaceholder}>
                  <h2>My Products</h2>
                  <p>Pharmacy inventory will appear here. Use <strong>Products</strong> to order from the catalog.</p>
                </div>
              )}

              {activeTab === 'promotions' && <Promotions onAddToCart={handleAddToCart} />}

              {activeTab === 'reports' && (
                <div className={shell.pbPlaceholder} style={{ maxWidth: '100%' }}>
                  <h2>Reports</h2>
                  <p>Order volume and spend charts will appear here.</p>
                  <div style={{ marginTop: '1.25rem', height: 120, borderRadius: 12, background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)' }} aria-hidden />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className={shell.pbPlaceholder} style={{ maxWidth: '100%' }}>
                  <h2>Settings</h2>
                  <p>Signed in as <strong>{userName}</strong></p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className={`${ds.toast} ${toast.type === 'error' ? ds.toastError : ds.toastSuccess}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </div>
  )
}

export default PharmacyDash
