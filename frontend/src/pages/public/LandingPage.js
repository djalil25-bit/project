import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ShieldCheck, Truck, BarChart3,
  ChevronRight, ArrowRight, CheckCircle,
  Package, Users, ShoppingBag,
  Award, Globe, Building2, Sprout, MapPin,
  BadgeCheck, Zap, Clock, Landmark, Trees, Leaf,
  Carrot, Apple, Citrus, Nut, Box, Wheat
} from 'lucide-react';

/* ─── Static Data ─────────────────────────────────── */
const PRODUCTS = [
  { id: 1, name: 'Fresh Tomatoes', category: 'Vegetables', price: '80', unit: 'kg', badge: 'Seasonal', icon: <Apple size={28} />, color: '#fee2e2', accent: '#ef4444' },
  { id: 2, name: 'Organic Carrots', category: 'Vegetables', price: '55', unit: 'kg', badge: 'Organic', icon: <Carrot size={28} />, color: '#ffedd5', accent: '#f97316' },
  { id: 3, name: 'Potatoes', category: 'Tubers', price: '45', unit: 'kg', badge: 'Local', icon: <Box size={28} />, color: '#fef3c7', accent: '#d97706' },
  { id: 4, name: 'Durum Wheat', category: 'Cereals', price: '35', unit: 'kg', badge: 'Premium', icon: <Wheat size={28} />, color: '#fef9c3', accent: '#ca8a04' },
  { id: 5, name: 'Deglet Nour Dates', category: 'Dried Fruits', price: '320', unit: 'kg', badge: 'Export', icon: <Trees size={28} />, color: '#f0fdf4', accent: '#16a34a' },
  { id: 6, name: 'Blida Oranges', category: 'Fruits', price: '90', unit: 'kg', badge: 'Seasonal', icon: <Citrus size={28} />, color: '#fff7ed', accent: '#ea580c' },
  { id: 7, name: 'Sig Olives', category: 'Olive Cultivation', price: '150', unit: 'kg', badge: 'PDO', icon: <Leaf size={28} />, color: '#f0fdf4', accent: '#15803d' },
  { id: 8, name: 'Red Peppers', category: 'Vegetables', price: '120', unit: 'kg', badge: 'Fresh', icon: <Sprout size={28} />, color: '#ecfdf5', accent: '#059669' },
];

const FEATURES = [
  { icon: <BarChart3 size={28} />, title: 'Official Reference Prices', desc: 'The Ministry publishes official price ranges to ensure fairness and transparency for all agricultural products.', color: '#e8f5e9', iconColor: '#2e7d32' },
  { icon: <Sprout size={28} />, title: 'Direct Producer Sales', desc: 'Buy directly from certified farmers. Eliminate middlemen for fair prices and better quality.', color: '#e3f2fd', iconColor: '#1565c0' },
  { icon: <Truck size={28} />, title: 'Coordinated Delivery', desc: 'A network of verified transporters covers all wilayas of Algeria for punctual and secure deliveries.', color: '#fff3e0', iconColor: '#e65100' },
  { icon: <ShieldCheck size={28} />, title: 'Ministry Supervision', desc: 'Each user is manually validated. The platform is under the official supervision of the Ministry of Agriculture.', color: '#f3e5f5', iconColor: '#6a1b9a' },
];

const ROLES = [
  {
    role: 'Farmer',
    icon: <Sprout size={32} />,
    color: '#f0fdf4',
    border: '#bbf7d0',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    badge: 'Producers',
    badgeColor: '#16a34a',
    actions: [
      'Publish your products to an official catalog',
      'Access Ministry reference prices',
      'Manage harvests and analyze sales',
      'Request delivery in one click',
      'Track your orders in real time',
    ]
  },
  {
    role: 'Buyer',
    icon: <ShoppingBag size={32} />,
    color: '#eff6ff',
    border: '#bfdbfe',
    iconBg: '#dbeafe',
    iconColor: '#1d4ed8',
    badge: 'Buyers',
    badgeColor: '#1d4ed8',
    actions: [
      'Browse products from certified farms',
      'Compare prices with official rates',
      'Place orders with integrated tracking',
      'Receive your invoices automatically',
      'Manage favorites and order history',
    ]
  },
  {
    role: 'Transporter',
    icon: <Truck size={32} />,
    color: '#fffbeb',
    border: '#fde68a',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    badge: 'Logistics',
    badgeColor: '#d97706',
    actions: [
      'Accept validated delivery missions',
      'Manage your coverage zones and vehicles',
      'Track missions and logistics revenue',
      'Collaborate with farmers and buyers',
      'Simplify your administrative management',
    ]
  },
  {
    role: 'Administrator',
    icon: <Building2 size={32} />,
    color: '#fdf4ff',
    border: '#e9d5ff',
    iconBg: '#f3e8ff',
    iconColor: '#7c3aed',
    badge: 'Ministry',
    badgeColor: '#7c3aed',
    actions: [
      'Supervise the entire platform',
      'Approve and validate user accounts',
      'Publish official reference prices',
      'Manage the national product catalog',
      'Analyze agricultural market data',
    ]
  }
];

