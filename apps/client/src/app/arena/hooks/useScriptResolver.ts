'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { getAuthUserId, getSelectedScriptId, setSelectedScriptId } from '../../../lib/client-security';

interface RobotScript {
  id: string;
  title: string;
  content: string;
}

// Module-level cache for active promises to prevent duplicate concurrent network requests
let scriptListPromise: Promise<any> | null = null;
const scriptDetailPromises: Record<string, Promise<any>> = {};

const fetchScriptListShared = (): Promise<any> => {
  if (!scriptListPromise) {
    scriptListPromise = apiClient.get('/scripts').catch((err: unknown) => {
      // Clear on failure so next retry can try again
      scriptListPromise = null;
      throw err;
    });
  }
  return scriptListPromise;
};

const fetchScriptDetailShared = (scriptId: string): Promise<any> => {
  if (!scriptDetailPromises[scriptId]) {
    scriptDetailPromises[scriptId] = apiClient.get(`/scripts/${scriptId}`).catch((err: unknown) => {
      // Clear on failure so next retry can try again
      delete scriptDetailPromises[scriptId];
      throw err;
    });
  }
  return scriptDetailPromises[scriptId];
};

export const useScriptResolver = (urlScriptId: string | null, isSpectator: boolean) => {
  const [resolvedScriptId, setResolvedScriptId] = useState<string | null>(urlScriptId);
  const [script, setScript] = useState<RobotScript | null>(null);
  const [loading, setLoading] = useState(!isSpectator);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSpectator) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const resolveAndFetch = async () => {
      setLoading(true);
      setError(null);

      let targetScriptId = urlScriptId;

      // 1. Resolve targetScriptId if not provided in URL
      if (!targetScriptId) {
        const stored = getSelectedScriptId();
        if (stored) {
          targetScriptId = stored;
        } else {
          try {
            const res = await fetchScriptListShared();
            if (res.data && res.data.length > 0) {
              targetScriptId = res.data[0].id as string;
              setSelectedScriptId(targetScriptId);
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
                const guestScript: RobotScript = {
                  id: 'guest-script',
                  title: 'Guest Script',
                  content: '// Guest Mode active\n// You can write temporary logic here',
                };
                setResolvedScriptId('guest-script');
                setScript(guestScript);
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

      // At this point, we have a targetScriptId.
      const cacheKey = `arena:script:${targetScriptId}`;

      const getCachedScript = (): RobotScript | null => {
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            return JSON.parse(cached) as RobotScript;
          }
        } catch (e) {
          // Ignore storage errors
        }
        return null;
      };

      const setCachedScript = (scriptData: RobotScript) => {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(scriptData));
        } catch (e) {
          // Ignore storage errors
        }
      };

      // 2. Fetch the script content
      try {
        const cached = getCachedScript();
        if (cached) {
          if (isMounted) {
            setResolvedScriptId(targetScriptId);
            setScript(cached);
            setLoading(false);
          }
          return;
        }

        const response = await fetchScriptDetailShared(targetScriptId);
        const scriptData = response.data as RobotScript;

        setCachedScript(scriptData);

        if (isMounted) {
          setResolvedScriptId(targetScriptId);
          setScript(scriptData);
          setLoading(false);
        }
      } catch (err: unknown) {
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } };
          message?: string;
        };

        // Fall back to cached value if available
        const cached = getCachedScript();
        if (cached) {
          if (isMounted) {
            setResolvedScriptId(targetScriptId);
            setScript(cached);
            setLoading(false);
          }
          return;
        }

        if (axiosError.response?.status === 401 || !getAuthUserId()) {
          if (isMounted) {
            const guestScript: RobotScript = {
              id: 'guest-script',
              title: 'Guest Script',
              content: '// Guest Mode active\n// You can write temporary logic here',
            };
            setResolvedScriptId('guest-script');
            setScript(guestScript);
            setLoading(false);
          }
          return;
        }

        setSelectedScriptId(null);

        // Fallback to user's first script
        try {
          const res = await fetchScriptListShared();
          if (res.data && res.data.length > 0) {
            const fallbackId = res.data[0].id as string;
            setSelectedScriptId(fallbackId);

            const fallbackCacheKey = `arena:script:${fallbackId}`;
            const fallbackCached = sessionStorage.getItem(fallbackCacheKey);
            if (fallbackCached) {
              const parsedFallback = JSON.parse(fallbackCached) as RobotScript;
              if (isMounted) {
                setResolvedScriptId(fallbackId);
                setScript(parsedFallback);
                setLoading(false);
              }
              return;
            }

            const fallbackResponse = await fetchScriptDetailShared(fallbackId);
            const fallbackScriptData = fallbackResponse.data as RobotScript;

            try {
              sessionStorage.setItem(fallbackCacheKey, JSON.stringify(fallbackScriptData));
            } catch (e) {
              // Ignore
            }

            if (isMounted) {
              setResolvedScriptId(fallbackId);
              setScript(fallbackScriptData);
              setLoading(false);
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

    return () => {
      isMounted = false;
    };
  }, [urlScriptId, isSpectator]);

  return { script, loading, error, resolvedScriptId };
};
