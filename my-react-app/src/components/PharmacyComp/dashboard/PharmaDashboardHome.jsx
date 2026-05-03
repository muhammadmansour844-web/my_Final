import { useEffect, useMemo, useRef, useState } from 'react'
import { FiShoppingCart, FiTruck, FiTag, FiDollarSign, FiChevronLeft, FiChevronRight, FiPlus, FiAlertTriangle } from 'react-icons/fi'
import shell from '../styles/PharmaDashboardShell.module.css'

const API_ORDERS   = 'http://localhost:3000/api/orders'
const API_PRODUCTS = 'http://localhost:3000/api/products'

function statusClass(status) {
  const m = { pending: shell.pbPend, approved: shell.pbAcc, shipped: shell.pbDeliv, delivered: shell.pbDone, rejected: shell.pbRej }
  return m[status] || shell.pbPend
}

function statusLabel(status) {
  const m = { pending: 'Pending', approved: 'Accepted', shipped: 'In Transit', delivered: 'Completed', rejected: 'Rejected' }
  return m[status] || status
}

function formatOrderId(id) { return `#PB-${String(id).padStart(4, '0')}` }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function PharmaDashboardHome({ onViewAllOrders, onCheckRestock, onOpenProducts, onPromoTab }) {
  const [orders, setOrders]     = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const trackRef = useRef(null)

  const token   = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const fullName = localStorage.getItem('user_name') || 'Pharmacist'
  const first    = fullName.split(/\s+/)[0]

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const [oRes, pRes] = await Promise.all([
          fetch(API_ORDERS,   { headers }),
          fetch(API_PRODUCTS, { headers }),
        ])
        if (!cancel) {
          if (oRes.ok) setOrders(await oRes.json())
          if (pRes.ok) setProducts(await pRes.json())
        }
      } catch { /* ignore */ } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => { cancel = true }
  }, [])

  const kpis = useMemo(() => {
    const active    = orders.filter(o => ['pending', 'approved', 'shipped'].includes(o.status)).length
    const need      = orders.filter(o => o.status === 'pending').length
    const inTransit = orders.filter(o => o.status === 'shipped').length
    const offers    = products.filter(p => p.discount_percentage > 0).length
    const spent     = orders
      .filter(o => o.status === 'delivered')
      .reduce((s, o) => s + Number(o.total_amount || 0), 0)
    return { active, need, inTransit, offers, spent }
  }, [orders, products])

  const recent = useMemo(() => [...orders].slice(0, 5), [orders])

  const lowStock = useMemo(() =>
    products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10),
    [products]
  )

  const orderStats = useMemo(() => {
    const total = orders.length || 1
    const delivered = orders.filter(o => o.status === 'delivered').length
    const rejected  = orders.filter(o => o.status === 'rejected').length
    return {
      deliveredPct: Math.round((delivered / total) * 100),
      rejectedPct:  Math.round((rejected  / total) * 100),
    }
  }, [orders])

  const scrollPromo = (dir) => { trackRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' }) }

  return (
    <>
      <div className={shell.pbIntro}>
        <p className={shell.pbStatus}>SYSTEM STATUS: OPERATIONAL</p>
        <h1 className={shell.pbWelcome}>{greeting()}, {first}</h1>
        <p className={shell.pbSub}>
          Your pharmacy hub is up to date. You have <strong>{kpis.need}</strong> pending order{kpis.need === 1 ? '' : 's'} that require attention
          {kpis.inTransit > 0 && <> and <strong>{kpis.inTransit}</strong> delivery update{kpis.inTransit === 1 ? '' : 's'}.</>}
          {kpis.need === 0 && kpis.inTransit === 0 && ' — all clear.'}
        </p>
      </div>

      <div className={shell.pbKpiGrid}>
        <div className={shell.pbKpi}>
          <div className={`${shell.pbKpiIcon} ${shell.pbKpiIconG}`}><FiShoppingCart /></div>
          <div>
            <p className={shell.pbKpiVal}>{kpis.active}</p>
            <p className={shell.pbKpiLab}>Active Orders</p>
            <p className={shell.pbKpiLab} style={{ marginTop: '0.25rem', fontSize: '0.76rem' }}>{kpis.need} requiring attention</p>
          </div>
        </div>
        <div className={shell.pbKpi}>
          <div className={`${shell.pbKpiIcon} ${shell.pbKpiIconB}`}><FiTruck /></div>
          <div>
            <p className={shell.pbKpiVal}>{kpis.inTransit}</p>
            <p className={shell.pbKpiLab}>In Transit</p>
            <p className={shell.pbKpiLab} style={{ marginTop: '0.25rem', fontSize: '0.76rem' }}>Orders being shipped</p>
          </div>
        </div>
        <div className={shell.pbKpi}>
          <div className={`${shell.pbKpiIcon} ${shell.pbKpiIconO}`}><FiTag /></div>
          <div>
            <p className={shell.pbKpiVal}>{kpis.offers}</p>
            <p className={shell.pbKpiLab}>Active Offers</p>
            <p className={shell.pbKpiLab} style={{ marginTop: '0.25rem', fontSize: '0.76rem' }}>Products with discounts</p>
            {kpis.offers > 0 && <span className={`${shell.pbKpiTag} ${shell.pbTagOrange}`}>New</span>}
          </div>
        </div>
        <div className={shell.pbKpi}>
          <div className={`${shell.pbKpiIcon} ${shell.pbKpiIconT}`}><FiDollarSign /></div>
          <div>
            <p className={shell.pbKpiVal}>
              ${kpis.spent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className={shell.pbKpiLab}>Total Spent</p>
            <p className={shell.pbKpiLab} style={{ marginTop: '0.25rem', fontSize: '0.76rem' }}>From completed orders</p>
            <span className={`${shell.pbKpiTag} ${shell.pbTagGray}`}>All Time</span>
          </div>
        </div>
      </div>

      <div className={shell.pbHomeGrid}>
        <div className={shell.pbTableCard}>
          <div className={shell.pbTableHead}>
            <h2 className={shell.pbTableTitle}>Recent Orders</h2>
            <button type="button" className={shell.pbViewAll} onClick={onViewAllOrders}>VIEW ALL</button>
          </div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--pb-muted)' }}>Loading…</div>
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
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(row => (
                  <tr key={row.id}>
                    <td>{formatOrderId(row.id)}</td>
                    <td>{row.company_name || `Company #${row.company_id}`}</td>
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
          {lowStock.length > 0 ? (
            <div className={shell.pbAlert}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FiAlertTriangle size={16} />
                <strong style={{ fontSize: '0.85rem' }}>Low Stock Alert</strong>
              </div>
              <p className={shell.pbAlertTxt}>
                {lowStock.length} product{lowStock.length > 1 ? 's are' : ' is'} running low:&nbsp;
                {lowStock.slice(0, 2).map(p => p.name).join(', ')}
                {lowStock.length > 2 ? ` +${lowStock.length - 2} more` : ''}
              </p>
              <button type="button" className={shell.pbRestock} onClick={onCheckRestock}>
                CHECK RESTOCK
              </button>
            </div>
          ) : !loading && (
            <div className={shell.pbAlert} style={{ background: 'var(--pb-mint-faint)' }}>
              <p className={shell.pbAlertTxt} style={{ color: 'var(--pb-green)' }}>
                All products are well-stocked.
              </p>
            </div>
          )}

          {orders.length > 0 && (
            <div className={shell.pbInsightCard}>
              <h3 className={shell.pbInsightTitle}>Order Breakdown</h3>
              <div className={shell.pbBarRow}>
                <div className={shell.pbBarLab}>
                  <span>Completed</span>
                  <span>{orderStats.deliveredPct}%</span>
                </div>
                <div className={shell.pbBarTrack}>
                  <div className={shell.pbBarFill} style={{ width: `${orderStats.deliveredPct}%` }} />
                </div>
              </div>
              <div className={shell.pbBarRow}>
                <div className={shell.pbBarLab}>
                  <span>Rejected</span>
                  <span>{orderStats.rejectedPct}%</span>
                </div>
                <div className={shell.pbBarTrack}>
                  <div className={shell.pbBarFill} style={{ width: `${orderStats.rejectedPct}%`, background: '#ef4444' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {kpis.offers > 0 && (
        <div className={shell.pbPromoSection}>
          <div className={shell.pbPromoHead}>
            <h2 className={shell.pbPromoTitle}>Products on Offer</h2>
            <div className={shell.pbPromoArrows}>
              <button type="button" className={shell.pbArrow} aria-label="Previous" onClick={() => scrollPromo(-1)}><FiChevronLeft /></button>
              <button type="button" className={shell.pbArrow} aria-label="Next" onClick={() => scrollPromo(1)}><FiChevronRight /></button>
            </div>
          </div>
          <div className={shell.pbPromoTrack} ref={trackRef}>
            {products.filter(p => p.discount_percentage > 0).slice(0, 6).map(p => (
              <div key={p.id} className={shell.pbPromoCard}>
                <div className={shell.pbPromoImg} aria-hidden>💊</div>
                <div className={shell.pbPromoBody}>
                  <span className={`${shell.pbDealTag} ${shell.pbTagDeal}`}>−{parseFloat(p.discount_percentage).toFixed(0)}% OFF</span>
                  <h3 className={shell.pbPromoName}>{p.name}</h3>
                  <button type="button" className={shell.pbPromoLink} onClick={() => onPromoTab?.('products')}>View Deal</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="button" className={shell.pbFab} aria-label="Browse products" onClick={onOpenProducts}>
        <FiPlus size={26} strokeWidth={2.5} />
      </button>
    </>
  )
}

export default PharmaDashboardHome
