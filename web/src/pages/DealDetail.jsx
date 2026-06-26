import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDeal } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import Spinner from '../components/Spinner.jsx'
import styles from './DealDetail.module.css'

function fmt(n, digits = 2) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function fmtPct(n) {
  if (n == null) return '—'
  return `${(n * 100).toFixed(1)}%`
}

function fmtInt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US')
}

function Field({ label, value }) {
  return (
    <div className={styles.field}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{value ?? '—'}</dd>
    </div>
  )
}

export default function DealDetail() {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const [deal, setDeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getDeal(dealId)
      .then(setDeal)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [dealId])

  if (loading) return <Spinner />
  if (error) return <p className={styles.error}>Error: {error}</p>
  if (!deal) return null

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back to deals
        </button>
        <StatusBadge status={deal.status} />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.dealName}>{deal.name}</h2>
            <span className={styles.dealId}>{deal.dealId}</span>
          </div>
        </div>

        <div className={styles.sections}>
          {/* Deal details */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Deal details</h3>
            <dl className={styles.grid}>
              <Field label="Format" value={<span className={styles.chip}>{deal.format}</span>} />
              <Field label="Deal type" value={<span className={styles.chip}>{deal.dealType}</span>} />
              <Field label="Device" value={deal.device} />
              <Field label="Floor CPM" value={`$${fmt(deal.floorCpm)} ${deal.currency || 'USD'}`} />
              <Field label="Start date" value={deal.startDate} />
              <Field label="End date" value={deal.endDate} />
              <Field label="Created" value={deal.createdAt} />
            </dl>
          </section>

          {/* Parties */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Parties</h3>
            <dl className={styles.grid}>
              <Field label="Buyer" value={deal.buyerName || deal.buyerId} />
              <Field label="Buyer ID" value={deal.buyerId} />
              <Field label="Publisher" value={deal.publisherName || deal.publisherId} />
              <Field label="Publisher ID" value={deal.publisherId} />
            </dl>
          </section>

          {/* Targeting */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Targeting</h3>
            <dl className={styles.grid}>
              <Field
                label="Target states"
                value={
                  deal.targetStates && deal.targetStates.length > 0
                    ? deal.targetStates.join(', ')
                    : 'All states'
                }
              />
            </dl>
          </section>

          {/* Performance */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Performance (last 30 days)</h3>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.metricValue}>{fmtInt(deal.impressions30d)}</span>
                <span className={styles.metricLabel}>Impressions</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>{fmtPct(deal.fillRate)}</span>
                <span className={styles.metricLabel}>Fill rate</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>${fmt(deal.avgWinCpm)}</span>
                <span className={styles.metricLabel}>Avg win CPM</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>${fmt(deal.revenue30d)}</span>
                <span className={styles.metricLabel}>Revenue</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
