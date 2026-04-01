import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Search, User, CheckCircle, XCircle, Info,
  ShieldCheck, ShoppingCart, Package, ChevronRight,
  AlertCircle, Clock, Plus, X, Wheat, Tag, BarChart2, Eye,
  BadgeCheck, Heart, BarChart3, Sprout, Building2, FileText
} from 'lucide-react';
import VerifiedBadge from '../../components/common/VerifiedBadge';

/* ─── Category Quick-Access ─────────────────────── */
const QUICK_CATEGORIES = [
  { label: 'Vegetables', icon: '🥦', bg: '#dcfce7', color: '#16a34a' },
  { label: 'Fruits',     icon: '🍊', bg: '#fef3c7', color: '#d97706' },
  { label: 'Grains',    icon: '🌾', bg: '#fef9c3', color: '#ca8a04' },
  { label: 'Organic',   icon: '🌿', bg: '#d1fae5', color: '#059669' },
  { label: 'Seasonal',  icon: '☀️', bg: '#ffedd5', color: '#ea580c' },
];

/* ─── Ministry Reference Prices Preview ──────────── */
const PRICE_PREVIEW = [
  { name: 'Round Tomato',  range: '75–90 DZD/kg',  status: 'normal' },
  { name: 'Potato',        range: '40–55 DZD/kg',  status: 'optimal' },
  { name: 'Carrot',        range: '60–80 DZD/kg',  status: 'normal' },
];

function PriceStatusDot({ status }) {
  const map = { optimal: '#16a34a', normal: '#2563eb', attention: '#d97706' };
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: map[status] || map.normal, display: 'inline-block', marginRight: 6, flexShrink: 0 }} />;
}

const PriceBadge = ({ comparison }) => {
  if (!comparison) return null;
  const { status, difference_percentage } = comparison;
  if (status === 'equal') return <span className="badge-agr badge-outline-primary ms-2">Market Price</span>;
  const cls = status === 'below' ? 'badge-success' : 'badge-warning';
  const label = status === 'below' ? `-${difference_percentage}% Value` : `+${difference_percentage}% Premium`;
  return <span className={`badge-agr ${cls} ms-2`}>{label}</span>;
};

const QualityBadge = ({ quality }) => {
  const q = quality?.toUpperCase() || 'MEDIUM';
  switch (q) {
    case 'HIGH':   return <span className="quality-badge high"><ShieldCheck size={11} className="me-1" />Premium</span>;
    case 'MEDIUM': return <span className="quality-badge medium"><CheckCircle size={11} className="me-1" />Standard</span>;
    case 'LOW':    return <span className="quality-badge low"><Info size={11} className="me-1" />Basic</span>;
    default:       return null;
  }
};

