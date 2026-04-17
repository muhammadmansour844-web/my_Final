import React from 'react'
import styles from './Dashes.module.css'

const colorMap = {
  green:  { icon: styles.statsIconGreen,  card: styles.statsCardGreen },
  blue:   { icon: styles.statsIconBlue,   card: styles.statsCardBlue },
  amber:  { icon: styles.statsIconAmber,  card: styles.statsCardAmber },
  pink:   { icon: styles.statsIconPink,   card: styles.statsCardPink },
  purple: { icon: styles.statsIconPurple, card: styles.statsCardPurple },
  teal:   { icon: styles.statsIconTeal,   card: styles.statsCardTeal },
}

function StatsCard({ title, value, icon, color = 'green', trend }) {
  const colors = colorMap[color] || colorMap.green

  return (
    <div className={`${styles.statsCard} ${colors.card}`}>
      <div className={`${styles.statsIcon} ${colors.icon}`}>
        {icon}
      </div>
      <div className={styles.statsInfo}>
        <p className={styles.statsValue}>{value}</p>
        <p className={styles.statsLabel}>{title}</p>
        {trend && (
          <span className={`${styles.statsTrend} ${trend > 0 ? styles.statsTrendUp : styles.statsTrendDown}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}

export default StatsCard
