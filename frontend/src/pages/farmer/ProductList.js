import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Plus, Leaf, Search, Edit3, Trash2, Eye, EyeOff,
  ChevronRight, Tag, AlertCircle, CheckCircle, Package, 
  ArrowUpRight, ArrowDownRight, Minus, Home, 
  Layers, ShoppingBag, TrendingUp, BarChart3, Filter
} from 'lucide-react';

const PriceCompBadge = ({ comparison }) => {
  if (!comparison) return null;
  const { status, difference_percentage } = comparison;
  if (status === 'above') return (
    <div className="f-price-above" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.25rem' }}>
      <ArrowUpRight size={10} strokeWidth={3} /> {difference_percentage}% 
    </div>
  );
  if (status === 'below') return (
    <div className="f-price-below" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.25rem' }}>
      <ArrowDownRight size={10} strokeWidth={3} /> {difference_percentage}% 
    </div>
  );
  return (
    <div className="f-badge-standard" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.25rem' }}>
      Avg
    </div>
  );
};

const QualityBadge = ({ quality }) => {
  const qClass = {
    PREMIUM:  'f-badge-premium',
    ORGANIC:  'f-badge-organic',
    STANDARD: 'f-badge-standard',
    ECONOMY:  'f-badge-economy',
  }[quality] || 'f-badge-standard';

  const icon = {
    PREMIUM:  '⭐',
    ORGANIC:  '🌿',
    STANDARD: '✅',
    ECONOMY:  '📦',
  }[quality] || '✅';

  return (
    <span className={`f-badge ${qClass}`}>
      {icon} {quality}
    </span>
  );
};

