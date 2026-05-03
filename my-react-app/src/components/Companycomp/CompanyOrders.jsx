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
  completed: { label: 'Completed', bg: '#ecfdf5', color: '#065f46', dot: '#10b981' },
  rejected:  { label: 'Rejected',  bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
  cancelled: { label: 'Cancelled', bg: '#f9fafb', color: '#6b7280', dot: '#9ca3af' },
  all:       { label: 'All',       bg: '#f8fafc', color: '#334155', dot: '#94a3b8' },
}

const TABS = ['pending', 'shipped', 'completed', 'rejected']

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

const API_USERS = 'http://localhost:3000/api/users'

function CompanyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [viewOrder, setViewOrder] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [itemChecks, setItemChecks] = useState([])
  const [itemNotes, setItemNotes] = useState([])
  const [notes, setNotes] = useState('')
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [drivers, setDrivers] = useState([])
  const [shipDriverId, setShipDriverId] = useState('')

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

  useEffect(() => {
    fetchOrders()
    fetch('http://localhost:3000/api/deliveries/drivers', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setDrivers(data || []))
      .catch(() => {})
  }, [])

  const companyName = localStorage.getItem('user_name') || 'Company Admin'

  const updateStatus = async (id, status, rejectedItemIds = []) => {
    try {
      const body = { status, notes: notes.trim() || null }
      if (rejectedItemIds.length > 0) body.rejected_item_ids = rejectedItemIds
      // If shipping directly (legacy/manual), we keep this but we prefer assignDelivery
      if (status === 'shipped' && shipDriverId) body.delivery_user_id = parseInt(shipDriverId)
      
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT', headers, body: JSON.stringify(body)
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Order #${id} → ${status}`)
        setViewOrder(null)
        setNotes('')
        setItemChecks([])
        setItemNotes([])
        setSubmitAttempted(false)
        setShipDriverId('')
        fetchOrders()
      } else {
        showToast(data.message || 'Update failed', 'error')
      }
    } catch (err) {
      showToast('Network error', 'error')
    }
  }

  const assignDelivery = async (orderId, driverId) => {
    if (!driverId) return showToast('Please select a driver', 'error')
    try {
      const res = await fetch('http://localhost:3000/api/deliveries', {
        method: 'POST',
        headers,
        body: JSON.stringify({ order_id: orderId, driver_id: parseInt(driverId), notes: notes.trim() || null })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Delivery assigned to driver`)
        setViewOrder(null)
        setShipDriverId('')
        fetchOrders()
      } else {
        showToast(data.message || 'Assignment failed', 'error')
      }
    } catch (err) {
      showToast('Network error', 'error')
    }
  }

  const openOrderDetails = async (row) => {
    setViewLoading(true)
    setNotes('')
    setItemChecks([])
    setItemNotes([])
    setSubmitAttempted(false)
    setViewOrder({ ...row, items: null })
    try {
      const res = await fetch(`${API}/${row.id}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setViewOrder(data)
        setItemChecks((data.items || []).map(() => true))
        setItemNotes((data.items || []).map(() => ''))
      }
    } catch { /* keep basic info visible */ }
    finally { setViewLoading(false) }
  }

  const toggleCheck = (i) => setItemChecks(prev => prev.map((v, idx) => idx === i ? !v : v))
  const toggleAll = () => {
    const allChecked = itemChecks.every(v => v)
    setItemChecks(prev => prev.map(() => !allChecked))
  }
  const setItemNote = (i, val) => setItemNotes(prev => prev.map((n, idx) => idx === i ? val : n))

  const getUnitType = (qty) => {
    if (qty % 48 === 0 && qty >= 48) return `Carton ×${qty / 48} (48 units)`
    if (qty % 24 === 0 && qty >= 24) return `Carton ×${qty / 24} (24 units)`
    return 'Units'
  }

  const byStatus = filter === 'pending'
    ? orders.filter(o => o.status === 'pending' || o.status === 'approved')
    : orders.filter(o => o.status === filter)
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
            onClick={() => updateStatus(row.id, 'rejected')}
          >
            ✕ Reject
          </button>
          <button
            className={`${compStyles.orderBtn} ${compStyles.orderBtnShip}`}
            onClick={() => openOrderDetails(row)}
          >
            🚚 Assign & Ship
          </button>
        </div>
      )
    }
    if (row.status === 'shipped') {
      return (
        <div className={compStyles.orderActions}>
          <button
            className={`${compStyles.orderBtn}`}
            onClick={() => updateStatus(row.id, 'delivered')}
            style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #22c55e' }}
          >
            ✓ Mark Delivered
          </button>
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
          const count = s === 'pending'
            ? orders.filter(o => o.status === 'pending' || o.status === 'approved').length
            : orders.filter(o => o.status === s).length
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
                      {viewOrder.status === 'pending' && (
                        <th style={{ padding: '9px 10px', textAlign: 'center', color: '#64748b', fontWeight: 700, width: '44px' }}>
                          <input
                            type="checkbox"
                            checked={itemChecks.length > 0 && itemChecks.every(v => v)}
                            onChange={toggleAll}
                            title="Select / Deselect all"
                            style={{ width: '17px', height: '17px', accentColor: '#013223', cursor: 'pointer' }}
                          />
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.items.map((item, i) => {
                      const checked = itemChecks[i] !== false
                      const note = itemNotes[i] || ''
                      const noteMissing = submitAttempted && !checked && !note.trim()
                      return (
                        <React.Fragment key={i}>
                          <tr style={{
                            borderBottom: checked ? '1px solid #f1f5f9' : 'none',
                            background: checked ? '#f0fdf4' : '#fff5f5',
                            transition: 'background 0.15s'
                          }}>
                            <td style={{ padding: '10px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                            <td style={{ padding: '10px', fontWeight: 600, color: checked ? '#1e293b' : '#b91c1c' }}>
                              {item.product_name || `Product #${item.product_id}`}
                              {!checked && <span style={{ marginLeft: 6, fontSize: '0.72rem', fontWeight: 700, background: '#fee2e2', color: '#b91c1c', padding: '2px 7px', borderRadius: '10px' }}>Rejected</span>}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center', color: '#374151', fontWeight: 700 }}>{item.quantity}</td>
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
                            <td style={{ padding: '10px', textAlign: 'right', color: '#374151' }}>${Number(item.price).toFixed(2)}</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: checked ? '#013223' : '#9ca3af', textDecoration: checked ? 'none' : 'line-through' }}>
                              ${(Number(item.price) * item.quantity).toFixed(2)}
                            </td>
                            {viewOrder.status === 'pending' && (
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleCheck(i)}
                                  style={{ width: '17px', height: '17px', accentColor: '#013223', cursor: 'pointer' }}
                                />
                              </td>
                            )}
                          </tr>
                          {/* Per-item notes row — shown when item is unchecked (rejected) */}
                          {!checked && viewOrder.status === 'pending' && (
                            <tr style={{ background: '#fff5f5', borderBottom: '1px solid #fecaca' }}>
                              <td />
                              <td colSpan={viewOrder.status === 'pending' ? 6 : 5} style={{ padding: '4px 10px 10px' }}>
                                <input
                                  type="text"
                                  value={note}
                                  onChange={e => setItemNote(i, e.target.value)}
                                  placeholder={`Reason for rejecting "${item.product_name || `Product #${item.product_id}`}" (required)`}
                                  style={{
                                    width: '100%', padding: '6px 10px', borderRadius: '6px', boxSizing: 'border-box',
                                    border: `1.5px solid ${noteMissing ? '#ef4444' : '#fca5a5'}`,
                                    fontSize: '0.8rem', outline: 'none', background: '#fff',
                                    color: '#374151', fontFamily: 'inherit'
                                  }}
                                />
                                {noteMissing && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#ef4444' }}>Note is required for rejected items</p>}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                      <td colSpan={viewOrder.status === 'pending' ? 5 : 5} style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#374151', fontSize: '0.9rem' }}>
                        Total ({itemChecks.filter(Boolean).length}/{viewOrder.items.length} items)
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: '#013223' }}>
                        ${viewOrder.items.reduce((s, it, i) => itemChecks[i] !== false ? s + Number(it.price) * it.quantity : s, 0).toFixed(2)}
                      </td>
                      {viewOrder.status === 'pending' && <td />}
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
                    color: submitAttempted && !notes.trim() ? '#b91c1c' : '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px'
                  }}>
                    📝 Notes {submitAttempted && !notes.trim() ? '— required for rejection' : '(required to reject)'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add notes about this order… (required when rejecting)"
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '10px',
                      border: `1.5px solid ${submitAttempted && !notes.trim() ? '#ef4444' : '#e2e8f0'}`,
                      fontSize: '0.88rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'inherit', color: '#374151', background: '#f8fafc',
                    }}
                    onFocus={e => e.target.style.borderColor = '#013223'}
                    onBlur={e => e.target.style.borderColor = submitAttempted && !notes.trim() ? '#ef4444' : '#e2e8f0'}
                  />
                </div>
              )}

              {/* Action buttons */}
              {viewOrder.status === 'pending' && (() => {
                const items = viewOrder.items || []
                const rejectedItemIds = items.filter((_, i) => !itemChecks[i]).map(it => it.id).filter(Boolean)
                const uncheckedIndices = items.map((_, i) => i).filter(i => !itemChecks[i])
                const missingItemNotes = uncheckedIndices.filter(i => !itemNotes[i]?.trim())
                const approvedCount = itemChecks.filter(Boolean).length

                return (
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      className={`${compStyles.orderBtn} ${compStyles.orderBtnReject}`}
                      onClick={() => {
                        setSubmitAttempted(true)
                        if (!notes.trim()) return
                        updateStatus(viewOrder.id, 'rejected')
                      }}
                    >
                      ✕ Reject Order
                    </button>
                    <button
                      className={`${compStyles.orderBtn} ${compStyles.orderBtnApprove}`}
                      onClick={() => {
                        setSubmitAttempted(true)
                        if (missingItemNotes.length > 0) {
                          showToast('Please add notes for all unchecked (rejected) items', 'error')
                          return
                        }
                        if (approvedCount === 0) {
                          showToast('No items selected — use Reject Order instead', 'error')
                          return
                        }
                        updateStatus(viewOrder.id, 'approved', rejectedItemIds)
                      }}
                    >
                      ✅ Approve {approvedCount < items.length ? `(${approvedCount}/${items.length})` : 'Order'}
                    </button>
                  </div>
                )
              })()}
              {viewOrder.status === 'approved' && (
                <>
                  {/* Driver assignment */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                      🚚 Assign Delivery Driver
                    </label>
                    <select
                      value={shipDriverId}
                      onChange={e => setShipDriverId(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', background: '#f8fafc', color: '#374151', fontFamily: 'inherit' }}
                    >
                      <option value="">— Select a driver (optional) —</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} {d.phone ? `· ${d.phone}` : ''}</option>
                      ))}
                    </select>
                    {shipDriverId && (
                      <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#059669' }}>
                        ✓ Order will be assigned to {drivers.find(d => String(d.id) === String(shipDriverId))?.name}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      className={`${compStyles.orderBtn} ${compStyles.orderBtnReject}`}
                      onClick={() => {
                        setSubmitAttempted(true)
                        if (!notes.trim()) return
                        updateStatus(viewOrder.id, 'rejected')
                      }}
                    >
                      ✕ Reject Order
                    </button>
                    <button
                      className={`${compStyles.orderBtn} ${compStyles.orderBtnShip}`}
                      onClick={() => assignDelivery(viewOrder.id, shipDriverId)}
                    >
                      🚚 Assign Driver & Send
                    </button>
                  </div>
                </>
              )}
              {viewOrder.status === 'shipped' && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    className={`${compStyles.orderBtn}`}
                    style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #22c55e' }}
                    onClick={() => updateStatus(viewOrder.id, 'delivered')}
                  >
                    ✓ Mark Delivered
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
