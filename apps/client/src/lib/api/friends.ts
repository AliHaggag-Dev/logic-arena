import { apiClient } from '../api-client';
import type {
  FriendEntry,
  FriendRequestEntry,
  FriendRequestListResponse,
  FriendSuggestion,
  UserSearchResult,
} from './friends.types';

export const friendsApi = {
  listFriends: async (): Promise<FriendEntry[]> => {
    const { data } = await apiClient.get<FriendEntry[]>('/friends');
    return data;
  },

  listIncomingRequests: async (
    skip = 0,
    take = 20,
  ): Promise<FriendRequestListResponse> => {
    const { data } = await apiClient.get<FriendRequestListResponse>(
      '/friends/requests',
      { params: { skip, take } },
    );
    return data;
  },

  listOutgoingRequests: async (
    skip = 0,
    take = 20,
  ): Promise<FriendRequestEntry[]> => {
    const { data } = await apiClient.get<FriendRequestEntry[]>(
      '/friends/requests/sent',
      { params: { skip, take } },
    );
    return data;
  },

  sendRequest: async (
    receiverUsername: string,
    message?: string,
  ): Promise<FriendRequestEntry> => {
    const { data } = await apiClient.post<FriendRequestEntry>(
      '/friends/requests',
      { receiverUsername, message },
    );
    return data;
  },

  acceptRequest: async (requestId: string): Promise<FriendRequestEntry> => {
    const { data } = await apiClient.post<FriendRequestEntry>(
      `/friends/requests/${requestId}/accept`,
    );
    return data;
  },

  declineRequest: async (requestId: string): Promise<{ success: true }> => {
    const { data } = await apiClient.post<{ success: true }>(
      `/friends/requests/${requestId}/decline`,
    );
    return data;
  },

  unfriend: async (friendId: string): Promise<{ success: true }> => {
    const { data } = await apiClient.delete<{ success: true }>(
      `/friends/${friendId}`,
    );
    return data;
  },

  getSuggestions: async (): Promise<FriendSuggestion[]> => {
    const { data } = await apiClient.get<FriendSuggestion[]>(
      '/friends/suggestions',
    );
    return data;
  },

  searchUsers: async (query: string): Promise<UserSearchResult[]> => {
    const { data } = await apiClient.get<UserSearchResult[]>('/users/search', {
      params: { q: query },
    });
    return data;
  },
};
