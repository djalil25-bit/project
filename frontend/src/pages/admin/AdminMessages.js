import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import { MessageSquare, ChevronRight, Send, Clock, Mail, Bell, Smartphone, Search, Check, FileText, Plus, X, Inbox, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';

const AdminMessages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('compose');
  const [inbox, setInbox] = useState([]);
  const [inboxGrouped, setInboxGrouped] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxRole, setInboxRole] = useState('all');
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  
  const [channel, setChannel] = useState('IN_APP');
  const [recipient, setRecipient] = useState('');
  const [recipientId, setRecipientId] = useState(null);
  const [recipientResults, setRecipientResults] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [schedule, setSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkRole, setBulkRole] = useState('all');
  const [isReplyAllowed, setIsReplyAllowed] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const prefill = location.state?.prefillRecipient;
    if (prefill) {
      setRecipient(prefill.full_name);
      setRecipientId(prefill.id);
    }
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'inbox') setTab('inbox');
  }, [location.search, location.state]);

  useEffect(() => {
    if (tab === 'inbox' && selectedThread) {
      scrollToBottom();
    }
  }, [selectedThread?.messages, selectedThread?.sender, tab]);

  useEffect(() => {
    if (bulkMode || recipient.length < 2) { setRecipientResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await adminApi.get('/messages/recipients/', { params: { q: recipient } });
        setRecipientResults(res.data || []);
      } catch { setRecipientResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [recipient, bulkMode]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await adminApi.get('/messages/history/');
      setHistory(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await adminApi.get('/messages/templates/');
      setTemplates(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch { setTemplates([]); }
  }, []);

  const fetchInbox = useCallback(async () => {
    setInboxLoading(true);
    try {
      const res = await adminApi.get('/messages/inbox/', { params: { role: inboxRole !== 'all' ? inboxRole : undefined } });
      const rawInbox = Array.isArray(res.data) ? res.data : res.data.results || [];
      setInbox(rawInbox);
    } catch { setInbox([]); }
    finally { setInboxLoading(false); }
  }, [inboxRole]);

  useEffect(() => {
    const grouped = Object.values(inbox.reduce((acc, m) => {
      const sId = m.sender?.id || m.sender_email || 'unknown';
      if (!acc[sId]) { 
        acc[sId] = { 
          sender: m.sender, 
          name: m.sender_name || m.sender?.full_name || 'N/A', 
          email: m.sender_email || m.sender?.email || '', 
          role: m.sender?.role || 'N/A', 
          messages: [], 
          latest: m.created_at,
          has_unread: false
        }; 
      }
      acc[sId].messages.push(m);
      if (new Date(m.created_at) > new Date(acc[sId].latest)) acc[sId].latest = m.created_at;
      if (m.status === 'SENT') acc[sId].has_unread = true;
      return acc;
    }, {})).sort((a,b) => new Date(b.latest) - new Date(a.latest));

    grouped.forEach(g => {
       g.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    setInboxGrouped(grouped);
  }, [inbox]);

  useEffect(() => {
    if (tab === 'history') fetchHistory();
    fetchTemplates(); // Always fetch templates to have them ready for compose
    if (tab === 'inbox') fetchInbox();
  }, [tab, fetchHistory, fetchTemplates, fetchInbox]);

  const selectRecipient = (user) => {
    setRecipient(user.full_name);
    setRecipientId(user.id);
    setRecipientResults([]);
  };

  const handleSend = async () => {
    if (!subject || !body) return;
    if (!bulkMode && !recipientId) { setToast({ msg: 'Please select a recipient', type: 'error' }); setTimeout(() => setToast(null), 3000); return; }

    setSending(true);
    try {
      await adminApi.post('/messages/send/', {
        recipient_id: bulkMode ? 'bulk' : recipientId,
        target_role: bulkMode ? bulkRole : null,
        subject,
        body,
        channel: channel.toUpperCase(),
        is_reply_allowed: isReplyAllowed,
        ...(schedule && { scheduled_for: scheduleDate }),
      });
      setToast({ msg: 'Message sent successfully!', type: 'success' });
      setSubject(''); setBody(''); setRecipient(''); setRecipientId(null);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ msg: err.response?.data?.error || 'Failed to send message', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally { setSending(false); }
  };

  const handleSendInboxReply = async () => {
    if (!replyBody.trim() || !selectedThread) return;
    
    const recipientId = selectedThread.sender?.id;
    if (!recipientId) {
      setToast({ msg: 'Cannot reply to unknown sender', type: 'error' });
      return;
    }

    setSending(true);
    try {
      const res = await adminApi.post('/messages/send/', {
        recipient_id: recipientId,
        subject: `Re: ${selectedThread.messages[0]?.subject || 'Message'}`,
        body: replyBody,
        channel: 'IN_APP',
      });
      
      const newMsg = { 
        ...res.data, 
        id: res.data.id || Date.now(),
        sender: 'admin', 
        created_at: new Date().toISOString(),
        body: replyBody
      };
      
      const updatedThread = {
        ...selectedThread,
        messages: [...selectedThread.messages, newMsg],
        latest: newMsg.created_at
      };
      
      setSelectedThread(updatedThread);
      setInboxGrouped(prev => prev.map(g => g.sender?.id === recipientId ? updatedThread : g));
      setReplyBody('');
    } catch (err) {
      setToast({ msg: err.response?.data?.error || 'Failed to send reply', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendInboxReply();
    }
  };

  const channelIcon = c => {
    const lc = c?.toLowerCase();
    return lc==='email'?<Mail size={14}/>:lc==='sms'?<Smartphone size={14}/>:<Bell size={14}/>;
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 animate-fade-in relative z-0 min-h-screen">
      
      {/* ── BREADCRUMBS ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#064e3b] mb-6 bg-[#064e3b]/10 px-3 py-1 rounded-full w-fit border border-[#064e3b]/20 shadow-sm">
        <button onClick={() => navigate('/admin-dashboard')} className="hover:text-emerald-700 transition-colors uppercase font-black flex items-center gap-1.5">
          <MessageSquare size={10} /> Admin Hub
        </button>
        <ChevronRight size={10} className="text-[#064e3b]/40" />
        <span className="text-[#064e3b] flex items-center gap-1.5 font-black uppercase">
          <Mail size={11} /> Communications
        </span>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className={`p-2 bg-white rounded-2xl shadow-sm border border-slate-100 text-[#064e3b]`}>
              <MessageSquare size={24} />
            </div>
            Messaging <span className="text-[#064e3b]">Center</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm max-w-xl">
            Broadcasting and internal communication matrix for agricultural network coordination.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner w-full sm:w-fit mb-10">
        <button className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tab==='compose'?'bg-white text-[#064e3b] shadow-md border border-emerald-100':'text-slate-400 hover:text-slate-600'}`} onClick={()=>setTab('compose')}><Send size={14}/> Dispatch</button>
        <button className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tab==='history'?'bg-white text-[#064e3b] shadow-md border border-emerald-100':'text-slate-400 hover:text-slate-600'}`} onClick={()=>setTab('history')}><Clock size={14}/> Logs</button>
      </div>

      {/* Toast */}
      {toast && <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-[10px] font-black tracking-widest uppercase animate-slide-in ${toast.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-[#022c22] text-emerald-400 border border-emerald-900/50'}`}><ShieldCheck size={16}/> {toast.msg}</div>}

      {/* Compose */}
      {tab==='compose' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 lg:p-10 max-w-4xl space-y-10 animate-fade-in">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#064e3b] flex items-center justify-center shadow-inner">
               <Send size={22} />
             </div>
             <div>
               <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-none">Compose Transmission</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Select targets and define protocol</p>
             </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" checked={bulkMode} onChange={e=>setBulkMode(e.target.checked)} className="peer sr-only"/>
                  <div className="w-10 h-6 bg-slate-200 rounded-full transition-colors peer-checked:bg-[#064e3b] shadow-inner"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                </div>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest group-hover:text-[#064e3b] transition-colors">Broadcast Mode</span>
              </label>
            </div>

            {bulkMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Sector Allocation</label>
                  <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" value={bulkRole} onChange={e=>setBulkRole(e.target.value)}><option value="all">Global Matrix</option><option value="farmer">Agricultural Sector</option><option value="buyer">Commercial Sector</option><option value="transporter">Logistics Sector</option></select>
                </div>
              </div>
            ) : (
              <div className="relative animate-fade-in">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Direct Recipient</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" placeholder="Identify actor by name or ID..." value={recipient}
                    onChange={e=>{setRecipient(e.target.value); setRecipientId(null);}}/>
                </div>
                {recipientResults.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-2 shadow-2xl max-h-60 overflow-y-auto">
                    {recipientResults.map(u => (
                      <div key={u.id} className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-50 transition-colors"
                        onClick={() => selectRecipient(u)}>
                        <div><div className="text-sm font-black text-slate-800">{u.full_name}</div><div className="text-[10px] font-bold text-slate-400">{u.email}</div></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{u.role}</span>
                      </div>
                    ))}
                  </div>
                )}
                {recipientId && <div className="text-[9px] font-black uppercase tracking-widest text-[#064e3b] mt-2 flex items-center gap-1"><ShieldCheck size={12}/> Recipient Locked: AG-U-{recipientId}</div>}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Transmission Protocol</label>
              <div className="flex flex-wrap gap-2">
                {['IN_APP','EMAIL','SMS'].map(c=>(
                  <button key={c} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${channel===c?'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm':'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`} onClick={()=>setChannel(c)}>{channelIcon(c)} {c.replace('_', '-')}</button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Load Template</label>
                   <select 
                     className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                     value={selectedTemplate}
                     onChange={(e) => {
                       const tId = e.target.value;
                       setSelectedTemplate(tId);
                       if (tId) {
                         const t = templates.find(temp => temp.id === parseInt(tId));
                         if (t) { setSubject(t.subject); setBody(t.body); }
                       }
                     }}
                   >
                     <option value="">Custom Message</option>
                     {templates.map(t => (
                       <option key={t.id} value={t.id}>{t.name}</option>
                     ))}
                   </select>
                 </div>
                 <div className="flex items-center gap-4 pt-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={isReplyAllowed} onChange={e=>setIsReplyAllowed(e.target.checked)} className="rounded border-slate-300 text-[#064e3b] focus:ring-emerald-500 w-4 h-4"/> 
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest group-hover:text-[#064e3b] transition-colors">Reply Protocol</span>
                    </label>
                 </div>
               </div>

               <div>
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Subject Header</label>
                 <input className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" placeholder="Enter transmission subject..." value={subject} onChange={e=>setSubject(e.target.value)}/>
               </div>
               <div>
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Message Payload</label>
                 <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" rows={6} placeholder="Define the transmission content..." value={body} onChange={e=>setBody(e.target.value)} style={{resize:'vertical'}}/>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={schedule} onChange={e=>setSchedule(e.target.checked)} className="rounded border-slate-300 text-[#064e3b] focus:ring-emerald-500 w-4 h-4"/> 
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest group-hover:text-[#064e3b] transition-colors">Deferred Execution</span>
              </label>
              {schedule && <input type="datetime-local" className="h-10 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm animate-fade-in" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)}/>}
            </div>

            <div className="flex gap-4 pt-4">
              <button className="flex-1 h-12 bg-[#064e3b] hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50" onClick={handleSend} disabled={!subject||!body||sending}><Send size={16}/> {sending ? '...' : schedule ? 'Commit Schedule' : 'Initialize Dispatch'}</button>
              <button className="px-8 h-12 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all" onClick={()=>{setSubject('');setBody('');setRecipient('');setRecipientId(null);}}>Purge</button>
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      {tab==='history' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-black text-[12px] uppercase tracking-widest text-slate-900 flex items-center gap-3">
              <Clock size={16} className="text-[#064e3b]"/> Transmission Logs
            </h3>
            <span className="text-[10px] font-black px-3 py-1 bg-white border border-slate-200 text-[#064e3b] rounded-xl shadow-inner uppercase tracking-widest">{history.length} Entries</span>
          </div>
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
               <div className="w-8 h-8 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing logs...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-24 text-center">
              <Clock size={40} className="text-slate-100 mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry is currently empty.</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-slate-50/80 border-b border-slate-100"><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient Matrix</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Protocol</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject Header</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Timestamp</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th></tr></thead>
              <tbody>{history.map(m=>(
                <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4"><div className="font-black text-slate-800 text-sm tracking-tight">{m.recipient_name || m.recipient?.full_name || 'N/A'}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{m.recipient_email || m.recipient?.email || ''}</div></td>
                  <td className="px-6 py-4"><span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#064e3b] bg-slate-100/50 border border-slate-200 px-2 py-1 rounded-lg w-fit">{channelIcon(m.channel)} {m.channel}</span></td>
                  <td className="px-6 py-4 text-[11px] font-bold text-slate-700 tracking-tight uppercase">{m.subject}</td>
                  <td className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">{m.sent_at ? new Date(m.sent_at).toLocaleDateString() : new Date(m.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border ${
                      m.status==='READ'?'bg-emerald-50 border-emerald-100 text-[#064e3b]':
                      m.status==='SENT'?'bg-emerald-50/50 border-emerald-100/50 text-emerald-600':
                      m.status==='FAILED'?'bg-rose-50 border-rose-100 text-rose-600':
                      'bg-slate-100 border-slate-200 text-slate-400'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Inbox (Two-Column Chat UI) */}
      {tab==='inbox' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex overflow-hidden animate-fade-in" style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
          
          <div className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50 ${selectedThread ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Inbox size={16} className="text-[#064e3b]" />
                Actor Threads
              </span>
              <div className="flex gap-2 items-center">
                <select className="h-8 px-2 text-[9px] font-black uppercase tracking-widest border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500" value={inboxRole} onChange={e=>setInboxRole(e.target.value)}>
                  <option value="all">All</option>
                  <option value="farmer">Farmers</option>
                  <option value="buyer">Buyers</option>
                  <option value="transporter">Logistics</option>
                </select>
                <button onClick={fetchInbox} className="text-slate-400 hover:text-[#064e3b] p-1 transition-colors"><RefreshCw size={14} className={inboxLoading ? 'animate-spin' : ''}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {inboxLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 opacity-40">
                  <div className="w-6 h-6 border-2 border-slate-100 border-t-emerald-600 rounded-full animate-spin" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Syncing Threads...</span>
                </div>
              ) : inboxGrouped.length === 0 ? (
                <div className="p-16 text-center opacity-30">
                  <Mail size={32} className="mx-auto mb-3" />
                  <p className="text-[9px] font-black uppercase tracking-widest">No Active Sessions</p>
                </div>
              ) : (
                inboxGrouped.map(group => (
                  <div
                    key={group.email + group.name}
                    onClick={() => setSelectedThread(group)}
                    className={`p-5 border-b border-slate-100 cursor-pointer transition-all flex gap-4 border-l-4
                      ${selectedThread?.sender?.id === group.sender?.id 
                        ? 'bg-white border-l-emerald-600 shadow-sm z-10' 
                        : 'bg-transparent border-l-transparent hover:bg-white'}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-black text-xl shadow-inner group-hover:bg-white transition-colors">
                        {group.name?.charAt(0) || 'U'}
                      </div>
                      {group.has_unread && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-black text-slate-900 truncate pr-2 text-sm tracking-tight">{group.name}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                          {new Date(group.latest).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border
                          ${group.role === 'farmer' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : group.role === 'buyer' ? 'bg-slate-50 text-slate-700 border-slate-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                          {group.role}
                        </span>
                        <span className="font-bold text-slate-700 text-[11px] truncate opacity-80">{group.messages[group.messages.length - 1].subject}</span>
                      </div>
                      <div className={`text-[11px] truncate ${group.has_unread ? 'font-black text-slate-900' : 'font-medium text-slate-500'}`}>
                        {group.messages[group.messages.length - 1].body}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`flex-1 flex flex-col bg-white ${!selectedThread ? 'hidden md:flex' : 'flex'}`}>
            {!selectedThread ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-200 bg-slate-50/50">
                <div className="w-24 h-24 bg-white border border-slate-100 rounded-full flex items-center justify-center mb-4 shadow-sm opacity-50">
                  <Mail size={40} />
                </div>
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-400">Communication Terminal</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Initialize thread to view mission parameters.</p>
              </div>
            ) : (
              <>
                <div className="p-5 bg-white border-b border-slate-100 flex items-center gap-4 shrink-0 shadow-sm z-10">
                  <button
                    className="md:hidden p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-xl transition-colors"
                    onClick={() => setSelectedThread(null)}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                    {selectedThread.name?.charAt(0) || 'U'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-slate-900 text-sm tracking-tight truncate">{selectedThread.name}</h2>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 animate-pulse">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#064e3b]">Secure Line</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 truncate uppercase tracking-widest mt-1">
                      {selectedThread.role} Registry • {selectedThread.email}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 custom-scrollbar">
                  {selectedThread.messages.map((msg, index) => {
                    const isAdmin = msg.sender === 'admin';
                    const showTime = index === 0 || new Date(msg.created_at) - new Date(selectedThread.messages[index-1].created_at) > 3600000;
                    
                    return (
                      <div key={msg.id || index} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        {showTime && (
                          <div className="w-full flex justify-center my-6">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-white border border-slate-100 px-4 py-1.5 rounded-full shadow-sm">
                              {new Date(msg.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex items-end gap-3 max-w-[85%] md:max-w-[70%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isAdmin && (
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-black uppercase shrink-0 mb-1 shadow-sm">
                              {selectedThread.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div
                            className={`p-5 text-sm shadow-lg font-medium leading-relaxed transition-all
                              ${isAdmin 
                                ? 'bg-[#064e3b] text-white rounded-3xl rounded-br-none shadow-emerald-900/10' 
                                : 'bg-white text-slate-800 border border-slate-200 rounded-3xl rounded-bl-none shadow-slate-200/50'
                              }`}
                          >
                            <div className="whitespace-pre-wrap">{msg.body}</div>
                            <div className={`text-[8px] font-black uppercase tracking-widest mt-3 flex items-center justify-end gap-1.5 ${isAdmin ? 'text-emerald-200/60' : 'text-slate-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isAdmin && <Check size={10} className={msg.status === 'READ' ? 'text-emerald-300' : 'text-emerald-200/40'} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-6 bg-white border-t border-slate-100 shrink-0 flex flex-col gap-4 shadow-2xl">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Draft administrative response..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pr-12 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all resize-none shadow-inner"
                        disabled={sending}
                        rows={1}
                        style={{ minHeight: '52px', maxHeight: '150px' }}
                      />
                    </div>
                    <button
                      onClick={handleSendInboxReply}
                      disabled={!replyBody.trim() || sending}
                      className="w-14 h-[52px] shrink-0 bg-[#064e3b] text-white rounded-2xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
                      title="Transmit Message"
                    >
                      {sending ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminMessages;
