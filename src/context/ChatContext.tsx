import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useApp } from './AppContext';
import { ChatMessage, ChatChannelInfo } from '../types/chat';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { UserAccount } from '../types';

interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleChat: () => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  activeChannelId: string;
  setActiveChannelId: (channelId: string) => void;
  activeDirectUser: UserAccount | null;
  setActiveDirectUser: (user: UserAccount | null) => void;
  messages: ChatMessage[];
  currentChannelMessages: ChatMessage[];
  unreadCount: number;
  sendMessage: (text: string) => Promise<boolean>;
  openDirectChatWithUser: (user: UserAccount) => void;
  openChannel: (channelId: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Initial starter company messages
const INITIAL_SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-seed-1',
    channelId: 'general',
    senderId: 'u-admin',
    senderName: 'محمد المدير العام',
    senderRole: 'system_admin',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'السلام عليكم ورحمة الله وبركاته، مرحباً بجميع مدراء وموظفي فروع نورسين. تم تفعيل نظام الدردشة والتواصل الداخلي المباشر.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'msg-seed-2',
    channelId: 'general',
    senderId: 'u-hr',
    senderName: 'سارة مسؤولة الموارد البشرية',
    senderRole: 'hr_officer',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    text: 'أهلاً بكم جميعاً. يمكنكم الآن التنسيق السريع بخصوص اعتماد موظفي العمالة العارضة وطلبات النقل مباشرة عبر الدردشة.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'msg-seed-3',
    channelId: 'logistics',
    senderId: 'u-driver',
    senderName: 'خالد مسؤول الحركة والنقل',
    senderRole: 'logistics_transport_officer',
    text: 'تحية طيبة لكافة الفروع، شحنات اليوم جاهزة للانطلاق. يرجى من الفروع المستلمة تأكيد وصول الطرود ومطابقتها على بوليصة النقل فوراً.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    timestamp: Date.now() - 1800000,
  },
];

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [activeDirectUser, setActiveDirectUser] = useState<UserAccount | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const cached = localStorage.getItem('norseen_chat_messages');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // fallback
    }
    return INITIAL_SEED_MESSAGES;
  });
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(() => Date.now());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const prevMsgCountRef = useRef<number>(messages.length);

  // Play pleasant subtle chime using Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Ignore audio context errors if blocked by browser policy
    }
  };

  // Subscribe to Firestore chatMessages collection in real-time
  useEffect(() => {
    try {
      const messagesCol = collection(db, 'chatMessages');
      const unsubscribe = onSnapshot(
        messagesCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteMessages: ChatMessage[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as ChatMessage;
              remoteMessages.push({
                ...data,
                id: docSnap.id,
              });
            });

            // Merge with seed messages if remote has few
            const allMsgs = [...INITIAL_SEED_MESSAGES];
            remoteMessages.forEach((rm) => {
              const idx = allMsgs.findIndex((m) => m.id === rm.id);
              if (idx >= 0) {
                allMsgs[idx] = rm;
              } else {
                allMsgs.push(rm);
              }
            });

            allMsgs.sort((a, b) => a.timestamp - b.timestamp);

            // Play notification if a new message arrived from another user
            if (allMsgs.length > prevMsgCountRef.current) {
              const last = allMsgs[allMsgs.length - 1];
              if (last && currentUser && last.senderId !== currentUser.id) {
                playChime();
              }
            }
            prevMsgCountRef.current = allMsgs.length;

            setMessages(allMsgs);
            try {
              localStorage.setItem('norseen_chat_messages', JSON.stringify(allMsgs));
            } catch {
              // ignore storage quota
            }
          }
        },
        (err) => {
          console.warn('Chat Firestore sync warning:', err);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not initialize chat listener:', err);
    }
  }, [currentUser]);

  // When opening chat, update read timestamp
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setLastReadTimestamp(Date.now());
    }
  }, [isOpen, isMinimized, activeChannelId]);

  // Toggle chat drawer
  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setIsMinimized(false);
      setLastReadTimestamp(Date.now());
    }
  };

  // Helper for DM channel ID creation
  const getDmChannelId = (uid1: string, uid2: string) => {
    const sorted = [uid1, uid2].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
  };

  // Open Direct Chat with specific user
  const openDirectChatWithUser = (targetUser: UserAccount) => {
    if (!currentUser) return;
    setActiveDirectUser(targetUser);
    const dmId = getDmChannelId(currentUser.id, targetUser.id);
    setActiveChannelId(dmId);
    setIsOpen(true);
    setIsMinimized(false);
  };

  // Open specific channel
  const openChannel = (channelId: string) => {
    setActiveDirectUser(null);
    setActiveChannelId(channelId);
    setIsOpen(true);
    setIsMinimized(false);
  };

  // Send message
  const sendMessage = async (text: string): Promise<boolean> => {
    if (!currentUser || !text.trim()) return false;

    const trimmed = text.trim();
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const newMsg: ChatMessage = {
      id: msgId,
      channelId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.fullNameAr,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatarUrl,
      senderBranchId: currentUser.assignedBranchIds?.[0],
      text: trimmed,
      createdAt: now.toISOString(),
      timestamp: Date.now(),
    };

    // 1. Optimistic Local Update
    setMessages((prev) => {
      const updated = [...prev, newMsg];
      prevMsgCountRef.current = updated.length;
      try {
        localStorage.setItem('norseen_chat_messages', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // 2. Persist to Firestore
    try {
      await setDoc(doc(db, 'chatMessages', msgId), newMsg);
    } catch (err) {
      console.warn('Could not sync chat message to Firestore (cached locally):', err);
    }

    return true;
  };

  // Calculate unread count for current user
  const unreadCount = messages.filter((m) => {
    if (!currentUser) return false;
    if (m.senderId === currentUser.id) return false;
    // Check if timestamp is greater than lastReadTimestamp
    return m.timestamp > lastReadTimestamp;
  }).length;

  // Filter messages for active channel
  const currentChannelMessages = messages.filter((m) => m.channelId === activeChannelId);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleChat,
        isMinimized,
        setIsMinimized,
        activeChannelId,
        setActiveChannelId,
        activeDirectUser,
        setActiveDirectUser,
        messages,
        currentChannelMessages,
        unreadCount,
        sendMessage,
        openDirectChatWithUser,
        openChannel,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
