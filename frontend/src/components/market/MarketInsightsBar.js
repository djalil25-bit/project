import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, LineChart } from 'lucide-react';
import api from '../../api/axiosConfig';

export default function MarketInsightsBar({ onOpenPanel, accentColor = '#10b981' }) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catalogRes = await api.get('/catalog-products/');
        
        // Map catalog products to ticker format
        const products = (catalogRes.data.results || catalogRes.data || []).filter(p => p.ref_price);
        
        const mappedPrices = products.map((p, index) => {
          return {
            id: p.id,
            product_name: p.name,
            current_price: p.ref_price,
            min_price: p.min_price,
            max_price: p.max_price,
            unit: p.unit || 'kg',
            trend: p.trend || 'STABLE',
          };
        });

        setPrices(mappedPrices);
      } catch (err) {
        console.error('[MarketInsights] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 min refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  const tickerItems = [];

  prices.forEach(p => {
    let displayPrice = p.current_price ? parseFloat(p.current_price).toLocaleString() : '—';
    if (p.min_price && p.max_price) {
      displayPrice = `${parseFloat(p.min_price)} - ${parseFloat(p.max_price)}`;
    }
    
    tickerItems.push({
      type: 'price',
      id: `price-${p.id}`,
      name: p.product_name,
      price: displayPrice,
      min_price: p.min_price,
      max_price: p.max_price,
      unit: p.unit,
      trend: p.trend,
    });
  });

  if (tickerItems.length === 0) {
    return (
      <div style={{ height: '42px', width: '100%', background: 'linear-gradient(90deg, #0f172a, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Establishing Market Connection...</span>
      </div>
    );
  }

  let baseItems = [...tickerItems];
  while (baseItems.length > 0 && baseItems.length < 15) {
    baseItems = [...baseItems, ...tickerItems];
  }
  const displayItems = [...baseItems, ...baseItems];

  const getTrendConfig = (trend) => {
    switch (trend) {
      case 'INCREASING': return { icon: TrendingUp, color: '#10b981', symbol: '↑', bg: 'rgba(16,185,129,0.15)' };
      case 'DECREASING': return { icon: TrendingDown, color: '#ef4444', symbol: '↓', bg: 'rgba(239,68,68,0.15)' };
      default: return { icon: Minus, color: '#94a3b8', symbol: '→', bg: 'rgba(148,163,184,0.15)' };
    }
  };

  return (
    <div 
      onClick={onOpenPanel}
      style={{
        width: '100%',
        height: '42px',
        background: 'linear-gradient(90deg, #020617 0%, #0f172a 50%, #020617 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        boxSizing: 'border-box',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}
    >
      {/* Left Static Label */}
      <div style={{
        padding: '0 20px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
        borderRight: '1px solid rgba(255,255,255,0.15)',
        zIndex: 10,
        boxShadow: `4px 0 12px ${accentColor}40`,
        flexShrink: 0
      }}>
        <LineChart size={16} color="#ffffff" />
        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff', letterSpacing: '1px' }}>
          PRIX OFFICIELS
        </span>
      </div>

      {/* Scrolling Content Container */}
      <div 
        className="market-ticker-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          flex: 1,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          position: 'relative'
        }}
      >
        <div 
          className="market-ticker-track"
          style={{
            display: 'flex',
            alignItems: 'center',
            width: 'max-content'
          }}
        >
          {displayItems.map((item, i) => {
            const trendConfig = item.type === 'price' ? getTrendConfig(item.trend) : null;
            return (
              <div key={`${item.id}-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
                
                {/* Item Content */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 28px', gap: '8px' }}>
                  {item.type === 'alert' ? (
                    <>
                      <div style={{ background: 'rgba(217,119,6,0.2)', padding: '4px', rounded: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                        <AlertTriangle size={14} color="#fbbf24" strokeWidth={2.5} />
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#fcd34d', letterSpacing: '0.3px' }}>
                        {item.text}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#cbd5e1', letterSpacing: '0.3px' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '11.5px', fontWeight: 700 }}>
                        {item.min_price && item.max_price ? (
                          <>
                            <span style={{ color: '#10b981' }}>{parseFloat(item.min_price)}</span>
                            <span style={{ color: '#64748b', margin: '0 3px', fontSize: '10px', fontWeight: 500 }}>-</span>
                            <span style={{ color: '#ef4444' }}>{parseFloat(item.max_price)}</span>
                          </>
                        ) : (
                          <span style={{ color: '#ffffff' }}>{item.price ? parseFloat(item.price).toLocaleString() : '—'}</span>
                        )}
                        <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600, marginLeft: '3px' }}>DA/{item.unit}</span>
                      </span>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: trendConfig.bg, padding: '2px 6px', borderRadius: '4px', gap: '2px'
                      }}>
                        {React.createElement(trendConfig.icon, { 
                          size: 12, 
                          color: trendConfig.color,
                          strokeWidth: 3
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Separator */}
                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '14px', fontWeight: 900 }}>•</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .market-ticker-track {
          animation: tickerScroll 50s linear infinite;
          will-change: transform;
        }
        .market-ticker-container:hover .market-ticker-track {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
