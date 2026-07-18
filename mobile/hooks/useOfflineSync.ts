/**
 * useOfflineSync — flushes the offline write queue whenever the app
 * transitions from background to foreground.
 *
 * Mount this once in the ritual root (ritual/_layout or ritual/index).
 * It's a no-op when the queue is empty, so mounting it unconditionally is safe.
 */
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { flushQueue } from '@/lib/offlineQueue';

export function useOfflineSync(): void {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Attempt one flush on mount in case there are queued writes from a prior session.
    void flushQueue().then(({ flushed, remaining }) => {
      if (flushed > 0) {
        console.log(`[offlineSync] mount flush: ${flushed} written, ${remaining} remaining`);
      }
    });

    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appState.current;
      appState.current = nextState;

      // Flush when coming back to the foreground.
      if (prev.match(/inactive|background/) && nextState === 'active') {
        void flushQueue().then(({ flushed, remaining }) => {
          if (flushed > 0) {
            console.log(`[offlineSync] foreground flush: ${flushed} written, ${remaining} remaining`);
          }
        });
      }
    });

    return () => sub.remove();
  }, []);
}
