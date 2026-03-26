import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

const PriceBadge = ({ comparison }) => {
  if (!comparison) return null;
  const { status, difference_percentage } = comparison;
  const cls = status === 'above' ? 'price-above' : status === 'below' ? 'price-below' : 'price-equal';
  const label = status === 'above' ? `+${difference_percentage}%` : status === 'below' ? `-${difference_percentage}%` : 'Fair Price';
  return <span className={`price-badge ${cls}`} title={`vs Official Price`}>{label}</span>;
};

function FarmerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, prodRes, ordRes] = await Promise.all([
        api.get('/dashboards/farmer-stats/'),
        api.get('/products/?my_products=true'),
        api.get('/farmer-orders/'),
      ]);
      setStats(statsRes.data);
      setProducts(prodRes.data.results || prodRes.data);
      setOrders(ordRes.data.results || ordRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOrderAction = async (itemId, action) => {
    try {
      await api.post(`/farmer-orders/${itemId}/status/`, { action });
      fetchData();
    } catch (err) { alert('Action failed'); }
  };

  const createDeliveryRequest = async (orderId) => {
    try {
      await api.post('/delivery-requests/', { order: orderId });
      alert('Delivery request created! Transporters will be notified.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create delivery request.');
    }
  };

  if (loading) return (
    <div className="loading-wrapper" style={{ minHeight: '60vh' }}>
      <div className="spinner" /><span>Loading your farm data...</span>
    </div>
  );

  return (
    <div className="farmer-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Farm Overview</h1>
          <p className="page-subtitle">Welcome back! Here's how your farm is performing today.</p>
        </div>
        <div className="page-actions">
          <button className="btn-agr btn-outline" onClick={() => navigate('/farmer-dashboard/harvests')}>🌾 My Harvests</button>
          <button className="btn-agr btn-outline" onClick={() => navigate('/farmer-dashboard/farm/new')}>🚜 Farm Settings</button>
          <button className="btn-agr btn-primary" onClick={() => navigate('/farmer-dashboard/product/new')}>➕ Add Product</button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">🌽</div>
            <div>
              <div className="stat-value">{stats.my_products_count}</div>
              <div className="stat-label">Active Listings</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">📈</div>
            <div>
              <div className="stat-value">{stats.total_items_sold}</div>
              <div className="stat-label">Units Sold</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-amber">⌛</div>
            <div>
              <div className="stat-value">{stats.pending_orders}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">💰</div>
            <div>
              <div className="stat-value">{stats.total_revenue} <small style={{fontSize: '0.6em'}}>DZD</small></div>
              <div className="stat-label">Total Earnings</div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4 mt-2">
        {/* Incoming Orders Area */}
        <div className="col-lg-12">
          <div className="agr-card">
            <div className="agr-card-header">
              <h3 className="agr-card-title">Pending Orders & Fulfillment</h3>
            </div>
            <div className="p-0">
              <table className="agr-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Earnings</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => o.order_status !== 'delivered').length === 0 ? (
                    <tr><td colSpan="6"><div className="table-empty"><div className="table-empty-icon">📦</div><div className="table-empty-text">No active orders found.</div></div></td></tr>
                  ) : orders.filter(o => o.order_status !== 'delivered').map(o => (
                    <tr key={o.id}>
                      <td><span className="fw-bold text-primary">#{o.order}</span></td>
                      <td>
                        <div className="fw-bold">{o.product_detail?.title}</div>
                        <div className="text-muted small">Buyer ID: {o.order_buyer_id}</div>
                      </td>
                      <td>{o.quantity} {o.product_detail?.unit}</td>
                      <td className="fw-bold">{o.item_total} DZD</td>
                      <td><span className={`status-badge status-${o.order_status || 'pending'}`}>{o.order_status || 'pending'}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        {o.order_status === 'pending' && (
                          <div className="d-flex gap-2 justify-content-end">
                            <button className="btn-agr btn-success btn-sm" onClick={() => handleOrderAction(o.id, 'confirm')}>Confirm</button>
                            <button className="btn-agr btn-danger btn-sm" onClick={() => handleOrderAction(o.id, 'reject')}>Reject</button>
                          </div>
                        )}
                        {o.order_status === 'confirmed' && (
                          <button className="btn-agr btn-primary btn-sm" onClick={() => createDeliveryRequest(o.order)}>
                            🚚 Request Delivery
                          </button>
                        )}
                        {o.order_status === 'in_delivery' && (
                          <span className="text-muted small italic">Transporter Assigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Products Management Area */}
        <div className="col-lg-12">
          <div className="agr-card">
            <div className="agr-card-header">
              <h3 className="agr-card-title">My Market Listings</h3>
              <button className="btn-agr btn-outline btn-sm" onClick={() => navigate('/farmer-dashboard/product/new')}>➕ List Product</button>
            </div>
            <div className="p-0">
              <table className="agr-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>Market Group</th>
                    <th>Price Check</th>
                    <th>Inventory</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan="5"><div className="table-empty"><div className="table-empty-icon">🌱</div><div className="table-empty-text">Your shop is empty. Start adding products!</div></div></td></tr>
                  ) : products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="fw-bold">{p.title}</div>
                        <div className="text-muted small">{p.description?.slice(0, 60)}...</div>
                      </td>
                      <td><span className="badge">{p.category_name}</span></td>
                      <td>
                        <div className="fw-bold">{p.price} DZD <span className="text-muted small" style={{fontWeight: 400}}>/{p.unit}</span></div>
                        <PriceBadge comparison={p.official_price_comparison} />
                      </td>
                      <td>
                        <div className={`fw-bold ${p.stock < 10 ? 'text-danger' : ''}`}>{p.stock} {p.unit}</div>
                        {p.stock < 10 && <div className="text-danger small" style={{fontSize: '0.7rem'}}>Low Stock!</div>}
                      </td>
                      <td><span className={`status-badge status-${p.is_active ? 'active' : 'suspended'}`}>{p.is_active ? 'Published' : 'Hidden'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmerDashboard;
