import React from 'react';
import styles from './PharmaBrowsing.module.css';

export default function ProductFilters() {
    return (
        <div className={styles.filtersWrapper}>
            {/* Category */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3>CATEGORY</h3>
                    <span>⌄</span>
                </div>
                <label className={styles.checkboxLabel}>
                    <input type="checkbox" defaultChecked /> Cardiovascular
                </label>
                <label className={styles.checkboxLabel}>
                    <input type="checkbox" /> Anti-Infectives
                </label>
                <label className={styles.checkboxLabel}>
                    <input type="checkbox" /> Neurology
                </label>
                <label className={styles.checkboxLabel}>
                    <input type="checkbox" /> Endocrinology
                </label>
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
                <label className={styles.checkboxLabel}>
                    <input type="checkbox" defaultChecked /> Pfizer
                </label>
                <label className={styles.checkboxLabel}>
                    <input type="checkbox" /> Novartis
                </label>
                <label className={styles.checkboxLabel}>
                    <input type="checkbox" /> Merck & Co.
                </label>
            </div>

            {/* Availability */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3>AVAILABILITY</h3>
                </div>
                <label className={styles.radioLabel}>
                    <input type="radio" name="avail" defaultChecked /> In Stock
                </label>
                <label className={styles.radioLabel}>
                    <input type="radio" name="avail" /> Out of Stock
                </label>
            </div>

            {/* Dosage Form */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h3>DOSAGE FORM</h3>
                </div>
                <div className={styles.dosageGrid}>
                    <button className={styles.dosageBtn}>Tablet</button>
                    <button className={`${styles.dosageBtn} ${styles.dosageActive}`}>Capsule</button>
                    <button className={styles.dosageBtn}>Injectable</button>
                    <button className={styles.dosageBtn}>Syrup</button>
                </div>
            </div>
        </div>
    );
}
