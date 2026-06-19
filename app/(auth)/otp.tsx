import { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Heading, Subtitle, Button } from '@/components/ui';
import { COLORS } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

const LENGTH = 6;

export default function Otp() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const inputs = useRef<(TextInput | null)[]>([]);

  const code = digits.join('');

  function onChange(value: string, index: number) {
    // Gère le collage d'un code complet
    if (value.length > 1) {
      const chars = value.replace(/\D/g, '').slice(0, LENGTH).split('');
      const next = Array(LENGTH).fill('');
      chars.forEach((c, i) => (next[i] = c));
      setDigits(next);
      inputs.current[Math.min(chars.length, LENGTH - 1)]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = value.replace(/\D/g, '');
    setDigits(next);
    if (value && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function onKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function verify() {
    if (code.length !== LENGTH) return;
    setLoading(true);
    setError(undefined);
    const { error } = await supabase.auth.verifyOtp({
      email: String(email),
      token: code,
      type: 'email',
    });
    setLoading(false);
    if (error) setError(t('auth.invalidCode'));
    // En cas de succès, l'AuthGuard route automatiquement vers le choix du rôle.
  }

  async function resend() {
    setResending(true);
    await supabase.auth.signInWithOtp({ email: String(email), options: { shouldCreateUser: true } });
    setResending(false);
  }

  return (
    <Screen>
      <View className="flex-1 justify-center px-6 gap-8">
        <View className="gap-2">
          <Heading>{t('auth.otpTitle')}</Heading>
          <Subtitle>{t('auth.otpSubtitle', { email })}</Subtitle>
        </View>

        <View className="flex-row justify-between">
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => {
                inputs.current[i] = r;
              }}
              value={d}
              onChangeText={(v) => onChange(v, i)}
              onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={LENGTH}
              selectTextOnFocus
              placeholderTextColor={COLORS.muted}
              className="w-12 h-14 bg-surface-alt border border-border rounded-md text-center text-fg font-bold text-xl"
            />
          ))}
        </View>

        {error ? <Text className="text-danger text-sm">{error}</Text> : null}

        <View className="gap-3">
          <Button label={t('auth.verify')} onPress={verify} loading={loading} disabled={code.length !== LENGTH} />
          <Pressable onPress={resend} disabled={resending} className="items-center py-2">
            <Text className="text-primary font-medium">{t('auth.resend')}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
