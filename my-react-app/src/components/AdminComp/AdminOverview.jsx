import React, { useState, useEffect } from 'react'
import {
  FiUsers, FiPackage, FiShoppingBag, FiClock,
  FiCheckCircle, FiAlertTriangle, FiArrowRight,
  FiTrendingUp, FiBox
} from 'react-icons/fi'

const API_ORDERS    = 'http://localhost:3000/api/orders'
const API_PRODUCTS  = 'http://localhost:3000/api/products'
const API_COMPANIES = 'http://localhost:3000/api/companies'
const API_PHARMACIES= 'http://localhost:3000/api/pharmacies'
const API_USERS     = 'http://localhost:3000/api/users'

const STATUS_META = {
  pending:   { label: 'Pending',   bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
  approved:  { label: 'Approved',  bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  shipped:   { label: 'Shipped',   bg: '#f5f3ff', color: '#7c3aed', dot: '#8b5cf6' },
  delivered: { label: 'Delivered', bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' },
  rejected:  { label: 'Rejected',  bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
  cancelled: { label: 'Cancelled', bg: '#f9fafb', color: '#6b7280', dot: '#9ca3af' },
}

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.cancelled
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 9px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
      background: m.bg, color: m.color
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  )
}

function StatCard({ label, value, icon: Icon, accent, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: '10px', background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
          <Icon size={16} strokeWidth={2.2} />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sub}</div>}
    </div>
  )
}

function AdminOverview({ onTabChange }) {
  const [orders, setOrders]       = useState([])
  const [products, setProducts]   = useState([])
  const [companies, setCompanies] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [toast, setToast]         = useState(null)

  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchAll = async () => {
    try {
      const [oRes, pRes, cRes, phRes, uRes] = await Promise.all([
        fetch(API_ORDERS,    { headers }),
        fetch(API_PRODUCTS,  { headers }),
        fetch(API_COMPANIES, { headers }),
        fetch(API_PHARMACIES,{ headers }),
        fetch(API_USERS,     { headers }),
      ])
      if (oRes.ok)  setOrders(await oRes.json())
      if (pRes.ok)  setProducts(await pRes.json())
      if (cRes.ok)  setCompanies(await cRes.json())
      if (phRes.ok) setPharmacies(await phRes.json())
      if (uRes.ok)  setUsers(await uRes.json())
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const updateOrderStatus = async (id, status) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`${API_ORDERS}/${id}`, {
        method: 'PUT', headers, body: JSON.stringify({ status })
      })
      if (res.ok) {
        showToast(`Order #${id} → ${status}`)
        fetchAll()
      } else {
        const data = await res.json()
        showToast(data.message || 'Update failed', 'error')
      }
    } catch { showToast('Network error', 'error') }
    finally { setUpdatingId(null) }
  }

  // Stats
  const totalRevenue   = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const pendingOrders  = orders.filter(o => o.status === 'pending')
  const lowStock       = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 20)
  const outOfStock     = products.filter(p => p.stock_quantity <= 0).length
  const recentOrders   = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#013223', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #013223 0%, #025c3e 100%)',
        borderRadius: '16px', padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Overview Dashboard</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
            Real-time clinical distribution analytics for PharmaBridge network.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { label: 'TOTAL', value: orders.length },
            { label: 'PARTNERS', value: companies.length },
            { label: 'SKUs', value: products.length },
            { label: 'USERS', value: users.length },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.6rem 1rem' }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem', lineHeight: 1 }}>{s.value.toLocaleString()}</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
          <div style={{ textAlign: 'center', background: 'rgba(34,197,94,0.25)', borderRadius: '10px', padding: '0.6rem 1rem', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '1.3rem', lineHeight: 1 }}>${(totalRevenue / 1000).toFixed(1)}k</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', marginTop: '2px' }}>REVENUE</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(239,68,68,0.2)', borderRadius: '10px', padding: '0.6rem 1rem', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ color: '#f87171', fontWeight: 800, fontSize: '1.3rem', lineHeight: 1 }}>{pendingOrders.length}</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', marginTop: '2px' }}>PENDING</div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
        <StatCard label="Companies"   value={companies.length}   icon={FiBox}         accent="#013223" sub="Active partners"   onClick={() => onTabChange('companies')} />
        <StatCard label="Pharmacies"  value={pharmacies.length}  icon={FiPackage}      accent="#3b82f6" sub="Network nodes"     onClick={() => onTabChange('pharmacies')} />
        <StatCard label="Total Orders" value={orders.length}     icon={FiShoppingBag}  accent="#8b5cf6" sub="All time"          onClick={() => onTabChange('orders')} />
        <StatCard label="Pending"     value={pendingOrders.length} icon={FiClock}      accent="#f97316" sub="Need review"       onClick={() => onTabChange('orders')} />
        <StatCard label="Users"       value={users.length}       icon={FiUsers}        accent="#06b6d4" sub="Registered"        onClick={() => onTabChange('users')} />
        <StatCard label="Low Stock"   value={lowStock.length + outOfStock} icon={FiAlertTriangle} accent="#ef4444" sub="Need restocking" />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>

        {/* Recent Distribution Orders */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Recent Distribution Orders</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Latest incoming transactions across the network</p>
            </div>
            <button onClick={() => onTabChange('orders')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#013223', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
              VIEW ALL <FiArrowRight size={14} />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <FiShoppingBag size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>No orders yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    {['ORDER #', 'PHARMACY', 'COMPANY', 'ITEMS', 'TOTAL', 'STATUS', 'ACTION'].map(h => (
                      <th key={h} style={{ padding: '0 0 0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o, i) => (
                    <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.7rem 0.5rem 0.7rem 0', fontWeight: 700, color: '#013223', whiteSpace: 'nowrap' }}>
                        #{String(o.id).padStart(4, '0')}
                      </td>
                      <td style={{ padding: '0.7rem 0.5rem', color: '#0f172a', fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.pharmacy_name || `Ph #${o.pharmacy_id}`}
                      </td>
                      <td style={{ padding: '0.7rem 0.5rem', color: '#64748b', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.company_name || `Co #${o.company_id}`}
                      </td>
                      <td style={{ padding: '0.7rem 0.5rem', color: '#64748b', textAlign: 'center' }}>{o.items_count ?? '—'}</td>
                      <td style={{ padding: '0.7rem 0.5rem', fontWeight: 700, color: '#013223', whiteSpace: 'nowrap' }}>
                        ${Number(o.total_amount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.7rem 0.5rem' }}><StatusBadge status={o.status} /></td>
                      <td style={{ padding: '0.7rem 0 0.7rem 0.5rem' }}>
                        {o.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => updateOrderStatus(o.id, 'approved')}
                              disabled={updatingId === o.id}
                              style={{ padding: '3px 10px', borderRadius: '6px', border: 'none', background: '#f0fdf4', color: '#15803d', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}
                            >✓ Approve</button>
                            <button
                              onClick={() => updateOrderStatus(o.id, 'rejected')}
                              disabled={updatingId === o.id}
                              style={{ padding: '3px 10px', borderRadius: '6px', border: 'none', background: '#fef2f2', color: '#b91c1c', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}
                            >✕ Reject</button>
                          </div>
                        )}
                        {o.status !== 'pending' && <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Low Stock Inventory */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiAlertTriangle size={14} color="#ef4444" />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Low Stock Inventory</h3>
            </div>

            {lowStock.length === 0 && outOfStock === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem 0', color: '#94a3b8' }}>
                <FiCheckCircle size={24} color="#22c55e" style={{ marginBottom: '6px' }} />
                <p style={{ margin: 0, fontSize: '0.8rem' }}>All products stocked</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {outOfStock > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#fef2f2', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#b91c1c' }}>Out of stock</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b91c1c' }}>{outOfStock} items</span>
                  </div>
                )}
                {lowStock.slice(0, 4).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.78rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>{p.manufacturer || p.category || '—'}</p>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                      background: p.stock_quantity < 10 ? '#fef2f2' : '#fff7ed',
                      color: p.stock_quantity < 10 ? '#b91c1c' : '#c2410c'
                    }}>
                      {p.stock_quantity} left
                    </span>
                  </div>
                ))}
                {lowStock.length > 4 && (
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>+{lowStock.length - 4} more items</p>
                )}
              </div>
            )}
          </div>

          {/* Pending Approvals */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiClock size={14} color="#f97316" />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Pending Approval</h3>
              {pendingOrders.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#f97316', color: '#fff', borderRadius: '20px', padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800 }}>
                  {pendingOrders.length}
                </span>
              )}
            </div>

            {pendingOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem 0', color: '#94a3b8' }}>
                <FiCheckCircle size={24} color="#22c55e" style={{ marginBottom: '6px' }} />
                <p style={{ margin: 0, fontSize: '0.8rem' }}>No pending orders</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingOrders.slice(0, 3).map(o => (
                  <div key={o.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#013223', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>
                        {(o.pharmacy_name || 'P').substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.78rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.pharmacy_name || `Pharmacy #${o.pharmacy_id}`}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>
                          Order #{String(o.id).padStart(4, '0')} · ${Number(o.total_amount || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => updateOrderStatus(o.id, 'approved')}
                        disabled={updatingId === o.id}
                        style={{ flex: 1, padding: '5px', borderRadius: '7px', border: 'none', background: '#013223', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        {updatingId === o.id ? '...' : 'APPROVE'}
                      </button>
                      <button
                        onClick={() => updateOrderStatus(o.id, 'rejected')}
                        disabled={updatingId === o.id}
                        style={{ flex: 1, padding: '5px', borderRadius: '7px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        REJECT
                      </button>
                    </div>
                  </div>
                ))}
                {pendingOrders.length > 3 && (
                  <button
                    onClick={() => onTabChange('orders')}
                    style={{ width: '100%', padding: '7px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    View {pendingOrders.length - 3} more <FiArrowRight size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Stats Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Network Reliability', value: '99.84%', sub: 'Active supplier uptime across all sectors', accent: '#22c55e', icon: FiTrendingUp },
          { label: 'Delivered Orders',    value: orders.filter(o => o.status === 'delivered').length, sub: 'Completed successfully', accent: '#3b82f6', icon: FiCheckCircle },
          { label: 'Total Products',      value: products.length, sub: 'Active catalog SKUs', accent: '#8b5cf6', icon: FiPackage },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: c.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent, flexShrink: 0 }}>
              <c.icon size={18} strokeWidth={2} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</p>
              <p style={{ margin: '2px 0 1px', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: toast.type === 'error' ? '#dc2626' : '#013223',
          color: '#fff', padding: '12px 20px', borderRadius: '10px',
          fontWeight: 600, fontSize: '0.9rem', zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </div>
  )
}

export default AdminOverview
