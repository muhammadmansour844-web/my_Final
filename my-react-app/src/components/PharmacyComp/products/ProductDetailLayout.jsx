import React from 'react';
import MarketplaceSidebar from '../layout/MarketplaceSidebar';
import MarketplaceHeader from '../layout/MarketplaceHeader';
import ProductHero from './ProductHero';
import ProductTabs from './ProductTabs';
import RelatedProducts from './RelatedProducts';
import styles from '../styles/PharmaBridge.module.css';

export default function ProductDetailLayout() {
    return (
        <div className={styles.layout}>
            <MarketplaceSidebar />
            <div className={styles.main}>
                <MarketplaceHeader />
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
