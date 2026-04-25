import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const API_CARTS = 'http://localhost:3000/api/carts'

function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { cartItems = [], cartId } = location.state || {}

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
  const tax = subtotal * 0.05
  const total = subtotal + tax

  const handlePlaceOrder = async () => {
    if (!cartId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_CARTS}/${cartId}/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      })
      if (res.ok) {
        navigate('/pharmacy-dashboard', { state: { tab: 'my_orders' } })
      } else {
        const data = await res.json()
        setError(data.message || 'Checkout failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!cartId || cartItems.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
        <h2>No items in cart</h2>
        <button onClick={() => navigate('/pharmacy-dashboard', { state: { tab: 'products' } })}
          style={{ padding: '10px 24px', borderRadius: '8px', background: '#013223', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Back to Products
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f5', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#013223', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
          ← Back
        </button>
        <h1 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Checkout</h1>
      </div>

      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Order Items */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0f172a' }}>Order Items</h2>
          {cartItems.map((item, idx) => (
            <div key={item.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 48, height: 48, borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>💊</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{item.name}</p>
                <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.78rem' }}>Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}</p>
              </div>
              <span style={{ fontWeight: 700, color: '#013223' }}>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#0f172a' }}>Order Summary</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#475569', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tax (5%)</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>${tax.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1.25rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#013223' }}>${total.toFixed(2)}</span>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            style={{
              width: '100%', padding: '0.9rem', border: 'none', borderRadius: '12px',
              background: loading ? '#9ca3af' : '#013223', color: '#fff',
              fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 5px 15px rgba(1,50,35,0.25)'
            }}
          >
            {loading ? 'Processing...' : '🚀 Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
