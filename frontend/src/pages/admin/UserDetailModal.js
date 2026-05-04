import React, { useState, useEffect } from 'react';
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
        setDocuments(Array.isArray(docsRes.data) ? docsRes.data : docsRes.data.results || []);
      } catch (err) {
        console.error('Failed to fetch user details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId]);

  if (!userId) return null;

  const handleDocumentClick = (doc) => {
    setPreviewDoc(doc);
  };

  const closePreview = () => setPreviewDoc(null);

  const colors = user ? (roleColors[user.role] || roleColors.buyer) : roleColors.buyer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm anim-fade-in">
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
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold shadow-sm border-2"
                  style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                >
                  {user.full_name?.charAt(0).toUpperCase()}
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
                className={`py-3 relative ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile Details
                {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
              </button>
              <button 
                className={`py-3 relative ${activeTab === 'documents' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                onClick={() => setActiveTab('documents')}
              >
                Documents ({documents.length})
                {activeTab === 'documents' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
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
                      <div><div className="text-xs text-gray-500 mb-1">Phone Number</div><div className="font-medium text-gray-900 flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {user.phone || 'N/A'}</div></div>
                      <div><div className="text-xs text-gray-500 mb-1">Wilaya / Address</div><div className="font-medium text-gray-900 flex items-center gap-2"><MapPin size={14} className="text-gray-400"/> {user.address || 'N/A'}</div></div>
                      <div><div className="text-xs text-gray-500 mb-1">Registration Date</div><div className="font-medium text-gray-900 flex items-center gap-2"><Clock size={14} className="text-gray-400"/> {new Date(user.created_at).toLocaleString()}</div></div>
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
                        const isPdf = doc.file_url.toLowerCase().endsWith('.pdf');
                        return (
                          <div key={doc.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col bg-gray-50">
                            {/* Preview Area */}
                            <div className="h-32 bg-gray-200 relative flex items-center justify-center overflow-hidden">
                              {isPdf ? (
                                <FileText size={48} className="text-gray-400" />
                              ) : (
                                <img src={doc.file_url} alt={doc.document_type} className="w-full h-full object-cover" />
                              )}
                              
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button onClick={() => handleDocumentClick(doc)} className="bg-white p-2 rounded-full text-gray-900 hover:scale-110 transition-transform shadow-lg" title="Preview">
                                  <Eye size={18} />
                                </button>
                                <a href={doc.file_url} target="_blank" rel="noreferrer" className="bg-white p-2 rounded-full text-gray-900 hover:scale-110 transition-transform shadow-lg" title="Download">
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
                  <button onClick={() => onAction(user.id, 'reject')} className="adm-btn adm-btn-warning bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-200 shadow-none">
                    Reject Application
                  </button>
                  <button onClick={() => onAction(user.id, 'approve')} className="adm-btn adm-btn-success shadow-md shadow-green-600/20">
                    <CheckCircle size={16}/> Approve Account
                  </button>
                </>
              )}
              {user.status === 'approved' && (
                <button onClick={() => onAction(user.id, 'suspend')} className="adm-btn adm-btn-warning shadow-none">
                  Suspend Account
                </button>
              )}
              {(user.status === 'suspended' || user.status === 'rejected') && (
                <button onClick={() => onAction(user.id, 'reactivate')} className="adm-btn adm-btn-primary shadow-none">
                  Reactivate Account
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex gap-4">
            <a href={previewDoc.file_url} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full">
              <FileDown size={24} />
            </a>
            <button onClick={closePreview} className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full">
              <X size={24} />
            </button>
          </div>
          <h3 className="absolute top-4 left-4 text-white font-bold capitalize text-lg bg-black/50 px-4 py-1 rounded-full">
            {previewDoc.document_type.replace(/_/g, ' ')}
          </h3>
          
          <div className="w-full max-w-5xl h-full max-h-[85vh] flex items-center justify-center">
            {previewDoc.file_url.toLowerCase().endsWith('.pdf') ? (
              <iframe src={previewDoc.file_url} className="w-full h-full rounded-xl bg-white" title="PDF Preview" />
            ) : (
              <img src={previewDoc.file_url} alt="Document Preview" className="max-w-full max-h-full object-contain rounded-xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailModal;
