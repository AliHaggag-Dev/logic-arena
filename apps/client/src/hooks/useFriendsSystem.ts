"use client";

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { friendsApi } from '../lib/api/friends';
import type {
  FriendEntry,
  FriendRequestEntry,
  FriendSuggestion,
} from '../lib/api/friends.types';
import { useGlobalSocket } from '../hooks/useGlobalSocket';
import { useAuth } from '../context/AuthContext';
import type { AxiosError } from 'axios';

interface ToastState {
  message: string;
  type: 'info' | 'error' | 'success';
}

export type FriendToast = ToastState;

export interface IncomingFriendRequest {
  request: FriendRequestEntry;
  unreadCount: number;
}

interface FriendsStore {
  friends: FriendEntry[];
  incomingRequests: FriendRequestEntry[];
  outgoingRequests: FriendRequestEntry[];
  suggestions: FriendSuggestion[];
  incomingRequest: IncomingFriendRequest | null;
  toast: ToastState | null;
  unreadCount: number;
  isLoadingFriends: boolean;
  isLoadingRequests: boolean;
  isLoadingSuggestions: boolean;
  
  fetchedOnce: boolean;
  toastTimer: ReturnType<typeof setTimeout> | null;
  sentSuggestionIds: Set<string>;
}

let storeState: FriendsStore = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  suggestions: [],
  incomingRequest: null,
  toast: null,
  unreadCount: 0,
  isLoadingFriends: false,
  isLoadingRequests: false,
  isLoadingSuggestions: false,
  fetchedOnce: false,
  toastTimer: null,
  sentSuggestionIds: new Set(),
};

const listeners = new Set<() => void>();

