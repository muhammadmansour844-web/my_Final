import React from 'react'
import styles from './Dashes.module.css'

function DataTable({ title, columns, data, actions, onAdd, addLabel, loading }) {
  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tableContainer}>
      {/* Header */}
      <div className={styles.tableHeader}>
        <h3 className={styles.tableTitle}>{title}</h3>
        <div className={styles.tableActions}>
          {onAdd && (
            <button className={`${styles.tableBtn} ${styles.tableBtnPrimary}`} onClick={onAdd}>
              + {addLabel || 'Add New'}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📭</span>
          <p className={styles.emptyText}>No data found</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>{col.label}</th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={row.id || rowIdx}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td>{actions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default DataTable
