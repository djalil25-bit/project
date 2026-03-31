import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Plus, Settings, Wheat, TrendingUp, Clock, DollarSign, Sprout,
  Package, Home, ChevronRight, ShoppingCart, BarChart2,
  AlertCircle, CheckCircle, ExternalLink, RefreshCw, User, BadgeCheck
} from 'lucide-react';

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const secs = Math.floor((Date.now() - d) / 1000);
  if (secs < 60) return `il y a ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `il y a ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return d.toLocaleDateString('fr-FR');
}

function FarmerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboards/farmer-stats/');
      setStats(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="loading-wrapper flex-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-agr" /> <span className="ms-3 text-muted">Chargement des données de la ferme...</span>
    </div>
  );

  const recent = stats?.recent_pending_orders || [];

  return (
    <div className="farmer-dashboard animate-fade-in">
      {/* ── FARMER HERO ─────────────────────────────── */}
      <div className="farmer-hero-banner">
        <div className="farmer-hero-deco">🌾🚜🚜🌾</div>
        <div className="farmer-hero-content">
          <div className="farmer-hero-text">
            <div className="farmer-hero-tag">
              <BadgeCheck size={14} /> Espace Producteur Certifié
            </div>
            <h1 className="farmer-hero-title">
              Tableau de bord Agriculteur
            </h1>
            <p className="farmer-hero-sub">
              Gérez votre exploitation, publiez vos récoltes et suivez vos ventes en liaison directe avec le Ministère.
            </p>
            <div className="farmer-hero-actions">
              <button className="farmer-hero-btn" onClick={() => navigate('/farmer-dashboard/product/new')}>
                <Plus size={16} /> Ajouter un produit
              </button>
              <button className="farmer-hero-btn-outline" onClick={() => navigate('/farmer-dashboard/harvests')}>
                <Wheat size={16} /> Mes récoltes
              </button>
              <button className="farmer-hero-btn-outline" onClick={() => navigate('/farmer-dashboard/stats')}>
                <BarChart2 size={16} /> Statistiques
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats KPI cards */}
      {stats && (
        <div className="buyer-kpi-grid mb-4">
          <div className="buyer-kpi-card">
            <div className="buyer-kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <Sprout size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.my_products_count}</div>
              <div className="buyer-kpi-label">Annonces actives</div>
            </div>
          </div>
          <div className="buyer-kpi-card">
            <div className="buyer-kpi-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.total_items_sold}</div>
              <div className="buyer-kpi-label">Unités vendues</div>
            </div>
          </div>
          <div className="buyer-kpi-card">
            <div className="buyer-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Clock size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{stats.pending_orders}</div>
              <div className="buyer-kpi-label">Commandes en attente</div>
            </div>
          </div>
          <div className="buyer-kpi-card">
            <div className="buyer-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
               <DollarSign size={20} />
            </div>
            <div>
              <div className="buyer-kpi-value">{parseFloat(stats.total_revenue || 0).toLocaleString()} <small className="very-small">DZD</small></div>
              <div className="buyer-kpi-label">Revenus totaux</div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Recent Pending Orders (last 24h) */}
        <div className="col-lg-12">
          <div className="farmer-table-card h-100">
            <div className="farmer-table-header">
              <h3 className="agr-card-title d-flex align-items-center gap-2 mb-0">
                <Clock size={18} className="text-warning" /> Commandes Récentes
                <span className="very-small text-muted fw-normal ms-1">(dernières 24h)</span>
              </h3>
              <button
                className="btn-agr btn-link btn-sm text-primary text-decoration-none d-flex align-items-center gap-1 p-0"
                onClick={() => navigate('/farmer/orders?status=PENDING')}
              >
                Voir tout <ChevronRight size={14} />
              </button>
            </div>

            {recent.length === 0 ? (
              <div className="p-5 text-center">
                <CheckCircle size={40} className="text-success mb-3 opacity-50" />
                <h4 className="h6 text-muted">Tout est à jour !</h4>
                <p className="small text-muted mb-3">Aucune nouvelle commande en attente.</p>
                <button className="btn-agr btn-outline btn-sm" onClick={() => navigate('/farmer/orders')}>
                  Consulter l'historique
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="agr-table mb-0">
                  <thead>
                    <tr>
                      <th>Commande #</th>
                      <th>Acheteur</th>
                      <th className="text-end">Total</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(o => {
                      const localNum = o.farmer_order_number
                        ? `#F-${String(o.farmer_order_number).padStart(3, '0')}`
                        : `#${o.id}`;
                      return (
                        <tr key={o.id} className="hover-bg-light">
                          <td>
                            <span className="fw-bold text-primary">{localNum}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="avatar-xs-circle">{o.buyer_name?.charAt(0)?.toUpperCase()}</div>
                              <span className="small fw-medium">{o.buyer_name}</span>
                            </div>
                          </td>
                          <td className="text-end fw-bold small">{o.total.toLocaleString()} DZD</td>
                          <td className="very-small text-muted">{timeAgo(o.created_at)}</td>
                          <td>
                            <button
                               className="btn-icon btn-sm"
                               title="Gérer la commande"
                               onClick={() => navigate('/farmer/orders?status=PENDING')}
                             >
                               <ExternalLink size={14} />
                             </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmerDashboard;
