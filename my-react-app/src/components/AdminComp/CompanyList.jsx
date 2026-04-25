import React, { useState, useEffect } from 'react'
import Modal from '../Dashescomp/Modal'
import styles from '../Dashescomp/Dashes.module.css'

const API = 'http://localhost:3000/api/companies'
const API_ORDERS = 'http://localhost:3000/api/orders'

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?'
}

const ACCENT_COLORS = ['#013223','#3b82f6','#8b5cf6','#f97316','#06b6d4','#ec4899','#14b8a6','#ef4444']
const accentFor = (id) => ACCENT_COLORS[Number(id) % ACCENT_COLORS.length]

function CompanyList() {
  const [companies, setCompanies] = useState([])
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState(null)
  const [form, setForm]           = useState({ name: '', email: '', phone: '', address: '' })

  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [cRes, oRes] = await Promise.all([
        fetch(API, { headers }),
        fetch(API_ORDERS, { headers }),
      ])
      if (cRes.ok) setCompanies(await cRes.json())
      if (oRes.ok) setOrders(await oRes.json())
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const ordersForCompany = (id) => orders.filter(o => Number(o.company_id) === Number(id)).length

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', address: '' })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const url = editing ? `${API}/${editing.id}` : API
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) })
      if (res.ok) {
        showToast(editing ? 'Company updated' : 'Company created')
        fetchAll(); setShowModal(false)
      } else {
        const data = await res.json()
        showToast(data.message || 'Operation failed', 'error')
      }
    } catch { showToast('Network error', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this company? This cannot be undone.')) return
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers })
      if (res.ok) { showToast('Company deleted'); fetchAll() }
      else {
        const data = await res.json()
        showToast(data.message || 'Delete failed', 'error')
      }
    } catch { showToast('Network error', 'error') }
  }

  const q = search.toLowerCase().trim()
  const filtered = q
    ? companies.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q)
      )
    : companies

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#013223', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading companies...</p>
      </div>
    )
  }

  return (
    <>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Companies</h2>
          <span style={{ background: '#013223', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
            {companies.length} TOTAL
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              placeholder="Search companies…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 10px 8px 32px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.82rem', outline: 'none', background: '#f8fafc', width: 220 }}
              onFocus={e => e.target.style.borderColor = '#013223'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem' }}>✕</button>}
          </div>
          <button
            onClick={openAdd}
            style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: '#013223', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            + Add Company
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <span style={{ fontSize: '2.5rem' }}>🏢</span>
            <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>{search ? 'No companies match your search' : 'No companies yet'}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['COMPANY', 'EMAIL', 'PHONE', 'LOCATION', 'ORDERS', 'JOINED', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '1rem 1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', background: '#fafafa' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const orderCount = ordersForCompany(c.id)
                const accent = accentFor(c.id)
                return (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '10px', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem', flexShrink: 0 }}>
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>{c.name}</p>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>ID #{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{c.email || '—'}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{c.phone || '—'}</td>
                    <td style={{ padding: '1rem', color: '#64748b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: 700, color: orderCount > 0 ? '#013223' : '#94a3b8' }}>{orderCount}</span>
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className={`${styles.actionBtn} ${styles.actionBtnEdit}`} onClick={() => openEdit(c)} title="Edit">✏️</button>
                        <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDelete(c.id)} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {[
          { label: 'Network Reliability', value: '99.84%', sub: 'Active supplier uptime', bg: '#f0fdf4', color: '#15803d' },
          { label: 'Pending Verifications', value: companies.filter(c => !c.email).length, sub: 'Incomplete profiles', bg: '#fff7ed', color: '#c2410c' },
          { label: 'System Status', value: 'All systems operational', sub: 'Next compliance audit in 4 days', bg: '#f0fdf4', color: '#15803d', small: true },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '1rem 1.25rem', border: `1px solid ${s.color}22` }}>
            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            <p style={{ margin: '4px 0 2px', fontSize: s.small ? '0.85rem' : '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={editing ? 'Edit Company' : 'Add New Company'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          submitLabel={editing ? 'Update' : 'Create'}
          loading={saving}
        >
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Company Name</label>
            <input className={styles.formInput} placeholder="Enter company name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input className={styles.formInput} type="email" placeholder="company@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone</label>
              <input className={styles.formInput} placeholder="+966..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address</label>
              <input className={styles.formInput} placeholder="City, Country" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </>
  )
}

export default CompanyList
