import React from 'react'
import styles from '../styles/Pharmacy.module.css'
import dStyles from '../../Dashescomp/Dashes.module.css'

function CartPanel({ cartItems, cartId, onUpdateQty, onRemove, onCheckout, loading }) {
  const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)

  return (
    <div className={styles.cartContainer}>
      {/* Header */}
      <div className={styles.cartHeader}>
        <h3 className={styles.cartTitle}>
          🛒 My Cart
          {cartItems.length > 0 && (
            <span className={styles.cartCount}>{cartItems.length}</span>
          )}
        </h3>
      </div>

      {/* Items */}
      {cartItems.length === 0 ? (
        <div className={styles.cartEmpty}>
          <div className={styles.cartEmptyIcon}>🛒</div>
          <p className={styles.cartEmptyText}>Your cart is empty</p>
        </div>
      ) : (
        <>
          {cartItems.map((item, idx) => (
            <div key={item.id || idx} className={styles.cartItem}>
              <div className={styles.cartItemIcon}>💊</div>
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
          ))}

          {/* Footer */}
          <div className={styles.cartFooter}>
            <div className={styles.cartTotal}>
              <span className={styles.cartTotalLabel}>Total</span>
              <span className={styles.cartTotalValue}>${total.toFixed(2)}</span>
            </div>
            <button
              className={styles.cartCheckoutBtn}
              onClick={onCheckout}
              disabled={loading || cartItems.length === 0}
            >
              {loading ? 'Processing...' : '🚀 Checkout'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default CartPanel
