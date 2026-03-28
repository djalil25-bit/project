import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Search, 
  ShoppingBag, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle, 
  Info, 
  ShieldCheck, 
  ShoppingCart, 
  Package, 
  ChevronRight,
  TrendingDown,
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react';

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
    case 'HIGH': return <span className="quality-badge high"><ShieldCheck size={12} className="me-1" /> High Quality</span>;
    case 'MEDIUM': return <span className="quality-badge medium"><CheckCircle size={12} className="me-1" /> Medium</span>;
    case 'LOW': return <span className="quality-badge low"><Info size={12} className="me-1" /> Standard</span>;
    default: return null;
  }
};

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



  const cartItemCount = cart?.items?.length || 0;

  const filteredProducts = products.filter(p => {
    const titleMatch = p.title?.toLowerCase().includes(search.toLowerCase()) || false;
    const catMatch = p.category_name?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchesSearch = titleMatch || catMatch;
    const matchesCategory = activeCategory === 'All' || p.category_name === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="flex-center py-5" style={{ minHeight: '60vh' }}>
      <div className="spinner-agr"></div>
      <span className="ms-3 text-muted">Opening Marketplace...</span>
    </div>
  );

  return (
    <div className="buyer-marketplace">
      <div className="page-header">
        <div>
          <h1 className="page-title">Direct Marketplace</h1>
          <p className="page-subtitle">Premium local produce sourced direct from certified farms.</p>
        </div>
        <div className="page-actions">
          <button className="btn-agr btn-primary me-2 fw-bold" onClick={() => navigate('/buyer/cart')}>
            <ShoppingCart size={16} className="me-2" /> My Basket {cartItemCount > 0 && `(${cartItemCount})`}
          </button>
          <button className="btn-agr btn-outline" onClick={() => navigate('/buyer-dashboard/orders')}>
            <Clock size={16} className="me-2" /> Order History
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert-agr alert-agr-${message.type} animate-slide-in mb-4`}>
          <div className="d-flex align-items-center">
            {message.type === 'success' ? <CheckCircle size={18} className="me-2" /> : <AlertCircle size={18} className="me-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div>
          {/* Filters & Search */}
          <div className="agr-card p-3 mb-4 sticky-top-custom">
            <div className="row g-3 align-items-center">
              <div className="col-lg-5">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    className="form-control-agr ps-5"
                    placeholder="Search fresh produce..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-lg-7">
                <select 
                  className="form-control-agr form-select form-input w-100"
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
             <span className="text-muted small fw-medium">{filteredProducts.length} premium listings available</span>
             <div className="d-flex gap-2">
                <span className="very-small text-muted d-flex align-items-center"><CheckCircle size={10} className="me-1 text-success"/> Verified Sellers</span>
                <span className="very-small text-muted d-flex align-items-center"><ShieldCheck size={10} className="me-1 text-primary"/> Quality Guaranteed</span>
             </div>
          </div>
          
          <div className="product-grid">
            {filteredProducts.map(p => (
              <div key={p.id} className="product-card-premium">
                <div className="product-card-image">
                  {p.image ? (
                    <img src={p.image} alt={p.title} />
                  ) : (
                    <div className="placeholder-image"><Package size={32} /></div>
                  )}
                  <QualityBadge quality={p.quality} />
                </div>
                <div className="product-card-body">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h4 className="product-title">{p.title}</h4>
                    <span className="category-tag">{p.category_name}</span>
                  </div>
                  
                  <div className="product-price-row mb-2">
                    <span className="price">{p.price} DZD</span>
                    <span className="unit">/{p.unit}</span>
                    <PriceBadge comparison={p.official_price_comparison} />
                  </div>

                  <div className="farmer-info mb-3 d-flex align-items-center">
                    <div className="avatar-xs-circle me-2">{p.farm_name?.charAt(0)}</div>
                    <span className="very-small text-muted">From <span className="fw-bold">{p.farm_name}</span></span>
                  </div>
                  
                  <div className="product-actions mt-auto d-flex gap-2">
                    <button
                      className="btn-agr btn-primary flex-fill btn-sm fw-bold"
                      onClick={() => addToCart(p.id)}
                      disabled={cartLoading || p.stock === 0}
                    >
                      {p.stock === 0 ? <><XCircle size={16} className="me-1"/> Sold Out</> : <><Plus size={16} className="me-1"/> Add to Basket</>}
                    </button>
                    <button className="btn-icon btn-sm" title="View Details">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="agr-card p-5 text-center w-100">
                <Search size={48} className="text-muted mb-3 opacity-25" />
                <h4 className="h5 text-muted">No products matched your search</h4>
                <p className="small text-muted mb-0">Try different keywords or browse other categories.</p>
                <button className="btn-agr btn-link mt-2" onClick={() => { setSearch(''); setActiveCategory('All'); }}>Clear filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuyerDashboard;
