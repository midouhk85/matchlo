import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, Heading, Subtitle, Button, TextField } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function sendCode() {
    if (!isValid) {
      setError(t('auth.invalidEmail'));
      return;
    }
    setError(undefined);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push({ pathname: '/(auth)/otp', params: { email: email.trim().toLowerCase() } });
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6 gap-8"
      >
        <View className="items-center gap-3">
          <LinearGradient
            colors={['#7C5CFF', '#3B7BF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 34 }}>💫</Text>
          </LinearGradient>
          <Heading className="text-3xl">{t('auth.title')}</Heading>
          <Subtitle className="text-center">{t('auth.subtitle')}</Subtitle>
        </View>

        <View className="gap-4">
          <TextField
            label={t('auth.emailLabel')}
            placeholder={t('auth.emailPlaceholder')}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={error}
          />
          <Button label={t('auth.sendCode')} onPress={sendCode} loading={loading} disabled={!isValid} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
