import React from 'react'
import { FiX } from 'react-icons/fi'
import styles from './Dashes.module.css'

function Modal({ title, children, onClose, onSubmit, submitLabel, loading }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {children}
        </div>

        {/* Footer */}
        {onSubmit && (
          <div className={styles.modalFooter}>
            <button
              className={`${styles.tableBtn} ${styles.tableBtnSecondary}`}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={`${styles.tableBtn} ${styles.tableBtnPrimary}`}
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : (submitLabel || 'Save')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
