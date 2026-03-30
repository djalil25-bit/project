import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Package, 
  User, 
  ShoppingBag, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Truck, 
  Search, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  X,
  ShieldAlert
} from 'lucide-react';
// import ComplaintFormModal from '../../components/complaints/ComplaintFormModal';

const OrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialFilter = queryParams.get('status')?.toUpperCase() || 'ALL';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter); // ALL, PENDING, CONFIRMED, REJECTED
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  // const [complaintModal, setComplaintModal] = useState({ open: false, orderId: null });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/farmer-orders/');
      setOrders(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAction = async (orderId, action) => {
    setActionLoading(orderId + '_' + action);
    try {
      const response = await api.post(`/farmer-orders/${orderId}/status/`, { action });
      await fetchOrders();
      // Optional: Add a small toast or success indication if needed
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || "Action failed. Please try again.";
      alert(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase() || 'UNKNOWN';
    const baseClass = "badge-agr text-truncate d-inline-block";
    const style = { maxWidth: '120px' };

    switch (s) {
      case 'PENDING': return <span className={`${baseClass} badge-warning`} style={style} title="Pending"><Clock size={12} className="me-1" /> Pending</span>;
      case 'CONFIRMED': return <span className={`${baseClass} badge-primary`} style={style} title="Confirmed"><CheckCircle size={12} className="me-1" /> Confirmed</span>;
      case 'DELIVERED': return <span className={`${baseClass} badge-success`} style={style} title="Delivered"><Truck size={12} className="me-1" /> Delivered</span>;
      case 'REJECTED': return <span className={`${baseClass} badge-danger`} style={style} title="Rejected"><XCircle size={12} className="me-1" /> Rejected</span>;
      default: return <span className={`${baseClass} badge-secondary`} style={style} title={s}>{s}</span>;
    }
  };

  const getDeliveryBadge = (o) => {
    const hasReq = o.has_delivery_request;
    const reqStatus = o.delivery_request?.status?.toUpperCase() || '';
    const orderDelivStatus = o.delivery_status?.toUpperCase() || '';
    
    const baseClass = "badge-agr text-truncate d-inline-block";
    const style = { maxWidth: '140px', fontWeight: '700', padding: '0.4rem 0.8rem', borderRadius: '6px' };

    // 1. Delivered (highest priority)
    if (orderDelivStatus === 'DELIVERED') {
      return <span className={`${baseClass}`} style={{ ...style, backgroundColor: '#10b981', color: '#fff' }}><CheckCircle size={12} className="me-1" /> Delivered</span>;
    }

    // 2. No request yet
    if (!hasReq) {
      return <span className={`${baseClass}`} style={{ ...style, backgroundColor: '#9ca3af', color: '#fff' }}>Not Sent</span>;
    }

    // 3. Status based on Delivery Request
    switch (reqStatus) {
      case 'OPEN': 
        return <span className={`${baseClass}`} style={{ ...style, backgroundColor: '#f59e0b', color: '#fff' }}>Awaiting Transporter</span>;
      case 'ASSIGNED': 
        return <span className={`${baseClass}`} style={{ ...style, backgroundColor: '#3b82f6', color: '#fff' }}>Assigned</span>;
      case 'PICKED_UP':
      case 'IN_TRANSIT': 
        return <span className={`${baseClass}`} style={{ ...style, backgroundColor: '#6366f1', color: '#fff' }}>In Transit</span>;
      case 'CANCELLED':
        return <span className={`${baseClass}`} style={{ ...style, backgroundColor: '#ef4444', color: '#fff' }}>Cancelled</span>;
      default: 
        return <span className={`${baseClass} badge-secondary`} style={style}>{reqStatus || 'Unknown'}</span>;
    }
  };

  const filteredOrders = orders.filter(o => {
    let matchesFilter = false;
    if (filter === 'ALL') {
      matchesFilter = true;
    } else if (filter === 'DELIVERED') {
      matchesFilter = o.delivery_status?.toUpperCase() === 'DELIVERED';
    } else if (filter === 'CONFIRMED') {
      matchesFilter = o.status?.toUpperCase() === 'CONFIRMED' && o.delivery_status?.toUpperCase() !== 'DELIVERED';
    } else {
      matchesFilter = o.status?.toUpperCase() === filter;
    }
    const localNum = o.farmer_order_number ? `F-${String(o.farmer_order_number).padStart(3, '0')}` : String(o.id);
    const buyerName = o.buyer_name || '';
    const matchesSearch = buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         localNum.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Helper to format the local order number
  const formatOrderNum = (o) => {
    if (o.farmer_order_number) return `#F-${String(o.farmer_order_number).padStart(3, '0')}`;
    return `#${o.id}`;
  };

  if (loading) return (
    <div className="flex-center py-5">
      <div className="spinner-agr"></div>
      <span className="ms-3 text-muted">Loading orders...</span>
    </div>
  );

  return (
    <div className="order-list-page">
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>Order Management</span>
      </div>

      <div className="d-flex align-items-center mb-4">
        <button className="btn-icon me-3" onClick={() => navigate('/farmer-dashboard')}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="h3 mb-0 fw-bold">Incoming Orders</h1>
          <p className="text-muted small">Grouped by buyer order. Manage fulfillment and logistics.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="agr-card p-3 mb-4 sticky-top-custom">
        <div className="row g-3 align-items-center">
          <div className="col-lg-4">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search by Order ID or buyer..." 
                className="form-control-agr ps-5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-lg-8">
            <div className="d-flex gap-2 justify-content-lg-end overflow-auto pb-1 pb-lg-0">
              {['ALL', 'PENDING', 'CONFIRMED', 'REJECTED', 'DELIVERED'].map(f => (
                <button 
                  key={f}
                  className={`btn-agr btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="agr-card overflow-hidden">
        <div className="table-responsive">
          <table className="table-agr table-hover">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Items</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Delivery</th>
                <th>Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="text-center py-5">
                      <ShoppingBag size={48} className="text-muted mb-3 opacity-25" />
                      <h4 className="h5 text-muted">No orders found</h4>
                      <p className="small text-muted mb-0">Adjust your filters or check back later.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.map(o => (
                <React.Fragment key={o.id}>
                  <tr>
                    <td>
                      <span className="fw-bold text-primary">{formatOrderNum(o)}</span>
                      <div className="very-small text-muted mt-1">ID #{o.id}</div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar-sm-circle me-2">
                          {o.buyer_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="small fw-semibold">{o.buyer_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-agr badge-secondary">{o.items?.length || 0} Products</span>
                    </td>
                    <td><span className="fw-bold text-dark">{o.farmer_total || o.total_price} DZD</span></td>
                    <td>{getStatusBadge(o.status)}</td>
                    <td>{getDeliveryBadge(o)}</td>
                    <td>
                      <div className="small text-muted">{new Date(o.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-1 justify-content-end">
                        {o.status?.toUpperCase() === 'PENDING' && (
                          <>
                            <button 
                              className="btn-action btn-action-success" 
                              title="Confirm Order" 
                              onClick={() => handleAction(o.id, 'confirm')}
                              disabled={actionLoading === o.id + '_confirm'}
                            >
                              {actionLoading === o.id + '_confirm' ? <span className="spinner-border spinner-border-sm" /> : <CheckCircle size={16} />}
                            </button>
                            <button 
                              className="btn-action btn-action-danger" 
                              title="Reject Order" 
                              onClick={() => handleAction(o.id, 'reject')}
                              disabled={actionLoading === o.id + '_reject'}
                            >
                              {actionLoading === o.id + '_reject' ? <span className="spinner-border spinner-border-sm" /> : <XCircle size={16} />}
                            </button>
                          </>
                        )}
                        <button className="btn-action btn-action-secondary" title="View Details" onClick={() => setExpandedRow(expandedRow === o.id ? null : o.id)}>
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Items Section */}
                  {expandedRow === o.id && (
                    <tr className="bg-light-soft">
                      <td colSpan="8" className="p-0 border-0">
                        <div className="p-4 animate-slide-in shadow-inner">
                          <div className="row g-4">
                            <div className="col-lg-7">
                              <h6 className="fw-bold mb-3 d-flex align-items-center"><Package size={16} className="me-2 text-primary" /> Ordered Products</h6>
                              <div className="agr-card p-0 mb-3 overflow-hidden">
                                <table className="table table-sm mb-0">
                                  <thead className="bg-white">
                                    <tr className="very-small text-muted text-uppercase">
                                      <th className="ps-3 py-2">Product</th>
                                      <th className="py-2 text-center">Qty</th>
                                      <th className="py-2 text-end pe-3">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {o.items.map(item => (
                                      <tr key={item.id}>
                                        <td className="ps-3 py-2">
                                          <div className="fw-bold small">{item.product_name}</div>
                                          <div className="very-small text-muted">{item.price_per_unit} DZD / unit</div>
                                        </td>
                                        <td className="py-2 text-center small">{item.quantity}</td>
                                        <td className="py-2 text-end pe-3 fw-bold small">{item.item_total} DZD</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            
                            <div className="col-lg-5">
                              <h6 className="fw-bold mb-3 d-flex align-items-center"><User size={16} className="me-2 text-primary" /> Logistics & Contact</h6>
                              <div className="bg-white p-3 rounded border mb-3">
                                <div className="mb-2">
                                  <span className="very-small text-muted text-uppercase d-block fw-bold">Buyer Contact</span>
                                  <div className="small fw-bold">{o.buyer_phone || 'N/A'}</div>
                                </div>
                                <div className="mb-2">
                                  <span className="very-small text-muted text-uppercase d-block fw-bold">Delivery Location</span>
                                  <div className="small">{o.wilaya ? <strong className="text-primary">{o.wilaya}: </strong> : ''}{o.delivery_address}</div>
                                </div>
                                {o.status?.toUpperCase() === 'CONFIRMED' && (
                                <div className="mt-3">
                                  {!o.has_delivery_request ? (
                                    <button 
                                      className="btn-agr btn-primary w-100 d-flex align-items-center justify-content-center py-2" 
                                      onClick={() => navigate(`/farmer/orders/${o.id}/request-delivery`)}
                                    >
                                      <Truck size={18} className="me-2" /> Request Transporter
                                    </button>
                                  ) : (
                                    <div className="alert-agr alert-success-agr py-2 px-3 small d-flex align-items-center">
                                      <CheckCircle size={16} className="me-2" /> Delivery Request Active
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Proof of Delivery Details for Farmer */}
                              {o.delivery_request?.pod_completed_at && (
                                <div className="mt-3 p-3 bg-light-soft rounded border-dashed border-1 border-success">
                                  <div className="d-flex align-items-center gap-2 mb-2 text-success fw-bold very-small text-uppercase">
                                    <CheckCircle size={14} /> Handover Verified
                                  </div>
                                  <div className="small mb-1">
                                    <span className="text-muted fw-bold">Signee:</span> {o.delivery_request.pod_recipient_name}
                                  </div>
                                  <div className="very-small text-muted mb-2">
                                    {new Date(o.delivery_request.pod_completed_at).toLocaleString()}
                                  </div>
                                  {o.delivery_request.pod_notes && (
                                    <div className="very-small text-muted fst-italic mb-2 ps-2 border-start">
                                      "{o.delivery_request.pod_notes}"
                                    </div>
                                  )}
                                  {o.delivery_request.pod_photo && (
                                    <div className="pod-photo-preview mt-2 rounded overflow-hidden border">
                                      <img src={o.delivery_request.pod_photo} alt="Handover Proof" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(o.delivery_request.pod_photo, '_blank')} />
                                    </div>
                                  )}
                                  {o.buyer_confirmed_at && (
                                    <div className="mt-2 py-1 px-2 bg-success text-white rounded very-small fw-bold text-center">
                                      FINALIZED BY BUYER
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {o.notes && (
                                  <div className="mt-3">
                                    <span className="very-small text-muted text-uppercase d-block fw-bold">Order Notes</span>
                                    <div className="small fst-italic text-muted">"{o.notes}"</div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-4 pt-3 border-top">
                                <div className="complaint-section-card">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <span className="very-small text-muted fw-bold text-uppercase">Issue with this order?</span>
                                    <span className="complaint-badge-mini" style={{ color: '#dc2626', background: '#fee2e2' }}>SECURE PHASE</span>
                                  </div>
                                  <Link 
                                    to={`/complaints/new?order_id=${o.id}&type=PAYMENT`}
                                    className="btn-complaint-cta"
                                  >
                                    <ShieldAlert size={18} /> 
                                    <span>Official Complaint Center</span>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderList;
