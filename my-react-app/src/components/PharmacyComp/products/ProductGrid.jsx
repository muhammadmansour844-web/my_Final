import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import styles from '../styles/PharmaBrowsing.module.css';

export default function ProductGrid({ products }) {
    const navigate = useNavigate();

    return (
        <div className={styles.gridContainer}>
            {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No products match your selected filters.
                </div>
            ) : (
                <div className={styles.productsGrid}>
                    {products.map(p => (
                        <div
                            key={p.id}
                            className={styles.productCard}
                            onClick={() => navigate('/product-details')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.cardImageArea}>
                                {p.badge && (
                                    <div className={`${styles.cardBadge} ${styles['badge_' + p.badge.type]}`}>
                                        {p.badge.text}
                                    </div>
                                )}
                                {/* Image Placeholder */}
                                <div className={styles.imgPlaceholder}></div>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardCategory}>{p.category.toUpperCase()}</span>
                                    <span className={styles.cardPrice}>${p.price.toFixed(2)}</span>
                                </div>

                                <h4 className={styles.cardTitle}>{p.title}</h4>
                                <p className={styles.cardCompany}>{p.company}</p>

                                <div className={styles.cardMeta}>
                                    <div className={styles.metaRow}>
                                        <span className={styles.metaLabel}>Expiry Date</span>
                                        <span className={styles.metaValue}>{p.expiry}</span>
                                    </div>
                                    <div className={styles.metaRow}>
                                        <span className={styles.metaLabel}>Stock Level</span>
                                        <span className={`${styles.metaValue} ${styles['stock_' + p.stockType]}`}>
                                            {p.stock > 0 ? `${p.stock.toLocaleString()} Units` : 'Out of Stock'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    className={styles.addToCartBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Add to cart logic
                                    }}
                                >
                                    <FiShoppingCart /> ADD TO CART
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {products.length > 0 && (
                <div className={styles.pagination}>
                    <button className={styles.pageBtnActive}>1</button>
                    <button className={styles.pageBtn}>2</button>
                    <button className={styles.pageBtn}>3</button>
                    <span>...</span>
                </div>
            )}
        </div>
    );
}
