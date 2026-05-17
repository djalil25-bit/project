import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ALGERIAN_WILAYAS } from '../../utils/constants';
import { WILAYA_DATA } from '../../utils/algeria_locations';
import api from '../../api/axiosConfig';
import { getLogisticsData, getWilayaCoords } from '../../utils/logistics_engine';
import {
  ShoppingCart,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  CreditCard,
  MapPin,
  CalendarDays,
  Smartphone,
  Info,
  Package,
  FileText,
  Building2,
  TrendingDown,
  TrendingUp,
  Activity,
  Phone,
  ArrowRight,
  Truck,
  Layers,
  Zap
} from 'lucide-react';

function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutWilaya, setCheckoutWilaya] = useState('');
  const [checkoutCommune, setCheckoutCommune] = useState('');
  const [checkoutPayment, setCheckoutPayment] = useState('cash_on_delivery');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [transportEstimate, setTransportEstimate] = useState(null);
  const [message, setMessage] = useState(null);

  const availableCommunes = React.useMemo(() => {
    if (!checkoutWilaya) return [];
    const wilayaObj = WILAYA_DATA.find(w => w.id === checkoutWilaya);
    return wilayaObj ? wilayaObj.communes : [];
  }, [checkoutWilaya]);

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
      await api.delete(`/cart/items/${productId}/`);
      await fetchCart();
      showMsg('success', 'Asset decommissioned from basket.');
    } catch (err) {
      showMsg('danger', 'Destruction protocol failed.');
    } finally { setCartLoading(false); }
  };

  const updateQuantity = async (productId, currentQty, delta, maxStock) => {
    const newQty = Math.round(Number(currentQty)) + delta;
    const maxStockNum = Number(maxStock);
    if (newQty < 1) return removeFromCart(productId);
    if (newQty > maxStockNum) {
      showMsg('danger', `Cannot exceed available stock (${maxStockNum}).`);
      return;
    }
    setCartLoading(true);
    try {
      const res = await api.patch(`/cart/items/${productId}/`, { quantity: newQty });
      setCart(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.quantity?.[0] || err.response?.data?.error || 'Adjustment protocol failed.';
      showMsg('danger', errorMsg);
    } finally { setCartLoading(false); }
  };

  const fetchTransportEstimate = async () => {
    if (!checkoutWilaya) {
      setTransportEstimate(null);
      return;
    }
    setEstimateLoading(true);
    try {
      // 1. Group items by farmer and prepare distances map
      const itemsByFarmer = {};
      cart.items.forEach(item => {
        const p = item.product_detail || {};
        if (p.farmer) {
          itemsByFarmer[p.farmer] = p;
        }
      });

      const destCoords = getWilayaCoords(checkoutWilaya);
      const distances = {};

      if (destCoords) {
        for (const [farmerId, p] of Object.entries(itemsByFarmer)) {
          const farmCoords = p.farm_latitude && p.farm_longitude 
            ? { lat: p.farm_latitude, lng: p.farm_longitude }
            : getWilayaCoords(p.farm_wilaya);
          
          if (farmCoords) {
            try {
              const logData = await getLogisticsData(farmCoords, destCoords);
              distances[farmerId] = parseFloat(logData.distance_km);
            } catch (e) {
              console.error("OSRM Error for farmer", farmerId, e);
            }
          }
        }
      }

      const res = await api.post('/orders/estimate_delivery/', {
        wilaya: checkoutWilaya,
        commune: checkoutCommune,
        distances: distances
      });
      setTransportEstimate(res.data);
    } catch (err) {
      console.error("Estimation failed:", err);
      setTransportEstimate(null);
    } finally {
      setEstimateLoading(false);
    }
  };

  useEffect(() => {
    if (showCheckout && checkoutWilaya) {
      const timer = setTimeout(() => {
        fetchTransportEstimate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [checkoutWilaya, checkoutCommune, cart?.items, showCheckout]);

  const handleCheckout = async () => {
    if (!checkoutAddress.trim()) { showMsg('danger', 'Global coordinates required.'); return; }
    if (!checkoutPhone.trim()) { showMsg('danger', 'Communication link required.'); return; }
    setCheckoutLoading(true);
    try {
      const res = await api.post('/orders/checkout/', {
        delivery_address: checkoutAddress,
        buyer_phone: checkoutPhone,
        wilaya: checkoutWilaya,
        commune: checkoutCommune,
        payment_method: checkoutPayment,
        notes: checkoutNotes,
        preferred_delivery_date: checkoutDate || null,
        distances: transportEstimate?.estimates?.reduce((acc, est) => {
           acc[est.farmer_id] = est.distance_km;
           return acc;
        }, {})
      });
      const orders = Array.isArray(res.data) ? res.data : [res.data];
      await fetchCart();
      setShowCheckout(false);
      showMsg('success', `Authorization successful. Redirecting to dispatch...`);
      setTimeout(() => navigate('/buyer-dashboard/orders'), 2000);
    } catch (err) {
      showMsg('danger', err.response?.data?.error || 'Checkout terminal error.');
    } finally { setCheckoutLoading(false); }
  };

  const cartItemCount = cart?.items?.length || 0;
  const cartTotal = cart?.total_price || 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
       <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
       <span className="text-[10px] font-black text-teal-900/40 uppercase tracking-[0.2em] animate-pulse">Scanning Payload Registry...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in relative z-0">
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-600 mb-5 bg-teal-50 px-3 py-1 rounded-full w-fit border border-teal-100 shadow-sm">
          <Link to="/buyer-dashboard" className="hover:text-teal-800 transition-colors">Marketplace</Link>
          <ChevronRight size={10} className="text-teal-300" />
          <span className="text-teal-900 flex items-center gap-1.5">
            <ShoppingCart size={11} /> Cart Procurement
          </span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-teal-600">
                <ShoppingCart size={22} strokeWidth={2.5} />
              </div>
              My Cart
            </h1>
            <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
              Validate your requisition assets and initialize the procurement protocol.
            </p>
          </div>
          <div className="text-right bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-100">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Payload</div>
             <div className="text-xl font-black text-slate-900">{cartItemCount} Items</div>
          </div>
        </div>

        {/* Alerts */}
        {message && (
          <div style={{ position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', background: message.type === 'success' ? '#065f46' : '#991b1b', color: '#fff', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease' }}>
             {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
             <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{message.text}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Main List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {cartItemCount === 0 ? (
              <div style={{ background: '#fff', borderRadius: '32px', padding: '5rem 3rem', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#f8fafc', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                  <ShoppingBag size={40} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>Registry is Empty</h3>
                <p style={{ color: '#64748b', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>Your digital procurement basket contains no assets. Visit the marketplace to initialize your acquisition.</p>
                <Link to="/buyer-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: '#0F766E', color: '#fff', padding: '1rem 2rem', borderRadius: '16px', fontWeight: 800, textDecoration: 'none', boxShadow: '0 10px 20px rgba(15,118,110,0.2)' }}>
                  Browse Marketplace <ArrowRight size={18} />
                </Link>
              </div>
            ) : (
              cart.items.map(item => {
                const p = item.product_detail || {};
                const price = parseFloat(p.price || 0);
                const subTotal = item.quantity * price;
                return (
                  <div key={item.id} style={{ background: '#fff', borderRadius: '24px', padding: '1.5rem', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '2rem', alignItems: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }} className="hover-lift">
                    <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: '#f8fafc', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                      {p.image ? (
                        <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}><Package size={40} /></div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                         <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.category_name}</span>
                         <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#fdf2f8', color: '#db2777', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Certified Vendor</span>
                      </div>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', margin: '0 0 0.5rem' }}>{p.productName || p.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Building2 size={14} /> {p.farm_name}</div>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{price.toLocaleString()} DZD / {p.unit}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                         <button onClick={() => updateQuantity(item.product, Number(item.quantity), -1, Number(p.stock))} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><Minus size={14} /></button>
                         <span style={{ width: '40px', textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>{Number(item.quantity)}</span>
                         <button onClick={() => updateQuantity(item.product, Number(item.quantity), 1, Number(p.stock))} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} disabled={Number(item.quantity) >= Number(p.stock)}><Plus size={14} /></button>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>{subTotal.toLocaleString()} <small style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>DZD</small></div>
                      <button onClick={() => removeFromCart(item.product)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}><Trash2 size={16} /> Remove</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Summary */}
          <div style={{ position: 'sticky', top: '2rem' }}>
            <div style={{ background: '#fff', borderRadius: '32px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Zap size={20} style={{ color: '#0F766E' }} /> Authorization Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Gross Asset Value</span>
                  <span style={{ fontWeight: 800, color: '#1e293b' }}>{cartTotal.toLocaleString()} DZD</span>
                </div>
                <div style={{ padding: '1rem', background: '#eab308', borderRadius: '16px', color: '#000', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.25rem', opacity: 0.8 }}>Institutional Transport Quote</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                      {estimateLoading ? (
                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Calculating...</span>
                      ) : transportEstimate ? `${transportEstimate.grand_total_transport.toLocaleString()}` : '0'}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>DZD</span>
                  </div>
                </div>
                {transportEstimate && !estimateLoading && (
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontSize: '0.65rem' }}>Route Breakdowns</div>
                    {transportEstimate.estimates.map((est, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontWeight: 600 }}>
                        <span style={{ color: '#64748b' }}>{est.farm_name}</span>
                        <span style={{ color: '#0F766E' }}>+{est.transport_fee.toLocaleString()} DZD</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#1e293b', fontWeight: 900, fontSize: '1.1rem' }}>Total Requisition</span>
                  <span style={{ fontWeight: 900, color: '#0F766E', fontSize: '1.5rem' }}>
                    {transportEstimate ? transportEstimate.grand_total.toLocaleString() : cartTotal.toLocaleString()} <small style={{ fontSize: '0.75rem', opacity: 0.6 }}>DZD</small>
                  </span>
                </div>
              </div>

              {!showCheckout ? (
                <button 
                  onClick={() => setShowCheckout(true)}
                  disabled={cartItemCount === 0}
                  style={{ width: '100%', background: '#0F766E', color: '#fff', padding: '1.25rem', borderRadius: '18px', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 10px 30px rgba(15,118,110,0.25)', transition: 'transform 0.2s' }}
                  className="hover-lift"
                >
                  Proceed to Terminal <ChevronRight size={20} />
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem', display: 'block' }}>Wilaya</label>
                        <select 
                          style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}
                          value={checkoutWilaya}
                          onChange={e => {
                            setCheckoutWilaya(e.target.value);
                            setCheckoutCommune('');
                          }}
                        >
                          <option value="">Select</option>
                          {ALGERIAN_WILAYAS.map(w => <option key={w.id} value={w.id}>{w.id} - {w.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem', display: 'block' }}>Commune</label>
                        <select 
                          style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}
                          value={checkoutCommune}
                          onChange={e => setCheckoutCommune(e.target.value)}
                          disabled={!checkoutWilaya}
                        >
                          <option value="">{checkoutWilaya ? 'Select Commune' : 'Pick Wilaya First'}</option>
                          {availableCommunes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                   </div>
                   <div className="form-group">
                      <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem', display: 'block' }}>Delivery Address</label>
                      <textarea 
                        style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 600, outline: 'none', resize: 'none', height: '100px' }}
                        placeholder="Detailed coordinates for dispatch..."
                        value={checkoutAddress}
                        onChange={e => setCheckoutAddress(e.target.value)}
                      />
                   </div>
                   <div className="form-group">
                      <label style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem', display: 'block' }}>Contact Link</label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                          style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}
                          type="tel" 
                          placeholder="Mobile Number" 
                          value={checkoutPhone} 
                          onChange={e => setCheckoutPhone(e.target.value)} 
                        />
                      </div>
                   </div>
                   
                   <div style={{ paddingTop: '1rem' }}>
                      <button 
                        onClick={handleCheckout}
                        disabled={checkoutLoading}
                        style={{ width: '100%', background: '#1e293b', color: '#fff', padding: '1.25rem', borderRadius: '18px', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 10px 30px rgba(30,41,59,0.2)' }}
                      >
                        {checkoutLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><ShieldCheck size={20} /> Authorize Order</>}
                      </button>
                      <button 
                        onClick={() => setShowCheckout(false)}
                        style={{ width: '100%', background: 'none', border: 'none', color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1rem', cursor: 'pointer' }}
                      >
                        <ChevronLeft size={12} style={{ marginBottom: '-2px' }} /> Return to Summary
                      </button>
                   </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: '#0F766E' }}><ShieldCheck size={24} /></div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>Official Protection</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Transactions supervised by the Ministry of Agriculture.</div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Styles for transitions */}
      <style>{`
        .hover-lift:hover {
          transform: translateY(-4px);
        }
        @keyframes slideIn {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default CartPage;
