import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDeal, getBuyers, getPublishers, getStates } from '../api/client.js'
import Spinner from '../components/Spinner.jsx'
import styles from './AddDeal.module.css'

const FORMATS = ['display', 'video', 'native', 'ctv', 'audio']
const DEAL_TYPES = ['pmp', 'preferred', 'programmatic_guaranteed']
const DEVICES = ['desktop', 'mobile', 'ctv', 'all']
const STATUSES = ['active', 'paused', 'draft', 'expired']
const CURRENCIES = ['USD', 'EUR', 'GBP']

const EMPTY_FORM = {
  name: '',
  buyerId: '',
  publisherId: '',
  format: '',
  dealType: '',
  device: '',
  floorCpm: '',
  currency: 'USD',
  status: '',
  targetStates: [],
  startDate: '',
  endDate: '',
}

function required(v) {
  return v === '' || v == null ? 'Required' : null
}

function validate(form) {
  const errors = {}
  const checks = {
    name: required,
    buyerId: required,
    publisherId: required,
    format: required,
    dealType: required,
    device: required,
    status: required,
    floorCpm: v => {
      if (v === '' || v == null) return 'Required'
      if (isNaN(Number(v)) || Number(v) < 0) return 'Must be a non-negative number'
      return null
    },
  }
  for (const [k, fn] of Object.entries(checks)) {
    const msg = fn(form[k])
    if (msg) errors[k] = msg
  }
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = 'End date must be after start date'
  }
  return errors
}

export default function AddDeal() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const [buyers, setBuyers] = useState([])
  const [publishers, setPublishers] = useState([])
  const [states, setStates] = useState([])
  const [loadingRef, setLoadingRef] = useState(true)

  useEffect(() => {
    Promise.all([getBuyers(), getPublishers(), getStates()])
      .then(([b, p, s]) => { setBuyers(b); setPublishers(p); setStates(s) })
      .catch(() => {})
      .finally(() => setLoadingRef(false))
  }, [])

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }))
  }

  function toggleState(code) {
    setForm(f => ({
      ...f,
      targetStates: f.targetStates.includes(code)
        ? f.targetStates.filter(s => s !== code)
        : [...f.targetStates, code],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        ...form,
        floorCpm: Number(form.floorCpm),
      }
      await createDeal(payload)
      navigate('/')
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingRef) return <Spinner text="Loading reference data..." />

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back to deals
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.title}>Add new deal</h2>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {submitError && (
            <div className={styles.submitError}>Submit failed: {submitError}</div>
          )}

          {/* Basic info */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Basic information</legend>
            <div className={styles.grid2}>
              <FormField label="Deal name" error={errors.name} required>
                <input
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Q3 Video PMP – News"
                />
              </FormField>

              <FormField label="Status" error={errors.status} required>
                <select
                  className={`${styles.select} ${errors.status ? styles.inputError : ''}`}
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                >
                  <option value="">Select status</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
            </div>
          </fieldset>

          {/* Parties */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Parties</legend>
            <div className={styles.grid2}>
              <FormField label="Buyer" error={errors.buyerId} required>
                <select
                  className={`${styles.select} ${errors.buyerId ? styles.inputError : ''}`}
                  value={form.buyerId}
                  onChange={e => set('buyerId', e.target.value)}
                >
                  <option value="">Select buyer</option>
                  {buyers.map(b => (
                    <option key={b.buyerId} value={b.buyerId}>{b.name} ({b.buyerId})</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Publisher" error={errors.publisherId} required>
                <select
                  className={`${styles.select} ${errors.publisherId ? styles.inputError : ''}`}
                  value={form.publisherId}
                  onChange={e => set('publisherId', e.target.value)}
                >
                  <option value="">Select publisher</option>
                  {publishers.map(p => (
                    <option key={p.publisherId} value={p.publisherId}>{p.name} ({p.publisherId})</option>
                  ))}
                </select>
              </FormField>
            </div>
          </fieldset>

          {/* Deal parameters */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Deal parameters</legend>
            <div className={styles.grid3}>
              <FormField label="Format" error={errors.format} required>
                <select
                  className={`${styles.select} ${errors.format ? styles.inputError : ''}`}
                  value={form.format}
                  onChange={e => set('format', e.target.value)}
                >
                  <option value="">Select format</option>
                  {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </FormField>

              <FormField label="Deal type" error={errors.dealType} required>
                <select
                  className={`${styles.select} ${errors.dealType ? styles.inputError : ''}`}
                  value={form.dealType}
                  onChange={e => set('dealType', e.target.value)}
                >
                  <option value="">Select type</option>
                  {DEAL_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>

              <FormField label="Device" error={errors.device} required>
                <select
                  className={`${styles.select} ${errors.device ? styles.inputError : ''}`}
                  value={form.device}
                  onChange={e => set('device', e.target.value)}
                >
                  <option value="">Select device</option>
                  {DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>
            </div>

            <div className={styles.grid2}>
              <FormField label="Floor CPM" error={errors.floorCpm} required>
                <div className={styles.inputGroup}>
                  <span className={styles.inputPrefix}>$</span>
                  <input
                    className={`${styles.input} ${styles.inputWithPrefix} ${errors.floorCpm ? styles.inputError : ''}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.floorCpm}
                    onChange={e => set('floorCpm', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </FormField>

              <FormField label="Currency">
                <select
                  className={styles.select}
                  value={form.currency}
                  onChange={e => set('currency', e.target.value)}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
            </div>
          </fieldset>

          {/* Dates */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Dates</legend>
            <div className={styles.grid2}>
              <FormField label="Start date">
                <input
                  className={styles.input}
                  type="date"
                  value={form.startDate}
                  onChange={e => set('startDate', e.target.value)}
                />
              </FormField>

              <FormField label="End date" error={errors.endDate}>
                <input
                  className={`${styles.input} ${errors.endDate ? styles.inputError : ''}`}
                  type="date"
                  value={form.endDate}
                  onChange={e => set('endDate', e.target.value)}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Target states */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              Target states
              {form.targetStates.length > 0 && (
                <span className={styles.legendCount}>{form.targetStates.length} selected</span>
              )}
            </legend>
            <p className={styles.hint}>Leave empty to target all states.</p>
            <div className={styles.stateGrid}>
              {states.map(s => (
                <label key={s.code} className={styles.stateLabel}>
                  <input
                    type="checkbox"
                    checked={form.targetStates.includes(s.code)}
                    onChange={() => toggleState(s.code)}
                    className={styles.checkbox}
                  />
                  <span className={styles.stateCode}>{s.code}</span>
                  <span className={styles.stateName}>{s.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? 'Creating…' : 'Create deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, error, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  )
}
