import React, { useState, useEffect } from 'react'
import styles from '../styles/Pharmacy.module.css'

function CartPanel({ cartItems, cartId, onUpdateQty, onRemove, onCheckout, loading }) {
  const [checked, setChecked] = useState([])

  // sync checks when cartItems change (add/remove)
  useEffect(() => {
    setChecked(cartItems.map(() => true))
  }, [cartItems.length])

  const allChecked = checked.length > 0 && checked.every(v => v)
  const toggleAll = () => setChecked(prev => prev.map(() => !allChecked))
  const toggleItem = (i) => setChecked(prev => prev.map((v, idx) => idx === i ? !v : v))

  const selectedItems = cartItems.filter((_, i) => checked[i])
  const selectedTotal = selectedItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
  const selectedCount = selectedItems.length

  return (
    <div className={styles.cartContainer}>
      {/* Header */}
      <div className={styles.cartHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className={styles.cartTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          🛒 My Cart
          {cartItems.length > 0 && (
            <span className={styles.cartCount}>{cartItems.length}</span>
          )}
        </h3>

        {cartItems.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#475569', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              style={{ width: 16, height: 16, accentColor: '#013223', cursor: 'pointer' }}
            />
            Select All
          </label>
        )}
      </div>

      {/* Items */}
      {cartItems.length === 0 ? (
        <div className={styles.cartEmpty}>
          <div className={styles.cartEmptyIcon}>🛒</div>
          <p className={styles.cartEmptyText}>Your cart is empty</p>
        </div>
      ) : (
        <>
          {cartItems.map((item, idx) => {
            const isChecked = checked[idx] !== false
            return (
              <div
                key={item.id || idx}
                className={styles.cartItem}
                style={{
                  background: isChecked ? undefined : '#f9fafb',
                  opacity: isChecked ? 1 : 0.6,
                  transition: 'opacity 0.15s, background 0.15s',
                }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleItem(idx)}
                  style={{ width: 16, height: 16, accentColor: '#013223', cursor: 'pointer', flexShrink: 0 }}
                />

                <div className={styles.cartItemIcon}>
                  {item.image
                    ? <img src={`http://localhost:3000/uploads/products/${item.image}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    : '💊'}
                </div>

                <div className={styles.cartItemInfo}>
                  <p className={styles.cartItemName}>{item.name}</p>
                  <p className={styles.cartItemPrice}>${parseFloat(item.price).toFixed(2)} each</p>
                </div>

                <div className={styles.cartItemQty}>
                  <button
                    className={styles.cartQtyBtn}
                    onClick={() => onUpdateQty && onUpdateQty(item, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >−</button>
                  <span className={styles.cartQtyValue}>{item.quantity}</span>
                  <button
                    className={styles.cartQtyBtn}
                    onClick={() => onUpdateQty && onUpdateQty(item, item.quantity + 1)}
                  >+</button>
                </div>

                <button
                  className={styles.cartItemRemove}
                  onClick={() => onRemove && onRemove(item)}
                  title="Remove"
                >✕</button>
              </div>
            )
          })}

          {/* Footer */}
          <div className={styles.cartFooter}>
            <div className={styles.cartTotal}>
              <span className={styles.cartTotalLabel}>
                Total {selectedCount < cartItems.length ? `(${selectedCount}/${cartItems.length} selected)` : ''}
              </span>
              <span className={styles.cartTotalValue}>${selectedTotal.toFixed(2)}</span>
            </div>
            <button
              className={styles.cartCheckoutBtn}
              onClick={() => onCheckout && onCheckout(selectedItems)}
              disabled={loading || selectedCount === 0}
            >
              {loading ? 'Processing...' : selectedCount === 0 ? 'Select items' : `🚀 Checkout${selectedCount < cartItems.length ? ` (${selectedCount})` : ''}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default CartPanel
