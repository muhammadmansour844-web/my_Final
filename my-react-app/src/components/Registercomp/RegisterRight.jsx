import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Register.module.css'

function RegisterRight() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    account_type: '',
    entity_name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRegister = async () => {
    const { name, email, password, confirmPassword, phone, account_type, entity_name } = form

    if (!name || !email || !password || !confirmPassword || !phone || !account_type || !entity_name) {
      setError('Please fill in all fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:3000/api/users/public-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, account_type, phone, entity_name }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Registration failed. Please try again.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  const entityLabel = form.account_type === 'company_admin'
    ? 'Company Name'
    : form.account_type === 'pharmacy_admin'
      ? 'Pharmacy Name'
      : 'Company / Pharmacy Name'

  if (success) {
    return (
      <div className={styles.loginRight}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2 className={styles.successTitle}>Request Submitted!</h2>
          <p className={styles.successMessage}>
            Thank you for registering with PharmaPridge.<br/>
            Your application is now under review by our admin team.<br/>
            You will be contacted within <strong>24–48 hours</strong> once your account is approved.
          </p>
          <div className={styles.successNote}>
            📧 Make sure to check your email inbox for any follow-up communication.
          </div>
          <Link to="/login" className={styles.loginBtn} style={{ textAlign: 'center', textDecoration: 'none', display: 'block', marginTop: '1rem' }}>
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.loginRight}>
      <div className={styles.registerCard}>
        <h2 className={styles.loginWelcome}>Create Account 🚀</h2>
        <p className={styles.loginSubtitle}>Join PharmaPridge — fill in your details below</p>

        <div className={styles.loginDividerLine}></div>

        <div className={styles.formGrid}>
          <div className={styles.loginField}>
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className={styles.loginField}>
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.loginField}>
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+966 5X XXX XXXX"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className={styles.loginField}>
            <label>Account Type</label>
            <select
              name="account_type"
              value={form.account_type}
              onChange={handleChange}
              className={styles.selectField}
            >
              <option value="">— Select account type —</option>
              <option value="company_admin">Pharmaceutical Company</option>
              <option value="pharmacy_admin">Pharmacy</option>
            </select>
          </div>

          <div className={`${styles.loginField} ${styles.fullWidth}`}>
            <label>{entityLabel}</label>
            <input
              type="text"
              name="entity_name"
              placeholder={form.account_type === 'company_admin' ? 'e.g. Al-Dawaa Pharmaceuticals' : 'e.g. City Pharmacy'}
              value={form.entity_name}
              onChange={handleChange}
            />
          </div>

          <div className={styles.loginField}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className={styles.loginField}>
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && <p className={styles.loginError}>{error}</p>}

        <button
          className={styles.loginBtn}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Registration Request'}
        </button>

        <div className={styles.loginBackRow}>
          <Link to="/login" className={styles.loginBack}>Already have an account? Login</Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterRight
