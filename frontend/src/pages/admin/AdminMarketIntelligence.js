import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import {
  BarChart2, Plus, Edit3, Trash2, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Search, X, Save, Bell, Activity, Clock, Filter
} from 'lucide-react';

const TREND = {
  INCREASING: { icon: TrendingUp, color: '#059669', bg: '#ecfdf5', label: 'Increasing' },
  DECREASING: { icon: TrendingDown, color: '#dc2626', bg: '#fef2f2', label: 'Decreasing' },
  STABLE: { icon: Minus, color: '#6366f1', bg: '#eef2ff', label: 'Stable' },
};
const CATS = ['VEGETABLES','FRUITS','CEREALS','LEGUMES','DAIRY','MEAT','OTHER'];
const UNITS = ['KG','Quintal','Ton','Box','Unit','Liter'];

const EMPTY = { product_name:'', category:'VEGETABLES', current_price:'', unit:'KG', trend:'STABLE', market_note:'', is_highlighted:false, highlight_message:'' };

export default function AdminMarketIntelligence() {
  const [prices, setPrices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({...EMPTY});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = async () => {
    try {
      const [pr, sm] = await Promise.all([
        api.get('/market/admin/prices/'),
        api.get('/market/summary/'),
      ]);
      setPrices(pr.data.results || pr.data || []);
      setSummary(sm.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const showMsg = (type, text) => { setMsg({type,text}); setTimeout(()=>setMsg(null),4000); };

  const openCreate = () => { setForm({...EMPTY}); setEditId(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ product_name:p.product_name, category:p.category, current_price:p.current_price, unit:p.unit, trend:p.trend, market_note:p.market_note||'', is_highlighted:p.is_highlighted, highlight_message:p.highlight_message||'' });
    setEditId(p.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.product_name || !form.current_price) { showMsg('error','Product name and price are required'); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/market/admin/prices/${editId}/`, form);
        showMsg('success','Market price updated successfully');
      } else {
        await api.post('/market/admin/prices/', form);
        showMsg('success','Market price created successfully');
      }
      setShowForm(false); setEditId(null); fetchData();
    } catch (e) {
      showMsg('error', e.response?.data?.detail || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/market/admin/prices/${id}/`);
      showMsg('success','Market price deleted');
      setDeleteConfirm(null); fetchData();
    } catch { showMsg('error','Delete failed'); }
  };

  const filtered = prices.filter(p => {
    const ms = p.product_name.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'ALL' || p.category === catFilter;
    return ms && mc;
  });

  return (
    <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'1.5rem' }}>
      {/* Hero Header */}
      <div style={{ background:'linear-gradient(135deg,#059669,#047857,#064e3b)', borderRadius:'24px', padding:'2rem 2.5rem', marginBottom:'2rem', color:'#fff', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'200px', height:'200px', background:'rgba(255,255,255,0.06)', borderRadius:'50%' }} />
        <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem' }}>
              <BarChart2 size={20} />
              <span style={{ fontSize:'0.6rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'1.5px', opacity:0.7 }}>Administration Panel</span>
            </div>
            <h1 style={{ margin:0, fontSize:'1.8rem', fontWeight:900, letterSpacing:'-0.5px' }}>Market Intelligence</h1>
            <p style={{ margin:'0.5rem 0 0', fontSize:'0.8rem', fontWeight:600, opacity:0.8 }}>Manage official market prices, trends, and alerts</p>
          </div>
          <button onClick={openCreate} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.85rem 1.5rem', background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.3)', borderRadius:'14px', color:'#fff', fontWeight:800, fontSize:'0.85rem', cursor:'pointer', backdropFilter:'blur(8px)', transition:'all 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.25)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
            <Plus size={18} /> Add Market Price
          </button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem', flexWrap:'wrap' }}>
            {[
              { label:'Total Products', value:summary.total_products, icon:BarChart2 },
              { label:'Increasing', value:summary.increasing, icon:TrendingUp, color:'#a7f3d0' },
              { label:'Decreasing', value:summary.decreasing, icon:TrendingDown, color:'#fca5a5' },
              { label:'Stable', value:summary.stable, icon:Minus, color:'#c7d2fe' },
              { label:'Active Alerts', value:summary.active_alerts, icon:AlertTriangle, color:'#fde68a' },
            ].map((s,i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'14px', padding:'0.75rem 1.25rem', display:'flex', alignItems:'center', gap:'0.75rem', minWidth:'140px' }}>
                <s.icon size={16} color={s.color || '#fff'} />
                <div>
                  <div style={{ fontSize:'0.55rem', fontWeight:800, opacity:0.6, textTransform:'uppercase', letterSpacing:'1px' }}>{s.label}</div>
                  <div style={{ fontSize:'1.2rem', fontWeight:900 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:'220px' }}>
          <Search size={16} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..." style={{ width:'100%', padding:'0.7rem 0.7rem 0.7rem 2.5rem', borderRadius:'12px', border:'1.5px solid #e2e8f0', fontSize:'0.85rem', fontWeight:600, outline:'none', background:'#fff' }} />
        </div>
        <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap' }}>
          {['ALL',...CATS].map(c => (
            <button key={c} onClick={()=>setCatFilter(c)} style={{ padding:'0.5rem 0.85rem', borderRadius:'10px', border:'none', background: catFilter===c ? '#059669' : '#f1f5f9', color: catFilter===c ? '#fff' : '#64748b', fontWeight:800, fontSize:'0.7rem', cursor:'pointer', transition:'all 0.2s', textTransform:'capitalize' }}>
              {c==='ALL' ? 'All' : c.charAt(0)+c.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:'20px', border:'1.5px solid #e2e8f0', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div style={{ padding:'4rem', textAlign:'center' }}>
            <div style={{ width:'40px', height:'40px', border:'4px solid #e2e8f0', borderTopColor:'#059669', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }} />
            <span style={{ fontSize:'0.75rem', fontWeight:800, color:'#94a3b8' }}>Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'4rem', textAlign:'center', color:'#94a3b8' }}>
            <BarChart2 size={48} style={{ marginBottom:'1rem', opacity:0.3 }} />
            <p style={{ fontWeight:800 }}>No market prices found</p>
            <button onClick={openCreate} style={{ marginTop:'1rem', padding:'0.7rem 1.5rem', background:'#059669', color:'#fff', border:'none', borderRadius:'12px', fontWeight:800, cursor:'pointer' }}>
              <Plus size={14} style={{ marginRight:'0.4rem', verticalAlign:'-2px' }} /> Add First Price
            </button>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                {['Product','Category','Price','Unit','Trend','Change','Alert','Note','Actions'].map(h => (
                  <th key={h} style={{ padding:'0.75rem 0.85rem', fontSize:'0.58rem', fontWeight:900, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1px', textAlign: h==='Price'||h==='Change' ? 'right' : h==='Actions' ? 'center' : 'left', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const tc = TREND[p.trend] || TREND.STABLE;
                const Ic = tc.icon;
                return (
                  <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9', transition:'background 0.15s' }} onMouseEnter={e=>e.currentTarget.style.background='#fafafa'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'0.8rem 0.85rem', fontWeight:800, fontSize:'0.88rem', color:'#0f172a' }}>{p.product_name}</td>
                    <td style={{ padding:'0.8rem 0.85rem' }}>
                      <span style={{ fontSize:'0.63rem', fontWeight:800, color:'#64748b', background:'#f1f5f9', padding:'0.2rem 0.5rem', borderRadius:'6px' }}>{p.category_display}</span>
                    </td>
                    <td style={{ padding:'0.8rem 0.85rem', textAlign:'right', fontWeight:900, fontSize:'0.95rem', color:'#0f172a' }}>{parseFloat(p.current_price).toLocaleString()} <span style={{ fontSize:'0.55rem', color:'#94a3b8' }}>DA</span></td>
                    <td style={{ padding:'0.8rem 0.85rem', fontSize:'0.78rem', fontWeight:700, color:'#64748b' }}>/{p.unit}</td>
                    <td style={{ padding:'0.8rem 0.85rem' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', background:tc.bg, color:tc.color, padding:'0.25rem 0.6rem', borderRadius:'8px', fontSize:'0.68rem', fontWeight:800 }}>
                        <Ic size={11} /> {tc.label}
                      </span>
                    </td>
                    <td style={{ padding:'0.8rem 0.85rem', textAlign:'right', fontWeight:800, fontSize:'0.78rem', color: p.price_change_percentage>0?'#059669':p.price_change_percentage<0?'#dc2626':'#94a3b8' }}>
                      {p.price_change_percentage !== 0 ? `${p.price_change_percentage>0?'+':''}${p.price_change_percentage}%` : '—'}
                    </td>
                    <td style={{ padding:'0.8rem 0.85rem', textAlign:'center' }}>
                      {p.is_highlighted ? <AlertTriangle size={14} color="#d97706" /> : <span style={{ color:'#e2e8f0' }}>—</span>}
                    </td>
                    <td style={{ padding:'0.8rem 0.85rem', maxWidth:'150px' }}>
                      <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>{p.market_note || '—'}</span>
                    </td>
                    <td style={{ padding:'0.8rem 0.85rem', textAlign:'center' }}>
                      <div style={{ display:'flex', gap:'0.4rem', justifyContent:'center' }}>
                        <button onClick={()=>openEdit(p)} style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#eef2ff', border:'none', color:'#4f46e5', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }} title="Edit"><Edit3 size={14} /></button>
                        <button onClick={()=>setDeleteConfirm(p.id)} style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#fef2f2', border:'none', color:'#dc2626', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.7)', backdropFilter:'blur(8px)', padding:'1rem' }} onClick={()=>setShowForm(false)}>
          <div style={{ background:'#fff', borderRadius:'24px', width:'100%', maxWidth:'600px', maxHeight:'90vh', overflow:'auto', padding:'2rem', boxShadow:'0 40px 80px rgba(0,0,0,0.3)', animation:'scaleUp 0.3s ease' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ margin:0, fontSize:'1.3rem', fontWeight:900, color:'#0f172a' }}>{editId ? 'Edit Market Price' : 'Add Market Price'}</h2>
              <button onClick={()=>setShowForm(false)} style={{ background:'#f1f5f9', border:'none', borderRadius:'10px', width:'36px', height:'36px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}><X size={18} /></button>
            </div>

            <div style={{ display:'grid', gap:'1rem' }}>
              <div>
                <label style={lbl}>Product Name *</label>
                <input value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} style={inp} placeholder="e.g. Tomato" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={inp}>
                    {CATS.map(c => <option key={c} value={c}>{c.charAt(0)+c.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Unit</label>
                  <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} style={inp}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div>
                  <label style={lbl}>Price (DA) *</label>
                  <input type="number" value={form.current_price} onChange={e=>setForm({...form,current_price:e.target.value})} style={inp} placeholder="120" />
                </div>
                <div>
                  <label style={lbl}>Trend</label>
                  <select value={form.trend} onChange={e=>setForm({...form,trend:e.target.value})} style={inp}>
                    <option value="INCREASING">↑ Increasing</option>
                    <option value="DECREASING">↓ Decreasing</option>
                    <option value="STABLE">→ Stable</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Market Note (optional)</label>
                <textarea value={form.market_note} onChange={e=>setForm({...form,market_note:e.target.value})} style={{...inp, height:'70px', resize:'vertical'}} placeholder="e.g. High demand expected this week" />
              </div>
              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'14px', padding:'1rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' }}>
                    <input type="checkbox" checked={form.is_highlighted} onChange={e=>setForm({...form,is_highlighted:e.target.checked})} style={{ width:'16px', height:'16px', accentColor:'#d97706' }} />
                    <span style={{ fontWeight:800, fontSize:'0.8rem', color:'#92400e' }}>
                      <AlertTriangle size={13} style={{ verticalAlign:'-2px', marginRight:'0.3rem' }} />
                      Highlight as Market Alert
                    </span>
                  </label>
                </div>
                {form.is_highlighted && (
                  <div>
                    <label style={{...lbl, color:'#92400e'}}>Alert Message</label>
                    <input value={form.highlight_message} onChange={e=>setForm({...form,highlight_message:e.target.value})} style={{...inp, borderColor:'#fde68a'}} placeholder="e.g. Tomato prices increased by 15%" />
                    <div style={{ fontSize:'0.6rem', fontWeight:600, color:'#b45309', marginTop:'0.4rem', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                      <Bell size={10} /> Farmers and buyers will be notified
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowForm(false)} style={{ padding:'0.75rem 1.5rem', borderRadius:'12px', border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b', fontWeight:800, fontSize:'0.85rem', cursor:'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding:'0.75rem 1.5rem', borderRadius:'12px', border:'none', background:'#059669', color:'#fff', fontWeight:800, fontSize:'0.85rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem', boxShadow:'0 4px 14px rgba(5,150,105,0.3)', opacity: saving?0.7:1 }}>
                <Save size={16} /> {saving ? 'Saving...' : editId ? 'Update Price' : 'Create Price'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.7)', backdropFilter:'blur(8px)' }} onClick={()=>setDeleteConfirm(null)}>
          <div style={{ background:'#fff', borderRadius:'20px', padding:'2rem', maxWidth:'400px', width:'100%', textAlign:'center', boxShadow:'0 30px 60px rgba(0,0,0,0.3)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'#fef2f2', color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}><Trash2 size={24} /></div>
            <h3 style={{ margin:'0 0 0.5rem', fontWeight:900, color:'#0f172a' }}>Delete Market Price?</h3>
            <p style={{ color:'#64748b', fontSize:'0.85rem', marginBottom:'1.5rem' }}>This action cannot be undone.</p>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button onClick={()=>setDeleteConfirm(null)} style={{ padding:'0.7rem 1.5rem', borderRadius:'12px', border:'1.5px solid #e2e8f0', background:'#fff', fontWeight:800, cursor:'pointer', color:'#64748b' }}>Cancel</button>
              <button onClick={()=>handleDelete(deleteConfirm)} style={{ padding:'0.7rem 1.5rem', borderRadius:'12px', border:'none', background:'#dc2626', color:'#fff', fontWeight:800, cursor:'pointer', boxShadow:'0 4px 14px rgba(220,38,38,0.3)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {msg && (
        <div style={{ position:'fixed', bottom:'2rem', right:'2rem', zIndex:3000, background: msg.type==='success'?'#065f46':'#991b1b', color:'#fff', padding:'1rem 1.5rem', borderRadius:'14px', fontWeight:800, fontSize:'0.85rem', boxShadow:'0 20px 40px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', gap:'0.5rem', animation:'slideIn 0.3s ease' }}>
          {msg.type==='success' ? <Activity size={16} /> : <AlertTriangle size={16} />} {msg.text}
        </div>
      )}

      <style>{`
        @keyframes scaleUp { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

const lbl = { display:'block', fontSize:'0.68rem', fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.35rem' };
const inp = { width:'100%', padding:'0.7rem 0.85rem', borderRadius:'12px', border:'1.5px solid #e2e8f0', fontSize:'0.88rem', fontWeight:600, color:'#0f172a', outline:'none', background:'#f8fafc', boxSizing:'border-box' };
