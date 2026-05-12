import React, { useState, useEffect } from 'react';
import { useLang } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { 
  MessageSquare, 
  RefreshCw, 
  ArrowLeft, 
  Inbox, 
  ShieldCheck, 
  Calendar,
  ChevronRight,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const ActorMessages = () => {
  const { t } = useLang();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (!loading && location.search) {
      const params = new URLSearchParams(location.search);
      const msgId = params.get('message_id');
      if (msgId) {
        const thread = getThreads().find(t => t.messages.some(m => m.id === parseInt(msgId)));
        if (thread) setSelectedThread(thread);
      }
    }
  }, [loading, location.search, messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboards/actor-messages/');
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const getThreads = () => {
    const threadsMap = new Map();
    const sorted = [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    sorted.forEach(msg => {
      const threadId = msg.parent || msg.id;
      if (!threadsMap.has(threadId)) {
        threadsMap.set(threadId, {
          id: threadId,
          subject: msg.subject,
          messages: [],
          updated_at: msg.created_at,
          has_unread: false
        });
      }
      const thread = threadsMap.get(threadId);
      thread.messages.push(msg);
      thread.updated_at = msg.created_at;
      if (msg.status === 'SENT' && msg.sender !== user?.id) thread.has_unread = true;
    });

    return Array.from(threadsMap.values()).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  };

  const threads = getThreads();

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6 anim-fade-up">
      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
              <ShieldCheck size={24} />
            </div>
            Institutional Announcements
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-[52px]">Official notifications and administrative directives from AgriGov authorities.</p>
        </div>
        <button
          onClick={fetchMessages}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm w-fit"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Sync Inbox
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-1 overflow-hidden relative isolate">
        
        {/* ── Left Panel: Announcement Feed ──────────────── */}
        <div className={`w-full md:w-80 lg:w-[400px] border-r border-gray-100 flex flex-col bg-gray-50/20 ${selectedThread ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Inbox size={14} className="text-primary" />
                Active Directives
              </span>
              <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{threads.length}</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="adm-spinner w-8 h-8"></div>
                <span className="text-xs font-bold text-gray-400">Securing transmission...</span>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center text-gray-400 grayscale opacity-50">
                <MessageSquare size={48} className="mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">Clearance Status: No Active Notices</p>
              </div>
            ) : (
              threads.map(thread => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`p-5 border-b border-gray-100 cursor-pointer transition-all flex gap-4 group relative
                    ${selectedThread?.id === thread.id 
                      ? 'bg-white shadow-lg shadow-gray-100 z-10' 
                      : 'hover:bg-white/60'}`}
                >
                  {/* Active Indicator */}
                  {selectedThread?.id === thread.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                  )}

                  <div className="shrink-0 pt-1">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors
                      ${thread.has_unread ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-400'}`}>
                      <ShieldCheck size={20} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`text-xs font-black uppercase tracking-tight truncate pr-2 ${thread.has_unread ? 'text-primary' : 'text-gray-900'}`}>
                        AgriGov Admin
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 shrink-0">
                        {new Date(thread.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className={`text-sm font-extrabold truncate mb-1 ${thread.has_unread ? 'text-gray-900' : 'text-gray-600'}`}>
                      {thread.subject}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1 font-medium italic">
                      "{thread.messages[thread.messages.length - 1].body}"
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right Panel: Document Viewer ───────────────── */}
        <div className={`flex-1 flex flex-col bg-white ${!selectedThread ? 'hidden md:flex' : 'flex'} relative`}>
          {!selectedThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
              <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-inner">
                <Inbox size={56} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Select an Official Notice</h3>
              <p className="text-sm font-medium text-gray-400 mt-2 max-w-xs">
                Click on any directive from the sidebar to review full details and institutional requirements.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Directive Header */}
              <div className="p-6 bg-white border-b border-gray-100 flex items-center gap-5 shrink-0 z-10 shadow-sm">
                <button
                  className="md:hidden p-2 text-gray-500 hover:text-gray-800 bg-gray-50 rounded-xl transition-colors"
                  onClick={() => { setSelectedThread(null); navigate(location.pathname); }}
                >
                  <ArrowLeft size={20} />
                </button>
                
                <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-xl shadow-gray-200 shrink-0">
                  <ShieldCheck size={32} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight truncate">{selectedThread.subject}</h2>
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      Verified Authority
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Clock size={14} className="text-gray-400" /> 
                      Issued: {new Date(selectedThread.updated_at).toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Info size={14} className="text-gray-400" />
                      Ref: AG-AN-{selectedThread.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Announcement Body (Document Style) */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-gray-50/10 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8">
                  {selectedThread.messages.map((msg, index) => (
                    <div key={msg.id} className="relative">
                      {/* Vertical Timeline Line */}
                      {index > 0 && <div className="absolute -left-6 top-0 bottom-0 w-0.5 bg-gray-100"></div>}
                      
                      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm relative z-0">
                        {/* Stamp Effect */}
                        <div className="absolute top-6 right-6 opacity-5 pointer-events-none transform rotate-12">
                          <ShieldCheck size={120} />
                        </div>

                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                              <Calendar size={16} />
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Directive Component</div>
                              <div className="text-xs font-bold text-gray-700">{new Date(msg.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Phase {index + 1}</div>
                        </div>

                        <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed font-medium text-base whitespace-pre-wrap">
                          {msg.body}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                              <ShieldCheck size={14} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AgriGov Authentication Token</span>
                          </div>
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest font-mono">
                            SIGNATURE_VERIFIED
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActorMessages;
