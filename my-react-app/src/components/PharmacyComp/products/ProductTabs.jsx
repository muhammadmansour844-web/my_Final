import React from 'react';
import styles from '../styles/PharmaBridge.module.css';

export default function ProductTabs() {
    return (
        <div className={styles.tabsSection}>
            <div className={styles.tabHeaders}>
                <button className={`${styles.tabBtn} ${styles.activeTab}`}>DESCRIPTION</button>
                <button className={styles.tabBtn}>DETAILS</button>
                <button className={styles.tabBtn}>SHIPPING</button>
            </div>

            <div className={styles.tabContent}>
                <p>Atorvastatin is used along with a proper diet to help lower "bad" cholesterol and fats (such as LDL, triglycerides) and raise "good" cholesterol (HDL) in the blood. It belongs to a group of drugs known as "statins." It works by reducing the amount of cholesterol made by the liver.</p>
                <p>Lowering "bad" cholesterol and triglycerides and raising "good" cholesterol decreases the risk of heart disease and helps prevent strokes and heart attacks. In addition to eating a proper diet (such as a low-cholesterol/low-fat diet), other lifestyle changes that may help this medication work better include exercising, losing weight if overweight, and stopping smoking.</p>

                <div className={styles.infoCards}>
                    <div className={styles.infoCard}>
                        <h4>THERAPEUTIC CLASS</h4>
                        <p>HMG-CoA reductase inhibitor</p>
                    </div>
                    <div className={styles.infoCard}>
                        <h4>ADMINISTRATION</h4>
                        <p>Oral, once daily with or without food</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
