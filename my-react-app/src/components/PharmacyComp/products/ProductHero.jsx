import React from 'react';
import { FiCheckCircle, FiShoppingCart, FiTruck, FiShield } from 'react-icons/fi';
import styles from '../styles/PharmaBridge.module.css';

export default function ProductHero() {
    return (
        <div className={styles.heroSection}>
            {/* قسم الصور (اليسار) */}
            <div className={styles.imageGallery}>
                <div className={styles.mainImage}>
                    {/* استبدل بـ src للصورة الحقيقية */}
                    <div className={styles.imagePlaceholder}>Product Image</div>
                </div>
                <div className={styles.thumbnails}>
                    <div className={`${styles.thumbPlaceholder} ${styles.activeThumb}`}></div>
                    <div className={styles.thumbPlaceholder}></div>
                    <div className={styles.thumbPlaceholder}></div>
                    <div className={styles.thumbPlaceholder}></div>
                </div>
            </div>

            {/* قسم المعلومات (اليمين) */}
            <div className={styles.productInfo}>
                <span className={styles.categoryChip}>💊 CARDIOLOGY</span>
                <h1 className={styles.title}>Lipitor 40mg<br />(Atorvastatin)</h1>

                <div className={styles.meta}>
                    <span className={styles.manufacturer}>Pfizer Inc. <FiCheckCircle className={styles.verified} /></span>
                    <span className={styles.sku}>SKU: PB-4492-CARD</span>
                </div>

                <div className={styles.pricing}>
                    <span className={styles.currentPrice}>$142.50</span>
                    <span className={styles.oldPrice}>$167.65</span>
                    <span className={styles.discountBadge}>15% OFF</span>
                </div>

                <p className={styles.b2bNote}>
                    Exclusive B2B clinical pricing available for orders exceeding 50 units. Calculated based on current medical tier status.
                </p>

                <div className={styles.orderSection}>
                    <label className={styles.qtyLabel}>ORDER QUANTITY</label>
                    <div className={styles.qtyControls}>
                        <div className={styles.qtyInputGroup}>
                            <button>-</button>
                            <input type="text" value="12" readOnly />
                            <button>+</button>
                        </div>
                        <span className={styles.stockInfo}>In Stock: 4,200 units</span>
                    </div>

                    <button className={styles.addToCartBtn}>
                        <FiShoppingCart /> ADD TO CART
                    </button>
                </div>

                <div className={styles.trustBadges}>
                    <div className={styles.trustBadge}><FiTruck /> FAST DELIVERY</div>
                    <div className={styles.trustBadge}><FiShield /> QUALITY ASSURED</div>
                </div>
            </div>
        </div>
    );
}
