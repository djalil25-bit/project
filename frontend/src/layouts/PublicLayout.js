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
                  Plateforme officielle de commerce agricole et de coordination logistique, 
                  sous la tutelle du Ministère de l'Agriculture et du Développement Rural d'Algérie.
                </p>
                <div className="pub-footer-ministry">
                  <Building2 size={16} />
                  <span>Ministère de l'Agriculture</span>
                </div>
              </div>

              {/* Platform links */}
              <div className="pub-footer-col">
                <h5 className="pub-footer-col-title">Plateforme</h5>
                <ul className="pub-footer-links">
                  <li><Link to="/">Accueil</Link></li>
                  <li><Link to="/register">Inscription</Link></li>
                  <li><Link to="/login">Connexion</Link></li>
                  <li><Link to="/register">Prix officiels</Link></li>
                  <li><Link to="/about">À propos</Link></li>
                </ul>
              </div>

              {/* Roles */}
              <div className="pub-footer-col">
                <h5 className="pub-footer-col-title">Acteurs</h5>
                <ul className="pub-footer-links">
                  <li><Link to="/register">Espace Agriculteur</Link></li>
                  <li><Link to="/register">Espace Acheteur</Link></li>
                  <li><Link to="/register">Espace Transporteur</Link></li>
                  <li><Link to="/register">Administration</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="pub-footer-col">
                <h5 className="pub-footer-col-title">Légal & Aide</h5>
                <ul className="pub-footer-links">
                  <li><Link to="/faq">FAQ</Link></li>
                  <li><Link to="/contact">Assistance</Link></li>
                  <li><Link to="/faq">Conditions d'utilisation</Link></li>
                  <li><Link to="/faq">Politique de confidentialité</Link></li>
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
                    <span>Alger, Algérie</span>
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
                © 2026 AgriGov Market — Tous droits réservés. Plateforme officielle du Ministère de l'Agriculture d'Algérie.
              </p>
              <div className="pub-footer-trust">
                <ShieldCheck size={14} />
                <span>Données sécurisées · Supervisé par le Ministère</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
