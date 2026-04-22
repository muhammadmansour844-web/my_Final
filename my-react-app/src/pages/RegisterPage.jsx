import React from 'react'
import RegisterLeft from '../components/Registercomp/RegisterLeft'
import RegisterRight from '../components/Registercomp/RegisterRight'
import styles from '../components/Registercomp/Register.module.css'

function RegisterPage() {
  return (
    <div className={styles.loginContainer}>
      <RegisterLeft />
      <RegisterRight />
    </div>
  )
}

export default RegisterPage
