import React, { useState, useEffect } from 'react'
import DataTable from '../Dashescomp/DataTable'
import styles from '../Dashescomp/Dashes.module.css'

const API = 'http://localhost:3000/api/orders'

const statusBadge = (status) => {
  const map = {
    pending: styles.badgeAmber,
    approved: styles.badgeBlue,
    rejected: styles.badgeRed,
    shipped: styles.badgePurple,
    delivered: styles.badgeGreen,
  }
  return (
    <span className={`${styles.badge} ${map[status] || styles.badgeGray}`}>
      {status}
    </span>
  )
}

function PharmacyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState(null)

  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch(API, { headers })
      if (res.ok) setOrders(await res.json())
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const confirmDelivery = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT', headers, body: JSON.stringify({ status: 'delivered' })
      })
      if (res.ok) {
        showToast('Delivery confirmed!')
        fetchOrders()
      } else {
        const data = await res.json()
        showToast(data.message || 'Update failed', 'error')
      }
    } catch { showToast('Network error', 'error') }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const columns = [
    { key: 'id', label: 'Order #' },
    { key: 'company_id', label: 'Company ID' },
    { key: 'status', label: 'Status', render: (val) => statusBadge(val) },
    {
      key: 'created_at', label: 'Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—'
    }
  ]

  const renderActions = (row) => {
    if (row.status === 'shipped') {
      return (
        <button
          className={`${styles.tableBtn} ${styles.tableBtnPrimary}`}
          onClick={() => confirmDelivery(row.id)}
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
        >
          📬 Confirm Delivery
        </button>
      )
    }
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
  }

  return (
    <>
      <div className={styles.sectionTabs}>
        {['all', 'pending', 'approved', 'shipped', 'delivered', 'rejected'].map(s => (
          <button
            key={s}
            className={`${styles.sectionTab} ${filter === s ? styles.sectionTabActive : ''}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
          </button>
        ))}
      </div>

      <DataTable
        title={`My Orders (${filtered.length})`}
        columns={columns}
        data={filtered}
        actions={renderActions}
        loading={loading}
      />

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </>
  )
}

export default PharmacyOrders
