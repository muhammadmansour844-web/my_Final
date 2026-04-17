import React from 'react';
import styles from '../styles/PharmaBrowsing.module.css';

export default function ProductFilters({ filters, onFilterChange }) {
    const categoriesList = ['Cardiovascular', 'Anti-Infectives', 'Neurology', 'Endocrinology'];
    const companiesList = ['Pfizer', 'Novartis', 'Merck & Co.'];
    const dosagesList = ['Tablet', 'Capsule', 'Injectable', 'Syrup'];

    const toggleArrayFilter = (key, item) => {
        const current = filters[key];
        const updated = current.includes(item)
            ? current.filter(i => i !== item)
            : [...current, item];
        onFilterChange(key, updated);
    };

    return (
        <div className={styles.filtersWrapper}>
            {/* Category */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3>CATEGORY</h3>
                    <span>⌄</span>
                </div>
                {categoriesList.map(cat => (
                    <label key={cat} className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={filters.categories.includes(cat)}
                            onChange={() => toggleArrayFilter('categories', cat)}
                        /> {cat}
                    </label>
                ))}
            </div>

            {/* Price Range */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3>PRICE RANGE</h3>
                </div>
                <div className={styles.sliderTrack}>
                    <div className={styles.sliderFill}></div>
                </div>
                <div className={styles.sliderLabels}>
                    <span>$0</span>
                    <span>$5,000+</span>
                </div>
            </div>

            {/* Manufacturer */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3>MANUFACTURER</h3>
                </div>
                {companiesList.map(comp => (
                    <label key={comp} className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={filters.companies.includes(comp)}
                            onChange={() => toggleArrayFilter('companies', comp)}
                        /> {comp}
                    </label>
                ))}
            </div>

            {/* Availability */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3>AVAILABILITY</h3>
                </div>
                <label className={styles.radioLabel}>
                    <input
                        type="radio"
                        name="avail"
                        checked={filters.availability === 'All'}
                        onChange={() => onFilterChange('availability', 'All')}
                    /> All
                </label>
                <label className={styles.radioLabel}>
                    <input
                        type="radio"
                        name="avail"
                        checked={filters.availability === 'In Stock'}
                        onChange={() => onFilterChange('availability', 'In Stock')}
                    /> In Stock
                </label>
                <label className={styles.radioLabel}>
                    <input
                        type="radio"
                        name="avail"
                        checked={filters.availability === 'Out of Stock'}
                        onChange={() => onFilterChange('availability', 'Out of Stock')}
                    /> Out of Stock
                </label>
            </div>

            {/* Dosage Form */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3>DOSAGE FORM</h3>
                </div>
                <div className={styles.dosageGrid}>
                    {dosagesList.map(dos => (
                        <button
                            key={dos}
                            className={`${styles.dosageBtn} ${filters.dosage === dos ? styles.dosageActive : ''}`}
                            onClick={() => onFilterChange('dosage', filters.dosage === dos ? '' : dos)}
                        >
                            {dos}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
