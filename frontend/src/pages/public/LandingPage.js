import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ShieldCheck, Truck, BarChart3,
  ChevronRight, ArrowRight, CheckCircle,
  Package, Users, ShoppingBag,
  Award, Globe, Building2, Sprout, MapPin,
  BadgeCheck, Zap, Clock
} from 'lucide-react';

/* ─── Static Data ─────────────────────────────────── */
const PRODUCTS = [
  { id: 1, name: 'Tomates Fraîches', category: 'Légumes', price: '80', unit: 'kg', badge: 'Saisonnier', emoji: '🍅', color: '#fee2e2', accent: '#ef4444' },
  { id: 2, name: 'Carottes Bio', category: 'Légumes', price: '55', unit: 'kg', badge: 'Bio', emoji: '🥕', color: '#ffedd5', accent: '#f97316' },
  { id: 3, name: 'Pommes de Terre', category: 'Tubercules', price: '45', unit: 'kg', badge: 'Local', emoji: '🥔', color: '#fef3c7', accent: '#d97706' },
  { id: 4, name: 'Blé Dur', category: 'Céréales', price: '35', unit: 'kg', badge: 'Premium', emoji: '🌾', color: '#fef9c3', accent: '#ca8a04' },
  { id: 5, name: 'Dattes Deglet', category: 'Fruits Secs', price: '320', unit: 'kg', badge: 'Export', emoji: '🌴', color: '#f0fdf4', accent: '#16a34a' },
  { id: 6, name: 'Oranges Blida', category: 'Fruits', price: '90', unit: 'kg', badge: 'Saisonnier', emoji: '🍊', color: '#fff7ed', accent: '#ea580c' },
  { id: 7, name: 'Olives Sigoise', category: 'Oléiculture', price: '150', unit: 'kg', badge: 'AOC', emoji: '🫒', color: '#f0fdf4', accent: '#15803d' },
  { id: 8, name: 'Poivrons Rouges', category: 'Légumes', price: '120', unit: 'kg', badge: 'Frais', emoji: '🫑', color: '#ecfdf5', accent: '#059669' },
];

const FEATURES = [
  { icon: <BarChart3 size={28} />, title: 'Prix officiels de référence', desc: 'Le Ministère publie des fourchettes de prix officiels pour garantir équité et transparence sur tous les produits agricoles.', color: '#e8f5e9', iconColor: '#2e7d32' },
  { icon: <Sprout size={28} />, title: 'Vente directe producteur', desc: 'Achetez directement auprès des agriculteurs certifiés. Éliminez les intermédiaires pour des prix justes et une meilleure qualité.', color: '#e3f2fd', iconColor: '#1565c0' },
  { icon: <Truck size={28} />, title: 'Livraison coordonnée', desc: 'Un réseau de transporteurs vérifiés couvre toutes les wilayas d\'Algérie pour des livraisons ponctuelles et sécurisées.', color: '#fff3e0', iconColor: '#e65100' },
  { icon: <ShieldCheck size={28} />, title: 'Supervision du Ministère', desc: 'Chaque utilisateur est validé manuellement. La plateforme est placée sous la tutelle officielle du Ministère de l\'Agriculture.', color: '#f3e5f5', iconColor: '#6a1b9a' },
];

const ROLES = [
  {
    role: 'Agriculteur',
    icon: <Sprout size={32} />,
    color: '#f0fdf4',
    border: '#bbf7d0',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    badge: 'Producteurs',
    badgeColor: '#16a34a',
    actions: [
      'Publiez vos produits depuis un catalogue officiel',
      'Accédez aux prix de référence du Ministère',
      'Gérez vos récoltes et analysez vos ventes',
      'Demandez une livraison en un clic',
      'Suivez vos commandes en temps réel',
    ]
  },
  {
    role: 'Acheteur',
    icon: <ShoppingBag size={32} />,
    color: '#eff6ff',
    border: '#bfdbfe',
    iconBg: '#dbeafe',
    iconColor: '#1d4ed8',
    badge: 'Acheteurs',
    badgeColor: '#1d4ed8',
    actions: [
      'Parcourez des produits de fermes certifiées',
      'Comparez les prix avec les tarifs officiels',
      'Passez commande avec suivi intégré',
      'Recevez vos factures automatiquement',
      'Gérez vos favoris et votre historique',
    ]
  },
  {
    role: 'Transporteur',
    icon: <Truck size={32} />,
    color: '#fffbeb',
    border: '#fde68a',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    badge: 'Logistique',
    badgeColor: '#d97706',
    actions: [
      'Acceptez des missions de livraison validées',
      'Gérez vos zones de couverture et véhicules',
      'Suivez vos missions et revenus logistiques',
      'Collaborez avec agriculteurs et acheteurs',
      'Simplifiez votre gestion administrative',
    ]
  },
  {
    role: 'Administrateur',
    icon: <Building2 size={32} />,
    color: '#fdf4ff',
    border: '#e9d5ff',
    iconBg: '#f3e8ff',
    iconColor: '#7c3aed',
    badge: 'Ministère',
    badgeColor: '#7c3aed',
    actions: [
      'Supervisez l\'ensemble de la plateforme',
      'Validez les comptes utilisateurs',
      'Publiez les prix officiels de référence',
      'Gérez le catalogue produits national',
      'Analysez les données du marché agricole',
    ]
  }
];

