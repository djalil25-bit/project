import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  FileText, Package, Wheat, Calendar, Search, Filter, Plus, 
  Pencil, Trash2, X, ChevronRight, TrendingUp, CheckCircle, 
  AlertTriangle, Home, AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import api from '../../api/axiosConfig';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export default function HarvestsPage() {
  const { showToast } = useToast();
  const formRef = useRef(null);

  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [selectedFarm, setSelectedFarm] = useState('all');
  const [searchCrop, setSearchCrop] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    farm: '', crop_name: '', year: new Date().getFullYear(),
    quantity_produced: '', unit: 'KG',
    record_date: new Date().toISOString().split('T')[0], notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formError, setFormError] = useState(null);

  const fetchFarms = useCallback(async () => {
    try {
      const res = await api.get('/farms/');
      setFarms(res.data.results || res.data || []);
    } catch (err) { console.error('Farms fetch error:', err); }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/harvests/stats/');
      setStats(res.data);
    } catch (err) { console.error('Stats fetch error:', err); }
    finally { setStatsLoading(false); }
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      if (selectedFarm !== 'all') qp.append('farm_id', selectedFarm);
      if (searchCrop) qp.append('crop', searchCrop);
      if (filterYear) qp.append('year', filterYear);
      const res = await api.get(`/harvests/?${qp.toString()}`);
      setRecords(res.data.results || res.data || []);
    } catch (err) { console.error('Records fetch error:', err); }
    finally { setLoading(false); }
  }, [selectedFarm, searchCrop, filterYear]);

  useEffect(() => { fetchFarms(); fetchStats(); }, [fetchFarms, fetchStats]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const openForm = () => {
    setShowForm(true);
    setEditingId(null);
    setFormError(null);
    setFormData({
      farm: '', crop_name: '', year: new Date().getFullYear(),
      quantity_produced: '', unit: 'KG',
      record_date: new Date().toISOString().split('T')[0], notes: ''
    });
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setFormData({
      farm: record.farm, crop_name: record.crop_name, year: record.year,
      quantity_produced: record.quantity_produced, unit: record.unit,
      record_date: record.record_date, notes: record.notes || ''
    });
    setShowForm(true);
    setFormError(null);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      farm: '', crop_name: '', year: new Date().getFullYear(),
      quantity_produced: '', unit: 'KG',
      record_date: new Date().toISOString().split('T')[0], notes: ''
    });
    setShowForm(false);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (Number(formData.year) > new Date().getFullYear()) {
      setFormError("Year cannot be in the future.");
      return;
    }
    if (Number(formData.quantity_produced) <= 0) {
      setFormError("Quantity must be greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/harvests/${editingId}/`, formData);
        showToast("Harvest record updated!", 'success');
      } else {
        await api.post('/harvests/', formData);
        showToast("Harvest record saved!", 'success');
      }
      resetForm();
      fetchRecords();
      fetchStats();
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save record.';
      setFormError(msg);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/harvests/${id}/`);
      showToast("Record deleted.", 'success');
      setDeleteConfirmId(null);
      fetchRecords();
      fetchStats();
    } catch (err) {
      showToast("Failed to delete record.", 'error');
    }
  };

  const totalRecords = useMemo(() => Math.max(stats?.total_records || 0, records.length), [stats, records]);
  const totalQuantity = useMemo(() => Math.max(stats?.total_quantity || 0, records.reduce((sum, r) => sum + (Number(r.quantity_produced) || 0), 0)), [stats, records]);
  const varietyCount = useMemo(() => Math.max(stats?.by_crop?.length || 0, new Set(records.map(r => r.crop_name)).size), [stats, records]);
  const latestYear = useMemo(() => {
    const sYear = stats?.by_year?.[0]?.year;
    if (sYear) return sYear;
    if (records.length === 0) return 'N/A';
    return Math.max(...records.map(r => r.year));
  }, [stats, records]);

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20 animate-fade-in relative z-0">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-8">

        {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-5 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
          <Link to="/farmer-dashboard" className="hover:text-[#255933] transition-colors">Farmer Hub</Link>
          <ChevronRight size={10} className="text-[#2E6F40]/40" />
          <span className="text-[#2E6F40] flex items-center gap-1.5">
            <Wheat size={11} /> Harvest Records
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#2E6F40]">
                <Wheat size={22} strokeWidth={2.5} />
              </div>
              Registry of <span className="text-[#2E6F40]">Harvests</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">Track and analyze your farm yields over time.</p>
          </div>
          
          <button 
            onClick={openForm}
            className="inline-flex items-center gap-2 bg-[#2E6F40] hover:bg-[#255933] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 border-0"
            type="button"
          >
            <Plus size={16} strokeWidth={3} /> Add New Harvest
          </button>
        </div>

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <FileText size={20} />, bg: 'bg-slate-50 text-slate-400', label: 'Total Records', val: statsLoading ? '...' : totalRecords },
            { icon: <Package size={20} />, bg: 'bg-emerald-50 text-emerald-600', label: 'Total Quantity', val: statsLoading ? '...' : `${totalQuantity.toLocaleString()} KG` },
            { icon: <Wheat size={20} />, bg: 'bg-[#f0faf4] text-[#2E6F40]', label: 'Crops Variety', val: statsLoading ? '...' : varietyCount },
            { icon: <Calendar size={20} />, bg: 'bg-blue-50 text-blue-600', label: 'Latest Year', val: statsLoading ? '...' : latestYear },
          ].map((k, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-[2rem] p-7 shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex flex-col items-center text-center group hover:border-[#2E6F40]/30 transition-all">
              <div className={`w-12 h-12 rounded-2xl ${k.bg} flex items-center justify-center mb-4 shadow-sm border border-black/5`}>
                {k.icon}
              </div>
              <div className="text-[14px] font-black text-slate-900 mb-1">{k.val}</div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-tight">
                {k.label}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        {stats && stats.total_records > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Production by Crop</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Aggregate Yields</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#f0faf4] flex items-center justify-center text-[#2E6F40] border border-[#cee8d9]">
                  <TrendingUp size={20} strokeWidth={2.5} />
                </div>
              </div>
              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.by_crop}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="crop_name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="total_quantity" name="Quantity" fill="#2E6F40" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Production Over Years</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Annual Trends</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
              </div>
              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.by_year}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="total_quantity" name="Quantity" stroke="#3b82f6" strokeWidth={3}
                      dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Table + Form */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* Records Table */}
          <div className="xl:col-span-7">
            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
              {/* Filters Bar */}
              <div className="p-4 bg-white border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] group">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2E6F40] transition-colors" strokeWidth={3} />
                    <input 
                      type="text" 
                      placeholder="SEARCH HARVEST RECORDS..." 
                      value={searchCrop}
                      onChange={(e) => setSearchCrop(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/5 focus:border-[#2E6F40] transition-all"
                    />
                  </div>
                  <div className="relative">
                    <select 
                      value={selectedFarm} 
                      onChange={(e) => setSelectedFarm(e.target.value)}
                      className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <option value="all text-slate-400">All Farms</option>
                      {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <Filter size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={3} />
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="YEAR" 
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="w-24 pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-16 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-[#2E6F40] rounded-full animate-spin" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading...</span>
                  </div>
                ) : records.length === 0 ? (
                  <div className="p-20 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                      <Wheat size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No harvest records yet</h3>
                    <p className="text-slate-500 max-w-xs mb-8">Start recording your farm harvests to track production.</p>
                    <button onClick={openForm} type="button"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#2E6F40] text-white rounded-xl font-bold shadow-md cursor-pointer">
                      <Plus size={18} strokeWidth={3} /> Add First Record
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#2E6F40] text-[#cee8d9] uppercase text-[9px] font-black tracking-widest">
                        <th className="px-6 py-4">Crop Identity</th>
                        <th className="px-6 py-4">Farm Origin</th>
                        <th className="px-6 py-4 text-center">Harvest Cycle</th>
                        <th className="px-6 py-4 text-right">Yield Volume</th>
                        <th className="px-6 py-4 text-center">Ops</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {records.map(r => (
                        <tr key={r.id} className="bg-white hover:bg-[#f0faf4]/40 transition-colors group border-b border-slate-50 last:border-b-0">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2E6F40] flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                                <Wheat size={14} />
                              </div>
                              <div>
                                <div className="font-black text-[11px] text-slate-800 tracking-tight uppercase">{r.crop_name}</div>
                                {r.notes && <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 line-clamp-1 max-w-[120px]">{r.notes}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-tight">
                              <Home size={12} className="text-[#2E6F40]" strokeWidth={2.5} /> {r.farm_name || '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[9px] font-black text-slate-600 tabular-nums uppercase tracking-widest">{r.year}</span>
                              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">{r.record_date ? new Date(r.record_date).toLocaleDateString() : '—'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-black text-[11px] text-[#2E6F40] tabular-nums">
                              {typeof r.quantity_produced === 'number' ? r.quantity_produced.toLocaleString() : r.quantity_produced} <span className="text-[9px] text-slate-400 uppercase">{r.unit}S</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {deleteConfirmId === r.id ? (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleDelete(r.id)} className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded-xl shadow-sm active:scale-95">
                                  <CheckCircle size={14} />
                                </button>
                                <button onClick={() => setDeleteConfirmId(null)} className="w-8 h-8 flex items-center justify-center bg-white text-slate-400 border border-slate-200 rounded-xl shadow-sm active:scale-95">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2 transition-all">
                                <button onClick={() => handleEdit(r)} className="w-8 h-8 flex items-center justify-center bg-white text-[#2E6F40] border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 shadow-sm transition-all active:scale-95">
                                  <Pencil size={14} strokeWidth={2.5} />
                                </button>
                                <button onClick={() => setDeleteConfirmId(r.id)} className="w-8 h-8 flex items-center justify-center bg-white text-red-500 border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 shadow-sm transition-all active:scale-95">
                                  <Trash2 size={14} strokeWidth={2.5} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="xl:col-span-5" ref={formRef}>
            <div className={`bg-white rounded-[2rem] border-2 shadow-2xl p-8 lg:p-10 sticky top-8 transition-all duration-500 ${showForm ? 'border-[#2E6F40]/30 opacity-100 scale-100 translate-y-0' : 'border-slate-100 opacity-90 scale-[0.98] translate-y-2'}`}>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${editingId ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50 border-emerald-100 text-[#2E6F40]'}`}>
                      {editingId ? <Pencil size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                    </div>
                    {editingId ? 'Edit Record' : 'Add Record'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-11">Yield Documentation</p>
                </div>
                {(showForm || editingId) && (
                  <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={18} /></button>
                )}
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-wider animate-shake">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Origin Farm</label>
                  <div className="relative group">
                    <select required value={formData.farm} onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all appearance-none cursor-pointer">
                      <option value="">Select a farm...</option>
                      {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <ChevronRight size={14} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none group-focus-within:text-[#2E6F40]" strokeWidth={3} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Crop Variety</label>
                  <input type="text" required placeholder="E.G. WHEAT, TOMATOES..."
                    value={formData.crop_name} onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 uppercase tracking-widest placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cycle Year</label>
                    <input type="number" required max={new Date().getFullYear()} value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 tabular-nums focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Entry Date</label>
                    <input type="date" required value={formData.record_date}
                      onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8 flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Yield Quantity</label>
                    <input type="number" step="0.1" required placeholder="0.0"
                      value={formData.quantity_produced} onChange={(e) => setFormData({ ...formData, quantity_produced: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 tabular-nums focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all" />
                  </div>
                  <div className="col-span-4 flex flex-col gap-2 text-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unit</label>
                    <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-2 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-700 uppercase focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all appearance-none text-center cursor-pointer">
                      <option value="KG">KG</option>
                      <option value="TON">TON</option>
                      <option value="LITER">LITER</option>
                      <option value="PIECE">PIECE</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Production Observations</label>
                  <textarea rows="4" placeholder="QUALITY DETAILS, BATCH NOTES..."
                    value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] text-xs font-semibold text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all resize-none leading-relaxed" />
                </div>

                <div className="pt-4 space-y-3">
                  <button type="submit" disabled={submitting}
                    className="w-full py-4 bg-[#2E6F40] hover:bg-[#255933] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(46,111,64,0.2)] transition-all active:scale-[0.98] disabled:opacity-50">
                    {submitting ? 'PROCESSING...' : editingId ? 'UPDATE REQUISITION' : 'AUTHORIZE RECORD'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm}
                      className="w-full py-4 bg-white text-slate-400 hover:text-slate-600 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98]">
                      ABORT
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
