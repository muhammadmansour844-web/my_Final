import React from 'react';
import { FiShoppingCart } from 'react-icons/fi';
import styles from './PharmaBrowsing.module.css';

export default function ProductGrid() {
    const products = [
        {
            id: 1,
            badge: { text: 'NDC: 0069-4210-30', type: 'neutral' },
            category: 'CARDIOVASCULAR', price: '$124.50',
            title: 'Atorvastatin Calcium 20mg',
            company: 'Pfizer Clinical Solutions',
            expiry: '11/2025', stock: '1,420 Units', stockType: 'good'
        },
        {
            id: 2,
            badge: { text: '• LOW STOCK', type: 'danger' },
            category: 'ANTI-INFECTIVE', price: '$89.20',
            title: 'Amoxicillin 500mg Caps',
            company: 'Sandoz Pharmaceuticals',
            expiry: '04/2024', stock: '12 Units Left', stockType: 'danger'
        },
        {
            id: 3,
            badge: { text: 'BEST VALUE', type: 'success' },
            category: 'ENDOCRINOLOGY', price: '$345.00',
            title: 'Lantus Solostar Insulin',
            company: 'Sanofi-Aventis',
            expiry: '09/2026', stock: '485 Units', stockType: 'good'
        },
        {
            id: 4,
            category: 'NEUROLOGY', price: '$210.30',
            title: 'Gabapentin 300mg Caps',
            company: 'Glenmark Pharma',
            expiry: '12/2025', stock: '2,100 Units', stockType: 'good'
        },
        {
            id: 5,
            badge: { text: 'NEW ARRIVAL', type: 'success' },
            category: 'PAIN MANAGEMENT', price: '$45.15',
            title: 'Naproxen Sodium 220mg',
            company: 'Bayer Clinical',
            expiry: '06/2026', stock: '5,000+ Units', stockType: 'good'
        },
        {
            id: 6,
            badge: { text: '• LOW STOCK', type: 'danger' },
            category: 'IMMUNOLOGY', price: '$1,250.00',
            title: 'Humira Pen 40mg/0.8mL',
            company: 'AbbVie Inc.',
            expiry: '02/2025', stock: '8 Units Left', stockType: 'danger'
        }
    ];

    return (
        <div className={styles.gridContainer}>
            <div className={styles.productsGrid}>
                {products.map(p => (
                    <div key={p.id} className={styles.productCard}>
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
                                <span className={styles.cardCategory}>{p.category}</span>
                                <span className={styles.cardPrice}>{p.price}</span>
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
                                        {p.stock}
                                    </span>
                                </div>
                            </div>

                            <button className={styles.addToCartBtn}>
                                <FiShoppingCart /> ADD TO CART
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.pagination}>
                <button className={styles.pageBtnActive}>1</button>
                <button className={styles.pageBtn}>2</button>
                <button className={styles.pageBtn}>3</button>
                <span>...</span>
            </div>
        </div>
    );
}