const STATS = [
  { value: '2 800+', label: 'Producteurs actifs', icon: <Sprout size={22} />, color: '#dcfce7', iconColor: '#16a34a' },
  { value: '14 000+', label: 'Acheteurs vérifiés', icon: <Users size={22} />, color: '#dbeafe', iconColor: '#1d4ed8' },
  { value: '980+', label: 'Missions logistiques', icon: <Truck size={22} />, color: '#fef3c7', iconColor: '#d97706' },
  { value: '42 000+', label: 'Produits publiés', icon: <Package size={22} />, color: '#f3e8ff', iconColor: '#7c3aed' },
];

const OFFICIAL_PRICES = [
  { name: 'Tomate ronde', price: '75–90', unit: 'DZD/kg', status: 'normal', wilaya: 'Alger', updated: 'Aujourd\'hui' },
  { name: 'Pomme de terre', price: '40–55', unit: 'DZD/kg', status: 'optimal', wilaya: 'Tipaza', updated: 'Aujourd\'hui' },
  { name: 'Oignon sec', price: '50–65', unit: 'DZD/kg', status: 'attention', wilaya: 'Bouira', updated: 'Hier' },
  { name: 'Carotte', price: '60–80', unit: 'DZD/kg', status: 'normal', wilaya: 'Blida', updated: 'Aujourd\'hui' },
  { name: 'Courgette', price: '85–110', unit: 'DZD/kg', status: 'optimal', wilaya: 'Tizi Ouzou', updated: 'Aujourd\'hui' },
  { name: 'Poivron', price: '100–130', unit: 'DZD/kg', status: 'normal', wilaya: 'Chlef', updated: 'Hier' },
];

