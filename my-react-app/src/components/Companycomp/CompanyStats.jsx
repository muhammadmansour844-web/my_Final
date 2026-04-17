import React, { useState, useEffect } from 'react'
import StatsCard from '../Dashescomp/StatsCard'
import styles from '../Dashescomp/Dashes.module.css'

function CompanyStats() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])

  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, ordRes] = await Promise.all([
          fetch('http://localhost:3000/api/products', { headers }),
          fetch('http://localhost:3000/api/orders', { headers })
        ])
        if (prodRes.ok) setProducts(await prodRes.json())
        if (ordRes.ok) setOrders(await ordRes.json())
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }
    fetchData()
  }, [])

  const totalProducts = products.length
  const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0)
  const lowStock = products.filter(p => p.stock_quantity < 20).length
  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length

  return (
    <div>
      <div className={styles.statsGrid}>
        <StatsCard title="Total Products" value={totalProducts} icon="💊" color="blue" />
        <StatsCard title="Total Stock" value={totalStock.toLocaleString()} icon="📦" color="green" />
        <StatsCard title="Low Stock Items" value={lowStock} icon="⚠️" color="amber" />
        <StatsCard title="Total Orders" value={totalOrders} icon="📋" color="purple" />
        <StatsCard title="Pending Orders" value={pendingOrders} icon="⏳" color="pink" />
        <StatsCard title="Delivered Orders" value={deliveredOrders} icon="✅" color="teal" />
      </div>
    </div>
  )
}

export default CompanyStats
