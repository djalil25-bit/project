import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
  Package, User, ListOrdered, CheckCircle, XCircle,
  Clock, Truck, Search, Eye, ChevronLeft, ChevronRight,
  ShieldAlert
} from 'lucide-react';

/* ── Status badges ───────────────────────────────────────── */
const OrderStatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || '';
  const map = {
    PENDING:   { cls: 'f-badge f-badge-pending',   icon: <Clock size={10} />,         label: 'Pending'   },
    CONFIRMED: { cls: 'f-badge f-badge-confirmed',  icon: <CheckCircle size={10} />,   label: 'Confirmed' },
    DELIVERED: { cls: 'f-badge f-badge-delivered',  icon: <Truck size={10} />,         label: 'Delivered' },
    REJECTED:  { cls: 'f-badge f-badge-rejected',   icon: <XCircle size={10} />,       label: 'Rejected'  },
  };
  const b = map[s] || { cls: 'f-badge f-badge-inactive', icon: null, label: s };
  return <span className={b.cls}>{b.icon} {b.label}</span>;
};

const DeliveryBadge = ({ order }) => {
  const hasReq      = order.has_delivery_request;
  const reqStatus   = order.delivery_request?.status?.toUpperCase() || '';
  const delivStatus = order.delivery_status?.toUpperCase() || '';

  if (delivStatus === 'DELIVERED') return <span className="f-badge f-badge-delivered"><CheckCircle size={10} /> Delivered</span>;
  if (!hasReq)                     return <span className="f-badge f-badge-not-sent">Not Sent</span>;

  const map = {
    OPEN:      { cls: 'f-badge f-badge-pending',  label: 'Awaiting Transporter' },
    ASSIGNED:  { cls: 'f-badge f-badge-assigned', label: 'Assigned'             },
    PICKED_UP: { cls: 'f-badge f-badge-transit',  label: 'In Transit'           },
    IN_TRANSIT:{ cls: 'f-badge f-badge-transit',  label: 'In Transit'           },
    CANCELLED: { cls: 'f-badge f-badge-rejected', label: 'Cancelled'            },
  };
  const b = map[reqStatus] || { cls: 'f-badge f-badge-inactive', label: reqStatus || 'Unknown' };
  return <span className={b.cls}>{b.label}</span>;
};

/* ── Format order number ─────────────────────────────────── */
const fmtNum = o => o.farmer_order_number
  ? `#F-${String(o.farmer_order_number).padStart(3, '0')}`
  : `#${o.id}`;

