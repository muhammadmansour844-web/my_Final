import React, { useState, useEffect, useMemo } from 'react'
import DataTable from '../../Dashescomp/DataTable'
import styles from '../../Dashescomp/Dashes.module.css'

const API = 'http://localhost:3000/api/orders'

const STATUS_META = {
  pending:   { label: 'Pending',   bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
  approved:  { label: 'Accepted',  bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  shipped:   { label: 'Shipped',   bg: '#f5f3ff', color: '#7c3aed', dot: '#8b5cf6' },
  delivered: { label: 'Delivered', bg: '#fefce8', color: '#854d0e', dot: '#eab308' },
  completed: { label: 'Confirmed', bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' },
  rejected:  { label: 'Rejected',  bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
  cancelled: { label: 'Cancelled', bg: '#f9fafb', color: '#6b7280', dot: '#9ca3af' },
  all:       { label: 'All',       bg: '#f8fafc', color: '#334155', dot: '#94a3b8' },
}

const TABS = ['pending', 'shipped', 'delivered', 'completed', 'rejected']

const statusBadge = (status) => {
  const meta = STATUS_META[status] || STATUS_META.all
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
      background: meta.bg, color: meta.color
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
      {meta.label}
    </span>
  )
}

function formatOrderId(id) {
  return `#PB-${String(id).padStart(4, '0')}`
}

function PharmacyOrders({ incomingOnly = false }) {
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

  const baseOrders = useMemo(() => {
    if (!incomingOnly) return orders
    return orders.filter(o => ['pending', 'approved', 'shipped'].includes(o.status))
  }, [orders, incomingOnly])

  const byStatus = filter === 'pending'
    ? baseOrders.filter(o => o.status === 'pending' || o.status === 'approved')
    : baseOrders.filter(o => o.status === filter)
  const q = search.toLowerCase().trim()
  const filtered = q
    ? byStatus.filter(o =>
        String(o.id).includes(q) ||
        (o.company_name || '').toLowerCase().includes(q) ||
        (o.category_sample || '').toLowerCase().includes(q) ||
        (o.status || '').toLowerCase().includes(q) ||
        String(o.total_amount || '').includes(q) ||
        (o.created_at ? new Date(o.created_at).toLocaleDateString() : '').includes(q)
      )
    : byStatus

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT', headers, body: JSON.stringify({ status })
      })
      if (res.ok) {
        showToast(status === 'delivered' ? 'Delivery confirmed!' : 'Order updated')
        fetchOrders()
      } else {
        const data = await res.json()
        showToast(data.message || 'Update failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (_, row) => (
        <span style={{ fontWeight: 700, color: '#013223' }}>{formatOrderId(row.id)}</span>
      ),
    },
    {
      key: 'company_name',
      label: 'Supplier',
      render: (val, row) => (
        <span style={{ fontWeight: 600 }}>{val || `Company #${row.company_id}`}</span>
      ),
    },
    {
      key: 'category_sample',
      label: 'Category',
      render: (val) => val || '—',
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (val) => (
        <span style={{ fontWeight: 700, color: '#013223' }}>${Number(val || 0).toFixed(2)}</span>
      ),
    },
    { key: 'status', label: 'Status', render: (val) => statusBadge(val) },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
  ]

  const renderActions = (row) => {
    if (row.status === 'pending') {
      return (
        <button
          type="button"
          onClick={() => {
            if (!window.confirm('Reject this order? This cannot be undone.')) return
            updateStatus(row.id, 'rejected')
          }}
          style={{
            padding: '5px 14px', borderRadius: '8px', border: '1px solid #fecaca',
            background: '#fef2f2', color: '#b91c1c', fontWeight: 700,
            fontSize: '0.78rem', cursor: 'pointer'
          }}
        >
          ✕ Reject Order
        </button>
      )
    }
    if (row.status === 'delivered') {
      return (
        <button
          type="button"
          onClick={() => updateStatus(row.id, 'completed')}
          style={{
            padding: '5px 14px', borderRadius: '8px', border: '1px solid #22c55e',
            background: '#f0fdf4', color: '#15803d', fontWeight: 700,
            fontSize: '0.78rem', cursor: 'pointer'
          }}
        >
          ✓ Confirm Receipt
        </button>
      )
    }
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
  }

  const tableTitle = incomingOnly ? 'Incoming Orders' : 'My Orders'

  return (
    <>
      {/* Search Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by order #, supplier, category, date…"
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
          const count = s === 'pending'
            ? baseOrders.filter(o => o.status === 'pending' || o.status === 'approved').length
            : baseOrders.filter(o => o.status === s).length
          return (
            <button
              key={s}
              type="button"
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
        title={`${tableTitle} (${filtered.length})`}
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
