import React from 'react'
import { FiBell, FiSearch, FiMenu } from 'react-icons/fi'
import shell from '../styles/PharmaDashboardShell.module.css'

function PharmaBridgeHeader({
  onMenuClick,
  pharmacyName,
  userName,
  userRole = 'LEAD PHARMACIST',
  searchPlaceholder = 'Search orders, medical products, or suppliers...',
}) {
  const display = userName || 'Pharmacist'
  const initials = display
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const org = pharmacyName || 'St. Jude Pharmacy'

  return (
    <header className={shell.pbHeader}>
      <button type="button" className={shell.pbMenuBtn} aria-label="Menu" onClick={onMenuClick}>
        <FiMenu size={22} />
      </button>

      <div className={shell.pbSearchWrap}>
        <FiSearch className={shell.pbSearchIcon} aria-hidden />
        <input
          type="search"
          className={shell.pbSearchIn}
          placeholder={searchPlaceholder}
          aria-label="Search"
        />
      </div>

      <div className={shell.pbHeaderTools}>
        <button type="button" className={shell.pbBell} aria-label="Notifications">
          <FiBell size={20} />
          <span className={shell.pbBellDot} aria-hidden />
        </button>
        <div className={shell.pbUserBlock}>
          <div className={shell.pbAvatar}>{initials}</div>
          <div>
            <p className={shell.pbUserPharmacy}>
              {org}{' '}
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>|</span>{' '}
              <span style={{ color: '#64748b', fontWeight: 700 }}>{userRole}</span>
            </p>
            <p className={shell.pbUserRole}>{display}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default PharmaBridgeHeader
