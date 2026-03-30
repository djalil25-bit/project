import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Lock, 
  Smartphone, 
  Save, 
  Info,
  CheckCircle,
  AlertTriangle,
  FileText,
  Camera,
  Trash2,
  X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('full_name', profile.full_name);
      formData.append('phone', profile.phone || '');
      formData.append('bio', profile.bio || '');
      formData.append('address', profile.address || '');
      
      if (imageFile) {
        formData.append('profile_picture', imageFile);
      }

      const res = await api.patch('/auth/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      updateUser(res.data); // sync global state
      showToast('Profile updated successfully!', 'success');
      setImageFile(null);
    } catch (err) {
      showToast('Update failed. Please check your data.', 'error');
    } finally { setUpdating(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast("New passwords don't match!", 'warning');
      return;
    }
    try {
      await api.post('/auth/change-password/', passwordData);
      showToast('Password changed successfully!', 'success');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      showToast("Failed to change password. Ensure old password is correct.", 'error');
    }
  };

  if (loading) return <div className="flex-center py-5"><div className="spinner-agr" /></div>;

  return (
    <div className="profile-page">
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center">
            <User className="text-primary me-3" size={32} /> Account Management
          </h1>
          <p className="page-subtitle text-muted">Manage your personal credentials and platform identity.</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="agr-card p-4 p-md-5">
            <div className="profile-hero-section mb-5">
              <div className="d-flex align-items-center gap-4">
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar-large">
                    {imagePreview || profile.profile_picture ? (
                      <img 
                        src={imagePreview || (profile.profile_picture.startsWith('http') ? profile.profile_picture : `http://localhost:8000${profile.profile_picture}`)} 
                        alt="Profile" 
                      />
                    ) : (
                      <div className={`avatar-placeholder-large avatar-role-${profile.role}`}>
                        {profile.full_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label className="avatar-edit-badge" title="Change Photo">
                      <Camera size={16} />
                      <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                </div>
                <div>
                  <h2 className="h4 fw-bold mb-1">{profile.full_name}</h2>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`role-badge role-${profile.role}`}>{profile.role}</span>
                    <span className="text-muted small">ID: #{profile.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center mb-4">
              <FileText size={20} className="text-primary me-2" />
              <h3 className="h5 fw-bold mb-0">Identity & Contact</h3>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="agr-form">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label d-flex align-items-center">
                      <User size={14} className="me-2 text-muted" /> Public Name
                    </label>
                    <input type="text" className="form-input" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label d-flex align-items-center">
                      <Mail size={14} className="me-2 text-muted" /> Email Address
                    </label>
                    <input type="text" className="form-input bg-light border-0" value={profile.email} disabled />
                    <p className="very-small text-muted mt-1 italic">Contact admin to change email.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label d-flex align-items-center">
                      <Phone size={14} className="me-2 text-muted" /> Phone Link
                    </label>
                    <input type="text" className="form-input" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label d-flex align-items-center">
                      <Shield size={14} className="me-2 text-muted" /> Platform Identity
                    </label>
                    <div className="pt-2"><span className={`role-badge role-${profile.role}`}>{profile.role}</span></div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-group mb-3">
                    <label className="form-label">Professional Summary</label>
                    <textarea 
                      className="form-input" 
                      rows="3" 
                      placeholder="Tell us about yourself or your business..."
                      value={profile.bio || ''} 
                      onChange={e => setProfile({...profile, bio: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-group mb-2">
                    <label className="form-label d-flex align-items-center">
                      <MapPin size={14} className="me-2 text-muted" /> Primary Registry Address
                    </label>
                    <textarea 
                      className="form-input" 
                      rows="2" 
                      placeholder="Enter your full business or residential address"
                      value={profile.address || ''} 
                      onChange={e => setProfile({...profile, address: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-agr btn-primary mt-4 px-5 d-flex align-items-center" disabled={updating}>
                {updating ? 'Processing...' : <><Save size={18} className="me-2" /> Sync Changes</>}
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="agr-card p-4 h-100">
            <div className="d-flex align-items-center mb-4">
              <Lock size={20} className="text-primary me-2" />
              <h3 className="h5 fw-bold mb-0">Security Gate</h3>
            </div>
            
            <form onSubmit={handlePasswordChange} className="agr-form">
              <div className="form-group mb-3">
                <label className="form-label small">Legacy Password</label>
                <input 
                  type="password" name="old_password" className="form-input" 
                  value={passwordData.old_password} onChange={e => setPasswordData({...passwordData, old_password: e.target.value})} 
                  required
                />
              </div>
              <div className="form-group mb-3">
                <label className="form-label small">New Secret Key</label>
                <input 
                  type="password" name="new_password" className="form-input" 
                  value={passwordData.new_password} onChange={e => setPasswordData({...passwordData, new_password: e.target.value})} 
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label className="form-label small">Confirm New Secret</label>
                <input 
                  type="password" name="confirm_password" className="form-input" 
                  value={passwordData.confirm_password} onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})} 
                  required
                />
              </div>
              <button type="submit" className="btn-agr btn-outline w-100 d-flex align-items-center justify-content-center">
                <Shield size={16} className="me-2" /> Rotate Password
              </button>
            </form>

            <div className="mt-5 pt-4 border-top">
              <h5 className="very-small fw-bold text-muted text-uppercase mb-3 tracking-wider">Access Monitoring</h5>
              <div className="d-flex align-items-center gap-3 p-3 bg-light-soft rounded-lg">
                <Smartphone size={24} className="text-muted opacity-50" />
                <div className="small">
                  <div className="fw-bold text-dark">Currently Active Session</div>
                  <div className="text-muted very-small mt-1">
                    <span className="text-success fw-bold">Live</span> • Algiers, Algeria • Desktop Platform
                  </div>
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
