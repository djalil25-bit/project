import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Plus, 
  Package, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Layers,
  ChevronRight,
  MoreVertical,
  AlertCircle
} from 'lucide-react';

const PriceBadge = ({ comparison }) => {
  if (!comparison) return null;
  const { status, difference_percentage } = comparison;
  const cls = status === 'above' ? 'price-above' : status === 'below' ? 'price-below' : 'price-equal';
  const label = status === 'above' ? `+${difference_percentage}%` : status === 'below' ? `-${difference_percentage}%` : 'Fair Price';
  return <span className={`price-badge ${cls}`} title={`vs Official Price`}>{label}</span>;
};

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/?my_products=true');
      setProducts(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleProductActive = async (id, currentStatus) => {
    try {
      await api.patch(`/products/${id}/`, { is_active: !currentStatus });
      fetchProducts();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        await api.delete(`/products/${id}/`);
        fetchProducts();
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.category_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || 
                         (filter === 'ACTIVE' && p.is_active) || 
                         (filter === 'INACTIVE' && !p.is_active);
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="flex-center py-5">
      <div className="spinner-agr"></div>
      <span className="ms-3 text-muted">Loading your products...</span>
    </div>
  );

  return (
    <div className="product-list-page">
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>My Products</span>
      </div>

      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title">Product Management</h1>
          <p className="page-subtitle text-muted">Manage your marketplace listings, stock, and visibility.</p>
        </div>
        <button 
          className="btn-agr btn-primary d-flex align-items-center" 
          onClick={() => navigate('/farmer-dashboard/product/new')}
        >
          <Plus size={18} className="me-2" /> Add New Product
        </button>
      </div>

      {/* Filters */}
      <div className="agr-card p-3 mb-4 sticky-top-custom">
        <div className="row g-3 align-items-center">
          <div className="col-lg-5">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search products by name or category..." 
                className="form-control-agr ps-5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-lg-7">
            <div className="d-flex gap-2 justify-content-lg-end">
              {['ALL', 'ACTIVE', 'INACTIVE'].map(f => (
                <button 
                  key={f}
                  className={`btn-agr btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="agr-card p-5 text-center">
          <Package size={64} className="text-muted mb-4 opacity-10" />
          <h3 className="h5 text-muted">No products found</h3>
          <p className="text-muted mb-4">Try adjusting your filters or search terms.</p>
          {products.length === 0 && (
            <button className="btn-agr btn-primary" onClick={() => navigate('/farmer-dashboard/product/new')}>
              Create Your First Listing
            </button>
          )}
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map(p => (
            <div key={p.id} className="product-card-premium">
              <div className="product-card-image">
                {p.image ? (
                  <img src={p.image} alt={p.title} />
                ) : (
                  <div className="placeholder-image"><Package size={40} className="opacity-25" /></div>
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
                  <button 
                    className="btn-action btn-action-secondary" 
                    title="Edit" 
                    onClick={() => navigate(`/farmer-dashboard/product/edit/${p.id}`)}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    className="btn-action btn-action-danger" 
                    title="Delete" 
                    onClick={() => deleteProduct(p.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
