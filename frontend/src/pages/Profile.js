import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile/');
      setProfile(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.patch('/auth/profile/', {
        full_name: profile.full_name,
        phone: profile.phone,
        bio: profile.bio,
        address: profile.address
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: 'Update failed. Please check your data.' });
    } finally { setUpdating(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert("New passwords don't match!");
      return;
    }
    try {
      await api.post('/auth/change-password/', passwordData);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      alert("Failed to change password. Ensure old password is correct.");
    }
  };

  if (loading) return <div className="loading-wrapper py-5"><div className="spinner" /></div>;

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal Account Settings</h1>
          <p className="page-subtitle">Manage your public information and security preferences.</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="agr-card p-4 p-md-5">
            <h3 className="h5 fw-bold mb-4">Edit Profile Info</h3>
            {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
            
            <form onSubmit={handleProfileUpdate}>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Email Address (Read-only)</label>
                    <input type="text" className="form-input bg-light" value={profile.email} disabled />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="text" className="form-input" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Account Role</label>
                    <div className="pt-2"><span className={`role-badge role-${profile.role}`}>{profile.role}</span></div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-group">
                    <label className="form-label">Bio / About You</label>
                    <textarea className="form-input" rows="3" value={profile.bio || ''} onChange={e => setProfile({...profile, bio: e.target.value})} />
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-group">
                    <label className="form-label">Main Business Address</label>
                    <textarea className="form-input" rows="2" value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} />
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-agr btn-primary mt-4 px-5" disabled={updating}>
                {updating ? 'Saving...' : '💾 Save Changes'}
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="agr-card p-4 h-100">
            <h3 className="h5 fw-bold mb-4">Security</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input 
                  type="password" name="old_password" className="form-input" 
                  value={passwordData.old_password} onChange={e => setPasswordData({...passwordData, old_password: e.target.value})} 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" name="new_password" className="form-input" 
                  value={passwordData.new_password} onChange={e => setPasswordData({...passwordData, new_password: e.target.value})} 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" name="confirm_password" className="form-input" 
                  value={passwordData.confirm_password} onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})} 
                  required
                />
              </div>
              <button type="submit" className="btn-agr btn-outline w-100 mt-2">🛡️ Update Password</button>
            </form>

            <div className="mt-5 pt-4 border-top">
              <h5 className="small fw-bold text-muted text-uppercase mb-3">Login Activity</h5>
              <div className="d-flex align-items-center gap-3">
                <div className="h1 mb-0 opacity-25">📱</div>
                <div className="small">
                  <div className="fw-bold">Currently Signed In</div>
                  <div className="text-muted">Algiers, Algeria • Last active now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
