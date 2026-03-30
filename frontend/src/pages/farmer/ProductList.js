import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Plus, Package, Search, Edit3, Trash2, Eye, EyeOff,
  ChevronRight, Filter, Calendar, Tag, Layers, AlertCircle, CheckCircle
} from 'lucide-react';

const PriceBadge = ({ comparison }) => {
  if (!comparison) return null;
  const { status, difference_percentage } = comparison;
  const cls = status === 'above' ? 'price-above' : status === 'below' ? 'price-below' : 'price-equal';
  const label = status === 'above' ? `+${difference_percentage}%` : status === 'below' ? `-${difference_percentage}%` : 'Fair';
  return <span className={`price-badge ${cls}`}>{label}</span>;
};

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');  // ALL | ACTIVE | INACTIVE
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products/?my_products=true'),
        api.get('/categories/')
      ]);
      setProducts(prodRes.data.results || prodRes.data);
      setCategories(catRes.data.results || catRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleProductActive = async (id, currentStatus) => {
    try {
      await api.patch(`/products/${id}/`, { is_active: !currentStatus });
      fetchData();
    } catch (err) { alert('Failed to update status'); }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Delete this listing? This cannot be undone.')) {
      try {
        await api.delete(`/products/${id}/`);
        fetchData();
      } catch (err) { alert('Failed to delete product'); }
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.farm_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' ||
                        (statusFilter === 'ACTIVE' && p.is_active) ||
                        (statusFilter === 'INACTIVE' && !p.is_active);
    const matchCat = !categoryFilter || p.category_name === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  if (loading) return (
    <div className="flex-center py-5"><div className="spinner-agr"></div><span className="ms-3 text-muted">Loading listings...</span></div>
  );

  return (
    <div className="product-list-page">
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>My Listings</span>
      </div>

      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center gap-2"><Package size={26} className="text-primary" />My Listings</h1>
          <p className="page-subtitle text-muted">Manage all your marketplace products and visibility.</p>
        </div>
        <button className="btn-agr btn-primary d-flex align-items-center gap-2" onClick={() => navigate('/farmer-dashboard/product/new')}>
          <Plus size={18} /> New Listing
        </button>
      </div>

      {/* Filters Bar */}
      <div className="agr-card p-3 mb-4 sticky-top-custom">
        <div className="row g-3 align-items-center">
          <div className="col-lg-4">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, category, farm..."
                className="form-control-agr ps-5"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-lg-3">
            <div className="d-flex align-items-center gap-1">
              <Tag size={14} className="text-muted flex-shrink-0" />
              <select
                className="form-control-agr form-select form-input w-100"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="d-flex gap-2 justify-content-lg-end">
              {[
                { key: 'ALL', label: 'All', count: products.length },
                { key: 'ACTIVE', label: 'Published', count: products.filter(p => p.is_active).length },
                { key: 'INACTIVE', label: 'Hidden', count: products.filter(p => !p.is_active).length },
              ].map(f => (
                <button
                  key={f.key}
                  className={`tab-pill border-0 ${statusFilter === f.key ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label} <span className="ms-1 very-small opacity-60">({f.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary line */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <span className="text-muted small">{filtered.length} listing{filtered.length !== 1 ? 's' : ''} found</span>
        {(searchTerm || categoryFilter || statusFilter !== 'ALL') && (
          <button className="btn-agr btn-link very-small text-muted" onClick={() => { setSearchTerm(''); setCategoryFilter(''); setStatusFilter('ALL'); }}>
            Clear all filters ×
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="agr-card p-5 text-center">
          <Package size={64} className="text-muted mb-3 opacity-10" />
          <h3 className="h5 text-muted">No listings found</h3>
          <p className="text-muted mb-4 small">Try adjusting your filters or search terms.</p>
          {products.length === 0 && (
            <button className="btn-agr btn-primary" onClick={() => navigate('/farmer-dashboard/product/new')}>
              Create Your First Listing
            </button>
          )}
        </div>
      ) : (
        <div className="agr-card overflow-hidden">
          <div className="table-responsive">
            <table className="agr-table mb-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Farm</th>
                  <th>Price</th>
                  <th className="text-end">Stock</th>
                  <th>Quality</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="hover-bg-light">
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="product-thumb">
                          {p.image ? <img src={p.image} alt={p.title} className="w-100 h-100 object-cover" style={{ objectFit: 'cover' }} /> : <Package size={16} className="text-muted" />}
                        </div>
                        <div>
                          <div className="fw-bold small">{p.title}</div>
                          <PriceBadge comparison={p.official_price_comparison} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">{p.category_name || '—'}</span>
                    </td>
                    <td>
                      <span className="small text-muted">{p.farm_name || '—'}</span>
                    </td>
                    <td className="text-end">
                      <span className="fw-bold small">{p.price} DZD</span>
                      <span className="very-small text-muted d-block">/{p.unit}</span>
                    </td>
                    <td className={`text-end small ${p.stock < 10 ? 'text-danger fw-bold' : ''}`}>
                      {p.stock} {p.unit}
                      {p.stock < 10 && <AlertCircle size={12} className="ms-1" />}
                    </td>
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
                        {p.is_active ? <><CheckCircle size={10} className="me-1" />Published</> : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center text-muted very-small">
                        <Calendar size={11} className="me-1" />
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-1 justify-content-end">
                        <button
                          className={`btn-icon btn-sm ${p.is_active ? '' : 'text-success'}`}
                          title={p.is_active ? 'Hide Listing' : 'Publish Listing'}
                          onClick={() => toggleProductActive(p.id, p.is_active)}
                        >
                          {p.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button className="btn-icon btn-sm" title="Edit" onClick={() => navigate(`/farmer-dashboard/product/edit/${p.id}`)}>
                          <Edit3 size={15} />
                        </button>
                        <button className="btn-icon btn-sm text-danger" title="Delete" onClick={() => deleteProduct(p.id)}>
                          <Trash2 size={15} />
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
};

export default ProductList;
