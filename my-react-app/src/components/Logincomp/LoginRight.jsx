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

      // وجّه حسب نوع الحساب
      if (data.user.account_type === 'super_admin') navigate('/admin')
      else if (data.user.account_type === 'pharmacy_admin') navigate('/pharmacy-dashboard')
      else if (data.user.account_type === 'company_admin') navigate('/company')
      else navigate('/login') // Fallback

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

        {/* Temporary Quick Links for Testing */}
        <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>🧪 Quick Testing (No Auth Required)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/company')} style={{ background: '#f0f4f2', border: '1px solid #d1e2d9', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', color: '#0b2e20' }}>Company Dash</button>
            <button onClick={() => navigate('/pharmacy-dashboard')} style={{ background: '#f0f4f2', border: '1px solid #d1e2d9', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', color: '#0b2e20' }}>Pharmacy Dash</button>
            <button onClick={() => navigate('/admin')} style={{ background: '#f0f4f2', border: '1px solid #d1e2d9', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', color: '#0b2e20' }}>Admin Dash</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginRight