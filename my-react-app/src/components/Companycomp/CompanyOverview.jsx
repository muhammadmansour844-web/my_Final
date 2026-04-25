import React, { useState, useEffect } from 'react'
import {
  FiPackage, FiShoppingBag, FiAlertTriangle, FiCheckCircle,
  FiClock, FiTruck, FiPlus, FiArrowRight
} from 'react-icons/fi'
import styles from './Company.module.css'

const API_ORDERS = 'http://localhost:3000/api/orders'
const API_PRODUCTS = 'http://localhost:3000/api/products'

const STATUS_META = {
  pending:   { label: 'Pending',   bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
  approved:  { label: 'Approved',  bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  shipped:   { label: 'Shipped',   bg: '#f5f3ff', color: '#7c3aed', dot: '#8b5cf6' },
  delivered: { label: 'Delivered', bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' },
  rejected:  { label: 'Rejected',  bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
  cancelled: { label: 'Cancelled', bg: '#f9fafb', color: '#6b7280', dot: '#9ca3af' },
}

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.cancelled
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 9px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
      background: meta.bg, color: meta.color
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
      {meta.label}
    </span>
  )
}

function StatCard({ label, value, icon: Icon, accent, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
      padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{
          width: 36, height: 36, borderRadius: '10px', background: accent + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: '1rem'
        }}>
          <Icon strokeWidth={2.2} />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sub}</div>}
    </div>
  )
}

function CompanyOverview({ onAddProduct, onViewOrders }) {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ordRes, prodRes] = await Promise.all([
          fetch(API_ORDERS, { headers }),
          fetch(API_PRODUCTS, { headers }),
        ])
        if (ordRes.ok) setOrders(await ordRes.json())
        if (prodRes.ok) setProducts(await prodRes.json())
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const totalOrders   = orders.length
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const shippedOrders = orders.filter(o => o.status === 'shipped').length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const totalProducts = products.length
  const lowStockProducts = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 20)
  const outOfStock = products.filter(p => p.stock_quantity <= 0).length

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)

  const userName = localStorage.getItem('user_name') || 'Company'

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

      {/* Welcome bar */}
      <div style={{
        background: 'linear-gradient(135deg, #013223 0%, #025c3e 100%)',
        borderRadius: '16px', padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            Welcome back, {userName} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
            Here's what's happening with your business today.
          </p>
        </div>
        <button
          onClick={onAddProduct}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
          }}
        >
          <FiPlus strokeWidth={2.5} /> Add Product
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem' }}>
        <StatCard label="Total Orders"    value={totalOrders}    icon={FiShoppingBag} accent="#3b82f6" sub="All time" />
        <StatCard label="Pending"         value={pendingOrders}  icon={FiClock}       accent="#f97316" sub="Need attention" />
        <StatCard label="Shipped"         value={shippedOrders}  icon={FiTruck}       accent="#8b5cf6" sub="In transit" />
        <StatCard label="Delivered"       value={deliveredOrders} icon={FiCheckCircle} accent="#22c55e" sub="Completed" />
        <StatCard label="Products"        value={totalProducts}  icon={FiPackage}     accent="#013223" sub="Active catalog" />
        <StatCard label="Low Stock"       value={lowStockProducts.length} icon={FiAlertTriangle} accent="#ef4444" sub="Need restocking" />
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>

        {/* Recent Orders */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Recent Incoming Orders</h2>
            <button
              onClick={onViewOrders}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', color: '#013223',
                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
              }}
            >
              View all <FiArrowRight size={14} />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <FiShoppingBag size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No orders yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {recentOrders.map((order, idx) => (
                <div key={order.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 0',
                  borderBottom: idx < recentOrders.length - 1 ? '1px solid #f1f5f9' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '10px', background: '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <FiShoppingBag size={16} color="#64748b" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        {order.pharmacy_name || `Pharmacy #${order.pharmacy_id}`}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                        #{String(order.id).padStart(4, '0')} · {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#013223' }}>
                      ${Number(order.total_amount || 0).toFixed(2)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiAlertTriangle size={16} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Low Stock Alert</h2>
          </div>

          {lowStockProducts.length === 0 && outOfStock === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#94a3b8' }}>
              <FiCheckCircle size={28} style={{ marginBottom: '0.5rem', color: '#22c55e' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>All products are well-stocked!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {outOfStock > 0 && (
                <div style={{
                  padding: '0.6rem 0.9rem', borderRadius: '10px',
                  background: '#fef2f2', border: '1px solid #fecaca',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#b91c1c' }}>Out of stock</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#b91c1c' }}>{outOfStock} items</span>
                </div>
              )}
              {lowStockProducts.slice(0, 5).map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0', borderBottom: '1px solid #f8fafc'
                }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>{p.name}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>{p.category || 'Uncategorized'}</p>
                  </div>
                  <span style={{
                    padding: '2px 9px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                    background: p.stock_quantity < 10 ? '#fef2f2' : '#fff7ed',
                    color: p.stock_quantity < 10 ? '#b91c1c' : '#c2410c'
                  }}>
                    {p.stock_quantity} left
                  </span>
                </div>
              ))}
              {lowStockProducts.length > 5 && (
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                  +{lowStockProducts.length - 5} more items
                </p>
              )}
            </div>
          )}

          <button
            onClick={onAddProduct}
            style={{
              width: '100%', marginTop: '1rem', padding: '0.65rem',
              borderRadius: '10px', border: 'none',
              background: '#013223', color: '#fff',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <FiPlus strokeWidth={2.5} /> Manage Products
          </button>
        </div>
      </div>
    </div>
  )
}

export default CompanyOverview