/* ─── Counter animation hook ─────────────────────── */
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState('0');
  useEffect(() => {
    const num = parseInt(target.replace(/\D/g, ''));
    const suffix = target.replace(/[\d\s]/g, '');
    let start = 0;
    const increment = num / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= num) { setCount(num.toLocaleString() + suffix); clearInterval(timer); }
      else setCount(Math.floor(start).toLocaleString() + suffix);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function StatCounter({ value, label, icon, color, iconColor }) {
  const count = useCounter(value);
  return (
    <div className="home-stat-card">
      <div className="home-stat-icon" style={{ background: color, color: iconColor }}>{icon}</div>
      <div className="home-stat-value">{count}</div>
      <div className="home-stat-label">{label}</div>
    </div>
  );
}

/* ─── Status badge for official prices ─────────── */
function PriceStatusBadge({ status }) {
  const map = {
    optimal: { label: 'Optimal', cls: 'badge-price-optimal' },
    normal: { label: 'Normal', cls: 'badge-price-normal' },
    attention: { label: 'Attention', cls: 'badge-price-attention' },
  };
  const { label, cls } = map[status] || map.normal;
  return <span className={`badge-price ${cls}`}>{label}</span>;
}

/* ─── Component ─────────────────────────────────── */
const LandingPage = () => {
  return (
    <div className="home-page">

      {/* ── TOP UTILITY BAR ────────────────────────────── */}
      <div className="home-top-bar">
        <div className="container">
          <div className="home-top-bar-inner">
            <span className="home-top-bar-msg">
              <ShieldCheck size={14} className="me-1" />
              Plateforme officielle supervisée par le Ministère de l'Agriculture et du Développement Rural
            </span>
            <Link to="/login" className="home-top-bar-cta">
              Accéder à la plateforme <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── HERO SECTION ───────────────────────────────── */}
      <section className="home-hero">
        <div className="home-hero-backdrop"></div>
        <div className="container home-hero-inner">
          <div className="home-hero-content">
            <div className="home-hero-badge">
              <BadgeCheck size={15} />
              Certifié Ministère de l'Agriculture
            </div>
            <h1 className="home-hero-title">
              La place de marché agricole <span className="home-hero-highlight">officielle</span> de l'Algérie
            </h1>
            <p className="home-hero-subtitle">
              AgriGov Market connecte directement producteurs, acheteurs et transporteurs dans un cadre 
              institutionnel transparent. Des prix officiels, des utilisateurs vérifiés, une logistique intégrée.
            </p>
            <div className="home-hero-actions">
              <Link to="/register" className="home-btn-primary">
                Explorer la plateforme <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="home-btn-outline">
                Se connecter
              </Link>
            </div>
            <div className="home-hero-trust">
              <div className="home-trust-pill">
                <CheckCircle size={14} />
                Utilisateurs vérifiés
              </div>
              <div className="home-trust-pill">
                <BarChart3 size={14} />
                Prix officiels publiés
              </div>
              <div className="home-trust-pill">
                <Truck size={14} />
                Livraison suivie
              </div>
            </div>
          </div>
          <div className="home-hero-visual">
            <div className="home-hero-image-grid">
              <div className="home-hero-img-1">🌾</div>
              <div className="home-hero-img-2">🍅</div>
              <div className="home-hero-img-3">🥕</div>
              <div className="home-hero-img-4">🫒</div>
              <div className="home-hero-img-5">🍊</div>
              <div className="home-hero-img-6">🌴</div>
            </div>
            <div className="home-hero-floating-1">
              <TrendingUp size={18} className="me-2 text-success" />
              <div>
                <div className="home-float-title">Prix en temps réel</div>
                <div className="home-float-sub">Mis à jour chaque jour</div>
              </div>
            </div>
            <div className="home-hero-floating-2">
              <ShieldCheck size={18} className="me-2" style={{ color: '#1d4ed8' }} />
              <div>
                <div className="home-float-title">2 800+ Agriculteurs</div>
                <div className="home-float-sub">Approuvés & Vérifiés</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE STRIP ─────────────────────────────── */}
      <section className="home-features-section">
        <div className="container">
          <div className="home-section-header">
            <span className="home-section-tag">Nos engagements</span>
            <h2 className="home-section-title">Pourquoi choisir AgriGov Market ?</h2>
            <p className="home-section-sub">
              Un écosystème agricole moderne construit sur la confiance, la transparence et l'efficacité institutionnelle.
            </p>
          </div>
          <div className="home-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="home-feature-card">
                <div className="home-feature-icon" style={{ background: f.color, color: f.iconColor }}>
                  {f.icon}
                </div>
                <h3 className="home-feature-title">{f.title}</h3>
                <p className="home-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE ──────────────────────────── */}
      <section className="home-products-section">
        <div className="container">
          <div className="home-section-header">
            <span className="home-section-tag">Marché</span>
            <h2 className="home-section-title">Produits agricoles en vedette</h2>
            <p className="home-section-sub">
              Des centaines de produits locaux disponibles directement depuis les fermes algériennes certifiées.
            </p>
          </div>
          <div className="home-products-grid">
            {PRODUCTS.map((p) => (
              <div key={p.id} className="home-product-card">
                <div className="home-product-image" style={{ background: p.color }}>
                  <span className="home-product-emoji">{p.emoji}</span>
                  <span className="home-product-badge" style={{ background: p.accent }}>{p.badge}</span>
                </div>
                <div className="home-product-body">
                  <div className="home-product-cat">{p.category}</div>
                  <h4 className="home-product-name">{p.name}</h4>
                  <div className="home-product-price-row">
                    <span className="home-product-price">{p.price} DZD</span>
                    <span className="home-product-unit">/{p.unit}</span>
                  </div>
                  <Link to="/login" className="home-product-cta">
                    Voir le produit <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="home-products-more">
            <Link to="/register" className="home-btn-outline-green">
              Voir tous les produits <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section className="home-how-section">
        <div className="container">
          <div className="home-section-header">
            <span className="home-section-tag">Mode d'emploi</span>
            <h2 className="home-section-title">Comment ça marche ?</h2>
            <p className="home-section-sub">
              Une plateforme pensée pour chaque acteur de la chaîne agricole.
            </p>
          </div>
          <div className="home-roles-grid">
            {ROLES.map((r, i) => (
              <div key={i} className="home-role-card" style={{ background: r.color, borderColor: r.border }}>
                <div className="home-role-icon" style={{ background: r.iconBg, color: r.iconColor }}>
                  {r.icon}
                </div>
                <span className="home-role-badge" style={{ background: r.iconBg, color: r.iconColor }}>
                  {r.badge}
                </span>
                <h3 className="home-role-title">{r.role}</h3>
                <ul className="home-role-list">
                  {r.actions.map((a, j) => (
                    <li key={j} className="home-role-item">
                      <CheckCircle size={14} style={{ color: r.iconColor, flexShrink: 0 }} />
                      {a}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="home-role-link">
                  Rejoindre en tant que {r.role} <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OFFICIAL PRICES PREVIEW ───────────────────── */}
      <section className="home-prices-section">
        <div className="container">
          <div className="home-prices-inner">
            <div className="home-prices-header">
              <div className="home-prices-badge">
                <Building2 size={15} />
                Ministère de l'Agriculture
              </div>
              <h2 className="home-prices-title">Prix officiels de référence</h2>
              <p className="home-prices-sub">
                Des prix de référence publiés régulièrement par le Ministère pour garantir un marché juste et transparent.
              </p>
              <div className="home-prices-note">
                <Clock size={14} />
                Mis à jour aujourd'hui — Valables sur tout le territoire national
              </div>
            </div>
            <div className="home-prices-table">
              <div className="home-prices-table-head">
                <span>Produit</span>
                <span>Fourchette officielle</span>
                <span>Wilaya</span>
                <span>Statut</span>
                <span>Mise à jour</span>
              </div>
              {OFFICIAL_PRICES.map((p, i) => (
                <div key={i} className="home-prices-row">
                  <span className="home-prices-name">{p.name}</span>
                  <span className="home-prices-price">{p.price} <small>{p.unit}</small></span>
                  <span className="home-prices-wilaya">
                    <MapPin size={12} /> {p.wilaya}
                  </span>
                  <span><PriceStatusBadge status={p.status} /></span>
                  <span className="home-prices-date">{p.updated}</span>
                </div>
              ))}
            </div>
            <div className="home-prices-footer">
              <Link to="/register" className="home-btn-primary">
                Accéder aux prix officiels complets <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATISTICS ───────────────────────────────── */}
      <section className="home-stats-section">
        <div className="container">
          <div className="home-section-header">
            <span className="home-section-tag">Impact</span>
            <h2 className="home-section-title">AgriGov Market en chiffres</h2>
          </div>
          <div className="home-stats-grid">
            {STATS.map((s, i) => (
              <StatCounter key={i} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SECTION ────────────────────────────── */}
      <section className="home-trust-section">
        <div className="container">
          <div className="home-trust-inner">
            <div className="home-trust-left">
              <div className="home-trust-ministry-badge">
                <Building2 size={20} />
                Supervision officielle
              </div>
              <h2 className="home-trust-title">
                Une plateforme sous la tutelle du Ministère de l'Agriculture
              </h2>
              <p className="home-trust-desc">
                AgriGov Market n'est pas une application commerciale ordinaire. Elle est développée 
                et supervisée directement par l'administration agricole nationale pour moderniser 
                les échanges, protéger les producteurs et garantir la transparence des prix.
              </p>
              <div className="home-trust-pillars">
                <div className="home-trust-pillar">
                  <div className="home-trust-pillar-icon"><ShieldCheck size={20} /></div>
                  <div>
                    <strong>Utilisateurs validés</strong>
                    <p>Chaque compte est examiné manuellement avant activation.</p>
                  </div>
                </div>
                <div className="home-trust-pillar">
                  <div className="home-trust-pillar-icon"><BarChart3 size={20} /></div>
                  <div>
                    <strong>Données officielles</strong>
                    <p>Les prix publiés proviennent directement des services du Ministère.</p>
                  </div>
                </div>
                <div className="home-trust-pillar">
                  <div className="home-trust-pillar-icon"><Globe size={20} /></div>
                  <div>
                    <strong>Couverture nationale</strong>
                    <p>La plateforme couvre l'ensemble des 58 wilayas d'Algérie.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="home-trust-right">
              <div className="home-trust-card-wrapper">
                <div className="home-trust-card">
                  <div className="home-trust-card-icon">🏛️</div>
                  <h4>Ministère de l'Agriculture</h4>
                  <p className="home-trust-card-sub">et du Développement Rural</p>
                  <div className="home-trust-card-sep"></div>
                  <div className="home-trust-seal">
                    <CheckCircle size={16} />
                    Plateforme certifiée conforme
                  </div>
                  <div className="home-trust-seal">
                    <Award size={16} />
                    Données officiellement validées
                  </div>
                  <div className="home-trust-seal">
                    <Zap size={16} />
                    Interopérable avec les services nationaux
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STRONG CTA ───────────────────────────────── */}
      <section className="home-cta-section">
        <div className="container">
          <div className="home-cta-inner">
            <div className="home-cta-icon-bg">🌾</div>
            <h2 className="home-cta-title">Prêt à rejoindre l'agriculture de demain ?</h2>
            <p className="home-cta-sub">
              Créez votre compte, accédez aux prix officiels et commencez à commercer sur la plateforme 
              agricole la plus fiable d'Algérie.
            </p>
            <div className="home-cta-actions">
              <Link to="/register" className="home-btn-white">
                Créer un compte <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="home-btn-white-outline">
                Se connecter
              </Link>
            </div>
            <div className="home-cta-footnote">
              <ShieldCheck size={14} />
              Supervisé par le Ministère de l'Agriculture · Accès gratuit · Validation requise
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
