import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from '../styles/Dashboard.module.css';
import { logPageView, logVideoUpload } from '../lib/activityLogger';
import { uploadVideo, getStatus, getVideosPanel, deleteUpload, retryUpload, getJobStatus, bulkDeleteUploads } from '../lib/api';
import dataCache, { CACHE_DURATION } from '../lib/dataCache';

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
    { id: 1, label: 'Upload', number: '1' },
    { id: 2, label: 'Transcribe', number: '2' },
    { id: 3, label: 'Extract Keyframes', number: '3' },
    { id: 4, label: 'Analyze Frames', number: '4' },
    { id: 5, label: 'Processing', number: '5' },
    { id: 6, label: 'Saving', number: '6' },
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

  // Real data from API
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEntryId, setNewEntryId] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [statusPollingInterval, setStatusPollingInterval] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;
  const [isInitialMount, setIsInitialMount] = useState(true);
  
  // Validation state
  const [nameError, setNameError] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferProgress, setTransferProgress] = useState(0);
  
  // Dropdown and status view state
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [viewStatusItem, setViewStatusItem] = useState(null);
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    // Log page view
    logPageView('Process Data');
    // Fetch videos from API on initial load
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

  // Update select all state when tableData or selection changes (memoized)
  const selectAllState = useMemo(() => {
    if (tableData.length > 0) {
      const allCurrentPageIds = tableData.map(v => v.id);
      return allCurrentPageIds.length > 0 && 
             allCurrentPageIds.every(id => selectedItems.has(id));
    }
    return false;
  }, [selectedItems, tableData]);

  useEffect(() => {
    setSelectAll(selectAllState);
  }, [selectAllState]);

  const getCacheKey = (page, status, fileName) => {
    return `process-data:videos:page:${page}:status:${status || 'all'}:fileName:${fileName || 'all'}`;
  };

  const fetchVideos = async (page = currentPage) => {
    const cacheKey = getCacheKey(page, filterData.status, filterData.fileName);
    
    // Check cache first
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      setTableData(cachedData.videos);
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
        sort_order: 'desc',
        status: filterData.status || null,
        application_name: filterData.fileName || null
      });
      
      if (response && response.videos) {
        // Map API response to table format
        const mappedData = response.videos.map((video) => {
          const createdDate = new Date(video.created_at);
          const updatedDate = new Date(video.updated_at);
          
          const formatDate = (date) => {
            const dateStr = date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
            const timeStr = date.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            });
            return `${dateStr}, ${timeStr}`;
          };

          // Get first letter of name for recipient avatar
          const firstLetter = video.name ? video.name.charAt(0).toUpperCase() : 'U';
          
          return {
            id: video.id,
            name: video.name,
            created: formatDate(createdDate),
            lastActivity: formatDate(updatedDate),
            recipients: [firstLetter], // Show first letter as avatar
            status: video.status || 'uploaded',
            video_file_number: video.video_file_number,
            job_id: video.job_id || null
          };
        });
        
        setTableData(mappedData);
        
        // Update pagination info
        const totalRecords = response.total !== undefined ? response.total : 0;
        const totalPages = Math.ceil(totalRecords / pageSize);
        
        setTotalRecords(totalRecords);
        setTotalPages(totalPages);

        // Cache the data
        dataCache.set(cacheKey, {
          videos: mappedData,
          totalRecords,
          totalPages
        }, CACHE_DURATION.VIDEO_LIST);
      } else {
        setTableData([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Set empty array on error
      setTableData([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

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

  const statusOptions = ['uploaded', 'processing', 'completed', 'failed', 'cancelled'];

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent row click
    
    // Confirm deletion
    if (!confirm('Are you sure you want to permanently delete this video? This action cannot be undone and the data will be removed from the database.')) {
      return;
    }
    
    try {
      // Call delete API endpoint with permanent=true to hard delete from database
      await deleteUpload(id, true);
      // Invalidate cache to ensure fresh data
      dataCache.clearByPattern('process-data:videos:');
      dataCache.clearByPattern('document:videos:');
      dataCache.clearByPattern('dashboard:');
      // Refresh the list
      await fetchVideos();
    } catch (error) {
      console.error('Failed to delete:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete item. Please try again.';
      alert(errorMessage);
    }
  };

  const handleViewStatus = async (e, item) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    
    if (!item.job_id) {
      alert('No job ID found for this video');
      return;
    }
    
    try {
      // Get current job status
      const status = await getJobStatus(item.job_id);
      setViewStatusItem({ ...item, status });
      setProcessingOpen(true);
      setCurrentJobId(item.job_id);
      setProcessingStatus(status);
      
      // Update current step based on status
      if (status) {
        const stepProgress = status.step_progress || {};
        const currentStepName = status.current_step || 'upload';
        
        // Map backend steps to frontend steps (0-6)
        let stepIndex = 0;
        
        if (stepProgress.upload === 'completed') {
          stepIndex = 0;
        }
        if (stepProgress.extract_audio === 'processing' || stepProgress.extract_audio === 'completed') {
          stepIndex = 1;
        }
        if (stepProgress.transcribe === 'processing' || stepProgress.transcribe === 'completed') {
          stepIndex = 1;
        }
        if (stepProgress.extract_frames === 'processing' || stepProgress.extract_frames === 'completed') {
          stepIndex = 2;
        }
        if (stepProgress.analyze_frames === 'processing' || stepProgress.analyze_frames === 'completed') {
          stepIndex = 3;
        }
        if (stepProgress.complete === 'processing') {
          stepIndex = 4;
        }
        if (status.status === 'completed') {
          stepIndex = 5;
        }
        
        setCurrentStep(stepIndex);
      }
      
      // Start polling for status updates
      startStatusPolling(item.job_id);
    } catch (error) {
      console.error('Failed to get status:', error);
      alert('Failed to load status. Please try again.');
    }
  };

  const handleRetry = async (e, item) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    
    if (!confirm('Are you sure you want to retry processing this video?')) {
      return;
    }
    
    try {
      await retryUpload(item.id);
      // Invalidate cache to ensure fresh data
      dataCache.clearByPattern('process-data:videos:');
      dataCache.clearByPattern('document:videos:');
      dataCache.clearByPattern('dashboard:');
      // Refresh the list
      await fetchVideos();
      alert('Video processing restarted successfully');
    } catch (error) {
      console.error('Failed to retry:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to retry processing. Please try again.';
      alert(errorMessage);
    }
  };

  const toggleDropdown = (e, itemId) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === itemId ? null : itemId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };
    
    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

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
      setFormData(prev => ({ ...prev, file, fileUrl: '' })); // Clear fileUrl when file is selected
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
      setFormData(prev => ({ ...prev, file, fileUrl: '' })); // Clear fileUrl when file is selected
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

  const handleUrlInputChange = (e) => {
    const value = e.target.value;
    // Clear file when URL is entered
    setFormData(prev => ({ ...prev, fileUrl: value, file: null }));
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleStart = async () => {
    // Validate name field
    if (!formData.name || formData.name.trim() === '') {
      setNameError(true);
      return;
    }
    
    if (!formData.link && !formData.file && !formData.fileUrl) {
      return;
    }

    // If file is selected, upload it
    if (formData.file) {
      try {
        // Show transfer dialog
        setShowTransferDialog(true);
        setTransferProgress(0);
        setDialogOpen(false);
        
        // Simulate transfer progress
        const progressInterval = setInterval(() => {
          setTransferProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);
        
        setIsUploading(true);
        setUploadProgress(0);
        
        const response = await uploadVideo(formData.file, (progress) => {
          setUploadProgress(progress);
          // Update transfer progress based on upload progress
          setTransferProgress(Math.min(90, progress * 0.9));
        }, {
          name: formData.name,
          application_name: formData.application_name,
          tags: formData.tags,
          language_code: formData.language_code,
          priority: formData.priority || 'normal'
        });
        
        // Complete transfer progress
        setTransferProgress(100);
        clearInterval(progressInterval);
        
        // Wait a moment to show completion, then close transfer dialog
        setTimeout(() => {
          setShowTransferDialog(false);
        }, 1000);
        
        // Log video upload
        if (response.data && response.data.id) {
          logVideoUpload(response.data.id, {
            name: formData.name,
            video_file_number: response.data.video_file_number
          });
        }
        
        const entryId = response.data?.id || Date.now();
        const jobId = response.data?.job_id || null;
        
        // Invalidate cache to ensure fresh data
        dataCache.clearByPattern('process-data:videos:');
        dataCache.clearByPattern('document:videos:');
        dataCache.clearByPattern('dashboard:');
        
        // Refresh the list to show the new entry
        await fetchVideos();
        
        setNewEntryId(entryId);
        setCurrentJobId(jobId);
        setProcessingOpen(true);
        setCurrentStep(0);
        setFormData({ name: '', link: '', file: null, fileUrl: '' });
        setIsUploading(false);
        setNameError(false);
        
        // Start polling for status if job_id is available
        if (jobId) {
          startStatusPolling(jobId);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        setShowTransferDialog(false);
        // Show detailed error message
        let errorMessage = 'Failed to upload video. Please try again.';
        if (error.response) {
          // Server responded with error
          errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
          if (error.response.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (error.response.status === 413) {
            errorMessage = 'File is too large. Please choose a smaller file.';
          } else if (error.response.status === 400) {
            errorMessage = error.response.data?.detail || 'Invalid file. Please check the file format and try again.';
          }
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        alert(errorMessage);
        setIsUploading(false);
        setUploadProgress(0);
        setTransferProgress(0);
      }
    } else {
      // For URL or link-based uploads, create entry without file
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

      // Refresh the list to show the new entry
      await fetchVideos();
      
      setNewEntryId(entryId);
      setDialogOpen(false);
      setProcessingOpen(true);
      setCurrentStep(0);
      setFormData({ name: '', link: '', file: null, fileUrl: '' });
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  // Poll job status when processing is open
  const startStatusPolling = (jobId) => {
    if (!jobId) return;
    
    const pollStatus = async () => {
      try {
        const status = await getStatus(jobId);
        setProcessingStatus(status);
        
        // Update current step based on status
        if (status) {
          const stepProgress = status.step_progress || {};
          const currentStepName = status.current_step || 'upload';
          
          // Map backend steps to frontend steps (0-6)
          let stepIndex = 0;
          
          // Step 0: Upload (always completed when we start polling)
          if (stepProgress.upload === 'completed') {
            stepIndex = 0;
          }
          
          // Step 1: Transcribe
          if (stepProgress.transcribe === 'processing') {
            stepIndex = 1;
          } else if (stepProgress.transcribe === 'completed') {
            stepIndex = 1;
          }
          
          // Step 2: Extract Keyframes
          if (stepProgress.extract_frames === 'processing') {
            stepIndex = 2;
          } else if (stepProgress.extract_frames === 'completed') {
            stepIndex = 2;
          }
          
          // Step 3: Analyze Frames (GPT processing in batches of 5)
          if (stepProgress.analyze_frames === 'processing') {
            stepIndex = 3;
          } else if (stepProgress.analyze_frames === 'completed') {
            stepIndex = 3;
          }
          
          // Step 4: Processing/Finalizing
          if (stepProgress.process === 'processing' || stepProgress.complete === 'processing') {
            stepIndex = 4;
          } else if (stepProgress.process === 'completed' || stepProgress.complete === 'processing') {
            stepIndex = 4;
          }
          
          // Step 5: Saving/Complete
          if (stepProgress.complete === 'completed' || (stepProgress.complete === 'completed' && status.status === 'processing')) {
            stepIndex = 5;
          }
          
          // Step 6: Ready (completed)
          if (status.status === 'completed') {
            stepIndex = 6;
          }
          
          setCurrentStep(stepIndex);
          
          // If completed or failed, stop polling
          if (status.status === 'completed' || status.status === 'failed') {
            if (statusPollingInterval) {
              clearInterval(statusPollingInterval);
              setStatusPollingInterval(null);
            }
            
            // Wait a bit then close and refresh
            setTimeout(async () => {
              setProcessingOpen(false);
              setCurrentStep(0);
              setProcessingStatus(null);
              setCurrentJobId(null);
              
              if (newEntryId) {
                await fetchVideos();
                setNewEntryId(null);
              }
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Failed to poll status:', error);
        // Continue polling even on error (might be temporary network issue)
      }
    };
    
    // Poll immediately
    pollStatus();
    
    // Then poll every 2 seconds
    const interval = setInterval(pollStatus, 2000);
    setStatusPollingInterval(interval);
    
    // Store interval ID for cleanup
    return interval;
  };
  
  // Cleanup polling on unmount or when processing closes
  useEffect(() => {
    return () => {
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
      }
    };
  }, [statusPollingInterval]);
  
  // Stop polling when processing dialog closes
  useEffect(() => {
    if (!processingOpen && statusPollingInterval) {
      clearInterval(statusPollingInterval);
      setStatusPollingInterval(null);
      setProcessingStatus(null);
      setCurrentJobId(null);
    }
  }, [processingOpen, statusPollingInterval]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.filterDropdownWrapper}`)) {
        setUserDropdownOpen(false);
        setStatusDropdownOpen(false);
        setDatePickerOpen(false);
      }
      // Close more button dropdown
      if (!event.target.closest(`.${styles.moreButtonContainer}`)) {
        setOpenDropdownId(null);
      }
    };

    if (userDropdownOpen || statusDropdownOpen || datePickerOpen || openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userDropdownOpen, statusDropdownOpen, datePickerOpen, openDropdownId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (name === 'name' && nameError) {
      setNameError(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return styles.statusCompleted;
      case 'uploaded':
      case 'draft':
        return styles.statusDraft;
      case 'processing':
        return styles.statusProcessing;
      case 'failed':
        return styles.statusPending;
      case 'cancelled':
        return styles.statusPending;
      default:
        return '';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Uploaded';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleRemoveSort = () => {
    setSortBy(null);
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    const isChecked = e.target.checked;
    
    if (isChecked && tableData.length > 0) {
      // Select all items on current page
      const allIds = new Set(tableData.map(item => item.id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        allIds.forEach(id => newSet.add(id));
        return newSet;
      });
    } else {
      // Deselect all items on current page only
      const currentPageIds = new Set(tableData.map(item => item.id));
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
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to delete.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${selectedItems.size} item(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const uploadIds = Array.from(selectedItems);
      const response = await bulkDeleteUploads(uploadIds, true); // permanent delete
      
      // Clear cache
      dataCache.clearByPattern('process-data:videos:');
      dataCache.clearByPattern('dashboard:');
      
      // Clear selection
      setSelectedItems(new Set());
      setSelectAll(false);
      
      // Refresh the list
      await fetchVideos(currentPage);
      
      alert(response.message || `Successfully deleted ${response.deleted_count || selectedItems.size} item(s)`);
    } catch (error) {
      console.error('Failed to delete items:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete items. Please try again.';
      alert(errorMessage);
    }
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
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      aria-label="Select all items"
                    />
                  </th>
                  <th>Name</th>
                  <th>Last Activity</th>
                  <th>Recipients</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyState}>
                      Loading...
                    </td>
                  </tr>
                ) : tableData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyState}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  tableData.map((item) => (
                    <tr key={item.id}>
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
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          {/* View button - only show when status is completed */}
                          {item.status === 'completed' && (
                            <button 
                              className={styles.viewButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.video_file_number) {
                                  router.push(`/document?video=${item.video_file_number}`);
                                } else {
                                  router.push(`/document`);
                                }
                              }}
                            >
                              View
                            </button>
                          )}
                          <button 
                            className={styles.deleteButton}
                            onClick={(e) => handleDelete(e, item.id)}
                            title="Delete video"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                          {/* 3-dot menu - only show when status is NOT completed */}
                          {item.status !== 'completed' && (
                            <div className={styles.moreButtonContainer}>
                              <button 
                                className={styles.moreButton}
                                onClick={(e) => toggleDropdown(e, item.id)}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="1"></circle>
                                  <circle cx="19" cy="12" r="1"></circle>
                                  <circle cx="5" cy="12" r="1"></circle>
                                </svg>
                              </button>
                              {openDropdownId === item.id && (
                                <div className={styles.dropdownMenu}>
                                  {/* View Status - show when processing or uploaded */}
                                  {(item.status === 'processing' || item.status === 'uploaded') && (
                                    <button
                                      className={styles.dropdownItem}
                                      onClick={(e) => handleViewStatus(e, item)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                      View Status
                                    </button>
                                  )}
                                  {/* Retry - only show when failed */}
                                  {item.status === 'failed' && (
                                    <button
                                      className={styles.dropdownItem}
                                      onClick={(e) => handleRetry(e, item)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="23 4 23 10 17 10"></polyline>
                                        <polyline points="1 20 1 14 7 14"></polyline>
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                      </svg>
                                      Retry
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationInfo}>
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
              </div>
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
            </div>
          )}
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
                    className={`${styles.input} ${nameError ? styles.inputError : ''}`}
                    placeholder="Enter name"
                    required
                  />
                  {nameError && (
                    <div className={styles.errorMessage}>Name is required</div>
                  )}
                </div>

                {/* File Upload Area - Hide when URL is entered */}
                {!formData.fileUrl && (
                  <>
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
                  </>
                )}

                {/* Separator - Only show when neither file nor URL is selected */}
                {!formData.file && !formData.fileUrl && (
                  <div className={styles.uploadSeparator}>
                    <span>or</span>
                  </div>
                )}

                {/* Import from URL - Hide when file is selected */}
                {!formData.file && (
                  <div className={styles.urlImportSection}>
                    <label htmlFor="fileUrl" className={styles.label}>Import from URL</label>
                    <div className={styles.urlInputGroup}>
                      <input
                        type="url"
                        id="fileUrl"
                        name="fileUrl"
                        value={formData.fileUrl}
                        onChange={handleUrlInputChange}
                        className={styles.urlInput}
                        placeholder="Add file URL"
                      />
                      <button type="button" className={styles.urlUploadButton}>Upload</button>
                    </div>
                  </div>
                )}
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
        {processingOpen && (
          <div className={styles.processingOverlay}>
            <div className={styles.processingContainer}>
              <h2 className={styles.processingTitle}>Processing Video Extraction</h2>
              
              {/* Show progress percentage if available */}
              {processingStatus && processingStatus.progress !== undefined && (
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    {processingStatus.progress}%
                  </div>
                  {processingStatus.message && (
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {processingStatus.message}
                    </div>
                  )}
                </div>
              )}
              
              {/* Show error if failed */}
              {processingStatus && processingStatus.status === 'failed' && (
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '12px', 
                  backgroundColor: '#fee2e2', 
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '14px'
                }}>
                  <strong>Error:</strong> {processingStatus.error || processingStatus.message || 'Processing failed'}
                </div>
              )}
              
              <div className={styles.currentStepContainer}>
                {processingSteps.map((step, index) => {
                  if (index === currentStep) {
                    const isLastStep = index === processingSteps.length - 1;
                    const isCompleted = processingStatus && processingStatus.status === 'completed';
                    return (
                      <div key={step.id} className={styles.singleStep}>
                        <div className={`${styles.stepCircle} ${styles.stepCircleActive} ${styles[`stepCircle${step.number}`]} ${isLastStep ? styles.stepCircleLast : ''} ${isCompleted ? styles.stepCircleCompleted : ''}`}>
                          <span className={styles.stepNumber}>{isCompleted && isLastStep ? '✓' : step.number}</span>
                        </div>
                        <div className={styles.stepLabelContainer}>
                          <span className={styles.stepLabelActive}>
                            {step.label}
                          </span>
                          {!isLastStep && !isCompleted && (
                            <div className={styles.loadingDots}>
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          )}
                          {isCompleted && isLastStep && (
                            <div style={{ color: '#10b981', fontSize: '14px', marginTop: '8px' }}>
                              Processing completed successfully!
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

        {/* Data Transfer Dialog */}
        {showTransferDialog && (
          <div className={styles.transferDialogOverlay}>
            <div className={styles.transferDialog}>
              <div className={styles.transferHeader}>
                <h3 className={styles.transferTitle}>Storing Video to Database</h3>
              </div>
              <div className={styles.transferContent}>
                {/* Video Side */}
                <div className={styles.transferSide}>
                  <div className={styles.transferIconContainer}>
                    <div className={styles.videoIcon}>
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                      </svg>
                    </div>
                    <div className={styles.transferLabel}>Video File</div>
                    <div className={styles.transferFileName}>{formData.file?.name || 'Video.mp4'}</div>
                  </div>
                </div>

                {/* Animated Arrow */}
                <div className={styles.transferArrowContainer}>
                  <div className={styles.transferArrow}>
                    <svg width="80" height="40" viewBox="0 0 80 40" fill="none">
                      <path
                        d="M0 20 L60 20 M60 20 L50 10 M60 20 L50 30"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={styles.arrowPath}
                      />
                      {/* Animated dots */}
                      <circle cx="10" cy="20" r="3" className={styles.arrowDot} style={{ animationDelay: '0s' }}></circle>
                      <circle cx="30" cy="20" r="3" className={styles.arrowDot} style={{ animationDelay: '0.3s' }}></circle>
                      <circle cx="50" cy="20" r="3" className={styles.arrowDot} style={{ animationDelay: '0.6s' }}></circle>
                    </svg>
                  </div>
                  <div className={styles.transferProgress}>
                    <div className={styles.transferProgressBar}>
                      <div 
                        className={styles.transferProgressFill} 
                        style={{ width: `${transferProgress}%` }}
                      ></div>
                    </div>
                    <div className={styles.transferProgressText}>{transferProgress}%</div>
                  </div>
                </div>

                {/* Database Side */}
                <div className={styles.transferSide}>
                  <div className={styles.transferIconContainer}>
                    <div className={styles.databaseIcon}>
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                      </svg>
                    </div>
                    <div className={styles.transferLabel}>Database</div>
                    <div className={styles.transferStatus}>
                      {transferProgress < 100 ? 'Storing...' : 'Stored ✓'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

