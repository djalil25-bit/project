import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Calendar, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Map, 
  FileText, 
  Package, 
  Info, 
  ShieldCheck,
  Box,
  User,
  Mail,
  Phone,
  Timer,
  Route,
  Zap
} from 'lucide-react';
import { VEHICLE_TYPES } from '../../utils/constants';
import { WILAYA_DATA } from '../../utils/algeria_locations';
import { getLogisticsData, calculateAutomaticPrice, getWilayaCoords } from '../../utils/logistics_engine';

const RequestDelivery = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    pickup_location: '',
    pickup_wilaya: '',
    pickup_commune: '',
    delivery_location: '',
    delivery_wilaya: '',
    delivery_commune: '',
    preferred_delivery_date: '',
    required_vehicle_type: 'standard',
    notes: '',
    estimated_distance_km: 0,
    estimated_fee: 0,
    estimated_duration: '',
    is_refrigerated: false,
    is_fragile: false
  });

  const [pricingDetails, setPricingDetails] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/farmer-orders/${id}/`);
        const orderData = res.data;
        setOrder(orderData);
        
        // Initial data population from order items (farm info)
        const farmWilaya = orderData.items?.[0]?.farm_wilaya || '';
        const farmCommune = orderData.items?.[0]?.farm_commune || '';
        
        setFormData(prev => ({
          ...prev,
          pickup_location: orderData.items?.[0]?.farm_address || '', 
          pickup_wilaya: farmWilaya,
          pickup_commune: farmCommune,
          delivery_location: orderData.delivery_address || '',
          delivery_wilaya: orderData.wilaya || '',
          delivery_commune: orderData.commune || '',
          preferred_delivery_date: orderData.preferred_delivery_date || '',
          estimated_fee: orderData.transport_fee || 0,
        }));
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to fetch order details.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  // Handle Automatic Pricing Calculation
  useEffect(() => {
    const updateLogistics = async () => {
      if (!formData.pickup_wilaya || !formData.delivery_wilaya) return;
      
      setIsCalculating(true);
      try {
        const firstItem = order?.items?.[0]?.product_detail || {};
        const farmCoords = firstItem.farm_latitude && firstItem.farm_longitude
          ? { lat: firstItem.farm_latitude, lng: firstItem.farm_longitude }
          : getWilayaCoords(formData.pickup_wilaya);
          
        const pickupCoords = farmCoords;
        const destCoords = getWilayaCoords(formData.delivery_wilaya);
        
        if (pickupCoords && destCoords) {
          const logData = await getLogisticsData(pickupCoords, destCoords);
          const totalWeight = order?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
          
          // ── PARITY CHECK ──
          // If this matches the order's original destination, use the official fee the buyer paid
          if (order && order.transport_fee && formData.delivery_wilaya === order.wilaya) {
             setFormData(prev => ({
               ...prev,
               estimated_distance_km: logData.distance_km,
               estimated_duration: logData.duration_text,
               estimated_fee: order.transport_fee
             }));
             setPricingDetails({
               total_fee: order.transport_fee,
               breakdown: { base: 0, distance: 0, weight: 0 } // Breakdown hidden anyway
             });
          } else {
            // Re-calculate if destination changed
            const pricingRes = await api.post('/deliveries/calculate_fee/', {
              distance: logData.distance_km,
              weight: totalWeight,
              vehicle_type: 'standard'
            });
            
            const pricing = pricingRes.data;
            setPricingDetails(pricing);
            setFormData(prev => ({ 
              ...prev, 
              estimated_distance_km: logData.distance_km,
              estimated_duration: logData.duration_text,
              estimated_fee: pricing.total_fee,
            }));
          }
        }
      } catch (err) {
        console.error("Logistics calculation error:", err);
      } finally {
        setIsCalculating(false);
      }
    };

    const timer = setTimeout(updateLogistics, 500);
    return () => clearTimeout(timer);
  }, [formData.pickup_wilaya, formData.delivery_wilaya, formData.required_vehicle_type, order]);

  const communesForPickup = useMemo(() => {
    const w = WILAYA_DATA.find(d => d.name === formData.pickup_wilaya);
    return w ? w.communes : [];
  }, [formData.pickup_wilaya]);

  const communesForDelivery = useMemo(() => {
    const w = WILAYA_DATA.find(d => d.name === formData.delivery_wilaya);
    return w ? w.communes : [];
  }, [formData.delivery_wilaya]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.pickup_wilaya || !formData.delivery_wilaya || !formData.preferred_delivery_date) {
      setError("Please fill in all required location and date fields.");
      return;
    }

    setSubmitLoading(true);
    setError(null);
    try {
      await api.post('/deliveries/', {
        order: id,
        ...formData
      });
      setSuccess(true);
      setTimeout(() => navigate('/farmer-dashboard/orders'), 2500);
    } catch (err) {
      console.error("Delivery request failed:", err.response?.data);
      setError(err.response?.data?.error || "Failed to create delivery request.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return (
    <div className="f-spinner-wrap">
      <div className="f-spinner" />
      <span>Preparing logistics panel...</span>
    </div>
  );

  if (error && !order) return (
    <div className="farmer-page-wrapper">
      <div className="f-empty-state">
        <div className="f-empty-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
          <AlertCircle size={32} />
        </div>
        <div className="f-empty-title">Order Not Found</div>
        <div className="f-empty-sub">{error}</div>
        <button className="btn-f-primary" onClick={() => navigate('/farmer-dashboard/orders')}>
          Return to Orders
        </button>
      </div>
    </div>
  );

  return (
    <div className="farmer-page-wrapper">
      
      {/* Breadcrumb */}
      <div className="f-breadcrumb" style={{ marginBottom: '1.5rem' }}>
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <Link to="/farmer-dashboard/orders">Orders</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <span style={{ fontWeight: 700, color: 'var(--f-forest)' }}>Logistics Request #{id}</span>
      </div>

      {/* Hero Header */}
      <div className="f-hero" style={{ padding: '2rem 2.5rem', marginBottom: '2rem' }}>
        <div className="f-hero-inner">
          <div>
            <div className="f-hero-badge">
              <Truck size={12} /> Logistics Integration
            </div>
            <h1 className="f-hero-title">Request Transporter</h1>
            <p className="f-hero-subtitle">
              Configure your freight parameters. Transport pricing is calculated automatically using modern routing engines.
            </p>
          </div>
          <button onClick={() => navigate('/farmer-dashboard/orders')} className="btn-f-hero-ghost">
            <ChevronLeft size={16} /> Back to Orders
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Main Content: Form */}
        <div className="f-card" style={{ border: 'none', boxShadow: 'var(--f-shadow-hover)' }}>
          <div className="f-card-header" style={{ background: '#fff', borderBottom: '1px solid var(--f-mint-deep)' }}>
            <div className="f-section-title">
              <div className="f-section-title-icon"><Map size={16} /></div>
              Logistics Configuration
            </div>
            <div className="f-badge f-badge-active">Smart Pricing Engine</div>
          </div>
          
          <div className="f-card-body">
            {success ? (
              <div className="f-empty-state" style={{ padding: '3rem 1rem' }}>
                <div className="f-empty-icon" style={{ background: 'var(--f-mint)', color: 'var(--f-forest)', width: 80, height: 80 }}>
                  <CheckCircle size={48} strokeWidth={2.2} />
                </div>
                <div className="f-empty-title" style={{ fontSize: '1.5rem' }}>Request Posted!</div>
                <div className="f-empty-sub">Your request is live. Redirecting...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="f-alert f-alert-danger">
                    <AlertCircle size={16} /> <div>{error}</div>
                  </div>
                )}

                <div className="f-form-section">
                  <div className="f-form-section-title">Pickup Information (Origin)</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="f-form-group">
                      <label className="f-form-label">Wilaya <span className="req">*</span></label>
                      <select 
                        required className="f-input f-select"
                        value={formData.pickup_wilaya}
                        onChange={e => setFormData({...formData, pickup_wilaya: e.target.value, pickup_commune: ''})}
                      >
                        <option value="">Select Wilaya</option>
                        {WILAYA_DATA.map(w => <option key={w.id} value={w.name}>{w.id} - {w.name}</option>)}
                      </select>
                    </div>

                    <div className="f-form-group">
                      <label className="f-form-label">Commune</label>
                      <select 
                        className="f-input f-select"
                        value={formData.pickup_commune}
                        onChange={e => setFormData({...formData, pickup_commune: e.target.value})}
                        disabled={!formData.pickup_wilaya}
                      >
                        <option value="">Select Commune</option>
                        {communesForPickup.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="f-form-group" style={{ marginTop: '0.5rem' }}>
                    <label className="f-form-label">Address Instructions</label>
                    <input 
                      type="text" className="f-input"
                      value={formData.pickup_location}
                      onChange={e => setFormData({...formData, pickup_location: e.target.value})}
                      placeholder="e.g. Farm Gate 2, Route de..."
                    />
                  </div>
                </div>

                <div className="f-form-section">
                  <div className="f-form-section-title">Delivery Information (Destination)</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="f-form-group">
                      <label className="f-form-label">Wilaya <span className="req">*</span></label>
                      <select 
                        required className="f-input f-select"
                        value={formData.delivery_wilaya}
                        onChange={e => setFormData({...formData, delivery_wilaya: e.target.value, delivery_commune: ''})}
                      >
                        <option value="">Select Wilaya</option>
                        {WILAYA_DATA.map(w => <option key={w.id} value={w.name}>{w.id} - {w.name}</option>)}
                      </select>
                    </div>

                    <div className="f-form-group">
                      <label className="f-form-label">Commune</label>
                      <select 
                        className="f-input f-select"
                        value={formData.delivery_commune}
                        onChange={e => setFormData({...formData, delivery_commune: e.target.value})}
                        disabled={!formData.delivery_wilaya}
                      >
                        <option value="">Select Commune</option>
                        {communesForDelivery.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="f-form-group" style={{ marginTop: '0.5rem' }}>
                    <label className="f-form-label">Address</label>
                    <input 
                      type="text" className="f-input"
                      value={formData.delivery_location}
                      onChange={e => setFormData({...formData, delivery_location: e.target.value})}
                      placeholder="e.g. Store Warehouse, Shop #12..."
                    />
                  </div>
                </div>

                <div className="f-form-section">
                  <div className="f-form-section-title">Logistics Details</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="f-form-group">
                      <label className="f-form-label">Preferred Date <span className="req">*</span></label>
                      <input 
                        type="date" required className="f-input"
                        value={formData.preferred_delivery_date}
                        onChange={e => setFormData({...formData, preferred_delivery_date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="f-form-group">
                      <label className="f-form-label">Vehicle Category</label>
                      <select 
                        className="f-input f-select"
                        value={formData.required_vehicle_type}
                        onChange={e => setFormData({...formData, required_vehicle_type: e.target.value})}
                      >
                        <option value="standard">Standard (Any)</option>
                        <option value="truck">Truck</option>
                        <option value="van">Van</option>
                        <option value="refrigerated_truck">Refrigerated Truck</option>
                        <option value="pickup">Pickup</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_refrigerated}
                        onChange={e => setFormData({...formData, is_refrigerated: e.target.checked})}
                        className="w-4 h-4 accent-[#2E6F40]"
                      />
                      <span className="text-sm font-bold text-slate-700">Refrigerated</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_fragile}
                        onChange={e => setFormData({...formData, is_fragile: e.target.checked})}
                        className="w-4 h-4 accent-[#2E6F40]"
                      />
                      <span className="text-sm font-bold text-slate-700">Fragile</span>
                    </label>
                  </div>
                </div>

                <div className="f-card-footer" style={{ padding: '1.5rem 0 0', borderTop: '1px solid var(--f-mint-deep)', background: 'transparent' }}>
                  <button type="button" className="btn-f-ghost" onClick={() => navigate('/farmer-dashboard/orders')}>
                    Discard
                  </button>
                  <button type="submit" className="btn-f-primary" disabled={submitLoading || isCalculating} style={{ minWidth: '180px', justifyContent: 'center' }}>
                    {submitLoading ? 'Processing...' : <><ArrowRight size={18} /> Confirm Logistics</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar: Smart Pricing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="f-card" style={{ background: '#1e293b', color: '#fff', border: 'none', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Zap size={20} className="text-amber-400" fill="currentColor" />
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Institutional Transport Quote</h3>
                  <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>MINISTRY APPROVED</div>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {isCalculating ? (
                <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                  <div className="f-spinner" style={{ borderLeftColor: '#fff', margin: '0 auto 1rem' }} />
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Calculating optimal route...</div>
                </div>
              ) : pricingDetails ? (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span className="opacity-70">Distance</span>
                      <span className="font-bold">{formData.estimated_distance_km} KM</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span className="opacity-70">Duration</span>
                      <span className="font-bold">{formData.estimated_duration}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#eab308', borderRadius: '12px', color: '#000' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem', opacity: 0.7 }}>Institutional Assignment Fee</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900 }}>{formData.estimated_fee}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>DZD</span>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '1rem', fontSize: '0.7rem', opacity: 0.5, fontStyle: 'italic' }}>
                    * Fee based on road distance, payload weight, and vehicle multiplier.
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0', opacity: 0.5 }}>
                  <Navigation size={32} style={{ margin: '0 auto 1rem' }} />
                  <div style={{ fontSize: '0.8rem' }}>Awaiting route input...</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: 'var(--f-forest-dark)', color: '#fff', borderRadius: 'var(--f-radius-lg)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={16} className="text-amber-400" /> Freight Manifest
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {order?.items?.map(item => (
                <div key={item.id} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span className="opacity-70">{item.product_name}</span>
                  <span className="font-bold">{item.quantity} units</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RequestDelivery;
