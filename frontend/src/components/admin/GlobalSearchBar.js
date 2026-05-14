import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, ShoppingBag, Package, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminApi';

const typeConfig = {
  farmer:  { icon: User, color: '#00AA44', bg: '#E6F9EE', label: 'Farmer' },
  buyer:   { icon: ShoppingBag, color: '#0066CC', bg: '#E8F0FE', label: 'Buyer' },
  order:   { icon: ShoppingBag, color: '#7C3AED', bg: '#F3E8FF', label: 'Order' },
  product: { icon: Package, color: '#FF9900', bg: '#FFF4E0', label: 'Product' },
};

const GlobalSearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); setIsOpen(true); }
      if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminApi.get('/search/', { params: { query } });
        const { accounts, orders, products } = res.data;
        const combined = [
          ...accounts.map(a => ({ id: a.id, type: a.role === 'farmer' ? 'farmer' : 'buyer', name: a.full_name, email: a.email, status: a.status, metric: a.role })),
          ...orders.map(o => ({ id: o.id, type: 'order', name: `Order #${o.id}`, email: o.buyer_name, status: o.status, metric: `${o.total_price} DZD` })),
          ...products.map(p => ({ id: p.id, type: 'product', name: p.title, email: p.farmer_name, status: 'active', metric: `${p.price} DZD` })),
        ];
        setResults(combined.slice(0, 8));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item) => {
    setIsOpen(false); setQuery(''); setResults([]);
    if (item.type === 'farmer' || item.type === 'buyer') navigate('/admin-dashboard/accounts');
    else if (item.type === 'order') navigate('/admin-dashboard/transactions');
  };

  const statusColor = (s) => {
    const lc = s?.toLowerCase();
    if (['approved','confirmed','delivered','active'].includes(lc)) return '#00AA44';
    if (lc === 'pending') return '#FF9900';
    if (['rejected','cancelled','suspended'].includes(lc)) return '#DD0033';
    return '#6B7280';
  };

  return (
    <div className="global-search-wrapper" ref={wrapperRef}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
      <input ref={inputRef} type="text" className="global-search-input"
        placeholder="Search accounts, orders, products... (Ctrl+K)" value={query}
        onChange={(e) => setQuery(e.target.value)} onFocus={() => setIsOpen(true)} />
      {query && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => { setQuery(''); setResults([]); }}><X size={14} /></button>}
      {!query && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-300 text-xs">
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">K</kbd>
        </div>
      )}
      {isOpen && results.length > 0 && (
        <div className="global-search-results">
          <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{results.length} results</span>
            {loading && <span className="text-xs text-slate-500">Searching...</span>}
          </div>
          {results.map((item, i) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            return (
              <div key={`${item.id}-${i}`} className="search-result-item" onClick={() => handleSelect(item)}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.bg }}>
                  <Icon size={14} style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{item.name}</div>
                  <div className="text-xs text-gray-400 truncate">{item.email}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${statusColor(item.status)}15`, color: statusColor(item.status) }}>
                    {item.status}
                  </span>
                  <ChevronRight size={12} className="text-gray-300" />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="global-search-results">
          <div className="px-4 py-8 text-center">
            <Search size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No results for "<strong>{query}</strong>"</p>
            <p className="text-xs text-gray-400 mt-1">Try searching by name, email, phone, or ID</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;
