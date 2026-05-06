import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import adminApi from '../../api/adminApi';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Trophy, Medal, Award, Calendar, ChevronRight, MapPin, Eye, Download } from 'lucide-react';

const tooltipStyle = { borderRadius:10, border:'1px solid #E5E7EB', background:'#fff', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', color:'#1F2937' };
const getRankIcon = i => i===0?<Trophy className="text-yellow-500" size={18}/>:i===1?<Medal className="text-gray-400" size={18}/>:<Award className="text-orange-400" size={18}/>;

const AdminAnalytics = () => {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('product');
  const [timeframe, setTimeframe] = useState('all');

  // Product tab state
  const [products, setProducts] = useState([]);
  const [selProductId, setSelProductId] = useState(null);
  const [prodData, setProdData] = useState(null);
  const [prodLoading, setProdLoading] = useState(false);

  // Zone tab state
  const [zones, setZones] = useState([]);
  const [selZone, setSelZone] = useState('');
  const [zoneData, setZoneData] = useState(null);
  const [zoneLoading, setZoneLoading] = useState(false);

  // Leaderboard state
  const [leaders, setLeaders] = useState([]);
  const [leadersLoading, setLeadersLoading] = useState(false);

  // Fetch main analytics from existing dashboard endpoint
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/dashboards/admin-analytics/?timeframe=${timeframe}`);
        setApiData(res.data);
      } catch { setApiData({ revenue_trend:[], users_trend:[] }); }
      finally { setLoading(false); }
    };
    fetch();
  }, [timeframe]);

  // Fetch product list for dropdown
  useEffect(() => {
    adminApi.get('/analytics/products/').then(res => {
      setProducts(res.data.products || []);
      if (res.data.products?.length > 0) setSelProductId(res.data.products[0].id);
    }).catch(() => {});
  }, []);

  // Fetch product detail when selection changes
  useEffect(() => {
    if (!selProductId) return;
    setProdLoading(true);
    adminApi.get('/analytics/products/', { params: { product_id: selProductId } })
      .then(res => setProdData(res.data))
      .catch(() => setProdData(null))
      .finally(() => setProdLoading(false));
  }, [selProductId]);

  // Fetch zones for dropdown
  useEffect(() => {
    adminApi.get('/analytics/zones/').then(res => {
      setZones(res.data.zones || []);
      if (res.data.zones?.length > 0) setSelZone(res.data.zones[0]);
    }).catch(() => {});
  }, []);

  // Fetch zone detail
  useEffect(() => {
    if (!selZone) return;
    setZoneLoading(true);
    adminApi.get('/analytics/zones/', { params: { zone: selZone } })
      .then(res => setZoneData(res.data))
      .catch(() => setZoneData(null))
      .finally(() => setZoneLoading(false));
  }, [selZone]);

  // Fetch leaderboard
  useEffect(() => {
    if (activeTab !== 'leaderboard') return;
    setLeadersLoading(true);
    adminApi.get('/analytics/top-sellers/')
      .then(res => setLeaders(res.data.sellers || []))
      .catch(() => setLeaders([]))
      .finally(() => setLeadersLoading(false));
  }, [activeTab]);

  if (loading && !apiData) return <div className="flex items-center justify-center gap-3 py-20"><div className="adm-spinner"></div><span className="text-gray-400 text-sm">Loading analytics...</span></div>;

  const tabs = [
    { key:'product', label:'Product Performance', icon:<Package size={14}/> },
    { key:'zone', label:'Zone Analysis', icon:<MapPin size={14}/> },
    { key:'leaderboard', label:'Top Sellers', icon:<Trophy size={14}/> },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in relative z-0 bg-slate-50/30 min-h-screen">
      
      {/* ── HIGH-DENSITY HERO HEADER (GREEN POWER PRO) ─────────────────────────────── */}
      <div className="bg-[#0a3d2e] rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between px-6 py-4 md:px-10 md:py-5 relative border border-[#0f5c44] isolate">
        <div className="absolute inset-0 bg-gradient-to-r from-[#166534]/30 to-transparent pointer-events-none" />
        <div className="z-10 flex flex-col">
          <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">
            <TrendingUp size={12} /> Insights & Reports
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
            Platform Analytics
          </h1>
        </div>
        <div className="z-10 mt-3 md:mt-0 flex items-center gap-2 bg-[#0f5c44] border border-[#166534] rounded-xl px-3 py-1.5 shadow-inner">
          <Calendar className="text-emerald-400" size={14}/>
          <select className="bg-transparent text-emerald-50 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none pl-1 pr-2" value={timeframe} onChange={e=>setTimeframe(e.target.value)}>
            <option value="all" className="text-slate-900">ALL TIME</option>
            <option value="year" className="text-slate-900">THIS YEAR</option>
            <option value="month" className="text-slate-900">THIS MONTH</option>
          </select>
        </div>
      </div>

      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 w-fit overflow-hidden p-1">
        {tabs.map(t=>(
          <button key={t.key} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab===t.key?'bg-emerald-600 text-white shadow-md':'text-slate-500 hover:bg-slate-50'}`} onClick={()=>setActiveTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Product Performance */}
      {activeTab==='product' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Product:</label>
            <select className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner w-full max-w-md" value={selProductId || ''} onChange={e=>setSelProductId(e.target.value)}>
              {products.map(p=><option key={p.id} value={p.id}>{p.title} ({p.category__name})</option>)}
            </select>
          </div>

          {prodLoading ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Loading product data...</div> :
           !prodData ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Select a product to view analytics.</div> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {l:'Total Units Sold', v: prodData.total_units},
                {l:'Total Revenue', v: `${Number(prodData.total_revenue).toLocaleString()}`, s:'DZD'},
                {l:'Unique Sellers', v: prodData.unique_sellers},
                {l:'Unique Buyers', v: prodData.unique_buyers},
              ].map((c,i)=>(
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{c.l}</div>
                  <div className="text-2xl font-black text-slate-800">{c.v} {c.s&&<span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase ml-1">{c.s}</span>}</div>
                </div>
              ))}
            </div>

            {/* Top 3 Sellers */}
            {prodData.top_sellers?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700 flex items-center gap-2 mb-5"><Trophy size={14} className="text-yellow-500"/> Top Sellers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {prodData.top_sellers.map((s,i)=>(
                    <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg hover:border-emerald-200 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm text-lg font-black">{getRankIcon(i)}</div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">#{s.rank}</span>
                      </div>
                      <div className="font-black text-sm text-slate-900 mb-3 truncate">{s.farmer__full_name}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-2 rounded-lg border border-slate-100"><span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Units</span><div className="font-black text-slate-800">{Number(s.units).toLocaleString()}</div></div>
                        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100"><span className="block text-[9px] font-black uppercase tracking-widest text-emerald-600/70 mb-0.5">Revenue</span><div className="font-black text-emerald-700">{Number(s.revenue).toLocaleString()}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sales Trend */}
            {prodData.trend?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700 mb-5">Sales Trend (30 Days)</h3>
                <div style={{width:'100%',height:280}}>
                  <ResponsiveContainer>
                    <AreaChart data={prodData.trend} margin={{top:10,right:10,left:0,bottom:0}}>
                      <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.3}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10,fontWeight:'bold'}} interval={4}/>
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10,fontWeight:'bold'}}/>
                      <Tooltip contentStyle={tooltipStyle}/>
                      <Area type="monotone" dataKey="sales" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Price Analysis */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700 mb-5">Price Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl"><label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Average Price</label><span className="text-xl font-black text-slate-800">{Number(prodData.avg_price).toFixed(0)} <span className="text-xs text-slate-400">DZD</span></span></div>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl"><label className="block text-[9px] font-black uppercase tracking-widest text-rose-500/70 mb-1">Min Price</label><span className="text-xl font-black text-rose-700">{Number(prodData.min_price).toFixed(0)} <span className="text-xs text-rose-400">DZD</span></span></div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl"><label className="block text-[9px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">Max Price</label><span className="text-xl font-black text-emerald-700">{Number(prodData.max_price).toFixed(0)} <span className="text-xs text-emerald-400">DZD</span></span></div>
              </div>
            </div>
          </>
          )}
        </div>
      )}

      {/* Zone Analysis */}
      {activeTab==='zone' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Zone:</label>
            <select className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner w-full max-w-xs" value={selZone} onChange={e=>setSelZone(e.target.value)}>
              {zones.map(z=><option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {zoneLoading ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Loading zone data...</div> :
           !zoneData ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Select a zone to view analytics.</div> :
           zones.length === 0 ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">No zone data available yet. Orders need wilaya information.</div> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {l:'GMV', v:`${(zoneData.gmv/1e6).toFixed(2)}M`, s:'DZD'},
                {l:'Orders', v:zoneData.order_count},
                {l:'Avg Order', v:Number(zoneData.avg_order).toLocaleString(), s:'DZD'},
                {l:'Farmers', v:zoneData.farmers},
                {l:'Buyers', v:zoneData.buyers},
              ].map((c,i)=>(
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{c.l}</div>
                  <div className="text-lg md:text-xl font-black text-slate-800">{c.v} {c.s&&<span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase ml-1">{c.s}</span>}</div>
                </div>
              ))}
            </div>

            {zoneData.top_products?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700 mb-5">Top Products in {selZone}</h3>
                <div className="space-y-3">{zoneData.top_products.map((p,i)=>(
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors">
                    <div className="text-xl font-black text-slate-300 w-6 text-center">{i+1}</div>
                    <div className="flex-1"><div className="font-black text-slate-800 text-sm">{p.product__title}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{Number(p.units).toLocaleString()} units</div></div>
                    <div className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">{Number(p.revenue).toLocaleString()} DZD</div>
                  </div>
                ))}</div>
              </div>
            )}
          </>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab==='leaderboard' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700 flex items-center gap-2"><Trophy size={14} className="text-yellow-500"/> Revenue Leaderboard</h3>
            </div>
            {leadersLoading ? <div className="py-8 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Loading leaderboard...</div> :
             leaders.length === 0 ? <div className="py-8 text-center text-slate-400 font-black uppercase tracking-widest text-xs">No sales data available yet.</div> : (
            <div className="space-y-4">
              {leaders.map((s,i)=>(
                <div key={i} className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md hover:border-emerald-300 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm text-xl font-black">{getRankIcon(i)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm text-slate-900">{s.farmer__full_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-emerald-600">{Number(s.revenue).toLocaleString()} <span className="text-[10px] text-emerald-600/60 uppercase tracking-widest">DZD</span></div>
                    {leaders[0]?.revenue > 0 && <div className="w-32 md:w-48 h-2 bg-slate-200 rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${(s.revenue/leaders[0].revenue)*100}%`}}/></div>}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Revenue + User charts from existing API */}
          {apiData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700 mb-5">Revenue Trend</h3>
                <div style={{width:'100%',height:260}}>
                  {apiData.revenue_trend?.length > 0 ? (
                    <ResponsiveContainer><AreaChart data={apiData.revenue_trend} margin={{top:10,right:10,left:0,bottom:0}}>
                      <defs><linearGradient id="cr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.3}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10,fontWeight:'bold'}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10,fontWeight:'bold'}}/>
                      <Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#cr)"/>
                    </AreaChart></ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-slate-400 text-xs font-black uppercase tracking-widest">No revenue data</div>}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700 mb-5">User Registrations</h3>
                <div style={{width:'100%',height:260}}>
                  {apiData.users_trend?.length > 0 ? (
                    <ResponsiveContainer><BarChart data={apiData.users_trend} margin={{top:10,right:10,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10,fontWeight:'bold'}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10,fontWeight:'bold'}}/>
                      <Tooltip contentStyle={tooltipStyle}/><Bar dataKey="users" fill="#0ea5e9" radius={[4,4,0,0]}/>
                    </BarChart></ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-slate-400 text-xs font-black uppercase tracking-widest">No data</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
