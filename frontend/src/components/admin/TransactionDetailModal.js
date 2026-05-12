import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, User, ShoppingBag, Package, Truck, MapPin, Phone, Mail, CheckCircle, AlertTriangle, MessageSquare, Flag, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const TransactionDetailModal = ({ txn, onClose, onAction }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!txn) return null;

  const downloadPDF = () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #1e293b;">
        <div style="border-bottom: 4px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="margin: 0; color: #1e3a8a; font-size: 28px; font-weight: 900; letter-spacing: -1px;">AGRIGOV <span style="color: #3b82f6;">MANIFEST</span></h1>
            <p style="margin: 5px 0 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #64748b;">Official Order Summary • ID: #${txn.id}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #1e293b;">Date: ${new Date(txn.created_at).toLocaleDateString()}</p>
            <p style="margin: 2px 0 0; font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Status: ${txn.status}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: #eff6ff; padding: 20px; border-radius: 12px; border: 1px solid #dbeafe;">
            <h3 style="margin-top: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #1d4ed8; margin-bottom: 12px; border-bottom: 1px solid #dbeafe; padding-bottom: 5px;">Buyer Information</h3>
            <p style="margin: 0; font-size: 15px; font-weight: 800; color: #1e293b;">${txn.buyer?.name || txn.buyer_name || 'N/A'}</p>
            <div style="margin-top: 8px; font-size: 11px; color: #475569; line-height: 1.6;">
              ${txn.buyer?.email ? `<div><b>Email:</b> ${txn.buyer.email}</div>` : ''}
              ${txn.buyer?.phone ? `<div><b>Phone:</b> ${txn.buyer.phone}</div>` : ''}
              <div><b>Wilaya:</b> ${txn.wilaya || txn.buyer_zone || 'N/A'}</div>
            </div>
          </div>
          <div style="background: #fff7ed; padding: 20px; border-radius: 12px; border: 1px solid #ffedd5;">
            <h3 style="margin-top: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #c2410c; margin-bottom: 12px; border-bottom: 1px solid #ffedd5; padding-bottom: 5px;">Logistics Detail</h3>
            <div style="font-size: 11px; color: #475569; line-height: 1.6;">
              <div><b>Delivery Status:</b> ${txn.delivery_status || 'N/A'}</div>
              <div><b>Wilaya:</b> ${txn.wilaya || 'N/A'}</div>
              <div><b>Commune:</b> ${txn.commune || 'N/A'}</div>
              ${txn.delivery_address ? `<div style="margin-top: 5px; padding-top: 5px; border-top: 1px dashed #fed7aa;"><b>Address:</b> ${txn.delivery_address}</div>` : ''}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Product Inventory</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="text-align: left; background: #f8fafc;">
                <th style="padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b;">Description</th>
                <th style="padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; text-align: right;">Quantity</th>
                <th style="padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; text-align: right;">Price</th>
                <th style="padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(txn.items && txn.items.length > 0 ? txn.items : [{product: txn.product, quantity: txn.quantity, price_snapshot: txn.total_price / (txn.quantity || 1), item_total: txn.total_price}]).map(item => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-weight: bold; font-size: 12px;">${item.product}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">${item.quantity}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">${item.price_snapshot?.toLocaleString()} DZD</td>
                  <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #2563eb;">${item.item_total?.toLocaleString()} DZD</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 15px 12px; text-align: right; font-weight: bold; color: #64748b;">Logistics / Transport Fee</td>
                <td style="padding: 15px 12px; text-align: right; font-weight: bold;">${txn.transport_fee?.toLocaleString() || 0} DZD</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td colspan="3" style="padding: 15px 12px; text-align: right; font-size: 14px; font-weight: 900; color: #1e293b;">FINAL SETTLEMENT TOTAL</td>
                <td style="padding: 15px 12px; text-align: right; font-size: 18px; font-weight: 900; color: #2563eb;">${txn.total_price.toLocaleString()} DZD</td>
              </tr>
            </tfoot>
          </table>
        </div>

        ${txn.timeline && txn.timeline.length > 0 ? `
          <div style="margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">Transaction Timeline</h3>
            <div style="font-size: 10px; color: #475569; line-height: 1.8;">
              ${txn.timeline.map(t => `
                <div style="display: flex; gap: 15px; margin-bottom: 5px;">
                  <span style="font-weight: bold; color: #1e293b; width: 70px;">${new Date(t.created_at).toLocaleDateString()}</span>
                  <span style="font-weight: 800; color: #3b82f6; width: 100px;">${t.status}</span>
                  <span>by ${t.actor}</span>
                  ${t.note ? `<span style="font-style: italic; color: #94a3b8;">— ${t.note}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 9px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
          Certified Digital Manifest • AgriGov Intelligence Network • ALGIERS, ALGERIA
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `agrigov_order_${txn.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
  };

  const sc = s => { if (s==='CONFIRMED'||s==='DELIVERED') return '#047857'; if (s==='PENDING') return '#B45309'; return '#B91C1C'; };

  // Support both old flat format and new detailed format
  const buyer = txn.buyer || {};
  const items = txn.items || [];
  const firstItem = items[0] || {};

  const modalContent = (
    <div className="adm-modal-overlay z-[9999] fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="adm-modal bg-white rounded-2xl shadow-2xl flex flex-col relative border border-gray-100 max-h-[90vh] w-full" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Order #{txn.id}</h2>
            <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleDateString()} • {txn.wilaya || txn.buyer_zone || ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${sc(txn.status)}15`, color: sc(txn.status) }}>{txn.status?.replace(/_/g,' ')}</span>
            <button onClick={downloadPDF} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100" title="Download Official Manifest">
              <Download size={18}/>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-1"><X size={20}/></button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {/* Buyer Info */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-3"><ShoppingBag size={14} className="text-blue-600"/><span className="text-xs font-bold text-blue-700 uppercase">Buyer</span></div>
            <div className="text-sm font-semibold text-gray-800 mb-1">{buyer.name || txn.buyer_name || 'N/A'}</div>
            <div className="space-y-1 text-xs text-gray-600">
              {buyer.email && <div className="flex items-center gap-1.5"><Mail size={11}/> {buyer.email}</div>}
              {buyer.phone && (
                <a 
                  href={`https://wa.me/${buyer.phone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm font-bold mt-1"
                >
                  <Phone size={11}/> {buyer.phone}
                </a>
              )}
              {buyer.zone && <div className="flex items-center gap-1.5"><MapPin size={11}/> {buyer.zone}</div>}
              <div className="flex items-center gap-1.5">{buyer.verified ? <><CheckCircle size={11} className="text-green-500"/> Verified</> : <><AlertTriangle size={11} className="text-orange-500"/> Pending</>}</div>
            </div>
          </div>

          {/* Order Items */}
          {items.length > 0 && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-3"><Package size={14} className="text-gray-600"/><span className="text-xs font-bold text-gray-600 uppercase">Order Items</span></div>
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{item.product}</div>
                    <div className="text-xs text-gray-500">by {item.farmer_name} • {item.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{item.quantity} × {item.price_snapshot} DZD</div>
                    <div className="text-xs text-blue-600 font-bold">{item.item_total?.toLocaleString()} DZD</div>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200 text-sm">
                <div><label className="adm-label">Subtotal</label><span className="font-semibold">{txn.order_subtotal?.toLocaleString()} DZD</span></div>
                <div><label className="adm-label">Transport</label><span className="font-semibold">{txn.transport_fee?.toLocaleString()} DZD</span></div>
                <div><label className="adm-label">Total</label><span className="font-bold text-blue-600">{txn.total_price?.toLocaleString()} DZD</span></div>
              </div>
            </div>
          )}

          {/* If no items detail (flat format) */}
          {items.length === 0 && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-3"><Package size={14} className="text-gray-600"/><span className="text-xs font-bold text-gray-600 uppercase">Product Details</span></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><label className="adm-label">Product</label><span className="text-sm font-semibold text-gray-800">{txn.product || 'N/A'}</span></div>
                <div><label className="adm-label">Total Value</label><span className="text-sm font-bold text-blue-600">{txn.total_price?.toLocaleString()} DZD</span></div>
                <div><label className="adm-label">Payment</label><span className="text-sm text-gray-700">{txn.payment_method?.replace(/_/g,' ')}</span></div>
              </div>
            </div>
          )}

          {/* Logistics */}
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 mb-3"><Truck size={14} className="text-orange-600"/><span className="text-xs font-bold text-orange-700 uppercase">Logistics</span></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><label className="adm-label">Delivery Status</label><span className="text-sm text-gray-700">{txn.delivery_status?.replace(/_/g,' ')}</span></div>
              <div><label className="adm-label">Wilaya</label><span className="text-sm text-gray-700">{txn.wilaya || txn.buyer_zone || 'N/A'}</span></div>
              <div><label className="adm-label">Commune</label><span className="text-sm text-gray-700">{txn.commune || 'N/A'}</span></div>
            </div>
            {txn.delivery_address && <div className="mt-2 text-xs text-gray-500"><label className="adm-label">Address</label>{txn.delivery_address}</div>}
          </div>

          {/* Timeline */}
          {txn.timeline && txn.timeline.length > 0 && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-xs font-bold text-gray-600 uppercase mb-3">Order Timeline</div>
              <div className="space-y-2">
                {txn.timeline.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                    <span className="text-gray-500 w-24 shrink-0">{new Date(t.created_at).toLocaleDateString()}</span>
                    <span className="font-semibold text-gray-700">{t.status}</span>
                    <span className="text-gray-400">by {t.actor}</span>
                    {t.note && <span className="text-gray-400 italic">— {t.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div className="border-t border-gray-100 pt-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Admin Actions</span>
            <div className="flex flex-wrap gap-2 mt-3">
              <button className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 text-xs" onClick={() => onAction?.(txn.id, 'flag')}><Flag size={13}/> Flag</button>
              <button className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 text-xs" onClick={() => onAction?.(txn.id, 'cancel')}><X size={13}/> Force Cancel</button>
              <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 text-xs" onClick={() => { onClose(); window.location.href='/admin-dashboard/messages'; }}><MessageSquare size={13}/> Send Message</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default TransactionDetailModal;
