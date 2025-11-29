import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  // Sample analytics data
  const analyticsData = {
    totalDocuments: 24,
    completed: 18,
    processing: 4,
    pending: 2,
    totalDuration: '2h 45m',
    averageDuration: '6m 52s'
  };

  const stats = [
    {
      label: 'Total Documents',
      value: analyticsData.totalDocuments,
      color: '#000000',
      icon: '📄'
    },
    {
      label: 'Completed',
      value: analyticsData.completed,
      color: '#10b981',
      icon: '✅'
    },
    {
      label: 'Processing',
      value: analyticsData.processing,
      color: '#3b82f6',
      icon: '⚙️'
    },
    {
      label: 'Pending',
      value: analyticsData.pending,
      color: '#f59e0b',
      icon: '⏳'
    }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DashboardPage',
    name: 'Epiplex Dashboard',
    description: 'View analytics and statistics for your document processing tasks',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: analyticsData.totalDocuments,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Total Documents',
          value: analyticsData.totalDocuments
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Completed Documents',
          value: analyticsData.completed
        }
      ]
    }
  };

  return (
    <>
      <SEO
        title="Dashboard"
        description="View comprehensive analytics and statistics for your document processing tasks. Track total documents, completed processes, and processing metrics."
        keywords="dashboard, analytics, document processing, statistics, metrics, epiplex dashboard"
        structuredData={structuredData}
      />
      <div className={styles.dashboard}>
        <Layout>
          <header className={styles.contentHeader}>
            <h1 className={styles.pageTitle}>Dashboard</h1>
          </header>

          <main>
            <section aria-labelledby="analytics-heading">
              <h2 id="analytics-heading" className="sr-only">Analytics Overview</h2>
              <div className={styles.analyticsGrid} role="list">
                {stats.map((stat, index) => (
                  <article key={index} className={styles.statCard} role="listitem">
                    <div className={styles.statIcon} style={{ color: stat.color }} aria-hidden="true">
                      {stat.icon}
                    </div>
                    <div className={styles.statContent}>
                      <div className={styles.statValue} style={{ color: stat.color }} aria-label={`${stat.label}: ${stat.value}`}>
                        {stat.value}
                      </div>
                      <div className={styles.statLabel}>{stat.label}</div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="metrics-heading" className={styles.analyticsSection}>
              <h2 id="metrics-heading" className="sr-only">Processing Metrics</h2>
              <article className={styles.analyticsCard}>
                <h3 className={styles.analyticsCardTitle}>Total Processing Duration</h3>
                <div className={styles.analyticsCardValue} aria-label={`Total Processing Duration: ${analyticsData.totalDuration}`}>
                  {analyticsData.totalDuration}
                </div>
              </article>
              <article className={styles.analyticsCard}>
                <h3 className={styles.analyticsCardTitle}>Average Duration</h3>
                <div className={styles.analyticsCardValue} aria-label={`Average Duration: ${analyticsData.averageDuration}`}>
                  {analyticsData.averageDuration}
                </div>
              </article>
            </section>
          </main>
        </Layout>
      </div>
    </>
  );
}
