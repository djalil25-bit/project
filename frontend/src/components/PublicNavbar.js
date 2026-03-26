import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Menu } from 'lucide-react';

const PublicNavbar = () => {
  return (
    <nav className="public-navbar">
      <div className="container d-flex justify-content-between align-items-center h-100">
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <span className="logo-icon me-2 d-flex align-items-center">
            <Leaf size={24} className="text-primary" />
          </span> 
          AgriGov <span className="logo-suffix ms-1">Market</span>
        </Link>
        <div className="nav-links d-none d-md-flex align-items-center">
          <Link to="/about">About</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact</Link>
          <div className="nav-divider mx-3"></div>
          <Link to="/login" className="nav-btn-link">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm ms-3">Get Started</Link>
        </div>
        <button className="mobile-menu-btn d-md-none bg-transparent border-0 p-1">
          <Menu size={24} />
        </button>
      </div>
    </nav>
  );
};

export default PublicNavbar;
