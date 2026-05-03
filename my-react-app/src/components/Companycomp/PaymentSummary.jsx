import React, { useState, useEffect } from 'react'

const API = 'http://localhost:3000/api/orders/summary/payments'

function PaymentSummary() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetch(API, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRows(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r =>
    !search ||
    (r.pharmacy_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.company_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalDelivered = rows.reduce((s, r) => s + Number(r.total_delivered || 0), 0)
  const totalPending = rows.reduce((s, r) => s + Number(r.total_pending || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <KpiCard label="Total Delivered Value" value={`$${totalDelivered.toFixed(2)}`} color="#013223" border="#22c55e" />
        <KpiCard label="Outstanding (In Progress)" value={`$${totalPending.toFixed(2)}`} color="#92400e" border="#f97316" />
        <KpiCard label="Pharmacies" value={[...new Set(rows.map(r => r.pharmacy_id))].length} border="#3b82f6" />
      </div>

      {/* Search */}
      <div style={{ maxWidth: 360, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
        <input
          type="text"
          placeholder="Search pharmacy or company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Pharmacy', 'Phone', 'Company', 'Orders', 'Delivered Amount', 'In Progress', 'Balance Due'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Pharmacy' || h === 'Company' ? 'left' : 'right', color: '#64748b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No data found.</td></tr>
              ) : filtered.map((r, i) => {
                const delivered = Number(r.total_delivered || 0)
                const pending = Number(r.total_pending || 0)
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '13px 16px', fontWeight: 600, color: '#1e293b' }}>{r.pharmacy_name || `#${r.pharmacy_id}`}</td>
                    <td style={{ padding: '13px 16px', color: '#64748b', textAlign: 'right' }}>{r.pharmacy_phone || '—'}</td>
                    <td style={{ padding: '13px 16px', color: '#374151' }}>{r.company_name || `#${r.company_id}`}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', color: '#64748b' }}>{r.order_count}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>${delivered.toFixed(2)}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', color: '#92400e' }}>${pending.toFixed(2)}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <span style={{
                        fontWeight: 800, fontSize: '0.95rem',
                        color: delivered > 0 ? '#013223' : '#9ca3af'
                      }}>
                        ${delivered.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Total</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>
                    ${filtered.reduce((s, r) => s + Number(r.total_delivered || 0), 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#92400e' }}>
                    ${filtered.reduce((s, r) => s + Number(r.total_pending || 0), 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#013223' }}>
                    ${filtered.reduce((s, r) => s + Number(r.total_delivered || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}

const KpiCard = ({ label, value, color = '#0f172a', border = 'transparent' }) => (
  <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem', flex: 1, minWidth: 160, border: '1px solid #e2e8f0', borderLeft: `4px solid ${border}` }}>
    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
  </div>
)

export default PaymentSummary
