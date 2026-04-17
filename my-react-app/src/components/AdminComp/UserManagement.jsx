import React, { useState, useEffect } from 'react'
import DataTable from '../Dashescomp/DataTable'
import Modal from '../Dashescomp/Modal'
import styles from '../Dashescomp/Dashes.module.css'
import adminStyles from './Admin.module.css'

const API = 'http://localhost:3000/api/users'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', password: '', account_type: 'pharmacy_admin', is_active: 1
  })

  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(API, { headers })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', email: '', password: '', account_type: 'pharmacy_admin', is_active: 1 })
    setShowModal(true)
  }

  const openEdit = (user) => {
    setEditing(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      account_type: user.account_type,
      is_active: user.is_active
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
          fetchUsers()
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
          fetchUsers()
          setShowModal(false)
        } else {
          const data = await res.json()
          showToast(data.message || 'Creation failed', 'error')
        }
      }
    } catch (err) {
      showToast('Network error', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers })
      if (res.ok) {
        showToast('User deleted successfully')
        fetchUsers()
      } else {
        const data = await res.json()
        showToast(data.message || 'Delete failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
  }

  const getTypeStyle = (type) => {
    if (type === 'super_admin') return adminStyles.typeAdmin
    if (type === 'company_admin') return adminStyles.typeCompany
    return adminStyles.typePharmacy
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'account_type', label: 'Role',
      render: (val) => (
        <span className={`${adminStyles.typeTag} ${getTypeStyle(val)}`}>
          {val?.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'is_active', label: 'Status',
      render: (val) => (
        <span className={`${styles.badge} ${val ? styles.badgeGreen : styles.badgeRed}`}>
          {val ? '● Active' : '● Inactive'}
        </span>
      )
    },
    {
      key: 'created_at', label: 'Created',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—'
    }
  ]

  const renderActions = (row) => (
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

  return (
    <>
      <DataTable
        title="All Users"
        columns={columns}
        data={users}
        actions={renderActions}
        onAdd={openAdd}
        addLabel="Add User"
        loading={loading}
      />

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
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email Address</label>
            <input
              className={styles.formInput}
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Password {editing && '(leave empty to keep current)'}
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

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </>
  )
}

export default UserManagement
