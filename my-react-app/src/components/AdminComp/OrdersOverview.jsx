import React, { useState, useEffect } from 'react'
import DataTable from '../Dashescomp/DataTable'
import styles from '../Dashescomp/Dashes.module.css'

const API = 'http://localhost:3000/api/orders'

const STATUS_META = {
  pending:   { label: 'Pending',   bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
  approved:  { label: 'Approved',  bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  shipped:   { label: 'Shipped',   bg: '#f5f3ff', color: '#7c3aed', dot: '#8b5cf6' },
  delivered: { label: 'Delivered', bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' },
  rejected:  { label: 'Rejected',  bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
  cancelled: { label: 'Cancelled', bg: '#f9fafb', color: '#6b7280', dot: '#9ca3af' },
  all:       { label: 'All',       bg: '#f8fafc', color: '#334155', dot: '#94a3b8' },
}

const TABS = ['pending', 'approved', 'shipped', 'delivered', 'rejected', 'cancelled', 'all']

const statusBadge = (status) => {
  const meta = STATUS_META[status] || STATUS_META.all
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 9px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
      background: meta.bg, color: meta.color
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
      {meta.label}
    </span>
  )
}

function OrdersOverview() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)

  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

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

  const totalValue   = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const pendingValue = orders.filter(o => o.status === 'pending').reduce((s, o) => s + Number(o.total_amount || 0), 0)

  const byStatus = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const q = search.toLowerCase().trim()
  const filtered = q
    ? byStatus.filter(o =>
        String(o.id).includes(q) ||
        String(o.pharmacy_id || '').includes(q) ||
        String(o.company_id || '').includes(q) ||
        (o.status || '').toLowerCase().includes(q) ||
        (o.created_at ? new Date(o.created_at).toLocaleDateString() : '').includes(q)
      )
    : byStatus

  const columns = [
    {
      key: 'id', label: 'ORDER #',
      render: (val) => <span style={{ fontWeight: 700, color: '#013223' }}>#{String(val).padStart(4, '0')}</span>
    },
    {
      key: 'pharmacy_name', label: 'PHARMACY',
      render: (val, row) => <span style={{ fontWeight: 600 }}>{val || `#${row.pharmacy_id}`}</span>
    },
    {
      key: 'company_name', label: 'COMPANY',
      render: (val, row) => <span style={{ color: '#64748b' }}>{val || `#${row.company_id}`}</span>
    },
    {
      key: 'items_count', label: 'ITEMS',
      render: (val) => <span style={{ textAlign: 'center' }}>{val ?? '—'}</span>
    },
    {
      key: 'total_amount', label: 'TOTAL',
      render: (val) => <span style={{ fontWeight: 700, color: '#013223' }}>${Number(val || 0).toFixed(2)}</span>
    },
    { key: 'status', label: 'STATUS', render: (val) => statusBadge(val) },
    {
      key: 'created_at', label: 'DATE',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—'
    },
  ]

  const renderActions = (row) => {
    const btns = []
    if (row.status === 'pending') {
      btns.push(
        <button key="approve" className={`${styles.actionBtn} ${styles.actionBtnView}`} onClick={() => updateStatus(row.id, 'approved')} title="Approve">✅</button>,
        <button key="reject" className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => updateStatus(row.id, 'rejected')} title="Reject">❌</button>
      )
    }
    if (row.status === 'approved') {
      btns.push(
        <button key="ship" className={`${styles.actionBtn} ${styles.actionBtnEdit}`} onClick={() => updateStatus(row.id, 'shipped')} title="Ship">🚚</button>,
        <button key="cancel" className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => updateStatus(row.id, 'cancelled')} title="Cancel">✕</button>
      )
    }
    if (row.status === 'shipped') {
      btns.push(
        <button key="deliver" className={`${styles.actionBtn} ${styles.actionBtnView}`} onClick={() => updateStatus(row.id, 'delivered')} title="Deliver">📬</button>
      )
    }
    return btns.length > 0 ? btns : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
  }

  return (
    <>
      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'TOTAL ORDERS',   value: orders.length,                                    color: '#013223', bg: '#f0fdf4' },
          { label: 'TOTAL VALUE',    value: `$${totalValue.toFixed(2)}`,                      color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'PENDING VALUE',  value: `$${pendingValue.toFixed(2)}`,                    color: '#c2410c', bg: '#fff7ed' },
          { label: 'DELIVERED',      value: orders.filter(o => o.status === 'delivered').length, color: '#15803d', bg: '#f0fdf4' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '14px', padding: '1rem 1.25rem', border: `1px solid ${s.color}22` }}>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>{s.label}</p>
            <p style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by order #, pharmacy ID, company ID, date…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              border: '1.5px solid #e2e8f0', borderRadius: '10px',
              fontSize: '0.85rem', outline: 'none', background: '#f8fafc',
              boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#013223'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', lineHeight: 1 }}>✕</button>
          )}
        </div>
      </div>

      {/* Color-coded filter tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {TABS.map(s => {
          const meta = STATUS_META[s]
          const isActive = filter === s
          const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '20px', border: 'none',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: isActive ? 700 : 500,
                background: isActive ? meta.bg : '#f8fafc',
                color: isActive ? meta.color : '#64748b',
                boxShadow: isActive ? `0 0 0 2px ${meta.dot}` : '0 0 0 1px #e2e8f0',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? meta.dot : '#cbd5e1', display: 'inline-block' }} />
              {meta.label}
              <span style={{
                background: isActive ? meta.dot : '#e2e8f0',
                color: isActive ? '#fff' : '#64748b',
                borderRadius: '10px', padding: '1px 7px',
                fontSize: '0.72rem', fontWeight: 700,
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <DataTable
        title={`Orders (${filtered.length}${search ? ` matching "${search}"` : ''})`}
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

export default OrdersOverview
