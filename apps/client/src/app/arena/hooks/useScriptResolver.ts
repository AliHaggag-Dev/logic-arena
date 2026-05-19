'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { getAuthUserId, getSelectedScriptId, setSelectedScriptId } from '../../../lib/client-security';

interface RobotScript {
  id: string;
  title: string;
  content: string;
}

export const useScriptResolver = (urlScriptId: string | null, isSpectator: boolean) => {
  const router = useRouter();
  const [resolvedScriptId, setResolvedScriptId] = useState<string | null>(urlScriptId);
  const [script, setScript] = useState<RobotScript | null>(null);
  const [loading, setLoading] = useState(!isSpectator);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSpectator) return;

    let isMounted = true;

    const resolveAndFetch = async () => {
      let targetScriptId = resolvedScriptId;

      if (!targetScriptId) {
        const stored = getSelectedScriptId();
        if (stored) {
          targetScriptId = stored;
          setResolvedScriptId(stored);
        } else {
          try {
            const res = await apiClient.get('/scripts');
            if (res.data && res.data.length > 0) {
              targetScriptId = res.data[0].id as string;
              setSelectedScriptId(targetScriptId as string);
              setResolvedScriptId(targetScriptId);
            } else {
              if (isMounted) {
                setError('No scripts found. Please create a script in the Dashboard first.');
                setLoading(false);
              }
              return;
            }
          } catch (err: unknown) {
            const axiosError = err as { response?: { status?: number } };
            if (axiosError.response?.status === 401 || !getAuthUserId()) {
              if (isMounted) {
                setResolvedScriptId('guest-script');
                setScript({
                  id: 'guest-script',
                  title: 'Guest Script',
                  content: '// Guest Mode active\n// You can write temporary logic here'
                } as RobotScript);
                setLoading(false);
              }
              return;
            }

            if (isMounted) {
              setError('Failed to fetch fallback scripts.');
              setLoading(false);
            }
            return;
          }
        }
      }

      try {
        const response = await apiClient.get(`/scripts/${targetScriptId}`);
        if (isMounted) {
          setScript(response.data);
          setLoading(false);
        }
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number, data?: { message?: string } }, message?: string };

        if (axiosError.response?.status === 401 || !getAuthUserId()) {
          if (isMounted) {
            setResolvedScriptId('guest-script');
            setScript({
              id: 'guest-script',
              title: 'Guest Script',
              content: '// Guest Mode active\n// You can write temporary logic here'
            });
            setLoading(false);
          }
          return;
        }

        setSelectedScriptId(null);

        try {
          const res = await apiClient.get('/scripts');
          if (res.data && res.data.length > 0) {
            const fallbackId = res.data[0].id as string;
            setSelectedScriptId(fallbackId);
            if (isMounted) {
              setResolvedScriptId(fallbackId);
            }
          } else {
            if (isMounted) {
              setError('No scripts found. Please create a script in the Dashboard first.');
              setLoading(false);
            }
          }
        } catch (fallbackErr) {
          if (isMounted) {
            const e = fallbackErr as { response?: { data?: { message?: string } }; message?: string };
            setError(e.response?.data?.message || e.message || 'Unknown error');
            setLoading(false);
          }
        }
      }
    };

    resolveAndFetch();

    return () => { isMounted = false; };
  }, [router, resolvedScriptId, isSpectator]);

  return { script, loading, error, resolvedScriptId };
};
