import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Search, 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  MapPin, 
  Calendar,
  CreditCard,
  Target,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || 'pending';
  return <span className={`status-badge status-${s}`}>{(status || 'Pending').replace(/_/g, ' ')}</span>;
};

const DeliveryStatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || 'awaiting_pickup';
  const label = (status || 'Awaiting Pickup').replace(/_/g, ' ');
  let icon = <Clock size={12} className="me-1" />;
  if (s === 'picked_up') icon = <Package size={12} className="me-1" />;
  if (s === 'in_transit') icon = <Truck size={12} className="me-1" />;
  if (s === 'delivered') icon = <CheckCircle size={12} className="me-1" />;

  return (
    <span className={`badge-agr badge-outline-primary ms-1 d-inline-flex align-items-center`}>
      {icon} {label}
    </span>
  );
};

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

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

  return (
    <div className="order-history-page">
      <div className="agr-breadcrumb">
        <Link to="/buyer-dashboard">Marketplace</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>My Purchases</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Order History</h1>
          <p className="page-subtitle">Track your fresh produce shipments and review past orders.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-center py-5" style={{ minHeight: '40vh' }}>
          <div className="spinner-agr" />
        </div>
      ) : (
        <div className="row">
          {orders.length === 0 ? (
            <div className="col-12">
              <div className="agr-card p-5 text-center">
                <ShoppingBag size={64} className="text-muted mb-3 opacity-25" />
                <h3 className="h4 text-muted">No orders found</h3>
                <p className="small text-muted mb-4">You haven't placed any orders yet. Visit the marketplace to see what's fresh!</p>
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
                        <th>Placed On</th>
                        <th>Summary</th>
                        <th className="text-end">Total Price</th>
                        <th>Overall Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <React.Fragment key={o.id}>
                          <tr className={expanded === o.id ? 'bg-light-soft' : ''}>
                            <td>
                              <span className="fw-bold text-primary">#AG-{o.id.toString().padStart(5, '0')}</span>
                              <div className="very-small d-flex align-items-center text-muted mt-1">
                                <CreditCard size={10} className="me-1" /> Cash on Delivery
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
                              <div className="text-muted very-small italic">
                                {o.items?.[0]?.product_detail?.title} {o.items?.length > 1 ? `+${o.items.length - 1} more` : ''}
                              </div>
                            </td>
                            <td className="text-end fw-bold text-dark">{o.total_price} DZD</td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                <StatusBadge status={o.status} />
                                {o.status === 'CONFIRMED' && <DeliveryStatusBadge status={o.delivery_status} />}
                              </div>
                            </td>
                            <td className="text-end">
                              <button 
                                className={`btn-icon ${expanded === o.id ? 'btn-icon-active' : ''}`}
                                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                                title="View Details"
                              >
                                {expanded === o.id ? <ChevronUp size={20} /> : <Search size={20} />}
                              </button>
                            </td>
                          </tr>
                          {expanded === o.id && (
                            <tr>
                              <td colSpan="6" className="p-0 border-0">
                                <div className="bg-light-soft p-4 border-bottom animate-slide-in">
                                  <div className="row g-4">
                                    <div className="col-lg-5">
                                      <div className="p-3 bg-white rounded-lg shadow-sm border h-100">
                                        <div className="d-flex align-items-center mb-3 text-primary">
                                          <Truck size={18} className="me-2" />
                                          <h6 className="fw-bold mb-0 text-uppercase small">Logistics & Delivery</h6>
                                        </div>
                                        <div className="mb-3">
                                          <label className="very-small text-muted d-block mb-1">Shipping Destination</label>
                                          <div className="small d-flex align-items-start">
                                            <MapPin size={14} className="text-danger me-2 mt-1 flex-shrink-0" />
                                            <span>{o.delivery_address}</span>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="very-small text-muted d-block mb-1">Current Milestone</label>
                                          <div className="d-flex align-items-center">
                                            <Target size={14} className="text-primary me-2" />
                                            <span className="small fw-bold">{o.delivery_status?.replace(/_/g, ' ')}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-lg-7">
                                      <div className="p-3 bg-white rounded-lg shadow-sm border">
                                        <div className="d-flex align-items-center mb-3 text-primary">
                                          <ClipboardList size={18} className="me-2" />
                                          <h6 className="fw-bold mb-0 text-uppercase small">Order Summary</h6>
                                        </div>
                                        <div className="item-list">
                                          {o.items?.map(item => (
                                            <div key={item.id} className="d-flex justify-content-between py-2 border-bottom-dashed small">
                                              <div className="d-flex align-items-center">
                                                <Package size={14} className="text-muted me-2" />
                                                <span>{item.quantity} {item.product_detail?.unit} <span className="text-muted">×</span> {item.product_detail?.title}</span>
                                              </div>
                                              <span className="fw-bold">{item.price_snapshot} DZD</span>
                                            </div>
                                          ))}
                                          <div className="d-flex justify-content-between p-3 bg-light-soft mt-2 rounded-lg">
                                            <span className="fw-bold small text-muted">Total Paid (COD)</span>
                                            <span className="h5 fw-bold text-primary mb-0">{o.total_price} DZD</span>
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
