import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

const PriceBadge = ({ comparison }) => {
  if (!comparison) return null;
  const { status, difference_percentage } = comparison;
  if (status === 'equal') return <span className="price-badge price-equal">Fair Market Price</span>;
  const cls = status === 'below' ? 'price-below' : 'price-above';
  const label = status === 'below' ? `🔥 Best Value (-${difference_percentage}%)` : `+${difference_percentage}% Premium`;
  return <span className={`price-badge ${cls}`}>{label}</span>;
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
      showMsg('success', 'Item added to cart!');
    } catch (err) {
      showMsg('danger', err.response?.data?.error || 'Failed to add to cart.');
    } finally { setCartLoading(false); }
  };

  const removeFromCart = async (productId) => {
    setCartLoading(true);
    try {
      const res = await api.delete(`/cart/items/${productId}`);
      setCart(res.data);
      showMsg('success', 'Item removed from cart.');
    } catch { showMsg('danger', 'Failed to remove item.'); }
    finally { setCartLoading(false); }
  };

  const handleCheckout = async () => {
    if (!checkoutAddress.trim()) { showMsg('danger', 'Please enter a delivery address.'); return; }
    setCheckoutLoading(true);
    try {
      await api.post('/orders/checkout/', { delivery_address: checkoutAddress });
      setCheckoutAddress('');
      setShowCheckout(false);
      showMsg('success', '🎉 Order placed successfully! You can track it in your order history.');
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
    <div className="loading-wrapper" style={{ minHeight: '60vh' }}>
      <div className="spinner" /><span>Preparing the marketplace...</span>
    </div>
  );

  return (
    <div className="buyer-marketplace">
      <div className="page-header">
        <div>
          <h1 className="page-title">Direct Marketplace</h1>
          <p className="page-subtitle">Fresh produce from certified local farms delivered to your door.</p>
        </div>
        <div className="page-actions">
          <button className="btn-agr btn-outline" onClick={() => navigate('/buyer-dashboard/orders')}>📜 Order Tracking</button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} fade-in shadow-sm`}>
          <span className="me-2">{message.type === 'success' ? '✅' : '❌'}</span>
          {message.text}
        </div>
      )}

      <div className="marketplace-layout mt-4">
        {/* Main Content Area */}
        <div className="marketplace-main">
          {/* Filters & Search */}
          <div className="marketplace-filters agr-card p-3 mb-4">
            <div className="row g-3">
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-input search-input"
                  placeholder="🔍 Search for tomatoes, potatoes, etc..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-7">
                <div className="tab-pills m-0">
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

          <p className="text-muted small mb-3">{filteredProducts.length} premium products available</p>
          
          <div className="product-grid">
            {filteredProducts.map(p => (
              <div key={p.id} className="product-card premium-card">
                <div className="card-image-placeholder">
                   <span className="emoji-large">{['🍎','🍅','🥕','🥔','🍓','🥦','🌽'][Math.floor(Math.random()*7)]}</span>
                </div>
                <div className="product-card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="product-card-category">{p.category_name}</span>
                    <PriceBadge comparison={p.official_price_comparison} />
                  </div>
                  <h4 className="product-card-title">{p.title}</h4>
                  <p className="product-card-desc">{p.description || 'Verified fresh quality from local producer.'}</p>
                  
                  <div className="product-card-meta">
                    <span title="Stock availability">🛒 {p.stock} {p.unit}</span>
                    <span title="Farm source">🚜 {p.farm_name}</span>
                  </div>
                </div>
                <div className="product-card-footer">
                  <div className="price-tag">
                    <span className="h4 fw-bold mb-0">{p.price}</span>
                    <span className="small text-muted ms-1">DZD/{p.unit}</span>
                  </div>
                  <button
                    className="btn-agr btn-primary btn-sm rounded-pill px-3"
                    onClick={() => addToCart(p.id)}
                    disabled={cartLoading || p.stock === 0}
                  >
                    {p.stock === 0 ? 'Sold Out' : '+ Add'}
                  </button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-12 text-center py-5">
                <div className="h1 opacity-25">🥬</div>
                <h3 className="text-muted">No products found for this selection.</h3>
                <button className="btn btn-link" onClick={() => { setSearch(''); setActiveCategory('All'); }}>Clear all filters</button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Cart */}
        <div className="marketplace-sidebar">
          <div className="cart-panel sticky-top shadow-sm" style={{ top: '84px' }}>
            <div className="cart-header bg-primary text-white">
              <span>🛒 Shopping Basket</span>
              {cartItemCount > 0 && <span className="badge bg-white text-primary ms-auto">{cartItemCount}</span>}
            </div>

            <div className="cart-items" style={{ maxHeight: 'calc(100vh - 350px)' }}>
              {(!cart?.items || cart.items.length === 0) ? (
                <div className="text-center py-5 text-muted opacity-50">
                  <div className="h1 mb-3">🛍️</div>
                  <p>Your basket is currently empty.</p>
                </div>
              ) : cart.items.map(item => (
                <div key={item.id} className="cart-item border-bottom">
                  <div className="cart-item-info">
                    <div className="cart-item-name fw-bold">{item.product_detail?.title}</div>
                    <div className="cart-item-qty small text-muted">
                      {item.quantity} {item.product_detail?.unit} × {item.product_detail?.price} DZD
                    </div>
                  </div>
                  <div className="cart-item-price fw-bold">{(item.product_detail?.price * item.quantity).toFixed(0)}</div>
                  <button className="cart-item-remove ms-2" onClick={() => removeFromCart(item.product)}>×</button>
                </div>
              ))}
            </div>

            {cartItemCount > 0 && (
              <div className="cart-footer bg-light p-3">
                <div className="d-flex justify-content-between h5 fw-bold mb-3">
                  <span>Total Due</span>
                  <span className="text-primary">{cartTotal} DZD</span>
                </div>

                {!showCheckout ? (
                  <button className="btn-agr btn-primary w-100 py-2 fw-bold" onClick={() => setShowCheckout(true)}>
                    Proceed to Delivery →
                  </button>
                ) : (
                  <div className="checkout-form animate-slide-in">
                    <div className="form-group mb-3">
                      <label className="form-label small fw-bold">Delivery Destination</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        placeholder="House #, Street, City, Landmark..."
                        value={checkoutAddress}
                        onChange={e => setCheckoutAddress(e.target.value)}
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button
                        className="btn-agr btn-success"
                        onClick={handleCheckout}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? '...' : 'Place Order (Cash on Delivery)'}
                      </button>
                      <button className="btn-agr btn-outline btn-sm" onClick={() => setShowCheckout(false)}>Back to list</button>
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
