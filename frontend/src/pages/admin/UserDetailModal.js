import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api/axiosConfig';
import { X, User as UserIcon, Mail, Phone, MapPin, Briefcase, FileText, CheckCircle, Clock, FileDown, Eye, XCircle, Shield, AlertTriangle } from 'lucide-react';

const roleColors = {
  farmer: { bg: '#E6F9EE', text: '#047857', border: '#34D399' },
  buyer: { bg: '#E8F0FE', text: '#0066CC', border: '#60A5FA' },
  transporter: { bg: '#FFF4E0', text: '#B45309', border: '#FBBF24' }
};

const UserDetailModal = ({ userId, onClose, onAction }) => {
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, docsRes] = await Promise.all([
          api.get(`/auth/admin/users/${userId}/`),
          api.get(`/auth/admin/users/${userId}/documents/`)
        ]);
        setUser(userRes.data);
        const docs = Array.isArray(docsRes.data) ? docsRes.data : docsRes.data.results || [];
        const formattedDocs = docs.map(d => ({
          ...d,
          file_url: d.file_url?.startsWith('http') ? d.file_url : `http://localhost:8000${d.file_url}`
        }));
        setDocuments(formattedDocs);
      } catch (err) {
        console.error('Failed to fetch user details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!userId) return null;

  const handleDocumentClick = (doc) => {
    const url = doc.file_url?.startsWith('http') 
      ? doc.file_url 
      : `http://localhost:8000${doc.file_url}`;
    setPreviewDoc({ ...doc, file_url: url });
  };

  const closePreview = () => setPreviewDoc(null);

  const colors = user ? (roleColors[user.role] || roleColors.buyer) : roleColors.buyer;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm anim-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative border border-gray-100">
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="adm-spinner"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading user profile...</p>
          </div>
        ) : !user ? (
          <div className="flex-1 flex items-center justify-center p-10 flex-col text-center">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-800">User Not Found</h3>
            <button onClick={onClose} className="mt-4 adm-btn adm-btn-ghost">Close</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold shadow-sm border-2 overflow-hidden"
                  style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                >
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{user.full_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" 
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {user.role}
                    </span>
                    {user.status === 'pending' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock size={10}/> PENDING REVIEW</span>}
                    {user.status === 'approved' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={10}/> APPROVED</span>}
                    {user.status === 'rejected' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1"><XCircle size={10}/> REJECTED</span>}
                    {user.status === 'suspended' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 flex items-center gap-1"><Shield size={10}/> SUSPENDED</span>}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 gap-6 text-sm font-medium">
              <button 
                className={`py-3 relative ${activeTab === 'profile' ? 'text-[#064e3b]' : 'text-gray-500 hover:text-gray-800'}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile Details
                {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#064e3b] rounded-t-full"></div>}
              </button>
              <button 
                className={`py-3 relative ${activeTab === 'documents' ? 'text-[#064e3b]' : 'text-gray-500 hover:text-gray-800'}`}
                onClick={() => setActiveTab('documents')}
              >
                Documents ({documents.length})
                {activeTab === 'documents' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#064e3b] rounded-t-full"></div>}
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Basic Info Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <UserIcon size={16} className="text-gray-400"/> General Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                      <div><div className="text-xs text-gray-500 mb-1">Email Address</div><div className="font-medium text-gray-900 flex items-center gap-2"><Mail size={14} className="text-gray-400"/> {user.email}</div></div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Phone Number</div>
                        <div className="font-medium text-gray-900">
                          {user.phone ? (
                            <a 
                              href={`https://wa.me/${user.phone.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl hover:bg-[#064e3b] hover:text-white hover:border-emerald-600 transition-all shadow-sm font-bold"
                            >
                              <Phone size={14} className="text-[#064e3b] group-hover:text-white"/> {user.phone}
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Phone size={14} /> N/A
                            </div>
                          )}
                        </div>
                      </div>
                      <div><div className="text-xs text-gray-500 mb-1">Wilaya / Address</div><div className="font-medium text-gray-900 flex items-center gap-2"><MapPin size={14} className="text-gray-400"/> {user.address || 'N/A'}</div></div>
                      <div><div className="text-xs text-gray-500 mb-1">Registration Date</div><div className="font-medium text-gray-900 flex items-center gap-2"><Clock size={14} className="text-gray-400"/> {new Date(user.created_at).toLocaleString()}</div></div>
                    </div>
                  </div>

                  {/* Activity Summary Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2 text-gray-400">
                       Platform Activity Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(user.role === 'farmer' || !user.role) && (
                        <>
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="text-[10px] font-black text-[#064e3b] uppercase tracking-widest">Listings</div>
                            <div className="text-2xl font-black text-emerald-900 leading-none mt-1">{user.stats?.listings || 0}</div>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="text-[10px] font-black text-[#064e3b] uppercase tracking-widest">Orders</div>
                            <div className="text-2xl font-black text-emerald-900 leading-none mt-1">{user.stats?.orders || 0}</div>
                          </div>
                        </>
                      )}
                      {user.role === 'buyer' && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[10px] font-black text-[#064e3b] uppercase tracking-widest">Total Orders</div>
                          <div className="text-2xl font-black text-slate-900 leading-none mt-1">{user.stats?.orders || 0}</div>
                        </div>
                      )}
                      {user.role === 'transporter' && (
                        <>
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Vehicles</div>
                            <div className="text-2xl font-black text-amber-900 leading-none mt-1">{user.stats?.vehicles || 0}</div>
                          </div>
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Missions</div>
                            <div className="text-2xl font-black text-amber-900 leading-none mt-1">{user.stats?.missions || 0}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Role Specific Card */}
                  {user.role === 'farmer' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-[#16a34a]">
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Briefcase size={16} className="text-[#16a34a]"/> Farmer Profile
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                        <div><div className="text-xs text-gray-500 mb-1">Farm Name</div><div className="font-medium text-gray-900">{user.farmer_profile?.farm_name || 'N/A'}</div></div>
                        <div><div className="text-xs text-gray-500 mb-1">Farm Location</div><div className="font-medium text-gray-900">{user.farmer_profile?.farm_location || 'N/A'}</div></div>
                        <div><div className="text-xs text-gray-500 mb-1">Production Type</div><div className="font-medium text-gray-900 capitalize">{user.farmer_profile?.production_type || 'N/A'}</div></div>
                      </div>
                    </div>
                  )}

                  {user.role === 'buyer' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-[#2563eb]">
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Briefcase size={16} className="text-[#2563eb]"/> Buyer Profile
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                        <div><div className="text-xs text-gray-500 mb-1">Buyer Type</div><div className="font-medium text-gray-900 capitalize">{user.buyer_profile?.buyer_type || 'N/A'}</div></div>
                        <div><div className="text-xs text-gray-500 mb-1">Company Name</div><div className="font-medium text-gray-900">{user.buyer_profile?.company_name || 'N/A'}</div></div>
                        <div><div className="text-xs text-gray-500 mb-1">Tax Number</div><div className="font-medium text-gray-900">{user.buyer_profile?.tax_number || 'N/A'}</div></div>
                      </div>
                    </div>
                  )}

                  {user.role === 'transporter' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-[#f97316]">
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Briefcase size={16} className="text-[#f97316]"/> Transporter Profile
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                        <div><div className="text-xs text-gray-500 mb-1">Vehicle Type</div><div className="font-medium text-gray-900 capitalize">{user.transporter_profile?.vehicle_type || 'N/A'}</div></div>
                        <div><div className="text-xs text-gray-500 mb-1">Plate Number</div><div className="font-medium text-gray-900">{user.transporter_profile?.plate_number || 'N/A'}</div></div>
                        <div><div className="text-xs text-gray-500 mb-1">Capacity (Tons)</div><div className="font-medium text-gray-900">{user.transporter_profile?.capacity_tons || '0'} T</div></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 min-h-[300px]">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-gray-400"/> Uploaded Documents
                  </h3>
                  
                  {documents.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <FileText size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No documents found for this user.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documents.map((doc) => {
                        return (
                          <div 
                            key={doc.id} 
                            className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col bg-gray-50 cursor-pointer"
                            onClick={() => handleDocumentClick(doc)}
                          >
                            {/* Preview Area */}
                            <div className="aspect-video relative bg-slate-200 overflow-hidden">
                              {doc.file_url.toLowerCase().endsWith('.pdf') ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                                  <FileText size={48} strokeWidth={1} />
                                  <span className="text-[10px] font-black uppercase tracking-widest mt-2">PDF Document</span>
                                </div>
                              ) : (
                                <img src={doc.file_url} alt={doc.document_type} className="w-full h-full object-cover" />
                              )}
                              
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button className="bg-white p-2 rounded-full text-gray-900 hover:scale-110 transition-transform shadow-lg" title="Preview">
                                  <Eye size={18} />
                                </button>
                                <a 
                                  href={doc.file_url} 
                                  download 
                                  onClick={(e) => e.stopPropagation()} 
                                  className="bg-white p-2 rounded-full text-gray-900 hover:scale-110 transition-transform shadow-lg" 
                                  title="Download"
                                >
                                  <FileDown size={18} />
                                </a>
                              </div>
                            </div>
                            {/* Details Area */}
                            <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-gray-800 capitalize mb-1 truncate">
                                  {doc.document_type.replace(/_/g, ' ')}
                                </h4>
                                <div className="text-xs text-gray-500 mb-2">
                                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {doc.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex flex-wrap justify-end gap-3 items-center">
              {user.status === 'pending' && (
                <>
                  <button onClick={() => onAction(user.id, 'reject')} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 text-sm">
                    <XCircle size={16}/> Reject Application
                  </button>
                  <button onClick={() => onAction(user.id, 'approve')} className="px-4 py-2 bg-emerald-500 hover:bg-[#064e3b] text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 text-sm">
                    <CheckCircle size={16}/> Approve Account
                  </button>
                </>
              )}
              {user.status === 'approved' && (
                <button onClick={() => onAction(user.id, 'suspend')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 text-sm">
                  <Shield size={16}/> Suspend Account
                </button>
              )}
              {(user.status === 'suspended' || user.status === 'rejected') && (
                <button onClick={() => onAction(user.id, 'reactivate')} className="px-4 py-2 bg-slate-500 hover:bg-[#064e3b] text-white rounded-xl font-bold shadow-md shadow-slate-500/20 transition-all flex items-center gap-2 text-sm">
                  <CheckCircle size={16}/> Reactivate Account
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Document Preview Modal */}
      {previewDoc && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] bg-[#022c22]/98 backdrop-blur-xl flex flex-col animate-fade-in" onClick={closePreview}>
          {/* HIGH VISIBILITY FLOATING CLOSE BUTTON */}
          <button 
            onClick={closePreview} 
            className="fixed top-6 right-6 w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_rgba(244,63,94,0.4)] border-2 border-white/20 active:scale-90 group z-[120]"
            title="Close Preview"
          >
            <X size={32} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <div className="flex items-center justify-between p-4 md:p-6 bg-white/5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <FileText size={20}/>
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">
                  {previewDoc.document_type.replace(/_/g, ' ')}
                </h3>
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-1 opacity-60">Verified Document Asset</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mr-16">
              <a 
                href={previewDoc.file_url} 
                download 
                className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all active:scale-95 flex items-center gap-2"
                title="Download for Archival"
              >
                <FileDown size={14} /> <span className="hidden xs:inline">Download</span>
              </a>
            </div>
          </div>
          
          <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="max-w-[95vw] max-h-[85vh] bg-slate-900/60 rounded-2xl md:rounded-[2rem] border border-white/10 overflow-hidden relative shadow-2xl flex items-center justify-center p-1 md:p-2">
              {previewDoc.file_url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewDoc.file_url} className="w-[90vw] h-[80vh] border-0 bg-white rounded-xl" title="PDF Preview" />
              ) : (
                <img 
                  src={previewDoc.file_url} 
                  alt="Document Preview" 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default UserDetailModal;
