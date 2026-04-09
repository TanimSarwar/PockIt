import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PockIt',
  slug: 'pockit',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'pockit',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#6366F1',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.pockit.app',
    config: {
      googleMobileAdsAppId: 'ca-app-pub-3940256099942544~1458002511', // TODO: Replace with real AdMob App ID
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#6366F1',
    },
    package: 'com.pockit.app',
    config: {
      googleMobileAdsAppId: 'ca-app-pub-3940256099942544~3347511713', // TODO: Replace with real AdMob App ID
    },
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#6366F1',
      },
    ],
    // TODO: Uncomment after installing react-native-google-mobile-ads
    // ['react-native-google-mobile-ads', { androidAppId: 'ca-app-pub-3940256099942544~3347511713', iosAppId: 'ca-app-pub-3940256099942544~1458002511' }],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '37d3ed7b-edcc-4fae-981c-14c8d2e61717',
    },
  },
});
