import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Leaf, BarChart3, ShieldCheck, Truck, Eye, EyeOff,
  ChevronRight, Building2, CheckCircle, ArrowLeft
} from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) setError(result.message);
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
                <Leaf size={22} />
              </div>
              <h1 className="auth-form-title">Welcome back</h1>
              <p className="auth-form-subtitle">Sign in to your AgriGov Market account</p>
            </div>

            {/* Tabs */}
            <div className="auth-tabs">
              <Link to="/login" className="auth-tab auth-tab-active">Sign In</Link>
              <Link to="/register" className="auth-tab">Create Account</Link>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-alert-error">
                <ShieldCheck size={16} />
                {error}
              </div>
            )}

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
                disabled={loading}
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
