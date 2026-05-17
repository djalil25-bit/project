import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
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
  X,
  BadgeCheck,
  Trophy,
  Target,
  ShieldCheck,
  Award,
  ChevronRight
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import VerifiedBadge from '../components/common/VerifiedBadge';

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
      
      const updatedData = res.data;
      updateUser(updatedData); // sync global state (Navbar, etc.)
      setProfile(prev => ({ ...prev, ...updatedData })); // sync local state
      
      showToast('Profile updated successfully!', 'success');
      setImageFile(null);
      setImagePreview(null);
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

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in relative z-0">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-5 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
        <Link to="/farmer-dashboard" className="hover:text-[#255933] transition-colors">Farmer Hub</Link>
        <ChevronRight size={10} className="text-[#2E6F40]/40" />
        <span className="text-[#2E6F40] flex items-center gap-1.5 font-black uppercase">
          <User size={11} /> Profile Registry
        </span>
      </div>

      <div className="mb-10">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#2E6F40]">
            <User size={22} strokeWidth={2.5} />
          </div>
          Account <span className="text-[#2E6F40]">Management</span>
        </h1>
        <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">Manage your personal credentials and platform identity.</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 pb-8 border-b border-slate-50">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center border-4 border-white shadow-xl overflow-hidden bg-white">
                    {imagePreview || profile.profile_picture ? (
                      <img 
                        src={imagePreview || `${profile.profile_picture.startsWith('http') ? profile.profile_picture : `http://localhost:8000${profile.profile_picture}`}?t=${new Date().getTime()}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-3xl font-black text-white ${profile.role === 'farmer' ? 'bg-[#2E6F40]' : profile.role === 'admin' ? 'bg-[#064e3b]' : 'bg-teal-600'}`}>
                        {profile.full_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#2E6F40] hover:bg-[#255933] text-white rounded-xl shadow-lg flex items-center justify-center cursor-pointer transition-all active:scale-90 border-2 border-white" title="Change Photo">
                    <Camera size={14} />
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{profile.full_name}</h2>
                    <VerifiedBadge role={profile.role} isVerified={profile.is_verified} trustLevel={profile.trust_level} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${profile.role === 'farmer' ? 'bg-[#2E6F40]/10 text-[#2E6F40]' : profile.role === 'admin' ? 'bg-[#064e3b]/10 text-[#064e3b]' : 'bg-teal-100 text-teal-700'}`}>{profile.role}</span>
                    <span className="text-slate-400 text-[10px] font-bold">REGISTRY ID: #{profile.id}</span>
                  </div>
                </div>
              </div>

            <div className="flex items-center gap-2 mb-6 font-black text-[10px] uppercase tracking-[0.2em] text-[#2E6F40] border-b border-slate-100 pb-3">
              <FileText size={14} /> Identity & Contact Registry
            </div>
            
            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <User size={12} className="text-[#2E6F40]" /> Public Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all font-black uppercase tracking-widest text-slate-800 text-[11px]" 
                    value={profile.full_name} 
                    onChange={e => setProfile({...profile, full_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Mail size={12} className="text-[#2E6F40]" /> Email Address
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl font-bold text-slate-400 text-sm cursor-not-allowed" 
                    value={profile.email} 
                    disabled 
                  />
                  <p className="text-[9px] text-slate-400 mt-2 italic font-medium tracking-wide uppercase">Contact admin to change registry email.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Phone size={12} className="text-[#2E6F40]" /> Phone Link
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all font-black text-slate-800 text-[11px]" 
                    value={profile.phone} 
                    onChange={e => setProfile({...profile, phone: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Shield size={12} className="text-[#2E6F40]" /> Platform Identity
                  </label>
                  <div className="pt-1">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${profile.role === 'farmer' ? 'bg-[#2E6F40]/10 text-[#2E6F40]' : profile.role === 'admin' ? 'bg-[#064e3b]/10 text-[#064e3b]' : 'bg-teal-100 text-teal-700'}`}>
                      {profile.role} Account
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Professional Summary</label>
                  <textarea 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all font-medium text-slate-700 text-sm resize-none" 
                    rows="3" 
                    placeholder="Tell us about yourself or your business..."
                    value={profile.bio || ''} 
                    onChange={e => setProfile({...profile, bio: e.target.value})} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 ml-1">
                    <MapPin size={12} className="text-[#2E6F40]" /> Primary Registry Address
                  </label>
                  <textarea 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all font-medium text-slate-700 text-sm resize-none" 
                    rows="2" 
                    placeholder="Enter your full business or residential address"
                    value={profile.address || ''} 
                    onChange={e => setProfile({...profile, address: e.target.value})} 
                  />
                </div>
              </div>
              <button type="submit" className="mt-10 inline-flex items-center justify-center gap-2 bg-[#2E6F40] hover:bg-[#255933] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 border-0 disabled:opacity-50" disabled={updating}>
                {updating ? 'Processing Protocol...' : <><Save size={16} strokeWidth={2.5} /> Sync Changes</>}
              </button>
            </form>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="flex flex-col gap-6">
            {/* Trust Foundation Card */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#2E6F40]/10 text-[#2E6F40] rounded-lg border border-[#2E6F40]/20">
                    <ShieldCheck size={18} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Trust Index</h3>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${profile.trust_level === 'High' ? 'bg-emerald-100 text-emerald-700' : profile.trust_level === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                  {profile.trust_level}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-[9px] font-black text-[#2E6F40] uppercase tracking-widest">Accuracy</span>
                  <span className="text-[10px] font-black text-[#2E6F40]">{profile.profile_completeness}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2E6F40] rounded-full" style={{ width: `${profile.profile_completeness}%` }}></div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reliability Score</span>
                  <span className="text-[10px] font-black text-emerald-600">{profile.trust_score}/100</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${profile.trust_score > 70 ? 'bg-emerald-500' : profile.trust_score > 30 ? 'bg-amber-500' : 'bg-red-500'}`} 
                    style={{ width: `${profile.trust_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" />
                    <circle 
                      className="text-[#2E6F40]" strokeWidth="4" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * (profile.profile_completeness || 0)) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" 
                    />
                  </svg>
                  <div className="absolute text-[10px] font-black text-slate-700">{profile.profile_completeness}%</div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Data Integrity</div>
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed mt-1">
                    {profile.profile_completeness === 100 
                      ? 'Your platform identity is fully verified.' 
                      : 'Complete your profile for premium verification.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                  <Lock size={18} strokeWidth={2.5} />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Security Gate</h3>
              </div>
            
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Legacy Password</label>
                    <input 
                      type="password" name="old_password" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all font-bold text-slate-800 text-sm" 
                      value={passwordData.old_password} onChange={e => setPasswordData({...passwordData, old_password: e.target.value})} 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Secret Key</label>
                    <input 
                      type="password" name="new_password" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all font-bold text-slate-800 text-sm" 
                      value={passwordData.new_password} onChange={e => setPasswordData({...passwordData, new_password: e.target.value})} 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirm New Secret</label>
                    <input 
                      type="password" name="confirm_password" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all font-bold text-slate-800 text-sm" 
                      value={passwordData.confirm_password} onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})} 
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="w-full mt-6 flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95">
                  <Shield size={16} /> Rotate Password
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <h5 className="text-[9px] font-black text-slate-400 text-uppercase mb-4 tracking-widest">Access Monitoring</h5>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Smartphone size={20} className="text-slate-300" />
                  <div className="flex-1">
                    <div className="text-[10px] font-black text-slate-800">Active Session</div>
                    <div className="text-[9px] text-slate-500 font-medium mt-0.5">
                      <span className="text-emerald-600 font-black uppercase">Live</span> • Algiers, Algeria • Desktop Platform
                    </div>
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
