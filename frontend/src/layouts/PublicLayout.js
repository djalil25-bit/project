import React from 'react';
import PublicNavbar from '../components/PublicNavbar';

const PublicLayout = ({ children }) => {
  return (
    <div className="public-layout-wrapper">
      <PublicNavbar />
      <main className="public-main-content">
        {children}
      </main>
      <footer className="public-footer section-padding pb-4">
        <div className="container">
          <div className="row g-4 mb-5">
            <div className="col-lg-4 col-md-6">
              <h4 className="fw-bold mb-4">🌿 AgriGov Market</h4>
              <p className="text-muted">
                Modernizing agriculture through technology. 
                Connecting producers directly to consumers and logistics.
              </p>
            </div>
            <div className="col-lg-2 col-md-3">
              <h5 className="fw-bold mb-3">Company</h5>
              <ul className="list-unstyled footer-links">
                <li><a href="/about">About Us</a></li>
                <li><a href="/faq">FAQ</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </div>
            <div className="col-lg-2 col-md-3">
              <h5 className="fw-bold mb-3">Roles</h5>
              <ul className="list-unstyled footer-links">
                <li><a href="/register">For Farmers</a></li>
                <li><a href="/register">For Buyers</a></li>
                <li><a href="/register">For Transporters</a></li>
              </ul>
            </div>
            <div className="col-lg-4 col-md-6">
              <h5 className="fw-bold mb-3">Newsletter</h5>
              <p className="text-muted small">Stay updated with the latest market trends.</p>
              <div className="input-group mb-3">
                <input type="text" className="form-control form-control-sm" placeholder="Email" />
                <button className="btn btn-primary btn-sm">Subscribe</button>
              </div>
            </div>
          </div>
          <div className="border-top pt-4 text-center">
            <p className="text-muted small mb-0">&copy; 2026 AgriGov Market Platform. Built for the future of agriculture.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
