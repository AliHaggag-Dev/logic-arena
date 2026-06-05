export const FRIEND_REQUEST_TTL_DAYS = 7;
export const FRIEND_REQUEST_RATE_LIMIT_MAX = 20;
export const FRIEND_REQUEST_RATE_LIMIT_WINDOW_SECONDS = 86_400;

export const FRIEND_LIST_CACHE_TTL = 60;
export const FRIEND_SUGGESTIONS_CACHE_TTL = 120;
export const USER_SEARCH_LIMIT = 20;
export const FRIEND_LIST_LIMIT = 500;
export const PENDING_REQUESTS_LIMIT = 100;

export const SUGGESTION_RANK_WINDOW = 50;
export const SUGGESTION_RECENT_OPPONENTS_LIMIT = 20;
export const SUGGESTION_FINAL_LIMIT = 10;

export const USER_SEARCH_CACHE_TTL = 30;

export const friendListCacheKey = (userId: string): string =>
  `friends:list:${userId}`;

export const friendSuggestionsCacheKey = (userId: string): string =>
  `friends:suggestions:${userId}`;

export const userSearchCacheKey = (query: string, viewerId: string): string =>
  `users:search:${viewerId}:${query.toLowerCase()}`;

export const friendRequestRateLimitKey = (userId: string): string =>
  `ratelimit:friend-request:${userId}`;

export type FriendPresenceStatus = 'online' | 'offline' | 'in-match';

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
  sender: {
    id: string;
    username: string;
    avatarUrl: string | null;
    rank: number;
  };
  receiver: {
    id: string;
    username: string;
    avatarUrl: string | null;
    rank: number;
  };
  message: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface FriendSuggestion {
  id: string;
  username: string;
  avatarUrl: string | null;
  rank: number;
  reason: 'RANK_PROXIMITY' | 'RECENT_OPPONENT';
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
