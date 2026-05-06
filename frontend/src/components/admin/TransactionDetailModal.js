import React from 'react';
import { X, User, ShoppingBag, Package, Truck, MapPin, Phone, Mail, CheckCircle, AlertTriangle, MessageSquare, Flag } from 'lucide-react';

const TransactionDetailModal = ({ txn, onClose, onAction }) => {
  if (!txn) return null;
  const sc = s => { if (s==='CONFIRMED'||s==='DELIVERED') return '#047857'; if (s==='PENDING') return '#B45309'; return '#B91C1C'; };

  // Support both old flat format and new detailed format
  const buyer = txn.buyer || {};
  const items = txn.items || [];
  const firstItem = items[0] || {};

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Order #{txn.id}</h2>
            <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleDateString()} • {txn.wilaya || txn.buyer_zone || ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${sc(txn.status)}15`, color: sc(txn.status) }}>{txn.status?.replace(/_/g,' ')}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
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
              {buyer.phone && <div className="flex items-center gap-1.5"><Phone size={11}/> {buyer.phone}</div>}
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
              <button className="adm-btn adm-btn-warning text-xs" onClick={() => onAction?.(txn.id, 'flag')}><Flag size={13}/> Flag</button>
              <button className="adm-btn adm-btn-ghost text-xs" onClick={() => onAction?.(txn.id, 'cancel')}><X size={13}/> Force Cancel</button>
              <button className="adm-btn adm-btn-ghost text-xs" onClick={() => { onClose(); window.location.href='/admin-dashboard/messages'; }}><MessageSquare size={13}/> Send Message</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
