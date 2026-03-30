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
  Info
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
    <div className="flex-center py-5" style={{ minHeight: '400px' }}>
      <div className="spinner-agr"></div>
      <span className="ms-3 text-muted fw-medium border-start ps-3">Preparing logistics panel...</span>
    </div>
  );

  if (error && !order) return (
    <div className="container py-5">
      <div className="agr-card p-5 text-center border-danger-soft">
        <div className="mb-4 d-inline-flex p-3 bg-danger-soft rounded-circle text-danger">
          <AlertCircle size={40} />
        </div>
        <h2 className="h4 fw-bold mb-2">Access Denied or Order Not Found</h2>
        <p className="text-muted mb-4">{error}</p>
        <button className="btn-agr btn-primary px-4" onClick={() => navigate('/farmer/orders')}>
          Return to Orders
        </button>
      </div>
    </div>
  );

  return (
    <div className="request-delivery-page pb-5">
      {/* Header Section */}
      <div className="bg-white border-bottom mb-4">
        <div className="container py-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <button 
                className="btn-icon btn-outline-secondary me-3 rounded-circle" 
                onClick={() => navigate('/farmer/orders')}
                title="Back to Orders"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="h3 mb-1 fw-bold">Request Transporter</h1>
                <nav className="agr-breadcrumb mb-0 p-0 bg-transparent" style={{ fontSize: '0.8rem' }}>
                  <Link to="/farmer-dashboard">Farmer Hub</Link>
                  <span className="mx-2 text-muted">/</span>
                  <Link to="/farmer/orders">Orders</Link>
                  <span className="mx-2 text-muted">/</span>
                  <span className="text-primary fw-bold">Logistics Request #{id}</span>
                </nav>
              </div>
            </div>
            <div className="d-none d-md-block">
               <span className="badge-agr role-farmer px-3 py-2">
                 <Truck size={14} className="me-2" /> Logistics Mode
               </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row g-4">
          {/* Main Content: Form */}
          <div className="col-lg-8">
            <div className="agr-card shadow-sm border-0 overflow-hidden">
              <div className="agr-card-header bg-white p-4 border-bottom d-flex align-items-center">
                <div className="p-2 bg-primary-soft rounded text-primary me-3">
                  <Truck size={24} />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Logistics Fulfillment Form</h5>
                  <p className="very-small text-muted mb-0">Fill in the details for the transporter to see on the mission board.</p>
                </div>
              </div>
              
              {success ? (
                <div className="p-5 text-center fade-in">
                  <div className="mb-4 d-inline-flex p-4 bg-success-soft rounded-circle text-success shadow-sm">
                    <CheckCircle size={64} />
                  </div>
                  <h2 className="fw-bold text-success mb-2">Request Posted Successfully!</h2>
                  <p className="text-muted mb-4 lead">Your request is now live in the Transporter Market Dashboard.</p>
                  <div className="very-small text-muted bg-light p-2 rounded d-inline-block">
                    Redirecting you to orders in a few seconds...
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-4 p-md-5">
                  {error && (
                    <div className="alert alert-danger border-0 shadow-sm mb-4 py-3 d-flex align-items-center">
                      <AlertCircle size={20} className="me-3 flex-shrink-0" /> 
                      <div className="small fw-semibold">{error}</div>
                    </div>
                  )}

                  <div className="row g-4 mb-4">
                    <div className="col-12">
                      <div className="bg-light-soft p-3 rounded-4 border border-dashed text-primary-dark d-flex align-items-start mb-2">
                        <Info size={18} className="me-3 mt-1 flex-shrink-0" />
                        <p className="very-small mb-0 fw-medium">
                          Accurate addresses help transporters provide better service. Please be as descriptive as possible with landmarks.
                        </p>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-gray-700 mb-2 d-flex align-items-center">
                        <MapPin size={16} className="me-2 text-primary" /> Pickup Location (Origin)
                      </label>
                      <div className="input-group-agr">
                        <input 
                          type="text" required className="form-control-agr py-3" 
                          value={formData.pickup_location}
                          onChange={e => setFormData({...formData, pickup_location: e.target.value})}
                          placeholder="e.g. Green Valley Farm, Gate 2, Blida"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-gray-700 mb-2 d-flex align-items-center">
                        <MapPin size={16} className="me-2 text-danger" /> Delivery Destination
                      </label>
                      <div className="input-group-agr">
                        <input 
                          type="text" required className="form-control-agr py-3" 
                          value={formData.delivery_location}
                          onChange={e => setFormData({...formData, delivery_location: e.target.value})}
                          placeholder="e.g. Rue de l'Independance, No 45, Algiers"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-gray-700 mb-2 d-flex align-items-center">
                        <Calendar size={16} className="me-2 text-info" /> Preferred Delivery Date
                      </label>
                      <input 
                        type="date" required className="form-control-agr py-3 text-center" 
                        value={formData.preferred_delivery_date}
                        onChange={e => setFormData({...formData, preferred_delivery_date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-gray-700 mb-2 d-flex align-items-center">
                        <Truck size={16} className="me-2 text-warning" /> Required Truck/Vehicle Size
                      </label>
                      <select 
                        className="form-control-agr py-3"
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

                    <div className="col-12 d-flex align-items-end">
                       <div className="p-3 bg-gray-50 rounded-4 w-100 border text-muted small text-center mb-1">
                         <Clock size={14} className="me-2" /> Mission status will start as <span className="fw-bold text-primary">OPEN</span>
                       </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold small text-gray-700 mb-2 d-flex align-items-center">
                        <FileText size={16} className="me-2 text-gray-400" /> Instructions for Transporter
                      </label>
                      <textarea 
                        className="form-control-agr p-3" rows="4"
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        placeholder="e.g. Handle with care, fragile produce only. Vehicle with cooling system preferred."
                      />
                    </div>
                  </div>

                  <div className="d-flex flex-column flex-md-row gap-3 pt-4 border-top">
                    <button type="button" className="btn-agr btn-outline flex-grow-1 py-3 fw-bold" onClick={() => navigate('/farmer/orders')}>
                      Discard Changes
                    </button>
                    <button type="submit" className="btn-agr btn-primary flex-grow-2 py-3 fw-bold shadow-lg" disabled={submitLoading}>
                      {submitLoading ? (
                        <><span className="spinner-border spinner-border-sm me-2" /> Processing...</>
                      ) : (
                        <span className="d-flex align-items-center justify-content-center">
                          Post Request to Transporter Market <ArrowRight size={18} className="ms-2" />
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar Area: Order Discovery & Summary */}
          <div className="col-lg-4">
            <div className="sticky-top-custom">
              {/* Buyer Identity Card */}
              <div className="agr-card border-0 shadow-sm mb-4 overflow-hidden">
                <div className="p-4 bg-primary text-white">
                  <div className="d-flex align-items-center mb-3">
                     <div className="avatar-lg-circle bg-white text-primary fw-bold me-3 shadow">
                        {order.buyer_name?.charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <h4 className="mb-0 fw-bold">{order.buyer_name}</h4>
                        <span className="very-small opacity-75 d-flex align-items-center">
                          <MapPin size={10} className="me-1" /> {order.wilaya || 'Region Specified'}
                        </span>
                     </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="d-flex align-items-center mb-3 text-muted">
                    <Mail size={16} className="me-3 text-primary" />
                    <span className="small fw-medium">{order.buyer_email || 'No email provided'}</span>
                  </div>
                  <div className="d-flex align-items-center mb-3 text-muted">
                    <Phone size={16} className="me-3 text-primary" />
                    <span className="small fw-medium">{order.buyer_phone || 'No phone provided'}</span>
                  </div>
                  <div className="d-flex align-items-start text-muted">
                    <MapPin size={16} className="me-3 mt-1 text-primary" />
                    <span className="small lh-sm">{order.delivery_address}</span>
                  </div>
                </div>
              </div>

              {/* Package Content Card */}
              <div className="agr-card border-0 shadow-sm">
                <div className="agr-card-header bg-white border-bottom p-3">
                  <h6 className="mb-0 fw-bold small d-flex align-items-center">
                    <Package size={16} className="me-2 text-primary" /> Freight Details
                  </h6>
                </div>
                <div className="p-3">
                  <div className="d-flex flex-column gap-2 mb-4">
                    {order.items?.map(item => (
                      <div key={item.id} className="p-2 rounded bg-light border d-flex justify-content-between align-items-center">
                        <div className="small">
                           <span className="fw-bold d-block">{item.product_name}</span>
                           <span className="very-small text-muted">Quantity: {item.quantity} units</span>
                        </div>
                        <div className="small fw-bold text-gray-800">
                           {item.item_total} <span className="very-small">DZD</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="very-small text-muted text-uppercase fw-bold">Order Value</span>
                      <span className="h4 mb-0 fw-bold text-success">{order.farmer_total || order.total_price} <span className="small">DZD</span></span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                       <div className="very-small text-muted">
                          <Calendar size={12} className="me-1" /> Requested on {new Date(order.created_at).toLocaleDateString()}
                       </div>
                       <span className="badge-agr badge-primary rounded-pill px-2 py-1 very-small">{order.status}</span>
                    </div>
                  </div>
                  
                  {order.notes && (
                    <div className="mt-4 p-3 bg-warning-soft rounded-3 border-warning-soft">
                      <div className="very-small fw-bold text-warning-dark mb-1 d-flex align-items-center text-uppercase">
                        <FileText size={12} className="me-2" /> Buyer Instructions
                      </div>
                      <p className="small mb-0 fst-italic text-gray-600 font-serif">"{order.notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDelivery;

