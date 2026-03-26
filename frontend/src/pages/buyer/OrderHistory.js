import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Link } from 'react-router-dom';

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>{status.replace(/_/g, ' ')}</span>
);

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
        <span className="agr-breadcrumb-sep">›</span>
        <span>Purchase Records</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Order History</h1>
          <p className="page-subtitle">View and track all your past and current marketplace orders.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-wrapper" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
      ) : (
        <div className="row">
          {orders.length === 0 ? (
            <div className="col-12">
              <div className="agr-card text-center py-5">
                <div className="h1 mb-3">📦</div>
                <h3>No orders yet</h3>
                <p className="text-muted">Explore the marketplace and find fresh local products!</p>
                <Link to="/buyer-dashboard" className="btn-agr btn-primary mt-3">Start Shopping</Link>
              </div>
            </div>
          ) : (
            <div className="col-12">
              <div className="agr-card overflow-hidden">
                <div className="table-responsive">
                  <table className="agr-table mb-0">
                    <thead>
                      <tr>
                        <th>Ref #</th>
                        <th>Created Date</th>
                        <th>Product Summary</th>
                        <th>Amount Paid</th>
                        <th>Order Status</th>
                        <th style={{ textAlign: 'right' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <React.Fragment key={o.id}>
                          <tr className={expanded === o.id ? 'bg-light' : ''}>
                            <td className="fw-bold text-primary">AG-{o.id.toString().padStart(6, '0')}</td>
                            <td className="text-muted small">{new Date(o.created_at).toLocaleDateString()}</td>
                            <td>
                              <div className="fw-bold">{o.items?.length} Item(s)</div>
                              <div className="text-muted small italic">
                                {o.items?.[0]?.product_detail?.title} {o.items?.length > 1 ? `+${o.items.length - 1} more` : ''}
                              </div>
                            </td>
                            <td className="fw-bold text-dark">{o.total_price} DZD</td>
                            <td><StatusBadge status={o.status} /></td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="btn-agr btn-outline btn-sm rounded-pill" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                                {expanded === o.id ? '▲ Close' : '🔍 View'}
                              </button>
                            </td>
                          </tr>
                          {expanded === o.id && (
                            <tr>
                              <td colSpan="6" className="p-0 border-0">
                                <div className="bg-light p-4 animate-slide-in">
                                  <div className="row">
                                    <div className="col-md-6 mb-3 mb-md-0">
                                      <h5 className="fw-bold small text-uppercase text-muted mb-2">Delivery Information</h5>
                                      <div className="p-3 bg-white rounded shadow-sm">
                                        <div className="mb-2"><span className="text-muted small d-block">Full Address</span> {o.delivery_address}</div>
                                        <div><span className="text-muted small d-block">Method</span> Cash on Delivery (COD)</div>
                                      </div>
                                    </div>
                                    <div className="col-md-6">
                                      <h5 className="fw-bold small text-uppercase text-muted mb-2">Itemized Breakdown</h5>
                                      <div className="bg-white rounded shadow-sm overflow-hidden">
                                        {o.items?.map(item => (
                                          <div key={item.id} className="d-flex justify-content-between p-2 px-3 border-bottom small">
                                            <span>{item.quantity} × {item.product_detail?.title}</span>
                                            <span className="fw-bold">{item.price_snapshot} DZD</span>
                                          </div>
                                        ))}
                                        <div className="d-flex justify-content-between p-2 px-3 bg-primary-50 fw-bold">
                                          <span>Grand Total</span>
                                          <span className="text-primary">{o.total_price} DZD</span>
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
