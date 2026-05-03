import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLogOut, FiTruck, FiStar, FiUser, FiLoader } from 'react-icons/fi'
import AllDeliveries from '../components/AdminComp/DeliveryComp/AllDeliveries'
import DriverProfile from '../components/AdminComp/DeliveryComp/DriverProfile'
import DriverRatings from '../components/AdminComp/DeliveryComp/DriverRatings'

const TABS = [
  { id: 'deliveries', label: 'My Deliveries', icon: <FiTruck size={16} /> },
  { id: 'profile',    label: 'My Profile',    icon: <FiUser size={16} /> },
  { id: 'ratings',    label: 'My Ratings',    icon: <FiStar size={16} /> },
]

function DeliveryDash() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('deliveries')
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const accountType = localStorage.getItem('account_type')
  const driverName  = profile?.name || localStorage.getItem('user_name') || 'Driver'
  const licenseNum  = profile?.entity_name || localStorage.getItem('entity_name') || ''

  useEffect(() => {
    if (!accountType) navigate('/login')
    else if (accountType !== 'delivery_admin') navigate('/login')
  }, [accountType, navigate])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('http://localhost:3000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          setProfile(await res.json())
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        setLoadingProfile(false)
      }
    }
    if (accountType === 'delivery_admin') fetchProfile()
  }, [accountType])

  if (accountType !== 'delivery_admin') return null

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{ width: '240px', background: '#073220', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0a422b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86efac', fontWeight: 700, fontSize: '1rem' }}>
              {driverName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{driverName}</div>
              <div style={{ color: '#86a89a', fontSize: '0.72rem' }}>Delivery Driver</div>
            </div>
          </div>
          {licenseNum && (
            <div style={{ marginTop: '0.5rem', background: 'rgba(134,239,172,0.1)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', color: '#86efac', fontWeight: 600 }}>
              License: {licenseNum}
            </div>
          )}
        </div>

        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '0.75rem 1rem', borderRadius: '8px', border: 'none',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#86a89a',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1rem' }}>
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.12)', color: '#fca5a5', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <FiLogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, background: '#f4f6f5', padding: '2.5rem 3rem', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {TABS.find(t => t.id === activeTab)?.label}
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            {activeTab === 'deliveries' && 'Track and manage your assigned deliveries'}
            {activeTab === 'profile'    && 'View your driver profile and performance stats'}
            {activeTab === 'ratings'    && 'See what customers say about your deliveries'}
          </p>
        </div>

        {activeTab === 'deliveries' && <AllDeliveries />}
        {activeTab === 'profile'    && (
          loadingProfile ? <div style={{ textAlign: 'center', padding: '3rem' }}><FiLoader className="animate-spin" size={32} color="#064e3b" /></div> :
          <DriverProfile
            driver={profile}
            onBack={() => setActiveTab('deliveries')}
          />
        )}
        {activeTab === 'ratings'    && <DriverRatings />}
      </main>
    </div>
  )
}

export default DeliveryDash
