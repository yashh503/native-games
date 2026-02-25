import { useRef, useState, useCallback } from 'react';
import { useAdConfig } from './useAdConfig';
import { AdConfigData } from '../services/api';

export function useAd() {
  const adConfig = useAdConfig();
  const [adLoading, setAdLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gamesSinceInterstitialRef = useRef(0);
  const lastInterstitialTimeRef = useRef<number>(0);

  const showRewardedAd = useCallback(
    (onComplete: () => void, _onDismiss?: () => void) => {
      // If global kill switch or rewarded disabled, skip and grant reward instantly
      if (adConfig.globalKillSwitch || !adConfig.rewarded.enabled) {
        onComplete();
        return;
      }
      if (adLoading) return;

      setAdLoading(true);

      // Mock — swap for real SDK when provider !== 'mock'
      timerRef.current = setTimeout(() => {
        setAdLoading(false);
        onComplete();
        timerRef.current = null;
      }, 3000);
    },
    [adLoading, adConfig]
  );

  /**
   * Call after each game completes. Returns true if an interstitial should be triggered.
   * Frequency + cooldown are driven by backend config (changeable without app update).
   */
  const recordGameComplete = useCallback(
    (streakJustIncremented: boolean = false): boolean => {
      if (adConfig.globalKillSwitch || !adConfig.interstitial.enabled) return false;

      gamesSinceInterstitialRef.current += 1;

      if (streakJustIncremented && adConfig.interstitial.suppressOnStreakIncrement) {
        return false;
      }

      const { frequencyGames, cooldownSeconds } = adConfig.interstitial;
      const cooldownMs = cooldownSeconds * 1000;
      const now = Date.now();
      const timeSinceLast = now - lastInterstitialTimeRef.current;

      if (
        gamesSinceInterstitialRef.current >= frequencyGames &&
        timeSinceLast >= cooldownMs
      ) {
        gamesSinceInterstitialRef.current = 0;
        lastInterstitialTimeRef.current = now;
        return true;
      }

      return false;
    },
    [adConfig]
  );

  return { adLoading, showRewardedAd, recordGameComplete, adConfig };
}

export type { AdConfigData };
