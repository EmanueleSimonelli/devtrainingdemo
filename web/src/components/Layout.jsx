import { Outlet, Link } from 'react-router-dom'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>DealDesk</Link>
        <span className={styles.tagline}>Sell-Side Deal Management</span>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
