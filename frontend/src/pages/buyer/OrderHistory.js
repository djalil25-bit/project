import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import QRDisplay from '../../components/common/QRDisplay';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, Filter, XCircle, AlertCircle, RefreshCw, User, ShieldAlert,
  ChevronRight, ClipboardList, Clock, CheckCircle, Package, Truck, MapPin, Calendar, CreditCard, ChevronDown, ChevronUp, ShoppingBag, Search
} from 'lucide-react';

/* ─── Status badge components ─────────────────────────────── */
const FarmerStatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || 'PENDING';
  const config = {
    PENDING:   { cls: 'badge-status-pending',   icon: <Clock size={11} />,       label: 'Pending' },
    CONFIRMED: { cls: 'badge-status-confirmed', icon: <CheckCircle size={11} />, label: 'Confirmed' },
    REJECTED:  { cls: 'badge-status-rejected',  icon: <XCircle size={11} />,     label: 'Rejected' },
    CANCELLED: { cls: 'badge-status-cancelled', icon: <AlertCircle size={11} />, label: 'Cancelled' },
  };
  const c = config[s] || config.PENDING;
  return (
    <span className={`inline-badge ${c.cls}`}>
      {c.icon}<span className="ms-1">{c.label}</span>
    </span>
  );
};

const DeliveryStatusBadge = ({ o }) => {
  const hasReq = o.has_delivery_request;
  const reqStatus = o.delivery_request?.status?.toUpperCase() || '';
  const orderDelivStatus = o.delivery_status?.toUpperCase() || '';
  
  if (orderDelivStatus === 'DELIVERED') {
    return (
      <span className="inline-badge" style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '10px', padding: '2px 8px' }}>
        <CheckCircle size={11} /><span className="ms-1">Delivered</span>
      </span>
    );
  }

  if (!hasReq) {
    return (
      <span className="inline-badge" style={{ backgroundColor: '#9ca3af', color: '#fff', fontSize: '10px', padding: '2px 8px' }}>
        <Clock size={11} /><span className="ms-1">Not Sent</span>
      </span>
    );
  }

  const config = {
    OPEN:       { bg: '#f59e0b', icon: <Clock size={11} />,        label: 'Awaiting Transporter' },
    ASSIGNED:   { bg: '#3b82f6', icon: <User size={11} />,         label: 'Assigned' },
    PICKED_UP:  { bg: '#6366f1', icon: <Truck size={11} />,        label: 'In Transit' },
    IN_TRANSIT: { bg: '#6366f1', icon: <Truck size={11} />,        label: 'In Transit' },
    CANCELLED:  { bg: '#ef4444', icon: <XCircle size={11} />,      label: 'Cancelled' },
  };

  const c = config[reqStatus] || { bg: '#9ca3af', icon: <Package size={11} />, label: reqStatus || 'Processing' };

  return (
    <span className="inline-badge" style={{ backgroundColor: c.bg, color: '#fff', fontSize: '10px', padding: '2px 8px' }}>
      {c.icon}<span className="ms-1">{c.label}</span>
    </span>
  );
};

/* ─── Filter tabs ─────────────────────────────────────────── */
const FILTER_TABS = [
  { key: 'all',       label: 'All Orders' },
  { key: 'pending',   label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'rejected',  label: 'Rejected' },
  { key: 'delivered', label: 'Delivered' },
];

