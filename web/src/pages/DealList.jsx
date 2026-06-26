import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDeals, getStates } from '../api/client.js'
import FilterSidebar from '../components/FilterSidebar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Spinner from '../components/Spinner.jsx'
import styles from './DealList.module.css'

const EMPTY_FILTERS = {
  format: '',
  status: '',
  dealType: '',
  state: '',
  floorMin: '',
  floorMax: '',
}

function fmt(n, digits = 2) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export default function DealList() {
  const navigate = useNavigate()
  const [deals, setDeals] = useState([])
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [debouncedQ, setDebouncedQ] = useState('')

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  // load states once
  useEffect(() => {
    getStates().then(setStates).catch(() => {})
  }, [])

  // fetch deals whenever filters or search changes
  const fetchDeals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDeals({ q: debouncedQ, ...filters })
      setDeals(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, filters])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <h1 className={styles.heading}>Deals</h1>
          {!loading && <span className={styles.count}>{deals.length} deal{deals.length !== 1 ? 's' : ''}</span>}
        </div>
        <div className={styles.topBarRight}>
          <input
            className={styles.search}
            type="search"
            placeholder="Search by name or buyer..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button
            className={styles.addBtn}
            onClick={() => navigate('/deals/new')}
          >
            + Add deal
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <FilterSidebar filters={filters} onChange={setFilters} states={states} />

        <div className={styles.tableWrapper}>
          {loading && <Spinner />}
          {error && <p className={styles.error}>Error: {error}</p>}
          {!loading && !error && deals.length === 0 && (
            <div className={styles.empty}>
              <p>No deals match your filters.</p>
            </div>
          )}
          {!loading && !error && deals.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Buyer</th>
                  <th>Format</th>
                  <th>Deal type</th>
                  <th>Floor CPM</th>
                  <th>Status</th>
                  <th>Target states</th>
                  <th>Start</th>
                </tr>
              </thead>
              <tbody>
                {deals.map(deal => (
                  <tr
                    key={deal.dealId}
                    className={styles.row}
                    onClick={() => navigate(`/deals/${deal.dealId}`)}
                  >
                    <td>
                      <span className={styles.dealName}>{deal.name}</span>
                      <span className={styles.dealId}>{deal.dealId}</span>
                    </td>
                    <td>{deal.buyerName || deal.buyerId}</td>
                    <td><span className={styles.chip}>{deal.format}</span></td>
                    <td><span className={styles.chip}>{deal.dealType}</span></td>
                    <td className={styles.number}>${fmt(deal.floorCpm)}</td>
                    <td><StatusBadge status={deal.status} /></td>
                    <td>
                      <StateList states={deal.targetStates} />
                    </td>
                    <td>{deal.startDate || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function StateList({ states }) {
  if (!states || states.length === 0) return <span className="muted">—</span>
  const visible = states.slice(0, 3)
  const more = states.length - 3
  return (
    <span>
      {visible.join(', ')}
      {more > 0 && <span style={{ color: 'var(--color-text-secondary)', marginLeft: 4 }}>+{more}</span>}
    </span>
  )
}
