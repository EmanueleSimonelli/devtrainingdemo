import styles from './FilterSidebar.module.css'

const FORMATS = ['', 'display', 'video', 'native', 'ctv', 'audio']
const STATUSES = ['', 'active', 'paused', 'draft', 'expired']
const DEAL_TYPES = ['', 'pmp', 'preferred', 'programmatic_guaranteed']

export default function FilterSidebar({ filters, onChange, states }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value })
  }

  function reset() {
    onChange({ format: '', status: '', dealType: '', state: '', floorMin: '', floorMax: '' })
  }

  const hasFilters = Object.values(filters).some(v => v !== '')

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.title}>Filters</span>
        {hasFilters && (
          <button type="button" className={styles.resetBtn} onClick={reset}>
            Clear all
          </button>
        )}
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Format</label>
        <select
          className={styles.select}
          value={filters.format}
          onChange={e => set('format', e.target.value)}
        >
          {FORMATS.map(f => (
            <option key={f} value={f}>{f || 'All formats'}</option>
          ))}
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Status</label>
        <select
          className={styles.select}
          value={filters.status}
          onChange={e => set('status', e.target.value)}
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Deal type</label>
        <select
          className={styles.select}
          value={filters.dealType}
          onChange={e => set('dealType', e.target.value)}
        >
          {DEAL_TYPES.map(d => (
            <option key={d} value={d}>{d || 'All types'}</option>
          ))}
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Target state</label>
        <select
          className={styles.select}
          value={filters.state}
          onChange={e => set('state', e.target.value)}
        >
          <option value="">All states</option>
          {states.map(s => (
            <option key={s.code} value={s.code}>{s.code} – {s.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Floor CPM range</label>
        <div className={styles.rangeRow}>
          <input
            className={styles.rangeInput}
            type="number"
            min="0"
            step="0.01"
            placeholder="Min"
            value={filters.floorMin}
            onChange={e => set('floorMin', e.target.value)}
          />
          <span className={styles.rangeSep}>–</span>
          <input
            className={styles.rangeInput}
            type="number"
            min="0"
            step="0.01"
            placeholder="Max"
            value={filters.floorMax}
            onChange={e => set('floorMax', e.target.value)}
          />
        </div>
      </div>
    </aside>
  )
}
