import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, Heading, Subtitle, Button, TextField } from '@/components/ui';
import { supabase } from '@/lib/supabase';

/**
 * Connexion e-mail + mot de passe (Phase 1).
 * NB : l'OTP par e-mail (code 6 chiffres) du cahier nécessite un template
 * Supabase personnalisé, donc un SMTP. En attendant ce setup, on utilise le
 * mot de passe — l'AuthGuard route ensuite vers le choix du rôle / l'onboarding.
 */
export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = emailOk && password.length >= 6;

  async function signIn() {
    if (!valid) return;
    setError(undefined);
    setInfo(undefined);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) setError(error.message);
    // Succès → l'AuthGuard route automatiquement.
  }

  async function signUp() {
    if (!valid) return;
    setError(undefined);
    setInfo(undefined);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Si la confirmation e-mail est désactivée, une session est créée directement.
    if (!data.session) setInfo(t('auth.checkEmail'));
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6 gap-8 py-10"
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
          />
          <TextField
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            autoCapitalize="none"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={error}
          />
          {info ? <Text className="text-success text-sm">{info}</Text> : null}

          <Button label={t('auth.signIn')} onPress={signIn} loading={loading} disabled={!valid} />
          <Pressable onPress={signUp} disabled={loading} className="items-center py-2">
            <Text className="text-primary font-medium">{t('auth.createAccount')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
