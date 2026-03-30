import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Printer, Download, ChevronRight, Package,
  MapPin, Calendar, CreditCard, User, Truck, CheckCircle,
  ArrowLeft, ShoppingBag
} from 'lucide-react';
import QRDisplay from '../../components/common/QRDisplay';

/* ─── Invoice list (delivered orders) ───────────────────── */
function InvoiceList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/')
      .then(res => {
        const all = res.data.results || res.data;
        setOrders(all.filter(o => o.delivery_status?.toUpperCase() === 'DELIVERED'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-center py-5">
      <div className="spinner-agr" />
      <span className="ms-3 text-muted small">Loading invoices...</span>
    </div>
  );

  return (
    <div className="invoice-list-page animate-fade-in">
      <div className="agr-breadcrumb">
        <Link to="/buyer-dashboard">Marketplace</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <Link to="/buyer-dashboard/orders">My Orders</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>Invoices</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title d-flex align-items-center">
            <FileText className="text-primary me-3" size={28} /> My Invoices
          </h1>
          <p className="page-subtitle text-muted">Printable invoices for all your completed orders.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="agr-card p-5 text-center mt-4">
          <ShoppingBag size={64} className="text-muted mb-3 opacity-25" />
          <h3 className="h4 text-muted">No invoices yet</h3>
          <p className="small text-muted mb-4">Invoices are generated for orders that have been fully delivered.</p>
          <Link to="/buyer-dashboard/orders" className="btn-agr btn-primary">View My Orders</Link>
        </div>
      ) : (
        <div className="agr-card overflow-hidden mt-4">
          <div className="table-responsive">
            <table className="agr-table mb-0">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th className="text-end">Total</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="hover-bg-light">
                    <td>
                      <span className="fw-bold text-primary">INV-{o.id.toString().padStart(5, '0')}</span>
                      <div className="very-small text-muted mt-1">Order #AG-{o.id.toString().padStart(5, '0')}</div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Calendar size={13} className="text-muted me-2" />
                        <span className="small">{new Date(o.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="small">{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</div>
                    </td>
                    <td className="text-end fw-bold">{parseFloat(o.total_price).toLocaleString()} DZD</td>
                    <td className="text-end">
                      <button
                        className="btn-agr btn-primary btn-sm d-inline-flex align-items-center gap-1"
                        onClick={() => navigate(`/buyer-dashboard/invoices/${o.id}`)}
                      >
                        <FileText size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Single Invoice / Print view ───────────────────────── */
function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}/`)
      .then(res => setOrder(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Invoice-INV-${id?.padStart(5, '0')}`;
    window.print();
    document.title = originalTitle;
  };

  if (loading) return (
    <div className="flex-center py-5">
      <div className="spinner-agr" />
      <span className="ms-3 text-muted small">Loading invoice...</span>
    </div>
  );

  if (!order) return (
    <div className="agr-card p-5 text-center">
      <FileText size={48} className="text-muted mb-3 opacity-25" />
      <p className="text-muted">Invoice not found.</p>
      <button className="btn-agr btn-primary" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  const invoiceNum = `INV-${order.id.toString().padStart(5, '0')}`;
  const orderNum   = `#AG-${order.id.toString().padStart(5, '0')}`;

  return (
    <div className="invoice-detail-page animate-fade-in">
      {/* Toolbar (hidden on print) */}
      <div className="invoice-toolbar no-print d-flex justify-content-between align-items-center mb-4">
        <button className="btn-agr btn-outline d-flex align-items-center gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back to Invoices
        </button>
        <div className="d-flex gap-2">
          <button className="btn-agr btn-outline d-flex align-items-center gap-2" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Invoice Body */}
      <div className="invoice-card agr-card p-5" ref={printRef} id="invoice-print">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-5">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <Package size={28} className="text-primary" />
              <span className="h4 fw-bold text-primary mb-0">AgriGov Market</span>
            </div>
            <div className="text-muted small">Direct Farm-to-Consumer Marketplace</div>
          </div>
          <div className="text-end d-flex gap-4 align-items-start">
            <div className="no-print">
               <QRDisplay value={`AG-INV-${order.id}`} size={80} title="Verify" />
            </div>
            <div>
              <div className="h3 fw-bold text-dark mb-1">{invoiceNum}</div>
              <span className="inline-badge badge-status-delivered"><CheckCircle size={11} className="me-1" />DELIVERED</span>
              <div className="very-small text-muted mt-2">Order Ref: {orderNum}</div>
              <div className="very-small text-muted">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* Buyer & Delivery Info */}
        <div className="row g-4 mb-5">
          <div className="col-md-6">
            <div className="invoice-section-title">Bill To</div>
            <div className="fw-bold">{order.buyer_name}</div>
            <div className="small text-muted">{order.buyer_email}</div>
            {order.buyer_phone && <div className="small text-muted">{order.buyer_phone}</div>}
          </div>
          <div className="col-md-6">
            <div className="invoice-section-title">Delivery Address</div>
            <div className="small d-flex align-items-start">
              <MapPin size={13} className="text-danger me-1 mt-1 flex-shrink-0" />
              <span>{order.delivery_address}{order.wilaya ? `, ${order.wilaya}` : ''}</span>
            </div>
            <div className="very-small text-muted mt-1 d-flex align-items-center">
              <CreditCard size={11} className="me-1" />
              {order.payment_method?.replace(/_/g, ' ') || 'Cash on Delivery'}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="invoice-items-table mb-4">
          <table className="w-100" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th className="py-2 text-left very-small text-muted text-uppercase" style={{ width: '40%' }}>Product</th>
                <th className="py-2 text-left very-small text-muted text-uppercase" style={{ width: '20%' }}>Farmer</th>
                <th className="py-2 text-right very-small text-muted text-uppercase" style={{ width: '12%' }}>Qty</th>
                <th className="py-2 text-right very-small text-muted text-uppercase" style={{ width: '14%' }}>Unit Price</th>
                <th className="py-2 text-right very-small text-muted text-uppercase" style={{ width: '14%' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map(item => {
                const name      = item.product_detail?.title || item.product_name || '—';
                const unit      = item.product_detail?.unit || item.product_unit || '';
                const unitPrice = parseFloat(item.price_per_unit || item.price_snapshot || 0);
                const qty       = parseFloat(item.quantity || 0);
                const sub       = unitPrice * qty;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td className="py-3">
                      <div className="fw-bold small">{name}</div>
                      {item.product_detail?.category_name && (
                        <div className="very-small text-muted">{item.product_detail.category_name}</div>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="small">{item.farmer_name || '—'}</div>
                      {item.farm_name && <div className="very-small text-muted">{item.farm_name}</div>}
                    </td>
                    <td className="py-3 text-end small">{qty} {unit}</td>
                    <td className="py-3 text-end small">{unitPrice.toLocaleString()} DZD</td>
                    <td className="py-3 text-end fw-bold small">{sub.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="d-flex justify-content-end">
          <div style={{ minWidth: '280px' }}>
            <div className="d-flex justify-content-between mb-2 small">
              <span className="text-muted">Subtotal</span>
              <span className="fw-bold">{parseFloat(order.total_price).toLocaleString()} DZD</span>
            </div>
            <div className="d-flex justify-content-between mb-2 small">
              <span className="text-muted">Delivery</span>
              <span className="text-muted">Included</span>
            </div>
            <div className="d-flex justify-content-between pt-2 border-top">
              <span className="fw-bold">TOTAL</span>
              <span className="h5 fw-bold text-primary mb-0">{parseFloat(order.total_price).toLocaleString()} DZD</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-top text-center very-small text-muted">
          <p className="mb-0">Thank you for shopping with AgriGov Market · Direct from Algerian Farms</p>
          <p className="mb-0">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Route-level export ─────────────────────────────────── */
function InvoicePage() {
  const { id } = useParams();
  return id ? <InvoiceDetail /> : <InvoiceList />;
}

export default InvoicePage;
