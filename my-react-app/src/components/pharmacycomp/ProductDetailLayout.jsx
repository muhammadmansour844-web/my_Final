import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ProductHero from './ProductHero';
import ProductTabs from './ProductTabs';
import RelatedProducts from './RelatedProducts';
import styles from './PharmaBridge.module.css';

export default function ProductDetailLayout() {
    return (
        <div className={styles.layout}>
            <Sidebar />
            <div className={styles.main}>
                <Header />
                <div className={styles.content}>
                    <div className={styles.breadcrumb}>
                        <span>PRODUCT</span> &gt; <span>CARDIOVASCULAR</span> &gt; <strong>LIPID-LOWERING AGENT 40MG</strong>
                    </div>
                    <ProductHero />
                    <ProductTabs />
                    <RelatedProducts />
                </div>
            </div>
        </div>
    );
}
