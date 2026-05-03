import { useState, useEffect } from 'react';
import { FiSearch, FiCheckCircle, FiXCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const API = 'http://localhost:3000/api/users';
const PAGE_SIZE = 10;

const DriversList = ({ onAddDriver, onViewDriver }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const all = await res.json();
          setDrivers(all.filter(u => u.account_type === 'delivery_admin'));
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  const filtered = drivers.filter(d =>
    !search ||
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    (d.entity_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total:     drivers.length,
    active:    drivers.filter(d => d.is_active).length,
    inactive:  drivers.filter(d => !d.is_active).length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', margin: '0 0 0.5rem 0' }}>Drivers</h1>
          <div style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: '500' }}>Total: {stats.total}</div>
        </div>
        <button
          onClick={onAddDriver}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', backgroundColor: '#064e3b', color: '#fff', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Add Driver
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <StatCard title="Total Drivers" value={stats.total} />
        <StatCard title="Active" value={stats.active} positive />
        <StatCard title="Inactive" value={stats.inactive} />
      </div>

      <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', flex: 1 }}>
          <FiSearch color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by name, email, or license..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr 0.5fr', padding: '0 1.5rem 0.5rem', borderBottom: '1px solid #e5e7eb' }}>
          {['DRIVER', 'EMAIL', 'LICENSE / ID', 'STATUS', ''].map((h, i) => (
            <span key={i} style={{ fontSize: '0.65rem', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.5px' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading drivers…</div>
        ) : paged.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>No drivers found.</div>
        ) : paged.map(d => (
          <div
            key={d.id}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr 0.5fr', alignItems: 'center', backgroundColor: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', borderLeft: d.is_active ? '4px solid transparent' : '4px solid #7f1d1d', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              onClick={() => onViewDriver && onViewDriver(d)}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#064e3b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.9rem', flexShrink: 0 }}>
                {d.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#111827' }}>{d.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{d.phone || '—'}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>{d.email}</div>

            <div>
              <span style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#4b5563', fontWeight: '500' }}>
                {d.entity_name || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '500', color: d.is_active ? '#111827' : '#ef4444' }}>
              {d.is_active
                ? <FiCheckCircle color="#10b981" size={14} />
                : <FiXCircle color="#ef4444" size={14} />}
              {d.is_active ? 'Active' : 'Inactive'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => onViewDriver && onViewDriver(d)}
                style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} drivers
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
  );
};

const StatCard = ({ title, value, positive }) => (
  <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', flex: 1, minWidth: '140px', border: '1px solid #e5e7eb' }}>
    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#4b5563' }}>{title}</div>
    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', marginTop: '0.5rem' }}>{value}</div>
    {positive !== undefined && (
      <div style={{ fontSize: '0.75rem', color: positive ? '#10b981' : '#6b7280', marginTop: '0.25rem' }}>
        {positive ? 'Active accounts' : 'Inactive accounts'}
      </div>
    )}
  </div>
);

const PageBtn = ({ num, icon, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '4px', backgroundColor: active ? '#064e3b' : 'transparent', color: active ? '#fff' : '#4b5563', fontSize: '0.8rem', fontWeight: active ? '600' : '400', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}
  >
    {num || icon}
  </button>
);

export default DriversList;
