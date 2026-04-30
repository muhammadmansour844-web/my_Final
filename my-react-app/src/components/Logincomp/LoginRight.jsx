import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Login.module.css'

function LoginRight() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Login failed.')
        return
      }

      // احفظ التوكن ونوع الحساب
      localStorage.setItem('token', data.token)
      localStorage.setItem('account_type', data.user.account_type)
      localStorage.setItem('user_name', data.user.name)

      // احفظ اسم الكيان المرتبط (صيدلية أو شركة)
      if (data.user.entity_name) {
        if (data.user.account_type === 'pharmacy_admin') {
          localStorage.setItem('pharmacy_display_name', data.user.entity_name)
          localStorage.setItem('pharmacy_id', data.user.entity_id)
        } else if (data.user.account_type === 'company_admin') {
          localStorage.setItem('company_display_name', data.user.entity_name)
          localStorage.setItem('company_id', data.user.entity_id)
        }
      }

      // وجّه حسب نوع الحساب
      if (data.user.account_type === 'super_admin') navigate('/admin')
      else if (data.user.account_type === 'pharmacy_admin') navigate('/pharmacy-dashboard')
      else if (data.user.account_type === 'company_admin') navigate('/company')
      else navigate('/login')

    } catch (err) {
      setError('Network error. Make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginRight}>
      <div className={styles.loginCard}>
        <h2 className={styles.loginWelcome}>Welcome back 👋</h2>
        <p className={styles.loginSubtitle}>Login to your PharmaPridge account</p>

        <div className={styles.loginDividerLine}></div>

        <div className={styles.loginField}>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.loginField}>
          <label>Password</label>
          <div className={styles.loginPasswordWrapper}>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && <p className={styles.loginError}>{error}</p>}

        <button
          className={styles.loginBtn}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <a href="/" className={styles.loginBack}>← Back to home</a>

        {/* Quick Testing buttons removed because they bypass auth and cause bugs */}
      </div>
    </div>
  )
}

export default LoginRight