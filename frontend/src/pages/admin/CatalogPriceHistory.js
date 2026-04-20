import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceArea
} from 'recharts';
import { 
  ChevronLeft, 
  TrendingUp, 
  Calendar,
  Filter,
  RefreshCw,
  Info,
  Layers,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronRight
} from 'lucide-react';

const CatalogPriceHistory = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchProductAndHistory = async () => {
    setLoading(true);
    try {
      // 1. Fetch Product Details
      const prodRes = await api.get(`/catalog-products/${id}/`);
      setProduct(prodRes.data);

      // 2. Fetch History
      const histRes = await api.get(`/price-publications/?catalog_product=${id}`);
      let data = histRes.data.results || histRes.data;
      
      // Sort oldest to newest for the chart
      data.sort((a, b) => new Date(a.valid_from) - new Date(b.valid_from));
      setHistory(data);
      
    } catch (err) {
      console.error("Failed to load price history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAndHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Derived processed data for the chart and table
  const processedData = useMemo(() => {
    let rawData = history;

    // Provide mock data conditionally if history is empty, to demonstrate the feature as requested
    const useMock = rawData.length === 0;
    if (useMock && product) {
      const base = parseFloat(product.ref_price) || 120;
      const min = parseFloat(product.min_price) || 100;
      const max = parseFloat(product.max_price) || 150;
      
      rawData = [
        { id: 'm1', valid_from: '2025-01-01', official_price: base - 10, min_price: min - 5, max_price: max + 5, notes: 'Initial setup', unit: product.unit || 'kg', mocked: true },
        { id: 'm2', valid_from: '2025-02-15', official_price: base - 5, min_price: min, max_price: max, notes: 'Market adjustment', unit: product.unit || 'kg', mocked: true },
        { id: 'm3', valid_from: '2025-03-20', official_price: base + 8, min_price: min, max_price: max, notes: 'Supply shortage', unit: product.unit || 'kg', mocked: true },
        { id: 'm4', valid_from: '2025-04-10', official_price: base, min_price: min, max_price: max, notes: 'Price stabilization', unit: product.unit || 'kg', mocked: true },
      ];
    }

    // Apply Filters
    let filtered = rawData;
    if (startDate) {
      filtered = filtered.filter(row => new Date(row.valid_from) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(row => new Date(row.valid_from) <= new Date(endDate));
    }

    // Format for Chart & Calculate previous stats for Table
    const formatted = filtered.map((item, index, arr) => {
      const prev = index > 0 ? arr[index - 1] : null;
      let trendNum = 0; // 0=flat, 1=up, -1=down
      if (prev) {
        if (parseFloat(item.official_price) > parseFloat(prev.official_price)) trendNum = 1;
        if (parseFloat(item.official_price) < parseFloat(prev.official_price)) trendNum = -1;
      }
      const d = new Date(item.valid_from);
      const chartDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      return {
        ...item,
        chartDate: chartDateStr,
        floor: parseFloat(item.min_price) || null,
        ceiling: parseFloat(item.max_price) || null,
        indexPrice: parseFloat(item.official_price),
        prevPrice: prev ? parseFloat(prev.official_price) : null,
        trendNum
      };
    });

    return { data: formatted, isMocked: useMock };
  }, [history, startDate, endDate, product]);

  const { data: chartData, isMocked } = processedData;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-emerald-500/20 p-4 rounded-xl shadow-xl">
          <p className="text-slate-300 font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-3 text-sm py-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400 w-24">{entry.name}:</span>
              <span className="font-bold text-white">{entry.value} DZD</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen p-6 space-y-6 anim-fade-up admin-mode">
      
      {/* ── Breadcrumb ────────────────────────────────── */}
      <div className="adm-breadcrumb">
        <Link to="/admin-dashboard">Admin Hub</Link>
        <ChevronRight size={12} className="text-slate-600" />
        <Link to="/admin-dashboard/catalog">Master Catalog</Link>
        <ChevronRight size={12} className="text-slate-600" />
        <span className="text-slate-500">Price History</span>
      </div>

      {/* ── Page Header ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <TrendingUp className="text-amber-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              Price Evolution
              {product && <span className="text-slate-500 font-medium">/ {product.name}</span>}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Track index ranges and historical price trajectories over time.</p>
          </div>
        </div>
        
        <Link to="/admin-dashboard/catalog" className="adm-btn adm-btn-ghost w-fit">
          <ChevronLeft size={16} /> Back to Catalog
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="adm-spinner mb-4"></div>
          <div className="text-slate-500 text-sm">Aggregating historical records...</div>
        </div>
      ) : !product ? (
        <div className="glass-card p-12 text-center">
          <Info className="mx-auto text-slate-600 mb-4" size={40} />
          <h3 className="text-lg text-slate-300 font-bold">Product not found</h3>
        </div>
      ) : (
        <>
          {/* ── Product Summary Stats ────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-stat-card p-4 flex flex-col justify-between">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Layers size={14} className="text-emerald-400"/> Current Category
              </div>
              <div className="text-lg font-semibold text-slate-200">
                {product.category_name || "Uncategorized"}
              </div>
            </div>
            
            <div className="glass-stat-card p-4 flex flex-col justify-between">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <TrendingUp size={14} className="text-red-400"/> Current Floor Minimum
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-red-400">
                  {product.min_price || "--"}
                </div>
                <div className="text-xs text-slate-500">DZD/{product.unit}</div>
              </div>
            </div>

            <div className="glass-stat-card p-4 flex flex-col justify-between">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-400"/> Current Ceiling Max
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-blue-400">
                  {product.max_price || "--"}
                </div>
                <div className="text-xs text-slate-500">DZD/{product.unit}</div>
              </div>
            </div>

            <div className="glass-stat-card p-4 flex flex-col justify-between">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-400"/> Target Index Price
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-emerald-400">
                  {product.ref_price || "--"}
                </div>
                <div className="text-xs text-slate-500">DZD/{product.unit}</div>
              </div>
            </div>
          </div>

          {/* ── Filters & Chart Section ──────────────────── */}
          <div className="glass-card flex flex-col overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between p-5 border-b border-white/5 gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-amber-400" size={18} />
                <h3 className="font-bold text-slate-200">Price Evolution Chart</h3>
                {isMocked && <span className="adm-badge adm-badge-warning ml-2">Displaying Demo Data</span>}
              </div>
              
              {/* Date Filters */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="date" 
                    className="adm-input pl-8 py-1.5 text-xs" 
                    style={{width: '140px'}}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <span className="text-slate-600">—</span>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="date" 
                    className="adm-input pl-8 py-1.5 text-xs" 
                    style={{width: '140px'}}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                {(startDate || endDate) && (
                  <button 
                    className="adm-btn adm-btn-ghost adm-btn-icon" 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    title="Clear filters"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6" style={{ height: '400px', width: '100%' }}>
              {chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Filter size={32} className="mb-3 opacity-30" />
                  <p>No historical data available for this range.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="chartDate" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `${val} DZD`}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    
                    {/* Floor Area/Line */}
                    <Line 
                      type="stepAfter" 
                      dataKey="floor" 
                      name="Floor Price" 
                      stroke="#f87171" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={false}
                    />
                    
                    {/* Ceiling Area/Line */}
                    <Line 
                      type="stepAfter" 
                      dataKey="ceiling" 
                      name="Ceiling Price" 
                      stroke="#60a5fa" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={false}
                    />
                    
                    {/* Index Price */}
                    <Line 
                      type="monotone" 
                      dataKey="indexPrice" 
                      name="Official Index Price" 
                      stroke="#34d399" 
                      strokeWidth={3}
                      dot={{ fill: '#0f172a', stroke: '#34d399', strokeWidth: 2, r: 4 }}
                      activeDot={{ fill: '#34d399', stroke: '#fff', strokeWidth: 2, r: 6 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Table Section ────────────────────────────── */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Database size={16} className="text-emerald-400" /> Historical Price Archive
              </h3>
              <span className="adm-badge adm-badge-approved">{chartData.length} Records</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="pl-6">Effective Date</th>
                    <th>Safety Range</th>
                    <th>Index Price</th>
                    <th>Trend</th>
                    <th>Changed By</th>
                    <th className="w-1/3">Reason / Notification</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="py-12 text-center text-slate-500 text-sm">
                          No history records exist.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // Display latest first in the table
                    [...chartData].reverse().map((row, idx) => (
                      <tr key={row.id || idx}>
                        <td className="pl-6">
                          <span className="font-semibold text-slate-200">{row.chartDate}</span>
                        </td>
                        <td>
                          <div className="flex items-center text-xs">
                            <span className="text-red-400">{row.floor || '--'}</span>
                            <span className="mx-2 text-slate-600">→</span>
                            <span className="text-blue-400">{row.ceiling || '--'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-bold text-emerald-400">{row.indexPrice} DZD</span>
                        </td>
                        <td>
                          {row.trendNum === 1 ? (
                            <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded w-fit">
                              <ArrowUpRight size={14} /> UP
                            </span>
                          ) : row.trendNum === -1 ? (
                            <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded w-fit">
                              <ArrowDownRight size={14} /> DOWN
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-500/10 px-2 py-1 rounded w-fit">
                              <Minus size={14} /> FLAT
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="adm-badge" style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>Admin System</span>
                        </td>
                        <td>
                          <span className="text-sm text-slate-400">{row.notes || '—'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CatalogPriceHistory;
