export interface ChatMessage {
  id: string;
  channelId: string; // 'general' | 'logistics' | 'branch_<branchId>' | 'dm_<uid1>_<uid2>'
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  senderBranchId?: string;
  text: string;
  createdAt: string; // ISO string
  timestamp: number; // for chronological sorting
  readBy?: string[]; // array of userIds who read the message
}

export interface ChatChannelInfo {
  id: string;
  name: string;
  type: 'general' | 'logistics' | 'branch' | 'direct';
  description?: string;
  branchId?: string;
  unreadCount?: number;
}
