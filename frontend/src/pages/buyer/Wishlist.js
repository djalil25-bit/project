import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Heart, 
  ShoppingBag, 
  ChevronRight, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Package, 
  Wheat, 
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Eye,
  ShieldCheck
} from 'lucide-react';

const Wishlist = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites/');
      setFavorites(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch favorites", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const removeFavorite = async (productId) => {
    try {
      await api.delete('/favorites/remove/', { data: { product: productId } });
      setFavorites(favorites.filter(f => f.product !== productId));
      showMsg('success', 'Asset removed from curation.');
    } catch (err) {
      showMsg('danger', 'Failed to remove favorite.');
    }
  };

  const addToCart = async (productId) => {
    setCartLoading(true);
    try {
      await api.post('/cart/items/', { product: productId, quantity: 1 });
      showMsg('success', 'Asset appended to payload!');
    } catch (err) {
      showMsg('danger', err.response?.data?.error || 'Registry update failed.');
    } finally {
      setCartLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
       <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
       <span className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing Curation...</span>
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
            <span className="text-indigo-900 font-black">Curated Crate</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-rose-500">
               <Heart size={40} fill="currentColor" strokeWidth={2.5} />
            </div>
            My Wishlist
          </h1>
          <p className="text-slate-500 font-medium mt-3 leading-relaxed max-w-xl text-lg">
            High-fidelity curation of premium produce for future acquisition and procurement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 transition-all shadow-sm active:scale-95 flex items-center gap-2"
            onClick={() => navigate('/buyer-dashboard')}
          >
            <ChevronLeft size={16} /> Market Index
          </button>
          <button 
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/10 active:scale-95 flex items-center gap-2 border border-indigo-500/50"
            onClick={() => navigate('/buyer/cart')}
          >
            <ShoppingCart size={18} /> View Payload
          </button>
        </div>
      </div>

      {/* ── ALERTS ──────────────────────── */}
      {message && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-black tracking-widest uppercase animate-slide-in ${message.type === 'success' ? 'bg-slate-900 text-emerald-400 border border-emerald-500/20' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
           {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
           <span>{message.text}</span>
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-20 text-center flex flex-col items-center justify-center shadow-sm max-w-4xl mx-auto">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-300 shadow-inner">
            <Heart size={48} />
          </div>
          <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Curation Node Empty</h3>
          <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto leading-relaxed">
            Begin sourcing your premium produce and star your favorites to build your acquisition portfolio.
          </p>
          <button 
            className="bg-slate-900 hover:bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            onClick={() => navigate('/buyer-dashboard')}
          >
            Explore Market Index
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {favorites.map(fav => {
            const p = fav.product_detail;
            if (!p) return null;
            return (
              <div 
                key={fav.id} 
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200"
              >
                {/* 1. Square Foundation: Image Section */}
                <div className="relative w-full aspect-square overflow-hidden bg-slate-50">
                   {p.image ? (
                     <img src={p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={48} /></div>
                   )}
                   <button 
                     className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-rose-500 shadow-sm hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110 active:scale-90"
                     onClick={() => removeFavorite(p.id)}
                     title="Remove asset"
                   >
                     <Heart size={18} fill="currentColor" strokeWidth={2.5} />
                   </button>
                   <div className="absolute top-3 left-3 flex gap-1">
                      <span className="bg-white/90 backdrop-blur-md text-slate-800 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-200">{p.category_name}</span>
                   </div>
                </div>

                {/* 2. Text & Typography Polish */}
                <div className="flex flex-col flex-1 p-5">
                   <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                      {p.title}
                   </h4>
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Wheat size={12} className="text-amber-500" /> {p.farm_name}
                   </div>

                   <div className="mt-auto">
                      <div className="text-xl font-extrabold text-slate-900 mb-4">
                         {parseFloat(p.price).toLocaleString()} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DZD/{p.unit}</span>
                      </div>

                      <div className="flex items-center gap-2">
                         <button
                           className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                           onClick={() => addToCart(p.id)}
                           disabled={cartLoading || p.stock <= 0}
                         >
                           {p.stock <= 0 ? (
                             <><AlertCircle size={14} /> Sold Out</>
                           ) : (
                             <><Plus size={14} /> Add</>
                           )}
                         </button>
                         <button
                           className="w-12 h-12 bg-slate-50 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all border border-slate-100 flex items-center justify-center active:scale-90"
                           title="Decommit Asset"
                           onClick={() => removeFavorite(p.id)}
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
