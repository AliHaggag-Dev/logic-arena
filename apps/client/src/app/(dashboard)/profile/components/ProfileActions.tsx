'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Swords, UserCheck, UserX, Loader2, Check } from 'lucide-react';
import { friendsApi } from '@/lib/api/friends';
import { useAuth } from '@/context/AuthContext';
import { useGlobalSocket } from '@/hooks/useGlobalSocket';
import type { AxiosError } from 'axios';

interface ProfileActionsProps {
  targetUserId: string;
  targetUsername: string;
  isMobile?: boolean;
}

type RelationState =
  | 'NONE'
  | 'IS_SELF'
  | 'GUEST'
  | 'FRIEND'
  | 'OUTGOING_PENDING'
  | 'INCOMING_PENDING'
  | 'LOADING';

interface SendChallengeOptions {
  targetUserId: string;
  source: 'profile';
}

export function ProfileActions({ targetUserId, targetUsername, isMobile = false }: ProfileActionsProps) {
  const router = useRouter();
  const { profile, loading: isAuthLoading } = useAuth();
  const [relation, setRelation] = useState<RelationState>('LOADING');
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { sendChallenge } = useGlobalSocket({});

  const resolveRelation = useCallback(async (): Promise<void> => {
    try {
      const friends = await friendsApi.listFriends();
      if (friends.some((f) => f.id === targetUserId)) {
        setRelation('FRIEND');
        return;
      }
      const incoming = await friendsApi.listIncomingRequests(0, 50);
      const incomingMatch = incoming.items.find((r) => r.sender.id === targetUserId);
      if (incomingMatch) {
        setPendingRequestId(incomingMatch.id);
        setRelation('INCOMING_PENDING');
        return;
      }
      const outgoing = await friendsApi.listOutgoingRequests();
      const outgoingMatch = outgoing.find((r) => r.receiver.id === targetUserId);
      if (outgoingMatch) {
        setPendingRequestId(outgoingMatch.id);
        setRelation('OUTGOING_PENDING');
        return;
      }
      setRelation('NONE');
    } catch (err: unknown) {
      console.error('[ProfileActions] resolveRelation failed', err);
      setRelation('NONE');
    }
  }, [targetUserId]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!profile) {
      setRelation('GUEST');
      return;
    }
    if (profile.id === targetUserId) {
      setRelation('IS_SELF');
      return;
    }
    setRelation('LOADING');
    void resolveRelation();
  }, [profile, isAuthLoading, targetUserId, resolveRelation]);

  const handleSendRequest = useCallback(async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await friendsApi.sendRequest(targetUsername);
      setRelation('OUTGOING_PENDING');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const msg = axiosErr.response?.data?.message ?? 'Failed to send request';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [targetUsername]);

  const handleAcceptRequest = useCallback(async () => {
    if (!pendingRequestId) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await friendsApi.acceptRequest(pendingRequestId);
      setRelation('FRIEND');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const msg = axiosErr.response?.data?.message ?? 'Failed to accept';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [pendingRequestId]);

  const handleUnfriend = useCallback(async () => {
    if (!window.confirm(`Remove @${targetUsername} from your friends?`)) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await friendsApi.unfriend(targetUserId);
      setRelation('NONE');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const msg = axiosErr.response?.data?.message ?? 'Failed to remove';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [targetUserId, targetUsername]);

  const handleChallenge = useCallback(() => {
    const options: SendChallengeOptions = { targetUserId, source: 'profile' };
    sendChallenge(options.targetUserId, options.source);
  }, [sendChallenge, targetUserId]);

  if (relation === 'IS_SELF' || relation === 'GUEST' || relation === 'LOADING') {
    return null;
  }

  const buttonBase =
    'group inline-flex items-center justify-center gap-2 font-mono font-bold uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizeClass = isMobile
    ? 'h-10 px-3 text-[10px] tracking-[0.18em]'
    : 'h-11 px-4 text-[11px] tracking-[0.2em]';

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2`}>
        {relation === 'NONE' && (
          <button
            type="button"
            onClick={handleSendRequest}
            disabled={isSubmitting}
            aria-label={`Send friend request to ${targetUsername}`}
            className={`${buttonBase} ${sizeClass} border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 hover:border-accent rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Add Friend
          </button>
        )}

        {relation === 'OUTGOING_PENDING' && (
          <button
            type="button"
            disabled
            aria-label="Friend request pending"
            className={`${buttonBase} ${sizeClass} border border-accent/20 bg-accent/5 text-accent/60 rounded-md cursor-default`}
          >
            <Check size={14} />
            Request Sent
          </button>
        )}

        {relation === 'INCOMING_PENDING' && (
          <button
            type="button"
            onClick={handleAcceptRequest}
            disabled={isSubmitting}
            aria-label={`Accept friend request from ${targetUsername}`}
            className={`${buttonBase} ${sizeClass} border border-[color:var(--sem-success)]/40 bg-[color:var(--sem-success)]/10 text-[color:var(--sem-success)] hover:bg-[color:var(--sem-success)]/20 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sem-success)] focus-visible:outline-offset-2`}
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
            Accept Request
          </button>
        )}

        {relation === 'FRIEND' && (
          <>
            <button
              type="button"
              onClick={handleChallenge}
              disabled={isSubmitting}
              aria-label={`Challenge ${targetUsername}`}
              className={`${buttonBase} ${sizeClass} border border-[color:var(--sem-warning)]/40 bg-[color:var(--sem-warning)]/10 text-[color:var(--sem-warning)] hover:bg-[color:var(--sem-warning)]/20 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sem-warning)] focus-visible:outline-offset-2`}
            >
              <Swords size={14} />
              Challenge
            </button>
            <button
              type="button"
              onClick={handleUnfriend}
              disabled={isSubmitting}
              aria-label={`Remove ${targetUsername} from friends`}
              className={`${buttonBase} ${sizeClass} border border-[color:var(--sem-danger)]/30 bg-[color:var(--sem-danger)]/5 text-[color:var(--sem-danger)]/70 hover:bg-[color:var(--sem-danger)]/10 hover:border-[color:var(--sem-danger)]/50 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sem-danger)] focus-visible:outline-offset-2`}
            >
              <UserX size={14} />
              Unfriend
            </button>
          </>
        )}

        {relation === 'NONE' && (
          <button
            type="button"
            onClick={handleChallenge}
            disabled={isSubmitting}
            aria-label={`Challenge ${targetUsername}`}
            className={`${buttonBase} ${sizeClass} border border-[color:var(--sem-warning)]/40 bg-[color:var(--sem-warning)]/10 text-[color:var(--sem-warning)] hover:bg-[color:var(--sem-warning)]/20 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sem-warning)] focus-visible:outline-offset-2`}
          >
            <Swords size={14} />
            Challenge
          </button>
        )}
      </div>

      {actionError && (
        <p className="text-[10px] text-[color:var(--sem-danger)] font-mono tracking-wide">
          {actionError}
        </p>
      )}

      {relation === 'OUTGOING_PENDING' && (
        <p className="text-[10px] text-text-secondary/60 font-mono">
          Pending — they need to accept before you can challenge.
        </p>
      )}

      {relation === 'INCOMING_PENDING' && (
        <p className="text-[10px] text-text-secondary/60 font-mono">
          @${targetUsername} sent you a friend request.{' '}
          <button
            type="button"
            onClick={() => router.push('/friends?tab=requests')}
            className="text-accent hover:underline"
          >
            View all
          </button>
        </p>
      )}
    </div>
  );
}
