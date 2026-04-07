import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Truck, 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Package,
  User,
  ShoppingBag,
  Clock,
  Mail,
  Phone,
  ArrowRight,
  Info,
  ChevronRight
} from 'lucide-react';

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
    vehicle_size: 'Any/Standard'
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/farmer-orders/${id}/`);
        const orderData = res.data;
        setOrder(orderData);
        
        // Pre-fill form
        // We use the first item's farm_address or a default if not found
        // Usually, the farmer knows their address, but pre-filling helps.
        setFormData({
          pickup_location: orderData.items?.[0]?.farm_address || '', 
          delivery_location: orderData.delivery_address || '',
          preferred_delivery_date: orderData.preferred_delivery_date || '',
          notes: '',
          vehicle_size: 'Any/Standard'
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
    
    // Basic validation
    if (!formData.pickup_location.trim() || !formData.delivery_location.trim() || !formData.preferred_delivery_date) {
      setError("Please fill in all required logistics fields.");
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
      setTimeout(() => navigate('/farmer/orders'), 2500);
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
          // Flatten field-specific errors: { "pickup_location": ["This field is required."] }
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
        <button className="btn-f-primary" onClick={() => navigate('/farmer/orders')}>
          Return to Orders
        </button>
      </div>
    </div>
  );

  return (
    <div className="farmer-page-wrapper">
      
      {/* Breadcrumb */}
      <div className="f-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <Link to="/farmer-dashboard/orders">Orders</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <span>Logistics Request #{id}</span>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--f-forest-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={24} style={{ color: 'var(--f-olive)' }} /> Request Transporter
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: '#6b7280', fontSize: '0.88rem' }}>
            Select your logistics parameters to matching with active drivers.
          </p>
        </div>
        <button onClick={() => navigate('/farmer-dashboard/orders')} className="btn-f-ghost btn-f-sm">
          <ChevronLeft size={16} strokeWidth={2.2} /> Back to Orders
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Main Content: Form */}
        <div className="f-card">
          <div className="f-card-body">
            
            {success ? (
              <div className="f-empty-state">
                <div className="f-empty-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  <CheckCircle size={36} strokeWidth={2.2} />
                </div>
                <div className="f-empty-title">Request Posted Successfully!</div>
                <div className="f-empty-sub">Your request is now live in the Transporter Market Dashboard. Redirecting...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="f-alert f-alert-danger">
                    <AlertCircle size={16} /> <div>{error}</div>
                  </div>
                )}

                <div className="f-info-tip" style={{ marginBottom: '1.5rem' }}>
                  <Info size={18} style={{ color: 'var(--f-forest)' }} />
                  <div>Accurate addresses help transporters provide better service. Be descriptive with landmarks.</div>
                </div>

                <div className="f-form-section">
                  <div className="f-form-section-title">Logistics Details</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="f-form-group">
                      <label className="f-form-label">
                        <MapPin size={14} style={{ color: 'var(--f-olive)' }} /> Pickup Location
                      </label>
                      <input 
                        type="text" required className="f-input"
                        value={formData.pickup_location}
                        onChange={e => setFormData({...formData, pickup_location: e.target.value})}
                        placeholder="e.g. Green Valley Farm, Gate 2"
                      />
                    </div>

                    <div className="f-form-group">
                      <label className="f-form-label">
                        <MapPin size={14} style={{ color: 'var(--f-red)' }} /> Delivery Destination
                      </label>
                      <input 
                        type="text" required className="f-input"
                        value={formData.delivery_location}
                        onChange={e => setFormData({...formData, delivery_location: e.target.value})}
                        placeholder="e.g. Rue de l'Independance, No 45"
                      />
                    </div>

                    <div className="f-form-group">
                      <label className="f-form-label">
                        <Calendar size={14} style={{ color: 'var(--f-olive)' }} /> Delivery Date
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
                        <Truck size={14} style={{ color: 'var(--f-olive)' }} /> Required Vehicle
                      </label>
                      <select 
                        className="f-input f-select"
                        value={formData.vehicle_size}
                        onChange={e => setFormData({...formData, vehicle_size: e.target.value})}
                      >
                        <option value="Any/Standard">Any / Standard</option>
                        <option value="Small Van">Small Van</option>
                        <option value="Pickup Truck">Pickup Truck</option>
                        <option value="Large Truck (>3T)">Large Truck &gt; 3 Tons</option>
                        <option value="Cooled Container">Refrigerated / Cooled</option>
                        <option value="Motorcycle (Small docs/samples)">Motorcycle</option>
                      </select>
                    </div>
                  </div>

                  <div className="f-form-group" style={{ marginTop: '0.5rem' }}>
                    <label className="f-form-label">
                      <FileText size={14} style={{ color: 'var(--f-olive)' }} /> Instructions for Transporter <span className="opt">(optional)</span>
                    </label>
                    <textarea 
                      className="f-input f-textarea" rows="3"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="e.g. Handle with care, fragile produce only. Vehicle with cooling system preferred."
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(26,74,46,0.08)' }}>
                  <button type="submit" className="btn-f-primary" disabled={submitLoading} style={{ flex: 1, justifyContent: 'center' }}>
                    {submitLoading ? 'Processing...' : <><ArrowRight size={16} strokeWidth={2.2} /> Post Request</>}
                  </button>
                  <button type="button" className="btn-f-ghost" onClick={() => navigate('/farmer-dashboard/orders')}>
                    Discard
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar Area: Order Discovery & Summary */}
        <div className="f-info-panel">
          <div className="f-info-panel-header" style={{ marginBottom: '1rem', borderBottom: 'none' }}>
            <FileText size={16} style={{ color: 'var(--f-olive)' }} /> Order Request Summary
          </div>

          <div className="f-logistics-card" style={{ marginBottom: '1rem' }}>
            <div className="f-logistics-field">
              <div className="f-logistics-field-label">Buyer</div>
              <div className="f-logistics-field-value">{order.buyer_name}</div>
              <div className="f-info-field-sub"><MapPin size={10} style={{ marginRight: 2 }} /> {order.wilaya || 'Region Specified'}</div>
            </div>
            <div className="f-logistics-field" style={{ marginTop: '0.75rem' }}>
              <div className="f-logistics-field-label">Contact</div>
              <div className="f-info-field-sub"><Phone size={11} style={{ marginRight: 3}} /> {order.buyer_phone || 'N/A'}</div>
              <div className="f-info-field-sub"><Mail size={11} style={{ marginRight: 3}} /> {order.buyer_email || 'N/A'}</div>
            </div>
          </div>

          <div className="f-logistics-card">
            <div className="f-logistics-field">
              <div className="f-logistics-field-label">Freight Content</div>
              {order.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', padding: '0.5rem 0', fontSize: '0.8rem' }}>
                  <div>
                     <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                     <div style={{ color: '#9ca3af', fontSize: '0.7rem' }}>Qty: {item.quantity} units</div>
                  </div>
                  <div style={{ fontWeight: 800 }}>{item.item_total} DZD</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px dashed #e5e7eb' }}>
               <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af'}}>Total Est Value</div>
               <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--f-forest)' }}>{order.farmer_total || order.total_price} DZD</div>
            </div>
          </div>
          
          {order.notes && (
            <div className="f-info-tip" style={{ marginTop: '1rem', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
              <Info size={16} />
              <div><strong style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Buyer Note</strong> "{order.notes}"</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDelivery;

