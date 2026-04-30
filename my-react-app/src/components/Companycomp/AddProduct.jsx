import React, { useState } from 'react';
import styles from './AddProduct.module.css';

function AddProduct({ onBack, onSave, loading, initialData = null }) {
  const [form, setForm] = useState(initialData || {
    name: '', category: '', manufacturer: '', description: '',
    price: '', stock_quantity: '', expiry_date: '',
    dosage_form: '', storage_requirements: '', unit_type: 'Box',
    units_per_package: 1, discount_percentage: '', promotion_end_date: ''
  });

  // صور موجودة من قاعدة البيانات (أسماء ملفات)
  const [existingImages, setExistingImages] = useState(initialData?.images || []);
  // ملفات جديدة يختارها المستخدم
  const [newFiles, setNewFiles] = useState([]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(prev => [...prev, ...files]);
  };

  const removeExisting = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNew = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({ ...form, existingImages, newFiles });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <button className={styles.backButton} onClick={onBack}>
            ← Back to My Products
          </button>
          <h1 className={styles.title}>{initialData ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.discardBtn} onClick={onBack}>DISCARD CHANGES</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
            {loading ? 'SAVING...' : 'SAVE PRODUCT'}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainCol}>
          {/* Basic Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.iconGreen}>ℹ️</span>
              <h3>BASIC INFORMATION</h3>
            </div>

            <div className={styles.formGroup}>
              <label>Product Name</label>
              <input
                type="text"
                placeholder="e.g. Amoxicillin 500mg"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
                  <option value="">Select Category</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Pain Relief">Pain Relief</option>
                  <option value="Vitamins">Vitamins</option>
                  <option value="Cardiology">Cardiology</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. PharmaCorp Global"
                  value={form.manufacturer}
                  onChange={e => handleChange('manufacturer', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                placeholder="Enter detailed clinical description and therapeutic indications..."
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Pharmaceutical Details */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.iconGreen}>💊</span>
              <h3>PHARMACEUTICAL DETAILS</h3>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Dosage Form</label>
                <select value={form.dosage_form} onChange={e => handleChange('dosage_form', e.target.value)}>
                  <option value="">Select Dosage Form</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Drops">Drops</option>
                  <option value="Powder">Powder</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={e => handleChange('expiry_date', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Storage Requirements</label>
              <input
                type="text"
                placeholder="e.g. Store below 25°C, away from direct light"
                value={form.storage_requirements}
                onChange={e => handleChange('storage_requirements', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.sideCol}>
          {/* Product Images */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.iconGreen}>🖼️</span>
              <h3>PRODUCT IMAGES</h3>
            </div>
            <div className={styles.imageGrid}>
              {existingImages.map((filename, idx) => (
                <div key={`ex-${idx}`} className={styles.imageWrapper}>
                  <img src={`http://localhost:3000/uploads/products/${filename}`} alt={`Product ${idx}`} className={styles.imagePreview} />
                  <button className={styles.removeImgBtn} onClick={() => removeExisting(idx)}>✕</button>
                </div>
              ))}
              {newFiles.map((file, idx) => (
                <div key={`new-${idx}`} className={styles.imageWrapper}>
                  <img src={URL.createObjectURL(file)} alt={`New ${idx}`} className={styles.imagePreview} />
                  <button className={styles.removeImgBtn} onClick={() => removeNew(idx)}>✕</button>
                </div>
              ))}
              <div className={styles.imageUpload}>
                <div className={styles.uploadPlaceholder}>
                  <div className={styles.uploadIcon}>⬆️</div>
                  <p><strong>Upload</strong></p>
                </div>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className={styles.fileInput} />
              </div>
            </div>
          </div>

          {/* Commercials */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.iconGreen}>💵</span>
              <h3>COMMERCIALS</h3>
            </div>

            <div className={styles.formGroup}>
              <label>Price ($)</label>
              <input
                type="number"
                placeholder="$ 0.00"
                value={form.price}
                onChange={e => handleChange('price', e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Unit Type</label>
              <select value={form.unit_type} onChange={e => handleChange('unit_type', e.target.value)}>
                <option value="Box">Box (كرتون)</option>
                <option value="Bottle">Bottle (علبة)</option>
                <option value="Pack">Pack (باكيت)</option>
                <option value="Unit">Unit (حبة)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Units per {form.unit_type || 'Package'} (عدد الحبات في الكرتونة)</label>
              <input
                type="number"
                placeholder="e.g. 24"
                value={form.units_per_package}
                onChange={e => handleChange('units_per_package', e.target.value)}
                min="1"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Stock (number of {form.unit_type || 'units'}s)</label>
              <input
                type="number"
                placeholder="0"
                value={form.stock_quantity}
                onChange={e => handleChange('stock_quantity', e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Discount Percentage (%)</label>
              <input
                type="number"
                placeholder="0"
                value={form.discount_percentage}
                onChange={e => handleChange('discount_percentage', e.target.value)}
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Promotion Details */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.iconGreen}>📅</span>
              <h3>PROMOTION DETAILS</h3>
            </div>

            <div className={styles.formGroup}>
              <label>Promotion End Date</label>
              <input
                type="datetime-local"
                value={form.promotion_end_date}
                onChange={e => handleChange('promotion_end_date', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