export default function OrderList() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const qp        = new URLSearchParams(location.search);
  const initFilter = qp.get('status')?.toUpperCase() || 'ALL';

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState(initFilter);
  const [searchTerm, setSearch]     = useState('');
  const [expandedRow, setExpanded]  = useState(null);
  const [actionLoading, setActLoad] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/farmer-orders/');
      setOrders(res.data.results || res.data);
    } catch (err) { console.error('Failed to fetch orders', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleAction = async (orderId, action) => {
    setActLoad(orderId + '_' + action);
    try {
      await api.post(`/farmer-orders/${orderId}/status/`, { action });
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Action failed.');
    } finally { setActLoad(null); }
  };

  const filteredOrders = orders.filter(o => {
    let match = false;
    if (filter === 'ALL')        match = true;
    else if (filter === 'DELIVERED') match = o.delivery_status?.toUpperCase() === 'DELIVERED';
    else if (filter === 'CONFIRMED') match = o.status?.toUpperCase() === 'CONFIRMED' && o.delivery_status?.toUpperCase() !== 'DELIVERED';
    else match = o.status?.toUpperCase() === filter;

    const locNum   = o.farmer_order_number ? `F-${String(o.farmer_order_number).padStart(3,'0')}` : String(o.id);
    const matchSrc = (o.buyer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                     locNum.toLowerCase().includes(searchTerm.toLowerCase());
    return match && matchSrc;
  });

  const filterTabs = [
    { key: 'ALL',       label: 'All'       },
    { key: 'PENDING',   label: 'Pending'   },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'REJECTED',  label: 'Rejected'  },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  if (loading) return (
    <div className="f-spinner-wrap">
      <div className="f-spinner" />
      <span>Loading orders…</span>
    </div>
  );

  return (
    <div className="farmer-page-wrapper">

      {/* Breadcrumb */}
      <div className="f-breadcrumb">
        <Link to="/farmer-dashboard">Farmer Hub</Link>
        <span className="f-breadcrumb-sep"><ChevronRight size={11} /></span>
        <span>Order Management</span>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn-f-icon" onClick={() => navigate('/farmer-dashboard')}>
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--f-forest-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ListOrdered size={24} style={{ color: 'var(--f-olive)' }} strokeWidth={2} /> Incoming Orders
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: '#6b7280', fontSize: '0.88rem' }}>
            Grouped by buyer order. Manage fulfillment and logistics.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="f-filter-bar">
        <div className="f-search-wrap" style={{ flex: '1 1 220px', minWidth: 180 }}>
          <Search size={15} className="f-search-icon" />
          <input
            type="text"
            className="f-search-input"
            placeholder="Search by Order ID or buyer…"
            value={searchTerm}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="f-filter-bar-divider" />
        <div className="f-filter-pills" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
          {filterTabs.map(t => (
            <button
              key={t.key}
              className={`f-pill ${filter === t.key ? 'active' : ''}`}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="f-card">
        <div className="f-table-wrap">
          <table className="f-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Items</th>
                <th className="right">Total</th>
                <th>Status</th>
                <th>Delivery</th>
                <th>Date</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="f-empty-state" style={{ padding: '3rem 1rem' }}>
                      <div className="f-empty-icon"><ListOrdered size={32} strokeWidth={1.5} /></div>
                      <div className="f-empty-title">No orders found</div>
                      <div className="f-empty-sub">Adjust your filters or check back later.</div>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.map(o => (
                <React.Fragment key={o.id}>
                  <tr>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--f-forest)', fontSize: '0.875rem' }}>{fmtNum(o)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>ID #{o.id}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div className="f-avatar">{o.buyer_name?.charAt(0)?.toUpperCase() || 'U'}</div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{o.buyer_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="f-badge f-badge-inactive">{o.items?.length || 0} Products</span>
                    </td>
                    <td className="col-right">
                      <span style={{ fontWeight: 800, fontSize: '0.875rem' }}>
                        {String(o.farmer_total || o.total_price || 0)}
                        <span style={{ color: '#9ca3af', fontSize: '0.72rem', marginLeft: 3 }}>DZD</span>
                      </span>
                    </td>
                    <td><OrderStatusBadge status={o.status} /></td>
                    <td><DeliveryBadge order={o} /></td>
                    <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="col-right">
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        {o.status?.toUpperCase() === 'PENDING' && (
                          <>
                            <button
                              className="btn-f-success btn-f-sm"
                              title="Confirm Order"
                              onClick={() => handleAction(o.id, 'confirm')}
                              disabled={actionLoading === o.id + '_confirm'}
                            >
                              {actionLoading === o.id + '_confirm'
                                ? <span style={{ display:'inline-block',width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'f-spin .7s linear infinite'}} />
                                : <CheckCircle size={15} strokeWidth={2.2} />
                              }
                            </button>
                            <button
                              className="btn-f-danger btn-f-sm"
                              title="Reject Order"
                              onClick={() => handleAction(o.id, 'reject')}
                              disabled={actionLoading === o.id + '_reject'}
                            >
                              {actionLoading === o.id + '_reject'
                                ? <span style={{ display:'inline-block',width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'f-spin .7s linear infinite'}} />
                                : <XCircle size={15} strokeWidth={2.2} />
                              }
                            </button>
                          </>
                        )}
                        <button
                          className="btn-f-icon btn-f-icon-sm"
                          title="View Details"
                          onClick={() => setExpanded(expandedRow === o.id ? null : o.id)}
                          style={expandedRow === o.id ? { background: 'var(--f-mint-deep)', color: 'var(--f-forest)' } : {}}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── Expanded Details ───────────────────── */}
                  {expandedRow === o.id && (
                    <tr className="f-order-expanded">
                      <td colSpan="8">
                        <div className="f-order-expanded-inner">

                          {/* Products list */}
                          <div>
                            <div className="f-order-section-label">
                              <Package size={14} strokeWidth={1.5} /> Ordered Products
                            </div>
                            <div className="f-card" style={{ overflow: 'hidden' }}>
                              <table className="f-table" style={{ fontSize: '0.82rem' }}>
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th className="right">Qty</th>
                                    <th className="right">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {o.items?.map(item => (
                                    <tr key={item.id}>
                                      <td>
                                        <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{item.price_per_unit} DZD / unit</div>
                                      </td>
                                      <td className="col-right" style={{ fontWeight: 700 }}>{item.quantity}</td>
                                      <td className="col-right" style={{ fontWeight: 800, color: 'var(--f-forest)' }}>{item.item_total} DZD</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Logistics & Contact */}
                          <div>
                            <div className="f-order-section-label">
                              <User size={13} /> Logistics &amp; Contact
                            </div>
                            <div className="f-logistics-card">
                              <div className="f-logistics-field">
                                <div className="f-logistics-field-label">Buyer Contact</div>
                                <div className="f-logistics-field-value">{o.buyer_phone || 'N/A'}</div>
                              </div>
                              <div className="f-logistics-field">
                                <div className="f-logistics-field-label">Delivery Location</div>
                                <div className="f-logistics-field-value">
                                  {o.wilaya && <span style={{ color: 'var(--f-forest)', fontWeight: 800 }}>{o.wilaya}: </span>}
                                  {o.delivery_address}
                                </div>
                              </div>

                              {/* Request transporter */}
                              {o.status?.toUpperCase() === 'CONFIRMED' && (
                                <div style={{ marginTop: '0.875rem' }}>
                                  {!o.has_delivery_request ? (
                                    <button
                                      className="btn-f-primary"
                                      style={{ width: '100%', justifyContent: 'center' }}
                                      onClick={() => navigate(`/farmer/orders/${o.id}/request-delivery`)}
                                    >
                                      <Truck size={16} strokeWidth={2.2} /> Request Transporter
                                    </button>
                                  ) : (
                                    <div className="f-alert f-alert-success" style={{ margin: 0 }}>
                                      <CheckCircle size={15} /> Delivery Request Active
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* POD section */}
                              {o.delivery_request?.pod_completed_at && (
                                <div className="f-pod-section">
                                  <div className="f-pod-label"><CheckCircle size={12} /> Handover Verified</div>
                                  <div style={{ fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                                    <span style={{ color: '#9ca3af', fontWeight: 700 }}>Signee:</span> {o.delivery_request.pod_recipient_name}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                                    {new Date(o.delivery_request.pod_completed_at).toLocaleString()}
                                  </div>
                                  {o.delivery_request.pod_notes && (
                                    <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#6b7280', borderLeft: '3px solid var(--f-sage-light)', paddingLeft: '0.6rem' }}>
                                      "{o.delivery_request.pod_notes}"
                                    </div>
                                  )}
                                  {o.delivery_request.pod_photo && (
                                    <div style={{ marginTop: '0.5rem', borderRadius: 8, overflow: 'hidden' }}>
                                      <img
                                        src={o.delivery_request.pod_photo}
                                        alt="Proof of Delivery"
                                        style={{ width: '100%', maxHeight: 140, objectFit: 'cover', cursor: 'pointer', display: 'block' }}
                                        onClick={() => window.open(o.delivery_request.pod_photo, '_blank')}
                                      />
                                    </div>
                                  )}
                                  {o.buyer_confirmed_at && (
                                    <div style={{ marginTop: '0.5rem', background: 'var(--f-forest)', color: '#fff', borderRadius: 6, padding: '0.35rem 0.75rem', fontSize: '0.72rem', fontWeight: 800, textAlign: 'center' }}>
                                      FINALIZED BY BUYER
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Notes */}
                              {o.notes && (
                                <div style={{ marginTop: '0.875rem' }}>
                                  <div className="f-logistics-field-label">Order Notes</div>
                                  <div style={{ fontSize: '0.82rem', fontStyle: 'italic', color: '#6b7280' }}>"{o.notes}"</div>
                                </div>
                              )}

                              {/* Complaint CTA */}
                              <div style={{ marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(26,74,46,0.07)' }}>
                                <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Issue with this order?</div>
                                <a
                                  href={`/complaints/new?order_id=${o.id}&type=PAYMENT`}
                                  className="f-complaint-cta"
                                >
                                  <ShieldAlert size={16} /> Official Complaint Center
                                </a>
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
}
