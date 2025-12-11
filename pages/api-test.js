import { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from '../styles/Dashboard.module.css';
import { runAllTests } from '../lib/apiTest';
import { logPageView } from '../lib/activityLogger';
import { useEffect } from 'react';

export default function ApiTest() {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [customTestInput, setCustomTestInput] = useState({
    uploadId: '',
    videoId: '',
    videoFileNumber: ''
  });

  useEffect(() => {
    logPageView('API Test');
  }, []);

  const handleRunAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const results = await runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌';
  };

  const getStatusClass = (success) => {
    return success ? styles.testSuccess : styles.testFailure;
  };

  return (
    <>
      <SEO
        title="API Test - Epiplex"
        description="Test all API endpoints"
        keywords="api test, endpoints, testing"
      />
      <div className={styles.dashboard}>
        <Layout>
          <div className={styles.contentHeader}>
            <h1 className={styles.pageTitle}>API Testing</h1>
            <button
              className={styles.createButton}
              onClick={handleRunAllTests}
              disabled={isRunning}
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className={styles.testResults}>
              <h2>Test Results</h2>
              <div className={styles.testResultsGrid}>
                {testResults.map((result, index) => (
                  <div key={index} className={`${styles.testResultCard} ${getStatusClass(result.success)}`}>
                    <div className={styles.testResultHeader}>
                      <span className={styles.testResultIcon}>{getStatusIcon(result.success)}</span>
                      <h3 className={styles.testResultName}>{result.name}</h3>
                    </div>
                    <div className={styles.testResultBody}>
                      {result.success ? (
                        <div className={styles.testResultData}>
                          <pre>{JSON.stringify(result.data, null, 2)}</pre>
                        </div>
                      ) : (
                        <div className={styles.testResultError}>
                          <strong>Error:</strong> {result.error}
                        </div>
                      )}
                      <div className={styles.testResultTimestamp}>
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.testInstructions}>
            <h2>Instructions</h2>
            <ul>
              <li>Click "Run All Tests" to test all available API endpoints</li>
              <li>Tests require authentication - make sure you're logged in</li>
              <li>Some tests may fail if there's no data (e.g., no uploads)</li>
              <li>Check the browser console for detailed logs</li>
            </ul>
          </div>
        </Layout>
      </div>
    </>
  );
}

