"use client";

import { useCallback, useEffect, useState } from 'react';
import { friendsApi } from '../lib/api/friends';
import type {
  FriendEntry,
  FriendRequestEntry,
  FriendSuggestion,
} from '../lib/api/friends.types';
import { useGlobalSocket } from '../hooks/useGlobalSocket';
import { useAuth } from '../context/AuthContext';
import { useSafeTimeout } from '../hooks/useSafeTimeout';
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

export function useFriendsSystem() {
  const { profile } = useAuth();
  const { clearAllSafeTimeouts, setSafeTimeout } = useSafeTimeout();

  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestEntry[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestEntry[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [incomingRequest, setIncomingRequest] = useState<IncomingFriendRequest | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const allowFriendRequests = profile?.notificationSettings?.friendRequests !== false;

  const showToast = useCallback(
    (message: string, type: ToastState['type'] = 'info') => {
      clearAllSafeTimeouts();
      setToast({ message, type });
      setSafeTimeout(() => setToast(null), 3500);
    },
    [clearAllSafeTimeouts, setSafeTimeout],
  );

  const fetchFriends = useCallback(async () => {
    try {
      setIsLoadingFriends(true);
      const data = await friendsApi.listFriends();
      setFriends(data);
    } catch {
      /* keep last state */
    } finally {
      setIsLoadingFriends(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      const [incoming, outgoing] = await Promise.all([
        friendsApi.listIncomingRequests(0, 50),
        friendsApi.listOutgoingRequests(0, 50),
      ]);
      setIncomingRequests(incoming.items);
      setOutgoingRequests(outgoing);
    } catch {
      /* keep last state */
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoadingSuggestions(true);
      const data = await friendsApi.getSuggestions();
      setSuggestions(data);
    } catch {
      /* keep last state */
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    void fetchFriends();
    void fetchRequests();
  }, [profile, fetchFriends, fetchRequests]);

  const { sendFriendRequest, acceptFriendRequest, declineFriendRequest, unfriendSocket } =
    useGlobalSocket({
      onChallengeReceived: () => {},
      onChallengeSent: () => {},
      onChallengeFailed: () => {},
      onChallengeAccepted: () => {},
      onFriendRequestReceived: (data) => {
        setIncomingRequest(data);
        setIncomingRequests((prev) => {
          if (prev.some((r) => r.id === data.request.id)) return prev;
          return [data.request, ...prev];
        });
        setUnreadCount(data.unreadCount);
        showToast(`${data.request.sender.username} sent you a friend request`, 'info');
      },
      onFriendRequestAccepted: (data) => {
        showToast(`${data.by.username} accepted your friend request`, 'success');
        setUnreadCount(data.unreadCount);
        void fetchFriends();
        void fetchRequests();
      },
      onFriendRequestDeclined: (data) => {
        showToast(`${data.by.username} declined your friend request`, 'info');
        setOutgoingRequests((prev) => prev.filter((r) => r.receiver.id !== data.by.id));
      },
      onFriendRemoved: (data) => {
        showToast(`${data.by.username} removed you from their friends`, 'info');
        setFriends((prev) => prev.filter((f) => f.id !== data.by.id));
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
        setOutgoingRequests((prev) => {
          if (prev.some((r) => r.id === request.id)) return prev;
          return [request, ...prev];
        });
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
    [showToast],
  );

  const acceptRequest = useCallback(
    async (requestId: string) => {
      try {
        const updated = await friendsApi.acceptRequest(requestId);
        setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
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
    [showToast, fetchFriends],
  );

  const declineRequest = useCallback(
    async (requestId: string) => {
      try {
        await friendsApi.declineRequest(requestId);
        setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
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
    [showToast],
  );

  const unfriend = useCallback(
    async (friendId: string) => {
      try {
        await friendsApi.unfriend(friendId);
        setFriends((prev) => prev.filter((f) => f.id !== friendId));
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
    [showToast],
  );

  const onlineFriends = friends.filter((f) => f.status !== 'offline');

  return {
    friends,
    onlineFriends,
    incomingRequests,
    outgoingRequests,
    suggestions,
    incomingRequest,
    toast,
    unreadCount,
    isLoadingFriends,
    isLoadingRequests,
    isLoadingSuggestions,
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
  };
}
