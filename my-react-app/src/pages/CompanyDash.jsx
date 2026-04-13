import React, { useState } from 'react'
import Sidebar from '../components/Dashescomp/Sidebar'
import DashHeader from '../components/Dashescomp/DashHeader'
import ProductManager from '../components/Companycomp/ProductManager'
import CompanyOrders from '../components/Companycomp/CompanyOrders'
import CompanyStats from '../components/Companycomp/CompanyStats'
import styles from '../components/Dashescomp/Dashes.module.css'

const tabTitles = {
  products: { title: 'Product Management', breadcrumb: 'Company → My Products' },
  orders: { title: 'Incoming Orders', breadcrumb: 'Company → Orders' },
  stats: { title: 'Statistics', breadcrumb: 'Company → Stats' },
}

function CompanyDash() {
  const [activeTab, setActiveTab] = useState('products')
  const current = tabTitles[activeTab] || tabTitles.products

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
          {activeTab === 'stats' && <CompanyStats />}
          {activeTab === 'products' && <ProductManager />}
          {activeTab === 'orders' && <CompanyOrders />}
        </div>
      </div>
    </div>
  )
}

export default CompanyDash
