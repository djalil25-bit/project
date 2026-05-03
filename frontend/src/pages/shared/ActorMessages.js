import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { MessageSquare, RefreshCw, Send, ArrowLeft, Clock, Inbox, ShieldCheck } from 'lucide-react';
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
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  useEffect(() => {
    if (selectedThread) {
      scrollToBottom();
    }
  }, [selectedThread?.messages, selectedThread?.id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboards/actor-messages/');
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load messages');
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
          is_reply_allowed: msg.is_reply_allowed,
          has_unread: false
        });
      }
      const thread = threadsMap.get(threadId);
      thread.messages.push(msg);
      thread.updated_at = msg.created_at;
      if (msg.is_reply_allowed) thread.is_reply_allowed = true;
      if (msg.status === 'SENT' && msg.sender !== user?.id) thread.has_unread = true;
    });

    return Array.from(threadsMap.values()).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  };

  const handleSendReply = async () => {
    if (!replyBody.trim() || !selectedThread) return;
    
    try {
      setSending(true);
      const res = await api.post('/dashboards/actor-messages/', {
        parent_id: selectedThread.id,
        body: replyBody
      });
      setMessages([...messages, res.data]);
      setReplyBody('');
      showToast('success', 'Reply sent successfully');
      
      // Update selected thread immediately to reflect new message and trigger scroll
      setSelectedThread(prev => ({
        ...prev,
        messages: [...prev.messages, res.data]
      }));
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.error || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const threads = getThreads();

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="text-primary" />
          {t('nav_messages') || 'Message Center'}
        </h1>
        <button
          onClick={fetchMessages}
          className="p-2 rounded-lg bg-white shadow-sm border border-gray-100 text-gray-600 hover:text-primary transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-1 overflow-hidden">
        {/* Left Sidebar - Thread List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-gray-50/30 ${selectedThread ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Inbox size={16} />
              Conversations
            </span>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{threads.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : threads.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                <MessageSquare size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No messages yet.</p>
              </div>
            ) : (
              threads.map(thread => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-all flex gap-3
                    ${selectedThread?.id === thread.id 
                      ? 'bg-primary/5 border-l-4 border-l-primary' 
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                      A
                    </div>
                    {thread.has_unread && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-gray-900 truncate pr-2 text-sm">AgriGov Admin</span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(thread.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="font-medium text-gray-700 text-xs truncate mb-0.5">{thread.subject}</div>
                    <div className={`text-xs truncate ${thread.has_unread ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                      {thread.messages[thread.messages.length - 1].body}
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
                <MessageSquare size={40} className="text-gray-300" />
              </div>
              <p className="font-medium text-gray-500">Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 shrink-0 shadow-sm z-10">
                <button
                  className="md:hidden p-2 text-gray-500 hover:text-gray-800 bg-gray-50 rounded-full transition-colors"
                  onClick={() => { setSelectedThread(null); navigate(location.pathname); }}
                >
                  <ArrowLeft size={18} />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                  <ShieldCheck size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900 truncate">AgriGov Admin</h2>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Online
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedThread.subject}
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/30 custom-scrollbar">
                {selectedThread.messages.map((msg, index) => {
                  const isMine = msg.sender === user?.id;
                  const showTime = index === 0 || new Date(msg.created_at) - new Date(selectedThread.messages[index-1].created_at) > 3600000;
                  
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {showTime && (
                        <div className="w-full flex justify-center my-3">
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            {new Date(msg.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isMine && (
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold shrink-0 mb-1">
                            A
                          </div>
                        )}
                        <div
                          className={`rounded-2xl p-3.5 text-[14px] shadow-sm leading-relaxed
                            ${isMine 
                              ? 'bg-primary text-white rounded-br-sm' 
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                            }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                          <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-green-100' : 'text-gray-400'}`}>
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
              <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                {selectedThread.is_reply_allowed ? (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none custom-scrollbar"
                        disabled={sending}
                        rows={1}
                        style={{ minHeight: '46px', maxHeight: '120px' }}
                      />
                    </div>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyBody.trim() || sending}
                      className="w-12 h-[46px] shrink-0 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:bg-gray-300 transition-all shadow-sm"
                      title="Send message"
                    >
                      {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
                    </button>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-100 text-orange-700 p-3 rounded-xl text-center text-sm font-medium flex items-center justify-center gap-2">
                    <Clock size={16} />
                    This is a read-only announcement from the Admin.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActorMessages;
