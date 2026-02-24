import { useRef, useState, useCallback } from 'react';

// Maximum interstitial frequency: 1 per every 4 completed games
const INTERSTITIAL_INTERVAL = 4;

export function useAd() {
  const [adLoading, setAdLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tracks games completed since last interstitial — kept in a ref (no re-render needed)
  const gamesSinceInterstitialRef = useRef(0);

  const showRewardedAd = useCallback(
    (onComplete: () => void, _onDismiss?: () => void) => {
      if (adLoading) return; // Prevent stacking ad requests
      setAdLoading(true);
      timerRef.current = setTimeout(() => {
        setAdLoading(false);
        onComplete();
        timerRef.current = null;
      }, 3000);
    },
    [adLoading]
  );

  /**
   * Call after each game completes. Returns true if an interstitial should be shown.
   * Caller is responsible for actually showing the interstitial modal when true is returned.
   * Never shows interstitial immediately after a streak increment (pass streakJustIncremented=true).
   */
  const recordGameComplete = useCallback((streakJustIncremented: boolean = false): boolean => {
    gamesSinceInterstitialRef.current += 1;
    if (streakJustIncremented) return false; // Never show ad right after a streak milestone
    if (gamesSinceInterstitialRef.current >= INTERSTITIAL_INTERVAL) {
      gamesSinceInterstitialRef.current = 0;
      return true;
    }
    return false;
  }, []);

  return { adLoading, showRewardedAd, recordGameComplete };
}
