import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setProfileForm({
      name: user.name || '',
      email: user.email || '',
      phone: ''
    });
  }, [user, navigate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.updateProfile(profileForm.name, profileForm.email);
      const updatedUser = {
        ...user,
        name: response.user.name,
        email: response.user.email
      };
      localStorage.setItem('gorasUser', JSON.stringify(updatedUser));
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        window.location.reload(); // Reload to update user context
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await authAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div style={styles.page}>
      <div className="container">
        <div style={styles.header}>
          <h1 style={styles.title}>My Profile</h1>
          <p style={styles.subtitle}>Manage your account settings</p>
        </div>

        <div style={styles.tabs}>
          <button
            style={{...styles.tab, ...(activeTab === 'profile' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            Profile
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'password' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={20} />
            Change Password
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="card" style={styles.card}>
            <h2 style={styles.cardTitle}>Edit Profile</h2>
            
            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            <form onSubmit={handleProfileUpdate} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <User size={18} style={styles.labelIcon} />
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  required
                  style={styles.input}
                  placeholder="Enter your name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Mail size={18} style={styles.labelIcon} />
                  Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  required
                  style={styles.input}
                  placeholder="Enter your email"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Phone size={18} style={styles.labelIcon} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  style={styles.input}
                  placeholder="Enter your phone number"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={styles.submitButton}
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="card" style={styles.card}>
            <h2 style={styles.cardTitle}>Change Password</h2>
            
            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            <form onSubmit={handlePasswordChange} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Lock size={18} style={styles.labelIcon} />
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  required
                  style={styles.input}
                  placeholder="Enter current password"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Lock size={18} style={styles.labelIcon} />
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                  style={styles.input}
                  placeholder="Enter new password (min 6 characters)"
                  minLength={6}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Lock size={18} style={styles.labelIcon} />
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                  style={styles.input}
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={styles.submitButton}
              >
                <Lock size={18} />
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    padding: '40px 0 80px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280'
  },
  tabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    borderBottom: '2px solid #e5e7eb',
    justifyContent: 'center'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    color: '#6b7280',
    transition: 'all 0.3s'
  },
  tabActive: {
    color: '#22c55e',
    borderBottomColor: '#22c55e'
  },
  card: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '32px'
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '24px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  labelIcon: {
    color: '#22c55e'
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontSize: '16px',
    transition: 'border-color 0.2s'
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '8px'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  success: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  }
};

export default Profile;

