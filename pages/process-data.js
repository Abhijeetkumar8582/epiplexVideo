import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from '../styles/Dashboard.module.css';

export default function ProcessData() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    file: null,
    fileUrl: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const processingSteps = [
    { id: 1, label: 'Transcribe', number: '1' },
    { id: 2, label: 'Keyframe', number: '2' },
    { id: 3, label: 'Video Context', number: '3' },
    { id: 4, label: 'Processing Video', number: '4' },
    { id: 5, label: 'Saving in Database', number: '5' },
    { id: 6, label: 'Creating File', number: '6' },
    { id: 7, label: 'Ready', number: '7' }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterData, setFilterData] = useState({
    user: null,
    fileName: '',
    status: null,
    date: null
  });
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterCalendarMonth, setFilterCalendarMonth] = useState(new Date());

  // Sample users for dropdown
  const users = [
    'Abhi K',
    'admin admin',
    'Alina L',
    'anonymous anonymous',
    'Denny Morais',
    'dilshadsoraon09 soraon',
    'John Doe',
    'Jane Smith',
    'Mike Johnson'
  ];

  const statusOptions = ['Draft', 'Completed', 'Sent', 'Processing', 'Pending'];

  // Sample data - replace with actual data from API
  const [tableData, setTableData] = useState([
    {
      id: 1,
      name: 'Sample Sales Proposal',
      created: 'Jan 16, 2024, 9:18 AM',
      lastActivity: 'Jan 24, 2024, 9:18 AM',
      recipients: ['N', 'User1', 'User2'],
      status: 'Draft'
    },
    {
      id: 2,
      name: 'Start exploring here! (Product guide)',
      created: 'Jan 15, 2024, 9:18 AM',
      lastActivity: 'Jan 23, 2024, 9:18 AM',
      recipients: ['User1', 'User2'],
      status: 'Completed'
    },
    {
      id: 3,
      name: 'Memorandum of Understanding',
      created: 'Jan 14, 2024, 9:18 AM',
      lastActivity: 'Jan 23, 2024, 9:18 AM',
      recipients: ['M'],
      status: 'Completed'
    },
    {
      id: 4,
      name: 'Employment Contract',
      created: 'Jan 13, 2024, 9:20 AM',
      lastActivity: 'Jan 22, 2024, 9:18 AM',
      recipients: ['User3', 'User4', '3+'],
      status: 'Sent'
    },
    {
      id: 5,
      name: 'Purchase Agreement',
      created: 'Jan 12, 2024, 9:18 AM',
      lastActivity: 'Jan 21, 2024, 10:24 AM',
      recipients: ['A', 'E'],
      status: 'Draft'
    },
    {
      id: 6,
      name: 'Lease Agreement',
      created: 'Jan 10, 2024, 11:18 AM',
      lastActivity: 'Jan 21, 2024, 10:22 AM',
      recipients: ['User3', 'R'],
      status: 'Completed'
    }
  ]);

  const [newEntryId, setNewEntryId] = useState(null);

  const handleDelete = (id) => {
    setTableData(tableData.filter(item => item.id !== id));
  };

  const handleEdit = (id) => {
    console.log('Edit item:', id);
  };

  const handleCreateNew = () => {
    setDialogOpen(true);
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setFormData({ name: '', link: '', file: null, fileUrl: '' });
    setIsDragging(false);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      // Simulate upload
      setIsUploading(true);
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setIsUploading(true);
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleStart = () => {
    if (!formData.name || (!formData.link && !formData.file && !formData.fileUrl)) {
      return;
    }

    const entryId = Date.now();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const formattedDate = `${dateStr}, ${timeStr}`;

    const newEntry = {
      id: entryId,
      name: formData.name,
      created: formattedDate,
      lastActivity: formattedDate,
      recipients: ['U'],
      status: 'Processing'
    };

    setTableData(prev => [newEntry, ...prev]);
    setNewEntryId(entryId);
    
    setDialogOpen(false);
    setProcessingOpen(true);
    setCurrentStep(0);
    setFormData({ name: '', link: '', file: null, fileUrl: '' });
    setUploadProgress(0);
    setIsUploading(false);
  };

  useEffect(() => {
    if (!processingOpen) return;

    if (currentStep < processingSteps.length) {
      const timer = setTimeout(() => {
        const nextStep = currentStep + 1;
        
        if (nextStep >= processingSteps.length) {
          setTimeout(() => {
            setProcessingOpen(false);
            setCurrentStep(0);
            
            if (newEntryId) {
              const now = new Date();
              const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              const formattedDate = `${dateStr}, ${timeStr}`;
              
              setTableData(prev => 
                prev.map(item => 
                  item.id === newEntryId 
                    ? { ...item, status: 'Completed', lastActivity: formattedDate }
                    : item
                )
              );
              setNewEntryId(null);
            }
          }, 2000);
        } else {
          setCurrentStep(nextStep);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [processingOpen, currentStep, processingSteps.length, newEntryId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.filterDropdownWrapper}`)) {
        setUserDropdownOpen(false);
        setStatusDropdownOpen(false);
        setDatePickerOpen(false);
      }
    };

    if (userDropdownOpen || statusDropdownOpen || datePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userDropdownOpen, statusDropdownOpen, datePickerOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return styles.statusCompleted;
      case 'Draft':
        return styles.statusDraft;
      case 'Sent':
        return styles.statusSent;
      case 'Processing':
        return styles.statusProcessing;
      case 'Pending':
        return styles.statusPending;
      default:
        return '';
    }
  };

  const handleRemoveSort = () => {
    setSortBy(null);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setFilterData({ ...filterData, date });
    setDatePickerOpen(false);
  };

  const renderFilterCalendar = (monthDate, setMonthDate) => {
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
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

    const isSelected = (date) => {
      if (!selectedDate) return false;
      return date.getDate() === selectedDate.getDate() &&
             date.getMonth() === selectedDate.getMonth() &&
             date.getFullYear() === selectedDate.getFullYear();
    };

    return (
      <div className={styles.filterCalendar}>
        <div className={styles.filterCalendarHeader}>
          <button className={styles.filterCalendarNavButton} onClick={() => navigateMonth(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className={styles.filterCalendarMonthYear}>
            {monthName} {year}
          </div>
          <button className={styles.filterCalendarNavButton} onClick={() => navigateMonth(1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        <div className={styles.filterCalendarWeekdays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className={styles.filterCalendarWeekday}>{day}</div>
          ))}
        </div>
        <div className={styles.filterCalendarDays}>
          {days.map((dayObj, index) => (
            <button
              key={index}
              className={`${styles.filterCalendarDay} ${!dayObj.isCurrentMonth ? styles.filterCalendarDayOtherMonth : ''} ${isSelected(dayObj.date) ? styles.filterCalendarDaySelected : ''}`}
              onClick={() => handleDateSelect(dayObj.date)}
            >
              {dayObj.day}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Process Data - Epiplex',
    description: 'Process and manage video data extraction tasks. Create new processing jobs, track status, and manage your document processing workflow.',
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'Epiplex Process Data',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web'
    }
  };

  return (
    <>
      <SEO
        title="Process Data"
        description="Process and manage video data extraction tasks. Create new processing jobs, track status in real-time, and manage your document processing workflow efficiently."
        keywords="process data, video processing, data extraction, document processing, video to document, processing jobs, workflow management"
        structuredData={structuredData}
      />
      <div className={`${styles.dashboard} ${processingOpen ? styles.blurred : ''}`}>
        <Layout>
          {/* Top Header */}
          <div className={styles.processDataHeader}>
            <h1 className={styles.processDataTitle}>Process Data</h1>
            <div className={styles.headerRight}>
              <button className={styles.createButton} onClick={handleCreateNew}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Create</span>
              </button>
            </div>
          </div>

          {/* Filtering and Sorting Section */}
          <div className={styles.filterSection}>
            <div className={styles.filterLeft}>
              {sortBy && (
                <div className={styles.sortTag}>
                  <span>Sort By: Last Updated Des</span>
                  <button className={styles.sortTagRemove} onClick={handleRemoveSort}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className={styles.filterRight}>
              <button className={styles.moreFiltersButton} onClick={() => setFilterOpen(!filterOpen)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {filterOpen && (
            <div className={styles.filterPanel}>
              <div className={styles.filterPanelContent}>
                {/* User Dropdown */}
                <div className={styles.filterField}>
                  <label className={styles.filterLabel}>User</label>
                  <div className={styles.filterDropdownWrapper}>
                    <button
                      className={styles.filterDropdownButton}
                      onClick={() => {
                        setUserDropdownOpen(!userDropdownOpen);
                        setStatusDropdownOpen(false);
                        setDatePickerOpen(false);
                      }}
                    >
                      <span className={filterData.user ? styles.filterSelectedValue : styles.filterPlaceholder}>
                        {filterData.user || '--Please select an option--'}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points={userDropdownOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                      </svg>
                    </button>
                    {userDropdownOpen && (
                      <div className={styles.filterDropdownMenu}>
                        <div className={styles.filterSearchBox}>
                          <svg className={styles.filterSearchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                          </svg>
                          <input
                            type="text"
                            className={styles.filterSearchInput}
                            placeholder="Search"
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className={styles.filterDropdownList}>
                          {users
                            .filter(user => user.toLowerCase().includes(userSearchQuery.toLowerCase()))
                            .map((user, index) => (
                              <div
                                key={index}
                                className={styles.filterDropdownItem}
                                onClick={() => {
                                  setFilterData({ ...filterData, user });
                                  setUserDropdownOpen(false);
                                  setUserSearchQuery('');
                                }}
                              >
                                <input type="checkbox" checked={filterData.user === user} readOnly />
                                <span>{user}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Name Field */}
                <div className={styles.filterField}>
                  <label className={styles.filterLabel}>File Name</label>
                  <input
                    type="text"
                    className={styles.filterInput}
                    placeholder="Enter file name"
                    value={filterData.fileName}
                    onChange={(e) => setFilterData({ ...filterData, fileName: e.target.value })}
                  />
                </div>

                {/* Status Dropdown */}
                <div className={styles.filterField}>
                  <label className={styles.filterLabel}>Status</label>
                  <div className={styles.filterDropdownWrapper}>
                    <button
                      className={styles.filterDropdownButton}
                      onClick={() => {
                        setStatusDropdownOpen(!statusDropdownOpen);
                        setUserDropdownOpen(false);
                        setDatePickerOpen(false);
                      }}
                    >
                      <span className={filterData.status ? styles.filterSelectedValue : styles.filterPlaceholder}>
                        {filterData.status || '--Please select an option--'}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points={statusDropdownOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                      </svg>
                    </button>
                    {statusDropdownOpen && (
                      <div className={styles.filterDropdownMenu}>
                        <div className={styles.filterDropdownList}>
                          {statusOptions.map((status, index) => (
                            <div
                              key={index}
                              className={styles.filterDropdownItem}
                              onClick={() => {
                                setFilterData({ ...filterData, status });
                                setStatusDropdownOpen(false);
                              }}
                            >
                              <input type="checkbox" checked={filterData.status === status} readOnly />
                              <span>{status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Field with Calendar */}
                <div className={styles.filterField}>
                  <label className={styles.filterLabel}>Date</label>
                  <div className={styles.filterDropdownWrapper}>
                    <button
                      className={styles.filterDropdownButton}
                      onClick={() => {
                        setDatePickerOpen(!datePickerOpen);
                        setUserDropdownOpen(false);
                        setStatusDropdownOpen(false);
                      }}
                    >
                      <span className={selectedDate ? styles.filterSelectedValue : styles.filterPlaceholder}>
                        {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--Please select an option--'}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points={datePickerOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                      </svg>
                    </button>
                    {datePickerOpen && (
                      <div className={styles.filterCalendarMenu}>
                        {renderFilterCalendar(filterCalendarMonth, setFilterCalendarMonth)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.filterPanelFooter}>
                <button className={styles.filterApplyButton} onClick={() => {
                  // Apply filter logic here
                  setFilterOpen(false);
                }}>
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className={styles.tableContainer}>
            <table className={styles.processDataTable}>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" className={styles.tableCheckbox} />
                  </th>
                  <th>Name</th>
                  <th>Last Activity</th>
                  <th>Recipients</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyState}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  tableData.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input type="checkbox" className={styles.tableCheckbox} />
                      </td>
                      <td>
                        <div className={styles.documentNameCell}>
                          <div className={styles.documentIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                          </div>
                          <div className={styles.documentNameInfo}>
                            <div className={styles.documentName}>{item.name}</div>
                            <div className={styles.documentCreated}>Created: {item.created}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.lastActivityCell}>{item.lastActivity}</td>
                      <td>
                        <div className={styles.recipientsContainer}>
                          {item.recipients.map((recipient, idx) => (
                            <div key={idx} className={styles.recipientAvatar}>
                              {recipient.length === 1 ? (
                                <span className={styles.recipientInitial}>{recipient}</span>
                              ) : recipient === '3+' ? (
                                <span className={styles.recipientMore}>{recipient}</span>
                              ) : (
                                <div className={styles.recipientIcon}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                  </svg>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <button className={styles.viewButton}>View</button>
                          <button className={styles.moreButton}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Layout>

        {/* Create New Dialog */}
        {dialogOpen && (
          <div className={styles.dialogOverlay} onClick={handleCancel}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dialogHeader}>
                <h2 className={styles.dialogTitle}>Create New</h2>
                <button className={styles.dialogCloseButton} onClick={handleCancel} aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className={styles.dialogBody}>
                {/* Name Field */}
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Enter name"
                    required
                  />
                </div>

                {/* File Upload Area */}
                <div 
                  className={`${styles.uploadArea} ${isDragging ? styles.uploadAreaDragging : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <svg className={styles.uploadIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <p className={styles.uploadText}>
                    Drag & Drop or <button type="button" className={styles.uploadLink} onClick={() => document.getElementById('file-input').click()}>Choose file</button> to upload
                  </p>
                  <p className={styles.uploadFormats}>Supported formats: MP4, AVI, MOV, MP3, WAV</p>
                  <input
                    type="file"
                    id="file-input"
                    className={styles.fileInput}
                    onChange={handleFileSelect}
                    accept=".mp4,.avi,.mov,.mp3,.wav"
                  />
                </div>

                {/* Uploaded File Status */}
                {formData.file && (
                  <div className={styles.uploadedFile}>
                    <div className={styles.uploadedFileIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                      </svg>
                    </div>
                    <div className={styles.uploadedFileInfo}>
                      <div className={styles.uploadedFileName}>{formData.file.name}</div>
                      <div className={styles.uploadedFileSize}>{(formData.file.size / (1024 * 1024)).toFixed(2)} MB</div>
                      {isUploading && (
                        <div className={styles.uploadProgress}>
                          <div className={styles.uploadProgressBar}>
                            <div className={styles.uploadProgressFill} style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                          <span className={styles.uploadProgressText}>{uploadProgress}%</span>
                        </div>
                      )}
                    </div>
                    <button className={styles.uploadedFileRemove} onClick={handleRemoveFile} aria-label="Remove file">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                )}

                {/* Separator */}
                <div className={styles.uploadSeparator}>
                  <span>or</span>
                </div>

                {/* Import from URL */}
                <div className={styles.urlImportSection}>
                  <label htmlFor="fileUrl" className={styles.label}>Import from URL</label>
                  <div className={styles.urlInputGroup}>
                    <input
                      type="url"
                      id="fileUrl"
                      name="fileUrl"
                      value={formData.fileUrl}
                      onChange={handleInputChange}
                      className={styles.urlInput}
                      placeholder="Add file URL"
                    />
                    <button type="button" className={styles.urlUploadButton}>Upload</button>
                  </div>
                </div>
              </div>
              <div className={styles.dialogFooter}>
                <a href="#" className={styles.helpCenterLink}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Help Center
                </a>
                <div className={styles.dialogFooterButtons}>
                  <button className={styles.cancelButton} onClick={handleCancel}>
                    Cancel
                  </button>
                  <button className={styles.startButton} onClick={handleStart}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Animation */}
        {processingOpen && currentStep < processingSteps.length && (
          <div className={styles.processingOverlay}>
            <div className={styles.processingContainer}>
              <h2 className={styles.processingTitle}>Processing Video Extraction</h2>
              <div className={styles.currentStepContainer}>
                {processingSteps.map((step, index) => {
                  if (index === currentStep) {
                    const isLastStep = index === processingSteps.length - 1;
                    return (
                      <div key={step.id} className={styles.singleStep}>
                        <div className={`${styles.stepCircle} ${styles.stepCircleActive} ${styles[`stepCircle${step.number}`]} ${isLastStep ? styles.stepCircleLast : ''}`}>
                          <span className={styles.stepNumber}>{step.number}</span>
                        </div>
                        <div className={styles.stepLabelContainer}>
                          <span className={styles.stepLabelActive}>
                            {step.label}
                          </span>
                          {!isLastStep && (
                            <div className={styles.loadingDots}>
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

