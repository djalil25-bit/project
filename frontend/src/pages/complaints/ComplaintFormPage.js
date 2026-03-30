import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  ShieldAlert, 
  ArrowLeft, 
  Send, 
  AlertCircle, 
  Image as ImageIcon, 
  CheckCircle,
  Package,
  FileText,
  Info,
  ChevronRight,
  Target
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
      <div className="container py-5 animate-fade-in">
        <div className="max-width-600 mx-auto">
          <div className="agr-card p-5 text-center border-2 border-success border-dashed">
            <div className="success-icon-wrapper mb-4 animate-scale-in">
              <CheckCircle size={80} className="text-success" />
            </div>
            <h2 className="fw-bold h3 mb-3">Incident Report Filed</h2>
            <p className="text-muted mb-5">
              Thank you for reporting this issue. Our administrative team will review your ticket (Ref: #{Math.floor(Math.random() * 10000)}) and update you shortly. 
              You can track the resolution status in your Complaints Center.
            </p>
            <div className="d-flex flex-column gap-3">
              <Link to="/complaints" className="btn-agr btn-primary py-3">View My Complaints</Link>
              <button onClick={() => navigate(-1)} className="btn-agr btn-outline py-2">Go Back</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="complaint-form-page animate-fade-in pb-5">
      <div className="agr-breadcrumb mb-4">
        <Link to="/complaints">Complaints Center</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>File New Report</span>
      </div>

      <div className="page-header d-flex align-items-center mb-5">
        <button onClick={() => navigate(-1)} className="btn-icon me-3 shadow-sm hover-translate-x">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="h3 fw-bold mb-1">Incident Reporting Center</h1>
          <p className="text-muted small">Standardized form for dispute resolution and quality assurance.</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <form onSubmit={handleSubmit} className="agr-form">
            {/* Section 1: Context */}
            <div className="agr-card p-4 mb-4 border-start-0 border-end-0 border-top-0 border-bottom-4 border-primary">
              <div className="d-flex align-items-center mb-4 text-primary">
                <Target size={18} className="me-2" />
                <h3 className="h6 fw-bold mb-0 text-uppercase">Reporting Context</h3>
              </div>
              
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label small fw-bold">Report Type</label>
                    <select 
                      className={`form-select ${errors.complaint_type ? 'border-danger' : ''}`}
                      value={formData.complaint_type} 
                      onChange={e => setFormData({...formData, complaint_type: e.target.value})}
                    >
                      <option value="ORDER">Order Issue</option>
                      <option value="DELIVERY">Delivery Problem</option>
                      <option value="PRODUCT">Product Quality</option>
                      <option value="PAYMENT">Payment/Transaction</option>
                      <option value="OTHER">Other Institutional Matter</option>
                    </select>
                    {errors.complaint_type && <div className="text-danger very-small mt-1">{errors.complaint_type[0]}</div>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label small fw-bold">Order Reference (Optional)</label>
                    <div className="position-relative">
                      <div className="position-absolute start-0 top-50 translate-middle-y ps-3 text-muted">#AG-</div>
                      <input 
                        type="text" className={`form-input ps-5 ${errors.order ? 'border-danger' : ''}`}
                        placeholder="000XX"
                        value={formData.order}
                        onChange={e => setFormData({...formData, order: e.target.value})}
                      />
                    </div>
                    {errors.order && <div className="text-danger very-small mt-1">{errors.order[0]}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Details */}
            <div className="agr-card p-4 mb-4">
              <div className="d-flex align-items-center mb-4 text-primary">
                <FileText size={18} className="me-2" />
                <h3 className="h6 fw-bold mb-0 text-uppercase">Technical Details</h3>
              </div>

              <div className="form-group mb-4">
                <label className="form-label small fw-bold">Brief Subject</label>
                <input 
                  type="text" className={`form-input ${errors.title ? 'border-danger' : ''}`} required 
                  placeholder="e.g., Incomplete shipment received"
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                />
                {errors.title && <div className="text-danger very-small mt-1">{errors.title[0]}</div>}
              </div>

              <div className="form-group mb-4">
                <label className="form-label small fw-bold">Detailed Incident Description</label>
                <textarea 
                  className={`form-input ${errors.description ? 'border-danger' : ''}`} rows="6" required
                  placeholder="Please describe exactly what happened, when it happened, and what resolution you are seeking..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
                {errors.description && <div className="text-danger very-small mt-1">{errors.description[0]}</div>}
              </div>
            </div>

            {/* Section 3: Evidence */}
            <div className="agr-card p-4 mb-5">
              <div className="d-flex align-items-center mb-4 text-primary">
                <ImageIcon size={18} className="me-2" />
                <h3 className="h6 fw-bold mb-0 text-uppercase">Supporting Evidence</h3>
              </div>

              <div className="bg-light-soft p-4 rounded-xl border border-dashed text-center position-relative hover-shadow-sm transition-all">
                <input 
                  type="file" id="evidence-upload" hidden accept="image/*" 
                  onChange={e => setAttachment(e.target.files[0])} 
                />
                <label htmlFor="evidence-upload" className="mb-0 cursor-pointer d-block">
                  <div className="mb-3 text-muted opacity-50"><ImageIcon size={48} /></div>
                  <h4 className="h6 fw-bold mb-1">{attachment ? attachment.name : 'Choose a file or drop it here'}</h4>
                  <p className="very-small text-muted mb-0">PDF, JPG, PNG accepted (Max 5MB)</p>
                  {attachment && (
                    <div className="mt-3 text-primary very-small fw-bold animate-fade-in d-flex align-items-center justify-content-center">
                      <CheckCircle size={14} className="me-1" /> File selected
                    </div>
                  )}
                </label>
              </div>
              {errors.attachment && <div className="text-danger very-small mt-2 text-center">{errors.attachment[0]}</div>}
            </div>

            {/* Feedback Sidebar Helper */}
            <div className="info-box bg-primary-10 border border-primary-20 p-4 rounded-xl mb-5 d-flex gap-4">
              <AlertCircle size={28} className="text-primary flex-shrink-0" />
              <div>
                <h5 className="h6 fw-bold mb-2">Our Dispute Policy</h5>
                <p className="very-small text-muted mb-0 leading-relaxed">
                  Complaints filed through this portal are reviewed within 24-48 institutional hours. 
                  Resolution status updates will be sent to your platform notification center. 
                  Inaccurate or misleading reports may impact your Trust Score.
                </p>
              </div>
            </div>

            <div className="d-flex flex-column-reverse flex-md-row gap-3">
              <button 
                type="button" 
                className="btn-agr btn-outline flex-grow-1 py-3 fw-bold"
                onClick={() => navigate(-1)}
              >
                Cancel Report
              </button>
              <button 
                type="submit" 
                className="btn-agr btn-primary flex-grow-1 py-3 fw-bold d-flex align-items-center justify-content-center shadow-lg"
                disabled={loading}
              >
                {loading ? 'Processing Submission...' : <><Send size={18} className="me-2" /> File Official Report</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComplaintFormPage;