/* ─── Product Detail Modal ─────────────────────── */
function ProductDetailModal({ product, onClose, onAddToCart, cartLoading }) {
  if (!product) return null;
  const p = product;
  return (
    <div className="modal-overlay flex-center" onClick={onClose}>
      <div className="modal-content agr-card animate-scale-in" style={{ maxWidth: 640, width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header border-bottom p-4 d-flex justify-content-between align-items-start">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <h3 className="h5 fw-bold mb-0">{p.title}</h3>
              <QualityBadge quality={p.quality} />
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="category-tag">{p.category_name}</span>
              <PriceBadge comparison={p.official_price_comparison} />
            </div>
          </div>
          <button className="btn-icon ms-3" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body p-4">
          <div className="row g-4">
            <div className="col-md-5">
              <div className="product-modal-image rounded-lg overflow-hidden bg-light-soft d-flex align-items-center justify-content-center" style={{ height: 200 }}>
                {p.image
                  ? <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Package size={56} className="text-muted opacity-30" />
                }
              </div>
              <div className="mt-3">
                <div className="d-flex align-items-baseline gap-1">
                  <span className="h4 fw-bold text-primary mb-0">{parseFloat(p.price).toLocaleString()}</span>
                  <span className="small text-muted">DZD / {p.unit}</span>
                </div>
                {p.official_price_comparison?.official_price && (
                  <div className="very-small text-muted">
                    Reference: {p.official_price_comparison.official_price.toLocaleString()} DZD
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-7">
              <div className="detail-grid">
                {[
                  { icon: <User size={13} />, label: 'Farmer', value: (
                    <div className="d-flex align-items-center gap-1">
                      {p.farmer_name}
                      <VerifiedBadge role="farmer" isVerified={p.farmer_is_verified} trustLevel={p.farmer_trust_level} showLabel={false} />
                    </div>
                  )},
                  { icon: <Wheat size={13} />, label: 'Farm', value: p.farm_name },
                  { icon: <Tag size={13} />, label: 'Category', value: p.category_name },
                  { icon: <BarChart2 size={13} />, label: 'Available Stock', value: `${parseFloat(p.stock || 0).toLocaleString()} ${p.unit}` },
                ].filter(d => d.value).map((d, i) => (
                  <div key={i} className="detail-item">
                    <span className="detail-icon text-primary">{d.icon}</span>
                    <div>
                      <div className="very-small text-muted text-uppercase fw-bold">{d.label}</div>
                      <div className="small fw-medium">{d.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              {p.description && (
                <div className="mt-3 p-3 bg-light-soft rounded-lg">
                  <div className="very-small text-muted text-uppercase fw-bold mb-1">Description</div>
                  <div className="small text-muted">{p.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer border-top p-4">
          <button className="btn-agr btn-outline flex-fill" onClick={onClose}>Close</button>
          <button
            className="btn-agr btn-primary flex-fill d-flex align-items-center justify-content-center gap-2"
            onClick={() => { onAddToCart(p.id); onClose(); }}
            disabled={cartLoading || p.stock === 0}
          >
            {p.stock === 0 ? <><XCircle size={16} /> Sold Out</> : <><Plus size={16} /> Add to Basket</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Buyer Dashboard ─────────────────────── */
function BuyerDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchData = async () => {
    try {
      const [prodRes, cartRes, catRes] = await Promise.all([
        api.get('/products/'),
        api.get('/cart/'),
        api.get('/categories/')
      ]);
      setProducts(prodRes.data.results || prodRes.data);
      setCart(cartRes.data);
      setCategories([{ id: 'All', name: 'All' }, ...(catRes.data.results || catRes.data)]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const addToCart = async (productId) => {
    setCartLoading(true);
    try {
      const res = await api.post('/cart/items/', { product: productId, quantity: 1 });
      setCart(res.data);
      showMsg('success', 'Item added to your basket.');
    } catch (err) {
      showMsg('danger', err.response?.data?.error || 'Failed to add item.');
    } finally { setCartLoading(false); }
  };

  const toggleFavorite = async (p) => {
    const isFav = p.is_favorite;
    try {
      if (isFav) {
        await api.delete('/favorites/remove/', { data: { product: p.id } });
        showMsg('success', 'Removed from favorites.');
      } else {
        await api.post('/favorites/', { product: p.id });
        showMsg('success', 'Added to favorites!');
      }
      setProducts(products.map(item =>
        item.id === p.id ? { ...item, is_favorite: !isFav } : item
      ));
    } catch {
      showMsg('danger', 'Failed to update wishlist.');
    }
  };

  const cartItemCount = cart?.items?.length || 0;

  const filteredProducts = products.filter(p => {
    const titleMatch = p.title?.toLowerCase().includes(search.toLowerCase()) || false;
    const catMatch   = p.category_name?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchesSearch   = titleMatch || catMatch;
    const matchesCategory = activeCategory === 'All' || p.category_name === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="flex-center py-5" style={{ minHeight: '60vh', gap: '0.75rem' }}>
      <div className="spinner-agr" />
      <span className="text-muted">Loading marketplace...</span>
    </div>
  );

  return (
    <div className="buyer-marketplace animate-fade-in">

      {/* ── HERO BANNER ─────────────────────────────── */}
      <div className="buyer-hero-banner">
        <div className="buyer-hero-deco">🌾🍅🥕🫒</div>
        <div className="buyer-hero-content">
          <div className="buyer-hero-text">
            <div className="buyer-hero-tag">
              <BadgeCheck size={13} /> AgriGov Market — Official Marketplace
            </div>
            <h1 className="buyer-hero-title">
              Welcome to your Buyer Space
            </h1>
            <p className="buyer-hero-sub">
              Browse fresh produce directly from certified Algerian farms.
              Compare prices against official Ministry benchmarks.
            </p>
            <div className="buyer-hero-actions">
              <button className="buyer-hero-btn-primary" onClick={() => navigate('/buyer/cart')}>
                <ShoppingCart size={15} />
                My Basket {cartItemCount > 0 && `(${cartItemCount})`}
              </button>
              <button className="buyer-hero-btn-outline" onClick={() => navigate('/buyer-dashboard/orders')}>
                <Clock size={15} />
                My Orders
              </button>
            </div>
          </div>
          <div className="buyer-hero-badges">
            <div className="buyer-hero-badge-item">
              <ShieldCheck size={16} />
              <span>Verified Sellers</span>
            </div>
            <div className="buyer-hero-badge-item">
              <BarChart3 size={16} />
              <span>Official Prices Visible</span>
            </div>
            <div className="buyer-hero-badge-item">
              <Sprout size={16} />
              <span>Certified Products</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────── */}
      <div className="buyer-kpi-grid">
        <div className="buyer-kpi-card stagger-1 animate-fade-up">
          <div className="buyer-kpi-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            <ShoppingCart size={20} />
          </div>
          <div>
            <div className="buyer-kpi-value">{cartItemCount}</div>
            <div className="buyer-kpi-label">Cart Items</div>
          </div>
        </div>
        <div className="buyer-kpi-card stagger-2 animate-fade-up">
          <div className="buyer-kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <Package size={20} />
          </div>
          <div>
            <div className="buyer-kpi-value">{products.length}</div>
            <div className="buyer-kpi-label">Available Products</div>
          </div>
        </div>
        <div className="buyer-kpi-card stagger-3 animate-fade-up">
          <div className="buyer-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <FileText size={20} />
          </div>
          <div>
            <div className="buyer-kpi-value">—</div>
            <div className="buyer-kpi-label">Pending Orders</div>
          </div>
        </div>
        <div className="buyer-kpi-card stagger-4 animate-fade-up">
          <div className="buyer-kpi-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
            <Heart size={20} />
          </div>
          <div>
            <div className="buyer-kpi-value">{products.filter(p => p.is_favorite).length}</div>
            <div className="buyer-kpi-label">Wishlist Items</div>
          </div>
        </div>
      </div>

      {/* ── CATEGORY QUICK-ACCESS ──────────────────── */}
      <div className="buyer-categories-row">
        <button
          className={`buyer-cat-pill ${activeCategory === 'All' ? 'buyer-cat-pill-active' : ''}`}
          onClick={() => setActiveCategory('All')}
        >
          🛒 All Products
        </button>
        {QUICK_CATEGORIES.map(c => (
          <button
            key={c.label}
            className={`buyer-cat-pill ${activeCategory === c.label ? 'buyer-cat-pill-active' : ''}`}
            style={activeCategory === c.label ? { background: c.bg, color: c.color, borderColor: c.color } : {}}
            onClick={() => setActiveCategory(c.label)}
          >
            {c.icon} {c.label}
          </button>
        ))}
        {categories.filter(c => c.name !== 'All' && !QUICK_CATEGORIES.find(q => q.label === c.name)).slice(0, 3).map(c => (
          <button
            key={c.id}
            className={`buyer-cat-pill ${activeCategory === c.name ? 'buyer-cat-pill-active' : ''}`}
            onClick={() => setActiveCategory(c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* ── OFFICIAL PRICES PREVIEW ────────────────── */}
      <div className="buyer-prices-preview">
        <div className="buyer-prices-preview-header">
          <div className="d-flex align-items-center gap-2">
            <Building2 size={15} style={{ color: '#7c3aed' }} />
            <strong>Ministry Reference Prices</strong>
            <span className="buyer-prices-live-pill">Today</span>
          </div>
          <button className="buyer-prices-see-all" onClick={() => navigate('/buyer-dashboard/orders')}>
            View All <ChevronRight size={13} />
          </button>
        </div>
        <div className="buyer-prices-preview-list">
          {PRICE_PREVIEW.map((p, i) => (
            <div key={i} className="buyer-prices-preview-item">
              <PriceStatusDot status={p.status} />
              <span className="buyer-prices-preview-name">{p.name}</span>
              <span className="buyer-prices-preview-range">{p.range}</span>
            </div>
          ))}
        </div>
      </div>

      {message && (
        <div className={`alert-agr alert-agr-${message.type} animate-fade-up mb-4 d-flex align-items-center gap-2`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── FILTER BAR + PRODUCT GRID ──────────────── */}
      <div className="mt-2">
        <div className="buyer-filter-bar mb-4 sticky-top-custom">
          <div className="buyer-filter-search">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search fresh products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="buyer-filter-select"
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <span className="text-muted small fw-medium">{filteredProducts.length} products available</span>
          <div className="d-flex gap-2">
            <span className="very-small text-muted d-flex align-items-center gap-1"><CheckCircle size={10} className="text-success" />Verified Farmers</span>
            <span className="very-small text-muted d-flex align-items-center gap-1"><ShieldCheck size={10} className="text-primary" />Certified Quality</span>
          </div>
        </div>

        <div className="product-grid">
          {filteredProducts.map(p => (
            <div key={p.id} className="product-card-premium animate-fade-up">
              <div className="product-card-image">
                {p.image
                  ? <img src={p.image} alt={p.title} />
                  : <div className="placeholder-image"><Package size={32} /></div>
                }
                <QualityBadge quality={p.quality} />
                <button
                  className={`fav-btn-floating ${p.is_favorite ? 'active' : ''}`}
                  onClick={e => { e.stopPropagation(); toggleFavorite(p); }}
                  title={p.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart size={16} fill={p.is_favorite ? '#ef4444' : 'none'} className={p.is_favorite ? 'text-danger' : ''} />
                </button>
              </div>
              <div className="product-card-body">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <h4 className="product-title">{p.title}</h4>
                  <span className="category-tag">{p.category_name}</span>
                </div>

                <div className="product-price-row mb-2">
                  <span className="price">{p.price}</span>
                  <span className="unit">DZD / {p.unit}</span>
                  <PriceBadge comparison={p.official_price_comparison} />
                </div>

                <div className="farmer-info mb-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-1">
                    <div className="avatar-xs-circle">{p.farm_name?.charAt(0)}</div>
                    <span className="very-small text-muted">By <span className="fw-bold">{p.farm_name}</span></span>
                  </div>
                  <VerifiedBadge role="farmer" isVerified={p.farmer_is_verified} trustLevel={p.farmer_trust_level} showLabel={false} />
                </div>

                <div className="product-actions">
                  <button
                    className="btn-agr btn-primary flex-fill btn-sm fw-bold"
                    onClick={() => addToCart(p.id)}
                    disabled={cartLoading || p.stock === 0}
                  >
                    {p.stock === 0 ? <><XCircle size={14} /> Sold Out</> : <><Plus size={14} /> Add to Basket</>}
                  </button>
                  <button
                    className="btn-icon btn-sm"
                    title="Quick View"
                    onClick={() => setSelectedProduct(p)}
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="agr-card p-5 text-center w-100">
              <Search size={44} className="text-muted mb-3 opacity-25" />
              <h4 className="h6 text-muted">No products match your search</h4>
              <p className="small text-muted mb-3">Try different keywords or browse other categories.</p>
              <button className="btn-agr btn-outline btn-sm" onClick={() => { setSearch(''); setActiveCategory('All'); }}>
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          cartLoading={cartLoading}
        />
      )}
    </div>
  );
}

export default BuyerDashboard;
