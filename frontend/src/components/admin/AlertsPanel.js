import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, TrendingDown, ShieldAlert, Clock, 
  Server, ChevronRight, X, Package
} from 'lucide-react';
import adminApi from '../../api/adminApi';

const alertConfig = {
  PRICE_ANOMALY:        { icon: TrendingDown, color: '#DD0033', bgColor: '#FDE8ED', label: 'Price Anomaly' },
  STOCK_IMBALANCE:      { icon: Package,      color: '#FF9900', bgColor: '#FFF4E0', label: 'Stock Imbalance' },
  SUSPICIOUS_ACTIVITY:  { icon: ShieldAlert,  color: '#EAB308', bgColor: '#FEF9C3', label: 'Suspicious Activity' },
  VERIFICATION_PENDING: { icon: Clock,        color: '#0066CC', bgColor: '#E8F0FE', label: 'Pending Verification' },
  SYSTEM_ALERT:         { icon: Server,       color: '#DD0033', bgColor: '#FDE8ED', label: 'System Alert' },
};

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await adminApi.get('/alerts/', { params: { status: 'ACTIVE' } });
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setAlerts(data);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const handleDismiss = async (id) => {
    setDismissed(prev => new Set([...prev, id]));
    try {
      await adminApi.patch(`/alerts/${id}/`, { status: 'DISMISSED' });
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const activeAlerts = alerts.filter(a => !dismissed.has(a.id)).slice(0, 3);

  if (loading) return null;
  if (activeAlerts.length === 0) return null;

  return (
    <div className="space-y-3 anim-fade-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-500" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Active Alerts</h3>
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {activeAlerts.length}
          </span>
        </div>
        <a href="/admin-dashboard/alerts" className="text-xs text-slate-600 font-semibold hover:underline flex items-center gap-1">
          View All Alerts <ChevronRight size={12} />
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {activeAlerts.map(alert => {
          const config = alertConfig[alert.alert_type] || alertConfig['SYSTEM_ALERT'];
          const Icon = config.icon;
          return (
            <div key={alert.id} className={`alert-card alert-${alert.alert_type}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: config.bgColor }}>
                    <Icon size={16} style={{ color: config.color }} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: config.color }}>
                    {config.label}
                  </span>
                </div>
                <button onClick={() => handleDismiss(alert.id)}
                  className="text-gray-300 hover:text-gray-500 transition-colors p-0.5">
                  <X size={14} />
                </button>
              </div>
              <h4 className="text-sm font-semibold text-gray-800 mb-1 leading-snug">
                {alert.product_name || alert.zone || alert.alert_type.replace(/_/g, ' ')}
              </h4>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {alert.details_json?.description || `Severity: ${alert.severity}`}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  className="text-xs font-semibold px-2 py-1 rounded-md transition-colors"
                  style={{ backgroundColor: config.bgColor, color: config.color }}
                  onClick={() => handleDismiss(alert.id)}
                >
                  Acknowledge
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;
