import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Plus, Leaf, Search, Edit3, Trash2, Eye, EyeOff,
  ChevronRight, Tag, AlertCircle, CheckCircle, Package
} from 'lucide-react';

/* ── Price comparison badge ──────────────────────────────── */
const PriceCompBadge = ({ comparison }) => {
  if (!comparison) return null;
  const { status, difference_percentage } = comparison;
  if (status === 'above') return <span className="f-price-above">+{difference_percentage}%</span>;
  if (status === 'below') return <span className="f-price-below">-{difference_percentage}%</span>;
  return <span className="f-price-fair">Fair</span>;
};

/* ── Quality badge ───────────────────────────────────────── */
const QualityBadge = ({ quality }) => {
  const map = {
    PREMIUM:  { cls: 'f-badge f-badge-premium',  label: 'Premium'  },
    ORGANIC:  { cls: 'f-badge f-badge-organic',  label: 'Organic'  },
    STANDARD: { cls: 'f-badge f-badge-standard', label: 'Standard' },
    ECONOMY:  { cls: 'f-badge f-badge-economy',  label: 'Economy'  },
  };
  const q = map[quality] || map.STANDARD;
  return <span className={q.cls}>{q.label}</span>;
};

export default function ProductList() {
  const navigate   = useNavigate();
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearch]   = useState('');
  const [statusFilter, setStatus] = useState('ALL');
  const [catFilter, setCat]       = useState('');

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

  useEffect(() => { fetchData(); }, []);

  const toggleActive = async (id, cur) => {
    try {
      await api.patch(`/products/${id}/`, { is_active: !cur });
      fetchData();
    } catch { alert('Failed to update status'); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}/`);
      fetchData();
    } catch { alert('Failed to delete product'); }
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

  if (loading) return (
    <div className="f-spinner-wrap">
      <div className="f-spinner" />
      <span>Loading listings…</span>
    </div>
  );

  const tabs = [
    { key: 'ALL',      label: 'All',       count: products.length },
    { key: 'ACTIVE',   label: 'Published', count: products.filter(p => p.is_active).length },
    { key: 'INACTIVE', label: 'Hidden',    count: products.filter(p => !p.is_active).length },
  ];

  return (
    <div className="farmer-page-wrapper">

      {/* Breadcrumb */}
      <div className="f-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <span>My Listings</span>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--f-forest-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={24} style={{ color: 'var(--f-olive)' }} /> My Listings
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: '#6b7280', fontSize: '0.88rem' }}>
            Manage all your marketplace products and visibility.
          </p>
        </div>
        <button className="btn-f-primary" onClick={() => navigate('/farmer-dashboard/product/new')}>
          <Plus size={17} /> New Listing
        </button>
      </div>

      {/* Filter bar */}
      <div className="f-filter-bar">
        {/* Search */}
        <div className="f-search-wrap" style={{ flex: '1 1 220px', minWidth: 180 }}>
          <Search size={15} className="f-search-icon" />
          <input
            type="text"
            className="f-search-input"
            placeholder="Search by name, category, farm…"
            value={searchTerm}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="f-filter-bar-divider" />

        {/* Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 180px' }}>
          <Tag size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
          <select
            className="f-input f-select"
            style={{ flex: 1 }}
            value={catFilter}
            onChange={e => setCat(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="f-filter-bar-divider" />

        {/* Status pills */}
        <div className="f-filter-pills">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`f-pill ${statusFilter === t.key ? 'active' : ''}`}
              onClick={() => setStatus(t.key)}
            >
              {t.label} <span className="f-pill-count">({t.count})</span>
            </button>
          ))}
        </div>

        {/* Clear */}
        {(searchTerm || catFilter || statusFilter !== 'ALL') && (
          <button
            className="btn-f-ghost btn-f-sm"
            onClick={() => { setSearch(''); setCat(''); setStatus('ALL'); }}
          >
            Clear ×
          </button>
        )}
      </div>

      {/* Results summary */}
      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: '0.875rem', fontWeight: 600 }}>
        {filtered.length} listing{filtered.length !== 1 ? 's' : ''} found
      </div>

      {/* Table / Empty */}
      {filtered.length === 0 ? (
        <div className="f-card">
          <div className="f-empty-state">
            <div className="f-empty-icon"><Leaf size={32} strokeWidth={1.5} /></div>
            <div className="f-empty-title">No listings found</div>
            <div className="f-empty-sub">Try adjusting your filters or search terms.</div>
            {products.length === 0 && (
              <button className="btn-f-primary" onClick={() => navigate('/farmer-dashboard/product/new')}>
                <Plus size={16} /> Create Your First Listing
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="f-card">
          <div className="f-table-wrap">
            <table className="f-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Farm</th>
                  <th className="right">Price</th>
                  <th className="right">Stock</th>
                  <th>Quality</th>
                  <th>Status</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="f-product-thumb">
                          {p.image
                            ? <img src={p.image} alt={p.title} />
                            : <Leaf size={16} strokeWidth={2} style={{ color: 'var(--f-sage)' }} />
                          }
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1f2937' }}>{p.title}</div>
                          <PriceCompBadge comparison={p.official_price_comparison} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="f-category-tag">{p.category_name || '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 500 }}>{p.farm_name || '—'}</span>
                    </td>
                    <td className="col-right">
                      <span style={{ fontWeight: 800, fontSize: '0.875rem' }}>{p.price}</span>
                      <span style={{ color: '#9ca3af', fontSize: '0.72rem' }}> DZD/{p.unit}</span>
                    </td>
                    <td className="col-right">
                      <span style={{
                        fontWeight: 700, fontSize: '0.82rem',
                        color: p.stock < 10 ? 'var(--f-red)' : '#374151'
                      }}>
                        {p.stock} {p.unit}
                        {p.stock < 10 && <AlertCircle size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                      </span>
                    </td>
                    <td><QualityBadge quality={p.quality} /></td>
                    <td>
                      <span className={`f-badge ${p.is_active ? 'f-badge-active' : 'f-badge-inactive'}`}>
                        {p.is_active ? <><CheckCircle size={10} /> Published</> : 'Hidden'}
                      </span>
                    </td>
                    <td className="col-right">
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          className={`btn-f-icon btn-f-icon-sm${!p.is_active ? '' : ''}`}
                          title={p.is_active ? 'Hide Listing' : 'Publish Listing'}
                          onClick={() => toggleActive(p.id, p.is_active)}
                          style={!p.is_active ? { color: 'var(--f-olive)' } : {}}
                        >
                          {p.is_active ? <EyeOff size={15} strokeWidth={2.2} /> : <Eye size={15} strokeWidth={2.2} />}
                        </button>
                        <button
                          className="btn-f-icon btn-f-icon-sm"
                          title="Edit"
                          onClick={() => navigate(`/farmer-dashboard/product/edit/${p.id}`)}
                        >
                          <Edit3 size={15} strokeWidth={2.2} />
                        </button>
                        <button
                          className="btn-f-icon btn-f-icon-sm danger"
                          title="Delete"
                          onClick={() => deleteProduct(p.id)}
                        >
                          <Trash2 size={15} strokeWidth={2.2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
