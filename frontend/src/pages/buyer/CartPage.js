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
  Activity
} from 'lucide-react';

function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutWilaya, setCheckoutWilaya] = useState('');
  const [checkoutPayment, setCheckoutPayment] = useState('cash_on_delivery');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  
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
      await api.delete(`/cart/items/${productId}/`);
      await fetchCart();
      showMsg('success', 'Asset decommissioned from basket.');
    } catch (err) {
      showMsg('danger', 'Destruction protocol failed.');
    } finally { setCartLoading(false); }
  };

  const updateQuantity = async (productId, currentQty, delta) => {
    const newQty = Math.round(currentQty) + delta;
    if (newQty < 1) return removeFromCart(productId);
    setCartLoading(true);
    try {
      const res = await api.patch(`/cart/items/${productId}/`, { quantity: newQty });
      setCart(res.data);
    } catch (err) {
      showMsg('danger', 'Adjustment protocol failed.');
    } finally { setCartLoading(false); }
  };

  const handleCheckout = async () => {
    if (!checkoutAddress.trim()) { showMsg('danger', 'Global coordinates required.'); return; }
    if (!checkoutPhone.trim()) { showMsg('danger', 'Communication link required.'); return; }
    setCheckoutLoading(true);
    try {
      const res = await api.post('/orders/checkout/', {
        delivery_address: checkoutAddress,
        buyer_phone: checkoutPhone,
        wilaya: checkoutWilaya,
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
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4 bg-indigo-50 px-3 py-1 rounded-full w-fit border border-indigo-100 shadow-sm">
            <Link to="/buyer-dashboard" className="hover:text-indigo-800 transition-colors">Marketplace</Link>
            <ChevronRight size={10} className="text-indigo-300" />
            <span className="text-indigo-900 font-black">Procurement Terminal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-indigo-600">
               <ShoppingCart size={40} strokeWidth={2.5} />
            </div>
            My Payload
          </h1>
          <p className="text-slate-500 font-medium mt-3 leading-relaxed max-w-xl text-lg">
            Finalize asset acquisition and routing parameters before authorizing the dispatch protocol.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
           <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
              <Package size={28} />
           </div>
           <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Assets</div>
              <div className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{cartItemCount} Indices</div>
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
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
             <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] text-slate-500">
                   <ShieldCheck size={16} className="text-indigo-600" /> Secure Asset List
                </div>
                {cartItemCount > 0 && (
                   <div className="text-[10px] font-black text-indigo-600 bg-white px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm uppercase tracking-widest">
                      {cartTotal.toLocaleString()} DZD Total
                   </div>
                )}
             </div>

             {cartItemCount === 0 ? (
               <div className="p-20 text-center flex flex-col items-center justify-center">
                 <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200 shadow-inner">
                   <ShoppingBag size={48} />
                 </div>
                 <h4 className="text-2xl font-black text-slate-800 mb-2">Registry Negative</h4>
                 <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">
                   Zero assets identified for procurement. Re-engage the market index to source produce.
                 </p>
                 <button 
                   className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/10 active:scale-95"
                   onClick={() => navigate('/buyer-dashboard')}
                 >
                   Re-Engage Market
                 </button>
               </div>
             ) : (
               <div className="divide-y divide-slate-50">
                 {cart.items.map(item => {
                   const p = item.product_detail || {};
                   const price = parseFloat(p.price || 0);
                   const subTotal = item.quantity * price;
                   return (
                     <div key={item.id} className={`p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 transition-all hover:bg-slate-50/50 group ${cartLoading ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                        
                        {/* Asset Identity */}
                        <div className="w-28 h-28 bg-white rounded-3xl overflow-hidden shadow-md border-2 border-white group-hover:border-indigo-100 transition-all flex shrink-0">
                           {p.image ? (
                             <img src={p.image} alt={p.productName || p.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                           ) : (
                             <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><Package size={40} /></div>
                           )}
                        </div>

                        <div className="flex-1 min-w-0 text-center md:text-left space-y-1">
                           <div className="flex flex-col md:flex-row md:items-center gap-2">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded w-fit mx-auto md:mx-0 border border-indigo-100">{p.category_name}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 justify-center md:justify-start">
                                 <Building2 size={12}/> {p.farm_name}
                              </span>
                           </div>
                           <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{p.productName || p.title}</h4>
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{price.toLocaleString()} DZD / {p.unit} Base</div>
                        </div>

                        {/* Interactive Logic */}
                        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full md:w-auto">
                           
                           {/* Premium Volume Controller */}
                           <div className="flex items-center bg-white border-2 border-slate-100 rounded-2xl shadow-sm h-14 p-1 group-hover:border-indigo-100 transition-all">
                              <button className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" onClick={() => updateQuantity(item.product, item.quantity, -1)}><Minus size={16}/></button>
                              <div className="w-14 h-full flex items-center justify-center font-mono font-black text-lg text-slate-900">{item.quantity}</div>
                              <button className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" onClick={() => updateQuantity(item.product, item.quantity, 1)}><Plus size={16}/></button>
                           </div>

                           <div className="flex flex-col items-center md:items-end w-32">
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Valuation</div>
                              <div className="font-black text-indigo-600 text-xl tracking-tighter">{subTotal.toLocaleString()} <span className="text-[10px]">DZD</span></div>
                           </div>

                           <button 
                             className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-200 hover:text-white hover:bg-rose-600 border border-slate-100 hover:border-rose-600 transition-all hover:shadow-lg active:scale-90"
                             onClick={() => removeFromCart(item.product)}
                           >
                             <Trash2 size={20} />
                           </button>
                        </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        </div>

        {/* RIGHT: Terminal Authorization */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
           {cartItemCount > 0 && (
             <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden border border-slate-800">
                {/* Decorative Grid Overlay */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                
                <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
                   <FileText size={24} className="text-indigo-500"/> Dispatch Sum
                </h3>

                <div className="space-y-6 mb-10 relative z-10">
                   <div className="flex justify-between items-center group">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset Volume</span>
                      <div className="flex items-center gap-2">
                         <div className="h-px w-12 bg-slate-800" />
                         <span className="font-mono font-black text-sm text-white">{cartItemCount} Nodes</span>
                      </div>
                   </div>
                   <div className="flex justify-between items-center group">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fulfillment Mode</span>
                      <span className="font-bold text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">Standard Rail</span>
                   </div>
                   <div className="flex justify-between items-end pt-8 border-t border-slate-800">
                      <div>
                         <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Total Valuation</div>
                         <div className="text-4xl font-black text-white tracking-tighter">{cartTotal.toLocaleString()} <span className="text-sm font-medium text-slate-500 italic">DZD</span></div>
                      </div>
                      <Activity size={32} className="text-indigo-500/50 mb-1" />
                   </div>
                </div>

                {!showCheckout ? (
                  <button 
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-900/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 relative z-10 border border-indigo-500/30"
                    onClick={() => setShowCheckout(true)}
                  >
                    Initiate Authorization <ChevronRight size={18} />
                  </button>
                ) : (
                  <div className="space-y-6 relative z-10 animate-fade-in">
                     <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700/50 space-y-6">
                        <div>
                           <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block flex items-center gap-2"><MapPin size={12}/> Global Coordinates</label>
                           <textarea className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-600 resize-none h-20" 
                             placeholder="Secure delivery address trace..."
                             value={checkoutAddress} onChange={e => setCheckoutAddress(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-600" type="text"
                                placeholder="Wilaya" value={checkoutWilaya} onChange={e => setCheckoutWilaya(e.target.value)} />
                           </div>
                           <div>
                              <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-600" type="tel"
                                placeholder="Comms Link" value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} />
                           </div>
                        </div>
                        <div className="pt-2">
                           <button
                             className="w-full bg-white hover:bg-slate-50 text-slate-900 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all shadow-white/5 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                             onClick={handleCheckout}
                             disabled={checkoutLoading}
                           >
                             {checkoutLoading ? <><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Authorizing...</> : <><ShieldCheck size={18} /> Seal Protocol</>}
                           </button>
                        </div>
                     </div>
                     <button className="w-full text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]" onClick={() => setShowCheckout(false)}>
                        Abort Authorization
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
