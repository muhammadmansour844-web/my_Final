import { useState, useEffect } from 'react';
import { 
  FiSearch, FiCheckCircle, FiXCircle, FiChevronLeft, FiChevronRight, 
  FiPackage, FiMapPin, FiPhone, FiCalendar, FiTruck, FiMap 
} from 'react-icons/fi';

const API_ORDERS = 'http://localhost:3000/api/orders';
const API_DELIVERIES = 'http://localhost:3000/api/deliveries';
const PAGE_SIZE = 10;

const AllDeliveries = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const token = localStorage.getItem('token');
  const accountType = localStorage.getItem('account_type');
  const isDeliveryDriver = accountType === 'delivery_admin';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = isDeliveryDriver ? API_DELIVERIES : API_ORDERS;
        const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setOrders(await res.json());
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isDeliveryDriver]);

  const updateDeliveryStatus = async (deliveryId, newStatus) => {
    try {
      const res = await fetch(`${API_DELIVERIES}/${deliveryId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Refresh data
        const res2 = await fetch(API_DELIVERIES, { headers: { Authorization: `Bearer ${token}` } });
        if (res2.ok) setOrders(await res2.json());
      }
    } catch (err) {
      console.error('Failed to update delivery status:', err);
    }
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return String(o.id).includes(q) ||
      (o.company_name || '').toLowerCase().includes(q) ||
      (o.pharmacy_name || '').toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fmt = (id) => `#${String(id).padStart(4, '0')}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // ── Delivery driver card view ──────────────────────────────────────────────
  if (isDeliveryDriver) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#062c1d', margin: '0 0 0.25rem' }}>My Deliveries</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            {loading ? 'Loading…' : orders.length === 0
              ? 'No deliveries assigned to you yet.'
              : `${orders.length} order${orders.length !== 1 ? 's' : ''} assigned to you`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <StatCard title="ASSIGNED TO ME" value={orders.length} borderColor="#3b82f6" />
          <StatCard
            title="TODAY"
            value={orders.filter(o => o.shipped_at && new Date(o.shipped_at).toDateString() === new Date().toDateString()).length}
            borderColor="#22c55e"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
          <FiSearch color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by order #, pharmacy, or supplier..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem 0' }}>Loading deliveries…</p>
        ) : paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ fontWeight: 600, color: '#374151', margin: '0 0 0.5rem' }}>No deliveries assigned</p>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Once the company ships an order to you, it will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paged.map(o => <DeliveryCard key={o.id} order={o} fmt={fmt} fmtDate={fmtDate} onUpdateStatus={updateDeliveryStatus} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
            <PageBtn icon={<FiChevronLeft size={16} />} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <PageBtn key={n} num={n} active={n === page} onClick={() => setPage(n)} />
            ))}
            <PageBtn icon={<FiChevronRight size={16} />} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
          </div>
        )}
      </div>
    );
  }

  // ── Super-admin table view ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 500, color: '#062c1d', margin: '0 0 0.25rem 0' }}>All Orders</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
          {loading ? 'Loading…' : `Manage and track ${orders.length} orders.`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <StatCard title="TOTAL"     value={orders.length} />
        <StatCard title="PENDING"   value={orders.filter(o => o.status === 'pending').length}   borderColor="#f97316" />
        <StatCard title="APPROVED"  value={orders.filter(o => o.status === 'approved').length}  borderColor="#3b82f6" />
        <StatCard title="SHIPPED"   value={orders.filter(o => o.status === 'shipped').length}   borderColor="#22c55e" />
        <StatCard title="DELIVERED" value={orders.filter(o => o.status === 'delivered').length} borderColor="#059669" />
        <StatCard title="REJECTED"  value={orders.filter(o => o.status === 'rejected').length}  borderColor="#991b1b" valueColor="#991b1b" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <FiSearch color="#9ca3af" />
        <input
          type="text"
          placeholder="Search by order #, supplier, or pharmacy..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
        />
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['ORDER #', 'SUPPLIER', 'PHARMACY', 'ITEMS', 'TOTAL', 'DRIVER', 'DATE', 'STATUS'].map(h => (
                  <th key={h} style={{ padding: '1.25rem', fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading orders…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>No orders found.</td></tr>
              ) : paged.map(o => {
                const STATUS_MAP = {
                  pending:   { label: 'PENDING',   bg: '#fef9c3', color: '#854d0e' },
                  approved:  { label: 'APPROVED',  bg: '#dbeafe', color: '#1e40af' },
                  shipped:   { label: 'SHIPPED',   bg: '#e0f2fe', color: '#0369a1' },
                  delivered: { label: 'DELIVERED', bg: '#dcfce7', color: '#166534' },
                  rejected:  { label: 'REJECTED',  bg: '#fee2e2', color: '#991b1b' },
                };
                const s = STATUS_MAP[o.status] || STATUS_MAP.pending;
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1.25rem', fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{fmt(o.id)}</td>
                    <td style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#374151' }}>{o.company_name || `Company #${o.company_id}`}</td>
                    <td style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#374151' }}>{o.pharmacy_name || `Pharmacy #${o.pharmacy_id}`}</td>
                    <td style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#6b7280' }}>{o.items_count ?? '—'}</td>
                    <td style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#111827', fontWeight: 600 }}>${Number(o.total_amount || 0).toFixed(2)}</td>
                    <td style={{ padding: '1.25rem', fontSize: '0.85rem', color: o.driver_name ? '#374151' : '#d1d5db' }}>{o.driver_name || 'Unassigned'}</td>
                    <td style={{ padding: '1.25rem', fontSize: '0.8rem', color: '#6b7280' }}>{fmtDate(o.created_at)}</td>
                    <td style={{ padding: '1.25rem' }}>
                      <span style={{ backgroundColor: s.bg, color: s.color, padding: '4px 10px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
          </span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <PageBtn icon={<FiChevronLeft size={16} />} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <PageBtn key={n} num={n} active={n === page} onClick={() => setPage(n)} />
            ))}
            <PageBtn icon={<FiChevronRight size={16} />} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
          </div>
        </div>
      </div>
    </div>
  );
};

const DeliveryCard = ({ order, fmt, fmtDate, onUpdateStatus }) => {
  const isAssigned = order.status === 'assigned';
  const isPickedUp = order.status === 'picked_up' || order.status === 'on_way' || order.status === 'accepted';
  
  const statusLabels = {
    assigned: { label: 'NEW ASSIGNMENT', bg: '#fef9c3', color: '#854d0e' },
    accepted: { label: 'ACCEPTED', bg: '#dcfce7', color: '#166534' },
    picked_up: { label: 'PICKED UP', bg: '#dbeafe', color: '#1e40af' },
    on_way: { label: 'ON WAY', bg: '#e0f2fe', color: '#0369a1' },
    delivered: { label: 'DELIVERED', bg: '#ecfdf5', color: '#065f46' },
    rejected: { label: 'REJECTED', bg: '#fee2e2', color: '#991b1b' },
  };
  const s = statusLabels[order.status] || { label: order.status?.toUpperCase(), bg: '#f1f5f9', color: '#475569' };

  return (
    <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em' }}>ORDER</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#013223' }}>{fmt(order.order_id || order.id)}</div>
        </div>
        <span style={{ background: s.bg, color: s.color, padding: '5px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
          {s.label}
        </span>
      </div>

      <div style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '0.75rem', fontSize: '0.85rem' }}>
        <InfoRow icon={<FiPackage size={13} />} label="Supplier" value={order.company_name || `Company #${order.company_id}`} />
        <InfoRow icon={<FiMapPin size={13} />} label="Pharmacy" value={order.pharmacy_name || `Pharmacy #${order.pharmacy_id}`} />
        <InfoRow icon={<FiPhone size={13} />} label="Phone" value={order.pharmacy_phone || '—'} />
        <InfoRow icon={<FiMap size={13} />} label="Location" value={order.pharmacy_location || '—'} />
        <InfoRow icon={<FiCalendar size={13} />} label="Assigned" value={fmtDate(order.assigned_at || order.created_at)} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>ORDER VALUE</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#013223' }}>${Number(order.total_amount || 0).toFixed(2)}</div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {isAssigned && (
            <>
              <button 
                onClick={() => onUpdateStatus(order.id, 'rejected')}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fff', color: '#991b1b', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Reject
              </button>
              <button 
                onClick={() => onUpdateStatus(order.id, 'accepted')}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Accept
              </button>
            </>
          )}
          {order.status === 'accepted' && (
            <button 
              onClick={() => onUpdateStatus(order.id, 'picked_up')}
              style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Mark Picked Up
            </button>
          )}
          {(order.status === 'picked_up' || order.status === 'on_way') && (
            <button 
              onClick={() => onUpdateStatus(order.id, 'delivered')}
              style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Mark Delivered
            </button>
          )}
          {order.status === 'delivered' && (
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>✓ Delivered</div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#374151' }}>
    <span style={{ color: '#9ca3af', marginTop: '1px', flexShrink: 0 }}>{icon}</span>
    <div>
      <div style={{ fontSize: '0.67rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  </div>
);

const StatCard = ({ title, value, borderColor = 'transparent', valueColor = '#062c1d' }) => (
  <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem', flex: 1, minWidth: '110px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: `4px solid ${borderColor}` }}>
    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280', letterSpacing: '0.5px' }}>{title}</div>
    <div style={{ fontSize: '2.2rem', fontWeight: 500, color: valueColor, marginTop: '0.25rem' }}>{value}</div>
  </div>
);

const PageBtn = ({ num, icon, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '6px', backgroundColor: active ? '#f3f4f6' : 'transparent', color: active ? '#111827' : '#6b7280', fontSize: '0.85rem', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}
  >
    {num || icon}
  </button>
);

export default AllDeliveries;
