import styles from './StatusBadge.module.css'

const STATUS_COLORS = {
  active: 'success',
  paused: 'warning',
  draft: 'muted',
  expired: 'danger',
}

export default function StatusBadge({ status }) {
  const variant = STATUS_COLORS[status] || 'muted'
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {status}
    </span>
  )
}
