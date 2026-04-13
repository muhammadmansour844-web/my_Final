import React from 'react'
import styles from './Landing.module.css'
function Maincards() {
  return (
    <div className={styles.cardsSection}>

      <h2 className={styles.cardsSectionTitle}>Why PharmaPridge?</h2>

      <div className={styles.cardsContainer}>
        <div className={styles.cardsItem}>
          <div className={`${styles.cardsIcon} ${styles.cardsIconGreen}`}>⚡</div>
          <h3 className={styles.cardsItemTitle}>Fast Ordering</h3>
          <p className={styles.cardsItemText}>Place orders in minutes, not hours</p>
        </div>

        <div className={styles.cardsItem}>
          <div className={`${styles.cardsIcon} ${styles.cardsIconBlue}`}>🔒</div>
          <h3 className={styles.cardsItemTitle}>Secure Platform</h3>
          <p className={styles.cardsItemText}>Your data and orders always protected</p>
        </div>

        <div className={styles.cardsItem}>
          <div className={`${styles.cardsIcon} ${styles.cardsIconAmber}`}>📦</div>
          <h3 className={styles.cardsItemTitle}>Full Catalog</h3>
          <p className={styles.cardsItemText}>Browse thousands of products easily</p>
        </div>

        <div className={styles.cardsItem}>
          <div className={`${styles.cardsIcon} ${styles.cardsIconPink}`}>📊</div>
          <h3 className={styles.cardsItemTitle}>Live Dashboard</h3>
          <p className={styles.cardsItemText}>Track orders & inventory in real time</p>
        </div>
      </div>

      <h2 className={styles.cardsSectionTitle}>Built for both sides</h2>

      <div className={styles.cardsSides}>
        <div className={`${styles.cardsSideItem} ${styles.cardsSideGreen}`}>
          <h3 className={styles.cardsSideTitle}>🏪 For Pharmacies</h3>
          <p className={styles.cardsSideText}>Browse, compare & order medications easily</p>
        </div>
        <div className={`${styles.cardsSideItem} ${styles.cardsSideBlue}`}>
          <h3 className={styles.cardsSideTitle}>🏭 For Pharma Companies</h3>
          <p className={styles.cardsSideText}>List products & reach pharmacies nationwide</p>
        </div>
      </div>

    </div>
  )
}

export default Maincards