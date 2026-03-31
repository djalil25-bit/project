import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Leaf, BarChart3, ShieldCheck, Truck, Eye, EyeOff,
  ChevronRight, Building2, CheckCircle, ArrowLeft
} from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) setError(result.message);
    } catch {
      setError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* ── LEFT PANEL ── */}
      <div className="auth-left-panel auth-left-premium">
        <div className="auth-left-overlay"></div>
        <div className="auth-left-content-inner">
          <Link to="/" className="auth-logo-link">
            <Leaf size={26} />
            <span>AgriGov <strong>Market</strong></span>
          </Link>
          <div className="auth-left-body">
            <div className="auth-ministry-tag">
              <Building2 size={14} />
              Ministère de l'Agriculture
            </div>
            <h2 className="auth-left-headline">
              La place de marché agricole officielle d'Algérie
            </h2>
            <p className="auth-left-lead">
              Connectez-vous pour accéder à votre espace personnel, consulter les prix 
              officiels et gérer vos activités agricoles.
            </p>
            <ul className="auth-features-list">
              <li>
                <div className="auth-feature-icon-box">
                  <BarChart3 size={18} />
                </div>
                <span>Prix officiels de référence publiés par le Ministère</span>
              </li>
              <li>
                <div className="auth-feature-icon-box">
                  <ShieldCheck size={18} />
                </div>
                <span>Réseau d'utilisateurs vérifiés et approuvés</span>
              </li>
              <li>
                <div className="auth-feature-icon-box">
                  <Truck size={18} />
                </div>
                <span>Logistique intégrée sur toutes les wilayas</span>
              </li>
            </ul>
            <div className="auth-trust-stats">
              <div className="auth-trust-stat">
                <span className="auth-trust-val">2800+</span>
                <span className="auth-trust-lbl">Agriculteurs</span>
              </div>
              <div className="auth-trust-sep"></div>
              <div className="auth-trust-stat">
                <span className="auth-trust-val">14k+</span>
                <span className="auth-trust-lbl">Acheteurs</span>
              </div>
              <div className="auth-trust-sep"></div>
              <div className="auth-trust-stat">
                <span className="auth-trust-val">58</span>
                <span className="auth-trust-lbl">Wilayas</span>
              </div>
            </div>
          </div>
          <div className="auth-left-footer">
            <CheckCircle size={14} />
            Plateforme certifiée conforme — Données officiellement validées
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right-panel auth-right-clean">
        <div className="auth-form-wrapper">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>

          <div className="auth-form-card">
            {/* Header */}
            <div className="auth-form-header">
              <div className="auth-form-icon">
                <Leaf size={22} />
              </div>
              <h1 className="auth-form-title">Bienvenue</h1>
              <p className="auth-form-subtitle">Connectez-vous à votre espace AgriGov Market</p>
            </div>

            {/* Tabs */}
            <div className="auth-tabs">
              <Link to="/login" className="auth-tab auth-tab-active">Connexion</Link>
              <Link to="/register" className="auth-tab">Créer un compte</Link>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-alert-error">
                <ShieldCheck size={16} />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form-body">
              <div className="auth-field">
                <label className="auth-label">Adresse e-mail</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="exemple@domaine.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label">Mot de passe</label>
                  <Link to="/contact" className="auth-forgot">Mot de passe oublié ?</Link>
                </div>
                <div className="auth-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input auth-input-icon-right"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="auth-input-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="auth-remember-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Se souvenir de moi</span>
                </label>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <><span className="auth-spinner"></span> Connexion en cours…</>
                ) : (
                  <>Se connecter <ChevronRight size={18} /></>
                )}
              </button>
            </form>

            <p className="auth-switch-text">
              Pas encore de compte ?{' '}
              <Link to="/register">Créer un compte</Link>
            </p>

            <div className="auth-form-trust">
              <ShieldCheck size={13} />
              Accès sécurisé — Supervisé par le Ministère de l'Agriculture
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
