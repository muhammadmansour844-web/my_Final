import React, { useState, useEffect } from 'react'
import DataTable from '../Dashescomp/DataTable'
import styles from '../Dashescomp/Dashes.module.css'
import compStyles from './Company.module.css'

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

function CompanyOrders() {
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

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT', headers, body: JSON.stringify({ status })
      })
      if (res.ok) {
        showToast(`Order #${id} → ${status}`)
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
    { key: 'pharmacy_id', label: 'Pharmacy ID' },
    { key: 'status', label: 'Status', render: (val) => statusBadge(val) },
    {
      key: 'created_at', label: 'Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—'
    }
  ]

  const renderActions = (row) => {
    return (
      <div className={compStyles.orderActions}>
        {row.status === 'pending' && (
          <>
            <button className={`${compStyles.orderBtn} ${compStyles.orderBtnApprove}`} onClick={() => updateStatus(row.id, 'approved')}>
              ✅ Approve
            </button>
            <button className={`${compStyles.orderBtn} ${compStyles.orderBtnReject}`} onClick={() => updateStatus(row.id, 'rejected')}>
              ✕ Reject
            </button>
          </>
        )}
        {row.status === 'approved' && (
          <button className={`${compStyles.orderBtn} ${compStyles.orderBtnShip}`} onClick={() => updateStatus(row.id, 'shipped')}>
            🚚 Ship
          </button>
        )}
        {(row.status === 'shipped' || row.status === 'delivered' || row.status === 'rejected') && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
        )}
      </div>
    )
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
        title={`Incoming Orders (${filtered.length})`}
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

export default CompanyOrders
