import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Dashescomp/Sidebar'
import DashHeader from '../components/Dashescomp/DashHeader'
import StatsCard from '../components/Dashescomp/StatsCard'
import UserManagement from '../components/AdminComp/UserManagement'
import CompanyList from '../components/AdminComp/CompanyList'
import PharmacyList from '../components/AdminComp/PharmacyList'
import OrdersOverview from '../components/AdminComp/OrdersOverview'
import styles from '../components/Dashescomp/Dashes.module.css'

const tabTitles = {
  users: { title: 'User Management', breadcrumb: 'Admin → Users' },
  companies: { title: 'Company Management', breadcrumb: 'Admin → Companies' },
  pharmacies: { title: 'Pharmacy Management', breadcrumb: 'Admin → Pharmacies' },
  orders: { title: 'Orders Overview', breadcrumb: 'Admin → Orders' },
}

function AdminDash() {
  const [activeTab, setActiveTab] = useState('users')
  const [stats, setStats] = useState({ users: 0, companies: 0, pharmacies: 0, orders: 0 })

  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, companiesRes, pharmaciesRes, ordersRes] = await Promise.all([
          fetch('http://localhost:3000/api/users', { headers }),
          fetch('http://localhost:3000/api/companies', { headers }),
          fetch('http://localhost:3000/api/pharmacies', { headers }),
          fetch('http://localhost:3000/api/orders', { headers }),
        ])
        const users = usersRes.ok ? await usersRes.json() : []
        const companies = companiesRes.ok ? await companiesRes.json() : []
        const pharmacies = pharmaciesRes.ok ? await pharmaciesRes.json() : []
        const orders = ordersRes.ok ? await ordersRes.json() : []
        setStats({
          users: users.length,
          companies: companies.length,
          pharmacies: pharmacies.length,
          orders: orders.length
        })
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }
    fetchStats()
  }, [activeTab])

  const current = tabTitles[activeTab] || tabTitles.users

  return (
    <div className={styles.dashLayout}>
      <Sidebar role="super_admin" activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={styles.dashMain}>
        <DashHeader
          title={current.title}
          breadcrumb={current.breadcrumb}
          role="super_admin"
          userName="Admin"
        />

        <div className={styles.dashContent}>
          {/* Stats Row */}
          <div className={styles.statsGrid}>
            <StatsCard title="Total Users" value={stats.users} icon="👥" color="blue" />
            <StatsCard title="Companies" value={stats.companies} icon="🏢" color="purple" />
            <StatsCard title="Pharmacies" value={stats.pharmacies} icon="💊" color="green" />
            <StatsCard title="Orders" value={stats.orders} icon="📦" color="amber" />
          </div>

          {/* Active Tab Content */}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'companies' && <CompanyList />}
          {activeTab === 'pharmacies' && <PharmacyList />}
          {activeTab === 'orders' && <OrdersOverview />}
        </div>
      </div>
    </div>
  )
}

export default AdminDash
