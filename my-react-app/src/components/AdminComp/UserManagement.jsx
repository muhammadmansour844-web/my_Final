import { useState, useEffect } from 'react'
import DataTable from '../Dashescomp/DataTable'
import Modal from '../Dashescomp/Modal'
import styles from '../Dashescomp/Dashes.module.css'
import adminStyles from './Admin.module.css'

const API = 'http://localhost:3000/api/users'

const TABS = [
  { key: 'all',            label: 'All' },
  { key: 'pending',        label: 'Pending Requests' },
  { key: 'super_admin',    label: 'Super Admin' },
  { key: 'company_admin',  label: 'Company Admin' },
  { key: 'pharmacy_admin', label: 'Pharmacy Admin' },
]

const byOldest = (a, b) => new Date(a.created_at) - new Date(b.created_at)

function UserManagement() {
  const [users, setUsers]                     = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [activeTab, setActiveTab]             = useState('all')
  const [loading, setLoading]                 = useState(true)
  const [showModal, setShowModal]             = useState(false)
  const [editing, setEditing]                 = useState(null)
  const [saving, setSaving]                   = useState(false)
  const [actionLoading, setActionLoading]     = useState(null)
  const [toast, setToast]                     = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', password: '', account_type: 'pharmacy_admin', is_active: 1
  })

  const token   = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [usersRes, pendingRes] = await Promise.all([
        fetch(API, { headers }),
        fetch(`${API}/pending`, { headers }),
      ])
      if (usersRes.ok)   setUsers(await usersRes.json())
      if (pendingRes.ok) setPendingRequests(await pendingRes.json())
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // ── Derived data ──────────────────────────────────────────────
  const getFilteredData = () => {
    switch (activeTab) {
      case 'all': {
        const pending = pendingRequests.map(p => ({ ...p, _isPending: true })).sort(byOldest)
        const active  = users.map(u => ({ ...u, _isPending: false })).sort(byOldest)
        return [...pending, ...active]
      }
      case 'pending':        return pendingRequests
      case 'super_admin':    return users.filter(u => u.account_type === 'super_admin')
      case 'company_admin':  return users.filter(u => u.account_type === 'company_admin')
      case 'pharmacy_admin': return users.filter(u => u.account_type === 'pharmacy_admin')
      default:               return users
    }
  }

  const counts = {
    all:            users.length + pendingRequests.length,
    pending:        pendingRequests.length,
    super_admin:    users.filter(u => u.account_type === 'super_admin').length,
    company_admin:  users.filter(u => u.account_type === 'company_admin').length,
    pharmacy_admin: users.filter(u => u.account_type === 'pharmacy_admin').length,
  }

  // ── Modal helpers ─────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', email: '', password: '', account_type: 'pharmacy_admin', is_active: 1 })
    setShowModal(true)
  }

  const openEdit = (user) => {
    setEditing(user)
    setForm({
      name:         user.name,
      email:        user.email,
      password:     '',
      account_type: user.account_type,
      is_active:    user.is_active,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editing) {
        const body = { ...form }
        if (!body.password) delete body.password
        const res = await fetch(`${API}/${editing.id}`, {
          method: 'PUT', headers, body: JSON.stringify(body)
        })
        if (res.ok) {
          showToast('User updated successfully')
          fetchAll()
          setShowModal(false)
        } else {
          const data = await res.json()
          showToast(data.message || 'Update failed', 'error')
        }
      } else {
        const res = await fetch(`${API}/register`, {
          method: 'POST', headers, body: JSON.stringify(form)
        })
        if (res.ok) {
          showToast('User created successfully')
          fetchAll()
          setShowModal(false)
        } else {
          const data = await res.json()
          showToast(data.message || 'Creation failed', 'error')
        }
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers })
      if (res.ok) {
        showToast('User deleted')
        fetchAll()
      } else {
        const data = await res.json()
        showToast(data.message || 'Delete failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
  }

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this registration request?')) return
    setActionLoading(`approve-${id}`)
    try {
      const res = await fetch(`${API}/approve/${id}`, { method: 'POST', headers })
      if (res.ok) {
        showToast('User approved — confirmation email sent')
        fetchAll()
      } else {
        const data = await res.json()
        showToast(data.message || 'Approval failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this registration request?')) return
    setActionLoading(`reject-${id}`)
    try {
      const res = await fetch(`${API}/reject/${id}`, { method: 'POST', headers })
      if (res.ok) {
        showToast('Request rejected')
        fetchAll()
      } else {
        const data = await res.json()
        showToast(data.message || 'Rejection failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleStatus = async (user) => {
    const newActive = user.is_active ? 0 : 1
    const label = newActive ? 'activate' : 'deactivate'
    if (!window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} "${user.name || user.email}"?`)) return
    try {
      const res = await fetch(`${API}/${user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name:         user.name,
          email:        user.email,
          account_type: user.account_type,
          is_active:    newActive,
        })
      })
      if (res.ok) {
        showToast(`User ${label}d successfully`)
        fetchAll()
      } else {
        const data = await res.json()
        showToast(data.message || 'Update failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
  }

  // ── Style helpers ─────────────────────────────────────────────
  const getTypeStyle = (type) => {
    if (type === 'super_admin')   return adminStyles.typeAdmin
    if (type === 'company_admin') return adminStyles.typeCompany
    return adminStyles.typePharmacy
  }

  // ── Column definitions ────────────────────────────────────────

  const statusToggle = (val, row) => row._isPending
    ? <span className={`${styles.badge} ${styles.badgeAmber}`}>⏳ Pending</span>
    : (
      <button
        onClick={() => handleToggleStatus(row)}
        className={`${styles.badge} ${val ? styles.badgeGreen : styles.badgeRed}`}
        style={{ border: 'none', cursor: 'pointer', transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        title={val ? 'Click to deactivate' : 'Click to activate'}
      >
        {val ? '● Active' : '● Inactive'}
      </button>
    )

  const allColumns = [
    {
      key: 'entity_name', label: 'Organization',
      render: (val, row) => {
        const name = row._isPending ? row.company_name : val
        return name || <span style={{ color: 'var(--text-muted)' }}>—</span>
      }
    },
    { key: 'email', label: 'Email' },
    {
      key: 'phone', label: 'Phone',
      render: (val) => val || <span style={{ color: 'var(--text-muted)' }}>—</span>
    },
    {
      key: 'account_type', label: 'Role',
      render: (val) => (
        <span className={`${adminStyles.typeTag} ${getTypeStyle(val)}`}>
          {val?.replace(/_/g, ' ')}
        </span>
      )
    },
    { key: 'is_active', label: 'Status', render: statusToggle },
    {
      key: 'created_at', label: 'Date',
      render: (val) => val ? new Date(val).toLocaleDateString('en-GB') : '—'
    },
  ]

  const userColumns = [
    {
      key: 'entity_name', label: 'Organization',
      render: (val) => val || <span style={{ color: 'var(--text-muted)' }}>—</span>
    },
    { key: 'email', label: 'Email' },
    {
      key: 'phone', label: 'Phone',
      render: (val) => val || <span style={{ color: 'var(--text-muted)' }}>—</span>
    },
    {
      key: 'account_type', label: 'Role',
      render: (val) => (
        <span className={`${adminStyles.typeTag} ${getTypeStyle(val)}`}>
          {val?.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'is_active', label: 'Status',
      render: (val, row) => statusToggle(val, row)
    },
    {
      key: 'created_at', label: 'Created',
      render: (val) => val ? new Date(val).toLocaleDateString('en-GB') : '—'
    },
  ]

  const pendingColumns = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'company_name', label: 'Organization',
      render: (val) => val || <span style={{ color: 'var(--text-muted)' }}>—</span>
    },
    {
      key: 'account_type', label: 'Type',
      render: (val) => (
        <span className={`${adminStyles.typeTag} ${getTypeStyle(val)}`}>
          {val?.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'phone', label: 'Phone',
      render: (val) => val || <span style={{ color: 'var(--text-muted)' }}>—</span>
    },
    {
      key: 'created_at', label: 'Submitted',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—'
    },
  ]

  // ── Action renderers ──────────────────────────────────────────
  const renderUserActions = (row) => (
    <>
      <button
        className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
        onClick={() => openEdit(row)}
        title="Edit"
      >✏️</button>
      <button
        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
        onClick={() => handleDelete(row.id)}
        title="Delete"
      >🗑️</button>
    </>
  )

  const renderPendingActions = (row) => {
    const isApproving = actionLoading === `approve-${row.id}`
    const isRejecting = actionLoading === `reject-${row.id}`
    const busy = isApproving || isRejecting
    return (
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button
          onClick={() => handleApprove(row.id)}
          disabled={busy}
          title="Accept"
          style={{
            padding: '0.3rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            borderRadius: '7px',
            border: 'none',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            color: '#fff',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          {isApproving ? '…' : '✓ Accept'}
        </button>
        <button
          onClick={() => handleReject(row.id)}
          disabled={busy}
          title="Reject"
          style={{
            padding: '0.3rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            borderRadius: '7px',
            border: '1px solid #e74c3c',
            background: 'rgba(231,76,60,0.08)',
            color: '#e74c3c',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          {isRejecting ? '…' : '✕ Reject'}
        </button>
      </div>
    )
  }

  const renderAllActions = (row) =>
    row._isPending ? renderPendingActions(row) : renderUserActions(row)

  const activeColumns =
    activeTab === 'all'     ? allColumns :
    activeTab === 'pending' ? pendingColumns :
    userColumns

  const activeActions =
    activeTab === 'all'     ? renderAllActions :
    activeTab === 'pending' ? renderPendingActions :
    renderUserActions

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.3rem',
        marginBottom: '1.2rem',
        background: 'var(--bg-light-2)',
        padding: '0.3rem',
        borderRadius: '12px',
        flexWrap: 'wrap',
      }}>
        {TABS.map(tab => {
          const isActive  = activeTab === tab.key
          const isPending = tab.key === 'pending'
          const hasPending = counts.pending > 0
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1.1rem',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                background: isActive ? 'var(--white)' : 'transparent',
                color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.07)' : 'none',
              }}
            >
              {tab.label}
              <span style={{
                background: isActive
                  ? (isPending && hasPending ? 'rgba(239,68,68,0.12)' : 'rgba(22,163,74,0.12)')
                  : (isPending && hasPending ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.06)'),
                color: isActive
                  ? (isPending && hasPending ? '#dc2626' : 'var(--primary-color)')
                  : (isPending && hasPending ? '#dc2626' : 'var(--text-muted)'),
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                minWidth: '20px',
                textAlign: 'center',
              }}>
                {counts[tab.key]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <DataTable
        title={TABS.find(t => t.key === activeTab)?.label || 'All Users'}
        columns={activeColumns}
        data={getFilteredData()}
        actions={activeActions}
        onAdd={activeTab !== 'pending' ? openAdd : undefined}
        addLabel="Add User"
        loading={loading}
      />

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={editing ? 'Edit User' : 'Add New User'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          submitLabel={editing ? 'Update' : 'Create'}
          loading={saving}
        >
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Full Name</label>
            <input
              className={styles.formInput}
              placeholder="Enter full name"
              value={form.name}
              readOnly={!!editing}
              style={editing ? { background: 'var(--bg-light-2)', cursor: 'not-allowed', color: 'var(--text-muted)' } : {}}
              onChange={e => !editing && setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email Address</label>
            <input
              className={styles.formInput}
              type="email"
              placeholder="user@example.com"
              value={form.email}
              readOnly={!!editing}
              style={editing ? { background: 'var(--bg-light-2)', cursor: 'not-allowed', color: 'var(--text-muted)' } : {}}
              onChange={e => !editing && setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Password {editing && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(leave empty to keep current)</span>}
            </label>
            <input
              className={styles.formInput}
              type="password"
              placeholder={editing ? '••••••••' : 'Enter password'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Account Type</label>
              <select
                className={styles.formSelect}
                value={form.account_type}
                onChange={e => setForm({ ...form, account_type: e.target.value })}
              >
                <option value="super_admin">Super Admin</option>
                <option value="company_admin">Company Admin</option>
                <option value="pharmacy_admin">Pharmacy Admin</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <select
                className={styles.formSelect}
                value={form.is_active}
                onChange={e => setForm({ ...form, is_active: parseInt(e.target.value) })}
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </>
  )
}

export default UserManagement
