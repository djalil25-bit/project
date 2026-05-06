import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import adminApi from '../../api/adminApi';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Package, Trophy, Medal, Award, Calendar, ChevronRight, MapPin, Eye, Download, Users, Truck } from 'lucide-react';

const tooltipStyle = { borderRadius:10, border:'1px solid #E5E7EB', background:'#fff', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', color:'#1F2937' };
const getRankIcon = i => i===0?<Trophy className="text-yellow-500" size={18}/>:i===1?<Medal className="text-gray-400" size={18}/>:<Award className="text-orange-400" size={18}/>;

const AdminAnalytics = () => {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('product');
  const [timeframe, setTimeframe] = useState('all');

  // Product tab state
  const [products, setProducts] = useState([]);
  const [selProductTitle, setSelProductTitle] = useState(null);
  const [prodData, setProdData] = useState(null);
  const [prodLoading, setProdLoading] = useState(false);

  // Zone tab state
  const [zones, setZones] = useState([]);
  const [selZone, setSelZone] = useState('');
  const [zoneData, setZoneData] = useState(null);
  const [zoneLoading, setZoneLoading] = useState(false);

  // Leaderboard state
  const [leaders, setLeaders] = useState({ sellers: [], buyers: [], transporters: [] });
  const [leadersLoading, setLeadersLoading] = useState(false);
  const [leaderYear, setLeaderYear] = useState('All');

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
      if (res.data.products?.length > 0) setSelProductTitle(res.data.products[0].title);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selProductTitle) return;
    setProdLoading(true);
    adminApi.get('/analytics/products/', { params: { product_title: selProductTitle } })
      .then(res => setProdData(res.data))
      .catch(() => setProdData(null))
      .finally(() => setProdLoading(false));
  }, [selProductTitle]);

  // Fetch zones for dropdown
  useEffect(() => {
    adminApi.get('/analytics/zones/').then(res => {
      setZones(res.data.zones || []);
      if (!selZone) setSelZone('All Zones');
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
  const fetchLeaders = () => {
    setLeadersLoading(true);
    const params = {};
    if (leaderYear !== 'All') params.year = leaderYear;
    
    adminApi.get('/analytics/top-sellers/', { params })
      .then(res => setLeaders(res.data || { sellers: [], buyers: [], transporters: [] }))
      .catch(() => setLeaders({ sellers: [], buyers: [], transporters: [] }))
      .finally(() => setLeadersLoading(false));
  };

  useEffect(() => {
    if (activeTab !== 'leaderboard') return;
    fetchLeaders();
  }, [activeTab, leaderYear]);

  const handleAwardBadge = async (userId) => {
    const badge = window.prompt("Enter badge name to award to this user (e.g. '🏅 Best Seller 2026'):");
    if (!badge) return;
    try {
      await adminApi.post('/analytics/award-badge/', { user_id: userId, badge });
      fetchLeaders(); // refresh data to show the new badge
    } catch (e) {
      alert("Failed to award badge.");
    }
  };

  if (loading && !apiData) return <div className="flex items-center justify-center gap-3 py-20"><div className="adm-spinner"></div><span className="text-gray-400 text-sm">Loading analytics...</span></div>;

  const tabs = [
    { key:'product', label:'Product Performance', icon:<Package size={14}/> },
    { key:'zone', label:'Zone Analysis', icon:<MapPin size={14}/> },
    { key:'leaderboard', label:'Top Actors', icon:<Trophy size={14}/> },
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden z-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 opacity-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Package size={18} />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 tracking-tight">Market Asset Selection</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Filter by agricultural product</p>
              </div>
            </div>
            <select className="h-12 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 rounded-xl px-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner w-full sm:max-w-xs relative z-10 appearance-none cursor-pointer" style={{backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2310b981%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto'}} value={selProductTitle || ''} onChange={e=>setSelProductTitle(e.target.value)}>
              {products.map(p=><option key={p.title} value={p.title}>{p.title.toUpperCase()} ({p.category__name})</option>)}
            </select>
          </div>

          {prodLoading ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Loading product data...</div> :
           !prodData ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Select a product to view analytics.</div> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {l:'Total Units Sold', v: prodData.total_units, i: <Package size={20}/>, c: 'emerald'},
                {l:'Total Revenue', v: `${Number(prodData.total_revenue).toLocaleString()}`, s:'DZD', i: <span className="font-black text-sm">DZ</span>, c: 'teal'},
                {l:'Unique Sellers', v: prodData.unique_sellers, i: <MapPin size={20}/>, c: 'amber'},
                {l:'Unique Buyers', v: prodData.unique_buyers, i: <Eye size={20}/>, c: 'blue'},
              ].map((c,i)=>(
                <div key={i} className="group bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden flex flex-col">
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${c.c}-50 opacity-40 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-700 pointer-events-none`} />
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-${c.c}-100 bg-${c.c}-50 text-${c.c}-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    {c.i}
                  </div>
                  <div className="mt-auto">
                    <div className="text-3xl font-black text-slate-900 tracking-tight mb-1 flex items-baseline gap-2">
                      {c.v} {c.s&&<span className={`text-[10px] font-black tracking-widest text-${c.c}-600 bg-${c.c}-50 px-2 py-1 rounded-lg uppercase`}>{c.s}</span>}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 leading-snug">{c.l}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top 3 Sellers */}
            {prodData.top_sellers?.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/30">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-sm uppercase tracking-[0.15em] text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center"><Trophy size={16} className="text-yellow-500"/></div>
                    Top Performing Producers
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {prodData.top_sellers.map((s,i)=>(
                    <div key={i} className="group p-6 rounded-3xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-emerald-900/5 hover:border-emerald-100 transition-all duration-500 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 opacity-0 group-hover:opacity-100 rounded-full blur-2xl transition-opacity duration-700 pointer-events-none" />
                      
                      <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-xl font-black group-hover:scale-110 transition-transform">
                          {getRankIcon(i)}
                        </div>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">Rank #{s.rank}</span>
                      </div>
                      
                      <div className="font-black text-lg text-slate-900 mb-4 truncate relative z-10">{s.farmer__full_name}</div>
                      
                      <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                          <span className="block text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Volume</span>
                          <div className="font-black text-slate-800 text-lg tracking-tight">{Number(s.units).toLocaleString()} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">U</span></div>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 shadow-sm">
                          <span className="block text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600/70 mb-1">Revenue</span>
                          <div className="font-black text-emerald-700 text-lg tracking-tight">{Number(s.revenue).toLocaleString()} <span className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest">DZ</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sales Trend */}
            {prodData.trend?.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/30">
                <h3 className="font-black text-sm uppercase tracking-[0.15em] text-slate-900 flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center"><TrendingUp size={16} className="text-teal-600"/></div>
                  Sales Volume Trend (30 Days)
                </h3>
                <div style={{width:'100%',height:320}}>
                  <ResponsiveContainer>
                    <AreaChart data={prodData.trend} margin={{top:10,right:10,left:0,bottom:0}}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10,fontWeight:'bold',fontFamily:'Inter, sans-serif'}} interval={4} dy={10}/>
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10,fontWeight:'bold',fontFamily:'Inter, sans-serif'}} dx={-10}/>
                      <Tooltip contentStyle={{...tooltipStyle, borderRadius: 16, padding: '12px 16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'}}/>
                      <Area type="monotone" dataKey="sales" stroke="#0d9488" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Price Analysis */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/30">
              <h3 className="font-black text-sm uppercase tracking-[0.15em] text-slate-900 flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-black text-[10px] text-blue-600">DZ</div>
                Market Price Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-300 transition-colors">
                  <div className="absolute right-4 top-4 text-slate-200 group-hover:text-slate-300 transition-colors"><Activity size={48} /></div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2 relative z-10">Average Market Price</label>
                  <span className="text-3xl font-black text-slate-900 tracking-tight relative z-10">{Number(prodData.avg_price).toFixed(0)} <span className="text-[10px] uppercase tracking-widest text-slate-400 bg-white px-2 py-1 rounded-lg">DZD</span></span>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl relative overflow-hidden group hover:border-rose-200 transition-colors">
                  <div className="absolute right-4 top-4 text-rose-100 group-hover:text-rose-200 transition-colors"><TrendingDown size={48} /></div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-rose-500/80 mb-2 relative z-10">Lowest Recorded Price</label>
                  <span className="text-3xl font-black text-rose-700 tracking-tight relative z-10">{Number(prodData.min_price).toFixed(0)} <span className="text-[10px] uppercase tracking-widest text-rose-500 bg-white/60 px-2 py-1 rounded-lg">DZD</span></span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-200 transition-colors">
                  <div className="absolute right-4 top-4 text-emerald-100 group-hover:text-emerald-200 transition-colors"><TrendingUp size={48} /></div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600/80 mb-2 relative z-10">Peak Market Price</label>
                  <span className="text-3xl font-black text-emerald-700 tracking-tight relative z-10">{Number(prodData.max_price).toFixed(0)} <span className="text-[10px] uppercase tracking-widest text-emerald-600 bg-white/60 px-2 py-1 rounded-lg">DZD</span></span>
                </div>
              </div>
            </div>
          </>
          )}
        </div>
      )}

      {/* Zone Analysis */}
      {activeTab==='zone' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden z-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 opacity-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 tracking-tight">Geographic Market Focus</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Filter data by wilaya or national level</p>
              </div>
            </div>
            <select className="h-12 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 rounded-xl px-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner w-full sm:max-w-xs relative z-10 appearance-none cursor-pointer" style={{backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%233b82f6%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto'}} value={selZone || 'All Zones'} onChange={e=>setSelZone(e.target.value)}>
              {zones.map(z=><option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {zoneLoading ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Loading zone data...</div> :
           !zoneData ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Select a zone to view analytics.</div> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {l:'Gross Merchandise Value', v:`${(zoneData.gmv/1e6).toFixed(2)}M`, s:'DZD', i: <span className="font-black text-sm">DZ</span>, c: 'emerald'},
                {l:'Total Orders Completed', v:zoneData.order_count, i: <Package size={20}/>, c: 'blue'},
                {l:'Average Order Value', v:Number(zoneData.avg_order).toLocaleString(), s:'DZD', i: <Activity size={20}/>, c: 'amber'},
                {l:'Active Production Units', v:zoneData.actors.online_farms, i: <MapPin size={20}/>, c: 'green', live: true},
                {l:'Fleet Readiness', v:zoneData.actors.online_vehicles, i: <Truck size={20}/>, c: 'indigo', live: true},
              ].map((c,i)=>(
                <div key={i} className="group bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden flex flex-col">
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${c.c}-50 opacity-40 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-700 pointer-events-none`} />
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-${c.c}-100 bg-${c.c}-50 text-${c.c}-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    {c.i}
                  </div>
                  <div className="mt-auto">
                    <div className="text-3xl font-black text-slate-900 tracking-tight mb-1 flex items-baseline gap-2">
                      {c.v} {c.s&&<span className={`text-[10px] font-black tracking-widest text-${c.c}-600 bg-${c.c}-50 px-2 py-1 rounded-lg uppercase`}>{c.s}</span>}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 leading-snug flex items-center gap-2">
                      {c.l}
                      {c.live && <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart for Actors */}
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/30">
                <h3 className="font-black text-sm uppercase tracking-[0.15em] text-slate-900 flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center"><Users size={16} className="text-indigo-600"/></div>
                  Network Actors ({selZone})
                </h3>
                {zoneData.actors ? (
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-48 h-48 relative">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={[
                              { name: 'Farmers', value: zoneData.actors.farmers, color: '#10b981' },
                              { name: 'Buyers', value: zoneData.actors.buyers, color: '#3b82f6' },
                              { name: 'Transporters', value: zoneData.actors.transporters, color: '#f59e0b' }
                            ].filter(d => d.value > 0)} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                            {[
                              { name: 'Farmers', value: zoneData.actors.farmers, color: '#10b981' },
                              { name: 'Buyers', value: zoneData.actors.buyers, color: '#3b82f6' },
                              { name: 'Transporters', value: zoneData.actors.transporters, color: '#f59e0b' }
                            ].filter(d => d.value > 0).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{...tooltipStyle, borderRadius: 12, padding: '8px 12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-2xl font-black text-slate-800">{zoneData.actors.farmers + zoneData.actors.buyers + zoneData.actors.transporters}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors">
                        <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-emerald-500"/><span className="text-xs font-black uppercase tracking-widest text-slate-600">Producers</span></div>
                        <span className="text-lg font-black text-slate-900">{zoneData.actors.farmers}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-blue-500"/><span className="text-xs font-black uppercase tracking-widest text-slate-600">Buyers</span></div>
                        <span className="text-lg font-black text-slate-900">{zoneData.actors.buyers}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors">
                        <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-amber-500"/><span className="text-xs font-black uppercase tracking-widest text-slate-600">Fleet</span></div>
                        <span className="text-lg font-black text-slate-900">{zoneData.actors.transporters}</span>
                      </div>
                    </div>
                  </div>
                ) : <div className="py-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No actors data available</div>}
              </div>

              {/* Bar Chart for User Registrations */}
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/30">
                <h3 className="font-black text-sm uppercase tracking-[0.15em] text-slate-900 flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center"><Activity size={16} className="text-rose-600"/></div>
                  Onboarding Trend (30 Days)
                </h3>
                {zoneData.registration_trend?.length > 0 ? (
                  <div style={{width:'100%',height:240}}>
                    <ResponsiveContainer>
                      <BarChart data={zoneData.registration_trend} margin={{top:10,right:10,left:0,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10,fontWeight:'bold',fontFamily:'Inter, sans-serif'}} interval={4} dy={10}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:10,fontWeight:'bold',fontFamily:'Inter, sans-serif'}} dx={-10}/>
                        <Tooltip contentStyle={{...tooltipStyle, borderRadius: 12, padding: '8px 12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} cursor={{fill: '#f8fafc'}}/>
                        <Bar dataKey="count" fill="#f43f5e" radius={[6,6,0,0]} barSize={16}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest flex items-center justify-center h-[240px]">No recent registrations</div>}
              </div>
            </div>

            {zoneData.top_products?.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/30">
                <h3 className="font-black text-sm uppercase tracking-[0.15em] text-slate-900 flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"><Package size={16} className="text-emerald-600"/></div>
                  Top Moving Products in {selZone}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{zoneData.top_products.map((p,i)=>(
                  <div key={i} className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl font-black shadow-sm group-hover:scale-110 group-hover:text-emerald-600 transition-transform">{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-base">{(p.product__title || 'Deleted Product').toUpperCase()}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"><span className="text-emerald-600 font-black">{Number(p.units).toLocaleString()}</span> units sold</div>
                    </div>
                    <div className="text-right bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="text-sm font-black text-emerald-700 tracking-tight">{Number(p.revenue).toLocaleString()} <span className="text-[9px] uppercase tracking-widest text-emerald-600/70 font-bold">DZ</span></div>
                    </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Performance Rankings</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global Merit & Activity Leaderboard</p>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
              <Calendar size={14} className="text-slate-400 ml-2" />
              <select 
                value={leaderYear}
                onChange={(e) => setLeaderYear(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest py-1 px-2 pr-8 focus:ring-0 outline-none cursor-pointer text-slate-600"
              >
                <option value="All">Cumulative (All Time)</option>
                <option value="2026">Fiscal Year 2026</option>
                <option value="2025">Fiscal Year 2025</option>
                <option value="2024">Fiscal Year 2024</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Producers */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40">
              <div className="bg-emerald-600 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <Trophy size={20} className="text-emerald-200" />
                  <h3 className="font-black text-sm uppercase tracking-widest">Top Producers</h3>
                </div>
                <div className="bg-emerald-700/50 px-3 py-1 rounded-full text-[9px] font-black text-emerald-100 uppercase tracking-widest border border-emerald-500/30">
                  Revenue Index
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {leadersLoading ? <div className="py-20 text-center"><div className="adm-spinner mx-auto mb-4"></div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aggregating Statistics...</p></div> :
                 leaders.sellers?.length === 0 ? <div className="py-20 text-center text-slate-300"><Package size={40} className="mx-auto mb-3 opacity-20"/><p className="text-[10px] font-black uppercase tracking-widest">No production records found</p></div> : (
                  leaders.sellers.map((s, i) => (
                    <div key={i} className={`group flex items-center p-4 rounded-[2rem] border transition-all duration-300 ${i === 0 ? 'bg-emerald-50/50 border-emerald-100 shadow-inner' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-lg'}`}>
                      <div className="flex flex-col gap-3 w-full">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center font-black text-lg shadow-lg relative ${
                            i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white' : 
                            i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' : 
                            i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 
                            'bg-white border border-slate-200 text-slate-400'
                          }`}>
                            {i < 3 ? getRankIcon(i) : i + 1}
                            {i < 3 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] font-black text-slate-900 border border-slate-100 shadow-sm">{i+1}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-sm text-slate-900 truncate leading-tight">{s.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              Rank #{i+1}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-end justify-between bg-white/50 p-3 rounded-2xl border border-slate-100/50">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-1">
                              {s.badges?.length > 0 ? s.badges.map((b, bi) => (
                                <span key={bi} className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200/50">
                                  {b}
                                </span>
                              )) : (
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 italic">No Badges</span>
                              )}
                            </div>
                            <button onClick={() => handleAwardBadge(s.id)} className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mt-2 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                              Award Merit
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-[13px] font-black text-slate-900 tracking-tight">
                              {Number(s.metric_value).toLocaleString()}
                            </div>
                            <div className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">DZD REV</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Buyers */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40">
              <div className="bg-blue-600 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <TrendingUp size={20} className="text-blue-200" />
                  <h3 className="font-black text-sm uppercase tracking-widest">Top Buyers</h3>
                </div>
                <div className="bg-blue-700/50 px-3 py-1 rounded-full text-[9px] font-black text-blue-100 uppercase tracking-widest border border-blue-500/30">
                  Expenditure Index
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {leadersLoading ? <div className="py-20 text-center"><div className="adm-spinner mx-auto mb-4"></div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aggregating Statistics...</p></div> :
                 leaders.buyers?.length === 0 ? <div className="py-20 text-center text-slate-300"><Users size={40} className="mx-auto mb-3 opacity-20"/><p className="text-[10px] font-black uppercase tracking-widest">No purchase records found</p></div> : (
                  leaders.buyers.map((b, i) => (
                    <div key={i} className={`group flex items-center p-4 rounded-[2rem] border transition-all duration-300 ${i === 0 ? 'bg-blue-50/50 border-blue-100 shadow-inner' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-lg'}`}>
                      <div className="flex flex-col gap-3 w-full">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center font-black text-lg shadow-lg relative ${
                            i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white' : 
                            i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' : 
                            i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 
                            'bg-white border border-slate-200 text-slate-400'
                          }`}>
                            {i < 3 ? getRankIcon(i) : i + 1}
                            {i < 3 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] font-black text-slate-900 border border-slate-100 shadow-sm">{i+1}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-sm text-slate-900 truncate leading-tight">{b.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              Rank #{i+1}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-end justify-between bg-white/50 p-3 rounded-2xl border border-slate-100/50">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-1">
                              {b.badges?.length > 0 ? b.badges.map((bg, bi) => (
                                <span key={bi} className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200/50">
                                  {bg}
                                </span>
                              )) : (
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 italic">No Badges</span>
                              )}
                            </div>
                            <button onClick={() => handleAwardBadge(b.id)} className="text-[8px] font-black uppercase tracking-widest text-blue-600 mt-2 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                              Award Merit
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-[13px] font-black text-slate-900 tracking-tight">
                              {Number(b.metric_value).toLocaleString()}
                            </div>
                            <div className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-0.5">DZD SPENT</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Transporters */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40">
              <div className="bg-amber-600 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <Truck size={20} className="text-amber-200" />
                  <h3 className="font-black text-sm uppercase tracking-widest">Top Transporters</h3>
                </div>
                <div className="bg-amber-700/50 px-3 py-1 rounded-full text-[9px] font-black text-amber-100 uppercase tracking-widest border border-amber-500/30">
                  Mission Index
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {leadersLoading ? <div className="py-20 text-center"><div className="adm-spinner mx-auto mb-4"></div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aggregating Statistics...</p></div> :
                 leaders.transporters?.length === 0 ? <div className="py-20 text-center text-slate-300"><Truck size={40} className="mx-auto mb-3 opacity-20"/><p className="text-[10px] font-black uppercase tracking-widest">No logistics records found</p></div> : (
                  leaders.transporters.map((t, i) => (
                    <div key={i} className={`group flex items-center p-4 rounded-[2rem] border transition-all duration-300 ${i === 0 ? 'bg-amber-50/50 border-amber-100 shadow-inner' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-lg'}`}>
                      <div className="flex flex-col gap-3 w-full">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center font-black text-lg shadow-lg relative ${
                            i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white' : 
                            i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' : 
                            i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 
                            'bg-white border border-slate-200 text-slate-400'
                          }`}>
                            {i < 3 ? getRankIcon(i) : i + 1}
                            {i < 3 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] font-black text-slate-900 border border-slate-100 shadow-sm">{i+1}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-sm text-slate-900 truncate leading-tight">{t.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              Rank #{i+1}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-end justify-between bg-white/50 p-3 rounded-2xl border border-slate-100/50">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-1">
                              {t.badges?.length > 0 ? t.badges.map((b, bi) => (
                                <span key={bi} className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200/50">
                                  {b}
                                </span>
                              )) : (
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 italic">No Badges</span>
                              )}
                            </div>
                            <button onClick={() => handleAwardBadge(t.id)} className="text-[8px] font-black uppercase tracking-widest text-amber-600 mt-2 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                              Award Merit
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-[13px] font-black text-slate-900 tracking-tight">
                              {Number(t.metric_value).toLocaleString()}
                            </div>
                            <div className="text-[8px] font-black text-amber-600 uppercase tracking-widest mt-0.5">TRIPS</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>


        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
