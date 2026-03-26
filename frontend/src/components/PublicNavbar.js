import React from 'react';
import { Link } from 'react-router-dom';

const PublicNavbar = () => {
  return (
    <nav className="public-navbar">
      <div className="container d-flex justify-content-between align-items-center">
        <Link to="/" className="navbar-brand">
          <span className="logo-icon">🌿</span> AgriGov <span className="logo-suffix">Market</span>
        </Link>
        <div className="nav-links d-none d-md-flex align-items-center">
          <Link to="/about">About</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact</Link>
          <div className="nav-divider mx-3"></div>
          <Link to="/login" className="nav-btn-link">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm ms-3">Get Started</Link>
        </div>
        <button className="mobile-menu-btn d-md-none">☰</button>
      </div>
    </nav>
  );
};

export default PublicNavbar;
