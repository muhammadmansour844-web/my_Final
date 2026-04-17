import React from 'react'
import styles from './Login.module.css'

function LoginLeft() {
  return (
    <div className={styles.loginLeft}>
      <div className={styles.loginLogo}>💊</div>
      <h1 className={styles.loginBrand}>PharmaPridge</h1>
      <p className={styles.loginTagline}>PHARMA PLATFORM</p>
      <div className={styles.loginDivider}></div>
      <p className={styles.loginDesc}>
        Connecting Pharmacies<br/>with the Right Suppliers
      </p>
      <div className={styles.loginFeatures}>
        <span>⚡ Fast Ordering</span>
        <span>🔒 Secure Platform</span>
        <span>📦 Full Catalog</span>
      </div>
    </div>
  )
}

export default LoginLeft