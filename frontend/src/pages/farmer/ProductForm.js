import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Package, Home, Tag, Image as ImageIcon,
  Save, Info, ShieldCheck, AlertTriangle, ChevronRight, Plus,
  Layers, BadgeCheck, FileText, LayoutGrid, CheckCircle2,
  AlertCircle, X, Edit3
} from 'lucide-react';

export default function ProductForm() {
  const [formData, setFormData] = useState({
    catalog_product: '', description: '', price: '', stock: '',
    farm: '', title: '', category: '', unit: '', quality: 'STANDARD', image: null,
  });
  const [farms, setFarms]           = useState([]);
  const [catalog, setCatalog]       = useState([]);
  const [selCatalog, setSelCatalog] = useState(null);
  const [fieldErrors, setFErrors]   = useState({});
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const navigate    = useNavigate();
  const { id }      = useParams();
  const [qp]        = useSearchParams();
  const isEdit      = !!id;

  useEffect(() => {
    async function loadDeps() {
      try {
        const [farmRes, catRes] = await Promise.all([
          api.get('/farms/'),
          api.get('/catalog-products/'),
        ]);
        const fetchedFarms   = farmRes.data.results || farmRes.data;
        const fetchedCatalog = catRes.data.results  || catRes.data;
        setFarms(fetchedFarms);
        setCatalog(fetchedCatalog);

        const farmParam = qp.get('farm');
        if (farmParam && !id) {
          setFormData(prev => ({ ...prev, farm: farmParam }));
        }

        if (id) {
          const productRes = await api.get(`/products/${id}/`);
          const p = productRes.data;
          setFormData({
            catalog_product: p.catalog_product || '',
            description: p.description || '',
            price: p.price || '',
            stock: p.stock || '',
            farm: p.farm || '',
            title: p.title || '',
            category: p.category || '',
            unit: p.unit || '',
            quality: p.quality || 'STANDARD',
            image: null,
          });
          if (p.catalog_product) {
            const item = fetchedCatalog.find(i => i.id === Number(p.catalog_product));
            if (item) setSelCatalog(item);
          }
        }
      } catch (err) { console.error('Failed to load deps', err); }
    }
    loadDeps();
  }, [id, qp]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (fieldErrors[name]) setFErrors({ ...fieldErrors, [name]: null });

    if (name === 'catalog_product') {
      const item = catalog.find(i => i.id === Number(value));
      setSelCatalog(item || null);
      if (item) {
        setFormData(prev => ({
          ...prev,
          catalog_product: value,
          price: item.ref_price || '',
          title: item.name,
          category: item.category,
          unit: item.default_unit,
        }));
      }
      setFErrors({});
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setFErrors({});

    if (selCatalog) {
      const price = parseFloat(formData.price);
      const rawMinP  = selCatalog.min_price !== null ? parseFloat(selCatalog.min_price) : null;
      const rawMaxP  = selCatalog.max_price !== null ? parseFloat(selCatalog.max_price) : null;
      
      let minP = rawMinP;
      let maxP = rawMaxP;
      if (rawMinP !== null && rawMaxP !== null && !isNaN(rawMinP) && !isNaN(rawMaxP)) {
        minP = Math.min(rawMinP, rawMaxP);
        maxP = Math.max(rawMinP, rawMaxP);
      }

      const tooLow  = minP !== null && !isNaN(minP) && price < minP;
      const tooHigh = maxP !== null && !isNaN(maxP) && price > maxP;
      if (tooLow || tooHigh) {
        const rangeHint = (minP !== null && maxP !== null)
          ? ` Allowed range: ${minP} – ${maxP} DZD.`
          : minP !== null ? ` Minimum: ${minP} DZD.` : ` Maximum: ${maxP} DZD.`;
        setFErrors({ price: 'Your asking price is outside the admin-approved range.' + rangeHint });
        return;
      }
    }

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && (formData[key] !== '' || key === 'description')) {
        data.append(key, formData[key]);
      }
    });
    if (!formData.title && selCatalog) data.set('title', selCatalog.name);

    try {
      if (isEdit) {
        await api.patch(`/products/${id}/`, data);
        setSuccess('Product updated successfully!');
      } else {
        await api.post('/products/', data);
        setSuccess('Product added to marketplace successfully!');
      }
      setTimeout(() => navigate('/farmer-dashboard/products'), 1500);
    } catch (err) {
      const resData = err.response?.data;
      if (resData && typeof resData === 'object') {
        const fieldErrs = {};
        const topMessages = [];
        Object.entries(resData).forEach(([key, val]) => {
          const msg = Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val));
          if (key === 'detail' || key === 'non_field_errors') {
            topMessages.push(msg);
          } else {
            fieldErrs[key] = msg;
            topMessages.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${msg}`);
          }
        });
        setFErrors(fieldErrs);
        setError(topMessages.length > 0 ? topMessages.join(' | ') : 'Submission failed.');
      } else {
        setError('Failed to submit. Please check your connection.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in relative z-0 pb-20">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-5 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
        <Link to="/farmer-dashboard" className="hover:text-[#255933] transition-colors">Farmer Hub</Link>
        <ChevronRight size={10} className="text-[#2E6F40]/40" />
        <Link to="/farmer-dashboard/products" className="hover:text-[#255933] transition-colors">Inventory</Link>
        <ChevronRight size={10} className="text-[#2E6F40]/40" />
        <span className="text-[#2E6F40] flex items-center gap-1.5">
          <BadgeCheck size={11} /> Registration Protocol
        </span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#2E6F40]">
              {isEdit ? <Edit3 size={22} strokeWidth={2.5} /> : <Plus size={22} strokeWidth={2.5} />}
            </div>
            {isEdit ? 'Refine your' : 'Register New'} <span className="text-[#2E6F40]">Product</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">Ensure your product data aligns with official ministry standards for maximum marketplace visibility.</p>
        </div>
        
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 bg-white text-slate-500 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Return to Inventory
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        
        {/* ── MAIN FORM ─────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-wider shadow-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-600 text-[10px] font-black uppercase tracking-wider shadow-sm">
              <CheckCircle2 size={18} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Identity Group */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-emerald-50 text-[#2E6F40] rounded-2xl border border-emerald-100 shadow-sm">
                  <BadgeCheck size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Official Identity</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Core Product Recognition</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Product <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <select
                      name="catalog_product"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all appearance-none cursor-pointer"
                      onChange={handleChange}
                      required
                      value={formData.catalog_product}
                    >
                      <option value="">Choose Catalog Entry…</option>
                      {catalog.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <ChevronRight size={14} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none group-focus-within:text-[#2E6F40] transition-colors" strokeWidth={3} />
                  </div>
                  {fieldErrors.catalog_product && <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1 ml-1">{fieldErrors.catalog_product}</div>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Producing Farm <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <select
                      name="farm"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all appearance-none cursor-pointer"
                      onChange={handleChange}
                      required
                      value={formData.farm}
                    >
                      <option value="">Select Origin Farm…</option>
                      {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <ChevronRight size={14} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none group-focus-within:text-[#2E6F40] transition-colors" strokeWidth={3} />
                  </div>
                  {fieldErrors.farm && <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1 ml-1">{fieldErrors.farm}</div>}
                </div>
              </div>
            </div>

            {/* Economics Group */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shadow-sm">
                  <Tag size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Valuation & Inventory</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Commercial Benchmarks</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asking Price (DZD) <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <input
                      type="number" step="0.01" name="price"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all tabular-nums"
                      placeholder="0.00" onChange={handleChange} required value={formData.price}
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-[9px] text-slate-400 uppercase tracking-widest group-focus-within:text-[#2E6F40] transition-colors">DZD / {selCatalog?.default_unit || 'UNIT'}</div>
                  </div>
                  {fieldErrors.price && <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1 ml-1">{fieldErrors.price}</div>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Stock <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <input
                      type="number" step="0.01" name="stock"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all tabular-nums"
                      placeholder="0.00" onChange={handleChange} required value={formData.stock}
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-[9px] text-slate-400 uppercase tracking-widest group-focus-within:text-[#2E6F40] transition-colors">{selCatalog?.default_unit || 'UNIT'}S</div>
                  </div>
                  {fieldErrors.stock && <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1 ml-1">{fieldErrors.stock}</div>}
                </div>
              </div>
            </div>

            {/* Quality Group */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
                  <ShieldCheck size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Quality & Description</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Institutional Specifications</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quality Grade <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <select
                      name="quality"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all appearance-none cursor-pointer"
                      onChange={handleChange} required value={formData.quality}
                    >
                      <option value="PREMIUM">Premium (High End)</option>
                      <option value="STANDARD">Standard (Regular)</option>
                      <option value="ECONOMY">Economy (Low Cost)</option>
                      <option value="ORGANIC">Organic (Certified)</option>
                    </select>
                    <ChevronRight size={14} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none group-focus-within:text-[#2E6F40] transition-colors" strokeWidth={3} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Imagery</label>
                  <input
                    type="file" name="image"
                    className="w-full px-5 py-[0.85rem] bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-black file:bg-[#2E6F40] file:text-white hover:file:bg-[#255933] cursor-pointer transition-all"
                    accept="image/*" onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Manifest & Product Notes</label>
                <textarea
                  name="description"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#2E6F40]/10 focus:border-[#2E6F40] transition-all resize-none min-h-[140px] leading-relaxed"
                  placeholder="Elaborate on the product conditions, specific variety, or any unique quality markers..."
                  onChange={handleChange} value={formData.description}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4">
               <button
                 type="submit"
                 disabled={loading || farms.length === 0}
                 className="flex-1 bg-[#2E6F40] hover:bg-[#255933] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(46,111,64,0.2)] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
               >
                 {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={18} strokeWidth={3} /> {isEdit ? 'Update Requisition' : 'Authorize Listing'}</>}
               </button>
               <button
                 type="button"
                 onClick={() => navigate('/farmer-dashboard/products')}
                 className="px-10 py-4 bg-white text-slate-400 hover:text-slate-600 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
               >
                 Discard
               </button>
            </div>
          </form>
        </div>

        {/* ── SIDEBAR: OFFICIAL DATA ──────────────────── */}
        <div className="sticky top-8 flex flex-col gap-4">
          {selCatalog ? (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform"><Info size={200} /></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-10 border border-white/10">
                  <Building2 size={14} /> Ministry Reference
                </div>

                <div className="mb-10">
                   <div className="text-[10px] font-black text-[#2E6F40] uppercase tracking-widest mb-2">Market Stabilization Range</div>
                   <div className="text-3xl font-black tracking-tight tabular-nums">
                      {selCatalog.min_price} – {selCatalog.max_price} <span className="text-sm opacity-40 font-bold uppercase ml-1">DZD</span>
                   </div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Per {selCatalog.default_unit} • Updated Daily</div>
                </div>

                <div className="mb-10">
                   <div className="text-[10px] font-black text-[#2E6F40] uppercase tracking-widest mb-4">Quality Specifications</div>
                   <div className="bg-white/5 rounded-2xl p-5 border border-white/5 text-xs font-medium leading-relaxed text-slate-300">
                      {selCatalog.description || 'Standard Ministry quality guidelines apply to this category.'}
                   </div>
                </div>

                <div className="flex items-start gap-3 bg-[#2E6F40]/20 p-5 rounded-2xl border border-[#2E6F40]/30 shadow-inner">
                   <ShieldCheck size={20} className="text-[#2E6F40] shrink-0 mt-0.5" />
                   <p className="text-[10px] text-emerald-100 font-bold leading-relaxed m-0">
                      Products listed within reference price ranges receive priority indexing in the buyer marketplace.
                   </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-10 text-center shadow-inner">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100 mx-auto mb-6"><LayoutGrid size={32} /></div>
               <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Registry Guidance</h4>
               <p className="text-[11px] text-slate-400 font-medium leading-relaxed px-4">
                  Select a product from the official catalog to synchronize your listing with ministry-grade data benchmarks.
               </p>
            </div>
          )}

          <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-4 shadow-sm">
             <div className="p-3 bg-white text-[#2E6F40] rounded-2xl shadow-sm"><Info size={20} strokeWidth={3} /></div>
             <div>
                <div className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Digital Traceability</div>
                <div className="text-[10px] text-emerald-700 font-bold mt-0.5 leading-tight">Unique batch ID assigned for national tracking.</div>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

const Building2 = ({ size, style }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    style={style}
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);
