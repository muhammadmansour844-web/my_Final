import React, { useState, useEffect } from 'react'
import DataTable from '../Dashescomp/DataTable'
import styles from '../Dashescomp/Dashes.module.css'
import compStyles from './Company.module.css'

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
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
      background: meta.bg, color: meta.color
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
      {meta.label}
    </span>
  )
}

function CompanyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [viewOrder, setViewOrder] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [itemChecks, setItemChecks] = useState([])
  const [notes, setNotes] = useState('')

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

  const companyName = localStorage.getItem('user_name') || 'Company Admin'

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT', headers, body: JSON.stringify({ status, notes: notes.trim() || null })
      })
      if (res.ok) {
        showToast(`Order #${id} → ${status}`)
        setViewOrder(null)
        setNotes('')
        setItemChecks([])
        fetchOrders()
      } else {
        const data = await res.json()
        showToast(data.message || 'Update failed', 'error')
      }
    } catch { showToast('Network error', 'error') }
  }

  const openOrderDetails = async (row) => {
    setViewLoading(true)
    setNotes('')
    setItemChecks([])
    setViewOrder({ ...row, items: null })
    try {
      const res = await fetch(`${API}/${row.id}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setViewOrder(data)
        setItemChecks((data.items || []).map(() => false))
      }
    } catch { /* keep basic info visible */ }
    finally { setViewLoading(false) }
  }

  const toggleCheck = (i) => setItemChecks(prev => prev.map((v, idx) => idx === i ? !v : v))

  const getUnitType = (qty) => {
    if (qty % 48 === 0 && qty >= 48) return `Carton ×${qty / 48} (48 units)`
    if (qty % 24 === 0 && qty >= 24) return `Carton ×${qty / 24} (24 units)`
    return 'Units'
  }

  const byStatus = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const q = search.toLowerCase().trim()
  const filtered = q
    ? byStatus.filter(o =>
        String(o.id).includes(q) ||
        (o.pharmacy_name || '').toLowerCase().includes(q) ||
        (o.status || '').toLowerCase().includes(q) ||
        String(o.total_amount || '').includes(q) ||
        (o.created_at ? new Date(o.created_at).toLocaleDateString() : '').includes(q)
      )
    : byStatus

  const columns = [
    {
      key: 'id', label: 'Order #',
      render: (val) => <span style={{ fontWeight: 700, color: '#013223' }}>#{String(val).padStart(4, '0')}</span>
    },
    {
      key: 'pharmacy_name', label: 'Pharmacy',
      render: (val, row) => (
        <span style={{ fontWeight: 600 }}>{val || `Pharmacy #${row.pharmacy_id}`}</span>
      )
    },
    {
      key: 'total_amount', label: 'Total',
      render: (val) => (
        <span style={{ fontWeight: 700, color: '#013223' }}>${Number(val || 0).toFixed(2)}</span>
      )
    },
    { key: 'status', label: 'Status', render: (val) => statusBadge(val) },
    {
      key: 'created_at', label: 'Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—'
    },
  ]

  const renderActions = (row) => {
    if (row.status === 'approved') {
      return (
        <div className={compStyles.orderActions}>
          <button
            className={`${compStyles.orderBtn} ${compStyles.orderBtnReject}`}
            onClick={() => updateStatus(row.id, 'cancelled')}
          >
            ✕ Cancel
          </button>
          <button
            className={`${compStyles.orderBtn} ${compStyles.orderBtnShip}`}
            onClick={() => updateStatus(row.id, 'shipped')}
          >
            🚚 Ship
          </button>
        </div>
      )
    }
    return (
      <div className={compStyles.orderActions}>
        <button
          className={`${compStyles.orderBtn}`}
          onClick={() => openOrderDetails(row)}
          style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
        >
          🔍 View
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Search Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by order #, pharmacy, date, total…"
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

      {/* Order Details Modal */}
      {viewOrder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }} onClick={() => setViewOrder(null)}>
          <div style={{
            background: '#fff', borderRadius: '18px',
            maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.28)', position: 'relative',
            display: 'flex', flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>

            {/* ── Top banner ── */}
            <div style={{
              background: 'linear-gradient(135deg, #013223 0%, #065f46 100%)',
              borderRadius: '18px 18px 0 0', padding: '22px 28px',
              color: '#fff', position: 'relative'
            }}>
              <button onClick={() => setViewOrder(null)} style={{
                position: 'absolute', top: '16px', right: '18px',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '50%', width: '30px', height: '30px',
                cursor: 'pointer', color: '#fff', fontSize: '1rem', lineHeight: '30px', textAlign: 'center'
              }}>✕</button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em' }}>ORDER NUMBER</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.01em' }}>
                    #{String(viewOrder.id).padStart(4, '0')}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>{statusBadge(viewOrder.status)}</div>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.65, fontWeight: 600, textTransform: 'uppercase' }}>Pharmacy</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {viewOrder.pharmacy_name || `Pharmacy #${viewOrder.pharmacy_id}`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.65, fontWeight: 600, textTransform: 'uppercase' }}>Phone</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {viewOrder.pharmacy_phone || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.65, fontWeight: 600, textTransform: 'uppercase' }}>Reviewed by</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{companyName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.65, fontWeight: 600, textTransform: 'uppercase' }}>Date</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {viewOrder.created_at ? new Date(viewOrder.created_at).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>

              {/* Existing notes from DB */}
              {viewOrder.notes && (
                <div style={{
                  marginTop: '12px', background: 'rgba(255,255,255,0.12)',
                  borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem', fontStyle: 'italic'
                }}>
                  📝 {viewOrder.notes}
                </div>
              )}
            </div>

            {/* ── Body ── */}
            <div style={{ padding: '24px 28px', flex: 1 }}>

              {/* Items Table */}
              <h3 style={{
                fontSize: '0.8rem', fontWeight: 700, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px'
              }}>
                Order Items
              </h3>

              {viewLoading ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>Loading items…</p>
              ) : viewOrder.items && viewOrder.items.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '9px 10px', textAlign: 'center', color: '#94a3b8', fontWeight: 700, width: '36px' }}>#</th>
                      <th style={{ padding: '9px 10px', textAlign: 'left',   color: '#64748b', fontWeight: 700 }}>Product</th>
                      <th style={{ padding: '9px 10px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>Qty</th>
                      <th style={{ padding: '9px 10px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>Type</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right',  color: '#64748b', fontWeight: 700 }}>Price</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right',  color: '#64748b', fontWeight: 700 }}>Subtotal</th>
                      <th style={{ padding: '9px 10px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>✓</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.items.map((item, i) => {
                      const checked = itemChecks[i] || false
                      return (
                        <tr key={i} style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: checked ? '#f0fdf4' : 'transparent',
                          transition: 'background 0.15s'
                        }}>
                          <td style={{ padding: '10px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '10px', fontWeight: 600, color: '#1e293b' }}>
                            {item.product_name || `Product #${item.product_id}`}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', color: '#374151', fontWeight: 700 }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 700,
                              padding: '3px 8px', borderRadius: '12px',
                              background: item.quantity % 48 === 0 && item.quantity >= 48
                                ? '#fef3c7' : item.quantity % 24 === 0 && item.quantity >= 24
                                ? '#fef9c3' : '#f1f5f9',
                              color: item.quantity % 48 === 0 && item.quantity >= 48
                                ? '#92400e' : item.quantity % 24 === 0 && item.quantity >= 24
                                ? '#78350f' : '#475569'
                            }}>
                              {getUnitType(item.quantity)}
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', color: '#374151' }}>
                            ${Number(item.price).toFixed(2)}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#013223' }}>
                            ${(Number(item.price) * item.quantity).toFixed(2)}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCheck(i)}
                              style={{ width: '17px', height: '17px', accentColor: '#013223', cursor: 'pointer' }}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                      <td colSpan={5} style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#374151', fontSize: '0.9rem' }}>
                        Total ({viewOrder.items.length} {viewOrder.items.length === 1 ? 'item' : 'items'})
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: '#013223' }}>
                        ${Number(
                          viewOrder.total_amount ||
                          viewOrder.items.reduce((s, it) => s + Number(it.price) * it.quantity, 0)
                        ).toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>No items found.</p>
              )}

              {/* Notes */}
              {(viewOrder.status === 'pending' || viewOrder.status === 'approved') && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block', fontSize: '0.8rem', fontWeight: 700,
                    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px'
                  }}>
                    📝 Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add notes about this order… (will be sent with your decision)"
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '10px',
                      border: '1.5px solid #e2e8f0', fontSize: '0.88rem',
                      resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'inherit', color: '#374151', background: '#f8fafc',
                      transition: 'border-color 0.15s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#013223'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              )}

              {/* Action buttons */}
              {viewOrder.status === 'pending' && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    className={`${compStyles.orderBtn} ${compStyles.orderBtnReject}`}
                    onClick={() => {
                      if (!notes.trim() && !window.confirm('Reject this order without notes?')) return
                      updateStatus(viewOrder.id, 'rejected')
                    }}
                  >
                    ✕ Reject Order
                  </button>
                  <button
                    className={`${compStyles.orderBtn} ${compStyles.orderBtnApprove}`}
                    onClick={() => updateStatus(viewOrder.id, 'approved')}
                  >
                    ✅ Approve Order
                  </button>
                </div>
              )}
              {viewOrder.status === 'approved' && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    className={`${compStyles.orderBtn} ${compStyles.orderBtnReject}`}
                    onClick={() => updateStatus(viewOrder.id, 'cancelled')}
                  >
                    ✕ Cancel Order
                  </button>
                  <button
                    className={`${compStyles.orderBtn} ${compStyles.orderBtnShip}`}
                    onClick={() => updateStatus(viewOrder.id, 'shipped')}
                  >
                    🚚 Ship Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CompanyOrders
