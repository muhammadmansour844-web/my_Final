import React from 'react'
import LoginLeft from '../components/Logincomp/LoginLeft'
import LoginRight from '../components/Logincomp/LoginRight'
import styles from '../components/Logincomp/Login.module.css'
function LoginPage() {
  return (
    <div className={styles.loginContainer}>
      <LoginLeft/>
      <LoginRight/>
    </div>
  )
}

export default LoginPage