export default function ProductList() {
  const navigate   = useNavigate();
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearch]   = useState('');
  const [statusFilter, setStatus] = useState('ALL');
  const [catFilter, setCat]       = useState('');
  const [toast, setToast]         = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products/?my_products=true'),
        api.get('/categories/'),
      ]);
      setProducts(prodRes.data.results || prodRes.data);
      setCategories(catRes.data.results || catRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleActive = async (id, cur) => {
    try {
      await api.patch(`/products/${id}/`, { is_active: !cur });
      showToast(`Product ${!cur ? 'published' : 'hidden'} successfully!`);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !cur } : p));
    } catch (err) { 
      console.error(err);
      showToast('Failed to update status. Please try again.', 'error');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product? This action is permanent.')) return;
    try {
      await api.delete(`/products/${id}/`);
      showToast('Product removed successfully.');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch { 
      showToast('Failed to delete product', 'error');
    }
  };

  const filtered = products.filter(p => {
    const s = searchTerm.toLowerCase();
    const matchSearch = p.title.toLowerCase().includes(s) ||
      p.category_name?.toLowerCase().includes(s) ||
      p.farm_name?.toLowerCase().includes(s);
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.is_active) ||
      (statusFilter === 'INACTIVE' && !p.is_active);
    const matchCat = !catFilter || p.category_name === catFilter;
    return matchSearch && matchStatus && matchCat;
  });

  // Calculate KPIs
  const kpis = {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    lowStock: products.filter(p => p.stock < 10).length,
    totalValue: products.reduce((acc, p) => acc + (parseFloat(p.price) * p.stock), 0)
  };

  if (loading) return (
    <div className="f-spinner-wrap">
      <div className="f-spinner" />
      <span>Syncing Inventory Registry...</span>
    </div>
  );

  return (
    <div className="farmer-page-wrapper">

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`f-alert f-alert-${toast.type === 'error' ? 'danger' : 'success'}`} style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, boxShadow: 'var(--f-shadow-hover)', minWidth: '300px' }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <div>{toast.msg}</div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="f-breadcrumb" style={{ marginBottom: '1.5rem' }}>
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <span style={{ fontWeight: 700, color: 'var(--f-forest)' }}>Product Inventory</span>
      </div>

      {/* Streamlined Header — Keeping only essential actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--f-forest-dark)', margin: 0, letterSpacing: '-1px' }}>
            Marketplace <span style={{ color: 'var(--f-olive)' }}>Inventory</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, margin: '0.25rem 0 0' }}>
            Manage and monitor your agricultural product registry.
          </p>
        </div>
        
        <button 
          className="btn-f-primary"
          onClick={() => navigate('/farmer-dashboard/product/new')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            borderRadius: '12px', 
            fontSize: '0.85rem',
            boxShadow: 'var(--f-shadow-btn)'
          }}
        >
          <Plus size={18} strokeWidth={3} /> Add New Product
        </button>
      </div>

      {/* KPI Section */}
      <div className="f-kpi-grid">
        <div className="f-kpi-card">
          <div className="f-kpi-icon sage">
            <Package size={20} />
          </div>
          <div className="f-kpi-body">
            <div className="f-kpi-value">{kpis.total}</div>
            <div className="f-kpi-label">Total SKUs</div>
          </div>
        </div>
        <div className="f-kpi-card">
          <div className="f-kpi-icon green">
            <TrendingUp size={20} />
          </div>
          <div className="f-kpi-body">
            <div className="f-kpi-value">{kpis.active}</div>
            <div className="f-kpi-label">Published LIVE</div>
          </div>
        </div>
        <div className="f-kpi-card">
          <div className="f-kpi-icon gold">
            <AlertCircle size={20} />
          </div>
          <div className="f-kpi-body">
            <div className="f-kpi-value" style={{ color: kpis.lowStock > 0 ? 'var(--f-red)' : 'inherit' }}>{kpis.lowStock}</div>
            <div className="f-kpi-label">Low Stock Alerts</div>
          </div>
        </div>
        <div className="f-kpi-card">
          <div className="f-kpi-icon blue">
            <BarChart3 size={20} />
          </div>
          <div className="f-kpi-body">
            <div className="f-kpi-value">{Math.round(kpis.totalValue).toLocaleString()} <small>DZD</small></div>
            <div className="f-kpi-label">Est. Inventory Value</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="f-card" style={{ marginBottom: '2rem', border: 'none', boxShadow: 'var(--f-shadow-card)' }}>
        <div className="f-card-body" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            
            <div className="f-search-wrap" style={{ flex: 1, minWidth: '250px' }}>
              <Search size={16} className="f-search-icon" />
              <input
                type="text"
                className="f-search-input"
                placeholder="Search by product name, category or farm..."
                value={searchTerm}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div style={{ width: '1px', height: '24px', background: 'var(--f-mint-deep)', margin: '0 0.5rem' }} />

            <div style={{ position: 'relative', width: '200px' }}>
              <Tag size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <select
                className="f-input f-select"
                style={{ paddingLeft: '2.5rem', fontSize: '0.8rem', fontWeight: 700 }}
                value={catFilter}
                onChange={e => setCat(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="f-segmented">
              <button 
                className={`f-segmented-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatus('ALL')}
              >
                All ({products.length})
              </button>
              <button 
                className={`f-segmented-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
                onClick={() => setStatus('ACTIVE')}
              >
                Live ({kpis.active})
              </button>
              <button 
                className={`f-segmented-btn ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
                onClick={() => setStatus('INACTIVE')}
              >
                Hidden ({kpis.total - kpis.active})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="f-card" style={{ border: 'none' }}>
        <div className="f-table-wrap">
          <table className="f-table">
            <thead>
              <tr>
                <th style={{ width: '300px' }}>Product & Market Status</th>
                <th>Classification</th>
                <th>Farm Origin</th>
                <th className="right">Unit Price</th>
                <th className="right">Inventory</th>
                <th>Quality</th>
                <th>Visibility</th>
                <th className="right" style={{ paddingRight: '1.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="f-empty-state">
                      <div className="f-empty-icon"><Package size={40} /></div>
                      <div className="f-empty-title">No matching products found</div>
                      <div className="f-empty-sub">Adjust your search or filters to see your inventory items.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.65 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="f-product-thumb">
                          {p.image ? (
                            <img src={p.image} alt={p.title} />
                          ) : (
                            <Leaf size={16} style={{ color: 'var(--f-sage)' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--f-forest-dark)' }}>{p.title}</div>
                          <PriceCompBadge comparison={p.official_price_comparison} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="f-badge f-badge-active" style={{ fontSize: '0.7rem' }}>
                        {p.category_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--f-olive)' }}>
                        <Home size={12} /> {p.farm_name}
                      </div>
                    </td>
                    <td className="right">
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{Number(p.price).toLocaleString()} <small style={{ color: '#9ca3af', fontSize: '0.7rem' }}>DZD</small></div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>per {p.unit}</div>
                    </td>
                    <td className="right">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', fontWeight: 800, color: p.stock < 10 ? 'var(--f-red)' : 'inherit' }}>
                        {p.stock} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{p.unit}s</span>
                        {p.stock < 10 && <AlertCircle size={12} />}
                      </div>
                    </td>
                    <td>
                      <QualityBadge quality={p.quality} />
                    </td>
                    <td>
                      {p.is_active ? (
                        <div className="f-badge f-badge-confirmed">
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#065f46', marginRight: '4px' }} /> LIVE
                        </div>
                      ) : (
                        <div className="f-badge f-badge-inactive">
                          <EyeOff size={10} /> HIDDEN
                        </div>
                      )}
                    </td>
                    <td className="right" style={{ paddingRight: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className={`btn-f-icon ${p.is_active ? '' : 'gold'}`}
                          title={p.is_active ? 'Hide from Market' : 'Publish to Market'}
                          onClick={() => toggleActive(p.id, p.is_active)}
                        >
                          {p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button 
                          className="btn-f-icon"
                          title="Edit Details"
                          onClick={() => navigate(`/farmer-dashboard/product/edit/${p.id}`)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className="btn-f-icon danger"
                          title="Remove Product"
                          onClick={() => deleteProduct(p.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
