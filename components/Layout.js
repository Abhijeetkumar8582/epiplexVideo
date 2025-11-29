import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';

export default function Layout({ children, pageTitle = 'Dashboard' }) {
  const router = useRouter();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const handleNavigation = (path) => {
    router.push(path);
  };

  const getActiveNav = () => {
    if (router.pathname === '/dashboard' || router.pathname === '/') return 'Dashboard';
    if (router.pathname === '/process-data') return 'Process Data';
    if (router.pathname === '/document') return 'Document';
    return 'Dashboard';
  };

  const activeNav = getActiveNav();

  return (
    <>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.appName}>Epiplex Document Processing</h2>
        </div>
        
        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${activeNav === 'Dashboard' ? styles.navItemActive : ''}`}
            onClick={() => handleNavigation('/dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`${styles.navItem} ${activeNav === 'Process Data' ? styles.navItemActive : ''}`}
            onClick={() => handleNavigation('/process-data')}
          >
            Process Data
          </button>
          <button
            className={`${styles.navItem} ${activeNav === 'Document' ? styles.navItemActive : ''}`}
            onClick={() => handleNavigation('/document')}
          >
            Document
          </button>
        </nav>

        {/* Account Section */}
        <div className={styles.accountSection}>
          <button
            className={styles.accountButton}
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
          >
            Account
          </button>
          {accountMenuOpen && (
            <div className={styles.accountMenu}>
              <button className={styles.accountMenuItem}>Account</button>
              <button className={styles.accountMenuItem}>Signout</button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </>
  );
}

