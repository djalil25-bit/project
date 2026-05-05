import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import {
  Leaf, ShoppingBag, Sprout, Truck, ChevronRight, ChevronLeft,
  UploadCloud, X, CheckCircle, ShieldCheck, Eye, EyeOff, Building2,
  FileText, Image as ImageIcon, MapPin, Phone, User, Lock, Mail, CreditCard, LayoutDashboard,
  BarChart3, ArrowLeft, Clock, Home
} from 'lucide-react';

const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arreridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued',
  'Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent',
  'Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar','Ouled Djellal',
  'Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet','El M\'Ghair','El Meniaa',
];

const ROLES = [
  { value: 'farmer', label: 'Farmer', icon: Sprout, desc: 'Sell agricultural products and manage your farm.', color: '#16a34a', bg: '#f0fdf4' },
  { value: 'buyer', label: 'Buyer', icon: ShoppingBag, desc: 'Purchase produce in bulk for your business.', color: '#2563eb', bg: '#eff6ff' },
  { value: 'transporter', label: 'Transporter', icon: Truck, desc: 'Handle delivery missions across wilayas.', color: '#f97316', bg: '#fff7ed' },
];

const STEPS = [
  { id: 1, title: 'Personal Information', sub: 'Let\'s start with your basic details', icon: User },
  { id: 2, title: 'Role Details', sub: 'Tell us more about your activities', icon: LayoutDashboard },
  { id: 3, title: 'Verification Documents', sub: 'Upload required documents for verification', icon: FileText },
  { id: 4, title: 'Security', sub: 'Secure your account', icon: Lock }
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_MB = 5;

const validateFile = (file) => {
  if (!file) return null;
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, PDF allowed.';
  if (file.size > MAX_MB * 1024 * 1024) return `Max ${MAX_MB}MB allowed.`;
  return null;
};

// Dropzone Component
const Dropzone = ({ label, hint, accept, onDrop, file, error, multiple, files }) => {
  const [drag, setDrag] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDrag(true);
    else if (e.type === 'dragleave') setDrag(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (multiple) Array.from(e.dataTransfer.files).forEach(f => onDrop(f));
      else onDrop(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e, index) => {
    e.stopPropagation();
    if (multiple) {
      // For multiple, onDrop handles removal if we pass a special flag or we just expose a remove fn
      // Instead, we just pass null to clear it, but since it's multiple, let's pass index via a callback
      // For simplicity, I'll pass the updated array back
      const newFiles = [...files];
      newFiles.splice(index, 1);
      onDrop(newFiles, true); // true indicates it's a replacement array
    } else {
      onDrop(null);
    }
  };

  return (
    <div className="auth-field" style={{marginBottom: '1.25rem'}}>
      <label className="auth-label">{label}</label>
      <div 
        className={`ms-dropzone ${drag ? 'active' : ''}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        style={error ? { borderColor: 'var(--danger)' } : {}}
      >
        <UploadCloud size={32} className="ms-dropzone-icon" style={{margin:'0 auto 0.75rem'}} />
        <div className="ms-dropzone-text">Click or drag file{multiple ? 's' : ''} here to upload</div>
        <div className="ms-dropzone-hint">{hint}</div>
        <input 
          type="file" style={{display:'none'}} ref={fileInputRef} 
          onChange={(e) => {
            if (multiple) Array.from(e.target.files).forEach(f => onDrop(f));
            else if (e.target.files[0]) onDrop(e.target.files[0]);
          }} 
          accept={accept} multiple={multiple} 
        />
      </div>
      {error && <span className="auth-field-error" style={{marginTop: 4}}>{error}</span>}
      
      {!multiple && file && (
        <div className="ms-file-item">
          <div className="ms-file-info"><FileText size={16} color="var(--active-color)" /> {file.name}</div>
          <button type="button" className="ms-file-remove" onClick={(e) => handleRemove(e)}><X size={16}/></button>
        </div>
      )}
      
      {multiple && files && files.length > 0 && (
        <div style={{marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
          {files.map((f, i) => (
            <div key={i} className="ms-file-item" style={{marginTop: 0}}>
              <div className="ms-file-info"><ImageIcon size={16} color="var(--active-color)" /> {f.name}</div>
              <button type="button" className="ms-file-remove" onClick={(e) => handleRemove(e, i)}><X size={16}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Register = () => {
  const { login } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [activeRole, setActiveRole] = useState('farmer');

  const [formData, setFormData] = useState({
    email: '', password: '', confirm_password: '',
    full_name: '', phone: '', wilaya: '',
    // Farmer
    farm_name: '', farm_location: '', production_type: '', farm_size: '',
    // Buyer
    buyer_type: 'individual', company_name: '', tax_number: '',
    // Transporter
    vehicle_type: '', plate_number: '', capacity_tons: '',
  });

  const [files, setFiles] = useState({
    farmer_id: null, farm_photos: [], trade_register: null,
    driving_license: null, vehicle_registration: null,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [timer, setTimer] = useState(0);

  const activeRoleConfig = ROLES.find(r => r.value === activeRole);

  const setField = (key, val) => {
    setFormData(f => ({ ...f, [key]: val }));
    setFieldErrors(e => ({ ...e, [key]: '' }));
  };

  const setFile = (key, file) => {
    if (file) {
      const err = validateFile(file);
      if (err) { setFieldErrors(e => ({ ...e, [key]: err })); return; }
    }
    setFiles(f => ({ ...f, [key]: file }));
    setFieldErrors(e => ({ ...e, [key]: '' }));
  };

  const handleFarmPhotosDrop = (fileOrFiles, isReplaceArray = false) => {
    if (isReplaceArray) {
      setFiles(f => ({ ...f, farm_photos: fileOrFiles }));
      return;
    }
    const err = validateFile(fileOrFiles);
    if (err) { setFieldErrors(e => ({ ...e, farm_photos: err })); return; }
    setFiles(f => ({ ...f, farm_photos: [...f.farm_photos, fileOrFiles] }));
    setFieldErrors(e => ({ ...e, farm_photos: '' }));
  };

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.full_name.trim()) errs.full_name = 'Full name is required.';
      if (!formData.email.trim()) errs.email = 'Email address is required.';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Valid email required.';
      if (!formData.phone.trim()) errs.phone = 'Phone number is required.';
      if (!formData.wilaya) errs.wilaya = 'Please select a wilaya.';
    }
    if (step === 2) {
      if (activeRole === 'farmer') {
        if (!formData.farm_name.trim()) errs.farm_name = 'Farm name is required.';
        if (!formData.farm_location.trim()) errs.farm_location = 'Farm location is required.';
        if (!formData.production_type) errs.production_type = 'Production type is required.';
      }
      if (activeRole === 'buyer' && formData.buyer_type === 'business') {
        if (!formData.company_name.trim()) errs.company_name = 'Company name is required.';
      }
      if (activeRole === 'transporter') {
        if (!formData.vehicle_type) errs.vehicle_type = 'Vehicle type is required.';
        if (!formData.plate_number.trim()) errs.plate_number = 'Plate number is required.';
      }
    }
    if (step === 3) {
      if (activeRole === 'farmer' && !files.farmer_id) errs.farmer_id = 'Farmer ID document is required.';
      if (activeRole === 'buyer' && formData.buyer_type === 'business' && !files.trade_register) errs.trade_register = 'Trade register is required.';
      if (activeRole === 'transporter') {
        if (!files.driving_license) errs.driving_license = 'Driving license is required.';
        if (!files.vehicle_registration) errs.vehicle_registration = 'Vehicle registration is required.';
      }
    }
    if (step === 4) {
      if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters.';
      if (formData.password !== formData.confirm_password) errs.confirm_password = 'Passwords do not match.';
      if (!acceptTerms) errs.terms = 'You must accept the terms of service.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setLoading(true);
    setApiError('');
    
    const fd = new FormData();
    fd.append('role', activeRole);
    Object.entries(formData).forEach(([k, v]) => { 
      if (k !== 'confirm_password' && v !== '') fd.append(k, v); 
    });
    
    if (activeRole === 'farmer') {
      if (files.farmer_id) fd.append('farmer_id', files.farmer_id);
      files.farm_photos.forEach(p => fd.append('farm_photos', p));
    } else if (activeRole === 'buyer' && formData.buyer_type === 'business') {
      if (files.trade_register) fd.append('trade_register', files.trade_register);
    } else if (activeRole === 'transporter') {
      if (files.driving_license) fd.append('driving_license', files.driving_license);
      if (files.vehicle_registration) fd.append('vehicle_registration', files.vehicle_registration);
    }

    try {
      await api.post('/auth/register/', fd);
      setShowOtpStep(true);
      setTimer(60);
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') { setApiError(data); }
        else {
          const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`);
          setApiError(msgs.join(' | '));
        }
      } else { setApiError('Network error. Unable to connect to server.'); }
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    const fullCode = otpCode.join('');
    if (fullCode.length < 6) return;
    
    setOtpLoading(true);
    setApiError('');
    
    try {
      await api.post('/auth/verify-otp/', { 
        email: formData.email, 
        code: fullCode 
      });
      setOtpSuccess(true);
      setTimeout(() => {
        setSuccess(true);
      }, 1500);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Invalid verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    try {
      await api.post('/auth/resend-otp/', { email: formData.email });
      setTimer(60);
      // Restart timer
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setApiError('Failed to resend code.');
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  if (success) {
    return (
      <div className="auth-page-wrapper auth-page-single">
        <div className="auth-success-screen">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ width: 96, height: 96, background: '#1665341a', color: '#166534', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: '#16653433', borderRadius: '50%', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
              <Clock size={48} style={{ animation: 'spin 10s linear infinite' }} />
              <ShieldCheck size={24} style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%', padding: '2px' }} />
            </div>
            
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '1rem' }}>
              Application Under Review
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)', maxWidth: '500px', margin: '0 auto' }}>
              Welcome, <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{formData.fullName}</span>! 
              Your application as a <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{activeRoleConfig.label}</span> has been received.
            </p>
          </div>

          <div style={{ marginBottom: '3rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 3rem', marginBottom: '1.5rem', position: 'relative' }}>
              {/* Progress Line */}
              <div style={{ position: 'absolute', top: '50%', left: '3rem', right: '3rem', height: '4px', background: 'var(--gray-200)', transform: 'translateY(-50%)', zIndex: 0 }}></div>
              <div style={{ position: 'absolute', top: '50%', left: '3rem', width: '50%', height: '4px', background: '#166534', transform: 'translateY(-50%)', zIndex: 0 }}></div>

              <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: '#166534', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <CheckCircle size={24} />
              </div>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'white', color: '#166534', border: '2px solid #166534', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <ShieldCheck size={24} />
              </div>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--gray-100)', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                <Home size={24} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-900)' }}>Registration</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Submitted</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#166534' }}>Ministry Review</div>
                <div style={{ fontSize: '0.75rem', color: '#166534cc' }}>In progress...</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-400)' }}>Marketplace Access</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Locked</div>
              </div>
            </div>
          </div>
          <div className="auth-success-actions">
            <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', background: activeRoleConfig.color }}>
              Proceed to Login
            </Link>
            <Link to="/" className="auth-back-link" style={{ marginTop: '1rem', justifyContent: 'center' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Define active styles using CSS variables dynamically on the wrapper
  const dynamicStyles = {
    '--active-color': activeRoleConfig.color,
    '--active-bg': activeRoleConfig.bg
  };

  if (showOtpStep) {
    return (
      <div className="auth-page-wrapper" style={dynamicStyles}>
        <div className="auth-left-panel auth-left-premium">
          <div className="auth-left-overlay"></div>
          <div className="auth-left-content-inner">
            <Link to="/" className="auth-logo-link">
              <Leaf size={26} />
              <span>AgriGov <strong>Market</strong></span>
            </Link>
            <div className="auth-left-body">
              <div className="auth-ministry-tag"><Building2 size={14} /> Ministry of Agriculture</div>
              <h2 className="auth-left-headline">Verify Your Identity</h2>
              <p className="auth-left-lead">We've sent a verification code to <strong>{formData.email}</strong>. Please enter it to activate your account.</p>
            </div>
          </div>
        </div>

        <div className="auth-right-panel auth-right-clean">
          <div className="auth-form-wrapper" style={{maxWidth: '500px', width: '100%', margin: '0 auto', padding: '2rem'}}>
            <div className="auth-form-card bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
              <div style={{textAlign: 'center', marginBottom: '2rem'}}>
                <div style={{width: 64, height: 64, background: 'var(--active-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'}}>
                  <Mail size={32} color="var(--active-color)" />
                </div>
                <h1 style={{fontSize: '1.5rem', fontWeight: 700, color: 'var(--gray-900)'}}>Verify Email</h1>
                <p style={{color: 'var(--gray-500)', marginTop: '0.5rem'}}>Enter the 6-digit code sent to your inbox.</p>
              </div>

              <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem'}}>
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    style={{
                      width: '3.5rem', height: '4rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 700,
                      borderRadius: '0.75rem', border: '2px solid var(--gray-200)', background: 'var(--gray-50)',
                      transition: 'all 0.2s'
                    }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {apiError && (
                <div className="auth-alert-error" style={{marginBottom: '1.5rem'}}>
                  <X size={18} /> <span>{apiError}</span>
                </div>
              )}

              {otpSuccess ? (
                <div style={{textAlign: 'center', color: 'var(--active-color)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                  <CheckCircle size={20} /> Verified Successfully!
                </div>
              ) : (
                <button 
                  type="button" 
                  className="auth-submit-btn" 
                  style={{background: 'var(--active-color)'}}
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || otpCode.join('').length < 6}
                >
                  {otpLoading ? <span className="auth-spinner"></span> : 'Verify Account'}
                </button>
              )}

              <div style={{marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--gray-100)', paddingTop: '1.5rem'}}>
                <p style={{color: 'var(--gray-500)', fontSize: '0.875rem'}}>Didn't receive the code?</p>
                <button 
                  type="button"
                  onClick={handleResendOTP}
                  disabled={timer > 0}
                  style={{
                    background: 'none', border: 'none', color: timer > 0 ? 'var(--gray-400)' : 'var(--active-color)',
                    fontWeight: 600, cursor: timer > 0 ? 'default' : 'pointer', marginTop: '0.5rem'
                  }}
                >
                  {timer > 0 ? `Resend code in ${timer}s` : 'Resend Verification Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="ms-step-body space-y-6">
            
            <div className="space-y-4">
              <div className="auth-form-row">
                <div className="auth-field">
                  <label className="auth-label">Full Name *</label>
                  <input className={`auth-input ${fieldErrors.full_name ? 'auth-input-error' : ''}`} placeholder="Firstname LASTNAME" value={formData.full_name} onChange={e => setField('full_name', e.target.value)} />
                  {fieldErrors.full_name && <span className="auth-field-error">{fieldErrors.full_name}</span>}
                </div>
                <div className="auth-field">
                  <label className="auth-label">Phone Number *</label>
                  <input type="tel" className={`auth-input ${fieldErrors.phone ? 'auth-input-error' : ''}`} placeholder="+213 5XX XXX XXX" value={formData.phone} onChange={e => setField('phone', e.target.value)} />
                  {fieldErrors.phone && <span className="auth-field-error">{fieldErrors.phone}</span>}
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Email address *</label>
                <input type="email" className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`} placeholder="you@example.com" value={formData.email} onChange={e => setField('email', e.target.value)} />
                {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
              </div>
              <div className="auth-field">
                <label className="auth-label">Wilaya *</label>
                <select className={`auth-input auth-select ${fieldErrors.wilaya ? 'auth-input-error' : ''}`} value={formData.wilaya} onChange={e => setField('wilaya', e.target.value)}>
                  <option value="">Select your wilaya</option>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                {fieldErrors.wilaya && <span className="auth-field-error">{fieldErrors.wilaya}</span>}
              </div>
            </div>

          </div>
        );
      case 2:
        return (
          <div className="ms-step-body space-y-6">
            <div className="space-y-4">
              {activeRole === 'farmer' && (
                <>
                  <div className="auth-form-row">
                    <div className="auth-field">
                      <label className="auth-label">Farm Name *</label>
                      <input className={`auth-input ${fieldErrors.farm_name?'auth-input-error':''}`} placeholder="e.g. Ferme El Baraka" value={formData.farm_name} onChange={e=>setField('farm_name',e.target.value)} />
                      {fieldErrors.farm_name && <span className="auth-field-error">{fieldErrors.farm_name}</span>}
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Farm Location *</label>
                      <input className={`auth-input ${fieldErrors.farm_location?'auth-input-error':''}`} placeholder="e.g. Route de Blida" value={formData.farm_location} onChange={e=>setField('farm_location',e.target.value)} />
                      {fieldErrors.farm_location && <span className="auth-field-error">{fieldErrors.farm_location}</span>}
                    </div>
                  </div>
                  <div className="auth-form-row">
                    <div className="auth-field">
                      <label className="auth-label">Production Type *</label>
                      <select className={`auth-input auth-select ${fieldErrors.production_type?'auth-input-error':''}`} value={formData.production_type} onChange={e=>setField('production_type',e.target.value)}>
                        <option value="">Select type</option>
                        {['cereals','vegetables','fruits','livestock','mixed'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                      </select>
                      {fieldErrors.production_type && <span className="auth-field-error">{fieldErrors.production_type}</span>}
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Farm Size (Hectares)</label>
                      <input type="number" step="0.01" className={`auth-input ${fieldErrors.farm_size?'auth-input-error':''}`} placeholder="e.g. 5.5" value={formData.farm_size} onChange={e=>setField('farm_size',e.target.value)} />
                      {fieldErrors.farm_size && <span className="auth-field-error">{fieldErrors.farm_size}</span>}
                    </div>
                  </div>
                </>
              )}
              {activeRole === 'buyer' && (
                <>
                  <div className="auth-field">
                    <label className="auth-label">Buyer Type</label>
                    <div style={{display:'flex',gap:16,marginTop:8}}>
                      {['individual','business'].map(t=>(
                        <label key={t} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:formData.buyer_type===t?700:400}}>
                          <input type="radio" name="buyer_type" value={t} checked={formData.buyer_type===t} onChange={()=>setField('buyer_type',t)} style={{accentColor: 'var(--active-color)', width:16, height:16}} />
                          {t.charAt(0).toUpperCase()+t.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  {formData.buyer_type === 'business' && (
                    <div className="auth-form-row">
                      <div className="auth-field">
                        <label className="auth-label">Company Name *</label>
                        <input className={`auth-input ${fieldErrors.company_name?'auth-input-error':''}`} placeholder="Your company name" value={formData.company_name} onChange={e=>setField('company_name',e.target.value)} />
                        {fieldErrors.company_name && <span className="auth-field-error">{fieldErrors.company_name}</span>}
                      </div>
                      <div className="auth-field">
                        <label className="auth-label">Tax Number <span style={{fontWeight:400,color:'var(--gray-500)'}}>(optional)</span></label>
                        <input className="auth-input" placeholder="NIF / Tax ID" value={formData.tax_number} onChange={e=>setField('tax_number',e.target.value)} />
                      </div>
                    </div>
                  )}
                </>
              )}
              {activeRole === 'transporter' && (
                <>
                  <div className="auth-form-row">
                    <div className="auth-field">
                      <label className="auth-label">Vehicle Type *</label>
                      <select className={`auth-input auth-select ${fieldErrors.vehicle_type?'auth-input-error':''}`} value={formData.vehicle_type} onChange={e=>setField('vehicle_type',e.target.value)}>
                        <option value="">Select type</option>
                        {['truck','van','refrigerated','other'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                      </select>
                      {fieldErrors.vehicle_type && <span className="auth-field-error">{fieldErrors.vehicle_type}</span>}
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Capacity (tons)</label>
                      <input type="number" min="0" step="0.5" className="auth-input" placeholder="e.g. 5" value={formData.capacity_tons} onChange={e=>setField('capacity_tons',e.target.value)} />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Plate Number *</label>
                    <input className={`auth-input ${fieldErrors.plate_number?'auth-input-error':''}`} placeholder="e.g. 12345-100-16" value={formData.plate_number} onChange={e=>setField('plate_number',e.target.value)} />
                    {fieldErrors.plate_number && <span className="auth-field-error">{fieldErrors.plate_number}</span>}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="ms-step-body space-y-6">
            <div className="space-y-4">
              {activeRole === 'farmer' && (
                <>
                  <Dropzone 
                    label="Farmer ID Document *" 
                    hint="PDF, JPG or PNG (max 5MB)" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onDrop={(f) => setFile('farmer_id', f)}
                    file={files.farmer_id}
                    error={fieldErrors.farmer_id}
                  />
                  <Dropzone 
                    label="Farm Photos (optional)" 
                    hint="Multiple JPG or PNG images (max 5MB each)" 
                    accept=".jpg,.jpeg,.png"
                    multiple={true}
                    onDrop={handleFarmPhotosDrop}
                    files={files.farm_photos}
                    error={fieldErrors.farm_photos}
                  />
                </>
              )}
              {activeRole === 'buyer' && formData.buyer_type === 'business' && (
                <Dropzone 
                  label="Trade Register *" 
                  hint="Scan of official Trade Register. PDF, JPG or PNG (max 5MB)" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onDrop={(f) => setFile('trade_register', f)}
                  file={files.trade_register}
                  error={fieldErrors.trade_register}
                />
              )}
              {activeRole === 'buyer' && formData.buyer_type === 'individual' && (
                <div style={{textAlign:'center', padding: '3rem 0', color: 'var(--gray-500)'}}>
                  <CheckCircle size={48} style={{color: 'var(--active-color)', marginBottom: '1rem'}} />
                  <p>No documents required for individual buyers.</p>
                </div>
              )}
              {activeRole === 'transporter' && (
                <>
                  <Dropzone 
                    label="Driving License *" 
                    hint="Scan of Driving License. PDF, JPG or PNG (max 5MB)" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onDrop={(f) => setFile('driving_license', f)}
                    file={files.driving_license}
                    error={fieldErrors.driving_license}
                  />
                  <Dropzone 
                    label="Vehicle Registration (Carte Grise) *" 
                    hint="Scan of Vehicle Registration. PDF, JPG or PNG (max 5MB)" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onDrop={(f) => setFile('vehicle_registration', f)}
                    file={files.vehicle_registration}
                    error={fieldErrors.vehicle_registration}
                  />
                </>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="ms-step-body space-y-6">
            <div className="space-y-4">
              <div className="auth-form-row">
                <div className="auth-field">
                  <label className="auth-label">Password *</label>
                  <div className="auth-input-wrapper">
                    <input type={showPassword ? 'text' : 'password'} className={`auth-input auth-input-icon-right ${fieldErrors.password ? 'auth-input-error' : ''}`} placeholder="min. 8 characters" value={formData.password} onChange={e => setField('password', e.target.value)} />
                    <button type="button" className="auth-input-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
                </div>
                <div className="auth-field">
                  <label className="auth-label">Confirm Password *</label>
                  <div className="auth-input-wrapper">
                    <input type={showConfirm ? 'text' : 'password'} className={`auth-input auth-input-icon-right ${fieldErrors.confirm_password ? 'auth-input-error' : ''}`} placeholder="Repeat password" value={formData.confirm_password} onChange={e => setField('confirm_password', e.target.value)} />
                    <button type="button" className="auth-input-eye" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {fieldErrors.confirm_password && <span className="auth-field-error">{fieldErrors.confirm_password}</span>}
                </div>
              </div>
            </div>

            <div className="auth-field mt-6 p-5 rounded-xl" style={{ background: 'var(--active-bg)', border: '1px solid var(--gray-200)' }}>
              <label className={`auth-checkbox-label ${fieldErrors.terms ? 'auth-checkbox-error' : ''}`} style={{color: 'var(--gray-900)'}}>
                <input type="checkbox" checked={acceptTerms} onChange={e => { setAcceptTerms(e.target.checked); setFieldErrors(f => ({ ...f, terms: '' })); }} style={{accentColor: 'var(--active-color)'}} />
                <span>
                  I declare that the information provided is correct and I accept the platform's{' '}
                  <Link to="/faq" style={{ color: 'var(--active-color)', fontWeight: 600 }}>terms of service</Link>
                  {' '}and{' '}
                  <Link to="/faq" style={{ color: 'var(--active-color)', fontWeight: 600 }}>privacy policy</Link>.
                </span>
              </label>
              {fieldErrors.terms && <span className="auth-field-error mt-1 block">{fieldErrors.terms}</span>}
            </div>

            {apiError && (
              <div className="auth-alert-error" style={{marginTop: '1.5rem'}}>
                <X size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{apiError}</span>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const stepInfo = STEPS.find(s => s.id === currentStep);

  return (
    <div className="auth-page-wrapper" style={dynamicStyles}>
      {/* ── LEFT PANEL ── */}
      <div className="auth-left-panel auth-left-premium">
        <div className="auth-left-overlay"></div>
        <div className="auth-left-content-inner">
          <Link to="/" className="auth-logo-link">
            <Leaf size={26} />
            <span>AgriGov <strong>Market</strong></span>
          </Link>
          <div className="auth-left-body">
            <div className="auth-ministry-tag">
              <Building2 size={14} />
              Ministry of Agriculture
            </div>
            <h2 className="auth-left-headline">
              Algeria's Official Agricultural Marketplace
            </h2>
            <p className="auth-left-lead">
              Join the official network to access reference prices, verified partners, and manage your agricultural activities securely.
            </p>
            <ul className="auth-features-list">
              <li>
                <div className="auth-feature-icon-box">
                  <BarChart3 size={18} />
                </div>
                <span>Official reference prices published by the Ministry</span>
              </li>
              <li>
                <div className="auth-feature-icon-box">
                  <ShieldCheck size={18} />
                </div>
                <span>Verified and approved user network</span>
              </li>
              <li>
                <div className="auth-feature-icon-box">
                  <Truck size={18} />
                </div>
                <span>Integrated logistics across all wilayas</span>
              </li>
            </ul>
            <div className="auth-trust-stats">
              <div className="auth-trust-stat">
                <span className="auth-trust-val">2800+</span>
                <span className="auth-trust-lbl">Farmers</span>
              </div>
              <div className="auth-trust-sep"></div>
              <div className="auth-trust-stat">
                <span className="auth-trust-val">14k+</span>
                <span className="auth-trust-lbl">Buyers</span>
              </div>
              <div className="auth-trust-sep"></div>
              <div className="auth-trust-stat">
                <span className="auth-trust-val">58</span>
                <span className="auth-trust-lbl">Wilayas</span>
              </div>
            </div>
          </div>
          <div className="auth-left-footer">
            <CheckCircle size={14} />
            Certified compliant platform — Officially validated data
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right-panel auth-right-clean">
        <div className="auth-form-wrapper" style={{maxWidth: '600px', width: '100%', margin: '0 auto', padding: '2rem'}}>
          <Link to="/" className="auth-back-link" style={{marginBottom: '2rem', display: 'inline-flex'}}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          
          <div className="auth-form-header" style={{textAlign: 'left', marginBottom: '1.5rem'}}>
            <h1 className="auth-form-title" style={{fontSize: '1.75rem'}}>Create Account</h1>
            <p className="auth-form-subtitle">Already have an account? <Link to="/login" style={{color: 'var(--active-color)', fontWeight: 600}}>Sign in</Link></p>
          </div>

          {/* Role Selection Moved Above the Form Card */}
          {currentStep === 1 && (
            <div className="auth-role-selector bg-white p-1.5 rounded-2xl border border-gray-200 flex gap-2 mb-8 shadow-sm">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isActive = activeRole === r.value;
                return (
                  <button 
                    key={r.value} 
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-none cursor-pointer text-sm transition-all duration-200 ${isActive ? 'bg-white shadow-sm font-semibold' : 'bg-transparent text-gray-500 font-medium hover:text-gray-700'}`}
                    style={isActive ? { color: r.color, backgroundColor: 'var(--active-bg)' } : {}}
                    onClick={() => {
                      if (currentStep !== 1 && !window.confirm('Changing role will reset your current progress. Continue?')) return;
                      setActiveRole(r.value);
                      setCurrentStep(1);
                      setFieldErrors({});
                      setApiError('');
                    }}
                  >
                    <Icon size={18} />
                    {r.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Unified Form Card */}
          <div className="auth-form-card bg-white shadow-md rounded-2xl p-6 md:p-8" style={{border: '1px solid var(--gray-200)'}}>

            <div className="ms-progress-bar" style={{ width: '100%', background: 'var(--gray-200)', height: '6px', borderRadius: '3px', marginBottom: '2rem', overflow: 'hidden' }}>
              <div style={{ width: `${(currentStep / STEPS.length) * 100}%`, background: 'var(--active-color)', height: '100%', transition: 'width 0.3s ease' }}></div>
            </div>
            
            <div className="ms-step-header" style={{marginBottom: '1.5rem'}}>
              <h2 className="ms-step-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', color: 'var(--gray-900)', fontWeight: 700}}>
                {React.createElement(stepInfo.icon, { size: 22, color: 'var(--active-color)' })}
                {stepInfo.title}
              </h2>
              <p className="ms-step-subtitle" style={{color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: '0.25rem'}}>Step {currentStep} of {STEPS.length} — {stepInfo.sub}</p>
            </div>

            {/* Role selector has been moved into the Step 1 form container */}

            <div style={{minHeight: 300}}>
              {renderStepContent()}
            </div>

            <div className="ms-actions" style={{display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)'}}>
              {currentStep > 1 ? (
                <button type="button" className="auth-submit-btn" style={{background: 'white', color: 'var(--gray-700)', border: '1px solid var(--gray-300)', width: 'auto', padding: '0.75rem 1.5rem'}} onClick={prevStep} disabled={loading}>
                  <ChevronLeft size={18} /> Back
                </button>
              ) : <div></div>}

              {currentStep < STEPS.length ? (
                <button type="button" className="auth-submit-btn" style={{background: 'var(--active-color)', width: 'auto', padding: '0.75rem 1.5rem'}} onClick={nextStep}>
                  Continue <ChevronRight size={18} />
                </button>
              ) : (
                <button type="button" className="auth-submit-btn" style={{background: 'var(--active-color)', width: 'auto', padding: '0.75rem 1.5rem'}} onClick={handleSubmit} disabled={loading}>
                  {loading ? <span className="auth-spinner" style={{width:18,height:18,borderWidth:2}}></span> : <CheckCircle size={18} />}
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
