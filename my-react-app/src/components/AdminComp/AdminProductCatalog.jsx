import React, { useState, useEffect } from 'react'
import styles from '../Dashescomp/Dashes.module.css'

const API = 'http://localhost:3000/api/products'
const PAGE_SIZE = 10

const STATUS = {
  available: { label: 'AVAILABLE', bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' },
  low_stock: { label: 'LOW STOCK', bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
  expired:   { label: 'EXPIRED',   bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
}

function getProductStatus(p) {
  if (p.has_expiry && p.expiry_date && new Date(p.expiry_date) < new Date()) return 'expired'
  if (Number(p.stock_quantity) < 20) return 'low_stock'
  return 'available'
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.available
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

function ProductThumb({ product }) {
  const colors = ['#013223','#3b82f6','#8b5cf6','#f97316','#06b6d4','#ec4899','#14b8a6','#ef4444']
  const color = colors[Number(product.id) % colors.length]
  const initials = (product.name || '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
  if (product.image_url) {
    return (
      <img
        src={product.image_url} alt={product.name}
        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 8, background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: '0.75rem', flexShrink: 0,
    }}>
      {initials || '?'}
    </div>
  )
}

function AdminProductCatalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [page, setPage]         = useState(1)
  const [filters, setFilters]   = useState({ category: '', manufacturer: '', status: '', search: '' })
  const [toast, setToast]       = useState(null)

  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(API, { headers })
      if (res.ok) setProducts(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const categories    = [...new Set(products.map(p => p.category).filter(Boolean))].sort()
  const manufacturers = [...new Set(products.map(p => p.manufacturer).filter(Boolean))].sort()

  const filtered = products.filter(p => {
    if (filters.category    && p.category     !== filters.category)    return false
    if (filters.manufacturer && p.manufacturer !== filters.manufacturer) return false
    if (filters.status) {
      if (getProductStatus(p) !== filters.status) return false
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!(
        (p.name || '').toLowerCase().includes(q) ||
        (p.manufacturer || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        String(p.id).includes(q)
      )) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }
  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set())
    else setSelected(new Set(paginated.map(p => p.id)))
  }

  const handleBulkDelete = async () => {
    if (!selected.size) return
    if (!window.confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return
    let ok = 0, fail = 0
    for (const id of selected) {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers })
      res.ok ? ok++ : fail++
    }
    setSelected(new Set())
    fetchProducts()
    showToast(fail ? `${ok} deleted, ${fail} failed (may have orders)` : `${ok} product(s) deleted`)
  }

  const setFilter = (key, val) => { setFilters(prev => ({ ...prev, [key]: val })); setPage(1) }

  const statsAvailable = products.filter(p => getProductStatus(p) === 'available').length
  const statsLow       = products.filter(p => getProductStatus(p) === 'low_stock').length
  const statsExpired   = products.filter(p => getProductStatus(p) === 'expired').length

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>All Products</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
          {products.length.toLocaleString()} total pharmaceutical assets curated
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'TOTAL PRODUCTS', value: products.length, color: '#013223', bg: '#f0fdf4' },
          { label: 'AVAILABLE',      value: statsAvailable,  color: '#15803d', bg: '#f0fdf4' },
          { label: 'LOW STOCK',      value: statsLow,        color: '#c2410c', bg: '#fff7ed' },
          { label: 'EXPIRED',        value: statsExpired,    color: '#b91c1c', bg: '#fef2f2' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '0.9rem 1.1rem', border: `1px solid ${s.color}22` }}>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>{s.label}</p>
            <p style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text" placeholder="Search products…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.82rem', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#013223'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        {/* Category */}
        <select
          value={filters.category}
          onChange={e => setFilter('category', e.target.value)}
          style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.82rem', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {/* Manufacturer */}
        <select
          value={filters.manufacturer}
          onChange={e => setFilter('manufacturer', e.target.value)}
          style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.82rem', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">All Companies</option>
          {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {/* Stock Status */}
        <select
          value={filters.status}
          onChange={e => setFilter('status', e.target.value)}
          style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.82rem', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="low_stock">Low Stock</option>
          <option value="expired">Expired</option>
        </select>
        {/* Clear */}
        {(filters.category || filters.manufacturer || filters.status || filters.search) && (
          <button
            onClick={() => { setFilters({ category: '', manufacturer: '', status: '', search: '' }); setPage(1) }}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '0.8rem', cursor: 'pointer', color: '#64748b' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', padding: '10px 16px', background: '#013223', borderRadius: 10, color: '#fff' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selected.size} item(s) selected</span>
          <button
            onClick={handleBulkDelete}
            style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            🗑 Delete Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#013223', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading products…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <span style={{ fontSize: '2.5rem' }}>💊</span>
            <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>No products match your filters</p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '0.9rem 1rem', background: '#fafafa', width: 40 }}>
                    <input type="checkbox" checked={selected.size === paginated.length && paginated.length > 0} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                  </th>
                  {['THUMBNAIL', 'NAME & ID', 'MANUFACTURER', 'CATEGORY', 'PRICE', 'STOCK', 'EXPIRY', 'STATUS'].map(h => (
                    <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.05em', background: '#fafafa', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, i) => {
                  const status = getProductStatus(p)
                  const isSelected = selected.has(p.id)
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: i < paginated.length - 1 ? '1px solid #f1f5f9' : 'none', background: isSelected ? '#f0fdf4' : 'transparent', transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#fafafa' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} style={{ cursor: 'pointer' }} />
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <ProductThumb product={p} />
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>{p.name}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>RB-SKU-{String(p.id).padStart(5, '0')}</p>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', color: '#64748b' }}>{p.manufacturer || '—'}</td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        {p.category ? (
                          <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600 }}>{p.category}</span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#013223' }}>${Number(p.price || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: Number(p.stock_quantity) < 20 ? '#c2410c' : '#013223' }}>
                          {p.stock_quantity} units
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} products
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? '#cbd5e1' : '#334155', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const n = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      style={{ padding: '5px 11px', borderRadius: 8, border: '1px solid #e2e8f0', background: page === n ? '#013223' : '#fff', color: page === n ? '#fff' : '#334155', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      {n}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? '#cbd5e1' : '#334155', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </>
  )
}

export default AdminProductCatalog
