import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAdConfig } from '../hooks/useAdConfig';
import { COLORS, FONTS } from '../constants/theme';

interface BannerAdProps {
  screen: 'home' | 'profile' | 'result';
}

/**
 * Renders a banner ad based on dynamic config from the backend.
 *
 * With provider 'mock': shows a placeholder rectangle (safe for development/testing).
 * With provider 'admob': swap the mock block below for react-native-google-mobile-ads.
 * With provider 'unity': swap for react-native-unity-ads.
 *
 * The backend controls:
 *  - whether banner is enabled
 *  - which screen(s) to show it on
 *  - the ad unit ID and provider
 *  - global kill switch
 */
export default function BannerAd({ screen }: BannerAdProps) {
  const adConfig = useAdConfig();
  const { banner, globalKillSwitch } = adConfig;

  if (globalKillSwitch) return null;
  if (!banner.enabled) return null;
  if (banner.position !== 'all' && banner.position !== screen) return null;

  if (banner.provider === 'mock') {
    return (
      <View style={styles.mockBanner}>
        <Text style={styles.mockText}>[ ADVERTISEMENT ]</Text>
      </View>
    );
  }

  // AdMob — uncomment when you add react-native-google-mobile-ads:
  //
  // import { BannerAd as GAMBanner, BannerAdSize } from 'react-native-google-mobile-ads';
  // return (
  //   <GAMBanner
  //     unitId={banner.adUnitId}
  //     size={BannerAdSize.BANNER}
  //     requestOptions={{ requestNonPersonalizedAdsOnly: true }}
  //   />
  // );

  return null;
}

const styles = StyleSheet.create({
  mockBanner: {
    height: 52,
    backgroundColor: COLORS.bgCardInner,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  mockText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textDim,
    letterSpacing: 2,
  },
});
