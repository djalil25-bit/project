import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Home, MapPin, Maximize2, Package, ShoppingCart,
  DollarSign, Plus, Edit3, ChevronRight, Trophy,
  Eye, EyeOff, Edit, Leaf, Calendar
} from 'lucide-react';

const GRADIENTS = [
  'linear-gradient(135deg, #1a4a2e 0%, #4a7c59 100%)',
  'linear-gradient(135deg, #2d5a27 0%, #6aab5e 100%)',
  'linear-gradient(135deg, #3a5a40 0%, #7aab6a 100%)',
  'linear-gradient(135deg, #2e4a1e 0%, #5a8c3e 100%)',
  'linear-gradient(135deg, #1e3a2e 0%, #3a7a5a 100%)',
];

const QualityBadge = ({ quality }) => {
  const map = {
    PREMIUM:  'f-badge f-badge-premium',
    ORGANIC:  'f-badge f-badge-organic',
    STANDARD: 'f-badge f-badge-standard',
    ECONOMY:  'f-badge f-badge-economy',
  };
  return <span className={map[quality] || 'f-badge f-badge-standard'}>{quality || 'Standard'}</span>;
};

export default function FarmDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [farm, setFarm]       = useState(null);
  const [stats, setStats]     = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const [farmRes, prodRes] = await Promise.all([
          api.get(`/farms/${id}/`),
          api.get(`/products/?my_products=true&farm=${id}`),
        ]);
        setFarm(farmRes.data);
        setProducts(prodRes.data.results || prodRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/farms/${id}/stats/?timeframe=${timeframe}`)
      .then(res => setStats(res.data))
      .catch(console.error);
  }, [id, timeframe]);

  const toggleProduct = async (pid, cur) => {
    await api.patch(`/products/${pid}/`, { is_active: !cur });
    const prodRes = await api.get(`/products/?my_products=true&farm=${id}`);
    setProducts(prodRes.data.results || prodRes.data);
  };

  if (loading) return (
    <div className="f-spinner-wrap">
      <div className="f-spinner" />
      <span>Loading farm…</span>
    </div>
  );
  if (!farm) return (
    <div className="f-card">
      <div className="f-empty-state">
        <div className="f-empty-icon"><Home size={32} /></div>
        <div className="f-empty-title">Farm not found</div>
      </div>
    </div>
  );

  const initials = farm.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const gradient = GRADIENTS[farm.id % GRADIENTS.length];

  const statCards = [
    { icon: <Package size={20} />, color: 'green', val: stats?.product_count ?? products.length, label: 'Listed Products' },
    { icon: <ShoppingCart size={20} />, color: 'blue', val: stats?.order_count ?? '—', label: 'Orders Received' },
    { icon: <DollarSign size={20} />, color: 'gold', val: stats ? <>{parseFloat(stats.revenue).toLocaleString()}<small>DZD</small></> : '—', label: 'Revenue' },
  ];

  return (
    <div className="farmer-page-wrapper">

      {/* Breadcrumb */}
      <div className="f-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <Link to="/farmer-dashboard/farms">My Farms</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <span>{farm.name}</span>
      </div>

      {/* Farm Hero card */}
      <div className="f-card" style={{ marginBottom: '1.5rem', overflow: 'visible' }}>
        {/* Image banner */}
        <div style={{ height: 220, position: 'relative', borderRadius: 'var(--f-radius) var(--f-radius) 0 0', overflow: 'hidden' }}>
          {farm.image
            ? <img src={farm.image} alt={farm.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>{initials}</span>
              </div>
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
          <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2 }}>{farm.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={13} style={{ color: '#ef4444' }} /> {farm.location}
                </span>
                {farm.size_hectares && (
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Maximize2 size={12} /> {farm.size_hectares} ha
                  </span>
                )}
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={12} /> Added {new Date(farm.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-f-hero-ghost btn-f-sm" onClick={() => navigate(`/farmer-dashboard/farm/edit/${farm.id}`)}>
                <Edit3 size={14} /> Edit Farm
              </button>
              <button className="btn-f-hero btn-f-sm" onClick={() => navigate(`/farmer-dashboard/product/new?farm=${farm.id}`)}>
                <Plus size={14} /> Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        {farm.description && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(26,74,46,0.07)', color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {farm.description}
          </div>
        )}
      </div>

      {/* Performance header + timeframe control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="f-section-title">
          <div className="f-section-title-icon"><Trophy size={14} /></div>
          Farm Performance
        </div>
        <div className="f-segmented">
          {[['all','All Time'],['year','This Year'],['month','This Month']].map(([k, l]) => (
            <button key={k} className={`f-segmented-btn ${timeframe === k ? 'active' : ''}`} onClick={() => setTimeframe(k)}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="f-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.75rem' }}>
        {statCards.map((s, i) => (
          <div key={i} className="f-kpi-card">
            <div className={`f-kpi-icon ${s.color}`}>{s.icon}</div>
            <div className="f-kpi-body">
              <div className="f-kpi-value">{s.val}</div>
              <div className="f-kpi-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top products ranking */}
      {stats?.best_products?.length > 0 && (
        <div className="f-chart-card" style={{ marginBottom: '1.5rem' }}>
          <div className="f-chart-header">
            <div className="f-chart-title"><Trophy size={15} style={{ color: 'var(--f-gold)' }} /> Top Selling Products</div>
          </div>
          {stats.best_products.map((bp, i) => (
            <div key={bp.id} className="f-ranking-item">
              <div className={`f-rank-badge ${i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : 'rn'}`}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ flex: 1 }}>
                <div className="f-rank-name">{bp.name}</div>
                <div className="f-rank-sub">{bp.qty} units sold</div>
              </div>
              <div className="f-rank-value">
                <div className="f-rank-rev">{bp.revenue.toLocaleString()} DZD</div>
                <div className="f-rank-bar-wrap">
                  <div className="f-rank-bar" style={{ width: `${Math.min((bp.revenue / (stats.best_products[0]?.revenue || 1)) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products table */}
      <div className="f-card">
        <div className="f-card-header">
          <div className="f-section-title">
            <div className="f-section-title-icon"><Leaf size={14} /></div>
            Products on This Farm
          </div>
          <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>
            {products.length} listing{products.length !== 1 ? 's' : ''}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="f-empty-state">
            <div className="f-empty-icon"><Package size={28} /></div>
            <div className="f-empty-title">No products yet</div>
            <div className="f-empty-sub">Register your first product for this farm.</div>
            <button className="btn-f-primary btn-f-sm" onClick={() => navigate(`/farmer-dashboard/product/new?farm=${farm.id}`)}>
              <Plus size={15} /> Add First Product
            </button>
          </div>
        ) : (
          <div className="f-table-wrap">
            <table className="f-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="right">Price</th>
                  <th className="right">Stock</th>
                  <th>Quality</th>
                  <th>Status</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.title}</td>
                    <td><span className="f-category-tag">{p.category_name}</span></td>
                    <td className="col-right" style={{ fontWeight: 800, fontSize: '0.875rem' }}>
                      {p.price} <span style={{ color: '#9ca3af', fontSize: '0.72rem' }}>DZD/{p.unit}</span>
                    </td>
                    <td className="col-right" style={{ fontWeight: 700, color: p.stock < 10 ? 'var(--f-red)' : '#374151', fontSize: '0.82rem' }}>
                      {p.stock} {p.unit}
                    </td>
                    <td><QualityBadge quality={p.quality} /></td>
                    <td>
                      <span className={`f-badge ${p.is_active ? 'f-badge-active' : 'f-badge-inactive'}`}>
                        {p.is_active ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="col-right">
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                        <button className="btn-f-icon btn-f-icon-sm" title={p.is_active ? 'Hide' : 'Publish'} onClick={() => toggleProduct(p.id, p.is_active)}>
                          {p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button className="btn-f-icon btn-f-icon-sm" title="Edit" onClick={() => navigate(`/farmer-dashboard/product/edit/${p.id}`)}>
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
