import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Plus, 
  Settings, 
  Wheat, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Sprout, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff,
  Package,
  Layers,
  ChevronRight
} from 'lucide-react';

const PriceBadge = ({ comparison }) => {
  if (!comparison) return null;
  const { status, difference_percentage } = comparison;
  const cls = status === 'above' ? 'price-above' : status === 'below' ? 'price-below' : 'price-equal';
  const label = status === 'above' ? `+${difference_percentage}%` : status === 'below' ? `-${difference_percentage}%` : 'Fair Price';
  return <span className={`price-badge ${cls}`} title={`vs Official Price`}>{label}</span>;
};

function FarmerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, prodRes] = await Promise.all([
        api.get('/dashboards/farmer-stats/'),
        api.get('/products/?my_products=true'),
      ]);
      setStats(statsRes.data);
      setProducts(prodRes.data.results || prodRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleProductActive = async (id, currentStatus) => {
    try {
      await api.patch(`/products/${id}/`, { is_active: !currentStatus });
      fetchData();
    } catch (err) { alert("Failed to update status"); }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/products/${id}/`);
        fetchData();
      } catch (err) { alert("Failed to delete product"); }
    }
  };

  if (loading) return (
    <div className="loading-wrapper flex-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-agr" /> <span className="ms-3">Loading farm data...</span>
    </div>
  );

  return (
    <div className="farmer-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Farm Overview</h1>
          <p className="page-subtitle">Welcome back! Manage your listings and track performance.</p>
        </div>
        <div className="page-actions">
          <button className="btn-agr btn-outline" onClick={() => navigate('/farmer-dashboard/harvests')}>
            <Wheat size={18} className="me-2" /> My Harvests
          </button>
          <button className="btn-agr btn-outline" onClick={() => navigate('/farmer-dashboard/farm/new')}>
            <Settings size={18} className="me-2" /> Farm Settings
          </button>
          <button className="btn-agr btn-primary" onClick={() => navigate('/farmer-dashboard/product/new')}>
            <Plus size={18} className="me-2" /> Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid mb-5">
          <div className="stat-card">
            <div className="stat-icon stat-icon-green"><Sprout size={24} /></div>
            <div>
              <div className="stat-value">{stats.my_products_count}</div>
              <div className="stat-label">Active Listings</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue"><TrendingUp size={24} /></div>
            <div>
              <div className="stat-value">{stats.total_items_sold}</div>
              <div className="stat-label">Units Sold</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-amber"><Clock size={24} /></div>
            <div>
              <div className="stat-value">{stats.pending_orders}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green"><DollarSign size={24} /></div>
            <div>
              <div className="stat-value">{stats.total_revenue} <small className="very-small">DZD</small></div>
              <div className="stat-label">Total Earnings</div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4 mt-2">
        {/* Recent Overview Area */}
        <div className="col-lg-12">
          <div className="agr-card">
            <div className="agr-card-header d-flex justify-content-between align-items-center">
              <h3 className="agr-card-title">Order Activity</h3>
              <button 
                className="btn-agr btn-link btn-sm text-primary text-decoration-none d-flex align-items-center" 
                onClick={() => navigate('/farmer/orders')}
              >
                Go to Order Management <ChevronRight size={16} />
              </button>
            </div>
            <div className="p-4 bg-light-soft rounded-bottom text-center">
              <div className="text-muted mb-0">
                You have <strong>{stats?.pending_orders || 0}</strong> orders awaiting your confirmation. 
                <span className="ms-2 text-primary cursor-pointer fw-bold d-inline-flex align-items-center" onClick={() => navigate('/farmer/orders')}>
                  Review them now <ChevronRight size={14} className="ms-1" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Management Grid Area */}
        <div className="col-lg-12 mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h5 fw-bold mb-0">My Market Listings</h3>
            <div className="text-muted small">Total: {products.length} products</div>
          </div>
          
          <div className="product-grid">
            {products.length === 0 ? (
              <div className="agr-card p-5 text-center w-100">
                <Package size={48} className="text-muted mb-3 opacity-25" />
                <h4 className="h5 text-muted">Your shop is empty</h4>
                <p className="small text-muted mb-4">Start by adding your first product to the marketplace.</p>
                <button className="btn-agr btn-primary" onClick={() => navigate('/farmer-dashboard/product/new')}>
                  List Your First Product
                </button>
              </div>
            ) : products.map(p => (
              <div key={p.id} className="product-card-premium">
                <div className="product-card-image">
                  {p.image ? (
                    <img src={p.image} alt={p.title} />
                  ) : (
                    <div className="placeholder-image"><Sprout size={32} /></div>
                  )}
                  <div className={`status-pill ${p.is_active ? 'active' : 'inactive'}`}>
                    {p.is_active ? 'Published' : 'Hidden'}
                  </div>
                </div>
                <div className="product-card-body">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h4 className="product-title">{p.title}</h4>
                    <span className="category-tag">{p.category_name}</span>
                  </div>
                  <div className="product-price-row mb-3">
                    <span className="price">{p.price} DZD</span>
                    <span className="unit">/{p.unit}</span>
                    <PriceBadge comparison={p.official_price_comparison} />
                  </div>
                  <div className="product-info-row mb-3">
                    <div className="info-item">
                      <Layers size={14} />
                      <span className={p.stock < 10 ? 'text-danger fw-bold' : ''}>
                        {p.stock} {p.unit} left
                      </span>
                    </div>
                  </div>
                  <div className="product-actions">
                    <button 
                      className={`btn-action ${p.is_active ? 'btn-action-warning' : 'btn-action-success'}`} 
                      title={p.is_active ? "Hide Listing" : "Publish Listing"}
                      onClick={() => toggleProductActive(p.id, p.is_active)}
                    >
                      {p.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button className="btn-action btn-action-secondary" title="Edit" onClick={() => navigate(`/farmer-dashboard/product/edit/${p.id}`)}>
                      <Edit3 size={16} />
                    </button>
                    <button className="btn-action btn-action-danger" title="Delete" onClick={() => deleteProduct(p.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmerDashboard;
