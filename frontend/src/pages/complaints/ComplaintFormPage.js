import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  ArrowLeft, Send, AlertCircle, Image as ImageIcon, 
  CheckCircle, Package, FileText, ChevronRight, Target, ShieldAlert
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ComplaintFormPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Extract context from URL params
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('order_id');
  const initialType = queryParams.get('type') || 'ORDER';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [attachment, setAttachment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    complaint_type: initialType,
    order: orderId || '',
    delivery: '',
    target_user: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });
      if (attachment) data.append('attachment', attachment);

      await api.post('/complaints/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess(true);
      showToast('Incident report filed successfully.', 'success');
      window.scrollTo(0, 0);
    } catch (err) {
      if (err.response && err.response.data) {
        setErrors(err.response.data);
        showToast('Please correct the highlighted errors.', 'error');
      } else {
        showToast('Submission failed. Please check your connection.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 animate-fade-in relative z-0">
        <div className="bg-white p-12 text-center rounded-[2.5rem] shadow-[0_20px_60px_rgba(34,84,61,0.08)] border border-slate-100 flex flex-col items-center">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-8 border border-emerald-100 shadow-sm animate-scale-in">
            <CheckCircle size={48} strokeWidth={2.5} />
          </div>
          <h2 className="font-black text-3xl text-slate-900 mb-4 tracking-tight">Incident Report Filed</h2>
          <p className="text-slate-500 text-lg font-medium mb-10 max-w-lg mx-auto leading-relaxed">
            Your grievance network protocol has been submitted. Our administrative team will review your ticket and update you in the Complaints Center.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate(-1)} className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-sm hover:-translate-y-1 active:scale-95">
              Return Previous
            </button>
            <Link to="/complaints" className="px-8 py-4 bg-[#22543d] hover:bg-[#1a402e] text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-[0_8px_20px_rgba(34,84,61,0.3)] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2">
              <ShieldAlert size={18} /> Open Complaints
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20 animate-fade-in relative z-0">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#22543d] mb-8">
        {orderId ? (
          <Link to={`/farmer/orders`} className="hover:underline hover:text-[#1a402e] transition-colors flex items-center gap-1"><ArrowLeft size={12}/> Back to Orders</Link>
        ) : (
          <button onClick={() => navigate('/farmer-dashboard')} className="hover:underline hover:text-[#1a402e] transition-colors flex items-center gap-1 cursor-pointer"><ArrowLeft size={12}/> Back to Dashboard</button>
        )}
        <ChevronRight size={12} className="text-slate-400 mx-1" />
        <span className="text-slate-400 flex items-center gap-1"><ShieldAlert size={12}/> File New Report</span>
      </div>

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-3">
          Incident Reporting Center
        </h1>
        <p className="text-lg font-medium text-slate-500 mt-3 max-w-xl mx-auto">Standardized form for global dispute resolution, logistics anomalies, and quality assurance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Context Section */}
            <div className="bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 lg:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#22543d] to-emerald-400" />
              <div className="flex items-center gap-2 mb-6 text-[#22543d] font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-3">
                <Target size={16} /> Reporting Context
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Report Type <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      className={`w-full appearance-none pl-4 pr-10 py-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22543d] transition-all text-sm font-bold text-slate-800 ${errors.complaint_type ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200'}`}
                      value={formData.complaint_type} 
                      onChange={e => setFormData({...formData, complaint_type: e.target.value})}
                    >
                      <option value="ORDER">Order Issue</option>
                      <option value="DELIVERY">Delivery Problem</option>
                      <option value="PRODUCT">Product Quality</option>
                      <option value="PAYMENT">Payment/Transaction</option>
                      <option value="OTHER">Other Institutional Matter</option>
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                  </div>
                  {errors.complaint_type && <div className="text-red-500 text-xs font-bold mt-2">{errors.complaint_type[0]}</div>}
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Order Reference</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">#AG-</div>
                    <input 
                      type="text" 
                      className={`w-full pl-14 pr-4 py-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22543d] transition-all text-sm font-bold text-slate-800 placeholder-slate-300 ${errors.order ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200'}`}
                      placeholder="000XX"
                      value={formData.order}
                      onChange={e => setFormData({...formData, order: e.target.value})}
                    />
                  </div>
                  {errors.order && <div className="text-red-500 text-xs font-bold mt-2">{errors.order[0]}</div>}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 lg:p-10">
              <div className="flex items-center gap-2 mb-6 text-[#22543d] font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-3">
                <FileText size={16} /> Technical Details
              </div>

              <div className="mb-6">
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Brief Subject <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22543d] transition-all text-sm font-bold text-slate-800 placeholder-slate-300 ${errors.title ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200'}`}
                  required 
                  placeholder="e.g., Incomplete shipment received"
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                />
                {errors.title && <div className="text-red-500 text-xs font-bold mt-2">{errors.title[0]}</div>}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Detailed Incident Description <span className="text-red-500">*</span></label>
                <textarea 
                  className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22543d] transition-all text-sm font-bold text-slate-800 placeholder-slate-300 resize-y ${errors.description ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200'}`}
                  rows="5" 
                  required
                  placeholder="Please describe exactly what happened, when it happened, and what resolution you are seeking..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
                {errors.description && <div className="text-red-500 text-xs font-bold mt-2">{errors.description[0]}</div>}
              </div>
            </div>

            {/* Evidence Section */}
            <div className="bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 lg:p-10">
              <div className="flex items-center gap-2 mb-6 text-[#22543d] font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-3">
                <ImageIcon size={16} /> Supporting Evidence
              </div>

              <div className="relative border-2 border-dashed border-slate-200 rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 transition-colors group">
                <input 
                  type="file" id="evidence-upload" hidden accept="image/*" 
                  onChange={e => setAttachment(e.target.files[0])} 
                />
                <label htmlFor="evidence-upload" className="flex flex-col items-center justify-center w-full py-10 cursor-pointer">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${attachment ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-400 group-hover:scale-110 shadow-sm'}`}>
                    <ImageIcon size={32} />
                  </div>
                  <h4 className="text-base font-black text-slate-800 mb-1">{attachment ? attachment.name : 'Click to Upload Payload Buffer'}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">PDF, JPG, PNG accepted (Max 5MB)</p>
                  
                  {attachment && (
                    <div className="mt-6 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 animate-scale-in border border-emerald-200">
                      <CheckCircle size={16} strokeWidth={3} /> File Encoded
                    </div>
                  )}
                </label>
              </div>
              {errors.attachment && <div className="text-red-500 text-xs font-bold mt-2 text-center">{errors.attachment[0]}</div>}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-5 mt-4">
              <button 
                type="button" 
                className="w-full sm:w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-sm hover:-translate-y-1 active:scale-95"
                onClick={() => navigate('/farmer-dashboard')}
              >
                Abort Protocol
              </button>
              <button 
                type="submit" 
                className="w-full sm:flex-1 bg-[#22543d] hover:bg-[#1a402e] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_8px_20px_rgba(34,84,61,0.3)] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                disabled={loading}
              >
                {loading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processing Block...</> : <><Send size={18} strokeWidth={3} /> Dispatch Official Report</>}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 lg:sticky lg:top-8">
          <div className="bg-sky-50 border border-sky-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 blur-[1px]"><AlertCircle size={100} /></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle size={24} strokeWidth={3} />
              </div>
              <h5 className="font-black text-sky-900 text-lg leading-tight">Ministry Dispute Policy</h5>
            </div>
            
            <p className="text-sm text-sky-800/80 font-medium leading-relaxed relative z-10">
              Reports filed through this centralized terminal are rapidly sequenced to administration authorities and rigorously reviewed within 24-48 institutional hours. 
              <br/><br/>
              Resolution vectors and status payloads will be propagated directly to your local disposition grid. Ensure all factual metadata is precise—inaccurate protocol uploads may negatively impact your institutional rating.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintFormPage;
