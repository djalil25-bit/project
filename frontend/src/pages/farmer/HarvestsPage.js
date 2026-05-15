import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  FileText, Package, Wheat, Calendar, Search, Filter, Plus, 
  Pencil, Trash2, X, ChevronRight, TrendingUp, CheckCircle, AlertTriangle
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

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Link to="/farmer-dashboard" className="hover:text-[#2E6F40] transition-colors">Dashboard</Link>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="text-slate-600 flex items-center gap-1"><Wheat size={12} /> Harvest Records</span>
        </div>

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Wheat className="text-[#2E6F40]" size={32} />
              Agricultural Production
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Track and analyze your farm yields over time.</p>
          </div>
          <button 
            onClick={openForm}
            className="relative z-20 inline-flex items-center gap-2 px-6 py-3 bg-[#2E6F40] hover:bg-[#255933] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
            type="button"
          >
            <Plus size={18} strokeWidth={3} /> Add New Harvest
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <FileText size={24} />, bg: 'bg-slate-100 text-slate-600', label: 'Total Records', val: statsLoading ? '...' : totalRecords },
            { icon: <Package size={24} />, bg: 'bg-teal-50 text-teal-600', label: 'Total Quantity', val: statsLoading ? '...' : `${totalQuantity.toLocaleString()} KG` },
            { icon: <Wheat size={24} />, bg: 'bg-emerald-50 text-emerald-600', label: 'Crops Variety', val: statsLoading ? '...' : varietyCount },
            { icon: <Calendar size={24} />, bg: 'bg-blue-50 text-blue-600', label: 'Latest Year', val: statsLoading ? '...' : latestYear },
          ].map((k, i) => (
            <div key={i} className="group bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl ${k.bg} flex items-center justify-center shrink-0`}>{k.icon}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{k.label}</div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{k.val}</div>
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
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              {/* Filters Bar */}
              <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <select value={selectedFarm} onChange={(e) => setSelectedFarm(e.target.value)}
                      className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none appearance-none cursor-pointer">
                      <option value="all">All Farms</option>
                      {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <input type="text" placeholder="Search crop..." value={searchCrop}
                      onChange={(e) => setSearchCrop(e.target.value)}
                      className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none" />
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="relative">
                    <input type="number" placeholder="Year" value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none w-28" />
                    <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {records.length} Records
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
                      <tr className="bg-[#2E6F40] text-[#cee8d9] uppercase text-[10px] tracking-widest font-black">
                        <th className="px-5 py-3">Crop</th>
                        <th className="px-5 py-3">Farm</th>
                        <th className="px-5 py-3">Year</th>
                        <th className="px-5 py-3">Quantity</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map(r => (
                        <tr key={r.id} className="hover:bg-[#f0faf4]/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-black text-slate-900 text-sm">{r.crop_name}</div>
                            {r.notes && <div className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">{r.notes}</div>}
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm font-bold text-slate-600">{r.farm_name || '—'}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600">{r.year}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-black text-[#2E6F40]">
                              {typeof r.quantity_produced === 'number' ? r.quantity_produced.toLocaleString() : r.quantity_produced} {r.unit}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-slate-500 whitespace-nowrap">
                            {r.record_date ? new Date(r.record_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {deleteConfirmId === r.id ? (
                              <div className="flex items-center justify-center gap-2 bg-red-50 p-1 rounded-lg">
                                <button onClick={() => handleDelete(r.id)} type="button"
                                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer shadow-sm">
                                  <CheckCircle size={14} />
                                </button>
                                <button onClick={() => setDeleteConfirmId(null)} type="button"
                                  className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-sm">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEdit(r)} title="Edit" type="button"
                                  className="p-2.5 bg-emerald-50 text-[#2E6F40] rounded-xl hover:bg-[#2E6F40] hover:text-white transition-all border border-emerald-100 cursor-pointer shadow-sm">
                                  <Pencil size={14} strokeWidth={2.5} />
                                </button>
                                <button onClick={() => setDeleteConfirmId(r.id)} title="Delete" type="button"
                                  className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100 cursor-pointer shadow-sm">
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
            <div className={`bg-white rounded-3xl border ${showForm ? 'border-[#2E6F40]/30 shadow-lg' : 'border-slate-200 shadow-sm'} p-6 lg:p-8 sticky top-8 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {editingId ? <Pencil className="text-[#2E6F40]" size={18} /> : <Plus className="text-[#2E6F40]" size={18} />}
                  {editingId ? 'Edit Record' : 'Add Record'}
                </h3>
                {(showForm || editingId) && (
                  <button onClick={resetForm} type="button" className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
                )}
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={14} /> {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1.5">Origin Farm</label>
                  <select required value={formData.farm} onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none appearance-none">
                    <option value="">Select a farm...</option>
                    {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1.5">Crop Name</label>
                  <input type="text" required placeholder="e.g. Wheat, Tomatoes..."
                    value={formData.crop_name} onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1.5">Year</label>
                    <input type="number" required max={new Date().getFullYear()} value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1.5">Date</label>
                    <input type="date" required value={formData.record_date}
                      onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-8">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1.5">Quantity</label>
                    <input type="number" step="0.1" required placeholder="0.0"
                      value={formData.quantity_produced} onChange={(e) => setFormData({ ...formData, quantity_produced: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1.5">Unit</label>
                    <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-2 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none appearance-none text-center">
                      <option value="KG">KG</option>
                      <option value="TON">TON</option>
                      <option value="LITER">LITER</option>
                      <option value="PIECE">PIECE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1.5">Notes (Optional)</label>
                  <textarea rows="3" placeholder="Observations, quality details..."
                    value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none resize-none" />
                </div>

                <div className="pt-2 space-y-3">
                  <button type="submit" disabled={submitting}
                    className="w-full py-3.5 bg-[#2E6F40] hover:bg-[#255933] text-white rounded-2xl font-black shadow-md transition-all disabled:opacity-50 cursor-pointer">
                    {submitting ? 'Saving...' : editingId ? 'Update Record' : 'Save Record'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm}
                      className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all cursor-pointer">
                      Cancel
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
