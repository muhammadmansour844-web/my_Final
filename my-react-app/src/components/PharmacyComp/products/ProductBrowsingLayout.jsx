import React, { useState, useMemo } from 'react';
import MarketplaceSidebar from '../layout/MarketplaceSidebar';
import MarketplaceHeader from '../layout/MarketplaceHeader';
import ProductFilters from './ProductFilters';
import ProductGrid from './ProductGrid';
import styles from '../styles/PharmaBrowsing.module.css';

const MOCK_PRODUCTS = [
    {
        id: 1,
        badge: { text: 'NDC: 0069-4210-30', type: 'neutral' },
        category: 'Cardiovascular', price: 124.50,
        title: 'Atorvastatin Calcium 20mg',
        company: 'Pfizer',
        expiry: '11/2025', stock: 1420, stockType: 'good',
        dosage: 'Tablet'
    },
    {
        id: 2,
        badge: { text: '• LOW STOCK', type: 'danger' },
        category: 'Anti-Infectives', price: 89.20,
        title: 'Amoxicillin 500mg Caps',
        company: 'Sandoz',
        expiry: '04/2024', stock: 12, stockType: 'danger',
        dosage: 'Capsule'
    },
    {
        id: 3,
        badge: { text: 'BEST VALUE', type: 'success' },
        category: 'Endocrinology', price: 345.00,
        title: 'Lantus Solostar Insulin',
        company: 'Sanofi-Aventis',
        expiry: '09/2026', stock: 485, stockType: 'good',
        dosage: 'Injectable'
    },
    {
        id: 4,
        category: 'Neurology', price: 210.30,
        title: 'Gabapentin 300mg Caps',
        company: 'Novartis',
        expiry: '12/2025', stock: 2100, stockType: 'good',
        dosage: 'Capsule'
    },
    {
        id: 5,
        badge: { text: 'NEW ARRIVAL', type: 'success' },
        category: 'Cardiovascular', price: 45.15,
        title: 'Naproxen Sodium 220mg',
        company: 'Merck & Co.',
        expiry: '06/2026', stock: 5000, stockType: 'good',
        dosage: 'Tablet'
    },
    {
        id: 6,
        badge: { text: '• LOW STOCK', type: 'danger' },
        category: 'Neurology', price: 1250.00,
        title: 'Humira Pen 40mg/0.8mL',
        company: 'Pfizer',
        expiry: '02/2025', stock: 0, stockType: 'danger',
        dosage: 'Injectable'
    }
];

export default function ProductBrowsingLayout() {
    const [filters, setFilters] = useState({
        categories: [],
        companies: [],
        availability: 'All', // 'All', 'In Stock', 'Out of Stock'
        dosage: ''
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearAll = () => {
        setFilters({ categories: [], companies: [], availability: 'All', dosage: '' });
    };

    const removeFilter = (key, item = null) => {
        if (Array.isArray(filters[key]) && item) {
            handleFilterChange(key, filters[key].filter(i => i !== item));
        } else {
            handleFilterChange(key, key === 'availability' ? 'All' : '');
        }
    };

    const filteredProducts = useMemo(() => {
        return MOCK_PRODUCTS.filter(p => {
            if (filters.categories.length > 0 && !filters.categories.includes(p.category)) return false;
            if (filters.companies.length > 0 && !filters.companies.includes(p.company)) return false;
            if (filters.availability === 'In Stock' && p.stock <= 0) return false;
            if (filters.availability === 'Out of Stock' && p.stock > 0) return false;
            if (filters.dosage && p.dosage !== filters.dosage) return false;
            return true;
        });
    }, [filters]);

    return (
        <div className={styles.layout}>
            <MarketplaceSidebar />
            <div className={styles.main}>
                <MarketplaceHeader />
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
                                {filters.categories.map(c => (
                                    <span key={c} className={styles.filterChip} onClick={() => removeFilter('categories', c)} style={{ cursor: 'pointer' }}>
                                        Category: {c} ✕
                                    </span>
                                ))}
                                {filters.companies.map(c => (
                                    <span key={c} className={styles.filterChip} onClick={() => removeFilter('companies', c)} style={{ cursor: 'pointer' }}>
                                        Company: {c} ✕
                                    </span>
                                ))}
                                {filters.availability !== 'All' && (
                                    <span className={styles.filterChip} onClick={() => removeFilter('availability')} style={{ cursor: 'pointer' }}>
                                        Availability: {filters.availability} ✕
                                    </span>
                                )}
                                {filters.dosage && (
                                    <span className={styles.filterChip} onClick={() => removeFilter('dosage')} style={{ cursor: 'pointer' }}>
                                        Dosage: {filters.dosage} ✕
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={styles.headerRight}>
                            <button className={styles.clearBtn} onClick={clearAll}>= CLEAR ALL</button>
                            <button className={styles.recentOrdersBtn}>RECENT ORDERS</button>
                        </div>
                    </div>

                    <div className={styles.marketplaceLayout}>
                        <ProductFilters filters={filters} onFilterChange={handleFilterChange} />
                        <ProductGrid products={filteredProducts} />
                    </div>
                </div>
            </div>
        </div>
    );
}
