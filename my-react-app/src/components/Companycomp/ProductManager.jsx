import React, { useState, useEffect } from 'react'
import DataTable from '../Dashescomp/DataTable'
import Modal from '../Dashescomp/Modal'
import AddProduct from './AddProduct'
import styles from '../Dashescomp/Dashes.module.css'
import compStyles from './Company.module.css'

const API_PRODUCTS = 'http://localhost:3000/api/products'

function ProductManager() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddPage, setShowAddPage] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [discountModal, setDiscountModal] = useState({ show: false, product: null, discount: '' })

  const token = localStorage.getItem('token')
  const authHeader = { 'Authorization': `Bearer ${token}` }
  const jsonHeaders = { ...authHeader, 'Content-Type': 'application/json' }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_PRODUCTS, { headers: jsonHeaders })
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
    setShowAddPage(true)
  }

  const openEdit = (product) => {
    setEditing({
      ...product,
      expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : '',
      promotion_end_date: product.promotion_end_date ? product.promotion_end_date.substring(0, 16) : ''
    })
    setShowAddPage(true)
  }

  const handleSubmit = async (formData) => {
    setSaving(true)
    try {
      const { existingImages, newFiles, ...fields } = formData

      // الخطوة 1: إرسال بيانات المنتج كـ JSON
      const productBody = { ...fields, has_expiry: fields.expiry_date ? 1 : 0 }
      const url = editing ? `${API_PRODUCTS}/${editing.id}` : API_PRODUCTS
      const method = editing ? 'PUT' : 'POST'

      const res = await fetch(url, { method, headers: jsonHeaders, body: JSON.stringify(productBody) })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.message || (editing ? 'Update failed' : 'Creation failed'), 'error')
        return
      }

      const result = await res.json()
      const productId = editing ? editing.id : result.productId

      // الخطوة 2: إدارة الصور (إضافة/حذف) كـ FormData منفصل
      if (editing) {
        // عند التعديل: أرسل القائمة الكاملة (ابقاء + جديد)
        const imgForm = new FormData()
        existingImages?.forEach(img => imgForm.append('keepImages', img))
        newFiles?.forEach(f => imgForm.append('images', f))
        await fetch(`${API_PRODUCTS}/${productId}/images`, { method: 'PUT', headers: authHeader, body: imgForm })
      } else if (newFiles?.length > 0) {
        // عند الإنشاء: أرسل الصور الجديدة فقط
        const imgForm = new FormData()
        newFiles.forEach(f => imgForm.append('images', f))
        await fetch(`${API_PRODUCTS}/${productId}/images`, { method: 'POST', headers: authHeader, body: imgForm })
      }

      showToast(editing ? 'Product updated' : 'Product created')
      fetchProducts()
      setShowAddPage(false)
    } catch {
      showToast('Network error', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try {
      const res = await fetch(`${API_PRODUCTS}/${id}`, { method: 'DELETE', headers: jsonHeaders })
      if (res.ok) { showToast('Product deleted'); fetchProducts() }
      else {
        const data = await res.json()
        showToast(data.message || 'Delete failed', 'error')
      }
    } catch { showToast('Network error', 'error') }
  }

  const handleSaveDiscount = async (product, newDiscount) => {
    try {
      const { images, ...fields } = product
      const body = { ...fields, discount_percentage: Number(newDiscount), has_expiry: product.expiry_date ? 1 : 0 }
      const res = await fetch(`${API_PRODUCTS}/${product.id}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(body) })
      if (res.ok) {
        showToast('Discount updated')
        fetchProducts()
        setDiscountModal({ show: false, product: null, discount: '' })
      } else {
        const data = await res.json()
        showToast(data.message || 'Failed to update discount', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
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
      render: (val) => val > 0
        ? <span className={`${styles.badge} ${styles.badgeRed}`}>-{val}%</span>
        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
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
      <button
        className={`${styles.actionBtn}`}
        onClick={() => setDiscountModal({ show: true, product: row, discount: row.discount_percentage || '' })}
        title="Set Discount"
        style={{ color: '#059669', borderColor: '#d1fae5', background: '#ecfdf5' }}
      >
        🏷️
      </button>
    </>
  )

  if (showAddPage) {
    return (
      <>
        <AddProduct
          onBack={() => setShowAddPage(false)}
          onSave={handleSubmit}
          loading={saving}
          initialData={editing}
        />
        {toast && (
          <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
            {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
          </div>
        )}
      </>
    )
  }

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

      {discountModal.show && (
        <Modal
          title={`Set Discount for ${discountModal.product?.name}`}
          onClose={() => setDiscountModal({ show: false, product: null, discount: '' })}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Discount Percentage (%)</label>
            <input
              type="number"
              value={discountModal.discount}
              onChange={(e) => setDiscountModal(p => ({ ...p, discount: e.target.value }))}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', outline: 'none' }}
              min="0"
              max="100"
            />
            <button
              onClick={() => handleSaveDiscount(discountModal.product, discountModal.discount)}
              style={{ background: '#013223', color: 'white', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              Save Discount
            </button>
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
