import React, { useState } from 'react';
import { X, Camera, User, FileText, CheckCircle, Upload } from 'lucide-react';
import api from '../../api/axiosConfig';

const ProofOfDeliveryModal = ({ delivery, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(null);

  if (!isOpen || !delivery) return null;

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('pod_recipient_name', recipient);
      formData.append('pod_notes', notes);
      if (photo) {
        formData.append('pod_photo', photo);
      }

      await api.post(`/deliveries/${delivery.id}/complete_with_pod/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to submit proof of delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header border-bottom">
          <h3 className="h6 mb-0 d-flex align-items-center gap-2">
            <CheckCircle size={18} className="text-success" /> 
            Proof of Delivery - MIL-{delivery.id.toString().padStart(4, '0')}
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="alert alert-info py-2 px-3 small border-0 mb-4 bg-light-soft">
              <Info size={14} className="me-2" /> 
              Please provide evidence that the delivery has been successfully completed.
            </div>

            <div className="form-group mb-4">
              <label className="form-label small fw-bold text-uppercase d-flex align-items-center">
                <User size={14} className="me-2 text-primary" /> Recipient Name *
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Who received the cargo?" 
                required
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
              />
            </div>

            <div className="form-group mb-4">
              <label className="form-label small fw-bold text-uppercase d-flex align-items-center">
                <Camera size={14} className="me-2 text-primary" /> Delivery Photo 
                <span className="ms-2 badge bg-light text-muted fw-normal" style={{fontSize: '0.6rem'}}>Optional</span>
              </label>
              
              <div className="pod-photo-uploader border-dashed rounded-lg p-4 text-center cursor-pointer hover-bg-light transition-all position-relative overflow-hidden" style={{ minHeight: '150px' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange}
                  className="position-absolute top-0 start-0 opacity-0 w-100 h-100 cursor-pointer"
                  style={{ zIndex: 2 }}
                />
                {!preview ? (
                  <div className="py-2">
                    <Upload size={32} className="text-muted mb-2 opacity-50" />
                    <div className="small text-muted">Click or drag a photo of the delivered goods</div>
                    <div className="very-small text-muted mt-1">Institutional requirement for proof</div>
                  </div>
                ) : (
                  <img src={preview} alt="PoD Preview" className="img-fluid rounded shadow-sm" style={{ maxHeight: '200px' }} />
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label small fw-bold text-uppercase d-flex align-items-center">
                <FileText size={14} className="me-1 text-primary" /> Delivery Notes
              </label>
              <textarea 
                className="form-input" 
                rows="3" 
                placeholder="Any special remarks about the handover?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>
          
          <div className="modal-footer border-top bg-light-soft">
            <button type="button" className="btn-agr btn-outline px-4" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-agr btn-primary px-5 fw-bold" disabled={loading}>
              {loading ? 'Finalizing...' : 'Finalize Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Info = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  </svg>
);

export default ProofOfDeliveryModal;
