import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Home, Edit3, Trash2, MapPin, Maximize, Calendar, ChevronRight } from 'lucide-react';

function FarmList() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFarms = async () => {
    try {
      const res = await api.get('/farms/');
      setFarms(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFarms(); }, []);

  const deleteFarm = async (id) => {
    if (window.confirm('Are you sure you want to delete this farm?')) {
      try {
        await api.delete(`/farms/${id}/`);
        fetchFarms();
      } catch (err) {
        alert("Failed to delete farm");
      }
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
          <p className="page-subtitle text-muted">Manage your registered agricultural land and facilities.</p>
        </div>
        <button className="btn-agr btn-primary d-flex align-items-center" onClick={() => navigate('/farmer-dashboard/farm/new')}>
          <Plus size={18} className="me-2" /> Add New Farm
        </button>
      </div>

      <div className="agr-card" style={{ overflow: 'visible' }}>
        {loading ? (
          <div className="loading-wrapper flex-center py-5">
            <div className="spinner-agr" /> <span className="ms-3 text-muted">Loading farms...</span>
          </div>
        ) : farms.length === 0 ? (
          <div className="p-5 text-center w-100">
            <Home size={48} className="text-muted mb-3 opacity-25" />
            <h4 className="h5 text-muted mb-2">No farms registered</h4>
            <p className="small text-muted mb-4">Start by adding your first farm to the platform.</p>
            <button className="btn-agr btn-primary" onClick={() => navigate('/farmer-dashboard/farm/new')}>
              Add Your First Farm
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-agr">
              <thead>
                <tr>
                  <th>Farm Identity</th>
                  <th>Location</th>
                  <th>Land Size</th>
                  <th>Description</th>
                  <th>Registered</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {farms.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div className="fw-bold text-dark d-flex align-items-center">
                        <Home size={14} className="me-2 text-primary" /> {f.name}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center text-muted small">
                        <MapPin size={12} className="me-1" /> {f.location}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center text-muted small">
                        <Maximize size={12} className="me-1" /> {f.size_hectares} ha
                      </div>
                    </td>
                    <td>
                      <div className="text-muted small text-truncate" style={{ maxWidth: '200px' }} title={f.description}>
                        {f.description || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center text-muted small">
                        <Calendar size={12} className="me-1" /> {new Date(f.created_at || new Date()).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn-action btn-action-secondary" title="Edit" onClick={() => navigate(`/farmer-dashboard/farm/edit/${f.id}`)}>
                          <Edit3 size={16} />
                        </button>
                        <button className="btn-action btn-action-danger" title="Delete" onClick={() => deleteFarm(f.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmList;
