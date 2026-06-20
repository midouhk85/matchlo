import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * MATCHLO — configuration Expo.
 * Identifiants FIGÉS (ne pas changer) : slug, bundle iOS, package Android.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Matchlo',
  slug: 'matchlo',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'matchlo',
  userInterfaceStyle: 'dark',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.matchlo.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Matchlo utilise votre position pour vous proposer des missions près de vous.',
      NSPhotoLibraryUsageDescription:
        'Matchlo a besoin de vos photos pour créer votre profil.',
    },
  },
  android: {
    package: 'com.matchlo.app',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#0A1224',
    },
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'CAMERA',
      'READ_MEDIA_IMAGES',
    ],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0A1224',
        imageWidth: 200,
      },
    ],
    'expo-localization',
    'expo-secure-store',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Matchlo utilise votre position pour vous proposer des missions près de vous.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Matchlo a besoin de vos photos pour créer votre profil.',
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    router: {},
    eas: {},
  },
  experiments: {
    typedRoutes: false,
  },
});
