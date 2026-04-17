import React from 'react';
import { FiShoppingCart } from 'react-icons/fi';
import styles from './PharmaBridge.module.css';

export default function RelatedProducts() {
    const products = [
        { id: 1, category: 'BLOOD PRESSURE', name: 'Amlodipine Besylate...', price: '$84.20' },
        { id: 2, category: 'BETA BLOCKER', name: 'Metoprolol Succinat...', price: '$112.50' },
        { id: 3, category: 'DIABETES', name: 'Metformin HCl 500mg', price: '$42.15' },
        { id: 4, category: 'DIURETIC', name: 'Furosemide 40mg', price: '$28.90' }
    ];

    return (
        <div className={styles.relatedSection}>
            <div className={styles.relatedHeader}>
                <div>
                    <h2>Related Products</h2>
                    <p>Recommended clinical alternatives and supplements</p>
                </div>
                <button className={styles.viewAll}>VIEW ALL &rarr;</button>
            </div>

            <div className={styles.relatedGrid}>
                {products.map(p => (
                    <div key={p.id} className={styles.relatedCard}>
                        <div className={styles.relatedImgPlaceholder}></div>
                        <div className={styles.relatedInfo}>
                            <span className={styles.relatedCat}>{p.category}</span>
                            <h4 className={styles.relatedName}>{p.name}</h4>
                            <div className={styles.relatedBottom}>
                                <span className={styles.relatedPrice}>{p.price}</span>
                                <button className={styles.relatedCartBtn}><FiShoppingCart /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
