import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiShoppingCart,
  FiTruck,
  FiTag,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
} from 'react-icons/fi'
import shell from '../styles/PharmaDashboardShell.module.css'

const API = 'http://localhost:3000/api/orders'

function statusClass(status) {
  const m = {
    pending: shell.pbPend,
    approved: shell.pbAcc,
    shipped: shell.pbDeliv,
    delivered: shell.pbDone,
    rejected: shell.pbRej,
  }
  return m[status] || shell.pbPend
}

function statusLabel(status) {
  const m = {
    pending: 'Pending',
    approved: 'Accepted',
    shipped: 'Delivered',
    delivered: 'Completed',
    rejected: 'Rejected',
  }
  return m[status] || status
}

function formatOrderId(id) {
  return `#PB-${String(id).padStart(4, '0')}`
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function PharmaDashboardHome({ onViewAllOrders, onCheckRestock, onOpenProducts, onPromoTab }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const trackRef = useRef(null)

  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const fullName = localStorage.getItem('user_name') || 'Dr. Aris'
  const first = fullName.split(/\s+/)[0]

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const res = await fetch(API, { headers })
        if (res.ok && !cancel) setOrders(await res.json())
      } catch {
        /* ignore */
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [])

  const kpis = useMemo(() => {
    const active = orders.filter((o) =>
      ['pending', 'approved', 'shipped'].includes(o.status)
    ).length
    const need = orders.filter((o) => o.status === 'pending').length
    const inTransit = orders.filter((o) => o.status === 'shipped').length
    const spent = orders
      .filter((o) => o.status === 'delivered')
      .reduce((s, o) => s + Number(o.total_amount || 0), 0)
    return { active, need, inTransit, spent }
  }, [orders])

  const recent = useMemo(() => orders.slice(0, 5), [orders])

  const scrollPromo = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  return (
    <>
      <div className={shell.pbIntro}>
        <p className={shell.pbStatus}>SYSTEM STATUS: OPERATIONAL</p>
        <h1 className={shell.pbWelcome}>
          {greeting()}, {first}
        </h1>
        <p className={shell.pbSub}>
          Your pharmacy hub is up to date. You have <strong>{kpis.need}</strong> pending order
          {kpis.need === 1 ? '' : 's'} that require attention
          {kpis.inTransit > 0 && (
            <>
              {' '}
              and <strong>{kpis.inTransit}</strong> delivery update
              {kpis.inTransit === 1 ? '' : 's'}.
            </>
          )}
          {kpis.need === 0 && kpis.inTransit === 0 && ' — all clear.'}
        </p>
      </div>

      <div className={shell.pbKpiGrid}>
        <div className={shell.pbKpi}>
          <div className={`${shell.pbKpiIcon} ${shell.pbKpiIconG}`}>
            <FiShoppingCart />
          </div>
          <div>
            <p className={shell.pbKpiVal}>{kpis.active}</p>
            <p className={shell.pbKpiLab}>Active Orders</p>
            <p className={shell.pbKpiLab} style={{ marginTop: '0.25rem', fontSize: '0.76rem' }}>
              {kpis.need} requiring attention
            </p>
            <span className={`${shell.pbKpiTag} ${shell.pbTagMint}`}>+12%</span>
          </div>
        </div>
        <div className={shell.pbKpi}>
          <div className={`${shell.pbKpiIcon} ${shell.pbKpiIconB}`}>
            <FiTruck />
          </div>
          <div>
            <p className={shell.pbKpiVal}>{kpis.inTransit}</p>
            <p className={shell.pbKpiLab}>Pending Deliveries</p>
            <p className={shell.pbKpiLab} style={{ marginTop: '0.25rem', fontSize: '0.76rem' }}>
              Next arrival in 45 mins
            </p>
            <span className={`${shell.pbKpiTag} ${shell.pbTagBlue}`}>On Time</span>
          </div>
        </div>
        <div className={shell.pbKpi}>
          <div className={`${shell.pbKpiIcon} ${shell.pbKpiIconO}`}>
            <FiTag />
          </div>
          <div>
            <p className={shell.pbKpiVal}>08</p>
            <p className={shell.pbKpiLab}>Available Offers</p>
            <p className={shell.pbKpiLab} style={{ marginTop: '0.25rem', fontSize: '0.76rem' }}>
              Flash deals expiring soon
            </p>
            <span className={`${shell.pbKpiTag} ${shell.pbTagOrange}`}>New</span>
          </div>
        </div>
        <div className={shell.pbKpi}>
          <div className={`${shell.pbKpiIcon} ${shell.pbKpiIconT}`}>
            <FiDollarSign />
          </div>
          <div>
            <p className={shell.pbKpiVal}>
              $
              {kpis.spent.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
            <p className={shell.pbKpiLab}>Total Spent</p>
            <p className={shell.pbKpiLab} style={{ marginTop: '0.25rem', fontSize: '0.76rem' }}>
              −$1,200 from last month
            </p>
            <span className={`${shell.pbKpiTag} ${shell.pbTagGray}`}>Monthly</span>
          </div>
        </div>
      </div>

      <div className={shell.pbHomeGrid}>
        <div className={shell.pbTableCard}>
          <div className={shell.pbTableHead}>
            <h2 className={shell.pbTableTitle}>Recent Orders</h2>
            <button type="button" className={shell.pbViewAll} onClick={onViewAllOrders}>
              VIEW ALL
            </button>
          </div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--pb-muted)' }}>
              Loading…
            </div>
          ) : recent.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--pb-muted)' }}>
              No orders yet. Browse products to place your first order.
            </div>
          ) : (
            <table className={shell.pbTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id}>
                    <td>{formatOrderId(row.id)}</td>
                    <td>{row.company_name || `Company #${row.company_id}`}</td>
                    <td>{row.category_sample || '—'}</td>
                    <td>${Number(row.total_amount || 0).toFixed(2)}</td>
                    <td>
                      <span className={`${shell.pbPill} ${statusClass(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={shell.pbWidgets}>
          <div className={shell.pbAlert}>
            <p className={shell.pbAlertTxt}>
              Insulin stock is critical. Restock recommended within 24 hours.
            </p>
            <button type="button" className={shell.pbRestock} onClick={onCheckRestock}>
              CHECK RESTOCK
            </button>
          </div>
          <div className={shell.pbInsightCard}>
            <h3 className={shell.pbInsightTitle}>Quick Insights</h3>
            <div className={shell.pbBarRow}>
              <div className={shell.pbBarLab}>
                <span>Generic vs Brand</span>
                <span>65%</span>
              </div>
              <div className={shell.pbBarTrack}>
                <div className={shell.pbBarFill} style={{ width: '65%' }} />
              </div>
            </div>
            <div className={shell.pbBarRow}>
              <div className={shell.pbBarLab}>
                <span>Biotech Orders</span>
                <span>30%</span>
              </div>
              <div className={shell.pbBarTrack}>
                <div className={shell.pbBarFill} style={{ width: '30%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={shell.pbPromoSection}>
        <div className={shell.pbPromoHead}>
          <h2 className={shell.pbPromoTitle}>Exclusive Partner Promotions</h2>
          <div className={shell.pbPromoArrows}>
            <button
              type="button"
              className={shell.pbArrow}
              aria-label="Previous"
              onClick={() => scrollPromo(-1)}
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              className={shell.pbArrow}
              aria-label="Next"
              onClick={() => scrollPromo(1)}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
        <div className={shell.pbPromoTrack} ref={trackRef}>
          <div className={shell.pbPromoCard}>
            <div className={shell.pbPromoImg} aria-hidden>
              💊
            </div>
            <div className={shell.pbPromoBody}>
              <span className={`${shell.pbDealTag} ${shell.pbTagDeal}`}>−25% OFF</span>
              <h3 className={shell.pbPromoName}>Seasonal Antibiotics Pack</h3>
              <button type="button" className={shell.pbPromoLink} onClick={() => onPromoTab?.('promotions')}>
                View Deal
              </button>
            </div>
          </div>
          <div className={shell.pbPromoCard}>
            <div className={shell.pbPromoImg} aria-hidden>
              💉
            </div>
            <div className={shell.pbPromoBody}>
              <span className={`${shell.pbDealTag} ${shell.pbTagLim}`}>LIMITED</span>
              <h3 className={shell.pbPromoName}>New Vaccine Batch</h3>
              <button type="button" className={shell.pbPromoLink} onClick={() => onPromoTab?.('promotions')}>
                Pre-order
              </button>
            </div>
          </div>
          <div className={shell.pbPromoCard}>
            <div className={shell.pbPromoImg} aria-hidden>
              🩺
            </div>
            <div className={shell.pbPromoBody}>
              <span className={`${shell.pbDealTag} ${shell.pbTagBundle}`}>BUNDLED</span>
              <h3 className={shell.pbPromoName}>Clinical Hardware</h3>
              <button type="button" className={shell.pbPromoLink} onClick={() => onPromoTab?.('promotions')}>
                View Offer
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={shell.pbFab}
        aria-label="Quick add — browse products"
        onClick={onOpenProducts}
      >
        <FiPlus size={26} strokeWidth={2.5} />
      </button>
    </>
  )
}

export default PharmaDashboardHome
