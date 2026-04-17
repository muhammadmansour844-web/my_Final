import React from 'react';
import { FiSearch, FiBell, FiUser } from 'react-icons/fi';
import styles from '../styles/PharmaBridge.module.css';

export default function MarketplaceHeader() {
    return (
        <header className={styles.header}>
            <div className={styles.searchBar}>
                <FiSearch className={styles.searchIcon} />
                <input type="text" placeholder="Search product catalogue..." className={styles.searchInput} />
            </div>
            <div className={styles.headerRight}>
                <button className={styles.iconBtn}>
                    <FiBell />
                    <span className={styles.badge}></span>
                </button>
                <button className={styles.iconBtn}>
                    <FiUser />
                </button>
            </div>
        </header>
    );
}
