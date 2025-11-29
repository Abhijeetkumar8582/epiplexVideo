import { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const [dateRangePickerOpen, setDateRangePickerOpen] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [currentMonth1, setCurrentMonth1] = useState(new Date());
  const [currentMonth2, setCurrentMonth2] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
  const [startTime, setStartTime] = useState({ hours: '00', minutes: '00' });
  const [endTime, setEndTime] = useState({ hours: '23', minutes: '59' });
  const [dateRangeText, setDateRangeText] = useState('Oct 18 - Nov 18');
  // KPI Cards Data
  const kpiCards = [
    {
      id: 'total-processed',
      title: 'Total Processed',
      value: '132.5K',
      change: '+8.3%',
      isPositive: true,
      description: 'Up 8.3% compared to last month',
      progress: 90
    },
    {
      id: 'total-documents',
      title: 'Total Documents',
      value: '52.8K',
      change: '+8.3%',
      isPositive: true,
      description: 'Steady increase in Q3 and Q4',
      progress: 90
    },
    {
      id: 'success-rate',
      title: 'Success Rate',
      value: '98.6%',
      change: '+8.3%',
      isPositive: true,
      description: 'Average success rate is 95%',
      progress: 90
    },
    {
      id: 'processing-time',
      title: 'Processing Time',
      value: '72%',
      change: '-8.3%',
      isPositive: false,
      description: 'Time improved by 4% from last month',
      progress: 70
    }
  ];

  // Graph Cards Data
  const graphCards = [
    {
      id: 'monthly-processing',
      title: 'Monthly Processing',
      value: '8,944',
      change: '+2.1% vs last month',
      isPositive: true,
      type: 'line'
    },
    {
      id: 'quarterly-growth',
      title: 'Quarterly Growth',
      value: '18,944',
      change: '+2.1% vs last Quarter',
      isPositive: true,
      type: 'bar'
    }
  ];

  // Insight Cards Data
  const insightCards = [
    {
      id: 'top-documents',
      title: 'Top Documents by Type',
      type: 'donut',
      data: { main: 'Video', percentage: 65, other: 35 }
    },
    {
      id: 'best-month',
      title: 'Best Month',
      value: '15,800',
      label: 'July'
    },
    {
      id: 'slowest-month',
      title: 'Slowest Month',
      value: '7,200',
      label: 'Feb'
    },
    {
      id: 'user-distribution',
      title: 'User Distribution',
      value: '54%',
      breakdown: '44% Internal, 2% External'
    },
    {
      id: 'age-group',
      title: 'Dominant Category',
      value: '26-35',
      percentage: '38% of total'
    }
  ];

  // Sample metrics data (keeping for structured data)
  const metrics = [
    {
      id: 'execution-time',
      title: 'Execution Time Analysis',
      mainValue: '71.74%',
      subValues: [
        { label: '174 Verified', value: '174' },
        { label: '31 Pending Check', value: '31' }
      ],
      progress: { value: 72, total: 100, type: 'circular' }
    },
    {
      id: 'step-duration',
      title: 'Step Duration Breakdown',
      mainValue: '56.1%',
      subValues: [
        { label: '65% Syncs', value: '65%' },
        { label: '82% Fetches', value: '82%' }
      ],
      progress: { value: 56, total: 100, type: 'chart' }
    },
    {
      id: 'bottleneck',
      title: 'Bottleneck Identification',
      mainValue: '82.6%',
      subValues: [
        { label: '34% Manuals', value: '34%' },
        { label: '12% Autosync', value: '12%' },
        { label: '84 Done', value: '84' },
        { label: '24% Active', value: '24%' }
      ],
      progress: { value: 83, total: 100, type: 'chart' }
    },
    {
      id: 'user-interaction',
      title: 'User Interaction Metrics',
      mainValue: '10.12%',
      subValues: [
        { label: '1.62k Detected', value: '1.62k' },
        { label: '13.7k Total Items', value: '13.7k' }
      ],
      progress: { value: 12, total: 100 }
    },
    {
      id: 'ui-heatmap',
      title: 'UI Element Heatmap',
      mainValue: '89.5%',
      subValues: [
        { label: '2.3k Interactions', value: '2.3k' },
        { label: '156 Hotspots', value: '156' }
      ],
      progress: { value: 90, total: 100 }
    },
    {
      id: 'transcript-insights',
      title: 'Transcript Insights',
      mainValue: '94.2%',
      subValues: [
        { label: '12.5k Transcribed', value: '12.5k' },
        { label: '98% Accuracy', value: '98%' }
      ],
      progress: { value: 94, total: 100 }
    },
    {
      id: 'version-comparison',
      title: 'Version Comparison',
      mainValue: '76.8%',
      subValues: [
        { label: '45 Versions', value: '45' },
        { label: '12 Active', value: '12' }
      ],
      progress: { value: 77, total: 100 }
    },
    {
      id: 'exception-error',
      title: 'Exception & Error Analysis',
      mainValue: '3.2%',
      subValues: [
        { label: '234 Errors', value: '234' },
        { label: '7.2k Total', value: '7.2k' }
      ],
      progress: { value: 3, total: 100 }
    },
    {
      id: 'variants-path',
      title: 'Variants & Path Analysis',
      mainValue: '68.4%',
      subValues: [
        { label: '89 Variants', value: '89' },
        { label: '23 Paths', value: '23' }
      ],
      progress: { value: 68, total: 100 }
    },
    {
      id: 'rework-editing',
      title: 'Rework & Editing Metrics',
      mainValue: '42.7%',
      subValues: [
        { label: '1.2k Reworks', value: '1.2k' },
        { label: '456 Edits', value: '456' }
      ],
      progress: { value: 43, total: 100 }
    },
    {
      id: 'usage-adoption',
      title: 'Usage & Adoption Stats',
      mainValue: '85.3%',
      subValues: [
        { label: '5.6k Users', value: '5.6k' },
        { label: '92% Adoption', value: '92%' }
      ],
      progress: { value: 85, total: 100 }
    },
    {
      id: 'document-export',
      title: 'Document Export Insights',
      mainValue: '91.8%',
      subValues: [
        { label: '8.9k Exported', value: '8.9k' },
        { label: '234 Failed', value: '234' }
      ],
      progress: { value: 92, total: 100 }
    },
    {
      id: 'quality-scores',
      title: 'Quality Scores',
      mainValue: '88.5%',
      subValues: [
        { label: 'Avg Score', value: '88.5' },
        { label: '1.2k Rated', value: '1.2k' }
      ],
      progress: { value: 89, total: 100 }
    },
    {
      id: 'ai-recommendations',
      title: 'AI Recommendations',
      mainValue: '73.6%',
      subValues: [
        { label: '456 Recommendations', value: '456' },
        { label: '89% Accepted', value: '89%' }
      ],
      progress: { value: 74, total: 100 }
    }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DashboardPage',
    name: 'Epiplex Dashboard',
    description: 'View comprehensive analytics and statistics for your document processing tasks',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: metrics.length,
      itemListElement: metrics.map((metric, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: metric.title
      }))
    }
  };

  // Helper functions for calendar
  function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  function formatDate(date) {
    if (!date) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  function isSameDay(date1, date2) {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  function handleDateClick(date) {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else if (selectedStartDate && !selectedEndDate) {
      if (date < selectedStartDate) {
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
      }
    }
  }

  function handleQuickSelect(type) {
    const today = new Date();
    let start, end;

    switch (type) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'yesterday':
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        end = new Date(start);
        break;
      case 'last7days':
        start = new Date(today);
        start.setDate(start.getDate() - 6);
        end = new Date(today);
        break;
      case 'last30days':
        start = new Date(today);
        start.setDate(start.getDate() - 29);
        end = new Date(today);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    setSelectedStartDate(start);
    setSelectedEndDate(end);
    setCurrentMonth1(new Date(start));
    setCurrentMonth2(new Date(start.getFullYear(), start.getMonth() + 1, 1));
  }

  function handleSaveDateRange() {
    if (selectedStartDate && selectedEndDate) {
      const startText = formatDate(selectedStartDate);
      const endText = formatDate(selectedEndDate);
      setDateRangeText(`${startText} - ${endText}`);
      setDateRangePickerOpen(false);
    }
  }

  function renderCalendar(monthDate, setMonthDate, calendarIndex) {
    const daysInMonth = getDaysInMonth(monthDate);
    const firstDay = getFirstDayOfMonth(monthDate);
    const monthName = monthDate.toLocaleString('default', { month: 'long' });
    const year = monthDate.getFullYear();
    const days = [];

    // Previous month days
    const prevMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonthDays - i) });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), i);
      days.push({ day: i, isCurrentMonth: true, date });
    }

    // Next month days
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, i);
      days.push({ day: i, isCurrentMonth: false, date });
    }

    const navigateMonth = (direction) => {
      const newDate = new Date(monthDate);
      newDate.setMonth(monthDate.getMonth() + direction);
      setMonthDate(newDate);
    };

    return (
      <div key={calendarIndex} className={styles.calendar}>
        <div className={styles.calendarHeader}>
          {calendarIndex === 0 && (
            <button className={styles.calendarNavButton} onClick={() => navigateMonth(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}
          <div className={styles.calendarMonthYear}>
            {monthName} {year}
          </div>
          {calendarIndex === 1 && (
            <button className={styles.calendarNavButton} onClick={() => navigateMonth(1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          )}
        </div>
        <div className={styles.calendarWeekdays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className={styles.calendarWeekday}>{day}</div>
          ))}
        </div>
        <div className={styles.calendarDays}>
          {days.map((dayObj, index) => {
            const isSelected = (selectedStartDate && isSameDay(dayObj.date, selectedStartDate)) ||
                              (selectedEndDate && isSameDay(dayObj.date, selectedEndDate));
            const isInRange = selectedStartDate && selectedEndDate &&
                            dayObj.date >= selectedStartDate && dayObj.date <= selectedEndDate;
            
            return (
              <button
                key={index}
                className={`${styles.calendarDay} ${!dayObj.isCurrentMonth ? styles.calendarDayOtherMonth : ''} ${isSelected ? styles.calendarDaySelected : ''} ${isInRange ? styles.calendarDayInRange : ''}`}
                onClick={() => handleDateClick(dayObj.date)}
              >
                {dayObj.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Dashboard - Epiplex Document Processing"
        description="Comprehensive analytics dashboard for document processing. Track KPIs, processing metrics, quarterly growth, and insights. Monitor total processed documents, success rates, and user activity."
        keywords="dashboard, analytics, document processing, KPI, metrics, business intelligence, data visualization, document analytics, processing insights"
        structuredData={structuredData}
      />
      <div className={styles.dashboard}>
        <Layout>
          {/* Top Header */}
          <header className={styles.dashboardHeader}>
            <h1 className={styles.dashboardPageTitle}>Dashboard</h1>
            <div className={styles.headerActions}>
              <button 
                className={styles.headerActionButton}
                onClick={() => setDateRangePickerOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{dateRangeText}</span>
              </button>
              <button className={styles.headerActionButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export</span>
              </button>
            </div>
          </header>

          <main className={styles.dashboardMain}>
            {/* KPI Cards Section */}
            <section className={styles.kpiSection}>
              <div className={styles.kpiGrid}>
                {kpiCards.map((kpi) => (
                  <article key={kpi.id} className={styles.kpiCard}>
                    <button className={styles.kpiCardArrow} aria-label="View details">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                    <h3 className={styles.kpiCardTitle}>{kpi.title}</h3>
                    <div className={styles.kpiCardValue}>{kpi.value}</div>
                    <div className={`${styles.kpiCardChange} ${kpi.isPositive ? styles.kpiChangePositive : styles.kpiChangeNegative}`}>
                      <span>{kpi.isPositive ? '▲' : '▼'}</span>
                      <span>{kpi.change}</span>
                    </div>
                    <p className={styles.kpiCardDescription}>{kpi.description}</p>
                    <div className={styles.kpiProgressBar}>
                      <div className={styles.kpiProgressTrack}>
                        <div 
                          className={styles.kpiProgressDot}
                          style={{ left: `${kpi.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Graph Cards Section */}
            <section className={styles.graphSection}>
              <div className={styles.graphGrid}>
                {graphCards.map((graph) => (
                  <article key={graph.id} className={styles.graphCard}>
                    <h3 className={styles.graphCardTitle}>{graph.title}</h3>
                    <div className={styles.graphCardValue}>{graph.value}</div>
                    <div className={`${styles.graphCardChange} ${graph.isPositive ? styles.kpiChangePositive : styles.kpiChangeNegative}`}>
                      {graph.isPositive ? '▲' : '▼'} {graph.change}
                    </div>
                    <div className={styles.graphPlaceholder}>
                      {graph.type === 'line' ? (
                        <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none">
                          <polyline
                            points="0,180 40,160 80,140 120,120 160,100 200,80 240,90 280,70 320,60 360,50 400,40"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3"
                          />
                          <polyline
                            points="0,180 40,160 80,140 120,120 160,100 200,80 240,90 280,70 320,60 360,50 400,40"
                            fill="url(#lineGradient)"
                            opacity="0.3"
                          />
                          <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      ) : (
                        <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none">
                          <rect x="20" y="120" width="60" height="80" fill="#e5e7eb" />
                          <rect x="100" y="100" width="60" height="100" fill="#e5e7eb" />
                          <rect x="180" y="60" width="60" height="140" fill="#3b82f6" />
                          <rect x="260" y="90" width="60" height="110" fill="#e5e7eb" />
                          <rect x="340" y="110" width="60" height="90" fill="#e5e7eb" />
                        </svg>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Insight Cards Section */}
            <section className={styles.insightSection}>
              <div className={styles.insightGrid}>
                {insightCards.map((insight) => (
                  <article key={insight.id} className={styles.insightCard}>
                    <h3 className={styles.insightCardTitle}>{insight.title}</h3>
                    {insight.type === 'donut' ? (
                      <div className={styles.donutChart}>
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="20"
                            strokeDasharray={`${2 * Math.PI * 50 * (insight.data.percentage / 100)} ${2 * Math.PI * 50}`}
                            strokeDashoffset={`${2 * Math.PI * 50 * 0.25}`}
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div className={styles.donutLegend}>
                          <div className={styles.donutLegendItem}>
                            <span className={styles.donutDot} style={{ backgroundColor: '#3b82f6' }}></span>
                            <span>{insight.data.main}</span>
                          </div>
                          <div className={styles.donutLegendItem}>
                            <span className={styles.donutDot} style={{ backgroundColor: '#e5e7eb' }}></span>
                            <span>Others</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.insightCardValue}>{insight.value}</div>
                        {insight.label && <div className={styles.insightCardLabel}>{insight.label}</div>}
                        {insight.breakdown && <div className={styles.insightCardBreakdown}>{insight.breakdown}</div>}
                        {insight.percentage && <div className={styles.insightCardPercentage}>{insight.percentage}</div>}
                      </>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </main>
        </Layout>

          {/* Date Range Picker Modal */}
          {dateRangePickerOpen && (
            <div className={styles.dateRangeOverlay} onClick={() => setDateRangePickerOpen(false)}>
              <div className={styles.dateRangePicker} onClick={(e) => e.stopPropagation()}>
                <div className={styles.dateRangeContent}>
                  {/* Two Calendars */}
                  <div className={styles.calendarsContainer}>
                    {renderCalendar(currentMonth1, setCurrentMonth1, 0)}
                    {renderCalendar(currentMonth2, setCurrentMonth2, 1)}
                  </div>

                  {/* Quick Selection Buttons */}
                  <div className={styles.quickSelectionButtons}>
                    <button className={styles.quickButton} onClick={() => handleQuickSelect('today')}>
                      Today
                    </button>
                    <button className={styles.quickButton} onClick={() => handleQuickSelect('yesterday')}>
                      Yesterday
                    </button>
                    <button className={styles.quickButton} onClick={() => handleQuickSelect('last7days')}>
                      Last 7 days
                    </button>
                    <button className={styles.quickButton} onClick={() => handleQuickSelect('last30days')}>
                      Last 30 days
                    </button>
                    <button className={styles.quickButton} onClick={() => handleQuickSelect('thisMonth')}>
                      This month
                    </button>
                    <button className={styles.quickButton} onClick={() => handleQuickSelect('lastMonth')}>
                      Last month
                    </button>
                  </div>
                </div>

                {/* Time Inputs */}
                <div className={styles.timeInputsContainer}>
                  <div className={styles.timeInputGroup}>
                    <input
                      type="text"
                      className={styles.timeInput}
                      value={startTime.hours}
                      onChange={(e) => setStartTime({ ...startTime, hours: e.target.value })}
                      maxLength="2"
                    />
                    <span className={styles.timeSeparator}>:</span>
                    <input
                      type="text"
                      className={styles.timeInput}
                      value={startTime.minutes}
                      onChange={(e) => setStartTime({ ...startTime, minutes: e.target.value })}
                      maxLength="2"
                    />
                  </div>
                  <span className={styles.timeDash}>-</span>
                  <div className={styles.timeInputGroup}>
                    <input
                      type="text"
                      className={styles.timeInput}
                      value={endTime.hours}
                      onChange={(e) => setEndTime({ ...endTime, hours: e.target.value })}
                      maxLength="2"
                    />
                    <span className={styles.timeSeparator}>:</span>
                    <input
                      type="text"
                      className={styles.timeInput}
                      value={endTime.minutes}
                      onChange={(e) => setEndTime({ ...endTime, minutes: e.target.value })}
                      maxLength="2"
                    />
                  </div>
                </div>

                {/* Save and Cancel Buttons */}
                <div className={styles.dateRangeFooter}>
                  <button className={styles.dateRangeCancelButton} onClick={() => setDateRangePickerOpen(false)}>
                    Cancel
                  </button>
                  <button className={styles.dateRangeSaveButton} onClick={handleSaveDateRange}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </>
  );
}
