import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Leaf, ShieldCheck, CheckCircle, ShoppingBag, Sprout,
  Truck, Building2, ChevronRight, Eye, EyeOff, ArrowLeft, X
} from 'lucide-react';

const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arreridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued',
  'Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent',
  'Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar','Ouled Djellal',
  'Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet','El M\'Ghair','El Meniaa',
];

const ROLES = [
  { value: 'buyer', label: 'Acheteur', icon: <ShoppingBag size={22} />, desc: 'Achat de produits agricoles', color: '#dbeafe', iconColor: '#1d4ed8' },
  { value: 'farmer', label: 'Agriculteur', icon: <Sprout size={22} />, desc: 'Vente de produits de la ferme', color: '#dcfce7', iconColor: '#16a34a' },
  { value: 'transporter', label: 'Transporteur', icon: <Truck size={22} />, desc: 'Missions de livraison', color: '#fef3c7', iconColor: '#d97706' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    email: '', password: '', confirm_password: '',
    full_name: '', phone: '', role: 'buyer', wilaya: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const set = (key, val) => {
    setFormData(f => ({ ...f, [key]: val }));
    setFieldErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Le nom complet est requis.';
    if (!formData.email.trim()) errs.email = 'L\'adresse e-mail est requise.';
    if (!formData.phone.trim()) errs.phone = 'Le numéro de téléphone est requis.';
    if (!formData.wilaya) errs.wilaya = 'Veuillez sélectionner une wilaya.';
    if (formData.password.length < 8) errs.password = 'Le mot de passe doit comporter au moins 8 caractères.';
    if (formData.password !== formData.confirm_password) errs.confirm_password = 'Les mots de passe ne correspondent pas.';
    if (!acceptTerms) errs.terms = 'Vous devez accepter les conditions d\'utilisation.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setLoading(true);
    setError('');

    // Build payload matching backend contract (no confirm_password sent)
    const { confirm_password, ...payload } = formData;

    try {
      await api.post('/auth/register/', payload);
      setSuccess(true);
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') { setError(data); }
        else if (typeof data === 'object') {
          const msgs = Object.keys(data).map(key => {
            const val = data[key];
            const name = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
            return `${name}: ${Array.isArray(val) ? val.join(' ') : val}`;
          });
          setError(msgs.join(' | '));
        }
      } else {
        setError('Erreur réseau. Impossible de se connecter au serveur.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── SUCCESS SCREEN ── */
  if (success) {
    return (
      <div className="auth-page-wrapper auth-page-single">
        <div className="auth-success-screen">
          <div className="auth-success-icon">✅</div>
          <div className="auth-logo-link" style={{ marginBottom: '2rem' }}>
            <Leaf size={22} /> <span>AgriGov <strong>Market</strong></span>
          </div>
          <h2>Inscription réussie !</h2>
          <div className="auth-success-alert">
            <h4>Compte en attente de validation</h4>
            <p>
              Votre compte en tant que <strong>{ROLES.find(r => r.value === formData.role)?.label || formData.role}</strong> a 
              été créé avec succès. Pour garantir l'intégrité de la plateforme, chaque compte est 
              <strong> examiné manuellement</strong> par les équipes du Ministère. Vous recevrez 
              une confirmation par e-mail dès l'activation.
            </p>
          </div>
          <div className="auth-success-actions">
            <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
              Retour à la connexion
            </Link>
            <Link to="/" className="auth-back-link" style={{ marginTop: '1rem', justifyContent: 'center' }}>
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── FORM ── */
  return (
    <div className="auth-page-wrapper">
      {/* LEFT PANEL */}
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
              Rejoignez la plateforme agricole nationale
            </h2>
            <p className="auth-left-lead">
              Chaque compte est vérifié manuellement pour garantir un écosystème de confiance 
              entre producteurs, acheteurs et transporteurs.
            </p>
            <div className="auth-register-info-box">
              <ShieldCheck size={20} />
              <div>
                <strong>Communauté vérifiée</strong>
                <p>Toutes les inscriptions sont examinées par les administrateurs de la plateforme avant activation.</p>
              </div>
            </div>
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
            Plateforme certifiée — Supervisée par le Ministère de l'Agriculture
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right-panel auth-right-clean auth-right-scroll">
        <div className="auth-form-wrapper">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>

          <div className="auth-form-card">
            <div className="auth-form-header">
              <div className="auth-form-icon">
                <Leaf size={22} />
              </div>
              <h1 className="auth-form-title">Créer un compte</h1>
              <p className="auth-form-subtitle">Rejoignez AgriGov Market dès aujourd'hui</p>
            </div>

            {/* Tabs */}
            <div className="auth-tabs">
              <Link to="/login" className="auth-tab">Connexion</Link>
              <Link to="/register" className="auth-tab auth-tab-active">Créer un compte</Link>
            </div>

            {error && (
              <div className="auth-alert-error">
                <X size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form-body">

              {/* Role selector */}
              <div className="auth-field">
                <label className="auth-label">Je suis un(e)</label>
                <div className="auth-role-grid">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      className={`auth-role-card ${formData.role === r.value ? 'auth-role-card-active' : ''}`}
                      onClick={() => set('role', r.value)}
                      style={formData.role === r.value ? { background: r.color, borderColor: r.iconColor } : {}}
                    >
                      <span className="auth-role-card-icon" style={formData.role === r.value ? { color: r.iconColor } : {}}>
                        {r.icon}
                      </span>
                      <span className="auth-role-card-label">{r.label}</span>
                      <span className="auth-role-card-desc">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="auth-form-row">
                <div className="auth-field">
                  <label className="auth-label">Nom complet</label>
                  <input
                    type="text"
                    className={`auth-input ${fieldErrors.full_name ? 'auth-input-error' : ''}`}
                    placeholder="Prénom NOM"
                    value={formData.full_name}
                    onChange={e => set('full_name', e.target.value)}
                  />
                  {fieldErrors.full_name && <span className="auth-field-error">{fieldErrors.full_name}</span>}
                </div>
                <div className="auth-field">
                  <label className="auth-label">Téléphone</label>
                  <input
                    type="tel"
                    className={`auth-input ${fieldErrors.phone ? 'auth-input-error' : ''}`}
                    placeholder="+213 5XX XXX XXX"
                    value={formData.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                  {fieldErrors.phone && <span className="auth-field-error">{fieldErrors.phone}</span>}
                </div>
              </div>

              {/* Email */}
              <div className="auth-field">
                <label className="auth-label">Adresse e-mail</label>
                <input
                  type="email"
                  className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`}
                  placeholder="exemple@domaine.com"
                  value={formData.email}
                  onChange={e => set('email', e.target.value)}
                />
                {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
              </div>

              {/* Wilaya */}
              <div className="auth-field">
                <label className="auth-label">Wilaya</label>
                <select
                  className={`auth-input auth-select ${fieldErrors.wilaya ? 'auth-input-error' : ''}`}
                  value={formData.wilaya}
                  onChange={e => set('wilaya', e.target.value)}
                >
                  <option value="">Sélectionnez votre wilaya</option>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                {fieldErrors.wilaya && <span className="auth-field-error">{fieldErrors.wilaya}</span>}
              </div>

              {/* Passwords */}
              <div className="auth-form-row">
                <div className="auth-field">
                  <label className="auth-label">Mot de passe</label>
                  <div className="auth-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`auth-input auth-input-icon-right ${fieldErrors.password ? 'auth-input-error' : ''}`}
                      placeholder="min. 8 caractères"
                      value={formData.password}
                      onChange={e => set('password', e.target.value)}
                    />
                    <button type="button" className="auth-input-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
                </div>
                <div className="auth-field">
                  <label className="auth-label">Confirmer le mot de passe</label>
                  <div className="auth-input-wrapper">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className={`auth-input auth-input-icon-right ${fieldErrors.confirm_password ? 'auth-input-error' : ''}`}
                      placeholder="Répéter le mot de passe"
                      value={formData.confirm_password}
                      onChange={e => set('confirm_password', e.target.value)}
                    />
                    <button type="button" className="auth-input-eye" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {fieldErrors.confirm_password && <span className="auth-field-error">{fieldErrors.confirm_password}</span>}
                </div>
              </div>

              {/* Terms */}
              <div className="auth-field">
                <label className={`auth-checkbox-label ${fieldErrors.terms ? 'auth-checkbox-error' : ''}`}>
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => { setAcceptTerms(e.target.checked); setFieldErrors(f => ({ ...f, terms: '' })); }}
                  />
                  <span>
                    J'accepte les{' '}
                    <Link to="/faq" style={{ color: 'var(--primary)', fontWeight: 600 }}>conditions d'utilisation</Link>
                    {' '}et la{' '}
                    <Link to="/faq" style={{ color: 'var(--primary)', fontWeight: 600 }}>politique de confidentialité</Link>
                  </span>
                </label>
                {fieldErrors.terms && <span className="auth-field-error">{fieldErrors.terms}</span>}
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <><span className="auth-spinner"></span> Création du compte…</>
                ) : (
                  <>Créer mon compte <ChevronRight size={18} /></>
                )}
              </button>
            </form>

            <p className="auth-switch-text">
              Déjà un compte ?{' '}
              <Link to="/login">Se connecter</Link>
            </p>

            <div className="auth-form-trust">
              <ShieldCheck size={13} />
              Compte vérifié manuellement — Supervision du Ministère de l'Agriculture
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
