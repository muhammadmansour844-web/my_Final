import React, { useState, useEffect } from 'react'
import DataTable from '../Dashescomp/DataTable'
import Modal from '../Dashescomp/Modal'
import styles from '../Dashescomp/Dashes.module.css'

const API = 'http://localhost:3000/api/pharmacies'

function PharmacyList() {
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })

  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchPharmacies = async () => {
    setLoading(true)
    try {
      const res = await fetch(API, { headers })
      if (res.ok) setPharmacies(await res.json())
    } catch (err) {
      console.error('Failed to fetch pharmacies:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPharmacies() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', address: '' })
    setShowModal(true)
  }

  const openEdit = (pharmacy) => {
    setEditing(pharmacy)
    setForm({ name: pharmacy.name, email: pharmacy.email, phone: pharmacy.phone, address: pharmacy.address })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const url = editing ? `${API}/${editing.id}` : API
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) })
      if (res.ok) {
        showToast(editing ? 'Pharmacy updated' : 'Pharmacy created')
        fetchPharmacies()
        setShowModal(false)
      } else {
        const data = await res.json()
        showToast(data.message || 'Operation failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this pharmacy?')) return
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers })
      if (res.ok) { showToast('Pharmacy deleted'); fetchPharmacies() }
      else {
        const data = await res.json()
        showToast(data.message || 'Delete failed', 'error')
      }
    } catch { showToast('Network error', 'error') }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Pharmacy Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    {
      key: 'created_at', label: 'Created',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—'
    }
  ]

  const renderActions = (row) => (
    <>
      <button className={`${styles.actionBtn} ${styles.actionBtnEdit}`} onClick={() => openEdit(row)} title="Edit">✏️</button>
      <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDelete(row.id)} title="Delete">🗑️</button>
    </>
  )

  return (
    <>
      <DataTable
        title="All Pharmacies"
        columns={columns}
        data={pharmacies}
        actions={renderActions}
        onAdd={openAdd}
        addLabel="Add Pharmacy"
        loading={loading}
      />

      {showModal && (
        <Modal
          title={editing ? 'Edit Pharmacy' : 'Add New Pharmacy'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          submitLabel={editing ? 'Update' : 'Create'}
          loading={saving}
        >
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Pharmacy Name</label>
            <input className={styles.formInput} placeholder="Enter pharmacy name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input className={styles.formInput} type="email" placeholder="pharmacy@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
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

export default PharmacyList
