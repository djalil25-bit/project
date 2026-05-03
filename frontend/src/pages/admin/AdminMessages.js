import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import { MessageSquare, ChevronRight, Send, Clock, Mail, Bell, Smartphone, Search, Check, FileText, Plus, X, Inbox, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';

const AdminMessages = () => {
  const location = useLocation();
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
  
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [sending, setSending] = useState(false);
  const [isReplyAllowed, setIsReplyAllowed] = useState(false);
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

  // Search recipients as user types
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

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await adminApi.get('/messages/history/');
      setHistory(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await adminApi.get('/messages/templates/');
      setTemplates(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch { setTemplates([]); }
  }, []);

  // Fetch inbox
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

    // Sort messages within thread chronologically
    grouped.forEach(g => {
       g.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    setInboxGrouped(grouped);
  }, [inbox]);

  useEffect(() => {
    if (tab === 'history') fetchHistory();
    if (tab === 'templates') fetchTemplates();
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
      setSubject(''); setBody(''); setRecipient(''); setRecipientId(null); setIsReplyAllowed(false);
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
        is_reply_allowed: isReplyAllowed
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

  const applyTemplate = (tpl) => { setSubject(tpl.subject); setBody(tpl.body); setTab('compose'); };

  const channelIcon = c => {
    const lc = c?.toLowerCase();
    return lc==='email'?<Mail size={14}/>:lc==='sms'?<Smartphone size={14}/>:<Bell size={14}/>;
  };

  return (
    <div className="min-h-screen p-6 space-y-6 anim-fade-up admin-mode">
      <div className="adm-breadcrumb"><Link to="/admin-dashboard">Dashboard</Link><ChevronRight size={12}/><span>Messages</span></div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center"><MessageSquare className="text-indigo-600" size={24}/></div>
          <div><h1 className="text-xl font-extrabold text-gray-900">Messaging Center</h1><p className="text-gray-500 text-sm">Send messages to users via in-app, email, or SMS.</p></div>
        </div>
      </div>

      <div className="adm-tab-bar w-fit">
        <button className={`adm-tab ${tab==='compose'?'active':''}`} onClick={()=>setTab('compose')}><Send size={13}/> Compose</button>
        <button className={`adm-tab ${tab==='inbox'?'active':''}`} onClick={()=>setTab('inbox')}><Mail size={13}/> Inbox</button>
        <button className={`adm-tab ${tab==='history'?'active':''}`} onClick={()=>setTab('history')}><Clock size={13}/> History</button>
        <button className={`adm-tab ${tab==='templates'?'active':''}`} onClick={()=>setTab('templates')}><FileText size={13}/> Templates</button>
      </div>

      {/* Toast */}
      {toast && <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}><Check size={16}/> {toast.msg}</div>}

      {/* Compose */}
      {tab==='compose' && (
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={bulkMode} onChange={e=>setBulkMode(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/> <span className="text-sm font-medium text-gray-700">Bulk Messaging</span></label>
          </div>

          {bulkMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="adm-label">Target Role</label><select className="adm-input" value={bulkRole} onChange={e=>setBulkRole(e.target.value)}><option value="all">All Users</option><option value="farmer">All Farmers</option><option value="buyer">All Buyers</option><option value="transporter">All Transporters</option></select></div>
            </div>
          ) : (
            <div className="relative">
              <label className="adm-label">Recipient</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input className="adm-input pl-9" placeholder="Search by name or email..." value={recipient}
                  onChange={e=>{setRecipient(e.target.value); setRecipientId(null);}}/>
              </div>
              {recipientResults.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto">
                  {recipientResults.map(u => (
                    <div key={u.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      onClick={() => selectRecipient(u)}>
                      <div><div className="text-sm font-semibold text-gray-800">{u.full_name}</div><div className="text-xs text-gray-400">{u.email}</div></div>
                      <span className="text-xs text-gray-400">{u.role}</span>
                    </div>
                  ))}
                </div>
              )}
              {recipientId && <div className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check size={12}/> Recipient selected: ID #{recipientId}</div>}
            </div>
          )}

          <div><label className="adm-label">Channel</label>
            <div className="flex gap-2">
              {['IN_APP','EMAIL','SMS'].map(c=>(
                <button key={c} className={`adm-btn ${channel===c?'adm-btn-primary':'adm-btn-ghost'} text-xs`} onClick={()=>setChannel(c)}>{channelIcon(c)} {c.replace('_', '-')}</button>
              ))}
            </div>
          </div>

          <div><label className="adm-label">Subject</label><input className="adm-input" placeholder="Message subject..." value={subject} onChange={e=>setSubject(e.target.value)}/></div>
          <div><label className="adm-label">Message Body</label><textarea className="adm-input" rows={6} placeholder="Type your message..." value={body} onChange={e=>setBody(e.target.value)} style={{resize:'vertical'}}/></div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={schedule} onChange={e=>setSchedule(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/> <span className="text-sm text-gray-600">Schedule for later</span></label>
            {schedule && <input type="datetime-local" className="adm-input w-auto" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)}/>}
            
            <label className="flex items-center gap-2 cursor-pointer ml-4"><input type="checkbox" checked={isReplyAllowed} onChange={e=>setIsReplyAllowed(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/> <span className="text-sm text-gray-600">Allow Replies</span></label>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="adm-btn adm-btn-primary px-6 py-2.5" onClick={handleSend} disabled={!subject||!body||sending}><Send size={15}/> {sending ? 'Sending...' : schedule ? 'Schedule' : 'Send Now'}</button>
            <button className="adm-btn adm-btn-ghost" onClick={()=>{setSubject('');setBody('');setRecipient('');setRecipientId(null);}}>Clear</button>
          </div>
        </div>
      )}

      {/* History */}
      {tab==='history' && (
        <div className="glass-card overflow-hidden">
          {historyLoading ? <div className="py-12 text-center text-gray-400">Loading message history...</div> :
           history.length === 0 ? <div className="py-12 text-center"><MessageSquare size={32} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-400">No messages sent yet.</p></div> : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead><tr><th>To</th><th>Channel</th><th>Subject</th><th>Sent</th><th>Status</th></tr></thead>
              <tbody>{history.map(m=>(
                <tr key={m.id}>
                  <td><div className="font-medium text-gray-800 text-sm">{m.recipient_name || m.recipient?.full_name || 'N/A'}</div><div className="text-xs text-gray-400">{m.recipient_email || m.recipient?.email || ''}</div></td>
                  <td><span className="flex items-center gap-1 text-xs text-gray-600">{channelIcon(m.channel)} {m.channel}</span></td>
                  <td className="text-sm text-gray-700">{m.subject}</td>
                  <td className="text-xs text-gray-500">{m.sent_at ? new Date(m.sent_at).toLocaleDateString() : new Date(m.created_at).toLocaleDateString()}</td>
                  <td><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.status==='READ'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{m.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Inbox (Two-Column Chat UI) */}
      {tab==='inbox' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden" style={{ height: 'calc(100vh - 240px)', minHeight: '600px' }}>
          
          {/* Left Sidebar - Actor List */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-gray-50/30 ${selectedThread ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Inbox size={16} />
                User Inboxes
              </span>
              <div className="flex gap-2 items-center">
                <select className="text-xs border-gray-200 rounded-md bg-gray-50" value={inboxRole} onChange={e=>setInboxRole(e.target.value)}>
                  <option value="all">All</option>
                  <option value="farmer">Farmers</option>
                  <option value="buyer">Buyers</option>
                  <option value="transporter">Transporters</option>
                </select>
                <button onClick={fetchInbox} className="text-gray-500 hover:text-indigo-600 p-1"><RefreshCw size={14} className={inboxLoading ? 'animate-spin' : ''}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {inboxLoading ? (
                <div className="p-8 text-center text-gray-400">Loading inbox...</div>
              ) : inboxGrouped.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                  <Mail size={32} className="mb-3 opacity-30" />
                  <p className="text-sm">No incoming messages.</p>
                </div>
              ) : (
                inboxGrouped.map(group => (
                  <div
                    key={group.email + group.name}
                    onClick={() => setSelectedThread(group)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all flex gap-3
                      ${selectedThread?.sender?.id === group.sender?.id 
                        ? 'bg-indigo-50 border-l-4 border-l-indigo-600' 
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-700 font-bold uppercase">
                        {group.name?.charAt(0) || 'U'}
                      </div>
                      {group.has_unread && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold text-gray-900 truncate pr-2 text-sm">{group.name}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(group.latest).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide
                          ${group.role === 'farmer' ? 'bg-green-100 text-green-700' : group.role === 'buyer' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {group.role}
                        </span>
                        <span className="font-medium text-gray-700 text-xs truncate">{group.messages[group.messages.length - 1].subject}</span>
                      </div>
                      <div className={`text-xs truncate ${group.has_unread ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                        {group.messages[group.messages.length - 1].body}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Content - Chat Window */}
          <div className={`flex-1 flex flex-col bg-white ${!selectedThread ? 'hidden md:flex' : 'flex'}`}>
            {!selectedThread ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Mail size={40} className="text-gray-300" />
                </div>
                <p className="font-medium text-gray-500">Select a user to view the conversation</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 shrink-0 shadow-sm z-10">
                  <button
                    className="md:hidden p-2 text-gray-500 hover:text-gray-800 bg-gray-50 rounded-full transition-colors"
                    onClick={() => setSelectedThread(null)}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold uppercase shrink-0">
                    {selectedThread.name?.charAt(0) || 'U'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-gray-900 truncate">{selectedThread.name}</h2>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate uppercase tracking-wide">
                      {selectedThread.role} • {selectedThread.email}
                    </p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/30 custom-scrollbar">
                  {selectedThread.messages.map((msg, index) => {
                    const isAdmin = msg.sender === 'admin';
                    const showTime = index === 0 || new Date(msg.created_at) - new Date(selectedThread.messages[index-1].created_at) > 3600000;
                    
                    return (
                      <div key={msg.id || index} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        {showTime && (
                          <div className="w-full flex justify-center my-3">
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                              {new Date(msg.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isAdmin && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase shrink-0 mb-1">
                              {selectedThread.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div
                            className={`rounded-2xl p-3.5 text-[14px] shadow-sm leading-relaxed
                              ${isAdmin 
                                ? 'bg-indigo-600 text-white rounded-br-sm' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                              }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.body}</p>
                            <div className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-indigo-100' : 'text-gray-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between px-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isReplyAllowed} onChange={e=>setIsReplyAllowed(e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/> 
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Allow user to reply back</span>
                    </label>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message to user..."
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none custom-scrollbar"
                        disabled={sending}
                        rows={1}
                        style={{ minHeight: '46px', maxHeight: '120px' }}
                      />
                    </div>
                    <button
                      onClick={handleSendInboxReply}
                      disabled={!replyBody.trim() || sending}
                      className="w-12 h-[46px] shrink-0 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-300 transition-all shadow-sm"
                      title="Send message"
                    >
                      {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Templates */}
      {tab==='templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 ? (
            <div className="glass-card p-12 text-center col-span-full"><FileText size={32} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-400">No templates available yet.</p></div>
          ) : templates.map(tpl=>(
            <div key={tpl.id} className="glass-card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={()=>applyTemplate(tpl)}>
              <div className="flex items-center gap-2 mb-2"><FileText size={16} className="text-blue-600"/><h4 className="font-bold text-gray-800 text-sm">{tpl.name}</h4></div>
              <p className="text-xs text-gray-500 mb-3">{tpl.subject}</p>
              <p className="text-xs text-gray-400 line-clamp-3">{tpl.body}</p>
              <button className="adm-btn adm-btn-ghost text-xs mt-3 w-full justify-center"><Send size={12}/> Use Template</button>
            </div>
          ))}
          <div className="glass-card p-5 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 cursor-pointer transition-colors">
            <Plus size={24} className="mb-2"/><span className="text-sm font-semibold">Create Custom Template</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
