import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import AgriGovLogo from './common/AgriGovLogo';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/register' },
  { label: 'Official Prices', to: '/register' },
  { label: 'How it Works', to: '/#how', anchor: true },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const PublicNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <nav className="pub-navbar">
        <div className="container pub-navbar-inner">
          {/* Brand */}
          <Link to="/" className="pub-brand" style={{ textDecoration: 'none' }}>
            <AgriGovLogo size={26} variant="full" />
          </Link>

          {/* Desktop nav */}
          <div className="pub-nav-links">
            {NAV_LINKS.map(l => (
              l.anchor ? (
                <a
                  key={l.label}
                  href={l.to}
                  className="pub-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('how');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    else window.location.href = l.to;
                  }}
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.to}
                  className={`pub-nav-link ${location.pathname === l.to ? 'pub-nav-link-active' : ''}`}
                >
                  {l.label}
                </Link>
              )
            ))}
          </div>

          {/* CTA buttons */}
          <div className="pub-nav-ctas">
            <Link to="/login" className="pub-nav-login">
              Sign In
            </Link>
            <Link to="/register" className="pub-nav-register">
              Create Account <ChevronRight size={14} />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="pub-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="pub-mobile-menu">
            <div className="container">
              {NAV_LINKS.map(l => (
                <Link
                  key={l.label}
                  to={l.to}
                  className="pub-mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <div className="pub-mobile-ctas">
                <Link to="/login" className="pub-nav-login w-100" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="pub-nav-register w-100" onClick={() => setMobileOpen(false)}>
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default PublicNavbar;
