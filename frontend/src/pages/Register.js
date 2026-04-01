import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Leaf, ShieldCheck, CheckCircle, ShoppingBag, Sprout,
  Truck, Building2, ChevronRight, Eye, EyeOff, ArrowLeft, X
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
  { value: 'buyer', label: 'Buyer', icon: <ShoppingBag size={22} />, desc: 'Purchase agricultural products', color: '#dbeafe', iconColor: '#1d4ed8' },
  { value: 'farmer', label: 'Farmer', icon: <Sprout size={22} />, desc: 'Sell farm produce', color: '#dcfce7', iconColor: '#16a34a' },
  { value: 'transporter', label: 'Transporter', icon: <Truck size={22} />, desc: 'Delivery missions', color: '#fef3c7', iconColor: '#d97706' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    email: '', password: '', confirm_password: '',
    full_name: '', phone: '', role: 'buyer', wilaya: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const set = (key, val) => {
    setFormData(f => ({ ...f, [key]: val }));
    setFieldErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required.';
    if (!formData.email.trim()) errs.email = 'Email address is required.';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required.';
    if (!formData.wilaya) errs.wilaya = 'Please select a wilaya.';
    if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (formData.password !== formData.confirm_password) errs.confirm_password = 'Passwords do not match.';
    if (!acceptTerms) errs.terms = 'You must accept the terms of service.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setLoading(true);
    setError('');

    // Build payload matching backend contract (no confirm_password sent)
    const { confirm_password, ...payload } = formData;

    try {
      await api.post('/auth/register/', payload);
      setSuccess(true);
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') { setError(data); }
        else if (typeof data === 'object') {
          const msgs = Object.keys(data).map(key => {
            const val = data[key];
            const name = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
            return `${name}: ${Array.isArray(val) ? val.join(' ') : val}`;
          });
          setError(msgs.join(' | '));
        }
      } else {
        setError('Network error. Unable to connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── SUCCESS SCREEN ── */
  if (success) {
    return (
      <div className="auth-page-wrapper auth-page-single">
        <div className="auth-success-screen">
          <div className="auth-success-icon">✅</div>
          <div className="auth-logo-link" style={{ marginBottom: '2rem' }}>
            <Leaf size={22} /> <span>AgriGov <strong>Market</strong></span>
          </div>
          <h2>Registration successful!</h2>
          <div className="auth-success-alert">
            <h4>Account pending validation</h4>
            <p>
              Your account as a <strong>{ROLES.find(r => r.value === formData.role)?.label || formData.role}</strong> has 
              been created successfully. To ensure platform integrity, each account is 
              <strong> manually reviewed</strong> by Ministry teams. You will receive 
              an email confirmation upon activation.
            </p>
          </div>
          <div className="auth-success-actions">
            <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
              Back to Login
            </Link>
            <Link to="/" className="auth-back-link" style={{ marginTop: '1rem', justifyContent: 'center' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── FORM ── */
  return (
    <div className="auth-page-wrapper">
      {/* LEFT PANEL */}
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
              Join the national agricultural platform
            </h2>
            <p className="auth-left-lead">
              Each account is manually verified to guarantee a trusted ecosystem 
              between producers, buyers, and transporters.
            </p>
            <div className="auth-register-info-box">
              <ShieldCheck size={20} />
              <div>
                <strong>Verified community</strong>
                <p>All registrations are reviewed by platform administrators before activation.</p>
              </div>
            </div>
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
            Certified platform — Supervised by the Ministry of Agriculture
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right-panel auth-right-clean auth-right-scroll">
        <div className="auth-form-wrapper">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div className="auth-form-card">
            <div className="auth-form-header">
              <div className="auth-form-icon">
                <Leaf size={22} />
              </div>
              <h1 className="auth-form-title">Create Account</h1>
              <p className="auth-form-subtitle">Join AgriGov Market today</p>
            </div>

            {/* Tabs */}
            <div className="auth-tabs">
              <Link to="/login" className="auth-tab">Sign In</Link>
              <Link to="/register" className="auth-tab auth-tab-active">Create Account</Link>
            </div>

            {error && (
              <div className="auth-alert-error">
                <X size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form-body">

              {/* Role selector */}
              <div className="auth-field">
                <label className="auth-label">I am a</label>
                <div className="auth-role-grid">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      className={`auth-role-card ${formData.role === r.value ? 'auth-role-card-active' : ''}`}
                      onClick={() => set('role', r.value)}
                      style={formData.role === r.value ? { background: r.color, borderColor: r.iconColor } : {}}
                    >
                      <span className="auth-role-card-icon" style={formData.role === r.value ? { color: r.iconColor } : {}}>
                        {r.icon}
                      </span>
                      <span className="auth-role-card-label">{r.label}</span>
                      <span className="auth-role-card-desc">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="auth-form-row">
                <div className="auth-field">
                  <label className="auth-label">Full Name</label>
                  <input
                    type="text"
                    className={`auth-input ${fieldErrors.full_name ? 'auth-input-error' : ''}`}
                    placeholder="Firstname LASTNAME"
                    value={formData.full_name}
                    onChange={e => set('full_name', e.target.value)}
                  />
                  {fieldErrors.full_name && <span className="auth-field-error">{fieldErrors.full_name}</span>}
                </div>
                <div className="auth-field">
                  <label className="auth-label">Phone Number</label>
                  <input
                    type="tel"
                    className={`auth-input ${fieldErrors.phone ? 'auth-input-error' : ''}`}
                    placeholder="+213 5XX XXX XXX"
                    value={formData.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                  {fieldErrors.phone && <span className="auth-field-error">{fieldErrors.phone}</span>}
                </div>
              </div>

              {/* Email */}
              <div className="auth-field">
                <label className="auth-label">Email address</label>
                <input
                  type="email"
                  className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => set('email', e.target.value)}
                />
                {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
              </div>

              {/* Wilaya */}
              <div className="auth-field">
                <label className="auth-label">Wilaya</label>
                <select
                  className={`auth-input auth-select ${fieldErrors.wilaya ? 'auth-input-error' : ''}`}
                  value={formData.wilaya}
                  onChange={e => set('wilaya', e.target.value)}
                >
                  <option value="">Select your wilaya</option>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                {fieldErrors.wilaya && <span className="auth-field-error">{fieldErrors.wilaya}</span>}
              </div>

              {/* Passwords */}
              <div className="auth-form-row">
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`auth-input auth-input-icon-right ${fieldErrors.password ? 'auth-input-error' : ''}`}
                      placeholder="min. 8 characters"
                      value={formData.password}
                      onChange={e => set('password', e.target.value)}
                    />
                    <button type="button" className="auth-input-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
                </div>
                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className={`auth-input auth-input-icon-right ${fieldErrors.confirm_password ? 'auth-input-error' : ''}`}
                      placeholder="Repeat password"
                      value={formData.confirm_password}
                      onChange={e => set('confirm_password', e.target.value)}
                    />
                    <button type="button" className="auth-input-eye" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {fieldErrors.confirm_password && <span className="auth-field-error">{fieldErrors.confirm_password}</span>}
                </div>
              </div>

              {/* Terms */}
              <div className="auth-field">
                <label className={`auth-checkbox-label ${fieldErrors.terms ? 'auth-checkbox-error' : ''}`}>
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => { setAcceptTerms(e.target.checked); setFieldErrors(f => ({ ...f, terms: '' })); }}
                  />
                  <span>
                    I accept the{' '}
                    <Link to="/faq" style={{ color: 'var(--primary)', fontWeight: 600 }}>terms of service</Link>
                    {' '}and the{' '}
                    <Link to="/faq" style={{ color: 'var(--primary)', fontWeight: 600 }}>privacy policy</Link>
                  </span>
                </label>
                {fieldErrors.terms && <span className="auth-field-error">{fieldErrors.terms}</span>}
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <><span className="auth-spinner"></span> Creating account…</>
                ) : (
                  <>Create my account <ChevronRight size={18} /></>
                )}
              </button>
            </form>

            <p className="auth-switch-text">
              Already have an account?{' '}
              <Link to="/login">Sign In</Link>
            </p>

            <div className="auth-form-trust">
              <ShieldCheck size={13} />
              Manually verified account — Supervised by the Ministry of Agriculture
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
