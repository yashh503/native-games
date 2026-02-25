import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAdConfig, AdConfigData } from '../services/api';

const AD_CONFIG_CACHE_KEY = '@ad_config_v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedAdConfig {
  config: AdConfigData;
  cachedAt: number;
}

// Defaults match current mock behaviour exactly.
// App works offline with these — no backend required.
export const DEFAULT_AD_CONFIG: AdConfigData = {
  version: '0.0.0',
  globalKillSwitch: false,
  banner: {
    adUnitId: 'ca-app-pub-3940256099942544/6300978111',
    enabled: false,
    provider: 'mock',
    size: 'banner',
    position: 'home',
    refreshIntervalSeconds: 60,
  },
  interstitial: {
    adUnitId: 'ca-app-pub-3940256099942544/1033173712',
    enabled: true,
    provider: 'mock',
    frequencyGames: 4,
    cooldownSeconds: 30,
    suppressOnStreakIncrement: true,
  },
  rewarded: {
    adUnitId: 'ca-app-pub-3940256099942544/5224354917',
    enabled: true,
    provider: 'mock',
    rewardMultiplier: 2,
    rewardLabel: 'Double your points!',
  },
};

export function useAdConfig(): AdConfigData {
  const [adConfig, setAdConfig] = useState<AdConfigData>(DEFAULT_AD_CONFIG);

  useEffect(() => {
    async function loadConfig() {
      // 1. Read from AsyncStorage cache first (instant, no network)
      try {
        const raw = await AsyncStorage.getItem(AD_CONFIG_CACHE_KEY);
        if (raw) {
          const cached: CachedAdConfig = JSON.parse(raw);
          const age = Date.now() - cached.cachedAt;
          if (age < CACHE_TTL_MS) {
            // Cache is fresh — use it, skip network call
            setAdConfig(cached.config);
            return;
          }
          // Stale cache — apply immediately while we fetch fresh in background
          setAdConfig(cached.config);
        }
      } catch {
        // Cache read failed — fall through to network fetch
      }

      // 2. Fetch fresh config (best-effort)
      try {
        const result = await fetchAdConfig();
        if (result?.config) {
          setAdConfig(result.config);
          const toCache: CachedAdConfig = {
            config: result.config,
            cachedAt: Date.now(),
          };
          await AsyncStorage.setItem(AD_CONFIG_CACHE_KEY, JSON.stringify(toCache));
        }
      } catch {
        // Network failure — stale cache or defaults remain, which is fine
      }
    }

    loadConfig();
  }, []);

  return adConfig;
}
