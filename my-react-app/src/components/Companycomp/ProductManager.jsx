import React, { useState, useEffect } from 'react'
import DataTable from '../Dashescomp/DataTable'
import Modal from '../Dashescomp/Modal'
import styles from '../Dashescomp/Dashes.module.css'
import compStyles from './Company.module.css'

const API_PRODUCTS = 'http://localhost:3000/api/products'

function ProductManager() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    name: '', category: '', manufacturer: '', description: '',
    price: '', stock_quantity: '', has_expiry: 0, expiry_date: '',
    discount_percentage: 0
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

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_PRODUCTS, { headers })
      if (res.ok) setProducts(await res.json())
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({
      name: '', category: '', manufacturer: '', description: '',
      price: '', stock_quantity: '', has_expiry: 0, expiry_date: '',
      discount_percentage: 0
    })
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      category: product.category || '',
      manufacturer: product.manufacturer || '',
      description: product.description || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      has_expiry: product.has_expiry || 0,
      expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : '',
      discount_percentage: product.discount_percentage || 0
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      let body = { ...form }
      if (editing) {
        const res = await fetch(`${API_PRODUCTS}/${editing.id}`, {
          method: 'PUT', headers, body: JSON.stringify(body)
        })
        if (res.ok) {
          showToast('Product updated')
          fetchProducts()
          setShowModal(false)
        } else {
          const data = await res.json()
          showToast(data.message || 'Update failed', 'error')
        }
      } else {
        // For new product, we need company_id — the backend validates via token
        body.company_id = 1 // Will be validated server-side
        const res = await fetch(API_PRODUCTS, {
          method: 'POST', headers, body: JSON.stringify(body)
        })
        if (res.ok) {
          showToast('Product created')
          fetchProducts()
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
    if (!window.confirm('Delete this product?')) return
    try {
      const res = await fetch(`${API_PRODUCTS}/${id}`, { method: 'DELETE', headers })
      if (res.ok) { showToast('Product deleted'); fetchProducts() }
      else {
        const data = await res.json()
        showToast(data.message || 'Delete failed', 'error')
      }
    } catch { showToast('Network error', 'error') }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    {
      key: 'price', label: 'Price',
      render: (val) => <span className={compStyles.priceTag}>${parseFloat(val).toFixed(2)}</span>
    },
    {
      key: 'stock_quantity', label: 'Stock',
      render: (val) => (
        <span className={`${compStyles.stockTag} ${val < 20 ? compStyles.stockLow : compStyles.stockOk}`}>
          {val} units
        </span>
      )
    },
    {
      key: 'discount_percentage', label: 'Discount',
      render: (val) => val > 0 ? (
        <span className={`${styles.badge} ${styles.badgeRed}`}>-{val}%</span>
      ) : (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
      )
    },
    {
      key: 'expiry_date', label: 'Expiry',
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
        title={`My Products (${products.length})`}
        columns={columns}
        data={products}
        actions={renderActions}
        onAdd={openAdd}
        addLabel="Add Product"
        loading={loading}
      />

      {showModal && (
        <Modal
          title={editing ? 'Edit Product' : 'Add New Product'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          submitLabel={editing ? 'Update' : 'Create'}
          loading={saving}
        >
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Product Name</label>
            <input className={styles.formInput} placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <input className={styles.formInput} placeholder="e.g. Pain Relief" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Manufacturer</label>
              <input className={styles.formInput} placeholder="e.g. Pharma Inc." value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description</label>
            <input className={styles.formInput} placeholder="Short description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Price ($)</label>
              <input className={styles.formInput} type="number" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Stock Quantity</label>
              <input className={styles.formInput} type="number" placeholder="0" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Discount (%)</label>
              <input className={styles.formInput} type="number" min="0" max="100" placeholder="0" value={form.discount_percentage} onChange={e => setForm({ ...form, discount_percentage: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Expiry Date</label>
              <input className={styles.formInput} type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value, has_expiry: e.target.value ? 1 : 0 })} />
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

export default ProductManager
