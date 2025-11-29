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
    // Add any auth tokens here if needed
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

export const uploadVideo = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

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
  return apiClient.get(`/api/status/${jobId}`);
};

export const downloadDocument = async (jobId, format = 'docx') => {
  return apiClient.get(`/api/download/${jobId}?format=${format}`, {
    responseType: 'blob',
    timeout: 60000, // 1 minute for download
  });
};

export default apiClient;

