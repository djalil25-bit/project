import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import adminApi from '../../api/adminApi';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Package, Trophy, Medal, Award, Calendar, ChevronRight, MapPin, Eye, Download, Users, Truck, Crown, ShieldCheck, Star, Mail, Phone, Zap } from 'lucide-react';

const tooltipStyle = { borderRadius:10, border:'1px solid #E5E7EB', background:'#fff', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', color:'#1F2937' };

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getRankIcon = i => i===0?<Trophy size={18}/>:i===1?<Medal size={18}/>:<Award size={18}/>;
const getRankColors = i => i===0?'bg-yellow-50 text-yellow-600 border-yellow-200':i===1?'bg-slate-100 text-slate-500 border-slate-200':'bg-amber-50 text-amber-600 border-amber-200';

const AdminAnalytics = () => {
  const navigate = useNavigate();
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
      .then(res => {
        console.log("Leaderboard Data:", res.data);
        setLeaders(res.data || { sellers: [], buyers: [], transporters: [] });
      })
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
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 animate-fade-in relative z-0 min-h-screen">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#064e3b] mb-6 bg-[#064e3b]/10 px-3 py-1 rounded-full w-fit border border-[#064e3b]/20 shadow-sm">
        <button onClick={() => navigate('/admin-dashboard')} className="hover:text-emerald-700 transition-colors uppercase font-black flex items-center gap-1.5">
          <TrendingUp size={10} /> Admin Hub
        </button>
        <ChevronRight size={10} className="text-[#064e3b]/40" />
        <span className="text-[#064e3b] flex items-center gap-1.5 font-black uppercase">
          <Activity size={11} /> Insights & Reports
        </span>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className={`p-2 bg-white rounded-2xl shadow-sm border border-slate-100 text-[#064e3b]`}>
              <TrendingUp size={24} />
            </div>
            Platform <span className="text-[#064e3b]">Analytics</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
            Ecosystem metrics, product performance, and institutional data reporting.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-[1.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 shadow-inner">
            <Calendar className="text-[#064e3b]" size={16}/>
            <select className="bg-transparent text-[#064e3b] text-[11px] font-black uppercase tracking-widest outline-none focus:outline-none focus:ring-0 cursor-pointer appearance-none pl-1 pr-2" value={timeframe} onChange={e=>setTimeframe(e.target.value)}>
              <option value="all">ALL TIME</option>
              <option value="year">THIS YEAR</option>
              <option value="month">THIS MONTH</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner w-full sm:w-fit mb-10">
        {tabs.map(t=>(
          <button key={t.key} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab===t.key?'bg-white text-[#064e3b] shadow-md border border-emerald-100':'text-slate-400 hover:text-slate-600'}`} onClick={()=>setActiveTab(t.key)}>
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
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#064e3b]">
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
                {l:'Total Units Sold', v: prodData.total_units, i: <Package size={18}/>, c: 'emerald'},
                {l:'Total Revenue', v: `${Number(prodData.total_revenue).toLocaleString()}`, s:'DZD', i: <span className="font-black text-xs">DZ</span>, c: 'teal'},
                {l:'Unique Sellers', v: prodData.unique_sellers, i: <MapPin size={18}/>, c: 'amber'},
                {l:'Unique Buyers', v: prodData.unique_buyers, i: <Eye size={18}/>, c: 'blue'},
              ].map((c,i)=>(
                <div key={i} className="group bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden flex flex-col">
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${c.c}-50 opacity-40 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-700 pointer-events-none`} />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 shadow-inner border border-emerald-100 bg-emerald-50 text-[#064e3b] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
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
                    Top Performing Farmers
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {prodData.top_sellers.map((s,i)=>(
                    <div key={i} className="group p-6 rounded-3xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-emerald-900/5 hover:border-emerald-100 transition-all duration-500 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 opacity-0 group-hover:opacity-100 rounded-full blur-2xl transition-opacity duration-700 pointer-events-none" />
                      
                      <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner font-black group-hover:scale-110 transition-transform group-hover:rotate-3 ${getRankColors(i)}`}>
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
                          <span className="block text-[9px] font-black uppercase tracking-[0.15em] text-[#064e3b]/70 mb-1">Revenue</span>
                          <div className="font-black text-emerald-700 text-lg tracking-tight">{Number(s.revenue).toLocaleString()} <span className="text-[10px] text-[#064e3b]/70 font-bold uppercase tracking-widest">DZ</span></div>
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
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center font-black text-[10px] text-[#064e3b]">DZ</div>
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
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[#064e3b]/80 mb-2 relative z-10">Peak Market Price</label>
                  <span className="text-3xl font-black text-emerald-700 tracking-tight relative z-10">{Number(prodData.max_price).toFixed(0)} <span className="text-[10px] uppercase tracking-widest text-[#064e3b] bg-white/60 px-2 py-1 rounded-lg">DZD</span></span>
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
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 opacity-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#064e3b]">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 tracking-tight">Geographic Market Focus</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Filter data by wilaya or national level</p>
              </div>
            </div>
            <select className="h-12 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 rounded-xl px-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-inner w-full sm:max-w-xs relative z-10 appearance-none cursor-pointer" style={{backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%233b82f6%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto'}} value={selZone || 'All Zones'} onChange={e=>setSelZone(e.target.value)}>
              {zones.map(z=><option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {zoneLoading ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Loading zone data...</div> :
           !zoneData ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Select a zone to view analytics.</div> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {l:'Gross Merchandise Value', v:`${(zoneData.gmv/1e6).toFixed(2)}M`, s:'DZD', i: <span className="font-black text-xs">DZ</span>, c: 'emerald'},
                {l:'Total Orders Completed', v:zoneData.order_count, i: <Package size={18}/>, c: 'blue'},
                {l:'Average Order Value', v:Number(zoneData.avg_order).toLocaleString(), s:'DZD', i: <Activity size={18}/>, c: 'amber'},
                {l:'Active Production Units', v:zoneData.actors.online_farms, i: <MapPin size={18}/>, c: 'green', live: true},
                {l:'Fleet Readiness', v:zoneData.actors.online_vehicles, i: <Truck size={18}/>, c: 'indigo', live: true},
              ].map((c,i)=>(
                <div key={i} className="group bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden flex flex-col">
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${c.c}-50 opacity-40 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-700 pointer-events-none`} />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 shadow-inner border border-emerald-100 bg-emerald-50 text-[#064e3b] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
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
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><Users size={16} className="text-[#064e3b]"/></div>
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
                        <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-emerald-500"/><span className="text-xs font-black uppercase tracking-widest text-[#064e3b]">Farmers</span></div>
                        <span className="text-lg font-black text-slate-900">{zoneData.actors.farmers}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-slate-500"/><span className="text-xs font-black uppercase tracking-widest text-[#064e3b]">Buyers</span></div>
                        <span className="text-lg font-black text-slate-900">{zoneData.actors.buyers}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors">
                        <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-amber-500"/><span className="text-xs font-black uppercase tracking-widest text-[#064e3b]">Fleet</span></div>
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
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"><Package size={16} className="text-[#064e3b]"/></div>
                  Top Moving Products in {selZone}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{zoneData.top_products.map((p,i)=>(
                  <div key={i} className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl font-black shadow-sm group-hover:scale-110 group-hover:text-[#064e3b] transition-transform">{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-base">{(p.product__title || 'Deleted Product').toUpperCase()}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"><span className="text-[#064e3b] font-black">{Number(p.units).toLocaleString()}</span> units sold</div>
                    </div>
                    <div className="text-right bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="text-sm font-black text-emerald-700 tracking-tight">{Number(p.revenue).toLocaleString()} <span className="text-[9px] uppercase tracking-widest text-[#064e3b]/70 font-bold">DZ</span></div>
                    </div>
                  </div>
                ))}</div>
              </div>
            )}
          </>
          )}
        </div>
      )}

      {/* ── LEADERBOARD SECTION (COMPLETE REDESIGN) ───────────────────────────────── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-10 animate-fade-in pb-20">
          
          {/* Header & Global Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-2">
                <Trophy size={14} /> Merit-Based Institutional Rankings
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Platform Hall of Fame</h2>
              <p className="text-slate-500 text-sm mt-1 max-w-xl font-medium">Monitoring top performing actors across the ecosystem based on verified transaction volume, reliability, and trust scores.</p>
            </div>
            
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm self-start md:self-auto">
              <Calendar size={16} className="text-slate-400 ml-2" />
              <select 
                value={leaderYear}
                onChange={(e) => setLeaderYear(e.target.value)}
                className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest py-2 px-3 pr-9 focus:ring-0 outline-none cursor-pointer text-slate-700"
              >
                <option value="All">All-Time Cumulative</option>
                <option value="2026">2026 Fiscal Cycle</option>
                <option value="2025">2025 Fiscal Cycle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* 1. TOP FARMERS (EMERALD) */}
            <LeaderboardCategory 
              title="Top Farmers" 
              subtitle="Production & Revenue Volume"
              data={leaders.sellers} 
              loading={leadersLoading}
              theme="emerald"
              icon={Package}
              metricLabel="Revenue"
              metricSuffix="DZD"
              roleName="Farmer"
              handleAwardBadge={handleAwardBadge}
            />

            {/* 2. TOP BUYERS (EMERALD) */}
            <LeaderboardCategory 
              title="Top Buyers" 
              subtitle="Purchasing & Network Activity"
              data={leaders.buyers} 
              loading={leadersLoading}
              theme="emerald"
              icon={Users}
              metricLabel="Spending"
              metricSuffix="DZD"
              roleName="Buyer"
              handleAwardBadge={handleAwardBadge}
            />

            {/* 3. TOP TRANSPORTERS (EMERALD) */}
            <LeaderboardCategory 
              title="Top Transporters" 
              subtitle="Logistics & Delivery Efficiency"
              data={leaders.transporters} 
              loading={leadersLoading}
              theme="emerald"
              icon={Truck}
              metricLabel="Trips"
              metricSuffix="Missions"
              roleName="Transporter"
              handleAwardBadge={handleAwardBadge}
            />

          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ── LEADERBOARD CATEGORY COMPONENT ──────────────────────────────────────────
 * Encapsulates the clean, grid-based container for each actor type.
 */
const LeaderboardCategory = ({ title, subtitle, data, loading, theme, icon: Icon, metricLabel, metricSuffix, roleName, handleAwardBadge }) => {
  const themeColors = {
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-100', light: 'bg-emerald-50/40', accent: 'bg-emerald-600', ring: 'ring-emerald-500/20' },
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-100', light: 'bg-indigo-50/40', accent: 'bg-indigo-600', ring: 'ring-indigo-500/20' },
    orange: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-100', light: 'bg-orange-50/40', accent: 'bg-orange-600', ring: 'ring-orange-500/20' },
  };
  const colors = themeColors[theme];

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/40 h-full">
      {/* Category Header */}
      <div className={`${colors.bg} px-8 py-6 flex items-center justify-between`}>
        <div>
          <h3 className="text-white font-black text-base tracking-tight uppercase">{title}</h3>
          <p className="text-white/70 text-[9px] font-bold uppercase tracking-[0.1em] mt-0.5">{subtitle}</p>
        </div>
        <Icon size={20} className="text-white/30" />
      </div>

      <div className="flex-1 p-3 space-y-2">
        {loading ? (
          <div className="py-20 text-center">
            <div className={`w-8 h-8 border-4 border-slate-100 border-t-${theme}-500 rounded-full animate-spin mx-auto mb-4`}></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Compiling Rankings...</span>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-20 text-center text-slate-300">
            <Icon size={40} className="mx-auto mb-3 opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest">No verified data records</p>
          </div>
        ) : (
          data.slice(0, 4).map((actor, idx) => (
            <LeaderboardRow 
              key={actor.id || idx} 
              actor={actor} 
              index={idx} 
              colors={colors} 
              metricLabel={metricLabel}
              metricSuffix={metricSuffix}
              roleName={roleName}
            />
          ))
        )}
      </div>
      
      <div className="px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Official Platform Data</span>
      </div>
    </div>
  );
};

/**
 * ── LEADERBOARD ROW COMPONENT ───────────────────────────────────────────────
 * The "Enterprise" row with Initials, Name, Trust, and Metric.
 */
const LeaderboardRow = ({ actor, index, colors, metricLabel, metricSuffix, roleName }) => {
  const isTop1 = index === 0;

  return (
    <div className={`group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
      isTop1 ? `${colors.light} border border-slate-100` : 'bg-slate-50/30 border-transparent hover:bg-white hover:border-slate-200'
    }`}>
      
      {/* 1. RANK & AVATAR */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
          isTop1 ? 'bg-yellow-400 text-yellow-950 shadow-md ring-2 ring-yellow-100' : 'bg-slate-100 text-slate-500'
        }`}>
          #{index + 1}
        </div>
        
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border shadow-sm ${
          isTop1 ? `${colors.bg} text-white border-transparent` : 'bg-white text-slate-400 border-slate-100'
        }`}>
          {getInitials(actor.name)}
        </div>
      </div>

      {/* 2. USER INFO COLUMN (Full Name & Details) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center pl-2 pr-4">
        <div className="flex items-center gap-1.5 mb-1 max-w-full">
          <h4 className="text-[14px] font-black text-slate-900 tracking-tight truncate">
            {actor.name || 'Anonymous Member'}
          </h4>
          {isTop1 && <Crown size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-[10px] font-bold text-slate-500 truncate leading-none lowercase tracking-tight opacity-70">
            {actor.email || 'Email Protected'}
          </div>
        </div>
      </div>

      {/* 3. MAIN STATISTIC */}
      <div className="text-right shrink-0 w-[90px] flex flex-col justify-center border-l border-slate-100 pl-3">
        <div className={`text-[13px] font-black tracking-tight leading-none ${isTop1 ? colors.text : 'text-slate-900'}`}>
          {Number(actor.metric_value).toLocaleString()} 
        </div>
        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1.5">
          {metricSuffix}
        </div>
      </div>

    </div>
  );
};

export default AdminAnalytics;
