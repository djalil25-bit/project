import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Home, Edit3, Trash2, MapPin, Maximize, ExternalLink, ChevronRight, Package } from 'lucide-react';

/* Gradient palette for farms without images */
const FARM_GRADIENTS = [
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
];

function FarmCard({ farm, index, onDelete }) {
  const navigate = useNavigate();
  const gradient = FARM_GRADIENTS[index % FARM_GRADIENTS.length];
  const initials = farm.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="farm-card animate-fade-in" style={{ animationDelay: `${index * 0.07}s` }}>
      {/* Farm Card Image / Gradient Header */}
      <div
        className="farm-card-header"
        onClick={() => navigate(`/farmer-dashboard/farms/${farm.id}`)}
        style={{ cursor: 'pointer' }}
      >
        {farm.image ? (
          <img src={farm.image} alt={farm.name} className="farm-card-img" />
        ) : (
          <div className="farm-card-placeholder" style={{ background: gradient }}>
            <span className="farm-card-initials">{initials}</span>
          </div>
        )}
        <div className="farm-card-overlay">
          <span className="farm-card-view-hint">View Details ›</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="farm-card-body">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h4 className="farm-card-name">{farm.name}</h4>
        </div>
        <div className="d-flex align-items-center gap-1 text-muted very-small mb-2">
          <MapPin size={12} className="text-danger flex-shrink-0" />
          <span className="text-truncate">{farm.location}</span>
        </div>
        {farm.size_hectares && (
          <div className="d-flex align-items-center gap-1 text-muted very-small mb-2">
            <Maximize size={11} />
            <span>{farm.size_hectares} ha</span>
          </div>
        )}
        {farm.description && (
          <p className="farm-card-desc">{farm.description}</p>
        )}

        {/* Actions */}
        <div className="farm-card-actions d-flex gap-2 mt-3 pt-3 border-top">
          <button
            className="btn-agr btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
            onClick={() => navigate(`/farmer-dashboard/farms/${farm.id}`)}
          >
            <ExternalLink size={14} /> View
          </button>
          <button
            className="btn-icon btn-sm"
            title="Edit"
            onClick={() => navigate(`/farmer-dashboard/farm/edit/${farm.id}`)}
          >
            <Edit3 size={15} />
          </button>
          <button
            className="btn-icon btn-sm text-danger"
            title="Delete"
            onClick={() => onDelete(farm.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FarmList() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFarms = async () => {
    try {
      const res = await api.get('/farms/');
      setFarms(res.data.results || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFarms(); }, []);

  const deleteFarm = async (id) => {
    if (window.confirm('Delete this farm? This cannot be undone.')) {
      try {
        await api.delete(`/farms/${id}/`);
        fetchFarms();
      } catch (err) { alert('Failed to delete farm'); }
    }
  };

  return (
    <div className="farm-list-page">
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>My Farms</span>
      </div>

      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title">My Farms</h1>
          <p className="page-subtitle text-muted">Manage your agricultural land, products, and performance.</p>
        </div>
        <button className="btn-agr btn-primary d-flex align-items-center gap-2" onClick={() => navigate('/farmer-dashboard/farm/new')}>
          <Plus size={18} /> Add New Farm
        </button>
      </div>

      {loading ? (
        <div className="flex-center py-5"><div className="spinner-agr" /><span className="ms-3 text-muted">Loading farms...</span></div>
      ) : farms.length === 0 ? (
        <div className="agr-card p-5 text-center">
          <Home size={64} className="text-muted mb-3 opacity-25" />
          <h4 className="h5 text-muted mb-2">No farms registered</h4>
          <p className="small text-muted mb-4">Start by adding your first farm to the platform.</p>
          <button className="btn-agr btn-primary" onClick={() => navigate('/farmer-dashboard/farm/new')}>
            Register Your First Farm
          </button>
        </div>
      ) : (
        <div className="farm-grid">
          {farms.map((f, idx) => (
            <FarmCard key={f.id} farm={f} index={idx} onDelete={deleteFarm} />
          ))}
        </div>
      )}
    </div>
  );
}

export default FarmList;
