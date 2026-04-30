import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Dashescomp/Sidebar'
import DashHeader from '../components/Dashescomp/DashHeader'
import ProductManager from '../components/Companycomp/ProductManager'
import CompanyOrders from '../components/Companycomp/CompanyOrders'
import CompanyOverview from '../components/Companycomp/CompanyOverview'
import styles from '../components/Dashescomp/Dashes.module.css'

const tabTitles = {
  dashboard: { title: 'Dashboard', breadcrumb: 'Company → Dashboard' },
  products: { title: 'Product Management', breadcrumb: 'Company → Products' },
  my_products: { title: 'My Products', breadcrumb: 'Company → My Products' },
  incoming_orders: { title: 'Incoming Orders', breadcrumb: 'Company → Incoming Orders' },
  reports: { title: 'Reports', breadcrumb: 'Company → Reports' },
  settings: { title: 'Settings', breadcrumb: 'Company → Settings' },
}

function CompanyDash() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('incoming_orders')
  const current = tabTitles[activeTab] || tabTitles.dashboard
  const userName = localStorage.getItem('user_name') || 'Company'
  const accountType = localStorage.getItem('account_type')

  useEffect(() => {
    if (!accountType) {
      navigate('/login')
    } else if (accountType === 'pharmacy_admin') {
      navigate('/pharmacy-dashboard')
    } else if (accountType === 'super_admin') {
      navigate('/admin')
    }
  }, [accountType, navigate])

  if (accountType !== 'company_admin') {
    return null
  }

  return (
    <div className={styles.dashLayout}>
      <Sidebar role="company_admin" activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={styles.dashMain}>
        <DashHeader
          title={current.title}
          breadcrumb={current.breadcrumb}
          role="company_admin"
          userName={userName}
        />

        <div className={styles.dashContent}>
          {activeTab === 'dashboard' && <CompanyOverview 
            onAddProduct={() => setActiveTab('my_products')} 
            onViewOrders={() => setActiveTab('incoming_orders')} 
          />}
          {(activeTab === 'products' || activeTab === 'my_products') && <ProductManager />}
          {(activeTab === 'orders' || activeTab === 'incoming_orders') && <CompanyOrders />}
          {['reports', 'settings'].includes(activeTab) && (
            <div style={{ textAlign: 'center', marginTop: '5rem', color: '#8b9d94' }}>
              <h2>Coming Soon</h2>
              <p>This module is under development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompanyDash
