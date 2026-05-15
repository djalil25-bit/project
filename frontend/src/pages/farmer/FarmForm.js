import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { ALGERIAN_WILAYAS } from '../../utils/constants';
import {
  Home, MapPin, Maximize2, Save, FileText,
  ChevronRight, ArrowLeft, Info, Upload, X, AlertTriangle
} from 'lucide-react';
import LocationPicker from '../../components/maps/LocationPicker';

export default function FarmForm() {
  const [formData, setFormData] = useState({
    name: '', location: '', wilaya: '', commune: '', size_hectares: '', description: '',
  });
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setPreview]    = useState(null);
  const [existingImage, setExisting]  = useState(null);
  const [registryFile, setRegistryFile] = useState(null);
  const [registryPreview, setRegistryPreview] = useState(null);
  const [existingRegistry, setExistingRegistry] = useState(null);
  const [error, setError]             = useState(null);
  const [loading, setLoading]         = useState(false);
  const fileInputRef = useRef();
  const navigate     = useNavigate();
  const { id }       = useParams();
  const isEditMode   = !!id;

  useEffect(() => {
    // Fixed: Wilaya of farms is locked to the farmer's registered wilaya
    api.get('/accounts/profile/')
      .then(res => {
        const userWilayaRaw = res.data.address;
        // Resolve ID if the profile contains a name (e.g. "Constantine" -> "25")
        const matched = ALGERIAN_WILAYAS.find(w => 
          w.id === userWilayaRaw || 
          w.name.toLowerCase() === userWilayaRaw?.toLowerCase()
        );
        const resolvedId = matched ? matched.id : userWilayaRaw;
        setFormData(prev => ({ ...prev, wilaya: resolvedId }));
      })
      .catch(err => console.error('Error fetching profile for wilaya sync:', err));

    if (!isEditMode) return;
    api.get(`/farms/${id}/`)
      .then(res => {
        setFormData(prev => ({
          ...prev,
          name: res.data.name || '',
          location: res.data.location || '',
          // Wilaya will be overwritten by the profile sync but we keep the logic clean
          wilaya: res.data.wilaya || '',
          commune: res.data.commune || '',
          size_hectares: res.data.size_hectares || '',
          description: res.data.description || '',
        }));
        if (res.data.latitude) setLatitude(res.data.latitude);
        if (res.data.longitude) setLongitude(res.data.longitude);
        if (res.data.image) setExisting(res.data.image);
        if (res.data.registry_document) setExistingRegistry(res.data.registry_document);
      })
      .catch(() => setError('Failed to load farm data.'));
  }, [id, isEditMode]);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRegistryChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRegistryFile(file);
    setRegistryPreview(file.name);
  };

  const clearRegistry = () => {
    setRegistryFile(null);
    setRegistryPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = new FormData();
      // Ensure the fixed wilaya is included in submission
      Object.entries(formData).forEach(([k, v]) => { if (v !== '') body.append(k, v); });
      if (latitude !== null) body.append('latitude', latitude);
      if (longitude !== null) body.append('longitude', longitude);
      if (imageFile) body.append('image', imageFile);
      if (registryFile) body.append('registry_document', registryFile);

      if (isEditMode) {
        await api.patch(`/farms/${id}/`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/farms/', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/farmer-dashboard/farms');
    } catch (err) {
      const data = err.response?.data;
      const msg  = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save farm.';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="farmer-page-wrapper">

      {/* Breadcrumb */}
      <div className="f-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <Link to="/farmer-dashboard/farms">My Farms</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <span>{isEditMode ? 'Edit' : 'Add'} Farm</span>
      </div>

      <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Farm Unit' : 'Add New Farm Unit'}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            {isEditMode ? 'Update your farm details.' : 'Register your agricultural land on AgriGov Market.'}
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors shadow-sm">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <div className="w-1 h-4 bg-[#2E6F40] rounded-full" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Home size={14} className="text-[#2E6F40]" /> Farm Details
            </h3>
          </div>
          
          <div className="p-5 sm:p-6">
            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-red-600 text-xs font-bold shadow-sm">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" /> <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Farm Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-slate-400 pb-1.5 border-b border-slate-100">
                  <div className="w-1 h-3 bg-[#2E6F40] rounded-full" /> Location & Identity
                </div>

                <div className="space-y-2">
                  {imagePreview || existingImage ? (
                    <div className="relative w-full max-w-sm rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-sm group">
                      <img src={imagePreview || existingImage} alt="Farm preview" className="w-full h-auto object-cover max-h-64" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg transform active:scale-95 transition-all" onClick={clearImage} title="Remove image">
                          <X size={18} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full border-2 border-dashed border-slate-300 hover:border-[#2E6F40] bg-slate-50 hover:bg-[#f0faf4]/50 rounded-[1.5rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm text-slate-400 group-hover:text-[#2E6F40] group-hover:border-[#a2d4b5] transition-colors">
                        <Upload size={24} />
                      </div>
                      <div className="text-sm font-black text-slate-700 mb-1">Click to upload farm photo</div>
                      <div className="text-xs font-medium text-slate-500">JPG, PNG, or WEBP — max 10 MB</div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              {/* Geographical Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-slate-400 pb-1.5 border-b border-slate-100">
                  <div className="w-1 h-3 bg-[#2E6F40] rounded-full" /> Geographical Details
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#2E6F40] flex items-center gap-2">
                    <Home size={14} className="text-[#2E6F40]" />
                    Farm Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all shadow-sm placeholder-slate-400"
                    placeholder="e.g. Ibrahim Family Orchards"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#2E6F40] flex items-center gap-2">
                      <MapPin size={14} className="text-[#2E6F40]" />
                      Detailed Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" name="location"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all shadow-sm placeholder-slate-400"
                      placeholder="Village, street, or address details"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase tracking-widest text-[#2E6F40] flex items-center gap-2">
                          Wilaya <span className="text-red-500">*</span>
                       </label>
                       <select 
                         name="wilaya"
                         className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-black text-slate-500 cursor-not-allowed shadow-sm"
                         value={formData.wilaya}
                         onChange={handleChange}
                         disabled
                         title="Farms must be located in your registered wilaya."
                       >
                         <option value="">Select Wilaya</option>
                         {ALGERIAN_WILAYAS.map(w => (
                           <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
                         ))}
                       </select>
                       <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                         <Info size={10} /> Locked to your registered region
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase tracking-widest text-[#2E6F40] flex items-center gap-2">
                          Commune <span className="text-red-500">*</span>
                       </label>
                       <input 
                         type="text" name="commune"
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all shadow-sm placeholder-slate-400"
                         placeholder="e.g. Ain El Turk"
                         value={formData.commune}
                         onChange={handleChange}
                         required
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#2E6F40] flex items-center gap-2">
                      <Maximize2 size={14} className="text-[#2E6F40]" />
                      Land Size (ha)
                    </label>
                    <input
                      type="number" step="0.01" name="size_hectares"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all shadow-sm placeholder-slate-400"
                      placeholder="0.00"
                      value={formData.size_hectares}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Map Location Picker */}
                  <LocationPicker
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                    height="280px"
                  />
              </div>

              {/* Registry Document Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-slate-400 pb-1.5 border-b border-slate-100">
                  <div className="w-1 h-3 bg-emerald-500 rounded-full" /> Verification Document
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                    <FileText size={14} />
                    Farm Registry Document <span className="text-red-500">*</span>
                  </label>
                  
                  {registryPreview || existingRegistry ? (
                    <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-white border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-500 shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-black text-emerald-900 truncate">
                            {registryPreview || 'View Registry Document'}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                            {registryPreview ? 'Selected for upload' : 'Already uploaded'}
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={clearRegistry}
                        className="p-2 text-emerald-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-full border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/30 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
                      onClick={() => document.getElementById('registry-upload').click()}
                    >
                      <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-3 shadow-sm text-slate-400 group-hover:text-emerald-500 group-hover:border-emerald-200 transition-colors">
                        <Upload size={20} />
                      </div>
                      <div className="text-sm font-black text-slate-700 mb-1">Upload Farm Registry Document</div>
                      <div className="text-[10px] font-medium text-slate-400">PDF, JPG, or PNG — max 10 MB</div>
                    </div>
                  )}
                  <input
                    id="registry-upload"
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={handleRegistryChange}
                  />
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-2">
                    <Info size={10} /> This document is required for verification.
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-slate-400 pb-1.5 border-b border-slate-100">
                  <div className="w-1 h-3 bg-[#2E6F40] rounded-full" /> About This Farm
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#2E6F40] flex items-center gap-2">
                    <FileText size={14} className="text-[#2E6F40]" />
                    Description <span className="text-slate-400 lowercase font-medium">(optional)</span>
                  </label>
                  <textarea
                    name="description"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all shadow-sm min-h-[120px] resize-y placeholder-slate-400"
                    placeholder="Tell us about your soil, crops, irrigation method, certifications…"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#2E6F40] hover:bg-[#255933] text-white rounded-xl text-sm font-black uppercase tracking-wide transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:pointer-events-none"
                  disabled={loading}
                >
                  {loading ? 'Saving…' : <><Save size={15} /> Save Farm</>}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold uppercase tracking-wide transition-all"
                  onClick={() => navigate('/farmer-dashboard/farms')}
                >
                  Discard
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* ── Right sidebar: Image upload ── */}
        <div className="sticky top-6 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#2E6F40] rounded-full" />
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Farm Photo</h3>
              <span className="ml-auto text-[9px] text-slate-400 font-medium">(optional)</span>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {imagePreview || existingImage ? (
                  <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                    <img src={imagePreview || existingImage} alt="Farm preview" className="w-full h-auto object-cover max-h-48" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-all" onClick={clearImage} title="Remove image">
                        <X size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full border-2 border-dashed border-slate-200 hover:border-[#2E6F40] bg-slate-50 hover:bg-[#f0faf4]/30 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-3 shadow-sm text-slate-400 group-hover:text-[#2E6F40] group-hover:border-[#a2d4b5] transition-colors">
                      <Upload size={18} />
                    </div>
                    <div className="text-xs font-black text-slate-600 mb-1">Click to upload</div>
                    <div className="text-[10px] font-medium text-slate-400">JPG, PNG, WEBP — max 10 MB</div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#f0faf4] border border-[#cee8d9] rounded-xl p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#255933] mb-2 flex items-center gap-1.5">
              <Info size={12} className="text-[#2E6F40]" /> Tip
            </div>
            <p className="text-xs font-medium text-emerald-800 leading-relaxed">
              A clear farm photo helps buyers trust your products and increases your visibility on the marketplace.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
