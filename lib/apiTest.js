/**
 * API Testing Utilities
 * Provides functions to test all API endpoints
 */

import * as api from './api';

/**
 * Test result structure
 */
class TestResult {
  constructor(name, success, data, error) {
    this.name = name;
    this.success = success;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Test all API endpoints
 */
export const runAllTests = async () => {
  console.log('🚀 Starting API Tests...\n');
  const results = [];
  
  // Health endpoints
  results.push(await testHealth());
  results.push(await testApiHealth());
  
  // Auth endpoints (if logged in)
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) {
    results.push(await testGetCurrentUser());
  }
  
  // Video endpoints (if logged in)
  if (token) {
    results.push(await testGetUploads());
    results.push(await testGetVideosPanel());
    results.push(await testGetActivityLogs());
    results.push(await testGetActivityStats());
    results.push(await testGetActivityActions());
  }
  
  // Print summary
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}\n`);
  
  return results;
};

/**
 * Test health endpoint
 */
export const testHealth = async () => {
  try {
    const data = await api.getHealth();
    console.log('✅ Health endpoint:', data);
    return new TestResult('Health', true, data);
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.message);
    return new TestResult('Health', false, null, error.message);
  }
};

/**
 * Test API health endpoint
 */
export const testApiHealth = async () => {
  try {
    const data = await api.getApiHealth();
    console.log('✅ API Health endpoint:', data);
    return new TestResult('API Health', true, data);
  } catch (error) {
    console.error('❌ API Health endpoint failed:', error.message);
    return new TestResult('API Health', false, null, error.message);
  }
};

/**
 * Test get current user
 */
export const testGetCurrentUser = async () => {
  try {
    const data = await api.getCurrentUser();
    console.log('✅ Get Current User:', data);
    return new TestResult('Get Current User', true, data);
  } catch (error) {
    console.error('❌ Get Current User failed:', error.message);
    return new TestResult('Get Current User', false, null, error.message);
  }
};

/**
 * Test get uploads
 */
export const testGetUploads = async () => {
  try {
    const data = await api.getUploads({ page: 1, page_size: 10 });
    console.log('✅ Get Uploads:', data);
    return new TestResult('Get Uploads', true, data);
  } catch (error) {
    console.error('❌ Get Uploads failed:', error.message);
    return new TestResult('Get Uploads', false, null, error.message);
  }
};

/**
 * Test get videos panel
 */
export const testGetVideosPanel = async () => {
  try {
    const data = await api.getVideosPanel({ page: 1, page_size: 10 });
    console.log('✅ Get Videos Panel:', data);
    return new TestResult('Get Videos Panel', true, data);
  } catch (error) {
    console.error('❌ Get Videos Panel failed:', error.message);
    return new TestResult('Get Videos Panel', false, null, error.message);
  }
};

/**
 * Test get activity logs
 */
export const testGetActivityLogs = async () => {
  try {
    const data = await api.getActivityLogs({ page: 1, page_size: 10 });
    console.log('✅ Get Activity Logs:', data);
    return new TestResult('Get Activity Logs', true, data);
  } catch (error) {
    console.error('❌ Get Activity Logs failed:', error.message);
    return new TestResult('Get Activity Logs', false, null, error.message);
  }
};

/**
 * Test get activity stats
 */
export const testGetActivityStats = async () => {
  try {
    const data = await api.getActivityStats(30);
    console.log('✅ Get Activity Stats:', data);
    return new TestResult('Get Activity Stats', true, data);
  } catch (error) {
    console.error('❌ Get Activity Stats failed:', error.message);
    return new TestResult('Get Activity Stats', false, null, error.message);
  }
};

/**
 * Test get activity actions
 */
export const testGetActivityActions = async () => {
  try {
    const data = await api.getActivityActions();
    console.log('✅ Get Activity Actions:', data);
    return new TestResult('Get Activity Actions', true, data);
  } catch (error) {
    console.error('❌ Get Activity Actions failed:', error.message);
    return new TestResult('Get Activity Actions', false, null, error.message);
  }
};

/**
 * Test specific upload by ID (requires upload ID)
 */
export const testGetUploadById = async (uploadId) => {
  try {
    const data = await api.getUploadById(uploadId);
    console.log('✅ Get Upload By ID:', data);
    return new TestResult('Get Upload By ID', true, data);
  } catch (error) {
    console.error('❌ Get Upload By ID failed:', error.message);
    return new TestResult('Get Upload By ID', false, null, error.message);
  }
};

/**
 * Test get video frames (requires video ID)
 */
export const testGetVideoFrames = async (videoId) => {
  try {
    const data = await api.getVideoFrames(videoId, 10, 0);
    console.log('✅ Get Video Frames:', data);
    return new TestResult('Get Video Frames', true, data);
  } catch (error) {
    console.error('❌ Get Video Frames failed:', error.message);
    return new TestResult('Get Video Frames', false, null, error.message);
  }
};

/**
 * Test get GPT responses (requires video file number)
 */
export const testGetGPTResponses = async (videoFileNumber) => {
  try {
    const data = await api.getGPTResponses(videoFileNumber);
    console.log('✅ Get GPT Responses:', data);
    return new TestResult('Get GPT Responses', true, data);
  } catch (error) {
    console.error('❌ Get GPT Responses failed:', error.message);
    return new TestResult('Get GPT Responses', false, null, error.message);
  }
};

/**
 * Test get document (requires video file number)
 */
export const testGetDocument = async (videoFileNumber) => {
  try {
    const data = await api.getDocument(videoFileNumber);
    console.log('✅ Get Document:', data);
    return new TestResult('Get Document', true, data);
  } catch (error) {
    console.error('❌ Get Document failed:', error.message);
    return new TestResult('Get Document', false, null, error.message);
  }
};

// Export test functions for individual use
export default {
  runAllTests,
  testHealth,
  testApiHealth,
  testGetCurrentUser,
  testGetUploads,
  testGetVideosPanel,
  testGetActivityLogs,
  testGetActivityStats,
  testGetActivityActions,
  testGetUploadById,
  testGetVideoFrames,
  testGetGPTResponses,
  testGetDocument
};

