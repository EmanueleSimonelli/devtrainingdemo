import styles from './Spinner.module.css'

export default function Spinner({ text = 'Loading...' }) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  )
}
