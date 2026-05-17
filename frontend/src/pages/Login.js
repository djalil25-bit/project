import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3, ShieldCheck, Truck, Eye, EyeOff,
  ChevronRight, Building2, CheckCircle, ArrowLeft
} from 'lucide-react';
import AgriGovLogo from '../components/common/AgriGovLogo';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [attempts, setAttempts] = useState(() => parseInt(localStorage.getItem('loginAttempts') || '0', 10));
  const [lockoutUntil, setLockoutUntil] = useState(() => parseInt(localStorage.getItem('lockoutUntil') || '0', 10));
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (lockoutUntil > Date.now()) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setTimeLeft(remaining);
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockoutUntil(0);
          setAttempts(0);
          localStorage.removeItem('lockoutUntil');
          localStorage.removeItem('loginAttempts');
          setTimeLeft(0);
          setError('');
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutUntil > Date.now()) return;

    setError('');
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('loginAttempts', newAttempts.toString());
        
        if (newAttempts >= 3) {
          const lockoutTime = Date.now() + 5 * 60 * 1000; // 5 mins
          setLockoutUntil(lockoutTime);
          localStorage.setItem('lockoutUntil', lockoutTime.toString());
          setError('Too many failed attempts. Try again later.');
        } else {
          setError(result.message);
        }
      } else {
        setAttempts(0);
        localStorage.removeItem('loginAttempts');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* ── LEFT PANEL ── */}
      <div className="auth-left-panel auth-left-premium">
        <div className="auth-left-overlay"></div>
        <div className="auth-left-content-inner">
          <Link to="/" className="auth-logo-link" style={{ textDecoration: 'none' }}>
            <AgriGovLogo size={32} variant="full" />
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
              Sign in to access your personal workspace, view official Ministry prices, and manage your agricultural activities.
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
        <div className="auth-form-wrapper">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div className="auth-form-card">
            {/* Header */}
            <div className="auth-form-header">
              <div className="auth-form-icon">
                <AgriGovLogo size={28} variant="compact" />
              </div>
              <h1 className="auth-form-title">Welcome back</h1>
              <p className="auth-form-subtitle">Sign in to your AgriGov Market account</p>
            </div>

            {/* Tabs */}
            <div className="auth-tabs">
              <Link to="/login" className="auth-tab auth-tab-active">Sign In</Link>
              <Link to="/register" className="auth-tab">Create Account</Link>
            </div>

            {/* Error / Lockout */}
            {lockoutUntil > Date.now() ? (
              <div className="auth-alert-error" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                <ShieldCheck size={16} />
                Try again later. Blocked for {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}.
              </div>
            ) : error ? (
              <div className="auth-alert-error">
                <ShieldCheck size={16} />
                {error}
              </div>
            ) : null}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form-body">
              <div className="auth-field">
                <label className="auth-label">Email address</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label">Password</label>
                  <Link to="/contact" className="auth-forgot">Forgot password?</Link>
                </div>
                <div className="auth-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input auth-input-icon-right"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="auth-input-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="auth-remember-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || lockoutUntil > Date.now()}
              >
                {loading ? (
                  <><span className="auth-spinner"></span> Signing in…</>
                ) : (
                  <>Sign In <ChevronRight size={18} /></>
                )}
              </button>
            </form>

            <p className="auth-switch-text">
              Don't have an account?{' '}
              <Link to="/register">Create one</Link>
            </p>

            <div className="auth-form-trust">
              <ShieldCheck size={13} />
              Secure access — Supervised by the Ministry of Agriculture
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
