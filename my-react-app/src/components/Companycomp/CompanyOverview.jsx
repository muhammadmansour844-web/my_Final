import React from 'react'
import { FiZap, FiPackage, FiAlertTriangle, FiDollarSign, FiPlus, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import styles from './Company.module.css'

function CompanyOverview({ onAddProduct }) {
  const incomingOrders = [
    { client: "St. Jude Medical Center", dept: "Oncology Ward - Dept 4", id: "#PB-9921-A", priority: "STAT", priorityClass: styles.badgeStat },
    { client: "BioLab Therapeutics", dept: "R&D Lab 12", id: "#PB-8840-X", priority: "STANDARD", priorityClass: styles.badgeStandard },
    { client: "City General Pharmacy", dept: "Retail Fulfillment", id: "#PB-7212-B", priority: "BULK", priorityClass: styles.badgeBulk },
    { client: "North Star Hospice", dept: "Palliative Care", id: "#PB-1055-C", priority: "STAT", priorityClass: styles.badgeStat }
  ]

  const criticalItems = [
    { name: "Amoxicillin Trihydrate 500mg", left: "3 UNITS LEFT", action: "AUTO-REORDER", eta: "48h" },
    { name: "Ciprofloxacin 250mg", left: "12 UNITS LEFT", action: "MANUAL ORDER", eta: "72h" },
    { name: "Insulin Glargine 100u", left: "28 UNITS LEFT", action: "REQUEST BATCH", actionSub: "Cold Storage priority" }
  ]

  return (
    <div className={styles.overviewContainer}>
      <div className={styles.overviewHeader}>
        <h1 className={styles.overviewTitle}>Operational Insight</h1>
        <p className={styles.overviewSubtitle}>Managing curated inventory and incoming clinical requests.</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>NEW ORDERS TODAY</span>
            <FiZap className={styles.statIconGreen} />
          </div>
          <div className={styles.statValue}>142</div>
          <div className={styles.statChange}>↗ +12% from yesterday</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>TOTAL PRODUCTS</span>
            <FiPackage className={styles.statIconGreen} />
          </div>
          <div className={styles.statValue}>1,840</div>
          <div className={styles.statChangeInfo}>Active catalog</div>
        </div>

        <div className={styles.statCardDarkRed}>
          <div className={styles.statTop}>
            <span className={styles.statLabelWhite}>LOW STOCK ALERTS</span>
            <FiAlertTriangle className={styles.statIconWhite} />
          </div>
          <div className={styles.statValueWhite}>24</div>
          <div className={styles.statChangeWhite}>Critical replenishment needed</div>
        </div>

        <div className={styles.statCardDarkGreen}>
          <div className={styles.statTop}>
            <span className={styles.statLabelWhite}>MONTHLY REVENUE</span>
            <FiDollarSign className={styles.statIconWhite} />
          </div>
          <div className={styles.statValueWhite}>$42.8k</div>
          <div className={styles.statChangeWhite}>MTD Performance</div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <button className={styles.addBtn} onClick={onAddProduct}>
            <FiPlus /> ADD NEW PRODUCT
          </button>

          <div className={styles.tableCard}>
            <div className={styles.tableHeaderRow}>
              <h2 className={styles.tableTitle}>Incoming Orders</h2>
              <a href="#view-all" className={styles.viewHistory}>VIEW ALL HISTORY</a>
            </div>

            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>CLIENT / INSTITUTION</th>
                  <th>ORDER ID</th>
                  <th>PRIORITY</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {incomingOrders.map((ord, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className={styles.clientCell}>
                        <div className={styles.clientAvatar}>
                          <FiPackage />
                        </div>
                        <div>
                          <div className={styles.clientName}>{ord.client}</div>
                          <div className={styles.clientDept}>{ord.dept}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.orderIdText}>{ord.id}</td>
                    <td>
                      <span className={`${styles.priorityBadge} ${ord.priorityClass}`}>{ord.priority}</span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <FiCheckCircle className={styles.actionAccept} />
                        <FiXCircle className={styles.actionReject} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.criticalCard}>
            <h3 className={styles.criticalTitle}>
              <span className={styles.exclamationRed}>!</span> Critical Replenishment
            </h3>
            <div className={styles.criticalList}>
              {criticalItems.map((item, idx) => (
                <div key={idx} className={styles.criticalItem}>
                  <div className={styles.critTop}>
                    <div className={styles.critName}>{item.name}</div>
                    <div className={styles.critBadge}>{item.left}</div>
                  </div>
                  <div className={styles.critBar}></div>
                  <div className={styles.critBottom}>
                    <div className={styles.critActionBtn}>{item.action}</div>
                    {item.eta ? (
                      <div className={styles.critEta}>Refill ETA: {item.eta}</div>
                    ) : (
                      <div className={styles.critEta}>{item.actionSub}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.restockBtn}>
              ⟳ RESTOCK DASHBOARD
            </button>
          </div>

          <div className={styles.marketPulse}>
            <div className={styles.pulseLabel}>MARKET PULSE</div>
            <div className={styles.pulseDesc}>Vaccine supply stabilizing in Q4. Plan orders.</div>
            <div className={styles.pulseLink}>Read full report ›</div>
            <button className={styles.pulseFloatBtn}><FiPlus /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyOverview
