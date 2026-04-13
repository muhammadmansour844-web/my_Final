import React from 'react'
import { FiBell, FiSearch } from 'react-icons/fi'
import styles from './Dashes.module.css'

const roleTitles = {
  super_admin: 'Super Admin',
  company_admin: 'Company Admin',
  pharmacy_admin: 'Pharmacy Admin'
}

function DashHeader({ title, breadcrumb, role, userName }) {
  const displayName = userName || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.headerTitle}>{title}</h1>
        {breadcrumb && <p className={styles.headerBreadcrumb}>{breadcrumb}</p>}
      </div>

      <div className={styles.headerRight}>
        {/* Search */}
        <div className={styles.headerSearch}>
          <FiSearch className={styles.headerSearchIcon} />
          <input
            type="text"
            className={styles.headerSearchInput}
            placeholder="Search..."
          />
        </div>

        {/* Notifications */}
        <div className={styles.headerNotif}>
          <FiBell />
          <span className={styles.headerNotifDot}></span>
        </div>

        {/* Avatar */}
        <div className={styles.headerAvatar}>
          <div className={styles.headerAvatarImg}>{initials}</div>
          <div>
            <p className={styles.headerAvatarName}>{displayName}</p>
            <p className={styles.headerAvatarRole}>{roleTitles[role] || role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default DashHeader
