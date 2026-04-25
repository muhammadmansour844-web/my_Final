import React, { useState, useEffect } from 'react'
import styles from '../Dashescomp/Dashes.module.css'

const API_ORDERS    = 'http://localhost:3000/api/orders'
const API_PHARMACIES = 'http://localhost:3000/api/pharmacies'

const STATUS_META = {
  pending:   { label: 'Pending',   bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
  approved:  { label: 'Approved',  bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  shipped:   { label: 'Shipped',   bg: '#f5f3ff', color: '#7c3aed', dot: '#8b5cf6' },
  delivered: { label: 'Delivered', bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' },
  rejected:  { label: 'Rejected',  bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
  cancelled: { label: 'Cancelled', bg: '#f9fafb', color: '#6b7280', dot: '#9ca3af' },
}

const statusBadge = (status) => {
  const m = STATUS_META[status] || STATUS_META.pending
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: m.bg, color: m.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'inline-block' }} />
      {m.label}
    </span>
  )
}

const ACCENT_COLORS = ['#013223','#3b82f6','#8b5cf6','#f97316','#06b6d4','#ec4899','#14b8a6','#ef4444']
const accentFor = (id) => ACCENT_COLORS[Number(id) % ACCENT_COLORS.length]

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?'
}

function AdminPharmacyDetail({ pharmacyId, onBack }) {
  const [pharmacy, setPharmacy] = useState(null)
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)

  const token   = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [pRes, oRes] = await Promise.all([
          fetch(`${API_PHARMACIES}/${pharmacyId}`, { headers }),
          fetch(API_ORDERS, { headers }),
        ])
        if (pRes.ok) setPharmacy(await pRes.json())
        if (oRes.ok) {
          const all = await oRes.json()
          setOrders(all.filter(o => Number(o.pharmacy_id) === Number(pharmacyId)))
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [pharmacyId])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#013223', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading pharmacy…</p>
      </div>
    )
  }

  if (!pharmacy) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
        <span style={{ fontSize: '2.5rem' }}>⚠️</span>
        <p style={{ fontWeight: 600 }}>Pharmacy not found</p>
        <button onClick={onBack} style={{ marginTop: '1rem', padding: '8px 20px', borderRadius: 10, border: 'none', background: '#013223', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>← Back</button>
      </div>
    )
  }

  const totalOrdered  = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const deliveredAmt  = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const pendingCount  = orders.filter(o => o.status === 'pending').length
  const recentOrders  = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

  // Partner analytics: group by company
  const companyTotals = {}
  orders.forEach(o => {
    const name = o.company_name || `#${o.company_id}`
    companyTotals[name] = (companyTotals[name] || 0) + Number(o.total_amount || 0)
  })
  const partnerList = Object.entries(companyTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
  const maxPartner = partnerList[0]?.[1] || 1

  const accent = accentFor(pharmacy.id)

  return (
    <>
      {/* Back button + action row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
        >
          ← Back to Pharmacies
        </button>
      </div>

      {/* Pharmacy Profile Card */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ width: 72, height: 72, borderRadius: 16, background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem', flexShrink: 0 }}>
            {getInitials(pharmacy.name)}
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{pharmacy.name}</h2>
            {pharmacy.address && (
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>📍 {pharmacy.address}</p>
            )}
            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {pharmacy.email && (
                <div>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#334155' }}>{pharmacy.email}</p>
                </div>
              )}
              {pharmacy.phone && (
                <div>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#334155' }}>{pharmacy.phone}</p>
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Since</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#334155' }}>
                  {pharmacy.created_at ? new Date(pharmacy.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pharmacy ID</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#334155' }}>#{pharmacy.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'ORDERED VALUE',  value: `$${totalOrdered.toFixed(2)}`,  color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'PAID (DELIVERED)', value: `$${deliveredAmt.toFixed(2)}`, color: '#15803d', bg: '#f0fdf4' },
          { label: 'PENDING ORDERS', value: pendingCount,                    color: '#c2410c', bg: '#fff7ed' },
          { label: 'TOTAL ORDERS',   value: orders.length,                   color: '#013223', bg: '#f0fdf4' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '1rem 1.25rem', border: `1px solid ${s.color}22` }}>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>{s.label}</p>
            <p style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Two-column bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(260px, 340px)', gap: '1.25rem', alignItems: 'start' }}>

        {/* Order History */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Order History</h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{orders.length} total orders</span>
          </div>
          {orders.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: '2rem' }}>📦</span>
              <p style={{ margin: '0.5rem 0 0' }}>No orders yet</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                  {['ORDER ID', 'COMPANY', 'DATE', 'STATUS', 'VALUE'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => (
                  <tr key={o.id} style={{ borderBottom: i < recentOrders.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#013223' }}>#{String(o.id).padStart(4, '0')}</td>
                    <td style={{ padding: '0.8rem 1rem', color: '#64748b' }}>{o.company_name || `#${o.company_id}`}</td>
                    <td style={{ padding: '0.8rem 1rem', color: '#94a3b8', fontSize: '0.78rem' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '0.8rem 1rem' }}>{statusBadge(o.status)}</td>
                    <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#013223' }}>${Number(o.total_amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {orders.length > 5 && (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Showing 5 most recent of {orders.length} orders</span>
            </div>
          )}
        </div>

        {/* Partner Analytics */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Partner Analytics</h3>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue by Company</p>
          {partnerList.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No order data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {partnerList.map(([name, amount], i) => {
                const pct = Math.round((amount / totalOrdered) * 100) || 0
                const barColor = ACCENT_COLORS[i % ACCENT_COLORS.length]
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: barColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
                          {name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{name}</span>
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#013223' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Order status breakdown */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Status Breakdown</p>
            {Object.entries(STATUS_META).map(([status, meta]) => {
              const count = orders.filter(o => o.status === status).length
              if (!count) return null
              return (
                <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#475569' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
                    {meta.label}
                  </span>
                  <span style={{ fontWeight: 700, color: meta.color, fontSize: '0.85rem' }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </>
  )
}

export default AdminPharmacyDetail
