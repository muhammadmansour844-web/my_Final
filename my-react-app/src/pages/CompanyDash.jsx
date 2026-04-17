import React, { useState } from 'react'
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
  my_orders: { title: 'My Orders', breadcrumb: 'Company → My Orders' },
  incoming_orders: { title: 'Incoming Orders', breadcrumb: 'Company → Incoming Orders' },
  promotions: { title: 'Promotions', breadcrumb: 'Company → Promotions' },
  reports: { title: 'Reports', breadcrumb: 'Company → Reports' },
  settings: { title: 'Settings', breadcrumb: 'Company → Settings' },
}

function CompanyDash() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const current = tabTitles[activeTab] || tabTitles.dashboard

  return (
    <div className={styles.dashLayout}>
      <Sidebar role="company_admin" activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={styles.dashMain}>
        <DashHeader
          title={current.title}
          breadcrumb={current.breadcrumb}
          role="company_admin"
          userName="Company"
        />

        <div className={styles.dashContent}>
          {activeTab === 'dashboard' && <CompanyOverview onAddProduct={() => setActiveTab('my_products')} />}
          {(activeTab === 'products' || activeTab === 'my_products') && <ProductManager />}
          {(activeTab === 'orders' || activeTab === 'incoming_orders' || activeTab === 'my_orders') && <CompanyOrders />}
          {['promotions', 'reports', 'settings'].includes(activeTab) && (
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
