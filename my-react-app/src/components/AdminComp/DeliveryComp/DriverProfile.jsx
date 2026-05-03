import { FiChevronRight, FiMail, FiPhone, FiTag, FiCalendar } from 'react-icons/fi';

const DriverProfile = ({ driver, onBack }) => {
  if (!driver) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
        <span style={{ cursor: 'pointer', color: '#16a34a' }} onClick={onBack}>← Back to Drivers</span>
      </div>
    );
  }

  const joinDate = driver.created_at
    ? new Date(driver.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div style={{ color: '#6b7280', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ cursor: 'pointer', color: '#16a34a' }} onClick={onBack}>Drivers</span>
        <FiChevronRight size={14} />
        <span style={{ color: '#111827', fontWeight: '500' }}>{driver.name}</span>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#064e3b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.5rem' }}>
            {driver.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: '0 0 0.5rem 0' }}>{driver.name}</h1>
            <span style={{
              backgroundColor: driver.is_active ? '#bbf7d0' : '#fee2e2',
              color: driver.is_active ? '#166534' : '#991b1b',
              padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.5px'
            }}>
              {driver.is_active ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <InfoCard icon={<FiMail color="#064e3b" />} label="Email" value={driver.email} />
        <InfoCard icon={<FiPhone color="#064e3b" />} label="Phone" value={driver.phone || '—'} />
        <InfoCard icon={<FiTag color="#064e3b" />} label="License / ID" value={driver.entity_name || '—'} />
        <InfoCard icon={<FiCalendar color="#064e3b" />} label="Member Since" value={joinDate} />
      </div>

      <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb', color: '#6b7280', textAlign: 'center', fontSize: '0.9rem' }}>
        Delivery history and ratings will appear here once the driver completes deliveries.
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value }) => (
  <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '600' }}>{value}</div>
    </div>
  </div>
);

export default DriverProfile;
