import React from 'react';
import Sidebar from './Sidebar'; /* نفس الـ Sidebar السابق */
import Header from './Header';   /* نفس الـ Header السابق */
import ProductFilters from './ProductFilters';
import ProductGrid from './ProductGrid';
import styles from './PharmaBrowsing.module.css';

export default function ProductBrowsingLayout() {
    return (
        <div className={styles.layout}>
            <Sidebar />
            <div className={styles.main}>
                <Header />
                <div className={styles.content}>
                    <div className={styles.breadcrumb}>
                        <span>INVENTORY</span> &gt; <strong>PRODUCT BROWSING</strong>
                    </div>

                    <div className={styles.pageHeader}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.pageTitle}>Pharmaceutical Marketplace</h1>
                            <p className={styles.pageSubtitle}>
                                Browse and procure certified clinical supplies with real-time stock monitoring and batch tracking.
                            </p>
                            <div className={styles.activeFilters}>
                                <span className={styles.filterChip}>Category: Cardiovascular ✕</span>
                                <span className={styles.filterChip}>Availability: In Stock ✕</span>
                                <span className={styles.filterChip}>Company: Pfizer ✕</span>
                            </div>
                        </div>
                        <div className={styles.headerRight}>
                            <button className={styles.clearBtn}>= CLEAR ALL</button>
                            <button className={styles.recentOrdersBtn}>RECENT ORDERS</button>
                        </div>
                    </div>

                    <div className={styles.marketplaceLayout}>
                        <ProductFilters />
                        <ProductGrid />
                    </div>
                </div>
            </div>
        </div>
    );
}
