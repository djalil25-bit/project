import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  ShoppingCart,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart/');
      setCart(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCart(); }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const removeFromCart = async (productId) => {
    setCartLoading(true);
    try {
      // trailing slash is required - Django redirects without it and axios drops DELETE body
      await api.delete(`/cart/items/${productId}/`);
      // refetch fresh cart state instead of relying on response body
      await fetchCart();
      showMsg('success', 'Item removed.');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error removing item.';
      console.error('[CartPage] removeFromCart error:', err.response);
      showMsg('danger', msg);
    } finally { setCartLoading(false); }
  };

  const updateQuantity = async (productId, currentQty, delta) => {
    // Always work with clean integers to avoid floating-point precision errors
    const newQty = Math.round(currentQty) + delta;
    if (newQty < 1) return removeFromCart(productId);
    setCartLoading(true);
    try {
      const res = await api.patch(`/cart/items/${productId}/`, { quantity: newQty });
      setCart(res.data);
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.quantity?.[0] || errData?.error || errData?.detail || JSON.stringify(errData) || 'Failed to update quantity.';
      console.error('[CartPage] updateQuantity error:', err.response);
      showMsg('danger', msg);
    } finally { setCartLoading(false); }
  };

  const handleCheckout = async () => {
    if (!checkoutAddress.trim()) { showMsg('danger', 'Delivery address is required.'); return; }
    setCheckoutLoading(true);
    try {
      const res = await api.post('/orders/checkout/', { delivery_address: checkoutAddress });
      const orders = Array.isArray(res.data) ? res.data : [res.data];
      await fetchCart();
      setCheckoutAddress('');
      setShowCheckout(false);
      const msg = orders.length > 1
        ? `Order placed! ${orders.length} separate orders created (one per farmer). Redirecting...`
        : 'Order placed successfully! Redirecting...';
      showMsg('success', msg);
      setTimeout(() => navigate('/buyer-dashboard/orders'), 2000);
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.error || errData?.detail || JSON.stringify(errData) || 'Checkout failed.';
      console.error('[CartPage] handleCheckout error:', err.response?.data);
      showMsg('danger', msg);
    } finally { setCheckoutLoading(false); }
  };

  const cartItemCount = cart?.items?.length || 0;
  const cartTotal = cart?.total_price || 0;

  if (loading) return (
    <div className="flex-center py-5" style={{ minHeight: '60vh' }}>
      <div className="spinner-agr"></div>
      <span className="ms-3 text-muted">Retrieving your basket...</span>
    </div>
  );

  return (
    <div className="cart-page">
      <div className="agr-breadcrumb">
        <Link to="/buyer-dashboard">Marketplace</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>My Basket</span>
      </div>

      <div className="page-header mt-2">
        <h1 className="page-title d-flex align-items-center">
          <ShoppingCart size={24} className="me-3 text-primary" /> My Shopping Basket
        </h1>
        <p className="page-subtitle">Review your items and proceed to secure checkout.</p>
      </div>

      {message && (
        <div className={`alert-agr alert-agr-${message.type} animate-slide-in mb-4`}>
          <div className="d-flex align-items-center">
            {message.type === 'success' ? <CheckCircle size={18} className="me-2" /> : <AlertCircle size={18} className="me-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="agr-card p-0">
            <div className="cart-header bg-light text-dark p-3 d-flex align-items-center border-bottom">
               <ShieldCheck size={18} className="me-2 text-success" />
               <span className="fw-bold">Secured items</span>
               <span className="ms-auto text-muted small">{cartItemCount} items</span>
            </div>

            <div className="cart-items p-0">
              {(!cart?.items || cart.items.length === 0) ? (
                <div className="text-center py-5 text-muted">
                  <ShoppingBag size={64} className="mb-3 opacity-10" />
                  <h4 className="h5">Your basket is empty</h4>
                  <p className="small mb-4">Discover premium local produce in our marketplace.</p>
                  <button className="btn-agr btn-primary px-4" onClick={() => navigate('/buyer-dashboard')}>
                    Return to Marketplace
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table-agr table-hover">
                    <thead>
                       <tr>
                         <th>Product</th>
                         <th>Quantity</th>
                         <th>Price</th>
                         <th className="text-end">Total</th>
                         <th></th>
                       </tr>
                    </thead>
                    <tbody>
                      {cart.items.map(item => (
                        <tr key={item.id} className={cartLoading ? 'opacity-50' : ''}>
                          <td>
                            <div className="fw-bold text-dark">{item.product_detail?.title}</div>
                            <div className="very-small text-muted">{item.product_detail?.farm_name}</div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <button className="btn-icon btn-sm px-1 py-0" disabled={cartLoading} onClick={() => updateQuantity(item.product, item.quantity, -1)}><Minus size={14}/></button>
                              <span className="fw-bold text-dark px-2">{item.quantity}</span>
                              <button className="btn-icon btn-sm px-1 py-0" disabled={cartLoading} onClick={() => updateQuantity(item.product, item.quantity, 1)}><Plus size={14}/></button>
                            </div>
                          </td>
                          <td>
                            {(parseFloat(item.product_detail?.price) || 0).toFixed(0)} <span className="very-small">DZD</span>
                          </td>
                          <td className="text-end fw-bold text-primary">
                            {(parseFloat(item.product_detail?.price || 0) * item.quantity).toFixed(0)} <span className="very-small">DZD</span>
                          </td>
                          <td className="text-end">
                            <button className="btn-icon btn-sm text-danger border-0 mx-auto" disabled={cartLoading} onClick={() => removeFromCart(item.product)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {cartItemCount > 0 && (
            <div className="agr-card p-4 sticky-top-custom">
              <h3 className="h5 fw-bold border-bottom pb-3 mb-3">Order Summary</h3>
              
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Subtotal ({cartItemCount} items)</span>
                <span className="fw-bold">{cartTotal} DZD</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <span className="text-muted small">Delivery</span>
                <span className="very-small text-success fw-bold">Calculated later</span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center border-top pt-3 mb-4">
                <span className="fw-bold">Total amount</span>
                <span className="h3 fw-bold mb-0 text-primary">{cartTotal} <span className="h6">DZD</span></span>
              </div>

              {!showCheckout ? (
                <button className="btn-agr btn-primary w-100 py-3 fw-bold rounded-lg d-flex justify-content-center align-items-center" onClick={() => setShowCheckout(true)}>
                  Proceed to Checkout <ChevronRight size={18} className="ms-2" />
                </button>
              ) : (
                <div className="checkout-form animate-slide-in bg-light-soft p-3 rounded-lg border">
                  <div className="mb-3">
                    <label className="small fw-bold text-uppercase text-muted mb-2 d-block">Delivery Destination *</label>
                    <textarea
                      className="form-control-agr"
                      rows="3"
                      placeholder="Enter full address details (Street, City, Postal Code)..."
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
  );
}

export default CartPage;
