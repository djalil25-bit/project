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
  Trash2,
  Plus,
  Minus
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
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
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

  const removeFromCart = async (productId) => {
    setCartLoading(true);
    try {
      const res = await api.delete(`/cart/items/${productId}`);
      setCart(res.data);
      showMsg('success', 'Item removed.');
    } catch { showMsg('danger', 'Error removing item.'); }
    finally { setCartLoading(false); }
  };

  const handleCheckout = async () => {
    if (!checkoutAddress.trim()) { showMsg('danger', 'Delivery address is required.'); return; }
    setCheckoutLoading(true);
    try {
      await api.post('/orders/checkout/', { delivery_address: checkoutAddress });
      setCheckoutAddress('');
      setShowCheckout(false);
      showMsg('success', 'Order placed successfully! Track it in your history.');
      fetchData();
    } catch (err) {
      showMsg('danger', err.response?.data?.error || 'Checkout failed.');
    } finally { setCheckoutLoading(false); }
  };

  const cartItemCount = cart?.items?.length || 0;
  const cartTotal = cart?.total_price || 0;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.category_name?.toLowerCase().includes(search.toLowerCase());
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

      <div className="marketplace-layout mt-2">
        {/* Main Content Area */}
        <div className="marketplace-main">
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
                <div className="tab-pills m-0 overflow-auto">
                  {categories.map(cat => (
                    <button 
                      key={cat.id} 
                      className={`tab-pill ${activeCategory === cat.name ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat.name)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
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

        {/* Sidebar Cart */}
        <div className="marketplace-sidebar">
          <div className="cart-panel sticky-top shadow-md" style={{ top: '84px', borderRadius: '16px' }}>
            <div className="cart-header bg-dark text-white p-3 d-flex align-items-center">
              <ShoppingCart size={18} className="me-2" /> 
              <span className="fw-bold">My Shopping Basket</span>
              {cartItemCount > 0 && <span className="ms-auto badge-agr badge-primary">{cartItemCount} items</span>}
            </div>

            <div className="cart-items" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              {(!cart?.items || cart.items.length === 0) ? (
                <div className="text-center py-5 text-muted">
                  <ShoppingBag size={48} className="mb-3 opacity-10" />
                  <p className="small mb-0">Your basket is empty</p>
                </div>
              ) : cart.items.map(item => (
                <div key={item.id} className="cart-item p-3 border-bottom d-flex align-items-center">
                  <div className="cart-item-info flex-grow-1">
                    <div className="cart-item-name fw-bold">{item.product_detail?.title}</div>
                    <div className="cart-item-qty very-small text-muted">
                      {item.quantity} {item.product_detail?.unit} × {item.product_detail?.price} DZD
                    </div>
                  </div>
                  <div className="cart-item-price fw-bold text-dark px-2">
                    {(item.product_detail?.price * item.quantity).toFixed(0)}
                  </div>
                  <button className="btn-icon btn-sm text-danger border-0" onClick={() => removeFromCart(item.product)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {cartItemCount > 0 && (
              <div className="cart-footer p-3 bg-light">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted small">Total amount</span>
                  <span className="h4 fw-bold mb-0 text-primary">{cartTotal} DZD</span>
                </div>

                {!showCheckout ? (
                  <button className="btn-agr btn-primary w-100 py-3 fw-bold rounded-lg" onClick={() => setShowCheckout(true)}>
                    Proceed to Delivery <ChevronRight size={18} className="ms-1" />
                  </button>
                ) : (
                  <div className="checkout-form animate-slide-in">
                    <div className="mb-3">
                      <label className="very-small fw-bold text-uppercase text-muted mb-2 d-block">Delivery Destination</label>
                      <textarea
                        className="form-control-agr"
                        rows="3"
                        placeholder="Detailed address for courier..."
                        value={checkoutAddress}
                        onChange={e => setCheckoutAddress(e.target.value)}
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button
                        className="btn-agr btn-success py-2 fw-bold"
                        onClick={handleCheckout}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? 'Processing...' : 'Confirm & Place Order'}
                      </button>
                      <button className="btn-agr btn-link btn-sm text-muted" onClick={() => setShowCheckout(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuyerDashboard;