function getSnapshot() {
  return storeState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function updateStore(partial: Partial<FriendsStore>) {
  storeState = { ...storeState, ...partial };
  listeners.forEach((l) => l());
}

function showToast(message: string, type: ToastState['type'] = 'info') {
  if (storeState.toastTimer) clearTimeout(storeState.toastTimer);
  const timer = setTimeout(() => {
    updateStore({ toast: null, toastTimer: null });
  }, 3500);
  updateStore({ toast: { message, type }, toastTimer: timer });
}

export async function fetchFriends() {
  if (storeState.isLoadingFriends) return;
  try {
    updateStore({ isLoadingFriends: true });
    const data = await friendsApi.listFriends();
    updateStore({ friends: data, isLoadingFriends: false });
  } catch {
    updateStore({ isLoadingFriends: false });
  }
}

export async function fetchRequests() {
  if (storeState.isLoadingRequests) return;
  try {
    updateStore({ isLoadingRequests: true });
    const [incoming, outgoing] = await Promise.all([
      friendsApi.listIncomingRequests(0, 50),
      friendsApi.listOutgoingRequests(0, 50),
    ]);
    updateStore({ 
      incomingRequests: incoming.items, 
      outgoingRequests: outgoing,
      isLoadingRequests: false 
    });
  } catch {
    updateStore({ isLoadingRequests: false });
  }
}

export async function fetchSuggestions() {
  if (storeState.isLoadingSuggestions) return;
  try {
    updateStore({ isLoadingSuggestions: true });
    const data = await friendsApi.getSuggestions();
    updateStore({ suggestions: data, isLoadingSuggestions: false });
  } catch {
    updateStore({ isLoadingSuggestions: false });
  }
}

export function useFriendsSystem() {
  const { profile } = useAuth();
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  
  useEffect(() => {
    if (!profile) return;
    if (!storeState.fetchedOnce) {
      updateStore({ fetchedOnce: true });
      void fetchFriends();
      void fetchRequests();
    }
  }, [profile]);

  const { sendFriendRequest, acceptFriendRequest, declineFriendRequest, unfriendSocket } =
    useGlobalSocket({
      onChallengeReceived: () => {},
      onChallengeSent: () => {},
      onChallengeFailed: () => {},
      onChallengeAccepted: () => {},
      onFriendRequestReceived: (data) => {
        if (!storeState.incomingRequests.some((r) => r.id === data.request.id)) {
          updateStore({
            incomingRequest: data,
            incomingRequests: [data.request, ...storeState.incomingRequests],
            unreadCount: data.unreadCount,
          });
          showToast(`${data.request.sender.username} sent you a friend request`, 'info');
        }
      },
      onFriendRequestAccepted: (data) => {
        showToast(`${data.by.username} accepted your friend request`, 'success');
        updateStore({ unreadCount: data.unreadCount });
        void fetchFriends();
        void fetchRequests();
      },
      onFriendRequestDeclined: (data) => {
        showToast(`${data.by.username} declined your friend request`, 'info');
        updateStore({
          outgoingRequests: storeState.outgoingRequests.filter((r) => r.receiver.id !== data.by.id)
        });
      },
      onFriendRemoved: (data) => {
        showToast(`${data.by.username} removed you from their friends`, 'info');
        updateStore({
          friends: storeState.friends.filter((f) => f.id !== data.by.id)
        });
      },
      onFriendsListInvalidate: () => {
        void fetchFriends();
        void fetchSuggestions();
      },
    });

  const sendRequest = useCallback(
    async (username: string, message?: string): Promise<FriendRequestEntry> => {
      try {
        const request = await friendsApi.sendRequest(username, message);
        if (!storeState.outgoingRequests.some((r) => r.id === request.id)) {
          updateStore({
            outgoingRequests: [request, ...storeState.outgoingRequests]
          });
        }
        showToast(`Friend request sent to ${username}`, 'success');
        return request;
      } catch (err: unknown) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        const messageText =
          axiosErr.response?.data?.message ??
          (err instanceof Error ? err.message : 'Failed to send request');
        showToast(messageText, 'error');
        throw err;
      }
    },
    [],
  );

  const markSuggestionSent = useCallback((suggestionId: string) => {
    storeState.sentSuggestionIds.add(suggestionId);
    updateStore({}); // trigger re-render
  }, []);

  const clearSuggestionSent = useCallback((suggestionId: string) => {
    storeState.sentSuggestionIds.delete(suggestionId);
    updateStore({}); // trigger re-render
  }, []);

  const acceptRequest = useCallback(
    async (requestId: string) => {
      try {
        const updated = await friendsApi.acceptRequest(requestId);
        updateStore({
          incomingRequests: storeState.incomingRequests.filter((r) => r.id !== requestId)
        });
        showToast(`You are now friends with ${updated.sender.username}`, 'success');
        await fetchFriends();
      } catch (err: unknown) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        const messageText =
          axiosErr.response?.data?.message ??
          (err instanceof Error ? err.message : 'Failed to accept request');
        showToast(messageText, 'error');
        throw err;
      }
    },
    [],
  );

  const declineRequest = useCallback(
    async (requestId: string) => {
      try {
        await friendsApi.declineRequest(requestId);
        updateStore({
          incomingRequests: storeState.incomingRequests.filter((r) => r.id !== requestId)
        });
        showToast('Friend request declined', 'info');
      } catch (err: unknown) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        const messageText =
          axiosErr.response?.data?.message ??
          (err instanceof Error ? err.message : 'Failed to decline request');
        showToast(messageText, 'error');
        throw err;
      }
    },
    [],
  );

  const unfriend = useCallback(
    async (friendId: string) => {
      try {
        await friendsApi.unfriend(friendId);
        updateStore({
          friends: storeState.friends.filter((f) => f.id !== friendId)
        });
        showToast('Friend removed', 'info');
      } catch (err: unknown) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        const messageText =
          axiosErr.response?.data?.message ??
          (err instanceof Error ? err.message : 'Failed to remove friend');
        showToast(messageText, 'error');
        throw err;
      }
    },
    [],
  );

  const setIncomingRequest = useCallback((req: IncomingFriendRequest | null) => {
    updateStore({ incomingRequest: req });
  }, []);

  const onlineFriends = state.friends.filter((f) => f.status !== 'offline');
  const allowFriendRequests = profile?.notificationSettings?.friendRequests !== false;

  return {
    ...state,
    onlineFriends,
    allowFriendRequests,
    fetchFriends,
    fetchRequests,
    fetchSuggestions,
    sendRequest,
    acceptRequest,
    declineRequest,
    unfriend,
    setIncomingRequest,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriendSocket,
    markSuggestionSent,
    clearSuggestionSent,
  };
}