function matchesFilter(order, filter) {
  switch (filter) {
    case 'all':       return true;
    case 'pending':   return order.status?.toUpperCase() === 'PENDING';
    case 'confirmed': return order.status?.toUpperCase() === 'CONFIRMED';
    case 'rejected':  return order.status?.toUpperCase() === 'REJECTED';
    case 'delivered': return order.delivery_status?.toUpperCase() === 'DELIVERED';
    default:          return true;
  }
}

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  // const [complaintModal, setComplaintModal] = useState({ open: false, orderId: null });

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get('/orders/');
        setOrders(res.data.results || res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchOrders();
  }, []);

  const filtered = orders.filter(o => matchesFilter(o, activeFilter));

  return (
    <div className="order-history-page animate-fade-in">
      <div className="agr-breadcrumb">
        <Link to="/buyer-dashboard">Marketplace</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>My Orders</span>
      </div>

      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h1 className="page-title d-flex align-items-center">
            <ClipboardList className="text-primary me-3" size={28} /> My Orders
          </h1>
          <p className="page-subtitle text-muted">Track your fresh produce shipments and review past orders.</p>
        </div>
        <Link to="/buyer-dashboard/invoices" className="btn-agr btn-outline d-flex align-items-center gap-2">
          <FileText size={16} /> My Invoices
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="tab-pills my-4">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-pill border-0 ${activeFilter === tab.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ms-2 very-small opacity-60">
                ({orders.filter(o => matchesFilter(o, tab.key)).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-center py-5" style={{ minHeight: '40vh' }}>
          <div className="spinner-agr" />
          <span className="ms-3 text-muted small">Loading your orders...</span>
        </div>
      ) : (
        <div className="row">
          {filtered.length === 0 ? (
            <div className="col-12">
              <div className="agr-card p-5 text-center">
                <ShoppingBag size={64} className="text-muted mb-3 opacity-25" />
                <h3 className="h4 text-muted">No orders found</h3>
                <p className="small text-muted mb-4">
                  {activeFilter === 'all' ? "You haven't placed any orders yet." : `No orders with status "${activeFilter}".`}
                </p>
                {activeFilter !== 'all' ? (
                  <button className="btn-agr btn-outline me-2" onClick={() => setActiveFilter('all')}>
                    <RefreshCw size={14} className="me-2" /> Show All Orders
                  </button>
                ) : null}
                <Link to="/buyer-dashboard" className="btn-agr btn-primary">Browse Marketplace</Link>
              </div>
            </div>
          ) : (
            <div className="col-12">
              <div className="agr-card border-0 shadow-sm overflow-hidden">
                <div className="table-responsive">
                  <table className="agr-table mb-0">
                    <thead>
                      <tr>
                        <th>Order Ref</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th className="text-end">Total</th>
                        <th>Farmer Status</th>
                        <th>Delivery</th>
                        <th className="text-end">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(o => (
                        <React.Fragment key={o.id}>
                          <tr className={`hover-bg-light ${expanded === o.id ? 'bg-light-soft' : ''}`}>
                            <td>
                              <span className="fw-bold text-primary">#AG-{o.id.toString().padStart(5, '0')}</span>
                              <div className="very-small d-flex align-items-center text-muted mt-1">
                                <CreditCard size={10} className="me-1" />
                                {o.payment_method?.replace(/_/g, ' ') || 'Cash on Delivery'}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <Calendar size={14} className="text-muted me-2" />
                                <span className="small">{new Date(o.created_at).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td>
                              <div className="fw-bold small">{o.items?.length} Item{o.items?.length !== 1 ? 's' : ''}</div>
                              <div className="text-muted very-small">
                                {o.items?.[0]?.product_detail?.title || o.items?.[0]?.product_name}
                                {o.items?.length > 1 ? ` +${o.items.length - 1} more` : ''}
                              </div>
                            </td>
                            <td className="text-end fw-bold text-dark">
                              {parseFloat(o.total_price).toLocaleString()} DZD
                            </td>
                            <td>
                              <FarmerStatusBadge status={o.status} />
                            </td>
                            <td>
                              {o.status === 'CONFIRMED' || o.status === 'confirmed'
                                ? <DeliveryStatusBadge o={o} />
                                : <span className="very-small text-muted">—</span>
                              }
                            </td>
                            <td className="text-end">
                              <button
                                className={`btn-icon ${expanded === o.id ? 'btn-icon-active' : ''}`}
                                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                                title="View Details"
                              >
                                {expanded === o.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Details */}
                          {expanded === o.id && (
                            <tr>
                              <td colSpan="7" className="p-0 border-0">
                                <div className="bg-light-soft p-4 border-bottom animate-fade-in">
                                  <div className="row g-4">
                                    {/* Delivery Info */}
                                    <div className="col-lg-4">
                                      <div className="p-3 bg-white rounded-lg shadow-sm border h-100">
                                        <div className="d-flex align-items-center mb-3 text-primary">
                                          <Truck size={16} className="me-2" />
                                          <h6 className="fw-bold mb-0 text-uppercase small">Delivery Info</h6>
                                        </div>
                                        <div className="mb-2">
                                          <label className="very-small text-muted d-block mb-1">Destination</label>
                                          <div className="small d-flex align-items-start">
                                            <MapPin size={13} className="text-danger me-2 mt-1 flex-shrink-0" />
                                            <span>{o.delivery_address}{o.wilaya ? `, ${o.wilaya}` : ''}</span>
                                          </div>
                                        </div>
                                        <div className="mb-2">
                                          <label className="very-small text-muted d-block mb-1">Farmer Status</label>
                                          <FarmerStatusBadge status={o.status} />
                                        </div>
                                        <div>
                                          <label className="very-small text-muted d-block mb-1">Delivery Status</label>
                                          <DeliveryStatusBadge o={o} />
                                        </div>
                                        
                                        {o.delivery_request?.pod_completed_at && (
                                          <div className="mt-3 p-3 bg-light-soft rounded-lg border-dashed border-1 border-success animate-fade-in">
                                            <div className="d-flex align-items-center gap-2 mb-2 text-success fw-bold very-small text-uppercase">
                                              <ShieldAlert size={14} /> Official Proof of Delivery
                                            </div>
                                            <div className="small mb-1"><span className="text-muted fw-bold">Recipient:</span> {o.delivery_request.pod_recipient_name}</div>
                                            <div className="very-small text-muted mb-2">
                                              {new Date(o.delivery_request.pod_completed_at).toLocaleString()}
                                            </div>
                                            {o.delivery_request.pod_notes && (
                                              <div className="very-small text-muted fst-italic mb-2 ps-2 border-start">
                                                "{o.delivery_request.pod_notes}"
                                              </div>
                                            )}
                                            {o.delivery_request.pod_photo && (
                                              <div className="pod-photo-preview mt-2">
                                                <img 
                                                  src={o.delivery_request.pod_photo} 
                                                  alt="Proof" 
                                                  className="img-fluid rounded border shadow-sm"
                                                  style={{ maxHeight: '120px', cursor: 'pointer' }}
                                                  onClick={() => window.open(o.delivery_request.pod_photo, '_blank')}
                                                />
                                              </div>
                                            )}

                                            {!o.buyer_confirmed_at ? (
                                              <button 
                                                className="btn-agr btn-primary btn-sm w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
                                                onClick={async () => {
                                                  if(!window.confirm("Are you sure you want to confirm receipt of this order?")) return;
                                                  try {
                                                    await api.post(`/orders/${o.id}/confirm_receipt/`);
                                                    const res = await api.get('/orders/');
                                                    setOrders(res.data.results || res.data);
                                                    alert("Receipt confirmed! Thank you.");
                                                  } catch (err) {
                                                    alert(err.response?.data?.error || "Confirmation failed.");
                                                  }
                                                }}
                                              >
                                                <CheckCircle size={14} /> Confirm Parcel Receipt
                                              </button>
                                            ) : (
                                              <div className="mt-3 p-2 bg-success-soft text-success rounded small fw-bold text-center d-flex align-items-center justify-content-center gap-2">
                                                <CheckCircle size={16} /> Receipt Confirmed
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {o.notes && (
                                          <div className="mt-2 p-2 bg-light-soft rounded-lg very-small text-muted">
                                            <strong>Note:</strong> {o.notes}
                                          </div>
                                        )}
                                        <div className="mt-4 pt-3 border-top">
                                          <div className="complaint-section-card">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                              <span className="very-small text-muted fw-bold text-uppercase">Something wrong?</span>
                                              <span className="complaint-badge-mini" style={{ color: '#dc2626', background: '#fee2e2' }}>SECURE PHASE</span>
                                            </div>
                                            <Link 
                                              to={`/complaints/new?order_id=${o.id}&type=ORDER`}
                                              className="btn-complaint-cta"
                                            >
                                              <ShieldAlert size={18} /> 
                                              <span>Official Complaint Center</span>
                                            </Link>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* QR Code Section */}
                                    <div className="col-lg-3">
                                      <div className="p-3 bg-white rounded-lg shadow-sm border h-100 flex-center flex-column">
                                         <QRDisplay value={`AG-ORD-${o.id}`} size={120} title="Order Trace" />
                                      </div>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="col-lg-5">
                                      <div className="p-3 bg-white rounded-lg shadow-sm border">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                          <div className="d-flex align-items-center text-primary">
                                            <ClipboardList size={16} className="me-2" />
                                            <h6 className="fw-bold mb-0 text-uppercase small">Order Summary</h6>
                                          </div>
                                          {o.delivery_status?.toUpperCase() === 'DELIVERED' && (
                                            <Link
                                              to={`/buyer-dashboard/invoices/${o.id}`}
                                              className="btn-agr btn-sm btn-outline d-flex align-items-center gap-1 very-small"
                                            >
                                              <FileText size={12} /> View Invoice
                                            </Link>
                                          )}
                                        </div>
                                        
                                        <div className="item-list">
                                          {o.items?.map(item => {
                                            const name = item.product_detail?.title || item.product_name || 'Item';
                                            const unit = item.product_detail?.unit || item.product_unit || '';
                                            const unitPrice = parseFloat(item.price_per_unit || item.price_snapshot || 0);
                                            const qty = parseFloat(item.quantity || 0);
                                            const sub = (unitPrice * qty).toFixed(0);
                                            return (
                                              <div key={item.id} className="order-item-row">
                                                <div className="d-flex align-items-center flex-grow-1">
                                                  <Package size={14} className="text-muted me-2 flex-shrink-0" />
                                                  <div>
                                                    <div className="fw-bold small">{name}</div>
                                                    {item.farmer_name && (
                                                      <div className="very-small text-muted d-flex align-items-center">
                                                        <User size={10} className="me-1" /> {item.farmer_name}
                                                        {item.farm_name ? ` · ${item.farm_name}` : ''}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="order-item-meta text-end">
                                                  <div className="very-small text-muted">{qty} {unit} × {unitPrice.toLocaleString()} DZD</div>
                                                  <div className="fw-bold small">{parseInt(sub).toLocaleString()} DZD</div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                          <div className="d-flex justify-content-between align-items-center p-3 bg-light-soft mt-2 rounded-lg border">
                                            <span className="fw-bold small text-muted">Total</span>
                                            <span className="h5 fw-bold text-primary mb-0">{parseFloat(o.total_price).toLocaleString()} DZD</span>
                                          </div>
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
          )}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
