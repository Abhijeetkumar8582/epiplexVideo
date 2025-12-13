import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from '../styles/Dashboard.module.css';
import { logPageView, logDocumentView } from '../lib/activityLogger';
import { getVideosPanel, getDocument, bulkDeleteUploads, getVideoSummaries } from '../lib/api';
import dataCache, { CACHE_DURATION } from '../lib/dataCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Document() {
  const router = useRouter();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('transcribe');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [summariesLoading, setSummariesLoading] = useState(false);
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
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
      // Clear selection when page changes
      setSelectedItems(new Set());
      setSelectAll(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Update select all state when videos or selection changes
  useEffect(() => {
    if (videos.length > 0) {
      const allCurrentPageIds = videos.map(v => v.id);
      const allSelected = allCurrentPageIds.length > 0 && 
                         allCurrentPageIds.every(id => selectedItems.has(id));
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, videos]);

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

  const getCacheKey = (page) => `document:videos:page:${page}`;

  const fetchVideos = async (page = currentPage) => {
    const cacheKey = getCacheKey(page);
    
    // Check cache first
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      setVideos(cachedData.videos);
      setTotalRecords(cachedData.totalRecords);
      setTotalPages(cachedData.totalPages);
      setLoading(false);
      return;
    }

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
        const totalRecords = response.total !== undefined ? response.total : 0;
        const totalPages = Math.ceil(totalRecords / pageSize);
        
        setTotalRecords(totalRecords);
        setTotalPages(totalPages);

        // Cache the data
        dataCache.set(cacheKey, {
          videos: mappedVideos,
          totalRecords,
          totalPages
        }, CACHE_DURATION.VIDEO_LIST);
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
    const cacheKey = `document:data:${videoFileNumber}`;
    
    // Check cache first
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      setDocumentData(cachedData);
      // Update selected document with cached data
      setSelectedDocument(prev => {
        if (prev && cachedData) {
          return {
            ...prev,
            transcript: cachedData.transcript || null,
            transcribe: (cachedData.frames && Array.isArray(cachedData.frames)) 
              ? cachedData.frames.map((frame, index) => ({
                  id: frame.frame_id || index + 1,
                  text: frame.description || frame.ocr_text || '',
                  timestamp: formatTimestamp(frame.timestamp)
                }))
              : [],
            voiceExtraction: (cachedData.frames && Array.isArray(cachedData.frames))
              ? cachedData.frames.map(f => f.description || f.ocr_text || '').filter(Boolean).join(' ') 
              : 'No voice extraction available',
            summary: cachedData.summary || 'No summary available',
            steps: (cachedData.frames && Array.isArray(cachedData.frames))
              ? cachedData.frames.map((frame, index) => ({
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
      return;
    }

    try {
      const data = await getDocument(videoFileNumber);
      setDocumentData(data || null);
      
      // Cache the data
      if (data) {
        dataCache.set(cacheKey, data, CACHE_DURATION.DOCUMENT_DATA);
      }
      
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
              ? data.frames.map((frame, index) => {
                  // Extract meta_tags from gpt_response if available
                  let metaTags = ['frame', 'analysis'];
                  if (frame.gpt_response) {
                    if (Array.isArray(frame.gpt_response.meta_tags)) {
                      metaTags = frame.gpt_response.meta_tags;
                    } else if (frame.gpt_response.meta_tags) {
                      metaTags = [frame.gpt_response.meta_tags];
                    }
                  }
                  // Fallback to old logic if no meta_tags
                  if (metaTags.length === 0 || (metaTags.length === 1 && metaTags[0] === 'frame')) {
                    metaTags = frame.ocr_text ? ['ocr', 'text'] : frame.gpt_response ? ['gpt', 'analysis'] : ['frame', 'analysis'];
                  }
                  
                  return {
                    id: frame.frame_id || index + 1,
                    timestamp: formatTimestamp(frame.timestamp),
                    description: frame.description || frame.ocr_text || 'Frame analysis',
                    metaTags: metaTags
                  };
                })
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
  
  const fetchSummaries = useCallback(async (videoId) => {
    if (!videoId) {
      console.warn('fetchSummaries called without videoId');
      return;
    }
    
    try {
      setSummariesLoading(true);
      console.log('Calling getVideoSummaries with videoId:', videoId);
      const data = await getVideoSummaries(videoId);
      console.log('Summaries response:', data);
      // Handle both response formats: {summaries: [...]} or direct array
      let summariesList = [];
      if (Array.isArray(data)) {
        summariesList = data;
      } else if (data && data.summaries && Array.isArray(data.summaries)) {
        summariesList = data.summaries;
      } else if (data && Array.isArray(data)) {
        summariesList = data;
      }
      
      if (summariesList.length > 0) {
        setSummaries(summariesList);
        console.log('Set summaries:', summariesList.length);
      } else {
        console.log('No summaries in response');
        setSummaries([]);
      }
    } catch (error) {
      console.error('Failed to fetch summaries:', error);
      console.error('Error details:', error.response?.data || error.message);
      setSummaries([]);
    } finally {
      setSummariesLoading(false);
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
      
      // Fetch summaries if video_id is available
      // Try both id and video_id fields
      const videoId = document.id || document.video_id || document.video_id;
      if (videoId) {
        console.log('Fetching summaries for video_id:', videoId, 'from document:', document);
        await fetchSummaries(videoId);
      } else {
        console.warn('No video ID found in document:', document);
        setSummaries([]);
      }
    } else {
      // If no video_file_number, set empty data
      setDocumentData(null);
      setSummaries([]);
    }
  }, [fetchDocumentData, fetchSummaries]);

  // Refetch summaries when documentData is loaded (in case video_id wasn't available initially)
  useEffect(() => {
    if (documentData?.video_metadata?.video_id && summaries.length === 0 && !summariesLoading && selectedDocument) {
      const videoId = documentData.video_metadata.video_id;
      console.log('Refetching summaries after documentData loaded with video_id:', videoId);
      fetchSummaries(videoId);
    }
  }, [documentData?.video_metadata?.video_id, summaries.length, summariesLoading, selectedDocument, fetchSummaries]);

  // Refetch summaries when switching to summary tab if we have a video ID but no summaries
  useEffect(() => {
    if (activeTab === 'summary' && selectedDocument && summaries.length === 0 && !summariesLoading) {
      const videoId = selectedDocument.id || selectedDocument.video_id || documentData?.video_metadata?.video_id;
      if (videoId) {
        console.log('Refetching summaries when switching to summary tab');
        fetchSummaries(videoId);
      }
    }
  }, [activeTab, selectedDocument, summaries.length, summariesLoading, documentData, fetchSummaries]);

  const handleCloseDetail = () => {
    setDetailViewOpen(false);
    setSelectedDocument(null);
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    const isChecked = e.target.checked;
    
    if (isChecked && videos.length > 0) {
      // Select all items on current page
      const allIds = new Set(videos.map(video => video.id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        allIds.forEach(id => newSet.add(id));
        return newSet;
      });
    } else {
      // Deselect all items on current page only
      const currentPageIds = new Set(videos.map(video => video.id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        currentPageIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleSelectItem = (e, id) => {
    e.stopPropagation();
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === videos.length && videos.length > 0);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one document to delete.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${selectedItems.size} document(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const uploadIds = Array.from(selectedItems);
      const response = await bulkDeleteUploads(uploadIds, true); // permanent delete
      
      // Clear cache
      dataCache.clearByPattern('document:videos:');
      dataCache.clearByPattern('dashboard:');
      
      // Clear selection
      setSelectedItems(new Set());
      setSelectAll(false);
      
      // Refresh the list
      await fetchVideos(currentPage);
      
      alert(response.message || `Successfully deleted ${response.deleted_count || selectedItems.size} document(s)`);
    } catch (error) {
      console.error('Failed to delete documents:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete documents. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent row click
    if (!confirm('Are you sure you want to permanently delete this document? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await bulkDeleteUploads([id], true); // permanent delete
      
      // Clear cache
      dataCache.clearByPattern('document:videos:');
      dataCache.clearByPattern('dashboard:');
      
      // Refresh the list
      await fetchVideos(currentPage);
      
      alert(response.message || 'Document deleted successfully');
    } catch (error) {
      console.error('Failed to delete:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete document. Please try again.';
      alert(errorMessage);
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

          {/* Filter and Action Section */}
          <div className={styles.filterSection} style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div className={styles.filterLeft}>
              {/* Filter options can be added here */}
            </div>
            <div className={styles.filterRight} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {selectedItems.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                  onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Delete Selected ({selectedItems.size})
                </button>
              )}
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.documentTable}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      aria-label="Select all documents"
                    />
                  </th>
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
                    <td colSpan="9" className={styles.emptyState}>
                      Loading documents...
                    </td>
                  </tr>
                ) : !videos || videos.length === 0 ? (
                  <tr>
                    <td colSpan="9" className={styles.emptyState}>
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
                      <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={(e) => handleSelectItem(e, item.id)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                          aria-label={`Select ${item.name}`}
                        />
                      </td>
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
                      {summariesLoading ? (
                        <p>Loading summaries...</p>
                      ) : summaries.length > 0 ? (
                        <div>
                          {summaries.map((summary, index) => (
                            <div key={summary.id || index} style={{ marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                              <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                                Batch {summary.batch_number} of {summary.total_batches || summaries.length}
                                {summary.batch_start_frame && summary.batch_end_frame && (
                                  <span style={{ fontSize: '14px', color: '#666', marginLeft: '8px' }}>
                                    (Frames {summary.batch_start_frame}-{summary.batch_end_frame})
                                  </span>
                                )}
                              </h3>
                              <p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>{summary.summary_text}</p>
                              {summary.created_at && (
                                <p style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                                  Generated: {new Date(summary.created_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No summaries available. The video may still be processing or summaries have not been generated yet.</p>
                      )}
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
                      {(() => {
                        // Try multiple ways to get video ID
                        const videoId = selectedDocument?.id || selectedDocument?.video_id || documentData?.video_metadata?.video_id;
                        const summaryPdfUrl = documentData?.summary_pdf_url || documentData?.video_metadata?.summary_pdf_url;
                        const videoFileNumber = selectedDocument?.video_file_number || documentData?.video_metadata?.video_file_number;
                        
                        console.log('PDF Tab - videoId:', videoId, 'summaryPdfUrl:', summaryPdfUrl, 'documentData:', documentData);
                        
                        // Always try to use the API endpoint if we have a videoId
                        // The backend will handle checking if the PDF exists
                        let pdfUrl = null;
                        if (videoId) {
                          pdfUrl = `${API_BASE_URL || 'http://localhost:8000'}/api/videos/${videoId}/summary-pdf`;
                          console.log('Constructed PDF URL from videoId:', pdfUrl);
                        } else if (summaryPdfUrl) {
                          // Fallback: if we have a direct URL, use it
                          if (summaryPdfUrl.startsWith('http')) {
                            pdfUrl = summaryPdfUrl;
                          } else {
                            // Relative path - try to construct API URL if we can get videoId from documentData
                            const fallbackVideoId = documentData?.video_metadata?.video_id;
                            if (fallbackVideoId) {
                              pdfUrl = `${API_BASE_URL || 'http://localhost:8000'}/api/videos/${fallbackVideoId}/summary-pdf`;
                            }
                          }
                          console.log('Constructed PDF URL from summaryPdfUrl:', pdfUrl);
                        }
                        
                        if (!pdfUrl && !videoId) {
                          return (
                            <div className={styles.emptyState}>
                              <p>No PDF available. The video may still be processing or the summary PDF has not been generated yet.</p>
                            </div>
                          );
                        }
                          
                        if (pdfUrl) {
                          // Add token to PDF URL for iframe authentication
                          const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
                          const pdfUrlWithAuth = token ? `${pdfUrl}?token=${encodeURIComponent(token)}` : pdfUrl;
                          
                          return (
                            <>
                              <div style={{ width: '100%', height: '800px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                                <iframe
                                  src={pdfUrlWithAuth}
                                  style={{ width: '100%', height: '100%', border: 'none' }}
                                  title={`PDF viewer for ${selectedDocument?.name || 'document'}`}
                                />
                              </div>
                              <div className={styles.pdfActions} style={{ marginTop: '16px' }}>
                                <a
                                  href={pdfUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.pdfLink}
                                  download={`${videoFileNumber || 'summary'}_summary.pdf`}
                                  aria-label={`Download PDF for ${selectedDocument?.name || 'document'}`}
                                  style={{ 
                                    display: 'inline-block',
                                    padding: '10px 20px',
                                    background: '#667eea',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '500'
                                  }}
                                >
                                  Download PDF
                                </a>
                              </div>
                            </>
                          );
                        } else {
                          return (
                            <div className={styles.emptyState}>
                              PDF not available. The document may still be processing or summary PDF has not been generated yet.
                            </div>
                          );
                        }
                      })()}
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
                              stepsData = documentData.frames.map((frame, index) => {
                                // Extract meta_tags from GPT response dynamically
                                let metaTags = ['frame', 'analysis']; // Default fallback
                                
                                if (frame.gpt_response && frame.gpt_response.meta_tags) {
                                  // Use meta_tags from GPT response if available
                                  metaTags = Array.isArray(frame.gpt_response.meta_tags) 
                                    ? frame.gpt_response.meta_tags 
                                    : ['gpt', 'analysis'];
                                } else if (frame.ocr_text) {
                                  // Fallback to OCR tags if no GPT meta_tags
                                  metaTags = ['ocr', 'text'];
                                } else if (frame.gpt_response) {
                                  // Has GPT response but no meta_tags
                                  metaTags = ['gpt', 'analysis'];
                                }
                                
                                return {
                                  id: frame.frame_id || index + 1,
                                  timestamp: formatTimestamp(frame.timestamp),
                                  description: frame.description || frame.ocr_text || 'Frame analysis',
                                  metaTags: metaTags
                                };
                              });
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
