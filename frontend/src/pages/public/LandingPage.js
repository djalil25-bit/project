import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Connecting the <span>Roots</span> of Agriculture</h1>
            <p className="hero-subtitle">
              AgriGov is the premium marketplace for farmers, buyers, and transporters. 
              Modernizing the supply chain with transparency, fair pricing, and seamless logistics.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
              <Link to="/about" className="btn btn-outline btn-lg">Learn More</Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-card stat-card">
              <div className="icon">📈</div>
              <div>
                <h4>Live Market Prices</h4>
                <p>Updated every hour</p>
              </div>
            </div>
            <div className="floating-card user-card">
              <div className="icon">🚜</div>
              <div>
                <h4>500+ Farmers</h4>
                <p>Verified & Approved</p>
              </div>
            </div>
            {/* Visual element placeholder or actual image */}
            <div className="hero-blob"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section section-padding">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose AgriGov?</h2>
            <p className="section-subtitle">A comprehensive ecosystem designed for the modern agricultural economy.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Fair Pricing</h3>
              <p>Admin-regulated price ranges ensure farmers get fair value and buyers get honest prices.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Integrated Logistics</h3>
              <p>Connect with professional transporters across all service zones for reliable delivery.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Verified Users</h3>
              <p>Strict admin approval process ensures a secure and trustworthy marketplace for everyone.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-time Analytics</h3>
              <p>Track your sales, production, and missions with professional dashboard insights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="roles-section section-padding beige-bg">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">A Platform for Everyone</h2>
            <p className="section-subtitle">Tailored experiences for every role in the agricultural supply chain.</p>
          </div>
          <div className="roles-grid">
            <div className="role-showcase">
              <div className="role-info">
                <span className="badge">For Farmers</span>
                <h3>Scale Your Farm Business</h3>
                <ul>
                  <li>List products from a professional catalog</li>
                  <li>Access real-time reference prices</li>
                  <li>Manage harvests and sales analytics</li>
                  <li>One-click delivery requests</li>
                </ul>
              </div>
            </div>
            <div className="role-showcase">
              <div className="role-info">
                <span className="badge">For Buyers</span>
                <h3>Fresh Produce, Direct Access</h3>
                <ul>
                  <li>Browse multiple farms in one place</li>
                  <li>Secure checkout with order tracking</li>
                  <li>Transparent pricing & quality info</li>
                  <li>Doorstep delivery integration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section section-padding text-center">
        <div className="container">
          <h2 className="cta-title">Ready to transform your agricultural journey?</h2>
          <p className="cta-subtitle">Join the growing community of AgriGov today.</p>
          <Link to="/register" className="btn btn-primary btn-lg">Join Now</Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
