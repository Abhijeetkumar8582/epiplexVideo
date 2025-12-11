import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token to requests if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry logic for network errors
    if (
      !originalRequest._retry &&
      error.code === 'ECONNABORTED' &&
      originalRequest.url !== '/api/upload'
    ) {
      originalRequest._retry = true;
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return apiClient(originalRequest);
    }

    // Handle specific error cases
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 429:
          // Handle rate limit
          const retryAfter = error.response.headers['retry-after'] || 60;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return apiClient(originalRequest);
        case 500:
        case 502:
        case 503:
          // Retry on server errors
          if (!originalRequest._retry && originalRequest.url !== '/api/upload') {
            originalRequest._retry = true;
            await new Promise(resolve => setTimeout(resolve, 2000));
            return apiClient(originalRequest);
          }
          break;
      }
    }

    return Promise.reject(error);
  }
);

export const uploadVideo = async (file, onUploadProgress, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add optional parameters
  if (options.name) formData.append('name', options.name);
  if (options.application_name) formData.append('application_name', options.application_name);
  if (options.tags) formData.append('tags', options.tags);
  if (options.language_code) formData.append('language_code', options.language_code);
  if (options.priority) formData.append('priority', options.priority);

  return apiClient.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      }
    },
    timeout: 300000, // 5 minutes for upload
  });
};

export const getStatus = async (jobId) => {
  const response = await apiClient.get(`/api/status/${jobId}`);
  return response.data;
};

export const downloadDocument = async (jobId, format = 'docx') => {
  return apiClient.get(`/api/download/${jobId}?format=${format}`, {
    responseType: 'blob',
    timeout: 60000, // 1 minute for download
  });
};

// Authentication API functions
export const signup = async (fullName, email, password) => {
  const response = await apiClient.post('/api/auth/signup', {
    full_name: fullName,
    email: email,
    password: password
  });
  return response.data;
};

export const login = async (email, password) => {
  const response = await apiClient.post('/api/auth/login', {
    email: email,
    password: password
  });
  // Store token in localStorage
  if (response.data.access_token && typeof window !== 'undefined') {
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('session_token', response.data.session_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_info'); // Also remove user_info in case it was stored differently
  }
};

export const getGoogleAuthUrl = (redirectUri) => {
  const baseUrl = API_BASE_URL;
  const redirectParam = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : '';
  return `${baseUrl}/api/auth/google${redirectParam}`;
};

// Health & Status APIs
export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const getApiHealth = async () => {
  const response = await apiClient.get('/api/health');
  return response.data;
};

// Video Management APIs
export const getUploads = async (params = {}) => {
  const {
    page = 1,
    page_size = 20,
    status,
    include_deleted = false,
    application_name,
    language_code,
    priority,
    tags
  } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('page_size', page_size.toString());
  queryParams.append('include_deleted', include_deleted.toString());
  
  if (status) queryParams.append('status', status);
  if (application_name) queryParams.append('application_name', application_name);
  if (language_code) queryParams.append('language_code', language_code);
  if (priority) queryParams.append('priority', priority);
  if (tags) queryParams.append('tags', tags);
  
  const response = await apiClient.get(`/api/uploads?${queryParams.toString()}`);
  return response.data;
};

export const getUploadById = async (uploadId) => {
  const response = await apiClient.get(`/api/uploads/${uploadId}`);
  return response.data;
};

export const updateUpload = async (uploadId, data) => {
  const response = await apiClient.patch(`/api/uploads/${uploadId}`, data);
  return response.data;
};

export const deleteUpload = async (uploadId, permanent = false) => {
  const response = await apiClient.delete(`/api/uploads/${uploadId}?permanent=${permanent}`);
  return response.data;
};

export const restoreUpload = async (uploadId) => {
  const response = await apiClient.post(`/api/uploads/${uploadId}/restore`);
  return response.data;
};

export const getVideosPanel = async (params = {}) => {
  const {
    page = 1,
    page_size = 20,
    status,
    application_name,
    language_code,
    priority,
    tags,
    sort_by = 'updated_at',
    sort_order = 'desc'
  } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('page_size', page_size.toString());
  queryParams.append('sort_by', sort_by);
  queryParams.append('sort_order', sort_order);
  
  if (status) queryParams.append('status', status);
  if (application_name) queryParams.append('application_name', application_name);
  if (language_code) queryParams.append('language_code', language_code);
  if (priority) queryParams.append('priority', priority);
  if (tags) queryParams.append('tags', tags);
  
  const response = await apiClient.get(`/api/videos/panel?${queryParams.toString()}`);
  return response.data;
};

export const getVideoFrames = async (videoId, limit = null, offset = 0) => {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit.toString());
  queryParams.append('offset', offset.toString());
  
  const response = await apiClient.get(`/api/videos/${videoId}/frames?${queryParams.toString()}`);
  return response.data;
};

export const getGPTResponses = async (videoFileNumber) => {
  const response = await apiClient.get(`/api/videos/file-number/${videoFileNumber}/gpt-responses`);
  return response.data;
};

export const getDocument = async (videoFileNumber) => {
  const response = await apiClient.get(`/api/videos/file-number/${videoFileNumber}/document`);
  return response.data;
};

// Activity Logs APIs
export const getActivityLogs = async (params = {}) => {
  const {
    page = 1,
    page_size = 20,
    action,
    start_date,
    end_date,
    search
  } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('page_size', page_size.toString());
  
  if (action) queryParams.append('action', action);
  if (start_date) queryParams.append('start_date', start_date);
  if (end_date) queryParams.append('end_date', end_date);
  if (search) queryParams.append('search', search);
  
  const response = await apiClient.get(`/api/activity-logs?${queryParams.toString()}`);
  return response.data;
};

export const getActivityLogById = async (logId) => {
  const response = await apiClient.get(`/api/activity-logs/${logId}`);
  return response.data;
};

export const getActivityStats = async (days = 30) => {
  const response = await apiClient.get(`/api/activity-logs/stats?days=${days}`);
  return response.data;
};

export const getActivityActions = async () => {
  const response = await apiClient.get('/api/activity-logs/actions');
  return response.data;
};

// Helper function to log activity (creates activity log via backend)
// Note: This requires a backend endpoint that accepts activity logs from frontend
// For now, we'll use a POST endpoint if it exists, otherwise this is a placeholder
export const logActivity = async (action, description = null, metadata = null) => {
  try {
    // This would need a backend endpoint like POST /api/activity-logs
    // For now, we'll just log to console and return
    // The actual activity logging should be done on the backend when actions occur
    console.log('Activity log:', { action, description, metadata });
    return { success: true };
  } catch (error) {
    console.error('Failed to log activity:', error);
    return { success: false, error: error.message };
  }
};

export default apiClient;

