import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLogOut } from 'react-icons/fi'
import styles from './Dashes.module.css'

// Sidebar configuration per role
const sidebarConfig = {
  super_admin: {
    title: 'Admin Panel',
    subtitle: 'System Control',
    icon: '🛡️',
    sections: [
      {
        label: 'Management',
        links: [
          { id: 'users', label: 'Users', icon: '👥' },
          { id: 'companies', label: 'Companies', icon: '🏢' },
          { id: 'pharmacies', label: 'Pharmacies', icon: '💊' },
        ]
      },
      {
        label: 'Monitoring',
        links: [
          { id: 'orders', label: 'All Orders', icon: '📦' },
        ]
      }
    ]
  },
  company_admin: {
    title: 'PharmaBridge',
    subtitle: 'CLINICAL CURATOR',
    icon: '🏢',
    sections: [
      {
        label: 'Main',
        links: [
          { id: 'dashboard', label: 'Dashboard', icon: '🎛️' },
          { id: 'products', label: 'Products', icon: '📦' },
          { id: 'my_orders', label: 'My Orders', icon: '🛒' },
          { id: 'incoming_orders', label: 'Incoming Orders', icon: '📥' },
          { id: 'my_products', label: 'My Products', icon: '💊' },
          { id: 'promotions', label: 'Promotions', icon: '📢' },
          { id: 'reports', label: 'Reports', icon: '📊' },
          { id: 'settings', label: 'Settings', icon: '⚙️' },
        ]
      }
    ]
  },
  pharmacy_admin: {
    title: 'Pharmacy',
    subtitle: 'Order & Browse',
    icon: '🏥',
    sections: [
      {
        label: 'Shopping',
        links: [
          { id: 'catalog', label: 'Drug Catalog', icon: '💊' },
          { id: 'cart', label: 'My Cart', icon: '🛒' },
        ]
      },
      {
        label: 'Orders',
        links: [
          { id: 'orders', label: 'My Orders', icon: '📦' },
        ]
      }
    ]
  }
}

function Sidebar({ role, activeTab, onTabChange }) {
  const navigate = useNavigate()
  const config = sidebarConfig[role] || sidebarConfig.super_admin

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('account_type')
    navigate('/login')
  }

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.sidebarBrand}>
        <div className={styles.sidebarLogo}>{config.icon}</div>
        <div>
          <h2 className={styles.sidebarTitle}>{config.title}</h2>
          <p className={styles.sidebarSubtitle}>{config.subtitle}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.sidebarNav}>
        {config.sections.map((section, sIdx) => (
          <React.Fragment key={sIdx}>
            <p className={styles.sidebarLabel}>{section.label}</p>
            {section.links.map(link => (
              <div
                key={link.id}
                className={`${styles.sidebarLink} ${activeTab === link.id ? styles.sidebarLinkActive : ''}`}
                onClick={() => onTabChange(link.id)}
              >
                <span className={styles.sidebarLinkIcon}>{link.icon}</span>
                {link.label}
              </div>
            ))}
          </React.Fragment>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <button className={styles.sidebarLogout} onClick={handleLogout}>
          <FiLogOut />
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
