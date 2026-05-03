import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ALGERIAN_WILAYAS } from '../../utils/constants';
import api from '../../api/axiosConfig';
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
  Phone
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
    const newQty = Math.round(currentQty) + delta;
    if (newQty < 1) return removeFromCart(productId);
    if (newQty > maxStock) {
      showMsg('danger', `Cannot exceed available stock (${maxStock}).`);
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
      const res = await api.post('/orders/estimate_delivery/', {
        wilaya: checkoutWilaya,
        commune: checkoutCommune
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
       <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
       <span className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Scanning Payload...</span>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-10 animate-fade-in relative z-0 bg-slate-50/30 min-h-screen">
      
      {/* ── BREADCRUMBS & HEADER ───────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 bg-indigo-50 px-3 py-1 rounded-full w-fit border border-indigo-100 shadow-sm">
            <Link to="/buyer-dashboard" className="hover:text-indigo-800 transition-colors">Marketplace</Link>
            <ChevronRight size={10} className="text-indigo-300" />
            <span className="text-indigo-900 font-black">My Cart</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-600">
               <ShoppingCart size={22} strokeWidth={2.5} />
            </div>
            My Cart
          </h1>
          <p className="text-slate-500 font-medium mt-2 max-w-xl text-sm">
            Review your items and complete your order.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
           <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
              <Package size={20} />
           </div>
           <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Items</div>
              <div className="text-lg font-black text-slate-900 leading-none">{cartItemCount}</div>
           </div>
        </div>
      </div>

      {/* ── ALERTS ──────────────────────── */}
      {message && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-black tracking-widest uppercase animate-slide-in ${message.type === 'success' ? 'bg-slate-900 text-emerald-400 border border-emerald-500/20' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
           {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
           <span>{message.text}</span>
        </div>
      )}

      {/* ── MAIN LOGISTICS GRID ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LEFT: Payload Registry */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-slate-500">
                   <ShieldCheck size={14} className="text-indigo-600" /> Cart Items
                </div>
                {cartItemCount > 0 && (
                   <div className="text-[10px] font-black text-indigo-600 bg-white px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
                      {cartTotal.toLocaleString()} DZD
                   </div>
                )}
             </div>

             {cartItemCount === 0 ? (
               <div className="p-12 text-center flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-5 text-slate-300 shadow-inner">
                   <ShoppingBag size={32} />
                 </div>
                 <h4 className="text-lg font-black text-slate-800 mb-2">Your cart is empty</h4>
                 <p className="text-slate-500 font-medium mb-6 max-w-sm mx-auto text-sm">
                   Browse the marketplace and add products to your cart.
                 </p>
                 <button
                   className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                   onClick={() => navigate('/buyer-dashboard')}
                 >
                   Browse Products
                 </button>
               </div>
             ) : (
               <div className="divide-y divide-slate-50">
                 {cart.items.map(item => {
                   const p = item.product_detail || {};
                   const price = parseFloat(p.price || 0);
                   const subTotal = item.quantity * price;
                   return (
                      <div key={item.id} className={`p-6 grid grid-cols-1 md:grid-cols-12 items-center gap-8 transition-all hover:bg-slate-50 group border-b border-slate-100 last:border-0 ${cartLoading ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                         
                         {/* Product Image & Info Column */}
                         <div className="md:col-span-7 flex flex-row items-center gap-6">
                            {/* Image Box */}
                            <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 group-hover:border-indigo-300 transition-colors flex shrink-0">
                               {p.image ? (
                                 <img src={p.image} alt={p.productName || p.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                               ) : (
                                 <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><Package size={32} /></div>
                               )}
                            </div>

                            {/* Info Block */}
                            <div className="flex flex-col justify-center py-1">
                               <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2" title={p.productName || p.title || 'Unknown Product'}>
                                  {p.productName || p.title || 'Unknown Product'}
                               </h4>
                               
                               <div className="flex flex-col gap-1.5 mb-2.5">
                                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                                     <Building2 size={14} className="text-indigo-400 shrink-0"/> 
                                     <span>{p.farm_name || 'AgriGov Vendor'}</span>
                                  </div>
                                  <div className="flex items-center">
                                     <span className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 leading-none">
                                        {p.category_name || 'Item'}
                                     </span>
                                  </div>
                               </div>

                               <div className="text-sm font-black text-slate-800">
                                  {price.toLocaleString()} <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">DZD/{p.unit}</span>
                               </div>
                            </div>
                         </div>

                         {/* Actions & Metrics Column */}
                         <div className="md:col-span-5 flex flex-row items-center justify-between md:justify-end gap-6 bg-slate-50/50 md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none">
                            
                            {/* Distinct Quantity Stepper */}
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm h-12 p-1.5 shrink-0 w-[130px] justify-between group-hover:border-indigo-300 transition-colors">
                               <button 
                                 className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400" 
                                 onClick={() => updateQuantity(item.product, Number(item.quantity), -1, Number(p.stock))}
                               >
                                 <Minus size={16} strokeWidth={2.5}/>
                               </button>
                               <div className="flex-1 flex items-center justify-center font-mono font-black text-base text-slate-900 bg-slate-50/50 rounded-md mx-1 select-none h-full">{item.quantity}</div>
                               <button 
                                 className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400" 
                                 onClick={() => updateQuantity(item.product, Number(item.quantity), 1, Number(p.stock))}
                                 disabled={Number(item.quantity) >= Number(p.stock)}
                               >
                                 <Plus size={16} strokeWidth={2.5}/>
                               </button>
                            </div>

                            <div className="flex items-center gap-6 shrink-0">
                               {/* Value Subtotal */}
                               <div className="flex flex-col items-end w-28 text-right">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Subtotal</div>
                                  <div className="font-black text-slate-900 text-sm">{subTotal.toLocaleString()} <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">DZD</span></div>
                               </div>

                               {/* Delete Action Wrapper */}
                               <button 
                                 className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 bg-white hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all shadow-sm hover:shadow active:scale-95 shrink-0"
                                 onClick={() => removeFromCart(item.product)}
                                 title="Remove Product"
                               >
                                 <Trash2 size={18} />
                               </button>
                            </div>
                         </div>
                      </div>
                   );
                 })}
               </div>
             )}
          </div>
        </div>

        {/* RIGHT: Terminal Authorization */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
           {cartItemCount > 0 && (
             <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200">
                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                   <FileText size={18} className="text-indigo-600"/> Order Summary
                </h3>

                 <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                       <span className="text-xs font-semibold text-slate-500">Items</span>
                       <span className="font-bold text-slate-900 text-sm">{cartItemCount}</span>
                    </div>
                    
                    <div className="flex justify-between items-center group border-b border-slate-100 pb-4">
                       <span className="text-xs font-bold text-slate-500">Subtotal</span>
                       <span className="font-bold text-slate-900">{cartTotal.toLocaleString()} DZD</span>
                    </div>

                    <div className="group border-b border-slate-100 pb-4">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-500">Transport Fee</span>
                          <span className={`${estimateLoading ? 'animate-pulse text-indigo-400' : 'font-bold text-indigo-600'}`}>
                             {estimateLoading ? 'Estimating...' : transportEstimate ? `${transportEstimate.grand_total_transport.toLocaleString()} DZD` : '---'}
                          </span>
                       </div>
                       {transportEstimate && !estimateLoading && (
                          <div className="flex flex-col gap-1 mt-2">
                             {transportEstimate.estimates.map((est, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[9px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                   <span className="text-slate-400 font-bold uppercase truncate max-w-[120px]">{est.farm_name}</span>
                                   <span className="text-indigo-600 font-black">{est.transport_fee.toLocaleString()} DZD</span>
                                </div>
                             ))}
                             <div className="mt-1 text-[9px] font-medium text-slate-400 px-1 italic">
                                * Calculated per farmer origin
                             </div>
                          </div>
                       )}
                    </div>

                    <div className="flex justify-between items-end pt-3">
                       <div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</div>
                          <div className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                             {estimateLoading ? '---' : (transportEstimate ? transportEstimate.grand_total.toLocaleString() : cartTotal.toLocaleString())}
                             <span className="text-xs font-bold text-slate-400 uppercase ml-1">DZD</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {!showCheckout ? (
                   <button 
                     className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center justify-center gap-3"
                     onClick={() => setShowCheckout(true)}
                   >
                     Proceed to Checkout <ChevronRight size={16} />
                   </button>
                 ) : (
                   <div className="space-y-6 animate-slide-in">
                      <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200 space-y-5 shadow-inner">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-2">
                                  <MapPin size={14} className="text-indigo-500" /> Wilaya
                               </label>
                               <select 
                                 className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" 
                                 value={checkoutWilaya} 
                                 onChange={e => setCheckoutWilaya(e.target.value)}
                               >
                                 <option value="">Select Region</option>
                                 {ALGERIAN_WILAYAS.map(w => (
                                    <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
                                 ))}
                               </select>
                            </div>
                            <div>
                               <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-2">
                                  <Building2 size={14} className="text-indigo-500" /> Commune
                               </label>
                               <input 
                                 className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm placeholder-slate-300"
                                 type="text"
                                 placeholder="e.g. Bir Mourad Raïs"
                                 value={checkoutCommune}
                                 onChange={e => setCheckoutCommune(e.target.value)}
                               />
                            </div>
                         </div>

                        <div>
                           <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-2">
                              <FileText size={14} className="text-indigo-500" /> Detailed Address & Location
                           </label>
                           <textarea 
                             className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 resize-none h-28 shadow-sm leading-relaxed" 
                             placeholder="Enter strict delivery details, building number, street name, and any specific landmarks..."
                             value={checkoutAddress} 
                             onChange={e => setCheckoutAddress(e.target.value)} 
                           />
                        </div>
                        
                        <div>
                           <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-2">
                              <Phone size={14} className="text-indigo-500" /> Contact Number
                           </label>
                           <input 
                             className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm placeholder-slate-400" 
                             type="tel"
                             placeholder="e.g. 0555 12 34 56" 
                             value={checkoutPhone} 
                             onChange={e => setCheckoutPhone(e.target.value)} 
                           />
                        </div>
                        
                        <div className="pt-3">
                           <button
                             className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-900/30 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                             onClick={handleCheckout}
                             disabled={checkoutLoading}
                           >
                             {checkoutLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</> : <><ShieldCheck size={18} /> Confirm Order</>}
                           </button>
                        </div>
                     </div>
                     <button className="w-full text-slate-400 hover:text-slate-600 transition-colors text-[10px] font-black uppercase tracking-widest p-2" onClick={() => setShowCheckout(false)}>
                        <ChevronLeft size={12} className="inline mr-1 mb-0.5" /> Back to Summary
                     </button>
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
