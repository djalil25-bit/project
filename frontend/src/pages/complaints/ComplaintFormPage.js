import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  ArrowLeft, Send, AlertCircle, Image as ImageIcon, 
  CheckCircle, Package, FileText, ChevronRight, Target, ShieldAlert
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';


const ComplaintFormPage = () => {
  const { user } = useAuth();
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
        <div className="bg-white p-12 text-center rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center">
          <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 border shadow-sm animate-scale-in bg-[#2E6F40]/10 text-[#2E6F40] border-[#2E6F40]/20">
            <CheckCircle size={48} strokeWidth={2.5} />
          </div>
          <h2 className="font-black text-3xl text-slate-900 mb-4 tracking-tight uppercase">Complaint Logged</h2>
          <p className="text-slate-500 text-lg font-medium mb-10 max-w-lg mx-auto leading-relaxed">
            Your incident report has been successfully submitted to the AgriGov network. Our team will review the parameters and update you soon.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate(-1)} className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-sm active:scale-95 border border-slate-200">
              Return
            </button>
            <Link to="/complaints" className="px-8 py-4 bg-[#2E6F40] hover:bg-[#255933] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-[0_10px_30px_rgba(46,111,64,0.3)] active:scale-95 flex items-center justify-center gap-2">
              <ShieldAlert size={16} /> View All Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20 animate-fade-in relative z-0">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E6F40] mb-5 bg-[#2E6F40]/10 px-3 py-1 rounded-full w-fit border border-[#2E6F40]/20 shadow-sm">
        {orderId ? (
          <button onClick={() => navigate(-1)} className="hover:text-[#255933] transition-colors flex items-center gap-1.5 font-black uppercase"><ArrowLeft size={10} strokeWidth={3}/> Return</button>
        ) : (
          <button onClick={() => navigate('/complaints')} className="hover:text-[#255933] transition-colors flex items-center gap-1.5 cursor-pointer font-black uppercase"><ArrowLeft size={10} strokeWidth={3}/> Complaints</button>
        )}
        <ChevronRight size={10} className="text-[#2E6F40]/40" />
        <span className="text-[#2E6F40] flex items-center gap-1.5 font-black uppercase">
          <ShieldAlert size={11} /> New Report
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-[#2E6F40]">
            <ShieldAlert size={22} strokeWidth={2.5} />
          </div>
          File <span className="text-[#2E6F40]">Incident Report</span>
        </h1>
        <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">Initialize a new dispute resolution protocol for your network transactions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Context Section */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2E6F40] to-[#4a8c5f]" />
              <div className="flex items-center gap-2 mb-6 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 pb-4 text-[#2E6F40]">
                <Target size={14} /> Protocol Context
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Incident Type <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      className={`w-full appearance-none pl-4 pr-10 py-4 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all text-[11px] font-black uppercase tracking-widest text-slate-800 ${errors.complaint_type ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200'}`}
                      value={formData.complaint_type} 
                      onChange={e => setFormData({...formData, complaint_type: e.target.value})}
                    >
                      <option value="ORDER">Order Discrepancy</option>
                      <option value="DELIVERY">Logistics Failure</option>
                      <option value="PRODUCT">Quality Non-Compliance</option>
                      <option value="PAYMENT">Transactional Issue</option>
                      <option value="OTHER">Other Institutional Matter</option>
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2E6F40] rotate-90 pointer-events-none" />
                  </div>
                  {errors.complaint_type && <div className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.complaint_type[0]}</div>}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Order Reference</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2E6F40] font-black text-[11px]">#REF-</div>
                    <input 
                      type="text" 
                      className={`w-full pl-14 pr-4 py-4 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all text-[11px] font-black text-slate-800 placeholder-slate-300 uppercase tracking-widest ${errors.order ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200'}`}
                      placeholder="XXXXX"
                      value={formData.order}
                      onChange={e => setFormData({...formData, order: e.target.value})}
                    />
                  </div>
                  {errors.order && <div className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.order[0]}</div>}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-8">
              <div className="flex items-center gap-2 mb-6 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 pb-4 text-[#2E6F40]">
                <FileText size={14} /> Description protocol
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Subject Header <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-4 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all text-[11px] font-black text-slate-800 placeholder-slate-300 uppercase tracking-widest ${errors.title ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200'}`}
                  required 
                  placeholder="e.g., SHIPMENT INVENTORY MISMATCH"
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                />
                {errors.title && <div className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.title[0]}</div>}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Incident Parameters <span className="text-red-500">*</span></label>
                <textarea 
                  className={`w-full px-4 py-4 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent transition-all text-sm font-medium text-slate-700 placeholder-slate-300 resize-y min-h-[160px] ${errors.description ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200'}`}
                  rows="5" 
                  required
                  placeholder="Describe the technical parameters and seeked resolution..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
                {errors.description && <div className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.description[0]}</div>}
              </div>
            </div>

            {/* Evidence Section */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-8">
              <div className="flex items-center gap-2 mb-6 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 pb-4 text-[#2E6F40]">
                <ImageIcon size={14} /> Supporting documentation
              </div>
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-[#f0faf4]/40 transition-colors group p-8">
                <input type="file" id="evidence-upload" hidden accept="image/*" onChange={e => setAttachment(e.target.files[0])} />
                <label htmlFor="evidence-upload" className="flex flex-col items-center justify-center w-full cursor-pointer">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all shadow-sm ${attachment ? 'bg-[#2E6F40] text-white' : 'bg-white border border-slate-200 text-slate-300 hover:text-[#2E6F40] hover:border-[#2E6F40]'}`}>
                    <ImageIcon size={28} />
                  </div>
                  <h4 className="text-[11px] font-black text-slate-800 mb-1 uppercase tracking-widest">{attachment ? attachment.name : 'Initialize File Upload'}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">MAX SIZE: 05 MB (PDF/JPG/PNG)</p>
                  {attachment && (
                    <div className="mt-6 text-[#2E6F40] bg-[#2E6F40]/10 px-4 py-2 rounded-full text-[9px] font-black tracking-[0.2em] uppercase flex items-center gap-2 border border-[#2E6F40]/20 shadow-sm animate-bounce">
                      <CheckCircle size={12} strokeWidth={3} /> Registered
                    </div>
                  )}
                </label>
              </div>
              {errors.attachment && <div className="text-red-500 text-[10px] font-black uppercase mt-3 ml-1">{errors.attachment[0]}</div>}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-4 mt-8">
              <button 
                type="button" 
                className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 border border-slate-200 shadow-sm"
                onClick={() => navigate(-1)}
              >
                Terminate
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-[#2E6F40] hover:bg-[#255933] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Transmitting Protocol...</> : <><Send size={16} strokeWidth={2.5} /> Log Incident Report</>}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 lg:sticky lg:top-6">
          <div className="bg-[#2E6F40]/10 border border-[#2E6F40]/20 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#2E6F40]/20 text-[#2E6F40] flex items-center justify-center shrink-0">
                <AlertCircle size={20} strokeWidth={2.5} />
              </div>
              <h5 className="font-black text-[11px] text-[#2E6F40] uppercase tracking-widest">Incident Policy</h5>
            </div>
            <p className="text-[11px] font-bold leading-relaxed text-[#2E6F40]/80 uppercase tracking-widest">
              All incident reports are processed within the governance parameters (24–48h). Please ensure parameters are calibrated correctly to avoid dispute latency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintFormPage;
