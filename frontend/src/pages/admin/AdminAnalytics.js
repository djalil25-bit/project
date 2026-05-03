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
    <div className="min-h-screen p-6 space-y-6 anim-fade-up admin-mode">
      <div className="adm-breadcrumb"><Link to="/admin-dashboard">Dashboard</Link><ChevronRight size={12}/><span>Analytics</span></div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center"><TrendingUp className="text-blue-600" size={24}/></div>
          <div><h1 className="text-xl font-extrabold text-gray-900">Platform Analytics</h1><p className="text-gray-500 text-sm">Product performance, zone analysis, and seller rankings.</p></div>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Calendar className="text-blue-600" size={16}/>
          <select className="bg-transparent text-blue-600 font-bold text-sm outline-none cursor-pointer" value={timeframe} onChange={e=>setTimeframe(e.target.value)}>
            <option value="all">All Time</option><option value="year">This Year</option><option value="month">This Month</option>
          </select>
        </div>
      </div>

      <div className="adm-tab-bar w-fit">
        {tabs.map(t=><button key={t.key} className={`adm-tab ${activeTab===t.key?'active':''}`} onClick={()=>setActiveTab(t.key)}>{t.icon} {t.label}</button>)}
      </div>

      {/* Product Performance */}
      {activeTab==='product' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-600">Product:</label>
            <select className="adm-input w-auto" value={selProductId || ''} onChange={e=>setSelProductId(e.target.value)}>
              {products.map(p=><option key={p.id} value={p.id}>{p.title} ({p.category__name})</option>)}
            </select>
          </div>

          {prodLoading ? <div className="glass-card p-12 text-center text-gray-400">Loading product data...</div> :
           !prodData ? <div className="glass-card p-12 text-center text-gray-400">Select a product to view analytics.</div> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {l:'Total Units Sold', v: prodData.total_units},
                {l:'Total Revenue', v: `${Number(prodData.total_revenue).toLocaleString()}`, s:'DZD'},
                {l:'Unique Sellers', v: prodData.unique_sellers},
                {l:'Unique Buyers', v: prodData.unique_buyers},
              ].map((c,i)=>(
                <div key={i} className="glass-card p-4"><div className="text-xs text-gray-500 mb-1">{c.l}</div><div className="text-xl font-extrabold text-gray-900">{c.v} {c.s&&<span className="text-xs text-gray-400 font-normal">{c.s}</span>}</div></div>
              ))}
            </div>

            {/* Top 3 Sellers */}
            {prodData.top_sellers?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-5"><Trophy size={18} className="text-yellow-500"/> Top Sellers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {prodData.top_sellers.map((s,i)=>(
                    <div key={i} className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:shadow-md transition-shadow anim-scale-in" style={{animationDelay:`${i*0.1}s`}}>
                      <div className="flex items-center justify-between mb-3"><div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">{getRankIcon(i)}</div><span className="text-xs text-gray-400 font-bold">#{s.rank}</span></div>
                      <div className="font-bold text-gray-800 mb-2">{s.farmer__full_name}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-400">Units</span><div className="font-bold text-gray-700">{Number(s.units).toLocaleString()}</div></div>
                        <div><span className="text-gray-400">Revenue</span><div className="font-bold text-blue-600">{Number(s.revenue).toLocaleString()} DZD</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sales Trend */}
            {prodData.trend?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-bold text-gray-800 mb-4">Sales Trend (30 Days)</h3>
                <div style={{width:'100%',height:280}}>
                  <ResponsiveContainer>
                    <AreaChart data={prodData.trend} margin={{top:10,right:10,left:0,bottom:0}}>
                      <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0066CC" stopOpacity={0.2}/><stop offset="95%" stopColor="#0066CC" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:11}} interval={4}/>
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:11}}/>
                      <Tooltip contentStyle={tooltipStyle}/>
                      <Area type="monotone" dataKey="sales" stroke="#0066CC" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Price Analysis */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-gray-800 mb-4">Price Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><label className="adm-label">Average Price</label><span className="text-lg font-bold text-gray-900">{Number(prodData.avg_price).toFixed(0)} DZD</span></div>
                <div><label className="adm-label">Min Price</label><span className="text-lg font-bold text-gray-900">{Number(prodData.min_price).toFixed(0)} DZD</span></div>
                <div><label className="adm-label">Max Price</label><span className="text-lg font-bold text-gray-900">{Number(prodData.max_price).toFixed(0)} DZD</span></div>
              </div>
            </div>
          </>
          )}
        </div>
      )}

      {/* Zone Analysis */}
      {activeTab==='zone' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-600">Zone:</label>
            <select className="adm-input w-auto" value={selZone} onChange={e=>setSelZone(e.target.value)}>
              {zones.map(z=><option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {zoneLoading ? <div className="glass-card p-12 text-center text-gray-400">Loading zone data...</div> :
           !zoneData ? <div className="glass-card p-12 text-center text-gray-400">Select a zone to view analytics.</div> :
           zones.length === 0 ? <div className="glass-card p-12 text-center text-gray-400">No zone data available yet. Orders need wilaya information.</div> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {l:'GMV', v:`${(zoneData.gmv/1e6).toFixed(2)}M`, s:'DZD'},
                {l:'Orders', v:zoneData.order_count},
                {l:'Avg Order', v:Number(zoneData.avg_order).toLocaleString(), s:'DZD'},
                {l:'Farmers', v:zoneData.farmers},
                {l:'Buyers', v:zoneData.buyers},
              ].map((c,i)=>(
                <div key={i} className="glass-card p-4"><div className="text-xs text-gray-500 mb-1">{c.l}</div><div className="text-xl font-extrabold text-gray-900">{c.v} {c.s&&<span className="text-xs text-gray-400 font-normal">{c.s}</span>}</div></div>
              ))}
            </div>

            {zoneData.top_products?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-bold text-gray-800 mb-4">Top Products in {selZone}</h3>
                <div className="space-y-2">{zoneData.top_products.map((p,i)=>(
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-lg font-extrabold text-gray-300 w-6">{i+1}</div>
                    <div className="flex-1"><div className="font-semibold text-gray-800 text-sm">{p.product__title}</div><div className="text-xs text-gray-400">{Number(p.units).toLocaleString()} units</div></div>
                    <div className="text-sm font-bold text-blue-600">{Number(p.revenue).toLocaleString()} DZD</div>
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
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/> Revenue Leaderboard</h3>
            </div>
            {leadersLoading ? <div className="py-8 text-center text-gray-400">Loading leaderboard...</div> :
             leaders.length === 0 ? <div className="py-8 text-center text-gray-400">No sales data available yet.</div> : (
            <div className="space-y-3">
              {leaders.map((s,i)=>(
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">{getRankIcon(i)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800">{s.farmer__full_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-blue-600">{Number(s.revenue).toLocaleString()} <span className="text-xs text-gray-400 font-normal">DZD</span></div>
                    {leaders[0]?.revenue > 0 && <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width:`${(s.revenue/leaders[0].revenue)*100}%`}}/></div>}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Revenue + User charts from existing API */}
          {apiData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-bold text-gray-800 mb-4">Revenue Trend</h3>
                <div style={{width:'100%',height:260}}>
                  {apiData.revenue_trend?.length > 0 ? (
                    <ResponsiveContainer><AreaChart data={apiData.revenue_trend} margin={{top:10,right:10,left:0,bottom:0}}>
                      <defs><linearGradient id="cr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0066CC" stopOpacity={0.2}/><stop offset="95%" stopColor="#0066CC" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:11}}/>
                      <Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="revenue" stroke="#0066CC" strokeWidth={2} fillOpacity={1} fill="url(#cr)"/>
                    </AreaChart></ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No revenue data</div>}
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-bold text-gray-800 mb-4">User Registrations</h3>
                <div style={{width:'100%',height:260}}>
                  {apiData.users_trend?.length > 0 ? (
                    <ResponsiveContainer><BarChart data={apiData.users_trend} margin={{top:10,right:10,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:11}}/>
                      <Tooltip contentStyle={tooltipStyle}/><Bar dataKey="users" fill="#0066CC" radius={[4,4,0,0]}/>
                    </BarChart></ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data</div>}
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
