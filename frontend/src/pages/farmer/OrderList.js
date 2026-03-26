import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  Filter,
  Eye,
  MoreVertical,
  ChevronLeft
} from 'lucide-react';

const OrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, CONFIRMED, REJECTED
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleAction = async (itemId, action) => {
    try {
      await api.post(`/farmer-orders/${itemId}/status/`, { action });
      fetchOrders();
    } catch (err) {
      alert("Action failed. Please try again.");
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase() || 'PENDING';
    switch (s) {
      case 'PENDING': return <span className="badge-agr badge-warning"><Clock size={12} className="me-1" /> Pending</span>;
      case 'CONFIRMED': return <span className="badge-agr badge-primary"><CheckCircle size={12} className="me-1" /> Confirmed</span>;
      case 'DELIVERED': return <span className="badge-agr badge-success"><Truck size={12} className="me-1" /> Delivered</span>;
      case 'REJECTED': return <span className="badge-agr badge-danger"><XCircle size={12} className="me-1" /> Rejected</span>;
      default: return <span className="badge-agr badge-secondary">{s}</span>;
    }
  };

  const getDeliveryBadge = (status) => {
    const s = status?.toUpperCase() || 'AWAITING_PICKUP';
    switch (s) {
      case 'AWAITING_PICKUP': return <span className="badge-agr badge-outline-warning">Awaiting</span>;
      case 'PICKED_UP': return <span className="badge-agr badge-outline-primary">Picked Up</span>;
      case 'IN_TRANSIT': return <span className="badge-agr badge-outline-info">In Transit</span>;
      case 'DELIVERED': return <span className="badge-agr badge-outline-success">Delivered</span>;
      default: return <span className="badge-agr badge-outline-secondary">{s}</span>;
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'ALL' || o.order_status?.toUpperCase() === filter;
    const matchesSearch = o.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         o.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(o.order_id).includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  if (loading) return (
    <div className="flex-center py-5">
      <div className="spinner-agr"></div>
      <span className="ms-3 text-muted">Loading orders...</span>
    </div>
  );

  return (
    <div className="order-list-page">
      {/* Breadcrumb / Header */}
      <div className="d-flex align-items-center mb-4">
        <button className="btn-icon me-3" onClick={() => navigate('/farmer-dashboard')}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="h3 mb-0 fw-bold">Order Management</h1>
          <p className="text-muted small">Manage incoming purchase requests and track fulfillment.</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="agr-card p-3 mb-4 sticky-top-custom">
        <div className="row g-3 align-items-center">
          <div className="col-lg-4">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search by ID, product, or buyer..." 
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

      {/* Orders Table */}
      <div className="agr-card overflow-hidden">
        <div className="table-responsive">
          <table className="table-agr table-hover">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Product</th>
                <th className="text-center">Qty</th>
                <th>Total Price</th>
                <th>Order Status</th>
                <th>Delivery</th>
                <th>Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="text-center py-5">
                      <ShoppingBag size={48} className="text-muted mb-3 opacity-25" />
                      <h4 className="h5 text-muted">No orders found</h4>
                      <p className="small text-muted mb-0">Adjust your filters or check back later.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.map(o => (
                <tr key={o.id}>
                  <td><span className="fw-bold">#{o.order_id}</span></td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="avatar-sm-circle me-2">
                        {o.buyer_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="small fw-semibold">{o.buyer_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      {o.product_image ? (
                        <img src={`${process.env.REACT_APP_API_URL}${o.product_image}`} alt="" className="img-thumbnail-small me-2" />
                      ) : (
                        <div className="img-placeholder-small me-2"><Package size={14} /></div>
                      )}
                      <span className="small">{o.product_name}</span>
                    </div>
                  </td>
                  <td className="text-center small">{o.quantity} kg</td>
                  <td><span className="fw-bold text-dark">{o.item_total} DZD</span></td>
                  <td>{getStatusBadge(o.order_status)}</td>
                  <td>{getDeliveryBadge(o.delivery_status)}</td>
                  <td>
                    <div className="small text-muted">{new Date(o.created_at).toLocaleDateString()}</div>
                    <div className="very-small text-muted">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="text-end">
                    <div className="d-flex gap-1 justify-content-end">
                      {o.order_status?.toLowerCase() === 'pending' && (
                        <>
                          <button 
                            className="btn-action btn-action-success" 
                            title="Confirm"
                            onClick={() => handleAction(o.id, 'confirm')}
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            className="btn-action btn-action-danger" 
                            title="Reject"
                            onClick={() => handleAction(o.id, 'reject')}
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button className="btn-action btn-action-secondary" title="View Details">
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderList;
