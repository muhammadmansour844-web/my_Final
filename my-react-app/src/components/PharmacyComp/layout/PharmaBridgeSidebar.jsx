import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiLayers,
  FiTag,
  FiBarChart2,
  FiSettings,
  FiShoppingCart,
  FiUser,
  FiLogOut,
  FiPlusSquare,
} from 'react-icons/fi'
import shell from '../styles/PharmaDashboardShell.module.css'

const NAV = [
  { id: 'products', label: 'Products', Icon: FiPackage },
  { id: 'cart', label: 'Cart', Icon: FiShoppingCart },
  { id: 'my_orders', label: 'My Orders', Icon: FiShoppingBag },
  { id: 'promotions', label: 'Promotions', Icon: FiTag },
  { id: 'reports', label: 'Reports', Icon: FiBarChart2 },
  { id: 'dashboard', label: 'Dashboard', Icon: FiGrid },
  { id: 'settings', label: 'Settings', Icon: FiSettings },
]

function PharmaBridgeSidebar({ activeTab, onTabChange, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate()

  const go = (id) => {
    onTabChange(id)
    onCloseMobile?.()
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <aside className={`${shell.pbSidebar} ${mobileOpen ? shell.pbSidebarOpen : ''}`}>
      <div className={shell.pbSidebarBrand}>
        <div className={shell.pbLogoMark} aria-hidden>
          <FiPlusSquare size={22} strokeWidth={2.2} />
        </div>
        <div>
          <h1 className={shell.pbBrandTitle}>PharmaBridge</h1>
          <p className={shell.pbBrandSub}>CLINICAL CURATOR</p>
        </div>
      </div>

      <nav className={shell.pbNav} aria-label="Main">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`${shell.pbNavBtn} ${activeTab === id ? shell.pbNavBtnActive : ''}`}
            onClick={() => go(id)}
          >
            <span className={shell.pbNavIcon}>
              <Icon strokeWidth={2} />
            </span>
            {label}
          </button>
        ))}
      </nav>

      <div className={shell.pbSidebarFoot}>
        <button type="button" className={shell.pbFootBtn} onClick={() => go('settings')}>
          <span className={shell.pbNavIcon}>
            <FiUser strokeWidth={2} />
          </span>
          User Profile
        </button>
        <button type="button" className={shell.pbLogout} onClick={logout}>
          <FiLogOut />
          Logout
        </button>
      </div>
    </aside>
  )
}

export default PharmaBridgeSidebar
