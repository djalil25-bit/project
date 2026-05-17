import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import adminApi from '../../api/adminApi';
import { useNavigate, Link } from 'react-router-dom';
import {
  Tractor, Truck, ChevronRight, Search, Check, X, Clock,
  MapPin, Maximize2, User, Phone, Mail, AlertTriangle,
  ImageOff, RefreshCw, FileText, Gauge, Zap, ExternalLink,
  ArrowLeft
} from 'lucide-react';

const RESOURCE_TYPES = [
  { key: 'farms', label: 'Farms', icon: <Tractor size={18} />, color: 'emerald' },
  { key: 'vehicles', label: 'Vehicles', icon: <Truck size={18} />, color: 'indigo' },
];

const STATUS_TABS = [
  { key: 'PENDING', label: 'Pending', color: '#d97706', bg: '#fffbeb' },
  { key: 'ACTIVE', label: 'Approved', color: '#059669', bg: '#ecfdf5' },
  { key: 'REJECTED', label: 'Rejected', color: '#dc2626', bg: '#fef2f2' },
];

export default function ResourceApprovals() {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState('farms');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const endpoint = activeType === 'farms' ? '/farm-approvals/' : '/vehicle-approvals/';
      const res = await adminApi.get(`${endpoint}?status=${activeTab}&search=${search}`);
      setResources(res.data);
    } catch (err) { 
      console.error(err); 
      setResources([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchResources(); }, [activeType, activeTab, search]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const endpoint = activeType === 'farms' ? '/farm-approvals/' : '/vehicle-approvals/';
      await adminApi.post(`${endpoint}${id}/`, { action: 'approve' });
      fetchResources();
    } catch (err) { alert('Approval failed'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectModal);
    try {
      const endpoint = activeType === 'farms' ? '/farm-approvals/' : '/vehicle-approvals/';
      await adminApi.post(`${endpoint}${rejectModal}/`, { action: 'reject', reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      fetchResources();
    } catch (err) { alert('Rejection failed'); }
    finally { setActionLoading(null); }
  };

  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'motorcycle': return <Zap size={22} />;
      default: return <Truck size={22} />;
    }
  };

  const currentType = RESOURCE_TYPES.find(t => t.key === activeType);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 animate-fade-in relative z-0">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#064e3b] mb-6 bg-[#064e3b]/10 px-3 py-1 rounded-full w-fit border border-[#064e3b]/20 shadow-sm">
        <button onClick={() => navigate('/admin-dashboard')} className="hover:text-emerald-700 transition-colors uppercase font-black flex items-center gap-1.5">
          <ArrowLeft size={10} /> Admin Hub
        </button>
        <ChevronRight size={10} className="text-[#064e3b]/40" />
        <span className="text-[#064e3b] flex items-center gap-1.5 font-black uppercase">
          <Clock size={11} /> Resource Approvals
        </span>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className={`p-2 bg-white rounded-2xl shadow-sm border border-slate-100 text-[#064e3b]`}>
              {currentType.icon}
            </div>
            Registry <span className="text-[#064e3b]">Verification</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
            Institutional verification framework for farms and logistics assets within the national agricultural registry.
          </p>
        </div>

        {/* RESOURCE SELECTOR */}
        <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner w-full sm:w-auto">
          {RESOURCE_TYPES.map(type => (
            <button
              key={type.key}
              onClick={() => { setActiveType(type.key); setActiveTab('PENDING'); setResources([]); }}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                activeType === type.key 
                  ? `bg-white text-[#064e3b] shadow-md border border-emerald-100` 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 mb-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 w-full lg:w-auto bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-inner">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.key
                  ? 'bg-[#064e3b] text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-96 group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#064e3b] transition-colors" />
            <input
              type="text"
              placeholder={`Search ${activeType} Registry...`}
              className="w-full h-12 pl-12 pr-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] shadow-inner transition-all uppercase"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <button onClick={fetchResources} className="w-12 h-12 bg-white border border-slate-200 hover:bg-emerald-50 text-slate-400 hover:text-[#064e3b] rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95 group" title="Refresh Registry">
            <RefreshCw size={18} className={`transition-transform duration-700 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className={`w-12 h-12 rounded-full border-4 border-slate-100 border-t-${currentType.color}-600 animate-spin`} />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Registry...</span>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-24 text-center flex flex-col items-center shadow-sm">
          <div className={`w-24 h-24 bg-${currentType.color}-50 rounded-[2rem] flex items-center justify-center text-${currentType.color}-200 mb-6 border border-${currentType.color}-100`}>
            {currentType.icon}
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">No {activeTab.toLowerCase()} {activeType}</h3>
          <p className="text-slate-500 font-medium max-w-sm">There are no verification requests matching your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map(item => (
            activeType === 'farms' ? (
              <FarmCard 
                key={item.id} 
                farm={item} 
                onApprove={handleApprove} 
                onReject={setRejectModal} 
                onPreview={setDocumentPreview}
                actionLoading={actionLoading} 
              />
            ) : (
              <VehicleCard 
                key={item.id} 
                vehicle={item} 
                onApprove={handleApprove} 
                onReject={setRejectModal} 
                onPreview={setDocumentPreview}
                actionLoading={actionLoading}
                getIcon={getVehicleIcon}
              />
            )
          ))}
        </div>
      )}

      {/* MODALS */}
      {rejectModal && (
        <RejectionModal 
          isOpen={!!rejectModal}
          onClose={() => { setRejectModal(null); setRejectReason(''); }}
          onConfirm={handleReject}
          reason={rejectReason}
          setReason={setRejectReason}
          loading={actionLoading}
          type={activeType === 'farms' ? 'Farm' : 'Vehicle'}
        />
      )}

      {documentPreview && (
        <DocumentPreviewModal 
          url={documentPreview} 
          onClose={() => setDocumentPreview(null)} 
        />
      )}
    </div>
  );
}

// Sub-components for cleaner structure
const FarmCard = ({ farm, onApprove, onReject, onPreview, actionLoading }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 overflow-hidden flex flex-col h-full group">
    <div className="relative h-56 bg-slate-100 overflow-hidden">
      {farm.image ? (
        <img src={farm.image.startsWith('http') ? farm.image : `http://localhost:8000${farm.image}`} alt={farm.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#064e3b] to-emerald-600 flex items-center justify-center">
          <Tractor size={48} strokeWidth={1} className="text-white/20" />
        </div>
      )}
      <div className="absolute top-6 left-6">
        <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl border backdrop-blur-md shadow-lg ${
          farm.status === 'PENDING' ? 'bg-amber-500/90 text-white border-amber-400' :
          farm.status === 'ACTIVE' ? 'bg-[#064e3b]/90 text-white border-emerald-400' :
          'bg-rose-500/90 text-white border-rose-400'
        }`}>
          {farm.status === 'PENDING' ? 'Investigation Protocol' : farm.status === 'ACTIVE' ? 'Institutional Verification' : 'Registry Rejection'}
        </span>
      </div>
    </div>
    
    <div className="p-8 flex flex-col flex-1 gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase line-clamp-1">{farm.name}</h3>
          <span className="text-[10px] font-black text-[#064e3b] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">ID {farm.id.toString().padStart(4, '0')}</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#064e3b]" /> {farm.wilaya || farm.location}</span>
          {farm.size_hectares && (
            <span className="flex items-center gap-1.5"><Maximize2 size={14} className="text-[#064e3b]" /> {farm.size_hectares} HA</span>
          )}
        </div>
      </div>

      <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 shadow-inner space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#064e3b] font-black text-base border border-slate-100 shadow-inner">
            {farm.owner_name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-slate-900 truncate uppercase">{farm.owner_name}</div>
            <div className="text-[9px] text-[#064e3b] font-black uppercase tracking-widest mt-0.5 truncate opacity-60">FARM OPERATOR</div>
          </div>
        </div>
        
        {farm.registry_document ? (
          <button 
            onClick={() => onPreview(farm.registry_document.startsWith('http') ? farm.registry_document : `http://localhost:8000${farm.registry_document}`)} 
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-emerald-50 text-[#064e3b] border border-slate-200 hover:border-emerald-200 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 group/doc"
          >
            <FileText size={16} className="group-hover/doc:scale-110 transition-transform" /> Inspect Registry Evidence
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-3 bg-slate-100/50 border border-slate-100 text-slate-400 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest italic opacity-60">
            <FileText size={16}/> Evidence Registry Empty
          </div>
        )}
      </div>

      {farm.status === 'PENDING' && (
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <button onClick={() => onApprove(farm.id)} disabled={actionLoading === farm.id} className="bg-[#064e3b] hover:bg-emerald-700 text-white h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
            {actionLoading === farm.id ? '...' : <><Check size={18}/> Verify</>}
          </button>
          <button onClick={() => onReject(farm.id)} disabled={actionLoading === farm.id} className="bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
            {actionLoading === farm.id ? '...' : <><X size={18}/> Decline</>}
          </button>
        </div>
      )}
    </div>
  </div>
);

const VehicleCard = ({ vehicle, onApprove, onReject, onPreview, actionLoading, getIcon }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 overflow-hidden flex flex-col h-full group">
    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
      <div className="flex items-center gap-5">
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg border-2 transition-all group-hover:scale-105 ${
          vehicle.status === 'ACTIVE' ? 'bg-[#064e3b] text-white border-emerald-400/30' :
          'bg-white text-amber-500 border-amber-100'
        }`}>
          {getIcon(vehicle.type)}
        </div>
        <div>
          <div className="text-lg font-black text-slate-900 leading-tight uppercase">{vehicle.type}</div>
          <div className="text-[10px] text-[#064e3b] font-black uppercase tracking-[0.2em] mt-1.5 opacity-60">Logistics Asset</div>
        </div>
      </div>
      <div className="text-right min-w-fit">
         <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1.5 opacity-60">National Plate Registry</span>
         <div className="inline-flex h-9 items-center px-4 bg-white rounded-xl border-2 border-slate-900/5 shadow-inner group-hover:border-[#064e3b]/20 transition-colors">
           <span className="text-xs font-black text-slate-900 font-mono tracking-wider whitespace-nowrap">{vehicle.plate}</span>
         </div>
      </div>
    </div>

    <div className="p-8 space-y-8 flex-1 flex flex-col">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{vehicle.model}</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol ID: {vehicle.id}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner">
             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payload Capacity</div>
             <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
               <Gauge size={14} className="text-[#064e3b]" /> {parseFloat(vehicle.capacity) >= 1000 ? `${(parseFloat(vehicle.capacity)/1000).toFixed(1)}T` : `${vehicle.capacity}KG`}
             </div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner">
             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fuel Type</div>
             <div className="text-xs font-black text-slate-900 uppercase">{vehicle.fuelType || 'Diesel'}</div>
          </div>
        </div>

        {/* REPOSITIONED: Registration Preview */}
        <div className="mt-4">
          {vehicle.carte_grise ? (
            <button 
              onClick={() => onPreview(vehicle.carte_grise.startsWith('http') ? vehicle.carte_grise : `http://localhost:8000${vehicle.carte_grise}`)} 
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-emerald-50 text-[#064e3b] border border-slate-200 hover:border-emerald-200 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 group/doc"
            >
              <FileText size={18} className="group-hover/doc:scale-110 transition-transform"/> Audit Identity Documents
            </button>
          ) : (
            <div className="w-full flex items-center justify-center gap-3 bg-slate-50 border border-slate-100 text-slate-400 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest italic opacity-60">
              <FileText size={18}/> Identity Registry Empty
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-50 rounded-[1.5rem] p-5 flex items-center gap-4 border border-slate-100 shadow-inner mt-auto">
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#064e3b] font-black text-base border border-slate-100">
          {vehicle.owner_name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-slate-900 truncate uppercase">{vehicle.owner_name}</div>
          <div className="text-[9px] text-[#064e3b] font-black uppercase tracking-widest mt-0.5 truncate opacity-60">ASSET HOLDER</div>
        </div>
      </div>

      {vehicle.status === 'PENDING' && (
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => onApprove(vehicle.id)} disabled={actionLoading === vehicle.id} className="bg-[#064e3b] hover:bg-emerald-700 text-white h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
            {actionLoading === vehicle.id ? '...' : <><Check size={18}/> Verify</>}
          </button>
          <button onClick={() => onReject(vehicle.id)} disabled={actionLoading === vehicle.id} className="bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
            {actionLoading === vehicle.id ? '...' : <><X size={18}/> Decline</>}
          </button>
        </div>
      )}
    </div>
  </div>
);

const RejectionModal = ({ isOpen, onClose, onConfirm, reason, setReason, loading, type }) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#022c22]/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl w-full max-w-lg animate-scale-in relative border border-slate-100" onClick={e => e.stopPropagation()}>
        <button className="absolute top-6 right-6 w-12 h-12 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full flex items-center justify-center transition-all shadow-sm" onClick={onClose}>
          <X size={24} />
        </button>
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-100 shadow-inner">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Reject {type}</h3>
          <p className="text-slate-500 font-medium mt-2">Explicit feedback helps the user correct their submission.</p>
        </div>
        <textarea
          className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-sm font-bold text-slate-900 resize-none focus:outline-none focus:border-red-400 focus:bg-white transition-all shadow-inner"
          placeholder="Reason for rejection..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div className="flex gap-4 mt-8">
          <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#064e3b] h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Cancel</button>
          <button onClick={onConfirm} disabled={!reason.trim() || loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 disabled:opacity-50">Confirm Rejection</button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

const DocumentPreviewModal = ({ url, onClose }) => {
  const modalContent = (
    <div className="fixed inset-0 z-[10000] bg-[#022c22]/98 backdrop-blur-xl animate-fade-in flex flex-col" onClick={onClose}>
      {/* HIGH VISIBILITY FLOATING CLOSE BUTTON */}
      <button 
        onClick={onClose} 
        className="fixed top-6 right-6 w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_rgba(244,63,94,0.4)] border-2 border-white/20 active:scale-90 group z-[120]"
        title="Close Preview"
      >
        <X size={32} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Full Screen Header */}
      <div className="flex items-center justify-between p-4 md:p-6 bg-white/5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <FileText size={20}/>
          </div>
          <div className="hidden sm:block">
            <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">AgriGov Registry Preview</h3>
            <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-1 opacity-60">Ministry Secure Document Grid</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mr-16">
          <a 
            className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all active:scale-95 flex items-center gap-2"
            href={url}
            download
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} /> <span className="hidden xs:inline">Download Original</span>
          </a>
        </div>
      </div>
      
      <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="max-w-[95vw] max-h-[85vh] bg-slate-900/60 rounded-2xl md:rounded-[2rem] border border-white/10 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.3)] flex items-center justify-center p-1 md:p-2">
          {url.toLowerCase().endsWith('.pdf') ? (
            <iframe src={url} className="w-[90vw] h-[80vh] border-0 bg-white rounded-xl" title="Document Preview" />
          ) : (
            <img 
              src={url} 
              alt="Document Preview" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
              style={{ imageRendering: 'high-quality' }}
            />
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
