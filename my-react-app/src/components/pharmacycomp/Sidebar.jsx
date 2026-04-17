import React from 'react';
import { FiGrid, FiBox, FiShoppingCart, FiInbox, FiTag, FiBarChart2, FiSettings, FiUser } from 'react-icons/fi';
import styles from './PharmaBridge.module.css';

export default function Sidebar() {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoContainer}>
                <h1 className={styles.logo}>PharmaBridge</h1>
                <span className={styles.subtitle}>CLINICAL CURATOR</span>
            </div>

            <nav className={styles.nav}>
                <button className={styles.navLink}><FiGrid /> Dashboard</button>
                <button className={`${styles.navLink} ${styles.active}`}><FiBox /> Products</button>
                <button className={styles.navLink}><FiShoppingCart /> My Orders</button>
                <button className={styles.navLink}><FiInbox /> Incoming Orders</button>
                <button className={styles.navLink}><FiBox /> My Products</button>
                <button className={styles.navLink}><FiTag /> Promotions</button>
                <button className={styles.navLink}><FiBarChart2 /> Reports</button>
                <button className={styles.navLink}><FiSettings /> Settings</button>
            </nav>

            <div className={styles.profile}>
                <FiUser /> User Profile
            </div>
        </aside>
    );
}
