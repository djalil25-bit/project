import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Tractor, Edit3, Trash2, MapPin, Maximize2, ExternalLink, ChevronRight, Sprout } from 'lucide-react';

/* Gradient palette for farms without images */
const GRADIENTS = [
  'linear-gradient(135deg, #1a4a2e 0%, #4a7c59 100%)',
  'linear-gradient(135deg, #2d5a27 0%, #6aab5e 100%)',
  'linear-gradient(135deg, #3a5a40 0%, #7aab6a 100%)',
  'linear-gradient(135deg, #2e4a1e 0%, #5a8c3e 100%)',
  'linear-gradient(135deg, #1e3a2e 0%, #3a7a5a 100%)',
];

function FarmCard({ farm, index, onDelete }) {
  const navigate = useNavigate();
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const initials = farm.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="f-farm-card" style={{ animationDelay: `${index * 0.07}s` }}>

      {/* Image header */}
      <div
        className="f-farm-card-img-wrap"
        onClick={() => navigate(`/farmer-dashboard/farms/${farm.id}`)}
      >
        {farm.image
          ? <img src={farm.image} alt={farm.name} />
          : (
            <div className="f-farm-card-placeholder" style={{ background: gradient }}>
              <span className="f-farm-card-initials">{initials}</span>
            </div>
          )
        }
        <div className="f-farm-card-overlay">
          <span className="f-farm-card-view-hint">
            <ExternalLink size={12} /> View Details
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="f-farm-card-body">
        <h4 className="f-farm-card-name">{farm.name}</h4>

        <div className="f-farm-card-loc">
          <MapPin size={12} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {farm.location}
          </span>
        </div>

        {/* Stats chips */}
        <div className="f-farm-stats-row">
          {farm.size_hectares && (
            <div className="f-farm-stat-chip">
              <Maximize2 size={11} /> {farm.size_hectares} ha
            </div>
          )}
          <div className="f-farm-stat-chip">
            <Sprout size={11} /> Farm #{farm.id}
          </div>
        </div>

        {farm.description && (
          <p className="f-farm-card-desc">{farm.description}</p>
        )}

        {/* Actions */}
        <div className="f-farm-card-actions">
          <button
            className="btn-f-primary btn-f-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => navigate(`/farmer-dashboard/farms/${farm.id}`)}
          >
            <ExternalLink size={13} /> View
          </button>
          <button
            className="btn-f-icon btn-f-icon-sm"
            title="Edit farm"
            onClick={() => navigate(`/farmer-dashboard/farm/edit/${farm.id}`)}
          >
            <Edit3 size={15} strokeWidth={2.2} />
          </button>
          <button
            className="btn-f-icon btn-f-icon-sm danger"
            title="Delete farm"
            onClick={() => onDelete(farm.id)}
          >
            <Trash2 size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FarmList() {
  const [farms, setFarms]   = useState([]);
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
    if (!window.confirm('Delete this farm? This cannot be undone.')) return;
    try {
      await api.delete(`/farms/${id}/`);
      fetchFarms();
    } catch { alert('Failed to delete farm'); }
  };

  if (loading) return (
    <div className="f-spinner-wrap">
      <div className="f-spinner" />
      <span>Loading farms…</span>
    </div>
  );

  return (
    <div className="farmer-page-wrapper">

      {/* Breadcrumb */}
      <div className="f-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <span>My Farms</span>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--f-forest-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tractor size={24} style={{ color: 'var(--f-olive)' }} strokeWidth={2} /> My Farms
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: '#6b7280', fontSize: '0.88rem' }}>
            Manage your agricultural land, products, and performance.
          </p>
        </div>
        <button className="btn-f-primary" onClick={() => navigate('/farmer-dashboard/farm/new')}>
          <Plus size={17} /> Add New Farm
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="f-card">
          <div className="f-empty-state">
            <div className="f-empty-icon"><Tractor size={32} /></div>
            <div className="f-empty-title">No farms registered</div>
            <div className="f-empty-sub">Start by adding your first farm to the platform.</div>
            <button className="btn-f-primary" onClick={() => navigate('/farmer-dashboard/farm/new')}>
              <Plus size={16} /> Register Your First Farm
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: '1.25rem', fontWeight: 600 }}>
            {farms.length} farm{farms.length !== 1 ? 's' : ''} registered
          </div>
          <div className="f-farm-grid">
            {farms.map((f, idx) => (
              <FarmCard key={f.id} farm={f} index={idx} onDelete={deleteFarm} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
