import { useState, useEffect } from 'react';
import { FiStar, FiSearch } from 'react-icons/fi';

const API = 'http://localhost:3000/api/users';

const DriverRatings = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    d.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>Driver Ratings</h1>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <StatCard title="REGISTERED DRIVERS" value={drivers.length} icon={<FiStar color="#16a34a" size={24} />} />
        <StatCard title="ACTIVE DRIVERS" value={drivers.filter(d => d.is_active).length} />
        <StatCard title="RATINGS SYSTEM" value="Coming Soon" bg="#1e3a2f" textColor="#fff" titleColor="#6ee7b7" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', maxWidth: '360px' }}>
        <FiSearch color="#9ca3af" />
        <input
          type="text"
          placeholder="Search driver..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%' }}
        />
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f5', borderBottom: '1px solid #e4e4e7' }}>
              {['DRIVER', 'EMAIL', 'LICENSE / ID', 'STATUS', 'RATING'].map(h => (
                <th key={h} style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#52525b', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>No drivers found.</td></tr>
            ) : filtered.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#064e3b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 }}>
                      {d.name?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#18181b' }}>{d.name}</span>
                  </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: '#52525b' }}>{d.email}</td>
                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: '#52525b' }}>
                  <span style={{ backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' }}>
                    {d.entity_name || '—'}
                  </span>
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <span style={{ backgroundColor: d.is_active ? '#dcfce7' : '#fee2e2', color: d.is_active ? '#166534' : '#991b1b', padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700' }}>
                    {d.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>
                  No ratings yet
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bg = '#fff', textColor = '#111827', titleColor = '#6b7280' }) => (
  <div style={{ backgroundColor: bg, borderRadius: '12px', padding: '1.5rem 2rem', flex: 1, minWidth: '200px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: titleColor, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</div>
    <div style={{ fontSize: '2rem', fontWeight: '700', color: textColor, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
      {value} {icon}
    </div>
  </div>
);

export default DriverRatings;
