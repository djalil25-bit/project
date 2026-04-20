import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  Home, MapPin, Maximize2, Save, FileText,
  ChevronRight, ArrowLeft, Info, Upload, X, AlertTriangle
} from 'lucide-react';

export default function FarmForm() {
  const [formData, setFormData] = useState({
    name: '', location: '', size_hectares: '', description: '',
  });
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setPreview]    = useState(null);
  const [existingImage, setExisting]  = useState(null);
  const [error, setError]             = useState(null);
  const [loading, setLoading]         = useState(false);
  const fileInputRef = useRef();
  const navigate     = useNavigate();
  const { id }       = useParams();
  const isEditMode   = !!id;

  useEffect(() => {
    if (!isEditMode) return;
    api.get(`/farms/${id}/`)
      .then(res => {
        setFormData({
          name: res.data.name || '',
          location: res.data.location || '',
          size_hectares: res.data.size_hectares || '',
          description: res.data.description || '',
        });
        if (res.data.image) setExisting(res.data.image);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v !== '') body.append(k, v); });
      if (imageFile) body.append('image', imageFile);

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

      <div className="max-w-3xl">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100/80">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Home size={16} className="text-[#22543d]" /> Farm Configuration
            </h3>
          </div>
          
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-bold shadow-sm">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" /> <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Farm Photo */}
              <div className="space-y-5">
                <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100 pb-2 flex justify-between items-center">
                  <span>Farm Identity</span>
                  <span className="text-[9px] text-slate-400 lowercase font-medium">(optional)</span>
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
                      className="w-full border-2 border-dashed border-slate-300 hover:border-[#22543d] bg-slate-50 hover:bg-emerald-50/50 rounded-[1.5rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm text-slate-400 group-hover:text-emerald-500 group-hover:border-emerald-200 transition-colors">
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

              {/* Farm Details */}
              <div className="space-y-5">
                <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100 pb-2">Geographical Details</div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#22543d] flex items-center gap-2">
                    <Home size={14} className="text-emerald-500" />
                    Farm Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#22543d] focus:border-transparent transition-all shadow-sm placeholder-slate-400"
                    placeholder="e.g. Ibrahim Family Orchards"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#22543d] flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-500" />
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" name="location"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#22543d] focus:border-transparent transition-all shadow-sm placeholder-slate-400"
                      placeholder="Province, District or City"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#22543d] flex items-center gap-2">
                      <Maximize2 size={14} className="text-emerald-500" />
                      Land Size (ha)
                    </label>
                    <input
                      type="number" step="0.01" name="size_hectares"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#22543d] focus:border-transparent transition-all shadow-sm placeholder-slate-400"
                      placeholder="0.00"
                      value={formData.size_hectares}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-5">
                <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100 pb-2">Operational Context</div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#22543d] flex items-center gap-2">
                    <FileText size={14} className="text-emerald-500" />
                    Description <span className="text-slate-400 lowercase font-medium">(optional)</span>
                  </label>
                  <textarea
                    name="description"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#22543d] focus:border-transparent transition-all shadow-sm min-h-[120px] resize-y placeholder-slate-400"
                    placeholder="Tell us about your soil, crops, irrigation method, certifications…"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                  />
                  <div className="text-xs font-semibold text-slate-400 ml-1 mt-2">
                    A good description helps buyers trust your farm and products.
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-row-reverse sm:flex-row gap-4 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#22543d] hover:bg-[#1a402e] text-emerald-50 rounded-xl text-sm font-black uppercase tracking-wider transition-all transform active:scale-95 shadow-md disabled:opacity-50 disabled:pointer-events-none"
                  disabled={loading}
                >
                  {loading ? 'Saving…' : <><Save size={16} /> Save Farm</>}
                </button>
                <button
                  type="button"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
                  onClick={() => navigate('/farmer-dashboard/farms')}
                >
                  Discard
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
