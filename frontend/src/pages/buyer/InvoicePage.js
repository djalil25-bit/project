import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import api from '../../api/axiosConfig';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Printer, ChevronRight, Package,
  MapPin, Calendar, CreditCard, CheckCircle,
  ArrowLeft, ShoppingBag, Download
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
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <div className="w-9 h-9 rounded-full border-4 border-slate-200 border-t-teal-600 animate-spin" />
      <span className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading invoices...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 animate-fade-in">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-600 mb-5 bg-teal-50 px-3 py-1 rounded-full w-fit border border-teal-100 shadow-sm">
        <Link to="/buyer-dashboard" className="hover:text-teal-800 transition-colors">Marketplace</Link>
        <ChevronRight size={10} className="text-teal-300" />
        <Link to="/buyer-dashboard/orders" className="hover:text-teal-800 transition-colors">My Orders</Link>
        <ChevronRight size={10} className="text-teal-300" />
        <span className="text-teal-900">Invoices</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-teal-600">
            <FileText size={22} strokeWidth={2.5} />
          </div>
          My Invoices
        </h1>
        <p className="text-slate-500 font-medium mt-1.5 text-sm">Printable invoices for all your completed orders.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center shadow-sm">
          <ShoppingBag size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-800 mb-2">No invoices yet</h3>
          <p className="text-sm text-slate-500 mb-5">Invoices are generated for orders that have been fully delivered.</p>
          <Link to="/buyer-dashboard/orders" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95">
            View My Orders
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left border-collapse">
              <thead>
                <tr className="bg-teal-700 text-teal-100 uppercase text-[10px] font-black tracking-widest">
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-black text-teal-600 text-xs">INV-{o.id.toString().padStart(5, '0')}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">Order #AG-{o.id.toString().padStart(5, '0')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <Calendar size={12} className="text-slate-400" />
                        {new Date(o.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-semibold">
                      {o.items?.length} item{o.items?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-800 text-xs">
                      {parseFloat(o.total_price).toLocaleString()} DZD
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95"
                        onClick={() => navigate(`/buyer-dashboard/invoices/${o.id}`)}
                      >
                        <FileText size={12} /> View
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

  const handleDownload = () => {
    const element = document.getElementById('invoice-print');
    const invoiceNum = `INV-${order.id.toString().padStart(5, '0')}`;
    const opt = {
      margin:       [0.4, 0.4],
      filename:     `${invoiceNum}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <div className="w-9 h-9 rounded-full border-4 border-slate-200 border-t-teal-600 animate-spin" />
      <span className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading invoice...</span>
    </div>
  );

  if (!order) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <FileText size={40} className="text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 text-sm mb-4">Invoice not found.</p>
      <button className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  const invoiceNum = `INV-${order.id.toString().padStart(5, '0')}`;
  const orderNum   = `#AG-${order.id.toString().padStart(5, '0')}`;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 animate-fade-in">

      {/* Toolbar */}
      <div className="no-print flex justify-between items-center mb-5">
        <button
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest border border-slate-200 shadow-sm transition-all active:scale-95"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest border border-slate-200 shadow-sm transition-all active:scale-95"
            onClick={handleDownload}
          >
            <Download size={14} className="text-teal-600" /> Download PDF
          </button>
          <button
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
            onClick={handlePrint}
          >
            <Printer size={14} /> Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Body */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8" ref={printRef} id="invoice-print">

        {/* Header */}
        <div className="flex justify-between items-start mb-7 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package size={22} className="text-teal-600" />
              <span className="text-lg font-black text-teal-700">AgriGov Market</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">Direct Farm-to-Consumer Marketplace</div>
          </div>
          <div className="text-right flex gap-5 items-start">
            <div className="no-print">
              <QRDisplay value={`AG-INV-${order.id}`} size={70} title="Verify" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 mb-1">{invoiceNum}</div>
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                <CheckCircle size={10} /> Delivered
              </span>
              <div className="text-[10px] text-slate-400 font-medium mt-2">Order Ref: {orderNum}</div>
              <div className="text-[10px] text-slate-400 font-medium">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* Buyer & Delivery Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bill To</div>
            <div className="font-black text-slate-800 text-sm">{order.buyer_name}</div>
            <div className="text-xs text-slate-500 font-medium">{order.buyer_email}</div>
            {order.buyer_phone && <div className="text-xs text-slate-500 font-medium">{order.buyer_phone}</div>}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Delivery Address</div>
            <div className="text-xs text-slate-600 font-medium flex items-start gap-1.5">
              <MapPin size={12} className="text-rose-500 shrink-0 mt-0.5" />
              <span>{order.delivery_address}{order.wilaya ? `, ${order.wilaya}` : ''}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
              <CreditCard size={11} className="text-slate-400" />
              {order.payment_method?.replace(/_/g, ' ') || 'Cash on Delivery'}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-5 overflow-x-auto">
          <table className="w-full min-w-[500px] text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="pb-2 text-left text-[10px] text-slate-400 uppercase tracking-widest font-black w-[38%]">Product</th>
                <th className="pb-2 text-left text-[10px] text-slate-400 uppercase tracking-widest font-black w-[20%]">Farmer</th>
                <th className="pb-2 text-right text-[10px] text-slate-400 uppercase tracking-widest font-black w-[12%]">Qty</th>
                <th className="pb-2 text-right text-[10px] text-slate-400 uppercase tracking-widest font-black w-[15%]">Unit Price</th>
                <th className="pb-2 text-right text-[10px] text-slate-400 uppercase tracking-widest font-black w-[15%]">Subtotal</th>
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
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3">
                      <div className="font-black text-xs text-slate-800">{name}</div>
                      {item.product_detail?.category_name && (
                        <div className="text-[10px] text-slate-400 font-medium">{item.product_detail.category_name}</div>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="text-xs text-slate-600 font-semibold">{item.farmer_name || '—'}</div>
                      {item.farm_name && <div className="text-[10px] text-slate-400">{item.farm_name}</div>}
                    </td>
                    <td className="py-3 text-right text-xs text-slate-600 font-semibold">{qty} {unit}</td>
                    <td className="py-3 text-right text-xs text-slate-600 font-semibold">{unitPrice.toLocaleString()} DZD</td>
                    <td className="py-3 text-right text-xs font-black text-slate-800">{sub.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="font-black text-slate-800">{parseFloat(order.total_price).toLocaleString()} DZD</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Delivery</span>
              <span className="text-slate-400 font-medium">Included</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="font-black text-sm text-slate-800">Total</span>
              <span className="font-black text-lg text-teal-700">{parseFloat(order.total_price).toLocaleString()} DZD</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium">Thank you for shopping with AgriGov Market · Direct from Algerian Farms</p>
          <p className="text-[11px] text-slate-400 font-medium">This is a computer-generated invoice and does not require a signature.</p>
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
