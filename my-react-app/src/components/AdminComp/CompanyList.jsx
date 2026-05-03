import React, { useState, useEffect } from 'react'
import Modal from '../Dashescomp/Modal'
import styles from '../Dashescomp/Dashes.module.css'

const API = 'http://localhost:3000/api/companies'
const API_ORDERS = 'http://localhost:3000/api/orders'
const API_UNITS = 'http://localhost:3000/api/unit-types'

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

  // ── Unit Types State ─────────────────────────────────────
  const [showUnitsModal, setShowUnitsModal] = useState(false)
  const [unitsCompany, setUnitsCompany]     = useState(null)
  const [unitTypes, setUnitTypes]           = useState([])
  const [unitsLoading, setUnitsLoading]     = useState(false)
  const [newUnitName, setNewUnitName]       = useState('')
  const [newUnitPieces, setNewUnitPieces]   = useState(1)
  const [editingUnit, setEditingUnit]       = useState(null)
  const [editUnitName, setEditUnitName]     = useState('')
  const [editUnitPieces, setEditUnitPieces] = useState(1)

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

  // ── Unit Types CRUD ───────────────────────────────────────
  const fetchUnits = async (companyId) => {
    setUnitsLoading(true)
    try {
      const res = await fetch(`${API_UNITS}/company/${companyId}`, { headers })
      if (res.ok) setUnitTypes(await res.json())
    } catch { /* ignore */ }
    finally { setUnitsLoading(false) }
  }

  const openUnitsModal = (company) => {
    setUnitsCompany(company)
    setUnitTypes([])
    setShowUnitsModal(true)
    setNewUnitName('')
    setNewUnitPieces(1)
    setEditingUnit(null)
    fetchUnits(company.id)
  }

  const handleAddUnit = async () => {
    if (!newUnitName.trim() || newUnitPieces < 1) return
    try {
      const res = await fetch(API_UNITS, {
        method: 'POST', headers,
        body: JSON.stringify({ company_id: unitsCompany.id, name: newUnitName.trim(), pieces_per_unit: parseInt(newUnitPieces) })
      })
      if (res.ok) {
        showToast('Unit type added')
        setNewUnitName(''); setNewUnitPieces(1)
        fetchUnits(unitsCompany.id)
      } else {
        const data = await res.json()
        showToast(data.message || 'Failed to add', 'error')
      }
    } catch { showToast('Network error', 'error') }
  }

  const handleUpdateUnit = async (unitId) => {
    if (!editUnitName.trim() || editUnitPieces < 1) return
    try {
      const res = await fetch(`${API_UNITS}/${unitId}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ name: editUnitName.trim(), pieces_per_unit: parseInt(editUnitPieces) })
      })
      if (res.ok) {
        showToast('Unit type updated')
        setEditingUnit(null)
        fetchUnits(unitsCompany.id)
      } else {
        const data = await res.json()
        showToast(data.message || 'Update failed', 'error')
      }
    } catch { showToast('Network error', 'error') }
  }

  const handleDeleteUnit = async (unitId) => {
    if (!window.confirm('Delete this unit type?')) return
    try {
      const res = await fetch(`${API_UNITS}/${unitId}`, { method: 'DELETE', headers })
      if (res.ok) {
        showToast('Unit type deleted')
        fetchUnits(unitsCompany.id)
      } else {
        const data = await res.json()
        showToast(data.message || 'Delete failed', 'error')
      }
    } catch { showToast('Network error', 'error') }
  }

  // ── Company CRUD ──────────────────────────────────────────
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
                        <button
                          onClick={() => openUnitsModal(c)}
                          title="Manage Unit Types"
                          style={{
                            padding: '5px 10px', borderRadius: '8px', border: '1.5px solid #8b5cf6',
                            background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.18)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)' }}
                        >
                          📦 Units
                        </button>
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

      {/* ── Unit Types Modal ────────────────────────────────── */}
      {showUnitsModal && unitsCompany && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
        }} onClick={() => setShowUnitsModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '20px', width: '100%', maxWidth: 520,
            maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem 1.75rem 1rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  📦 Unit Types
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Manage unit types for <strong style={{ color: '#8b5cf6' }}>{unitsCompany.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowUnitsModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', width: 36, height: 36, fontSize: '1.1rem', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>

            {/* Add New Unit */}
            <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="e.g. كرتونة، حبة، شريط..."
                value={newUnitName}
                onChange={e => setNewUnitName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddUnit()}
                style={{
                  flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
                  fontSize: '0.85rem', outline: 'none', background: '#f8fafc',
                }}
                onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <input
                type="number" min="1" placeholder="Pcs"
                value={newUnitPieces}
                onChange={e => setNewUnitPieces(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddUnit()}
                style={{
                  width: 75, padding: '10px 10px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
                  fontSize: '0.85rem', outline: 'none', background: '#f8fafc', textAlign: 'center',
                }}
                onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                onClick={handleAddUnit}
                disabled={!newUnitName.trim()}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: 'none',
                  background: newUnitName.trim() ? '#8b5cf6' : '#e2e8f0',
                  color: newUnitName.trim() ? '#fff' : '#94a3b8',
                  fontWeight: 700, fontSize: '0.82rem', cursor: newUnitName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >+ Add</button>
            </div>

            {/* Unit Types List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.75rem 1.5rem' }}>
              {unitsLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#8b5cf6', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                  Loading...
                </div>
              ) : unitTypes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                  <span style={{ fontSize: '2rem' }}>📭</span>
                  <p style={{ margin: '0.5rem 0 0', fontWeight: 600, fontSize: '0.9rem' }}>No unit types yet</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>Add unit types like كرتونة، حبة، ورقة...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {unitTypes.map((unit, i) => (
                    <div key={unit.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem', borderRadius: '12px',
                      background: '#f8fafc', border: '1px solid #f1f5f9',
                    }}>
                      {editingUnit === unit.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem', flex: 1, alignItems: 'center' }}>
                          <input
                            autoFocus
                            value={editUnitName}
                            onChange={e => setEditUnitName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleUpdateUnit(unit.id)
                              if (e.key === 'Escape') setEditingUnit(null)
                            }}
                            style={{
                              flex: 1, padding: '6px 10px', border: '1.5px solid #8b5cf6',
                              borderRadius: '8px', fontSize: '0.85rem', outline: 'none',
                            }}
                          />
                          <input
                            type="number" min="1"
                            value={editUnitPieces}
                            onChange={e => setEditUnitPieces(e.target.value)}
                            style={{
                              width: 65, padding: '6px 8px', border: '1.5px solid #8b5cf6',
                              borderRadius: '8px', fontSize: '0.85rem', outline: 'none', textAlign: 'center',
                            }}
                          />
                          <button
                            onClick={() => handleUpdateUnit(unit.id)}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#8b5cf6', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                          >Save</button>
                          <button
                            onClick={() => setEditingUnit(null)}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer' }}
                          >Cancel</button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{
                              width: 28, height: 28, borderRadius: '8px',
                              background: 'rgba(139,92,246,0.12)', color: '#8b5cf6',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 800,
                            }}>{i + 1}</span>
                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{unit.name}</span>
                            <span style={{
                              background: '#f0fdf4', color: '#15803d', padding: '2px 8px',
                              borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                            }}>{unit.pieces_per_unit} pcs</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => { setEditingUnit(unit.id); setEditUnitName(unit.name); setEditUnitPieces(unit.pieces_per_unit) }}
                              title="Edit"
                              style={{ padding: '5px 8px', borderRadius: '7px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}
                            >✏️</button>
                            <button
                              onClick={() => handleDeleteUnit(unit.id)}
                              title="Delete"
                              style={{ padding: '5px 8px', borderRadius: '7px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: '0.75rem' }}
                            >🗑️</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {unitTypes.length > 0 && (
              <div style={{
                padding: '0.75rem 1.75rem', borderTop: '1px solid #f1f5f9',
                background: '#fafafa', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600,
              }}>
                {unitTypes.length} unit type{unitTypes.length !== 1 ? 's' : ''} configured
              </div>
            )}
          </div>
        </div>
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
