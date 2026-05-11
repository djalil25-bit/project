import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Search, Filter, BarChart2, Clock, AlertTriangle, Activity } from 'lucide-react';
import api from '../../api/axiosConfig';

const TREND = {
  INCREASING: { icon: TrendingUp, color: '#059669', bg: '#ecfdf5', label: 'Increasing', sym: '↑' },
  DECREASING: { icon: TrendingDown, color: '#dc2626', bg: '#fef2f2', label: 'Decreasing', sym: '↓' },
  STABLE: { icon: Minus, color: '#6366f1', bg: '#eef2ff', label: 'Stable', sym: '→' },
};

function MiniChart({ history }) {
  if (!history || history.length < 2) return null;
  const pts = history.slice(0, 8).reverse();
  const vals = pts.map(h => parseFloat(h.price));
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const w = 120, h = 40, pad = 4;
  const points = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const up = vals[vals.length - 1] >= vals[0];
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={up ? '#059669' : '#dc2626'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {vals.map((v, i) => {
        const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r={i === vals.length - 1 ? 3 : 1.5} fill={up ? '#059669' : '#dc2626'} />;
      })}
    </svg>
  );
}

export default function MarketPanel({ isOpen, onClose, accentColor = '#059669' }) {
  const [prices, setPrices] = useState([]);
  const [categories, setCategories] = useState(['ALL']);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    
    Promise.all([
      api.get('/catalog-products/'),
      api.get('/categories/')
    ]).then(([prodRes, catRes]) => {
      const fetchedCats = (catRes.data.results || catRes.data || []).map(c => c.name.toUpperCase());
      setCategories(['ALL', ...fetchedCats]);

      const products = (prodRes.data.results || prodRes.data || []).filter(p => p.ref_price);
      const mappedPrices = products.map((p) => {
        return {
          id: p.id,
          product_name: p.name,
          category: p.category_name || 'OTHER',
          category_display: p.category_name || 'Other',
          current_price: p.ref_price,
          min_price: p.min_price,
          max_price: p.max_price,
          unit: p.unit || 'kg',
          trend: p.trend || 'STABLE',
          price_change_percentage: p.price_change_percentage || 0,
          market_note: p.description || '—',
          updated_at: p.updated_at || new Date().toISOString(),
          is_highlighted: false, // Remove false data alerts
        };
      });
      setPrices(mappedPrices);
    }).catch(console.error).finally(() => setLoading(false));
  }, [isOpen]);

  const fetchHistory = async (product) => {
    try {
      const res = await api.get(`/catalog-products/${product.id}/`);
      setSelectedProduct({ ...product, history: [] }); 
    } catch {
      setSelectedProduct({ ...product, history: [] });
    }
  };

  if (!isOpen) return null;

  const filtered = prices.filter(p => {
    const matchSearch = p.product_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'ALL' || (p.category_display && p.category_display.toUpperCase() === catFilter);
    return matchSearch && matchCat;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', padding: '5vh 1rem 1rem 1rem', animation: 'fadeIn 0.25s ease' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '28px', width: '100%', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.3)', animation: 'scaleUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(135deg, ${accentColor}08, transparent)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 16px ${accentColor}30` }}>
              <BarChart2 size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>Official Market Prices</h2>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>National Agricultural Price Index • {prices.length} Products</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
        </div>

        {/* Filters */}
        <div style={{ padding: '1rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." style={{ width: '100%', padding: '0.65rem 0.65rem 0.65rem 2.25rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 600, outline: 'none', background: '#f8fafc' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '0.45rem 0.85rem', borderRadius: '10px', border: 'none', background: catFilter === c ? accentColor : '#f1f5f9', color: catFilter === c ? '#fff' : '#64748b', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
              {c === 'ALL' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
            </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: accentColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Loading Market Data...</span>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
                  {['Product', 'Category', 'Price', 'Unit', 'Trend', 'Change', 'Note', 'Updated'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', textAlign: h === 'Price' || h === 'Change' ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const tc = TREND[p.trend] || TREND.STABLE;
                  const Icon = tc.icon;
                  return (
                    <tr key={p.id} onClick={() => fetchHistory(p)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {p.is_highlighted && <AlertTriangle size={12} color="#d97706" />}
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{p.product_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '6px', textTransform: 'capitalize' }}>{p.category_display}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem', color: '#0f172a' }}>
                          {p.min_price && p.max_price ? (
                            <>
                              <span style={{ color: '#059669' }}>{parseFloat(p.min_price)}</span>
                              <span style={{ color: '#94a3b8', margin: '0 3px', fontSize: '0.65rem', fontWeight: 600 }}>-</span>
                              <span style={{ color: '#dc2626' }}>{parseFloat(p.max_price)}</span>
                            </>
                          ) : (
                            parseFloat(p.current_price).toLocaleString()
                          )}
                        </span>
                        <span style={{ fontSize: '0.5rem', fontWeight: 700, color: '#94a3b8', marginLeft: '0.2rem' }}>DA</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>/{p.unit}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: tc.bg, color: tc.color, padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>
                          <Icon size={12} /> {tc.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {p.price_change_percentage !== 0 ? (
                          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: p.price_change_percentage > 0 ? '#059669' : '#dc2626' }}>
                            {p.price_change_percentage > 0 ? '+' : ''}{p.price_change_percentage}%
                          </span>
                        ) : <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '180px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{p.market_note || '—'}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={10} /> {new Date(p.updated_at).toLocaleDateString('en-GB')}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
              <BarChart2 size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>No market data found</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Analytics Sub-Modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedProduct(null)}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', animation: 'scaleUp 0.25s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>{selectedProduct.category_display}</div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{selectedProduct.product_name}</h3>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Current Price</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedProduct.min_price && selectedProduct.max_price ? (
                    <>
                      <span style={{ color: '#059669' }}>{parseFloat(selectedProduct.min_price)}</span>
                      <span style={{ color: '#94a3b8', margin: '0 5px', fontSize: '0.8rem', fontWeight: 600 }}>-</span>
                      <span style={{ color: '#dc2626' }}>{parseFloat(selectedProduct.max_price)}</span>
                    </>
                  ) : (
                    parseFloat(selectedProduct.current_price).toLocaleString()
                  )}
                  <span style={{ fontSize: '0.55rem', color: '#94a3b8', marginLeft: '0.25rem', fontWeight: 700 }}>DA/{selectedProduct.unit}</span>
                </div>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Trend</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: TREND[selectedProduct.trend]?.bg, color: TREND[selectedProduct.trend]?.color, padding: '0.4rem 0.8rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem' }}>
                    {React.createElement(TREND[selectedProduct.trend]?.icon || Minus, { size: 16 })}
                    {TREND[selectedProduct.trend]?.label}
                  </span>
                  {selectedProduct.price_change_percentage !== 0 && (
                    <span style={{ fontWeight: 900, fontSize: '0.9rem', color: selectedProduct.price_change_percentage > 0 ? '#059669' : '#dc2626' }}>{selectedProduct.price_change_percentage > 0 ? '+' : ''}{selectedProduct.price_change_percentage}%</span>
                  )}
                </div>
              </div>
            </div>

            {/* Price History Chart */}
            {selectedProduct.history && selectedProduct.history.length > 1 && (
              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.25rem', border: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Activity size={12} /> Price Evolution
                </div>
                <MiniChart history={selectedProduct.history} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                  {selectedProduct.history.slice(0, 8).reverse().map((h, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#475569' }}>{parseFloat(h.price).toLocaleString()}</div>
                      <div style={{ fontSize: '0.5rem', fontWeight: 600, color: '#cbd5e1' }}>{new Date(h.recorded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedProduct.market_note && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={14} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#92400e', lineHeight: 1.5 }}>{selectedProduct.market_note}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleUp { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}
