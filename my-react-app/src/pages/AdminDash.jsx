import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Dashescomp/Sidebar'
import DashHeader from '../components/Dashescomp/DashHeader'
import AdminOverview from '../components/AdminComp/AdminOverview'
import UserManagement from '../components/AdminComp/UserManagement'
import CompanyList from '../components/AdminComp/CompanyList'
import PharmacyList from '../components/AdminComp/PharmacyList'
import OrdersOverview from '../components/AdminComp/OrdersOverview'
import AdminProductCatalog from '../components/AdminComp/AdminProductCatalog'
import AdminPharmacyDetail from '../components/AdminComp/AdminPharmacyDetail'
import AllDeliveries from '../components/AdminComp/DeliveryComp/AllDeliveries'
import DriversPage from '../components/AdminComp/DeliveryComp/DriversPage'
import DriverRatings from '../components/AdminComp/DeliveryComp/DriverRatings'
import styles from '../components/Dashescomp/Dashes.module.css'

const tabTitles = {
  overview:   { title: 'Overview Dashboard',  breadcrumb: 'Admin → Overview' },
  users:      { title: 'User Management',      breadcrumb: 'Admin → Users' },
  companies:  { title: 'Companies',            breadcrumb: 'Admin → Catalog → Companies' },
  pharmacies: { title: 'Pharmacies',           breadcrumb: 'Admin → Catalog → Pharmacies' },
  products:   { title: 'All Products',         breadcrumb: 'Admin → Catalog → Products' },
  orders:     { title: 'Orders',               breadcrumb: 'Admin → Operations → Orders' },
  finance:        { title: 'Finance',          breadcrumb: 'Admin → Operations → Finance' },
  system:         { title: 'System',           breadcrumb: 'Admin → Operations → System' },
  deliveries:     { title: 'All Deliveries',   breadcrumb: 'Admin → Logistics → Deliveries' },
  drivers:        { title: 'Drivers',          breadcrumb: 'Admin → Logistics → Drivers' },
  driver_ratings: { title: 'Driver Ratings',   breadcrumb: 'Admin → Logistics → Ratings' },
}

function AdminDash() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab]         = useState('overview')
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(null)

  const current     = tabTitles[activeTab] || tabTitles.overview
  const userName    = localStorage.getItem('user_name') || 'Admin'
  const accountType = localStorage.getItem('account_type')

  useEffect(() => {
    if (!accountType) navigate('/login')
    else if (accountType === 'company_admin') navigate('/company')
    else if (accountType === 'pharmacy_admin') navigate('/pharmacy-dashboard')
    else if (accountType === 'delivery_admin') navigate('/delivery-dashboard')
    else if (accountType !== 'super_admin') navigate('/login')
  }, [accountType, navigate])

  if (accountType !== 'super_admin') return null

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // reset pharmacy detail when navigating away from pharmacies
    if (tab !== 'pharmacies') setSelectedPharmacyId(null)
  }

  const handleViewPharmacy = (id) => {
    setSelectedPharmacyId(id)
    setActiveTab('pharmacies')
  }

  const breadcrumb = selectedPharmacyId && activeTab === 'pharmacies'
    ? 'Admin → Catalog → Pharmacies → Detail'
    : current.breadcrumb

  const title = selectedPharmacyId && activeTab === 'pharmacies'
    ? 'Pharmacy Detail'
    : current.title

  return (
    <div className={styles.dashLayout}>
      <Sidebar role="super_admin" activeTab={activeTab} onTabChange={handleTabChange} />

      <div className={styles.dashMain}>
        <DashHeader
          title={title}
          breadcrumb={breadcrumb}
          role="super_admin"
          userName={userName}
        />

        <div className={styles.dashContent}>
          {activeTab === 'overview'   && <AdminOverview onTabChange={handleTabChange} />}
          {activeTab === 'users'      && <UserManagement />}
          {activeTab === 'companies'  && <CompanyList />}
          {activeTab === 'pharmacies' && (
            selectedPharmacyId
              ? <AdminPharmacyDetail pharmacyId={selectedPharmacyId} onBack={() => setSelectedPharmacyId(null)} />
              : <PharmacyList onViewPharmacy={handleViewPharmacy} />
          )}
          {activeTab === 'products'   && <AdminProductCatalog />}
          {activeTab === 'orders'     && <OrdersOverview />}
          {activeTab === 'finance'         && <PlaceholderPage title="Finance" desc="Financial flows, settlements and arrears reports." icon="💰" />}
          {activeTab === 'system'          && <PlaceholderPage title="System" desc="System configuration, audit logs and health checks." icon="⚙️" />}
          {activeTab === 'deliveries'      && <AllDeliveries />}
          {activeTab === 'drivers'         && <DriversPage />}
          {activeTab === 'driver_ratings'  && <DriverRatings />}
        </div>
      </div>
    </div>
  )
}

function PlaceholderPage({ title, desc, icon }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '400px', gap: '1rem', color: '#94a3b8'
    }}>
      <span style={{ fontSize: '3rem' }}>{icon}</span>
      <h2 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>{title}</h2>
      <p style={{ margin: 0, maxWidth: 360, textAlign: 'center' }}>{desc}</p>
      <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', color: '#64748b' }}>
        Coming soon
      </span>
    </div>
  )
}

export default AdminDash
