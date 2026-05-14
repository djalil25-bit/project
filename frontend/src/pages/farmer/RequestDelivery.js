import React, { useState, useEffect } from 'react';
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
  Phone
} from 'lucide-react';
import { VEHICLE_TYPES } from '../../utils/constants';

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
    delivery_location: '',
    preferred_delivery_date: '',
    notes: '',
    required_vehicle_type: 'truck',
    estimated_distance_km: '',
    estimated_fee: '',
    estimated_duration: '',
    is_refrigerated: false,
    is_fragile: false
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/farmer-orders/${id}/`);
        const orderData = res.data;
        setOrder(orderData);
        
        setFormData({
          pickup_location: orderData.items?.[0]?.farm_address || '', 
          delivery_location: orderData.delivery_address || '',
          preferred_delivery_date: orderData.preferred_delivery_date || '',
          notes: '',
          required_vehicle_type: 'truck',
          estimated_distance_km: '',
          estimated_fee: orderData.transport_fee || '',
          estimated_duration: '',
          is_refrigerated: false,
          is_fragile: false
        });
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to fetch order details.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.pickup_location.trim() || !formData.delivery_location.trim() || !formData.preferred_delivery_date) {
      setError("Please fill in all required logistics fields.");
      return;
    }

    setSubmitLoading(true);
    setError(null);
    try {
      await api.post('/deliveries/', {
        order: id,
        ...formData,
        estimated_distance_km: formData.estimated_distance_km || 0,
        estimated_fee: formData.estimated_fee || 0
      });
      setSuccess(true);
      setTimeout(() => navigate('/farmer-dashboard/orders'), 2500);
    } catch (err) {
      console.error("Delivery request failed:", err.response?.data);
      const backendError = err.response?.data;
      let detailedError = "Failed to create delivery request.";

      if (backendError) {
        if (typeof backendError === 'string') {
          detailedError = backendError;
        } else if (backendError.error) {
          detailedError = backendError.error;
        } else if (backendError.detail) {
          detailedError = backendError.detail;
        } else if (typeof backendError === 'object') {
          const fieldErrors = Object.entries(backendError)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
            .join(' | ');
          if (fieldErrors) detailedError = fieldErrors;
        }
      }
      setError(detailedError);
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
        <div className="f-empty-title">Access Denied or Order Not Found</div>
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
              Configure your freight parameters to match with active transporters in your region. 
              Accurate details ensure faster pick-up and safer delivery.
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
            <div className="f-badge f-badge-active">Priority Request</div>
          </div>
          
          <div className="f-card-body">
            {success ? (
              <div className="f-empty-state" style={{ padding: '3rem 1rem' }}>
                <div className="f-empty-icon" style={{ background: 'var(--f-mint)', color: 'var(--f-forest)', width: 80, height: 80 }}>
                  <CheckCircle size={48} strokeWidth={2.2} />
                </div>
                <div className="f-empty-title" style={{ fontSize: '1.5rem' }}>Request Posted Successfully!</div>
                <div className="f-empty-sub">Your request is now live in the Transporter Market. Redirecting to your dashboard...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="f-alert f-alert-danger">
                    <AlertCircle size={16} /> <div>{error}</div>
                  </div>
                )}

                <div className="f-form-section">
                  <div className="f-form-section-title">Route Information</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="f-form-group">
                      <label className="f-form-label">
                        <MapPin size={14} style={{ color: 'var(--f-forest)' }} /> Pickup Point <span className="req">*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="text" required className="f-input"
                          style={{ paddingLeft: '2.5rem' }}
                          value={formData.pickup_location}
                          onChange={e => setFormData({...formData, pickup_location: e.target.value})}
                          placeholder="Farm address, Warehouse gate, etc."
                        />
                        <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                      </div>
                      <div className="f-form-hint">Transporters will use this for GPS navigation.</div>
                    </div>

                    <div className="f-form-group">
                      <label className="f-form-label">
                        <MapPin size={14} style={{ color: 'var(--f-red)' }} /> Drop-off Destination <span className="req">*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="text" required className="f-input"
                          style={{ paddingLeft: '2.5rem' }}
                          value={formData.delivery_location}
                          onChange={e => setFormData({...formData, delivery_location: e.target.value})}
                          placeholder="Buyer's store, Distribution center..."
                        />
                        <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, color: 'var(--f-red)' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <div className="f-form-group">
                      <label className="f-form-label">Transport Fee (DZD)</label>
                      <input 
                        type="number" className="f-input"
                        value={formData.estimated_fee}
                        onChange={e => setFormData({...formData, estimated_fee: e.target.value})}
                        placeholder="e.g. 4500"
                      />
                    </div>
                  </div>
                </div>

                <div className="f-form-section">
                  <div className="f-form-section-title">Schedule & Vehicle</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="f-form-group">
                      <label className="f-form-label">
                        <Calendar size={14} style={{ color: 'var(--f-gold)' }} /> Desired Delivery Date <span className="req">*</span>
                      </label>
                      <input 
                        type="date" required className="f-input"
                        value={formData.preferred_delivery_date}
                        onChange={e => setFormData({...formData, preferred_delivery_date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="f-form-group">
                      <label className="f-form-label">
                        <Truck size={14} style={{ color: 'var(--f-forest)' }} /> Required Vehicle Type
                      </label>
                      <select 
                        className="f-input f-select"
                        value={formData.required_vehicle_type}
                        onChange={e => setFormData({...formData, required_vehicle_type: e.target.value})}
                      >
                        {VEHICLE_TYPES.map(vt => (
                          <option key={vt.id} value={vt.id}>{vt.name}</option>
                        ))}
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
                      <span className="text-sm font-bold text-slate-700">Refrigerated required</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_fragile}
                        onChange={e => setFormData({...formData, is_fragile: e.target.checked})}
                        className="w-4 h-4 accent-[#2E6F40]"
                      />
                      <span className="text-sm font-bold text-slate-700">Fragile cargo</span>
                    </label>
                  </div>
                </div>

                <div className="f-form-section" style={{ marginBottom: '1rem' }}>
                  <div className="f-form-section-title">Operational Notes</div>
                  <div className="f-form-group">
                    <label className="f-form-label">
                      <FileText size={14} style={{ color: 'var(--f-olive)' }} /> Handling Instructions <span className="opt">(optional)</span>
                    </label>
                    <textarea 
                      className="f-input f-textarea" rows="4"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="e.g. Needs tarp cover, call upon arrival at gate 4..."
                    />
                  </div>
                </div>

                <div className="f-card-footer" style={{ padding: '1.5rem 0 0', borderTop: '1px solid var(--f-mint-deep)', background: 'transparent' }}>
                  <button type="button" className="btn-f-ghost" onClick={() => navigate('/farmer-dashboard/orders')}>
                    Discard
                  </button>
                  <button type="submit" className="btn-f-primary" disabled={submitLoading} style={{ minWidth: '180px', justifyContent: 'center' }}>
                    {submitLoading ? 'Processing...' : <><ArrowRight size={18} /> Post Logistics Request</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar: Order Summary (Premium Manifest Style) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="f-card" style={{ background: 'var(--f-forest-dark)', color: '#fff', border: 'none' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Box size={20} style={{ color: 'var(--f-gold)' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Freight Manifest</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>Order #{id}</h3>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {order.items?.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: idx === order.items.length -1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.product_name}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Qty: {item.quantity} units</div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--f-gold)' }}>{item.item_total} DZD</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Goods Subtotal</span>
                  <span style={{ fontWeight: 700 }}>{order.farmer_total || order.total_price} DZD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Est. Freight Value</span>
                  <span style={{ fontWeight: 900, color: 'var(--f-gold)', fontSize: '1.1rem' }}>{order.farmer_total || order.total_price} DZD</span>
                </div>
              </div>
            </div>
          </div>

          <div className="f-card" style={{ background: '#fff' }}>
            <div className="f-card-body" style={{ padding: '1.25rem' }}>
              <div className="f-section-title" style={{ marginBottom: '1rem' }}>
                <div className="f-section-title-icon" style={{ background: 'var(--f-gold-light)', color: 'var(--f-amber)' }}><User size={14} /></div>
                Buyer Profile
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="f-avatar" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                  {order.buyer_name?.charAt(0) || 'B'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{order.buyer_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={12} /> {order.wilaya || 'Region Specified'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--f-mist)', borderRadius: '10px', fontSize: '0.85rem' }}>
                  <Phone size={14} style={{ color: 'var(--f-forest)' }} />
                  <span style={{ fontWeight: 600 }}>{order.buyer_phone || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--f-mist)', borderRadius: '10px', fontSize: '0.85rem' }}>
                  <Mail size={14} style={{ color: 'var(--f-forest)' }} />
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.buyer_email || 'N/A'}</span>
                </div>
              </div>

              {order.notes && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', position: 'relative' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#b45309', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Info size={12} /> Buyer's Order Note
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#92400e', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{order.notes}"
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: 'var(--f-radius-lg)', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#166534', fontWeight: 800, fontSize: '0.85rem' }}>
              <ShieldCheck size={18} /> Secure Logistics
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#14532d', lineHeight: 1.5 }}>
              Your goods are tracked. Transporters on AgriGov are verified and background checked for your security.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RequestDelivery;

