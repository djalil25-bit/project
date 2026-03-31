import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Menu, X, ChevronRight } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Accueil', to: '/' },
  { label: 'Produits', to: '/register' },
  { label: 'Prix officiels', to: '/register' },
  { label: 'Comment ça marche', to: '/#how' },
  { label: 'À propos', to: '/about' },
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
          <Link to="/" className="pub-brand">
            <span className="pub-brand-icon">
              <Leaf size={20} />
            </span>
            <span className="pub-brand-text">
              AgriGov<span className="pub-brand-market"> Market</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="pub-nav-links">
            {NAV_LINKS.map(l => (
              <Link
                key={l.label}
                to={l.to}
                className={`pub-nav-link ${location.pathname === l.to ? 'pub-nav-link-active' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="pub-nav-ctas">
            <Link to="/login" className="pub-nav-login">
              Connexion
            </Link>
            <Link to="/register" className="pub-nav-register">
              Créer un compte <ChevronRight size={14} />
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
                  Connexion
                </Link>
                <Link to="/register" className="pub-nav-register w-100" onClick={() => setMobileOpen(false)}>
                  Créer un compte
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
