import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'buyer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/register/', formData);
      setSuccess(true);
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          setError(data);
        } else if (typeof data === 'object') {
          // Combine all errors into one string or handle specifically
          const messages = Object.keys(data).map(key => {
            const val = data[key];
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
            return `${fieldName}: ${Array.isArray(val) ? val.join(' ') : val}`;
          });
          setError(messages.join(' | '));
        } else {
          setError('Registration failed. Please check your connection.');
        }
      } else {
        setError('Network error. Unable to connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-bg">
        <div className="auth-card text-center" style={{maxWidth: '500px', padding: '3rem'}}>
          <div className="success-screen animate-fade-in">
            <div className="success-icon" style={{fontSize: '4rem', marginBottom: '1.5rem'}}>✅</div>
            <h2 className="fw-bold mb-3">Welcome to AgriGov!</h2>
            <div className="alert alert-info py-3 mb-4">
              <h4 className="h6 fw-bold mb-2">Registration Received</h4>
              <p className="small mb-0">
                Your account as a <strong>{formData.role}</strong> has been created successfully.
              </p>
            </div>
            <p className="text-muted mb-4">
              To maintain the integrity of our marketplace, all new accounts are 
              <strong> manually reviewed by our administrative team</strong>. 
              You will receive an email confirmation once your access is activated.
            </p>
            <div className="d-grid gap-2">
              <Link to="/login" className="btn btn-primary btn-lg">Return to Login</Link>
              <Link to="/" className="btn btn-link text-muted small">Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="split-auth-wrapper">
      {/* Left Panel */}
      <div className="auth-left-panel">
        <Link to="/" className="auth-brand">🌿 AgriGov</Link>
        <div className="auth-left-content">
          <h2 className="auth-quote">Grow your business with the right tools.</h2>
          <p className="lead opacity-75">Join thousands of professionals already using AgriGov to transform the agricultural marketplace.</p>
          
          <div className="info-box green-box bg-white text-dark mt-5">
            <h4 className="h6 fw-bold mb-2">Verified Community</h4>
            <p className="small mb-0 opacity-75">Every account is manually reviewed by our administrative team to ensure a high-quality marketplace experience.</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right-panel">
        <div className="auth-form-container" style={{maxWidth: '480px'}}>
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join the AgriGov ecosystem today</p>
          </div>

          {error && <div className="alert alert-danger mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Account Role</label>
              <div className="role-selector">
                <div className="role-option">
                  <input 
                    type="radio" id="role-buyer" name="role" value="buyer" 
                    checked={formData.role === 'buyer'} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  />
                  <label htmlFor="role-buyer">
                    <span className="role-option-icon">🛒</span>
                    <span>Buyer</span>
                  </label>
                </div>
                <div className="role-option">
                  <input 
                    type="radio" id="role-farmer" name="role" value="farmer"
                    checked={formData.role === 'farmer'} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  />
                  <label htmlFor="role-farmer">
                    <span className="role-option-icon">🚜</span>
                    <span>Farmer</span>
                  </label>
                </div>
                <div className="role-option">
                  <input 
                    type="radio" id="role-transporter" name="role" value="transporter"
                    checked={formData.role === 'transporter'} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  />
                  <label htmlFor="role-transporter">
                    <span className="role-option-icon">🚚</span>
                    <span>Transporter</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" className="form-input" placeholder="John Doe" required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="text" className="form-input" placeholder="+213..." required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" className="form-input" placeholder="name@example.com" required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" className="form-input" placeholder="min. 8 characters" required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 btn-lg mt-3" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
