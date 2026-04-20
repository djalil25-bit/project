import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Package, Home, Tag, Image as ImageIcon,
  Save, Info, ShieldCheck, AlertTriangle, ChevronRight, Plus
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

        // Pre-select farm from URL query ?farm=N
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
            const item = fetchedCatalog.find(i => i.id === parseInt(p.catalog_product));
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
      const item = catalog.find(i => i.id === parseInt(value));
      setSelCatalog(item);
      if (item) {
        setFormData(prev => ({
          ...prev,
          price: item.ref_price || '',
          title: item.name,
          category: item.category,
          unit: item.default_unit,
        }));
      }
      setFErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setFErrors({});

    if (selCatalog) {
      const price = parseFloat(formData.price);
      const minP  = parseFloat(selCatalog.min_price);
      const maxP  = parseFloat(selCatalog.max_price);
      if ((!isNaN(minP) && price < minP) || (!isNaN(maxP) && price > maxP)) {
        setFErrors({ price: 'Your price is outside the admin-approved range. Please review the official pricing.' });
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
        setSuccess('Product listed successfully!');
      }
      setFormData({ catalog_product:'', description:'', price:'', stock:'', farm:'', title:'', category:'', unit:'', quality:'STANDARD', image:null });
      setSelCatalog(null);
      setTimeout(() => navigate('/farmer-dashboard'), 1500);
    } catch (err) {
      const resData = err.response?.data;
      if (resData && typeof resData === 'object') {
        setFErrors(resData);
        setError(resData.detail || resData.non_field_errors?.[0] || resData.price?.[0] || 'Submission failed. Please check the fields.');
      } else {
        setError('Failed to list product. Please check your connection.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="farmer-page-wrapper">
      {/* Breadcrumb */}
      <div className="f-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <span>{isEdit ? 'Edit Produce' : 'List New Produce'}</span>
      </div>

      {/* Page header */}
      <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            {isEdit ? 'Edit Your Produce' : 'List Your Produce'}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            {isEdit ? 'Update your harvest details and pricing.' : 'Register your fresh harvest to the AgriGov marketplace.'}
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors shadow-sm">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

        {/* ── Form card ── */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100/80">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Package size={16} className="text-[#22543d]" /> Listing Configuration
            </h3>
          </div>
          
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-bold shadow-sm">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" /> <div>{error}</div>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-600 text-sm font-bold shadow-sm">
                <ShieldCheck size={18} className="shrink-0 mt-0.5" /> <div>{success}</div>
              </div>
            )}
            {farms.length === 0 && !loading && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-amber-700 text-sm font-bold shadow-sm">
                <Info size={18} className="shrink-0 mt-0.5" />
                <div>No active farms found. <Link to="/farmer-dashboard/farm/new" className="underline text-amber-900 font-black hover:text-amber-600">Register a farm</Link> to start selling.</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Section: Product */}
              <div className="space-y-5">
                <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100 pb-2">Product Identifiers</div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#22543d] flex items-center gap-2">
                    <Package size={14} className="text-emerald-500" />
                    Select Market Product <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                     <select
                       name="catalog_product"
                       className={`w-full bg-slate-50 border ${fieldErrors.catalog_product ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-[#22543d]'} rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer`}
                       onChange={handleChange}
                       required
                       value={formData.catalog_product}
                     >
                       <option value="">Choose from official catalog…</option>
                       {catalog.map(i => <option key={i.id} value={i.id}>{i.name} ({i.default_unit})</option>)}
                     </select>
                     <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                  </div>
                  <div className="text-xs font-semibold text-slate-400 ml-1">Only certified products from the AgriGov database can be listed.</div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#22543d] flex items-center gap-2">
                    <Home size={14} className="text-emerald-500" />
                    Origin Farm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                     <select
                       name="farm"
                       className={`w-full bg-slate-50 border ${fieldErrors.farm ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-[#22543d]'} rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer`}
                       onChange={handleChange}
                       required
                       value={formData.farm}
                     >
                       <option value="">Select where this is grown…</option>
                       {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                     </select>
                     <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                  </div>
                </div>
              </div>

              {/* Section: Pricing & Quantity */}
              <div className="space-y-5">
                <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100 pb-2">Trading Parameters</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#22543d] flex items-center gap-2">
                      <Tag size={14} className="text-emerald-500" />
                      Asking Price (DZD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number" step="0.01" name="price"
                      className={`w-full bg-slate-50 border ${fieldErrors.price ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-[#22543d]'} rounded-xl px-4 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm`}
                      placeholder="0.00" onChange={handleChange} required value={formData.price}
                    />
                    {fieldErrors.price && (
                      <div className="text-xs font-bold text-red-500 mt-1">{Array.isArray(fieldErrors.price) ? fieldErrors.price[0] : fieldErrors.price}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#22543d] flex items-center gap-2">
                      <Plus size={14} className="text-emerald-500" />
                      Stock Quantity ({selCatalog?.default_unit || 'Units'}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number" step="0.01" name="stock"
                      className={`w-full bg-slate-50 border ${fieldErrors.stock ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-[#22543d]'} rounded-xl px-4 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm`}
                      placeholder="Enter amount" onChange={handleChange} required value={formData.stock}
                    />
                    {fieldErrors.stock && (
                      <div className="text-xs font-bold text-red-500 mt-1">{Array.isArray(fieldErrors.stock) ? fieldErrors.stock[0] : fieldErrors.stock}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Details */}
              <div className="space-y-5">
                <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100 pb-2">Quality & Imagery</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#22543d] flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      Product Quality <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                       <select
                         name="quality"
                         className="w-full bg-slate-50 border border-slate-200 focus:ring-[#22543d] rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer"
                         onChange={handleChange} required value={formData.quality}
                       >
                         <option value="PREMIUM">Premium (High End)</option>
                         <option value="STANDARD">Standard (Regular)</option>
                         <option value="ECONOMY">Economy (Low Cost)</option>
                         <option value="ORGANIC">Organic (Certified)</option>
                       </select>
                       <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#22543d] flex items-center gap-2">
                      <ImageIcon size={14} className="text-emerald-500" />
                      Product Photography <span className="text-slate-400 lowercase font-medium">(optional)</span>
                    </label>
                    <input
                      type="file" name="image"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 transition-all shadow-sm"
                      accept="image/*" onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#22543d]">Harvest Details & Quality Notes</label>
                  <textarea
                    name="description"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#22543d] focus:border-transparent transition-all shadow-sm min-h-[120px] resize-y placeholder-slate-400"
                    placeholder="Tell buyers about your produce: organic, extra fresh, specific variety, etc."
                    onChange={handleChange} value={formData.description}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-row-reverse sm:flex-row gap-4 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#22543d] hover:bg-[#1a402e] text-emerald-50 rounded-xl text-sm font-black uppercase tracking-wider transition-all transform active:scale-95 shadow-md disabled:opacity-50 disabled:pointer-events-none"
                  disabled={loading || farms.length === 0}
                >
                  {loading
                    ? 'Processing…'
                    : <><Save size={16} /> {isEdit ? 'Save Changes' : 'List Product'}</>
                  }
                </button>
                <button
                  type="button"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
                  onClick={() => navigate('/farmer-dashboard/products')}
                >
                  Discard
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Sidebar info panel ── */}
        <div className="sticky top-8 space-y-6">
          {selCatalog ? (
            <div className="bg-gradient-to-br from-[#22543d] to-[#1a402e] text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden border border-[#1a402e]">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Info size={80}/></div>
              
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-300 mb-6 relative z-10">
                <Info size={16} /> Official Guide
              </div>

              <div className="space-y-6 relative z-10">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/10">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Recommended Range</div>
                  <div className="text-xl font-black tracking-tight">
                    {selCatalog.min_price} – {selCatalog.max_price} <span className="text-xs font-bold text-emerald-300 ml-1">DZD / {selCatalog.default_unit}</span>
                  </div>
                  <div className="text-xs font-medium text-emerald-100/70 mt-2 leading-tight">Based on latest market stabilization data for {selCatalog.name}.</div>
                </div>

                {selCatalog.description && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Quality Standards</div>
                    <div className="text-xs font-medium text-emerald-50 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
                      {selCatalog.description}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 bg-emerald-500/20 p-4 rounded-xl border border-emerald-500/30">
                  <ShieldCheck size={20} className="text-emerald-300 shrink-0 mt-0.5" />
                  <div className="text-xs font-medium text-emerald-100 leading-snug">
                    Listing within the recommended price range increases your visibility on the buyer marketplace.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center mb-4 shadow-sm text-slate-300">
                <Package size={24} />
              </div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Market Guidelines</h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                Select a product from the registry to view official marketplace guidelines, quality standards, and pricing matrix data.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Mobile: stack sidebar below */}
      <style>{`
        @media (max-width: 900px) {
          .farmer-page-wrapper > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
