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
    link: ''
  });

  const processingSteps = [
    { id: 1, label: 'Transcribe', number: '1' },
    { id: 2, label: 'Keyframe', number: '2' },
    { id: 3, label: 'Video Context', number: '3' },
    { id: 4, label: 'Processing Video', number: '4' },
    { id: 5, label: 'Saving in Database', number: '5' },
    { id: 6, label: 'Creating File', number: '6' },
    { id: 7, label: 'Ready', number: '7' }
  ];

  // Sample data - replace with actual data from API
  const [tableData, setTableData] = useState([
    {
      id: 1,
      name: 'Sample Document 1',
      duration: '5:30',
      link: 'https://example.com/doc1',
      status: 'Completed'
    },
    {
      id: 2,
      name: 'Sample Document 2',
      duration: '3:45',
      link: 'https://example.com/doc2',
      status: 'Processing'
    },
    {
      id: 3,
      name: 'Sample Document 3',
      duration: '7:20',
      link: 'https://example.com/doc3',
      status: 'Pending'
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
    setFormData({ name: '', link: '' });
  };

  const handleStart = () => {
    if (!formData.name || !formData.link) {
      return;
    }

    const entryId = Date.now();
    const newEntry = {
      id: entryId,
      name: formData.name,
      duration: '0:00',
      link: formData.link,
      status: 'Processing'
    };

    setTableData(prev => [newEntry, ...prev]);
    setNewEntryId(entryId);
    
    setDialogOpen(false);
    setProcessingOpen(true);
    setCurrentStep(0);
    setFormData({ name: '', link: '' });
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
              setTableData(prev => 
                prev.map(item => 
                  item.id === newEntryId 
                    ? { ...item, status: 'Completed' }
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
      case 'Processing':
        return styles.statusProcessing;
      case 'Pending':
        return styles.statusPending;
      default:
        return '';
    }
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
          <div className={styles.contentHeader}>
            <h1 className={styles.pageTitle}>Process Data</h1>
            <button className={styles.createButton} onClick={handleCreateNew}>Create New</button>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Duration</th>
                  <th>Link</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={styles.emptyState}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  tableData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.duration}</td>
                      <td>
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                          {item.link}
                        </a>
                      </td>
                      <td>
                        <span className={`${styles.status} ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.editButton}
                            onClick={() => handleEdit(item.id)}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                          >
                            Delete
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
              </div>
              <div className={styles.dialogBody}>
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
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="link" className={styles.label}>Link</label>
                  <input
                    type="text"
                    id="link"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Enter link"
                  />
                </div>
              </div>
              <div className={styles.dialogFooter}>
                <button className={styles.cancelButton} onClick={handleCancel}>
                  Cancel
                </button>
                <button className={styles.startButton} onClick={handleStart}>
                  Start
                </button>
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

