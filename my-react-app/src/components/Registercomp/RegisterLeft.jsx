import React from 'react'
import styles from './Register.module.css'

function RegisterLeft() {
  return (
    <div className={styles.loginLeft}>
      <div className={styles.loginLogo}>💊</div>
      <h1 className={styles.loginBrand}>PharmaPridge</h1>
      <p className={styles.loginTagline}>JOIN OUR NETWORK</p>
      <div className={styles.loginDivider}></div>
      <p className={styles.loginDesc}>
        Start connecting with trusted<br/>suppliers and pharmacies today
      </p>
      <div className={styles.loginFeatures}>
        <span>🏢 Register Your Company</span>
        <span>🏥 Register Your Pharmacy</span>
        <span>✅ Admin-Verified Accounts</span>
        <span>🔒 Secure & Trusted Platform</span>
      </div>
    </div>
  )
}

export default RegisterLeft
