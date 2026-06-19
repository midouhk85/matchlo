import '../global.css';
import 'react-native-gesture-handler';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { initI18n } from '@/lib/i18n';
import { useSession } from '@/store/useSession';
import { FullLoader } from '@/components/ui';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [i18nReady, setI18nReady] = useState(false);
  const { setSession, refreshProfile, initializing } = useSession();

  // Initialise i18n (langue + RTL)
  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  // Écoute l'état d'authentification Supabase et charge le profil associé
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null);
      if (data.session) await refreshProfile();
      useSession.setState({ initializing: false });
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session ?? null);
      if (session) await refreshProfile();
      else useSession.setState({ profile: null });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const ready = fontsLoaded && i18nReady && !initializing;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard />
          <StatusBar style="light" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Garde de navigation : oriente l'utilisateur selon son état.
 *  - pas de session → (auth)
 *  - session sans profil (rôle pas encore choisi) → (auth)/role puis onboarding
 *  - profil talent → (talent) ; profil entreprise → (company)
 */
function AuthGuard() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const { session, profile } = useSession();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    const group = segments[0];
    const inAuth = group === '(auth)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }
    // Connecté mais pas encore de profil → choix du rôle / onboarding
    if (!profile) {
      const onRoleFlow = segments[1] === 'role' || group === 'onboarding';
      if (!onRoleFlow) router.replace('/(auth)/role');
      return;
    }
    // Routes partagées accessibles depuis les deux espaces (chat, détail mission)
    const shared = group === 'chat' || group === 'mission';
    if (shared) return;
    // Profil prêt → espace correspondant
    if (profile.role === 'talent' && group !== '(talent)') {
      router.replace('/(talent)/discover');
    } else if (profile.role === 'company' && group !== '(company)') {
      router.replace('/(company)/candidates');
    }
  }, [hydrated, session, profile, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A1224' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(talent)" />
      <Stack.Screen name="(company)" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="mission" />
    </Stack>
  );
}
