import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  Home, MapPin, Maximize, Save, FileText, ChevronRight, ArrowLeft,
  Info, Upload, Image, X
} from 'lucide-react';

function FarmForm() {
  const [formData, setFormData] = useState({ name: '', location: '', size_hectares: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      api.get(`/farms/${id}/`).then(res => {
        setFormData({
          name: res.data.name || '',
          location: res.data.location || '',
          size_hectares: res.data.size_hectares || '',
          description: res.data.description || ''
        });
        if (res.data.image) setExistingImage(res.data.image);
      }).catch(() => setError('Failed to load farm data.'));
    }
  }, [id, isEditMode]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(formData).forEach(([k, v]) => body.append(k, v));
      if (imageFile) body.append('image', imageFile);

      if (isEditMode) {
        await api.patch(`/farms/${id}/`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/farms/', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/farmer-dashboard/farms');
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save farm.';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="farm-form-page">
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <Link to="/farmer-dashboard/farms">My Farms</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>{isEditMode ? 'Edit' : 'Add'} Farm</span>
      </div>

      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title">{isEditMode ? 'Edit Farm Unit' : 'Add New Farm Unit'}</h1>
          <p className="page-subtitle text-muted">{isEditMode ? 'Update your farm details.' : 'Register your agricultural land.'}</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-agr btn-outline d-flex align-items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="agr-card p-4 p-md-5">
            {error && (
              <div className="alert-agr alert-danger-agr mb-4 d-flex align-items-center">
                <Info size={18} className="me-3" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="agr-form">
              {/* Farm Image Upload */}
              <div className="form-group mb-4">
                <label className="form-label d-flex align-items-center gap-2">
                  <Image size={16} className="text-primary" /> Farm Photo
                  <span className="text-muted very-small fw-normal">(optional)</span>
                </label>
                <div className="farm-image-uploader">
                  {imagePreview || existingImage ? (
                    <div className="farm-image-preview" style={{ position: 'relative' }}>
                      <img src={imagePreview || existingImage} alt="Farm preview" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10 }} />
                      <button type="button" className="btn-icon text-danger" style={{ position: 'absolute', top: 8, right: 8, background: 'white', borderRadius: 20, padding: 4 }} onClick={clearImage}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="image-upload-zone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={32} className="text-muted mb-2 opacity-40" />
                      <div className="small text-muted">Click to upload farm photo</div>
                      <div className="very-small text-muted">JPG, PNG, or WEBP</div>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={handleImageChange} />
                  {!imagePreview && !existingImage && (
                    <button type="button" className="btn-agr btn-outline btn-sm mt-2 d-flex align-items-center gap-1" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={14} /> Choose Image
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label d-flex align-items-center gap-2">
                  <Home size={16} className="text-primary" /> Farm Name *
                </label>
                <input type="text" name="name" className="form-input" placeholder="e.g. Ibrahim Family Orchards" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="row">
                <div className="col-md-7">
                  <div className="form-group mb-4">
                    <label className="form-label d-flex align-items-center gap-2">
                      <MapPin size={16} className="text-primary" /> Location *
                    </label>
                    <input type="text" name="location" className="form-input" placeholder="Province, District or City" value={formData.location} onChange={handleChange} required />
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="form-group mb-4">
                    <label className="form-label d-flex align-items-center gap-2">
                      <Maximize size={16} className="text-primary" /> Land Size (ha)
                    </label>
                    <input type="number" step="0.01" name="size_hectares" className="form-input" placeholder="0.00" value={formData.size_hectares} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label d-flex align-items-center gap-2">
                  <FileText size={16} className="text-primary" /> Description
                </label>
                <textarea name="description" className="form-input" placeholder="Tell us about your soil, crops, or methods..." rows="4" value={formData.description} onChange={handleChange} />
              </div>

              <div className="d-flex gap-3 pt-3">
                <button type="submit" className="btn-agr btn-primary px-4 d-flex align-items-center gap-2" disabled={loading}>
                  {loading ? 'Saving...' : <><Save size={18} /> Save Farm</>}
                </button>
                <button type="button" className="btn-agr btn-outline px-4" onClick={() => navigate('/farmer-dashboard/farms')}>Discard</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmForm;
