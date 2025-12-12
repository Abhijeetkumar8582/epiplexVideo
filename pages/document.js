import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from '../styles/Dashboard.module.css';
import { logPageView, logDocumentView } from '../lib/activityLogger';
import { getVideosPanel, getDocument } from '../lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Document() {
  const router = useRouter();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('transcribe');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;
  const [isInitialMount, setIsInitialMount] = useState(true);

  useEffect(() => {
    // Log page view
    logPageView('Documents');
    
    // Fetch videos on initial load
    fetchVideos(1);
    setIsInitialMount(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when page changes (skip initial mount)
  useEffect(() => {
    if (!isInitialMount) {
      fetchVideos(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Handle query parameter to open specific document
  useEffect(() => {
    if (router.query.video && videos && videos.length > 0) {
      const video = videos.find(v => v.video_file_number === router.query.video);
      if (video) {
        handleRowClick(video);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.video, videos]);

  const fetchVideos = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await getVideosPanel({ 
        page: page, 
        page_size: pageSize,
        sort_by: 'updated_at',
        sort_order: 'desc'
      });
      if (response && response.videos && Array.isArray(response.videos)) {
        // Map API response to document format
        const mappedVideos = response.videos.map((video, index) => ({
          id: video.id,
          documentId: video.video_file_number || `DOC-${String((page - 1) * pageSize + index + 1).padStart(3, '0')}`,
          name: video.name || 'Untitled Video',
          type: 'Video',
          access: 'Public',
          fileSize: video.video_size_bytes ? `${(video.video_size_bytes / (1024 * 1024)).toFixed(1)} MB` : 'N/A',
          description: video.application_name || 'Video document',
          createdBy: 'You',
          createdDate: video.created_at ? new Date(video.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }) : 'N/A',
          createdOn: video.created_at ? new Date(video.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }) : 'N/A',
          avatar: 'https://ui-avatars.com/api/?name=You&background=random',
          video_file_number: video.video_file_number,
          status: video.status,
          video_id: video.id
        }));
        setVideos(mappedVideos);
        
        // Update pagination info
        if (response.total !== undefined) {
          setTotalRecords(response.total);
          setTotalPages(Math.ceil(response.total / pageSize));
        }
      } else {
        // Set empty array if no videos
        setVideos([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Set empty array on error
      setVideos([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchDocumentData = useCallback(async (videoFileNumber) => {
    try {
      const data = await getDocument(videoFileNumber);
      setDocumentData(data || null);
      
      // Update selected document with real data
      setSelectedDocument(prev => {
        if (prev && data) {
          return {
            ...prev,
            transcript: data.transcript || null,
            transcribe: (data.frames && Array.isArray(data.frames)) 
              ? data.frames.map((frame, index) => ({
                  id: frame.frame_id || index + 1,
                  text: frame.description || frame.ocr_text || '',
                  timestamp: formatTimestamp(frame.timestamp)
                }))
              : [],
            voiceExtraction: (data.frames && Array.isArray(data.frames))
              ? data.frames.map(f => f.description || f.ocr_text || '').filter(Boolean).join(' ') 
              : 'No voice extraction available',
            summary: data.summary || 'No summary available',
            steps: (data.frames && Array.isArray(data.frames))
              ? data.frames.map((frame, index) => ({
                  id: frame.frame_id || index + 1,
                  timestamp: formatTimestamp(frame.timestamp),
                  description: frame.description || frame.ocr_text || 'Frame analysis',
                  metaTags: frame.ocr_text ? ['ocr', 'text'] : frame.gpt_response ? ['gpt', 'analysis'] : ['frame', 'analysis']
                }))
              : []
          };
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to fetch document:', error);
      // Set empty data on error
      setDocumentData(null);
    }
  }, []);

  // Removed dummy data - using real data from API

  const handleRowClick = useCallback(async (document) => {
    if (!document) return;
    
    setSelectedDocument(document);
    setDetailViewOpen(true);
    setActiveTab('transcribe'); // Reset to first tab when opening
    setDocumentData(null); // Clear previous document data
    
    // Log document view
    if (document && document.video_file_number) {
      logDocumentView(document.video_file_number, {
        video_id: document.id,
        name: document.name || 'Unknown'
      });
      
      // Fetch full document data if video_file_number is available
      await fetchDocumentData(document.video_file_number);
    } else {
      // If no video_file_number, set empty data
      setDocumentData(null);
    }
  }, [fetchDocumentData]);

  const handleCloseDetail = () => {
    setDetailViewOpen(false);
    setSelectedDocument(null);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent row click
    try {
      // TODO: Call delete API endpoint
      // await deleteUpload(id);
      // Refresh the list
      await fetchVideos(currentPage);
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete document. Please try again.');
    }
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
      numberOfItems: videos?.length || 0,
      itemListElement: (videos || []).map((doc, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Document',
          name: doc.name,
          description: doc.description || ''
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
                {loading ? (
                  <tr>
                    <td colSpan="8" className={styles.emptyState}>
                      Loading documents...
                    </td>
                  </tr>
                ) : !videos || videos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={styles.emptyState}>
                      No documents available
                    </td>
                  </tr>
                ) : (
                  videos.map((item, index) => (
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
                          <Image 
                            src={item.avatar} 
                            alt={item.createdBy}
                            width={32}
                            height={32}
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

          {/* Pagination */}
          {!loading && totalRecords > 0 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationInfo}>
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
              </div>
              {totalPages > 1 && (
                <div className={styles.paginationControls}>
                  <button
                    className={styles.paginationButton}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Previous
                  </button>
                  <div className={styles.paginationNumbers}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`${styles.paginationNumber} ${currentPage === pageNum ? styles.paginationNumberActive : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className={styles.paginationButton}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </Layout>

        {/* Document Detail View */}
        {detailViewOpen && selectedDocument && selectedDocument !== null && (
          <div className={styles.detailOverlay} onClick={handleCloseDetail}>
            <div className={styles.detailContainer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailTitle}>{selectedDocument?.name || 'Document'}</h2>
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
                      {(() => {
                        // Get transcript from documentData or selectedDocument
                        const transcript = documentData?.transcript || selectedDocument?.transcript;
                        
                        if (transcript) {
                          return (
                            <div className={styles.transcriptContainer}>
                              <h3 className={styles.transcriptTitle}>Transcription</h3>
                              <div className={styles.transcriptText}>
                                {transcript.split('\n').map((line, index) => (
                                  <p key={index}>{line || '\u00A0'}</p>
                                ))}
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className={styles.emptyState}>
                              No transcription data available. The video may still be processing.
                            </div>
                          );
                        }
                      })()}
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
                      <p>
                        {(() => {
                          // Use documentData if available
                          if (documentData?.frames && Array.isArray(documentData.frames)) {
                            const voiceText = documentData.frames
                              .map(f => f.description || f.ocr_text || '')
                              .filter(Boolean)
                              .join(' ');
                            return voiceText || 'No voice extraction data available. The video may still be processing.';
                          }
                          return selectedDocument?.voiceExtraction || 'No voice extraction data available. The video may still be processing.';
                        })()}
                      </p>
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
                      <p>{selectedDocument?.summary || documentData?.summary || 'No summary available. The video may still be processing.'}</p>
                    </div>
                  </section>
                )}

                {/* Audio Tab */}
                {activeTab === 'audio' && (
                  <section 
                    id="audio-panel"
                    className={styles.tabPanel}
                    role="tabpanel"
                    aria-labelledby="audio-tab"
                  >
                    <div className={styles.audioContainer}>
                      {(() => {
                        // Get step progress from documentData or job status
                        const stepProgress = documentData?.job_status?.step_progress || {};
                        const extractAudioStatus = stepProgress.extract_audio || 'pending';
                        
                        // Get video file number for constructing audio URL
                        const videoFileNumber = documentData?.video_metadata?.video_file_number || 
                                                selectedDocument?.video_file_number;
                        
                        // Get audio URL - prioritize direct audio_url, then construct from video_file_number
                        let audioUrl = documentData?.video_metadata?.audio_url || 
                                      selectedDocument?.audioUrl;
                        
                        // If no direct audio_url, construct from video_file_number
                        if (!audioUrl && videoFileNumber) {
                          audioUrl = `${API_BASE_URL || 'http://localhost:8000'}/api/videos/file-number/${videoFileNumber}/audio`;
                        }
                        
                        // If audio URL exists (either from DB or constructed), show audio player
                        // This ensures audio is shown even if step_progress isn't updated yet
                        if (audioUrl) {
                          return (
                            <>
                              <div className={styles.audioStepStatus}>
                                <div className={styles.stepStatusHeader}>
                                  <div className={styles.stepStatusIcon}>
                                    <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <polyline points="20 6 9 17 4 12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                  <div className={styles.stepStatusInfo}>
                                    <h3 className={styles.stepStatusTitle}>Audio Extraction Complete</h3>
                                    <p className={styles.stepStatusDescription}>
                                      Audio has been successfully extracted from the video.
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <audio
                                controls
                                className={styles.audioPlayer}
                                aria-label={`Audio player for ${selectedDocument?.name || 'document'}`}
                                preload="metadata"
                              >
                                <source src={audioUrl} type="audio/mpeg" />
                                <source src={audioUrl} type="audio/mp3" />
                                Your browser does not support the audio element.
                              </audio>
                              <div className={styles.audioInfo}>
                                <a
                                  href={audioUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.audioLink}
                                  download={`audio_${videoFileNumber || 'video'}.mp3`}
                                  aria-label={`Download audio file for ${selectedDocument?.name || 'document'}`}
                                >
                                  Download Audio
                                </a>
                              </div>
                            </>
                          );
                        }
                        
                        // Show step status based on extraction progress
                        if (extractAudioStatus === 'processing') {
                          return (
                            <div className={styles.audioStepStatus}>
                              <div className={styles.stepStatusHeader}>
                                <div className={styles.stepStatusIcon}>
                                  <span className={styles.stepStatusSpinner}>🎵</span>
                                </div>
                                <div className={styles.stepStatusInfo}>
                                  <h3 className={styles.stepStatusTitle}>Extracting Audio</h3>
                                  <p className={styles.stepStatusDescription}>
                                    Audio extraction is in progress. Please wait...
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className={styles.emptyState}>
                              <div className={styles.audioStepStatus}>
                                <div className={styles.stepStatusHeader}>
                                  <div className={styles.stepStatusIcon}>
                                    <span>⏳</span>
                                  </div>
                                  <div className={styles.stepStatusInfo}>
                                    <h3 className={styles.stepStatusTitle}>Audio Extraction Pending</h3>
                                    <p className={styles.stepStatusDescription}>
                                      Audio extraction has not started yet. The video may still be processing.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })()}
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
                      {selectedDocument?.pdfUrl || documentData?.video_metadata?.video_file_number || selectedDocument?.video_file_number ? (
                        <>
                          {/* TODO: Generate PDF URL from video_file_number or job_id */}
                          <div className={styles.emptyState}>
                            PDF generation is in progress. Please check back later or download the document from the process data page.
                          </div>
                          {(selectedDocument?.video_file_number || documentData?.video_metadata?.video_file_number) && (
                            <div className={styles.pdfActions}>
                              <a
                                href={`/api/download/${selectedDocument?.video_file_number || documentData?.video_metadata?.video_file_number}?format=pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.pdfLink}
                                aria-label={`Download PDF for ${selectedDocument?.name || 'document'}`}
                              >
                                Download PDF
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={styles.emptyState}>
                          PDF not available. The document may still be processing.
                        </div>
                      )}
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
                          {(() => {
                            // Use documentData if available, otherwise use selectedDocument
                            let stepsData = [];
                            
                            if (documentData?.frames && Array.isArray(documentData.frames)) {
                              stepsData = documentData.frames.map((frame, index) => ({
                                id: frame.frame_id || index + 1,
                                timestamp: formatTimestamp(frame.timestamp),
                                description: frame.description || frame.ocr_text || 'Frame analysis',
                                metaTags: frame.ocr_text ? ['ocr', 'text'] : frame.gpt_response ? ['gpt', 'analysis'] : ['frame', 'analysis']
                              }));
                            } else if (selectedDocument?.steps && Array.isArray(selectedDocument.steps)) {
                              stepsData = selectedDocument.steps;
                            }
                            
                            return stepsData && stepsData.length > 0 ? (
                              stepsData.map((step, index) => (
                                <tr key={step.id || index}>
                                  <td className={styles.stepTimestamp}>{step.timestamp || '0:00'}</td>
                                  <td className={styles.stepDescription}>{step.description || 'Frame analysis'}</td>
                                  <td className={styles.stepMetaTags}>
                                    <div className={styles.metaTagsContainer}>
                                      {step.metaTags && Array.isArray(step.metaTags) && step.metaTags.length > 0 ? (
                                        step.metaTags.map((tag, tagIndex) => (
                                          <span key={tagIndex} className={styles.metaTag}>
                                            {tag}
                                          </span>
                                        ))
                                      ) : (
                                        <span className={styles.metaTag}>frame</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="3" className={styles.emptyState}>
                                  No frame analysis steps available. The video may still be processing.
                                </td>
                              </tr>
                            );
                          })()}
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
