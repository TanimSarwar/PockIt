/**
 * PockIt AdMob Constants
 * Ad unit IDs, timing, and category restrictions.
 */
import { Platform } from 'react-native';

// ─── Test Ad Unit IDs (Google-provided) ────────────────────────────────────

const TEST_IDS = {
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
} as const;

// ─── Production Ad Unit IDs (replace with real IDs before release) ─────────

const PRODUCTION_IDS = {
  ios: {
    banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  },
  android: {
    banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  },
} as const;

// ─── Resolved IDs Based on Environment ─────────────────────────────────────

const isTestMode = __DEV__;
const platformKey = Platform.OS === 'ios' ? 'ios' : 'android';
const adSource = isTestMode ? TEST_IDS : PRODUCTION_IDS;

export const AD_UNIT_IDS = {
  BANNER: adSource[platformKey].banner,
  INTERSTITIAL: adSource[platformKey].interstitial,
  REWARDED: adSource[platformKey].rewarded,
} as const;

// ─── Timing ────────────────────────────────────────────────────────────────

/** Minimum milliseconds between interstitial ads (3 minutes) */
export const MIN_INTERSTITIAL_INTERVAL = 180_000;

/** Minimum milliseconds between rewarded ad prompts (5 minutes) */
export const MIN_REWARDED_INTERVAL = 300_000;

/** Number of feature opens before showing first interstitial */
export const INTERSTITIAL_FEATURE_THRESHOLD = 3;

// ─── Category Restrictions ─────────────────────────────────────────────────

/** Categories where interstitial and banner ads should not be shown */
export const NO_ADS_CATEGORIES: string[] = ['wellness'];

/** Feature IDs that should never show ads (in addition to category-level) */
export const NO_ADS_FEATURES: string[] = ['meditation', 'sleep-tracker'];

// ─── Banner Config ─────────────────────────────────────────────────────────

export const BANNER_SIZES = {
  STANDARD: 'BANNER' as const, // 320x50
  LARGE: 'LARGE_BANNER' as const, // 320x100
  MEDIUM_RECT: 'MEDIUM_RECTANGLE' as const, // 300x250
  ADAPTIVE: 'ANCHORED_ADAPTIVE_BANNER' as const,
};

export const DEFAULT_BANNER_SIZE = BANNER_SIZES.ADAPTIVE;

// ─── Helper ────────────────────────────────────────────────────────────────

/**
 * Check if ads should be shown for a given feature/category.
 */
export function shouldShowAds(
  featureId: string,
  category: string,
  isPremium: boolean = false,
): boolean {
  if (isPremium) return false;
  if (NO_ADS_CATEGORIES.includes(category)) return false;
  if (NO_ADS_FEATURES.includes(featureId)) return false;
  return true;
}
