import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import {
  Leaf, ShoppingBag, Sprout, Truck, ChevronRight, ChevronLeft,
  UploadCloud, X, CheckCircle, ShieldCheck, Eye, EyeOff, Building2,
  FileText, Image as ImageIcon, MapPin, Phone, User, Lock, Mail, CreditCard, LayoutDashboard
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
    farm_name: '', farm_location: '', production_type: '',
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
      const loginRes = await login(formData.email, formData.password);
      if (!loginRes.success) setSuccess(true);
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

  if (success) {
    return (
      <div className="auth-page-wrapper auth-page-single">
        <div className="auth-success-screen">
          <div className="auth-success-icon" style={{color: activeRoleConfig.color}}><CheckCircle size={80} /></div>
          <div className="auth-logo-link" style={{ marginBottom: '2rem', color: 'var(--gray-900)' }}>
            <Leaf size={26} color={activeRoleConfig.color} /> <span>AgriGov <strong>Market</strong></span>
          </div>
          <h2 style={{color: 'var(--gray-900)'}}>Registration successful!</h2>
          <div className="auth-success-alert" style={{borderColor: activeRoleConfig.color, backgroundColor: activeRoleConfig.bg}}>
            <h4 style={{color: activeRoleConfig.color}}>Account pending validation</h4>
            <p>
              Your account as a <strong>{activeRoleConfig.label}</strong> has 
              been created successfully. To ensure platform integrity, each account is 
              <strong> manually reviewed</strong> by Ministry teams. You will receive 
              an email confirmation upon activation.
            </p>
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="ms-step-body">
            <div className="auth-form-row">
              <div className="auth-field">
                <label className="auth-label"><User size={14} style={{verticalAlign:'middle',marginRight:4}}/> Full Name *</label>
                <input className={`auth-input ${fieldErrors.full_name ? 'auth-input-error' : ''}`} placeholder="Firstname LASTNAME" value={formData.full_name} onChange={e => setField('full_name', e.target.value)} />
                {fieldErrors.full_name && <span className="auth-field-error">{fieldErrors.full_name}</span>}
              </div>
              <div className="auth-field">
                <label className="auth-label"><Phone size={14} style={{verticalAlign:'middle',marginRight:4}}/> Phone Number *</label>
                <input type="tel" className={`auth-input ${fieldErrors.phone ? 'auth-input-error' : ''}`} placeholder="+213 5XX XXX XXX" value={formData.phone} onChange={e => setField('phone', e.target.value)} />
                {fieldErrors.phone && <span className="auth-field-error">{fieldErrors.phone}</span>}
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label"><Mail size={14} style={{verticalAlign:'middle',marginRight:4}}/> Email address *</label>
              <input type="email" className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`} placeholder="you@example.com" value={formData.email} onChange={e => setField('email', e.target.value)} />
              {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
            </div>
            <div className="auth-field">
              <label className="auth-label"><MapPin size={14} style={{verticalAlign:'middle',marginRight:4}}/> Wilaya *</label>
              <select className={`auth-input auth-select ${fieldErrors.wilaya ? 'auth-input-error' : ''}`} value={formData.wilaya} onChange={e => setField('wilaya', e.target.value)}>
                <option value="">Select your wilaya</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              {fieldErrors.wilaya && <span className="auth-field-error">{fieldErrors.wilaya}</span>}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="ms-step-body">
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
                <div className="auth-field">
                  <label className="auth-label">Production Type *</label>
                  <select className={`auth-input auth-select ${fieldErrors.production_type?'auth-input-error':''}`} value={formData.production_type} onChange={e=>setField('production_type',e.target.value)}>
                    <option value="">Select type</option>
                    {['cereals','vegetables','fruits','livestock','mixed'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                  {fieldErrors.production_type && <span className="auth-field-error">{fieldErrors.production_type}</span>}
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
        );
      case 3:
        return (
          <div className="ms-step-body">
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
        );
      case 4:
        return (
          <div className="ms-step-body">
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

            <div className="auth-field" style={{marginTop: '1.5rem', background: 'var(--active-bg)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--gray-200)'}}>
              <label className={`auth-checkbox-label ${fieldErrors.terms ? 'auth-checkbox-error' : ''}`} style={{color: 'var(--gray-900)'}}>
                <input type="checkbox" checked={acceptTerms} onChange={e => { setAcceptTerms(e.target.checked); setFieldErrors(f => ({ ...f, terms: '' })); }} style={{accentColor: 'var(--active-color)'}} />
                <span>
                  I declare that the information provided is correct and I accept the platform's{' '}
                  <Link to="/faq" style={{ color: 'var(--active-color)', fontWeight: 600 }}>terms of service</Link>
                  {' '}and{' '}
                  <Link to="/faq" style={{ color: 'var(--active-color)', fontWeight: 600 }}>privacy policy</Link>.
                </span>
              </label>
              {fieldErrors.terms && <span className="auth-field-error">{fieldErrors.terms}</span>}
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
    <div className="ms-container" style={dynamicStyles}>
      
      {/* ── SIDEBAR ── */}
      <aside className="ms-sidebar">
        <Link to="/" className="ms-sidebar-logo">
          <Leaf size={28} color="var(--active-color)" />
          <span>AgriGov <strong>Market</strong></span>
        </Link>

        <h3 className="ms-sidebar-title">Select your profile</h3>
        
        <div className="ms-role-list">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isActive = activeRole === r.value;
            return (
              <button 
                key={r.value} 
                className={`ms-role-btn ${isActive ? 'active' : ''}`} 
                onClick={() => {
                  if (currentStep !== 1 && !window.confirm('Changing role will reset your current progress. Continue?')) return;
                  setActiveRole(r.value);
                  setCurrentStep(1);
                  setFieldErrors({});
                  setApiError('');
                }}
              >
                <div className="ms-role-icon"><Icon size={22} /></div>
                <div className="ms-role-info">
                  <span className="ms-role-name">{r.label}</span>
                  <span className="ms-role-desc">{r.desc}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="ms-sidebar-footer">
          <ShieldCheck size={16} style={{marginBottom: 8, color: 'var(--gray-400)'}} />
          <p style={{margin:0}}>Supervised by the Ministry of Agriculture. All data is securely processed.</p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="ms-content">
        <header className="ms-content-header">
          <Link to="/" className="ms-back-link"><ChevronLeft size={16} /> Home</Link>
          <div className="ms-login-link">Already have an account? <Link to="/login">Sign in</Link></div>
        </header>

        <div className="ms-form-wrapper">
          <div className="ms-progress-bar" style={{ width: `${(currentStep / STEPS.length) * 100}%` }}></div>
          
          <div className="ms-step-header">
            <h2 className="ms-step-title">
              {React.createElement(stepInfo.icon, { size: 26, color: 'var(--active-color)' })}
              {stepInfo.title}
            </h2>
            <p className="ms-step-subtitle">Step {currentStep} of {STEPS.length} — {stepInfo.sub}</p>
          </div>

          <div style={{minHeight: 300}}>
            {renderStepContent()}
          </div>

          <div className="ms-actions">
            {currentStep > 1 ? (
              <button type="button" className="ms-btn-prev" onClick={prevStep} disabled={loading}>
                <ChevronLeft size={18} /> Back
              </button>
            ) : <div></div>}

            {currentStep < STEPS.length ? (
              <button type="button" className="ms-btn-next" onClick={nextStep}>
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button type="button" className="ms-btn-next" onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="auth-spinner" style={{width:18,height:18,borderWidth:2}}></span> : <CheckCircle size={18} />}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            )}
          </div>
        </div>
      </main>

    </div>
  );
};

export default Register;
