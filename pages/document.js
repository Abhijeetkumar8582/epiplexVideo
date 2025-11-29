import { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from '../styles/Dashboard.module.css';

export default function Document() {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('transcribe');

  // Sample document data with extraction details
  const [documentData, setDocumentData] = useState([
    {
      id: 1,
      documentId: 'DOC-001',
      name: 'Document 1',
      type: 'Video',
      access: 'Public',
      fileSize: '15.2 MB',
      description: 'There should be three safety seals around the edges of the filter.',
      createdBy: 'You',
      createdDate: '5th Feb, 2023',
      createdOn: '5th Feb, 2023',
      avatar: 'https://ui-avatars.com/api/?name=You&background=random',
      documentLink: 'https://example.com/document1.pdf',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      transcribe: [
        { id: 1, text: 'Welcome to this video tutorial. Today we will learn about React.', timestamp: '0:00' },
        { id: 2, text: 'First, let\'s understand the basic concepts of React components.', timestamp: '0:15' },
        { id: 3, text: 'Components are the building blocks of React applications.', timestamp: '0:30' },
        { id: 4, text: 'They help us create reusable UI elements.', timestamp: '0:45' }
      ],
      voiceExtraction: 'This is the extracted voice content from the video. It contains all the spoken words and audio information processed during the extraction.',
      summary: 'This video tutorial covers the fundamentals of React, focusing on components as the core building blocks. It explains how components enable the creation of reusable UI elements in React applications.',
      pdfUrl: 'https://example.com/document1.pdf',
      steps: [
        { id: 1, timestamp: '0:00', description: 'Video upload initiated', metaTags: ['upload', 'video', 'mp4'] },
        { id: 2, timestamp: '0:05', description: 'Transcription process started', metaTags: ['transcribe', 'audio', 'speech'] },
        { id: 3, timestamp: '0:15', description: 'Keyframe extraction completed', metaTags: ['keyframe', 'extraction', 'frames'] },
        { id: 4, timestamp: '0:30', description: 'Document generation in progress', metaTags: ['document', 'generation', 'pdf'] },
        { id: 5, timestamp: '0:45', description: 'Processing completed successfully', metaTags: ['complete', 'success', 'final'] }
      ]
    },
    {
      id: 2,
      documentId: 'DOC-002',
      name: 'Document 2',
      type: 'Audio',
      access: 'Private',
      fileSize: '8.5 MB',
      description: 'Confirmation of property tax payment made up to date.',
      createdBy: 'Wade Warren',
      createdDate: 'Today 12:00 PM',
      createdOn: '4th Feb, 2023',
      avatar: 'https://ui-avatars.com/api/?name=Wade+Warren&background=random',
      documentLink: 'https://example.com/document2.pdf',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      transcribe: [
        { id: 1, text: 'Introduction to JavaScript programming language.', timestamp: '0:00' },
        { id: 2, text: 'We will cover variables, functions, and objects.', timestamp: '0:20' }
      ],
      voiceExtraction: 'JavaScript is a versatile programming language used for web development.',
      summary: 'A comprehensive introduction to JavaScript covering basic programming concepts.',
      pdfUrl: 'https://example.com/document2.pdf',
      steps: [
        { id: 1, timestamp: '0:00', description: 'Video processing started', metaTags: ['process', 'start'] },
        { id: 2, timestamp: '0:20', description: 'Audio extraction completed', metaTags: ['audio', 'extract'] }
      ]
    },
    {
      id: 3,
      documentId: 'DOC-003',
      name: 'Document 3',
      type: 'Video',
      access: 'Public',
      fileSize: '22.8 MB',
      description: 'Understanding CSS and styling in web development.',
      createdBy: 'John Doe',
      createdDate: 'Yesterday 3:45 PM',
      createdOn: '3rd Feb, 2023',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
      documentLink: 'https://example.com/document3.pdf',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      transcribe: [
        { id: 1, text: 'Understanding CSS and styling in web development.', timestamp: '0:00' },
        { id: 2, text: 'CSS helps us create beautiful and responsive designs.', timestamp: '0:18' }
      ],
      voiceExtraction: 'CSS is essential for styling web pages and creating attractive user interfaces.',
      summary: 'An overview of CSS and its role in modern web design and styling.',
      pdfUrl: 'https://example.com/document3.pdf',
      steps: [
        { id: 1, timestamp: '0:00', description: 'Initial processing', metaTags: ['init', 'process'] },
        { id: 2, timestamp: '0:18', description: 'Finalization step', metaTags: ['final', 'complete'] }
      ]
    }
  ]);

  const handleRowClick = (document) => {
    setSelectedDocument(document);
    setDetailViewOpen(true);
    setActiveTab('transcribe'); // Reset to first tab when opening
  };

  const handleCloseDetail = () => {
    setDetailViewOpen(false);
    setSelectedDocument(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation(); // Prevent row click
    setDocumentData(documentData.filter(item => item.id !== id));
  };

  const handleEdit = (e, document) => {
    e.stopPropagation(); // Prevent row click
    setSelectedDocument(document);
    setDetailViewOpen(true);
    setActiveTab('transcribe'); // Reset to first tab when opening
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Documents - Epiplex',
    description: 'Browse and manage your processed documents. View transcriptions, voice extractions, summaries, and PDF documents.',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: documentData.length,
      itemListElement: documentData.map((doc, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Document',
          name: doc.name,
          description: doc.summary
        }
      }))
    }
  };

  return (
    <>
      <SEO
        title="Documents"
        description="Browse and manage your processed documents. View detailed transcriptions, voice extractions, AI-generated summaries, and access PDF documents from your video processing tasks."
        keywords="documents, processed documents, transcriptions, voice extraction, document management, PDF documents, video transcripts"
        structuredData={structuredData}
      />
      <div className={styles.dashboard}>
        <Layout>
          <div className={styles.contentHeader}>
            <h1 className={styles.pageTitle}>My Documents</h1>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.documentTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Document Id</th>
                  <th>Type</th>
                  <th>Access</th>
                  <th>File Size</th>
                  <th>Username</th>
                  <th>Created On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documentData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={styles.emptyState}>
                      No documents available
                    </td>
                  </tr>
                ) : (
                  documentData.map((item) => (
                    <tr 
                      key={item.id} 
                      className={styles.documentTableRow}
                      onClick={() => handleRowClick(item)}
                    >
                      <td>
                        <div className={styles.documentNameCell}>
                          <div className={styles.documentIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                          </div>
                          <div className={styles.documentNameInfo}>
                            <div className={styles.documentName}>{item.name}</div>
                            <div className={styles.documentUploadDate}>Uploaded {item.createdOn}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.documentId}>{item.documentId}</span>
                      </td>
                      <td>
                        <span className={styles.documentType}>{item.type}</span>
                      </td>
                      <td>
                        <span className={`${styles.documentAccess} ${item.access === 'Public' ? styles.documentAccessPublic : styles.documentAccessPrivate}`}>
                          {item.access}
                        </span>
                      </td>
                      <td>
                        <span className={styles.documentFileSize}>{item.fileSize}</span>
                      </td>
                      <td>
                        <div className={styles.documentUsernameCell}>
                          <img 
                            src={item.avatar} 
                            alt={item.createdBy}
                            className={styles.documentUserAvatar}
                          />
                          <span className={styles.documentUsername}>{item.createdBy}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.documentCreatedOn}>{item.createdOn}</span>
                      </td>
                      <td>
                        <div className={styles.documentTableActions}>
                          <button
                            className={styles.documentTableEditButton}
                            onClick={(e) => handleEdit(e, item)}
                            title="Edit"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            className={styles.documentTableDeleteButton}
                            onClick={(e) => handleDelete(e, item.id)}
                            title="Delete"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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

        {/* Document Detail View */}
        {detailViewOpen && selectedDocument && (
          <div className={styles.detailOverlay} onClick={handleCloseDetail}>
            <div className={styles.detailContainer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailTitle}>{selectedDocument.name}</h2>
                <button className={styles.closeButton} onClick={handleCloseDetail}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Tab Navigation */}
              <nav className={styles.tabNavigation} role="tablist" aria-label="Document sections">
                <button
                  className={`${styles.tabButton} ${activeTab === 'transcribe' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('transcribe')}
                  role="tab"
                  aria-selected={activeTab === 'transcribe'}
                  aria-controls="transcribe-panel"
                >
                  Transcribe
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === 'voice' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('voice')}
                  role="tab"
                  aria-selected={activeTab === 'voice'}
                  aria-controls="voice-panel"
                >
                  Voice Extraction
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === 'summary' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('summary')}
                  role="tab"
                  aria-selected={activeTab === 'summary'}
                  aria-controls="summary-panel"
                >
                  Summary
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === 'audio' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('audio')}
                  role="tab"
                  aria-selected={activeTab === 'audio'}
                  aria-controls="audio-panel"
                >
                  Audio
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === 'pdf' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('pdf')}
                  role="tab"
                  aria-selected={activeTab === 'pdf'}
                  aria-controls="pdf-panel"
                >
                  PDF
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === 'steps' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('steps')}
                  role="tab"
                  aria-selected={activeTab === 'steps'}
                  aria-controls="steps-panel"
                >
                  Steps
                </button>
              </nav>

              <article className={styles.detailContent}>
                {/* Transcribe Tab */}
                {activeTab === 'transcribe' && (
                  <section 
                    id="transcribe-panel"
                    className={styles.tabPanel}
                    role="tabpanel"
                    aria-labelledby="transcribe-tab"
                  >
                    <div className={styles.transcribeContainer} role="region" aria-label="Transcription content">
                      {selectedDocument.transcribe.map((item, index) => (
                        <div key={item.id} className={styles.transcribeRow} itemScope itemType="https://schema.org/Text">
                          <time className={styles.transcribeTimestamp} dateTime={item.timestamp}>{item.timestamp}</time>
                          <p className={styles.transcribeText} itemProp="text">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Voice Extraction Tab */}
                {activeTab === 'voice' && (
                  <section 
                    id="voice-panel"
                    className={styles.tabPanel}
                    role="tabpanel"
                    aria-labelledby="voice-tab"
                  >
                    <div className={styles.voiceExtractionBox} role="region" aria-label="Voice extraction content">
                      <p>{selectedDocument.voiceExtraction}</p>
                    </div>
                  </section>
                )}

                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <section 
                    id="summary-panel"
                    className={styles.tabPanel}
                    role="tabpanel"
                    aria-labelledby="summary-tab"
                  >
                    <div className={styles.summaryBox} role="region" aria-label="Document summary">
                      <p>{selectedDocument.summary}</p>
                    </div>
                  </section>
                )}

                {/* Audio Tab */}
                {activeTab === 'audio' && selectedDocument.audioUrl && (
                  <section 
                    id="audio-panel"
                    className={styles.tabPanel}
                    role="tabpanel"
                    aria-labelledby="audio-tab"
                  >
                    <div className={styles.audioContainer}>
                      <audio
                        controls
                        className={styles.audioPlayer}
                        aria-label={`Audio player for ${selectedDocument.name}`}
                      >
                        <source src={selectedDocument.audioUrl} type="audio/mpeg" />
                        <source src={selectedDocument.audioUrl} type="audio/mp3" />
                        Your browser does not support the audio element.
                      </audio>
                      <div className={styles.audioInfo}>
                        <a
                          href={selectedDocument.audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.audioLink}
                          aria-label={`Download audio file for ${selectedDocument.name}`}
                        >
                          Download Audio
                        </a>
                      </div>
                    </div>
                  </section>
                )}

                {/* PDF Tab */}
                {activeTab === 'pdf' && (
                  <section 
                    id="pdf-panel"
                    className={styles.tabPanel}
                    role="tabpanel"
                    aria-labelledby="pdf-tab"
                  >
                    <div className={styles.pdfContainer}>
                      <iframe
                        src={selectedDocument.pdfUrl}
                        className={styles.pdfViewer}
                        title={`PDF Document: ${selectedDocument.name}`}
                        aria-label={`PDF viewer for ${selectedDocument.name}`}
                      />
                      <div className={styles.pdfActions}>
                        <a
                          href={selectedDocument.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.pdfLink}
                          aria-label={`Open ${selectedDocument.name} PDF in new tab`}
                        >
                          Open in New Tab
                        </a>
                      </div>
                    </div>
                  </section>
                )}

                {/* Steps Tab */}
                {activeTab === 'steps' && (
                  <section 
                    id="steps-panel"
                    className={styles.tabPanel}
                    role="tabpanel"
                    aria-labelledby="steps-tab"
                  >
                    <div className={styles.stepTableContainer}>
                      <table className={styles.stepTable}>
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Description</th>
                            <th>Meta Tags</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDocument.steps && selectedDocument.steps.length > 0 ? (
                            selectedDocument.steps.map((step) => (
                              <tr key={step.id}>
                                <td className={styles.stepTimestamp}>{step.timestamp}</td>
                                <td className={styles.stepDescription}>{step.description}</td>
                                <td className={styles.stepMetaTags}>
                                  <div className={styles.metaTagsContainer}>
                                    {step.metaTags.map((tag, index) => (
                                      <span key={index} className={styles.metaTag}>
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className={styles.emptyState}>
                                No steps available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </article>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
