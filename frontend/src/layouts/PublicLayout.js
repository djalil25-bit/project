import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Phone, Mail, MapPin, ShieldCheck, Building2 } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';

const PublicLayout = ({ children }) => {
  return (
    <div className="public-layout-wrapper">
      <PublicNavbar />
      <main className="public-main-content">
        {children}
      </main>

      {/* ── RICH FOOTER ── */}
      <footer className="pub-footer">
        <div className="pub-footer-top">
          <div className="container">
            <div className="pub-footer-grid">

              {/* Brand column */}
              <div className="pub-footer-brand-col">
                <Link to="/" className="pub-footer-brand">
                  <Leaf size={22} />
                  <span>AgriGov <strong>Market</strong></span>
                </Link>
                <p className="pub-footer-brand-desc">
                  Official platform for agricultural trade and logistics coordination, 
                  under the supervision of the Ministry of Agriculture and Rural Development of Algeria.
                </p>
                <div className="pub-footer-ministry">
                  <Building2 size={16} />
                  <span>Ministry of Agriculture</span>
                </div>
              </div>

              {/* Platform links */}
              <div className="pub-footer-col">
                <h5 className="pub-footer-col-title">Platform</h5>
                <ul className="pub-footer-links">
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/register">Register</Link></li>
                  <li><Link to="/login">Sign In</Link></li>
                  <li><Link to="/register">Official Prices</Link></li>
                  <li><Link to="/about">About Us</Link></li>
                </ul>
              </div>

              {/* Roles */}
              <div className="pub-footer-col">
                <h5 className="pub-footer-col-title">Actors</h5>
                <ul className="pub-footer-links">
                  <li><Link to="/register">Farmer Space</Link></li>
                  <li><Link to="/register">Buyer Space</Link></li>
                  <li><Link to="/register">Transporter Space</Link></li>
                  <li><Link to="/register">Administration</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="pub-footer-col">
                <h5 className="pub-footer-col-title">Legal & Help</h5>
                <ul className="pub-footer-links">
                  <li><Link to="/faq">FAQ</Link></li>
                  <li><Link to="/contact">Support</Link></li>
                  <li><Link to="/faq">Terms of Service</Link></li>
                  <li><Link to="/faq">Privacy Policy</Link></li>
                </ul>
              </div>

              {/* Contact */}
              <div className="pub-footer-col">
                <h5 className="pub-footer-col-title">Contact</h5>
                <ul className="pub-footer-contact-list">
                  <li>
                    <Phone size={15} />
                    <span>+213 21 XX XX XX</span>
                  </li>
                  <li>
                    <Mail size={15} />
                    <span>support@agrigov.dz</span>
                  </li>
                  <li>
                    <MapPin size={15} />
                    <span>Algiers, Algeria</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Footer bottom bar */}
        <div className="pub-footer-bottom">
          <div className="container">
            <div className="pub-footer-bottom-inner">
              <p className="pub-footer-copy">
                © 2026 AgriGov Market — All rights reserved. Official platform of the Ministry of Agriculture of Algeria.
              </p>
              <div className="pub-footer-trust">
                <ShieldCheck size={14} />
                <span>Secure Data · Supervised by the Ministry</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
