import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MarketInsightsBar from '../../components/market/MarketInsightsBar';
import MarketPanel from '../../components/market/MarketPanel';
import api from '../../api/axiosConfig';
import {
  Search, User, CheckCircle, XCircle, Info,
  ShieldCheck, ShoppingCart, Package, ChevronRight,
  AlertCircle, Clock, Plus, X, Wheat, Tag, BarChart2, Eye,
  BadgeCheck, Heart, FileText, Truck, Sparkles, Building2,
  TrendingDown, TrendingUp, Minus, ListFilter, MapPin,
  ArrowRight, Layers, LayoutGrid, Zap, Star, Phone
} from 'lucide-react';

/* ─── Premium UI Elements ─────────────────────── */
const VerifiedBadge = ({ isVerified }) => {
  if (!isVerified) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#f0fdfa', color: '#0F766E', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      <ShieldCheck size={10} /> Verified
    </span>
  );
};

const QualityBadge = ({ quality }) => {
  const q = quality?.toUpperCase() || 'STANDARD';
  const styles = {
    PREMIUM: { bg: 'linear-gradient(135deg, #0F766E 0%, #7c3aed 100%)', color: '#fff', label: 'Premium Selection' },
    ORGANIC: { bg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', label: 'Certified Organic' },
    STANDARD: { bg: 'rgba(255,255,255,0.9)', color: '#1e293b', label: 'Standard Grade' },
    ECONOMY: { bg: '#f1f5f9', color: '#64748b', label: 'Economy Value' }
  };
  const s = styles[q] || styles.STANDARD;
  return (
    <span style={{ position: 'absolute', top: '12px', left: '12px', background: s.bg, color: s.color, padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, border: q === 'STANDARD' ? '1px solid #e2e8f0' : 'none', backdropFilter: 'blur(4px)' }}>
      {s.label}
    </span>
  );
};

const BenchmarkDisplay = ({ comparison, type = 'card' }) => {
  if (!comparison || !comparison.official_price) return null;
  const { status, difference_percentage, official_price, min_price, max_price } = comparison;

  if (type === 'modal') {
    return (
      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Official Benchmark</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{official_price.toLocaleString()} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>DZD/UNIT</span></div>
          </div>
          <div style={{ background: status === 'below' ? '#ecfdf5' : status === 'above' ? '#fff1f2' : '#f0fdf4', color: status === 'below' ? '#059669' : status === 'above' ? '#e11d48' : '#16a34a', padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {status === 'below' ? <TrendingDown size={14} /> : status === 'above' ? <TrendingUp size={14} /> : <Minus size={14} />}
            {status === 'below' ? `${difference_percentage}% Savings` : status === 'above' ? `${difference_percentage}% Premium` : 'Optimal'}
          </div>
        </div>

        {(min_price || max_price) && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Admin Regulatory Range</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: '4px', background: '#e2e8f0', borderRadius: '2px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>
                <span style={{ color: '#ef4444' }}>{min_price}</span>
                <span style={{ margin: '0 0.4rem', opacity: 0.3 }}>—</span>
                <span style={{ color: '#3b82f6' }}>{max_price}</span>
                <span style={{ fontSize: '0.6rem', marginLeft: '0.25rem', opacity: 0.6 }}>DZD</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>Ref: {official_price.toLocaleString()} DZD</span>
        {status === 'below' && <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>-{difference_percentage}%</span>}
      </div>
      {min_price && max_price && (
        <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#cbd5e1' }}>Range: {min_price}-{max_price}</span>
      )}
    </div>
  );
};

/* ─── Product Detail Modal ─────────────────────── */
function ProductSplitModal({ product, onClose, onAddToCart, cartLoading }) {
  const [qty, setQty] = useState(1);
  if (!product) return null;
  const p = product;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', padding: '1.5rem', animation: 'fadeIn 0.3s ease' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '32px', width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '400px 1fr', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }} onClick={e => e.stopPropagation()}>

        {/* Visual Pane */}
        <div style={{ background: '#f8fafc', padding: '3rem', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1.5px solid #f1f5f9' }}>
          <QualityBadge quality={p.quality} />
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {p.image ? (
              <img src={p.image} alt={p.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.1))' }} />
            ) : (
              <Package size={120} style={{ color: '#e2e8f0' }} />
            )}
          </div>
          <div style={{ width: '100%', marginTop: '2rem' }}>
            <BenchmarkDisplay comparison={p.official_price_comparison} type="modal" />
          </div>
        </div>

        {/* Content Pane */}
        <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>{p.category_name}</div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-1px', margin: 0, lineHeight: 1.1 }}>{p.title}</h2>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', color: '#94a3b8', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>{parseFloat(p.price).toLocaleString()}</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#94a3b8' }}>DZD / {p.unit}</span>
            </div>
            {p.official_price_comparison && p.official_price_comparison.min_price && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#14b8a6', background: '#f0fdfa', padding: '0.2rem 0.6rem', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Market Range</div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                  {p.official_price_comparison.min_price} <span style={{ opacity: 0.3 }}>—</span> {p.official_price_comparison.max_price} <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>DZD</span>
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Available Volume</div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1e293b' }}>{p.stock.toLocaleString()} {p.unit}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Producer & Origin</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f0fdfa', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>{p.farmer_name?.charAt(0)}</div>
                  <span>{p.farmer_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#64748b', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f0f9ff', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                    <MapPin size={10} /> {p.farm_wilaya || 'N/A'}
                  </div>
                  <a
                    href={`https://wa.me/${p.farmer_phone?.replace(/\D/g, '').startsWith('0') ? '213' + p.farmer_phone.replace(/\D/g, '').substring(1) : p.farmer_phone?.replace(/\D/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f0fdf4', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800, textDecoration: 'none' }}
                  >
                    <Phone size={10} /> {p.farmer_phone || 'N/A'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {p.description && (
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Harvest Details</div>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{p.description}"</p>
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '1.5rem', paddingTop: '2rem', borderTop: '1.5px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '16px', padding: '0.5rem' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: '36px', height: '36px', borderRadius: '12px', border: 'none', background: '#fff', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><Minus size={16} /></button>
              <span style={{ width: '50px', textAlign: 'center', fontWeight: 900, fontSize: '1.1rem' }}>{qty}</span>
              <button onClick={() => setQty(Math.min(p.stock, qty + 1))} style={{ width: '36px', height: '36px', borderRadius: '12px', border: 'none', background: '#fff', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} disabled={qty >= p.stock}><Plus size={16} /></button>
            </div>
            <button
              onClick={() => { onAddToCart(p.id, qty); onClose(); }}
              disabled={cartLoading || p.stock === 0}
              style={{ flex: 1, background: p.stock === 0 ? '#94a3b8' : '#0F766E', color: '#fff', padding: '1.25rem', borderRadius: '20px', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: p.stock === 0 ? 'none' : '0 10px 30px rgba(15,118,110,0.3)' }}
            >
              {p.stock === 0 ? 'Sold Out' : <><ShoppingCart size={20} /> Add to Requisition • {(parseFloat(p.price) * qty).toLocaleString()} DZD</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [showMarketPanel, setShowMarketPanel] = useState(false);

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
        if (o.status === 'CONFIRMED' || o.delivery_status === 'DELIVERED' || o.status === 'confirmed') {
          spent += parseFloat(o.total_price || 0);
        }
        if (o.delivery_status === 'IN_TRANSIT' || o.delivery_status === 'PICKED_UP') transit++;
      });
      setBuyerStats({ totalSpent: spent, inTransit: transit });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const addToCart = async (productId, qty = 1) => {
    setCartLoading(true);
    try {
      const res = await api.post('/cart/items/', { product: productId, quantity: qty });
      setCart(res.data);
      showMsg('success', 'Asset successfully synchronized to basket.');
    } catch (err) {
      showMsg('danger', 'Synchronization protocol failed.');
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
    } catch { showMsg('danger', 'Cloud state sync error.'); }
  };

  const cartItemCount = cart?.items?.length || 0;
  const filteredProducts = products.filter(p => {
    const titleMatch = p.title?.toLowerCase().includes(search.toLowerCase()) || false;
    const catMatch = p.category_name?.toLowerCase().includes(search.toLowerCase()) || false;
    return (titleMatch || catMatch) && (activeCategory === 'All' || p.category_name === activeCategory);
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
      <span className="text-[10px] font-black text-teal-900/40 uppercase tracking-[0.2em] animate-pulse">Initializing Marketplace Ledger...</span>
    </div>
  );

  return (
    <div className="buyer-page-wrapper bg-slate-50" style={{ minHeight: '100vh', padding: '0 0 2rem 0' }}>

      {/* ── MARKET INTELLIGENCE BAR ── */}
      <MarketInsightsBar onOpenPanel={() => setShowMarketPanel(true)} accentColor="#0F766E" />

      <div className="container" style={{ maxWidth: '1400px', paddingTop: '2rem' }}>

        {/* ── HERO BANNER (Institutional Blue Theme) ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f766e] via-[#115e59] to-[#134e4a] rounded-[1.5rem] shadow-[0_15px_40px_rgba(15,118,110,0.15)] text-white py-3 px-6 lg:px-8 border border-white/10 mb-8">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 900, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <ShieldCheck size={10} /> Institutional Marketplace
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Nodes: {products.length}</div>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: 0, lineHeight: 1.1 }}>National <span style={{ color: '#2dd4bf' }}>Commodity</span> Index</h1>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
              {/* Expenditure Card */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '0.6rem 1rem', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <TrendingUp size={16} style={{ color: '#2dd4bf' }} />
                <div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Expenditure</div>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#fff' }}>{buyerStats.totalSpent.toLocaleString()} <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>DZD</span></div>
                </div>
              </div>

              {/* In Transit Card */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '0.6rem 1rem', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Truck size={16} style={{ color: '#34d399' }} />
                <div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>In Transit</div>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#fff' }}>{buyerStats.inTransit} <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>LOGS</span></div>
                </div>
              </div>

              {/* Basket Card */}
              <Link to="/buyer/cart" style={{ background: '#0F766E', borderRadius: '16px', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s' }}>
                <div style={{ position: 'relative' }}>
                  <ShoppingCart size={18} />
                  {cartItemCount > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#f43f5e', color: '#fff', fontSize: '0.55rem', fontWeight: 900, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0F766E' }}>{cartItemCount}</span>}
                </div>
                <div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Basket</div>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{cartItemCount} Items</div>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Navigation (Sticky Controller) */}
        <div className="bg-slate-50 border-slate-200" style={{
          position: 'sticky',
          top: '72px',
          zIndex: 100,
          padding: '1rem 0',
          marginBottom: '1rem',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid'
        }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                className="bg-white border-slate-200 text-slate-900"
                style={{ width: '100%', padding: '1.25rem 1.25rem 1.25rem 3.5rem', borderRadius: '24px', borderWidth: '1.5px', borderStyle: 'solid', fontSize: '1rem', fontWeight: 600, outline: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}
                placeholder="Search by variety, producer, or region..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="bg-white border-slate-200 scrollbar-none" style={{ display: 'flex', gap: '0.75rem', padding: '0.4rem', borderRadius: '24px', borderWidth: '1.5px', borderStyle: 'solid', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflowX: 'auto', maxWidth: '700px' }}>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.name)}
                  className={activeCategory === c.name ? '' : 'text-slate-500'}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '18px', border: 'none', background: activeCategory === c.name ? '#0F766E' : 'transparent', color: activeCategory === c.name ? '#fff' : undefined, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Marketplace Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {filteredProducts.map((p, idx) => (
            <div
              key={p.id}
              style={{ borderRadius: '28px', borderWidth: '1.5px', borderStyle: 'solid', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'all 0.3s ease' }}
              className="hover-card bg-white border-slate-200"
            >
              {/* Product Visual */}
              <div className="bg-slate-50" style={{ height: '180px', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setSelectedProduct(p)}>
                {p.image ? (
                  <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} className="card-img" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}><Package size={50} /></div>
                )}
                <QualityBadge quality={p.quality} />
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(p); }}
                  className="bg-white"
                  style={{ position: 'absolute', top: '10px', right: '10px', width: '36px', height: '36px', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.is_favorite ? '#e11d48' : '#94a3b8', cursor: 'pointer', zIndex: 10 }}
                >
                  <Heart size={18} fill={p.is_favorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Product Info */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '1px' }}>{p.category_name}</span>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>{p.farm_name}</span>
                </div>
                <h4 className="text-slate-900" style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 0.5rem', lineHeight: 1.2, cursor: 'pointer' }} onClick={() => setSelectedProduct(p)}>{p.title}</h4>

                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span className="text-slate-900" style={{ fontSize: '1.3rem', fontWeight: 900 }}>{parseFloat(p.price).toLocaleString()}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>DZD / {p.unit}</span>
                  </div>
                  <BenchmarkDisplay comparison={p.official_price_comparison} />

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button
                      onClick={() => setSelectedProduct(p)}
                      className="bg-slate-50 text-slate-900 border-slate-200"
                      style={{ flex: 1, borderWidth: '1.5px', borderStyle: 'solid', borderRadius: '14px', padding: '0.75rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Analyze
                    </button>
                    <button
                      onClick={() => addToCart(p.id)}
                      disabled={cartLoading || p.stock === 0}
                      style={{ flex: 1, background: p.stock === 0 ? '#f1f5f9' : '#0F766E', color: p.stock === 0 ? '#94a3b8' : '#fff', border: 'none', borderRadius: '14px', padding: '0.75rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      {p.stock === 0 ? <><XCircle size={16} /> Sold</> : <><Plus size={16} /> Acquire</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '8rem 2rem', background: '#fff', borderRadius: '32px', border: '1.5px dashed #e2e8f0' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#f8fafc', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}><LayoutGrid size={40} /></div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>No Matches Identified</h3>
            <p style={{ color: '#64748b', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto' }}>Try adjusting your parameters or browse another category node.</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductSplitModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          cartLoading={cartLoading}
        />
      )}

      {/* Global Message */}
      {message && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, background: message.type === 'success' ? '#065f46' : '#991b1b', color: '#fff', padding: '1rem 2rem', borderRadius: '16px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideRight 0.3s ease' }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* ── MARKET INTELLIGENCE PANEL ── */}
      <MarketPanel isOpen={showMarketPanel} onClose={() => setShowMarketPanel(false)} accentColor="#0F766E" />

      <style>{`
        .hover-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 60px rgba(0,0,0,0.08);
          border-color: #0F766E !important;
        }
        .hover-card:hover .card-img {
          transform: scale(1.05);
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default BuyerDashboard;
