import { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from '../styles/Dashboard.module.css';

export default function Account() {
  const [isEditMode, setIsEditMode] = useState(false);
  
  const initialFormData = {
    // Personal Details
    fullName: 'Samuel Wilson',
    dateOfBirth: 'January 1, 1987',
    gender: 'Male',
    nationality: 'American',
    address: 'California - United States',
    phoneNumber: '(213) 555-1234',
    email: 'wilson@example.com',
    // Security Settings
    twoFactorAuth: 'Enabled',
    securityQuestionsSet: 'Yes',
    loginNotifications: 'Enabled',
    // Account Details
    displayName: 's_wilson_168920',
    membershipStatus: 'Premium Member',
    languagePreference: 'English',
    timeZone: 'GMT-5 (Eastern Time)',
    // Preferences
    emailNotifications: 'Subscribed',
    smsAlerts: 'Enabled',
    contentPreferences: 'Technology, Design, Innovation',
    defaultDashboardView: 'Compact Mode',
    darkMode: 'Activated',
    languageForContent: 'English'
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleSave = () => {
    // Here you would typically save to an API
    console.log('Saving data:', formData);
    setIsEditMode(false);
    // You can add a success message here
    alert('Account information saved successfully!');
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setIsEditMode(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderEditableField = (field, value, isBadge = false, badgeClass = '') => {
    if (isEditMode) {
      if (isBadge) {
        // For badge fields, use select dropdown
        return (
          <select
            className={`${styles.editableInput} ${styles.editableSelect}`}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
          >
            <option value="Enabled">Enabled</option>
            <option value="Disabled">Disabled</option>
            <option value="Subscribed">Subscribed</option>
            <option value="Unsubscribed">Unsubscribed</option>
            <option value="Verified">Verified</option>
            <option value="Not Verified">Not Verified</option>
            <option value="Activated">Activated</option>
            <option value="Deactivated">Deactivated</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        );
      }
      return (
        <input
          type="text"
          className={styles.editableInput}
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value)}
        />
      );
    } else {
      if (isBadge) {
        return <span className={`${styles.infoValue} ${styles.badge} ${badgeClass}`}>{value}</span>;
      }
      return <span className={styles.infoValue}>{value}</span>;
    }
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Account - Epiplex',
    description: 'Manage your account settings, personal details, security preferences, and account information.',
    mainEntity: {
      '@type': 'Person',
      name: 'User Account'
    }
  };

  return (
    <>
      <SEO
        title="Account"
        description="Manage your account settings, personal details, security preferences, and account information on Epiplex Document Processing."
        keywords="account settings, profile, personal details, security settings, account preferences, user account"
        structuredData={structuredData}
      />
      <div className={styles.dashboard}>
        <Layout>
          <div className={styles.accountPage}>
            {/* Breadcrumbs */}
            <div className={styles.accountBreadcrumbs}>
              <button className={styles.breadcrumbLink}>My Account</button>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbActive}>Profile</span>
            </div>

            {/* Action Buttons */}
            <div className={styles.accountActions}>
              {!isEditMode ? (
                <button className={styles.editButton} onClick={handleEdit}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Edit</span>
                </button>
              ) : (
                <div className={styles.saveCancelButtons}>
                  <button className={styles.saveButton} onClick={handleSave}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>Save</span>
                  </button>
                  <button className={styles.cancelButton} onClick={handleCancel}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Header */}
            <div className={styles.profileHeader}>
              <div className={styles.profileAvatar}>
                <div className={styles.avatarPlaceholder}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>
                  <span>Liam Smith</span>
                  <svg className={styles.verifiedIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className={styles.profileEmail}>wilson@example.com</div>
              </div>
            </div>

            {/* Content Sections */}
            <div className={styles.accountContent}>
              {/* Left Column */}
              <div className={styles.accountColumn}>
                {/* Personal Details */}
                <div className={styles.accountSection}>
                  <h2 className={styles.sectionTitle}>Personal details</h2>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Full name</span>
                      {renderEditableField('fullName', formData.fullName)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Date of Birth</span>
                      {renderEditableField('dateOfBirth', formData.dateOfBirth)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Gender</span>
                      {renderEditableField('gender', formData.gender)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Nationality</span>
                      {renderEditableField('nationality', formData.nationality)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Address</span>
                      <span className={styles.infoValue}>
                        {renderEditableField('address', formData.address)}
                        {!isEditMode && (
                          <svg className={styles.flagIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                            <path d="M2 8h20M2 12h20"></path>
                          </svg>
                        )}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Phone Number</span>
                      {renderEditableField('phoneNumber', formData.phoneNumber)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Email</span>
                      {renderEditableField('email', formData.email)}
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className={styles.accountSection}>
                  <h2 className={styles.sectionTitle}>Security Settings</h2>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Password Last Changed</span>
                      <span className={styles.infoValue}>July 15, 2024</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Two-Factor Authentication</span>
                      {renderEditableField('twoFactorAuth', formData.twoFactorAuth, true, styles.badgeBlue)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Security Questions Set</span>
                      {renderEditableField('securityQuestionsSet', formData.securityQuestionsSet)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Login Notifications</span>
                      {renderEditableField('loginNotifications', formData.loginNotifications, true, styles.badgeBlue)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Connected Devices</span>
                      <span className={styles.infoValue}>3 Devices</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Recent Account Activity</span>
                      <span className={styles.infoValue}>No Suspicious Activity Detected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className={styles.accountColumn}>
                {/* Account Details */}
                <div className={styles.accountSection}>
                  <h2 className={styles.sectionTitle}>Account Details</h2>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Display Name</span>
                      {renderEditableField('displayName', formData.displayName)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Account Created</span>
                      <span className={styles.infoValue}>March 20, 2020</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Last Login</span>
                      <span className={styles.infoValue}>August 22, 2024</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Membership Status</span>
                      {renderEditableField('membershipStatus', formData.membershipStatus)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Account Verification</span>
                      <span className={`${styles.infoValue} ${styles.badge} ${styles.badgeGreen}`}>Verified</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Language Preference</span>
                      {renderEditableField('languagePreference', formData.languagePreference)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Time Zone</span>
                      {renderEditableField('timeZone', formData.timeZone)}
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className={styles.accountSection}>
                  <h2 className={styles.sectionTitle}>Preferences</h2>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Email Notifications</span>
                      {renderEditableField('emailNotifications', formData.emailNotifications, true, styles.badgePurple)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>SMS Alerts</span>
                      {renderEditableField('smsAlerts', formData.smsAlerts, true, styles.badgeBlue)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Content Preferences</span>
                      {renderEditableField('contentPreferences', formData.contentPreferences)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Default Dashboard View</span>
                      {renderEditableField('defaultDashboardView', formData.defaultDashboardView)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Dark Mode</span>
                      {renderEditableField('darkMode', formData.darkMode)}
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Language for Content</span>
                      {renderEditableField('languageForContent', formData.languageForContent)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </div>
    </>
  );
}

