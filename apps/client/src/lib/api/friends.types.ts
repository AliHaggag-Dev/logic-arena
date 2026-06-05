export type FriendPresenceStatus = 'online' | 'offline' | 'in-match';

export interface FriendUserRef {
  id: string;
  username: string;
  avatarUrl: string | null;
  rank: number;
}

export interface FriendEntry {
  id: string;
  username: string;
  avatarUrl: string | null;
  rank: number;
  status: FriendPresenceStatus;
  inMatchId: string | null;
  lastSeenAt: string | null;
  friendshipCreatedAt: string;
}

export interface FriendRequestEntry {
  id: string;
  sender: FriendUserRef;
  receiver: FriendUserRef;
  message: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface FriendRequestListResponse {
  items: FriendRequestEntry[];
  total: number;
}

export type FriendSuggestionReason = 'RANK_PROXIMITY' | 'RECENT_OPPONENT';

export interface FriendSuggestion {
  id: string;
  username: string;
  avatarUrl: string | null;
  rank: number;
  reason: FriendSuggestionReason;
  mutualFriends: number;
}

export interface UserSearchResult {
  id: string;
  username: string;
  avatarUrl: string | null;
  rank: number;
  isFriend: boolean;
  hasPendingRequestFromYou: boolean;
  hasPendingRequestToYou: boolean;
  isBlocked: boolean;
}

export type FriendRequestTab = 'friends' | 'requests' | 'suggestions';
