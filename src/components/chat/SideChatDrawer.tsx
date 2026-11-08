import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareText,
  X,
  Send,
  Users,
  Building2,
  Truck,
  Sparkles,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  CheckCheck,
  Smile,
  Shield,
  Circle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useChat } from '../../context/ChatContext';
import { USER_ROLES } from '../../data/initialData';
import { UserAccount } from '../../types';

export const SideChatDrawer: React.FC = () => {
  const { currentUser, users, branches } = useApp();
  const {
    isOpen,
    setIsOpen,
    toggleChat,
    isMinimized,
    setIsMinimized,
    activeChannelId,
    setActiveChannelId,
    activeDirectUser,
    setActiveDirectUser,
    currentChannelMessages,
    unreadCount,
    sendMessage,
    openDirectChatWithUser,
    openChannel,
    soundEnabled,
    setSoundEnabled,
  } = useChat();

  const [inputText, setInputText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChannelMessages, isOpen, isMinimized, activeTab]);

  // Focus input when opening chat
  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized, activeTab, activeChannelId]);

  if (!currentUser) return null;

  // Handle message sending
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText;
    setInputText('');
    setIsSending(true);

    try {
      await sendMessage(textToSend);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Quick reply preset click
  const handleQuickPreset = (presetText: string) => {
    setInputText(presetText);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Find user branch info
  const userBranchId = currentUser.assignedBranchIds && currentUser.assignedBranchIds[0] !== '*' ? currentUser.assignedBranchIds[0] : undefined;
  const userBranch = branches.find((b) => b.id === userBranchId);
  const myBranchChannelId = userBranch ? `branch_${userBranch.id}` : 'branch_main';

  // Get current channel title
  const getChannelTitle = () => {
    if (activeDirectUser) {
      return `محادثة خاصة مع ${activeDirectUser.fullNameAr}`;
    }
    if (activeChannelId === 'general') {
      return 'القناة العامة (كافة الفروع)';
    }
    if (activeChannelId === 'logistics') {
      return 'تنسيق النقل واللوجستيات';
    }
    if (activeChannelId.startsWith('branch_')) {
      const bId = activeChannelId.replace('branch_', '');
      const b = branches.find((br) => br.id === bId);
      return b ? `فرع ${b.nameAr}` : 'قناة الفرع';
    }
    return 'غرفة المحادثة';
  };

  // Filter users for direct message selection
  const otherUsers = users.filter((u) => u.id !== currentUser.id);
  const filteredUsers = otherUsers.filter(
    (u) =>
      u.fullNameAr.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Quick reply presets
  const QUICK_REPLIES = [
    'السلام عليكم ورحمة الله',
    'تم استلام الشحنة والمطابقة بنجاح 👍',
    'جاري المتابعة فوراً ⏳',
    'يرجى مراجعة إشعار العجز ⚠️',
    'تم اعتماد الإجراء المطلوب ✅',
  ];

  return (
    <>
      {/* 1. Floating Side Launcher Button (Always visible on the screen side) */}
      {!isOpen && (
        <div className="fixed bottom-6 left-6 z-40 animate-in fade-in zoom-in duration-300">
          <button
            onClick={toggleChat}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-[0_10px_35px_rgba(6,182,212,0.4)] border border-cyan-300/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
            title="فتح الدردشة والتواصل الداخلي بين الموظفين"
          >
            <div className="relative">
              <MessageSquareText className="w-5 h-5 group-hover:rotate-6 transition" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black items-center justify-center border border-white animate-bounce shadow-md">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                <span>الدردشة المؤسسية</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="text-[10px] text-cyan-100 font-medium opacity-90">
                تواصل لحظي بين الفروع
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 2. Side Chat Drawer Panel (Slides out from side) */}
      {isOpen && (
        <div className="fixed inset-y-0 left-0 z-50 flex items-stretch">
          
          {/* Subtle backdrop overlay on mobile */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs lg:hidden -z-10"
          />

          <div
            className={`w-84 sm:w-96 bg-[#041922]/95 backdrop-blur-2xl border-r border-cyan-500/30 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)] flex flex-col justify-between transition-all duration-300 ${
              isMinimized ? 'h-16 self-end rounded-tr-3xl border-t border-cyan-500/40 overflow-hidden' : 'h-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-cyan-500/20 bg-slate-950/40 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                <div className="min-w-0 text-right">
                  <h3 className="text-xs font-black text-white truncate flex items-center gap-1.5">
                    <span>{getChannelTitle()}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-cyan-300/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>متصل لحظياً (Firestore Live)</span>
                  </div>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 text-cyan-300 hover:text-white rounded-lg hover:bg-cyan-950/60 transition cursor-pointer"
                  title={soundEnabled ? 'كتم صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </button>

                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 text-cyan-300 hover:text-white rounded-lg hover:bg-cyan-950/60 transition cursor-pointer"
                  title={isMinimized ? 'توسيع' : 'تصغير'}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-cyan-300 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition cursor-pointer"
                  title="إغلاق الدردشة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* When not minimized, display body */}
            {!isMinimized && (
              <>
                {/* Channel Selector Pills / Tabs */}
                <div className="p-2 border-b border-cyan-500/15 bg-slate-900/40 shrink-0">
                  <div className="grid grid-cols-4 gap-1 text-[11px] font-bold text-center">
                    <button
                      onClick={() => {
                        setActiveTab('chat');
                        openChannel('general');
                      }}
                      className={`py-1.5 px-1 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
                        activeTab === 'chat' && activeChannelId === 'general'
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>العام</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('chat');
                        openChannel('logistics');
                      }}
                      className={`py-1.5 px-1 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
                        activeTab === 'chat' && activeChannelId === 'logistics'
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 text-teal-400" />
                      <span>النقل</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('chat');
                        openChannel(myBranchChannelId);
                      }}
                      className={`py-1.5 px-1 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
                        activeTab === 'chat' && activeChannelId === myBranchChannelId
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate max-w-[65px]">{userBranch?.nameAr || 'فرعي'}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab(activeTab === 'users' ? 'chat' : 'users')}
                      className={`py-1.5 px-1 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
                        activeTab === 'users' || activeDirectUser
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>الزملاء</span>
                    </button>
                  </div>
                </div>

                {/* Sub-view: Users Directory for Direct Messages */}
                {activeTab === 'users' ? (
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="ابحث عن زميل لمحادثته..."
                        className="w-full pr-8 pl-3 py-1.5 bg-slate-900/80 border border-cyan-500/30 rounded-xl text-xs text-white placeholder:text-slate-500 outline-hidden focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1.5 text-right">
                      {filteredUsers.map((u) => {
                        const roleObj = USER_ROLES.find((r) => r.id === u.role);
                        const isCurDm = activeDirectUser?.id === u.id;
                        return (
                          <div
                            key={u.id}
                            onClick={() => {
                              openDirectChatWithUser(u);
                              setActiveTab('chat');
                            }}
                            className={`p-2.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                              isCurDm
                                ? 'bg-cyan-900/40 border-cyan-400 text-white'
                                : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/80 text-slate-200 hover:border-cyan-500/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.fullNameAr}
                                  className="w-8 h-8 rounded-full object-cover border border-cyan-400/40"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-800 text-cyan-300 font-bold flex items-center justify-center text-xs border border-cyan-500/30">
                                  {u.fullNameAr.charAt(0)}
                                </div>
                              )}
                              <div className="text-right">
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>{u.fullNameAr}</span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                </div>
                                <div className="text-[10px] text-cyan-300/70 font-medium">
                                  {roleObj?.nameAr || u.role}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-500/30 font-bold">
                              محادثة
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Main Chat Messages Stream */
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar text-right">
                    {currentChannelMessages.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        <MessageSquareText className="w-8 h-8 mx-auto mb-2 text-cyan-500/40" />
                        <p className="font-bold text-slate-300">لا توجد رسائل في هذه الغرفة بعد</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          كن أول من يبدأ المحادثة ويرسل تحية لزملائه!
                        </p>
                      </div>
                    ) : (
                      currentChannelMessages.map((msg) => {
                        const isMine = msg.senderId === currentUser.id;
                        const roleObj = USER_ROLES.find((r) => r.id === msg.senderRole);
                        const msgTime = new Date(msg.timestamp).toLocaleTimeString('ar-LY', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} gap-1`}
                          >
                            {/* Sender Info (shown only for others) */}
                            {!isMine && (
                              <div className="flex items-center gap-1.5 px-1">
                                {msg.senderAvatar ? (
                                  <img
                                    src={msg.senderAvatar}
                                    alt={msg.senderName}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-300 text-[9px] font-bold flex items-center justify-center">
                                    {msg.senderName.charAt(0)}
                                  </div>
                                )}
                                <span className="text-[11px] font-bold text-slate-200">
                                  {msg.senderName}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                                  {roleObj?.nameAr || msg.senderRole}
                                </span>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md break-words ${
                                isMine
                                  ? 'bg-gradient-to-r from-teal-700 to-cyan-700 text-white rounded-tl-xs border border-cyan-400/30'
                                  : 'bg-[#0a232f] text-slate-100 rounded-tr-xs border border-cyan-500/20'
                              }`}
                            >
                              <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                              <div
                                className={`flex items-center gap-1 text-[9px] mt-1 ${
                                  isMine ? 'text-cyan-200 justify-end' : 'text-slate-400 justify-start'
                                }`}
                              >
                                <span>{msgTime}</span>
                                {isMine && <CheckCheck className="w-3 h-3 text-cyan-300" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Quick Reply Presets Bar */}
                <div className="px-3 py-1.5 border-t border-cyan-500/15 bg-slate-950/30 overflow-x-auto custom-scrollbar flex items-center gap-1.5 shrink-0">
                  {QUICK_REPLIES.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickPreset(preset)}
                      className="px-2.5 py-1 rounded-lg text-[10px] bg-slate-900/80 hover:bg-cyan-950 text-cyan-200 hover:text-white border border-cyan-500/30 whitespace-nowrap transition cursor-pointer shrink-0"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Message Input Box */}
                <form
                  onSubmit={handleSend}
                  className="p-3 border-t border-cyan-500/20 bg-slate-950/60 flex items-center gap-2 shrink-0"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="اكتب رسالتك لزملائك... (Enter)"
                    className="flex-1 px-3.5 py-2.5 bg-slate-900/90 border border-cyan-500/30 rounded-xl text-xs text-white placeholder:text-slate-500 outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-right transition"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white flex items-center justify-center transition shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    title="إرسال الرسالة"
                  >
                    <Send className="w-4 h-4 -rotate-90 text-white" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
