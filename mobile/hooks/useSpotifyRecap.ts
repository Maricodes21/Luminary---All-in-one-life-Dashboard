/**
 * useSpotifyRecap — fetches tonight's Spotify recap and caches it in
 * useRitualStore for the duration of the ritual modal.
 *
 * The store uses a three-value sentinel for `recap`:
 *   undefined  → not yet fetched (hook is loading)
 *   null       → fetched, but user hasn't listened today
 *   SpotifyRecap → fetched with data
 *
 * Re-entering the ritual (e.g. backgrounding and returning) won't re-fetch
 * because the store check short-circuits once recap !== undefined.
 */
import { useEffect, useState } from 'react';
import { fetchRecap } from '@/lib/spotify';
import { useRitualStore } from '@/stores/useRitualStore';
import type { SpotifyRecap } from '@/lib/spotify';

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';

export type UseSpotifyRecapResult = {
  recap: SpotifyRecap | null | undefined;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
};

export function useSpotifyRecap(): UseSpotifyRecapResult {
  const recap = useRitualStore((s) => s.recap);
  const setRecap = useRitualStore((s) => s.setRecap);
  const clearRecap = useRitualStore((s) => s.clearRecap);
  const [isLoading, setIsLoading] = useState(recap === undefined);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (recap !== undefined) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchRecap(CLIENT_ID)
      .then((result) => {
        if (cancelled) return;
        setRecap(result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[useSpotifyRecap]', msg);
        setError("We couldn't load your listening recap. Tap to try again.");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  // fetchKey is the retry trigger; recap drives the cached-hit exit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  const retry = () => {
    clearRecap();
    setFetchKey((k) => k + 1);
  };

  return { recap, isLoading, error, retry };
}
