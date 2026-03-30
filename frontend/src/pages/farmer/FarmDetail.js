import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Home, MapPin, Maximize, Package, TrendingUp, ShoppingCart,
  DollarSign, Plus, Edit3, ArrowLeft, ChevronRight, Trophy,
  BarChart2, Eye, EyeOff, Edit, Leaf, Calendar
} from 'lucide-react';

const FARM_GRADIENTS = [
  'linear-gradient(135deg, #10b981 0%, #047857 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
];

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const secs = Math.floor((Date.now() - d) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}

function FarmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState(null);
  const [stats, setStats] = useState(null);
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
    <div className="flex-center py-5"><div className="spinner-agr" /><span className="ms-3 text-muted">Loading farm...</span></div>
  );
  if (!farm) return <div className="agr-card p-5 text-center text-muted">Farm not found.</div>;

  const initials = farm.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const gradient = FARM_GRADIENTS[farm.id % FARM_GRADIENTS.length];

  return (
    <div className="farm-detail-page animate-fade-in">
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <Link to="/farmer-dashboard/farms">My Farms</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>{farm.name}</span>
      </div>

      {/* Farm Hero */}
      <div className="farm-detail-hero agr-card mb-4 overflow-hidden">
        <div className="farm-hero-banner">
          {farm.image ? (
            <img src={farm.image} alt={farm.name} className="farm-hero-img" />
          ) : (
            <div className="farm-hero-placeholder" style={{ background: gradient }}>
              <span className="farm-hero-initials">{initials}</span>
            </div>
          )}
          <div className="farm-hero-overlay" />
        </div>
        <div className="farm-hero-body p-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <h1 className="h3 fw-bold mb-1">{farm.name}</h1>
              <div className="d-flex align-items-center gap-3 text-muted small flex-wrap">
                <span className="d-flex align-items-center gap-1"><MapPin size={14} className="text-danger" />{farm.location}</span>
                {farm.size_hectares && <span className="d-flex align-items-center gap-1"><Maximize size={13} />{farm.size_hectares} ha</span>}
                <span className="d-flex align-items-center gap-1"><Calendar size={13} />Added {new Date(farm.created_at).toLocaleDateString()}</span>
              </div>
              {farm.description && <p className="text-muted small mt-2 mb-0">{farm.description}</p>}
            </div>
            <div className="d-flex gap-2">
              <button className="btn-agr btn-outline btn-sm d-flex align-items-center gap-1" onClick={() => navigate(`/farmer-dashboard/farm/edit/${farm.id}`)}>
                <Edit3 size={15} /> Edit Farm
              </button>
              <button className="btn-agr btn-primary btn-sm d-flex align-items-center gap-1" onClick={() => navigate(`/farmer-dashboard/product/new?farm=${farm.id}`)}>
                <Plus size={15} /> Add Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards with Timeframe */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h6 fw-bold mb-0">Farm Performance</h3>
        <div className="d-flex gap-1">
          {['all', 'year', 'month'].map(t => (
            <button key={t} className={`btn-agr btn-sm ${timeframe === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTimeframe(t)}>
              {t === 'all' ? 'All Time' : t === 'year' ? 'This Year' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><Package size={22} /></div>
          <div>
            <div className="stat-value">{stats?.product_count ?? products.length}</div>
            <div className="stat-label">Listed Products</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><ShoppingCart size={22} /></div>
          <div>
            <div className="stat-value">{stats?.order_count ?? '—'}</div>
            <div className="stat-label">Orders Received</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-amber"><DollarSign size={22} /></div>
          <div>
            <div className="stat-value">{stats ? parseFloat(stats.revenue).toLocaleString() : '—'} <small className="very-small">DZD</small></div>
            <div className="stat-label">Revenue</div>
          </div>
        </div>
      </div>

      {/* Best Products */}
      {stats?.best_products?.length > 0 && (
        <div className="agr-card p-4 mb-4">
          <h5 className="h6 fw-bold mb-3 d-flex align-items-center"><Trophy size={16} className="text-amber me-2" />Top Selling Products</h5>
          <div className="d-flex flex-column gap-2">
            {stats.best_products.map((bp, i) => (
              <div key={bp.id} className="d-flex align-items-center justify-content-between p-2 bg-light-soft rounded-lg">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-muted very-small" style={{ width: 20 }}>#{i + 1}</span>
                  <span className="small fw-bold">{bp.name}</span>
                </div>
                <div className="text-end">
                  <div className="very-small text-muted">{bp.qty} units sold</div>
                  <div className="very-small fw-bold text-primary">{bp.revenue.toLocaleString()} DZD</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Farm Products Table */}
      <div className="agr-card overflow-hidden">
        <div className="agr-card-header d-flex justify-content-between align-items-center">
          <h3 className="agr-card-title d-flex align-items-center gap-2"><Leaf size={18} className="text-primary" />Products on This Farm</h3>
          <span className="text-muted very-small">{products.length} listing{products.length !== 1 ? 's' : ''}</span>
        </div>
        {products.length === 0 ? (
          <div className="p-5 text-center">
            <Package size={48} className="text-muted mb-3 opacity-25" />
            <p className="text-muted small">No products registered for this farm yet.</p>
            <button className="btn-agr btn-primary" onClick={() => navigate(`/farmer-dashboard/product/new?farm=${farm.id}`)}>
              <Plus size={16} className="me-2" />Add First Product
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="agr-table mb-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-end">Price</th>
                  <th className="text-end">Stock</th>
                  <th>Quality</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="hover-bg-light">
                    <td><span className="fw-bold small">{p.title}</span></td>
                    <td><span className="category-tag">{p.category_name}</span></td>
                    <td className="text-end small fw-bold">{p.price} DZD/{p.unit}</td>
                    <td className={`text-end small ${p.stock < 10 ? 'text-danger fw-bold' : ''}`}>{p.stock} {p.unit}</td>
                    <td>
                      <span className={`inline-badge ${
                        p.quality === 'PREMIUM' ? 'badge-status-confirmed' : 
                        p.quality === 'ORGANIC' ? 'badge-status-confirmed' : 
                        p.quality === 'ECONOMY' ? 'badge-status-pending' : 'badge-status-assigned'
                      }`}>
                        {p.quality || 'Standard'}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-badge ${p.is_active ? 'badge-status-confirmed' : 'badge-status-cancelled'}`}>
                        {p.is_active ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-1 justify-content-end">
                        <button className="btn-icon btn-sm" title={p.is_active ? 'Hide' : 'Publish'} onClick={() => toggleProduct(p.id, p.is_active)}>
                          {p.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button className="btn-icon btn-sm" title="Edit" onClick={() => navigate(`/farmer-dashboard/product/edit/${p.id}`)}>
                          <Edit size={15} />
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

export default FarmDetail;
