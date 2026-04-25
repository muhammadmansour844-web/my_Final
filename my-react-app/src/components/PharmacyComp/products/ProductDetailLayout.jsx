import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PharmaBridgeSidebar from '../layout/PharmaBridgeSidebar';
import PharmaBridgeHeader from '../layout/PharmaBridgeHeader';
import ProductHero from './ProductHero';
import ProductTabs from './ProductTabs';
import RelatedProducts from './RelatedProducts';
import shell from '../styles/PharmaDashboardShell.module.css';
import styles from '../styles/PharmaBridge.module.css';

export default function ProductDetailLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const product = location.state?.product;

    const userName = localStorage.getItem('user_name') || 'Dr. Aris';
    const pharmacyDisplayName = localStorage.getItem('pharmacy_display_name') || 'St. Jude Pharmacy';

    const handleTabChange = (id) => {
        navigate('/pharmacy-dashboard', { state: { tab: id } });
    };

    if (!product) {
        return (
            <div className={shell.pbLayout}>
                {mobileMenuOpen && (
                    <div
                        className={`${shell.pbBackdrop} ${shell.pbBackdropOpen}`}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-hidden
                    />
                )}
                <PharmaBridgeSidebar
                    activeTab="products"
                    onTabChange={handleTabChange}
                    mobileOpen={mobileMenuOpen}
                    onCloseMobile={() => setMobileMenuOpen(false)}
                />
                <div className={shell.pbMain}>
                    <PharmaBridgeHeader
                        onMenuClick={() => setMobileMenuOpen(o => !o)}
                        pharmacyName={pharmacyDisplayName}
                        userName={userName}
                    />
                    <div className={shell.pbContent} style={{ textAlign: 'center', padding: '50px' }}>
                        <h2>Product not found</h2>
                        <button
                            onClick={() => navigate('/pharmacy-dashboard', { state: { tab: 'products' } })}
                            style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
                        >
                            Back to Catalog
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={shell.pbLayout}>
            {mobileMenuOpen && (
                <div
                    className={`${shell.pbBackdrop} ${shell.pbBackdropOpen}`}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden
                />
            )}
            <PharmaBridgeSidebar
                activeTab="products"
                onTabChange={handleTabChange}
                mobileOpen={mobileMenuOpen}
                onCloseMobile={() => setMobileMenuOpen(false)}
            />
            <div className={shell.pbMain}>
                <PharmaBridgeHeader
                    onMenuClick={() => setMobileMenuOpen(o => !o)}
                    pharmacyName={pharmacyDisplayName}
                    userName={userName}
                />
                <div className={shell.pbContent}>
                    <div className={styles.breadcrumb} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: '10px', marginBottom: '20px'
                    }}>
                        <div>
                            <span style={{ color: '#666', fontSize: '0.85rem', fontWeight: 600 }}>PRODUCTS</span>
                            <span style={{ margin: '0 8px', color: '#ccc' }}>/</span>
                            <span style={{ color: '#666', fontSize: '0.85rem', fontWeight: 600 }}>{product.category?.toUpperCase() || 'UNCATEGORIZED'}</span>
                            <span style={{ margin: '0 8px', color: '#ccc' }}>/</span>
                            <strong style={{ color: '#013223', fontSize: '0.85rem' }}>{product.name?.toUpperCase()}</strong>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 18px', borderRadius: '8px',
                                border: '1px solid #ddd', background: '#fff',
                                color: '#333', fontWeight: 600, cursor: 'pointer',
                                fontSize: '0.85rem', whiteSpace: 'nowrap'
                            }}
                        >
                            ← Back
                        </button>
                    </div>
                    <ProductHero product={product} />
                    <ProductTabs product={product} />
                    <RelatedProducts currentCategory={product.category} />
                </div>
            </div>
        </div>
    );
}
