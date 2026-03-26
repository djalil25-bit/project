import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, BarChart3, ShieldCheck, Truck } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setError(result.message);
      }
      // Success navigation is handled by AuthContext's navigation
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-auth-wrapper">
      {/* Left Panel - Branding & Info */}
      <div className="auth-left-panel">
        <Link to="/" className="auth-brand d-flex align-items-center">
          <Leaf size={28} className="me-2" /> AgriGov
        </Link>
        <div className="auth-left-content">
          <h2 className="auth-quote">The most trusted marketplace for modern agriculture.</h2>
          <p className="lead opacity-75">Connect with thousands of farmers and buyers across the region. Transparent pricing, reliable logistics, and fresh produce.</p>
          
          <ul className="auth-feature-list">
            <li className="auth-feature-item">
              <div className="auth-feature-icon"><BarChart3 size={20} /></div>
              <span>Real-time market price references</span>
            </li>
            <li className="auth-feature-item">
              <div className="auth-feature-icon"><ShieldCheck size={20} /></div>
              <span>Verified and approved user network</span>
            </li>
            <li className="auth-feature-item">
              <div className="auth-feature-icon"><Truck size={20} /></div>
              <span>Integrated logistics and delivery tracking</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="auth-right-panel">
        <div className="auth-form-container">
          <div className="auth-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Enter your credentials to access your dashboard</p>
          </div>

          {error && <div className="alert alert-danger mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="name@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <div className="d-flex justify-content-between align-center mb-1">
                <label className="form-label mb-0">Password</label>
                <Link to="/contact" className="text-primary small fw-600" style={{fontSize: '0.75rem'}}>Forgot password?</Link>
              </div>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 btn-lg mt-3" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