const STATS = [
  { value: '2,800+', label: 'Active Producers', icon: <Sprout size={22} />, color: '#dcfce7', iconColor: '#16a34a' },
  { value: '14,000+', label: 'Verified Buyers', icon: <Users size={22} />, color: '#dbeafe', iconColor: '#1d4ed8' },
  { value: '980+', label: 'Logistics Missions', icon: <Truck size={22} />, color: '#fef3c7', iconColor: '#d97706' },
  { value: '42,000+', label: 'Published Products', icon: <Package size={22} />, color: '#f3e8ff', iconColor: '#7c3aed' },
];

const OFFICIAL_PRICES = [
  { name: 'Round Tomato', price: '75–90', unit: 'DZD/kg', status: 'normal', wilaya: 'Algiers', updated: 'Today' },
  { name: 'Potato', price: '40–55', unit: 'DZD/kg', status: 'optimal', wilaya: 'Tipaza', updated: 'Today' },
  { name: 'Dry Onion', price: '50–65', unit: 'DZD/kg', status: 'attention', wilaya: 'Bouira', updated: 'Yesterday' },
  { name: 'Carrot', price: '60–80', unit: 'DZD/kg', status: 'normal', wilaya: 'Blida', updated: 'Today' },
  { name: 'Zucchini', price: '85–110', unit: 'DZD/kg', status: 'optimal', wilaya: 'Tizi Ouzou', updated: 'Today' },
  { name: 'Bell Pepper', price: '100–130', unit: 'DZD/kg', status: 'normal', wilaya: 'Chlef', updated: 'Yesterday' },
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
              Official platform supervised by the Ministry of Agriculture and Rural Development
            </span>
            <Link to="/login" className="home-top-bar-cta">
              Access platform <ChevronRight size={13} />
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
              Ministry of Agriculture Certified
            </div>
            <h1 className="home-hero-title">
              The <span className="home-hero-highlight">Official</span> Agricultural Marketplace of Algeria
            </h1>
            <p className="home-hero-subtitle">
              AgriGov Market connects producers, buyers, and transporters directly within a transparent 
              institutional framework. Official prices, verified users, integrated logistics.
            </p>
            <div className="home-hero-actions">
              <Link to="/register" className="home-btn-primary">
                Explore the Platform <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="home-btn-outline">
                Sign In
              </Link>
            </div>
            <div className="home-hero-trust">
              <div className="home-trust-pill">
                <CheckCircle size={14} />
                Verified Users
              </div>
              <div className="home-trust-pill">
                <BarChart3 size={14} />
                Published Official Prices
              </div>
              <div className="home-trust-pill">
                <Truck size={14} />
                Tracked Delivery
              </div>
            </div>
          </div>
          <div className="home-hero-visual">
            <div className="home-hero-image-grid" style={{ fontVairant: 'none' }}>
              <div className="home-hero-img-1" style={{ color: '#ca8a04' }}><Wheat size={36} strokeWidth={1.5} /></div>
              <div className="home-hero-img-2" style={{ color: '#ef4444' }}><Apple size={36} strokeWidth={1.5} /></div>
              <div className="home-hero-img-3" style={{ color: '#f97316' }}><Carrot size={36} strokeWidth={1.5} /></div>
              <div className="home-hero-img-4" style={{ color: '#15803d' }}><Leaf size={36} strokeWidth={1.5} /></div>
              <div className="home-hero-img-5" style={{ color: '#ea580c' }}><Citrus size={36} strokeWidth={1.5} /></div>
              <div className="home-hero-img-6" style={{ color: '#16a34a' }}><Trees size={36} strokeWidth={1.5} /></div>
            </div>
            <div className="home-hero-floating-1">
              <TrendingUp size={18} className="me-2 text-success" />
              <div>
                <div className="home-float-title">Real-time Prices</div>
                <div className="home-float-sub">Updated Every Day</div>
              </div>
            </div>
            <div className="home-hero-floating-2">
              <ShieldCheck size={18} className="me-2" style={{ color: '#1d4ed8' }} />
              <div>
                <div className="home-float-title">2,800+ Farmers</div>
                <div className="home-float-sub">Approved & Verified</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE STRIP ─────────────────────────────── */}
      <section className="home-features-section">
        <div className="container">
          <div className="home-section-header">
            <span className="home-section-tag">Our Commitments</span>
            <h2 className="home-section-title">Why choose AgriGov Market?</h2>
            <p className="home-section-sub">
              A modern agricultural ecosystem built on trust, transparency, and institutional efficiency.
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
            <span className="home-section-tag">Marketplace</span>
            <h2 className="home-section-title">Featured Agricultural Products</h2>
            <p className="home-section-sub">
              Hundreds of local products available directly from certified Algerian farms.
            </p>
          </div>
          <div className="home-products-grid">
            {PRODUCTS.map((p) => (
              <div key={p.id} className="home-product-card">
                <div className="home-product-image" style={{ background: p.color, color: p.accent }}>
                  {p.icon}
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
                    View Product <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="home-products-more">
            <Link to="/register" className="home-btn-outline-green">
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section className="home-how-section">
        <div className="container">
          <div className="home-section-header">
            <span className="home-section-tag">User Guide</span>
            <h2 className="home-section-title">How does it work?</h2>
            <p className="home-section-sub">
              A platform designed for every actor in the agricultural supply chain.
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
                  Join as {r.role} <ChevronRight size={14} />
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
                Ministry of Agriculture
              </div>
              <h2 className="home-prices-title">Official Reference Prices</h2>
              <p className="home-prices-sub">
                Reference prices published regularly by the Ministry to guarantee a fair and transparent market.
              </p>
              <div className="home-prices-note">
                <Clock size={14} />
                Updated Today — Valid across the entire national territory
              </div>
            </div>
            <div className="home-prices-table">
              <div className="home-prices-table-head">
                <span>Product</span>
                <span>Official Status</span>
                <span>Wilaya</span>
                <span>Status</span>
                <span>Last Updated</span>
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
                Access Full Official Prices <ArrowRight size={16} />
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
            <h2 className="home-section-title">AgriGov Market in Numbers</h2>
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
                Official Supervision
              </div>
              <h2 className="home-trust-title">
                A platform under the supervision of the Ministry of Agriculture
              </h2>
              <p className="home-trust-desc">
                AgriGov Market is not an ordinary commercial application. It is developed 
                and supervised directly by the national agricultural administration to modernize 
                trade, protect producers, and guarantee price transparency.
              </p>
              <div className="home-trust-pillars">
                <div className="home-trust-pillar">
                  <div className="home-trust-pillar-icon"><ShieldCheck size={20} /></div>
                  <div>
                    <strong>Validated Users</strong>
                    <p>Every account is manually reviewed before activation.</p>
                  </div>
                </div>
                <div className="home-trust-pillar">
                  <div className="home-trust-pillar-icon"><BarChart3 size={20} /></div>
                  <div>
                    <strong>Official Data</strong>
                    <p>Published prices come directly from the Ministry's services.</p>
                  </div>
                </div>
                <div className="home-trust-pillar">
                  <div className="home-trust-pillar-icon"><Globe size={20} /></div>
                  <div>
                    <strong>National Coverage</strong>
                    <p>The platform covers all 58 wilayas of Algeria.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="home-trust-right">
              <div className="home-trust-card-wrapper">
                <div className="home-trust-card">
                  <div className="home-trust-card-icon" style={{ color: '#0f5132' }}><Landmark size={40} strokeWidth={1.5} /></div>
                  <h4>Ministry of Agriculture</h4>
                  <p className="home-trust-card-sub">and Rural Development</p>
                  <div className="home-trust-card-sep"></div>
                  <div className="home-trust-seal">
                    <CheckCircle size={16} />
                    Certified Compliant Platform
                  </div>
                  <div className="home-trust-seal">
                    <Award size={16} />
                    Officially Validated Data
                  </div>
                  <div className="home-trust-seal">
                    <Zap size={16} />
                    Interoperable with National Services
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
            <div className="home-cta-icon-bg"><Sprout size={48} strokeWidth={1.5} color="#16a34a" /></div>
            <h2 className="home-cta-title">Ready to join the agriculture of tomorrow?</h2>
            <p className="home-cta-sub">
              Create your account, access official prices, and start trading on the most 
              reliable agricultural platform in Algeria.
            </p>
            <div className="home-cta-actions">
              <Link to="/register" className="home-btn-white">
                Create Account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="home-btn-white-outline">
                Sign In
              </Link>
            </div>
            <div className="home-cta-footnote">
              <ShieldCheck size={14} />
              Supervised by the Ministry of Agriculture · Free Access · Validation Required
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
