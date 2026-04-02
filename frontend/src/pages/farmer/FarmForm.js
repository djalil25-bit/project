import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  Home, MapPin, Maximize2, Save, FileText,
  ChevronRight, ArrowLeft, Info, Upload, Image as ImageIcon, X
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

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--f-forest-dark)', margin: 0 }}>
            {isEditMode ? 'Edit Farm Unit' : 'Add New Farm Unit'}
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: '#6b7280', fontSize: '0.88rem' }}>
            {isEditMode ? 'Update your farm details.' : 'Register your agricultural land on AgriGov Market.'}
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-f-ghost btn-f-sm">
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div style={{ maxWidth: 620 }}>
        <div className="f-card">
          <div className="f-card-body">

            {error && (
              <div className="f-alert f-alert-danger">
                <Info size={16} /> <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Farm Photo */}
              <div className="f-form-section">
                <div className="f-form-section-title">Farm Photo</div>
                <div className="f-form-group">
                  <label className="f-form-label">
                    <ImageIcon size={14} style={{ color: 'var(--f-olive)' }} />
                    Upload Photo <span className="opt">(optional)</span>
                  </label>

                  {imagePreview || existingImage ? (
                    <div className="f-image-preview-wrap">
                      <img src={imagePreview || existingImage} alt="Farm preview" />
                      <button type="button" className="f-image-remove" onClick={clearImage} title="Remove image">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="f-upload-zone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="f-upload-zone-icon">
                        <Upload size={32} />
                      </div>
                      <div className="f-upload-zone-text">Click to upload farm photo</div>
                      <div className="f-upload-zone-sub">JPG, PNG, or WEBP — max 10 MB</div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  {!imagePreview && !existingImage && (
                    <button
                      type="button"
                      className="btn-f-ghost btn-f-sm"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={13} /> Choose Image
                    </button>
                  )}
                </div>
              </div>

              {/* Farm Details */}
              <div className="f-form-section">
                <div className="f-form-section-title">Farm Details</div>

                <div className="f-form-group">
                  <label className="f-form-label">
                    <Home size={14} style={{ color: 'var(--f-olive)' }} />
                    Farm Name <span className="req">*</span>
                  </label>
                  <input
                    type="text" name="name"
                    className="f-input"
                    placeholder="e.g. Ibrahim Family Orchards"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                  <div className="f-form-group" style={{ marginBottom: 0 }}>
                    <label className="f-form-label">
                      <MapPin size={14} style={{ color: 'var(--f-olive)' }} />
                      Location <span className="req">*</span>
                    </label>
                    <input
                      type="text" name="location"
                      className="f-input"
                      placeholder="Province, District or City"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="f-form-group" style={{ marginBottom: 0, minWidth: 130 }}>
                    <label className="f-form-label">
                      <Maximize2 size={14} style={{ color: 'var(--f-olive)' }} />
                      Land Size (ha)
                    </label>
                    <input
                      type="number" step="0.01" name="size_hectares"
                      className="f-input"
                      placeholder="0.00"
                      value={formData.size_hectares}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="f-form-section">
                <div className="f-form-section-title">Additional Information</div>
                <div className="f-form-group">
                  <label className="f-form-label">
                    <FileText size={14} style={{ color: 'var(--f-olive)' }} />
                    Description <span className="opt">(optional)</span>
                  </label>
                  <textarea
                    name="description"
                    className="f-input f-textarea"
                    placeholder="Tell us about your soil, crops, irrigation method, certifications…"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                  />
                  <div className="f-form-hint">
                    A good description helps buyers trust your farm and products.
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }} className="f-form-actions">
                <button
                  type="submit"
                  className="btn-f-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving…' : <><Save size={16} /> Save Farm</>}
                </button>
                <button
                  type="button"
                  className="btn-f-ghost"
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
