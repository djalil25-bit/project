import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Search, User, CheckCircle, XCircle, Info,
  ShieldCheck, ShoppingCart, Package, ChevronRight,
  AlertCircle, Clock, Plus, X, Wheat, Tag, BarChart2, Eye,
  BadgeCheck, Heart, FileText, Truck, Sparkles, Building2,
  TrendingDown, TrendingUp, Minus, ListFilter, MapPin
} from 'lucide-react';

/* ─── Premium E-Commerce Badges ─────────────────────── */
const VerifiedBadge = ({ isVerified }) => {
  if (!isVerified) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-black uppercase tracking-widest border border-indigo-200 shadow-sm">
      <ShieldCheck size={12} /> Verified
    </span>
  );
};

const QualityBadge = ({ quality }) => {
  const q = quality?.toUpperCase() || 'MEDIUM';
  if (q === 'HIGH') return <span className="absolute top-3 left-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 border border-white/20 z-10"><Sparkles size={12} /> Premium</span>;
  if (q === 'LOW') return <span className="absolute top-3 left-3 bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1 border border-slate-200 z-10"><Info size={12} /> Value</span>;
  return <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1 border border-slate-200 z-10"><CheckCircle size={12} className="text-indigo-600"/> Std</span>;
};

const BenchmarkDisplay = ({ comparison, type = 'card' }) => {
  if (!comparison || !comparison.official_price) return null;
  const { status, difference_percentage, official_price } = comparison;
  
  if (type === 'modal') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-inner">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1"><Building2 size={14}/> Official Benchmark</div>
          <div className="text-lg font-black text-slate-800">{official_price.toLocaleString()} <span className="text-xs">DZD/KG</span></div>
        </div>
        {status === 'below' && (
           <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-black"><TrendingDown size={14}/> {difference_percentage}% Value</div>
        )}
        {status === 'above' && (
           <div className="flex items-center gap-1 bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-black"><TrendingUp size={14}/> {difference_percentage}% Premium</div>
        )}
        {status === 'equal' && (
           <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-black"><Minus size={14}/> Targeted</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-[10px] font-bold text-slate-400">Target: {official_price.toLocaleString()} DZD</span>
      {status === 'below' && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded ml-1 tracking-widest uppercase">-{difference_percentage}%</span>}
    </div>
  );
};

/* ─── Split-Layout Product Detail Modal ─────────────────────── */
function ProductSplitModal({ product, onClose, onAddToCart, cartLoading }) {
  const [qty, setQty] = useState(1);
  if (!product) return null;
  const p = product;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row transform transition-all animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full md:w-5/12 bg-slate-50 relative flex flex-col items-center justify-center p-8 min-h-[300px] md:min-h-[500px] border-r border-slate-100">
          <QualityBadge quality={p.quality} />
          {p.image ? (
            <img src={p.image} alt={p.title} className="w-full h-full object-contain drop-shadow-xl max-h-[350px]" />
          ) : (
             <Package size={100} className="text-slate-200" />
          )}
          <div className="absolute bottom-6 w-full px-6">
             <BenchmarkDisplay comparison={p.official_price_comparison} type="modal" />
          </div>
        </div>

        <div className="w-full md:w-7/12 p-8 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2 bg-indigo-50 px-2 py-1 rounded inline-block">{p.category_name}</div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{p.title}</h2>
            </div>
            <button className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors shrink-0" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="flex items-baseline gap-2 mb-6 border-b border-slate-100 pb-6">
            <span className="text-5xl font-black text-slate-900 tracking-tighter">{parseFloat(p.price).toLocaleString()}</span>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">DZD / {p.unit}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs uppercase font-black tracking-widest text-slate-400 mb-1">Available Stock</div>
              <div className="font-extrabold text-slate-800 text-base flex items-center gap-2"><BarChart2 size={16} className="text-indigo-500"/> {parseFloat(p.stock || 0).toLocaleString()} {p.unit}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs uppercase font-black tracking-widest text-slate-400 mb-1">Origin Node</div>
              <div className="font-extrabold text-slate-800 text-base flex items-center gap-2 truncate" title={p.farm_name}><Wheat size={16} className="text-amber-500"/> {p.farm_name}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6 pt-4 border-t border-slate-100">
             <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-xl shadow-inner shrink-0">
               {p.farmer_name?.charAt(0) || 'F'}
             </div>
             <div>
                <div className="font-bold text-base text-slate-900 leading-tight">{p.farmer_name}</div>
                <VerifiedBadge isVerified={p.farmer_is_verified} />
             </div>
          </div>

          {p.description && (
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-auto overflow-y-auto max-h-32 pr-2 border-l-2 border-indigo-100 pl-4">{p.description}</p>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4">
             <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-14 overflow-hidden shadow-inner">
               <button className="w-12 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors" onClick={() => setQty(Math.max(1, qty - 1))} disabled={p.stock === 0}><Minus size={16}/></button>
               <div className="w-14 h-full flex items-center justify-center font-black text-lg text-slate-900 bg-white border-x border-slate-100">{qty}</div>
               <button className="w-12 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors" onClick={() => setQty(Math.min(p.stock, qty + 1))} disabled={p.stock === 0}><Plus size={16}/></button>
             </div>
              <button
               className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:shadow-[0_8px_25px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
               onClick={() => { onAddToCart(p.id, qty); onClose(); }}
               disabled={cartLoading || p.stock === 0}
             >
               {p.stock === 0 ? <><XCircle size={18} /> Sold Out</> : <><ShoppingCart size={18} /> Add {(parseFloat(p.price) * qty).toLocaleString()} DZD</>}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Buyer Marketplace Dashboard ─────────────────────── */
function BuyerDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [buyerStats, setBuyerStats] = useState({ totalSpent: 0, inTransit: 0 });
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [showCategories, setShowCategories] = useState(false);
  const categoryRef = useRef(null);

  const fetchData = async () => {
    try {
      const [prodRes, cartRes, catRes, orderRes] = await Promise.all([
        api.get('/products/'),
        api.get('/cart/'),
        api.get('/categories/'),
        api.get('/orders/')
      ]);
      setProducts(prodRes.data.results || prodRes.data);
      setCart(cartRes.data);
      setCategories([{ id: 'All', name: 'All' }, ...(catRes.data.results || catRes.data)]);
      
      const ords = orderRes.data.results || orderRes.data;
      let spent = 0;
      let transit = 0;
      ords.forEach(o => {
        if(o.status === 'CONFIRMED' || o.delivery_status === 'DELIVERED' || o.status === 'confirmed') {
           spent += parseFloat(o.total_price || 0);
        }
        if(o.delivery_status === 'IN_TRANSIT' || o.delivery_status === 'PICKED_UP') transit++;
      });
      setBuyerStats({ totalSpent: spent, inTransit: transit });

    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategories(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const addToCart = async (productId, qty = 1) => {
    setCartLoading(true);
    try {
      const res = await api.post('/cart/items/', { product: productId, quantity: qty });
      setCart(res.data);
      showMsg('success', 'Cart successfully appended.');
    } catch (err) {
      showMsg('danger', err.response?.data?.error || 'Failed to update constraints.');
    } finally { setCartLoading(false); }
  };

  const toggleFavorite = async (p) => {
    const isFav = p.is_favorite;
    try {
      if (isFav) {
        await api.delete('/favorites/remove/', { data: { product: p.id } });
      } else {
        await api.post('/favorites/', { product: p.id });
      }
      setProducts(products.map(item => item.id === p.id ? { ...item, is_favorite: !isFav } : item));
    } catch { showMsg('danger', 'Error syncing state.'); }
  };

  const cartItemCount = cart?.items?.length || 0;

  const filteredProducts = products.filter(p => {
    const titleMatch = p.title?.toLowerCase().includes(search.toLowerCase()) || false;
    const catMatch   = p.category_name?.toLowerCase().includes(search.toLowerCase()) || false;
    return (titleMatch || catMatch) && (activeCategory === 'All' || p.category_name === activeCategory);
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-white">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
      <span className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading Index...</span>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in relative z-0 bg-slate-50/30 min-h-screen">

      {/* ── ALERTS ──────────────────────── */}
      {message && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-black tracking-widest uppercase animate-slide-in ${message.type === 'success' ? 'bg-slate-900 text-emerald-400 shadow-emerald-900/20' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
           <span className="flex items-center gap-2">
             {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
             {message.text}
           </span>
        </div>
      )}

      {/* ── HIGH-DENSITY HERO HEADER ─────────────────────────────── */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between px-6 py-4 md:px-10 md:py-5 relative border border-slate-800 isolate">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 to-transparent pointer-events-none" />
        <div className="z-10 flex flex-col">
          <div className="flex items-center gap-2 text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">
            <ShieldCheck size={12} /> Marketplace Curation Node
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
            Asset Index
          </h1>
        </div>
        <div className="z-10 mt-3 md:mt-0 flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 py-2.5 font-black text-[10px] uppercase tracking-widest border border-slate-700 transition flex items-center justify-center gap-2" onClick={() => navigate('/buyer-dashboard/orders')}>
             <Truck size={14} className="text-indigo-400" /> Dispatches
          </button>
          <button className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 border border-indigo-500/50" onClick={() => navigate('/buyer/cart')}>
             <ShoppingCart size={14} /> Checkout {cartItemCount > 0 && <span className="bg-white text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-black tracking-normal leading-none">{cartItemCount}</span>}
          </button>
        </div>
      </div>

      {/* ── UNIFORM KPI METRICS (RESOLVING OVERFLOWS & PURE TAILWIND) ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Procured Volume', 
            value: (
              <span className="truncate block overflow-hidden">
                {buyerStats.totalSpent.toLocaleString()} <span className="text-[0.6em] text-white/60 font-medium">DZD</span>
              </span>
            ), 
            icon: <FileText size={20}/>
          },
          { 
            label: 'Active Transit', 
            value: (
              <span className="truncate block overflow-hidden">
                {buyerStats.inTransit} <span className="text-[0.6em] text-white/60 font-medium">Nodes</span>
              </span>
            ), 
            icon: <Truck size={20}/>
          },
          { 
            label: 'Global Assets', 
            value: (
              <span className="truncate block overflow-hidden">
                {products.length} <span className="text-[0.6em] text-white/60 font-medium">Indices</span>
              </span>
            ), 
            icon: <Package size={20}/>
          },
          { 
            label: 'Starred Nodes', 
            value: (
              <span className="truncate block overflow-hidden">
                {products.filter(p => p.is_favorite).length} <span className="text-[0.6em] text-white/60 font-medium">Favs</span>
              </span>
            ), 
            icon: <Heart size={20}/>
          },
        ].map((k, i) => (
          <div key={i} className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 shadow-lg shadow-indigo-950/10 flex items-center gap-4 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl border border-white/10 group">
             <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                {k.icon && React.cloneElement(k.icon, { size: 100 })}
             </div>
             <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/10">
                {k.icon}
             </div>
             <div className="min-w-0 flex-1 relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5 text-indigo-100/70">{k.label}</div>
                <div className="text-[clamp(1rem,2.5vw,1.6rem)] font-black tracking-tight leading-tight truncate text-white">{k.value}</div>
             </div>
          </div>
        ))}
      </div>

      {/* ── SLEEK ACTION BAR (SEARCH & CLICK-TO-TOGGLE CATEGORIES) ──────────────────── */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-2 flex items-center gap-3 sticky top-4 z-40">
        <div className="relative flex-1">
           <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
           <input
              type="text"
              placeholder="Query Marketplace Index..."
              className="w-full pl-14 pr-4 py-4 bg-slate-50/50 hover:bg-white border-none rounded-2xl text-sm font-black text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:shadow-indigo-100 transition-all uppercase tracking-widest"
              value={search} onChange={e => setSearch(e.target.value)}
           />
        </div>
        
        <div className="relative" ref={categoryRef}>
           <button 
             className={`h-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${showCategories ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'}`}
             onClick={() => setShowCategories(!showCategories)}
           >
             <ListFilter size={16} className={showCategories ? 'animate-pulse' : ''} />
             <span className="hidden sm:inline">{activeCategory === 'All' ? 'Parameters' : activeCategory}</span>
           </button>

           {/* Category Dropdown (Professional Search Bar Integration) */}
           {showCategories && (
             <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)] rounded-[2rem] overflow-hidden animate-slide-in flex flex-col z-50">
                <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 font-black text-[9px] uppercase tracking-[0.3em] text-slate-400">
                  Refine Acquisition Vector
                </div>
                <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto">
                  <button
                    className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-between ${activeCategory === 'All' ? 'bg-slate-900 text-indigo-400 shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                    onClick={() => { setActiveCategory('All'); setShowCategories(false); }}
                  >
                    All Available Assets
                    {activeCategory === 'All' && <CheckCircle size={14} />}
                  </button>
                  <div className="h-px bg-slate-100 mx-3 my-1" />
                  {categories.filter(c => c.name !== 'All').map(c => (
                    <button
                      key={c.id}
                      className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-between ${activeCategory === c.name ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                      onClick={() => { setActiveCategory(c.name); setShowCategories(false); }}
                    >
                      {c.name}
                      {activeCategory === c.name && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                    </button>
                  ))}
                </div>
             </div>
           )}
        </div>
      </div>

      {/* ── SQUARE COMPONENT ARCHITECTURE (STITCH UI OVERRIDE) ──────────────── */}
      <div className="pt-2">
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
           {filteredProducts.map((p, idx) => (
             <div 
               key={p.id} 
               className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 flex flex-col animate-fade-in"
               style={{ animationDelay: `${idx * 40}ms` }}
             >
               {/* 1. Square Foundation: Image Section */}
               <div className="relative w-full aspect-square overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(p)}>
                  {p.image
                    ? <img src={p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    : <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><Package size={48} /></div>
                  }
                  <QualityBadge quality={p.quality} />
                  
                  {/* Action Overlay */}
                  <div className="absolute top-3 right-3 z-10">
                     <button
                       className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm ${p.is_favorite ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:scale-110'}`}
                       onClick={e => { e.stopPropagation(); toggleFavorite(p); }}
                     >
                       <Heart size={18} fill={p.is_favorite ? 'currentColor' : 'none'} strokeWidth={2.5} />
                     </button>
                  </div>
               </div>
               
               {/* 2. Typography & Information Polish */}
               <div className="flex flex-col flex-1 p-5">
                  <h4 className="text-lg font-bold text-slate-900 truncate mb-1 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setSelectedProduct(p)}>
                     {p.title}
                  </h4>
                  
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium mb-3">
                    <MapPin size={14} className="text-indigo-500" />
                    <span className="truncate">{p.farm_name || 'Algeria'}</span>
                  </div>

                  <div className="text-2xl font-extrabold text-indigo-600 mb-2">
                     {parseFloat(p.price).toLocaleString()} <span className="text-xs font-bold text-slate-400">DZD/{p.unit}</span>
                  </div>

                  <BenchmarkDisplay comparison={p.official_price_comparison} type="card" />

                  {/* 3. The Dual-Action Button Row */}
                  <div className="flex items-center gap-3 mt-4 w-full">
                     <button
                       className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm text-center cursor-pointer flex items-center justify-center gap-2"
                       onClick={() => setSelectedProduct(p)}
                     >
                       <Eye size={16} /> View
                     </button>
                     <button
                       className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 text-sm text-center cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                       onClick={() => addToCart(p.id)}
                       disabled={cartLoading || p.stock === 0}
                     >
                       {p.stock === 0 ? <XCircle size={16} /> : <Plus size={16} />}
                       {p.stock === 0 ? 'Empty' : 'Add'}
                     </button>
                  </div>
               </div>
             </div>
           ))}

           {filteredProducts.length === 0 && (
             <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-[2.5rem] p-16 text-center shadow-sm">
               <Search size={48} className="text-slate-300 mx-auto mb-4" />
               <h4 className="text-xl font-black text-slate-800 mb-2">No assets available</h4>
               <p className="text-sm font-medium text-slate-500 mb-6 max-w-sm mx-auto">Zero results match your filters. Adjust category or search node.</p>
               <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95" onClick={() => { setSearch(''); setActiveCategory('All'); }}>
                 Reset Dashboard Search
               </button>
             </div>
           )}
         </div>
      </div>

      {selectedProduct && (
        <ProductSplitModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          cartLoading={cartLoading}
        />
      )}
    </div>
  );
}

export default BuyerDashboard;
