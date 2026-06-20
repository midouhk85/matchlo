import { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Heading, Subtitle, Button, VerifiedBadge, StatusPill } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';
import { uploadImage, pickImage } from '@/lib/upload';
import { notify } from '@/lib/confirm';

/**
 * Vérification d'identité INCITATIVE (cf. §6) — non bloquante.
 * Téléverse la pièce dans le bucket privé `documents`, crée une demande de
 * vérification (statut pending), passe le profil en verification_status='pending'.
 */
export default function Verify() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile, refreshProfile } = useSession();
  const [doc, setDoc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const status = profile?.verification_status ?? 'unverified';

  async function pickDoc() {
    const uri = await pickImage();
    if (uri) setDoc(uri);
  }

  async function submit() {
    if (!profile?.id || !doc) return;
    setSaving(true);
    try {
      const { path } = await uploadImage('documents', doc, profile.id); // privé
      const { error: vErr } = await supabase.from('verifications').insert({
        profile_id: profile.id,
        doc_url: path,
        status: 'pending',
      });
      if (vErr) throw vErr;
      await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', profile.id);
      await refreshProfile();
      notify(t('verify.submitted'));
      router.back();
    } catch (e: any) {
      notify(t('common.error'), e.message ?? '');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <View className="flex-1 px-6 py-6 gap-6">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary text-2xl">‹</Text>
          </Pressable>
          <Heading>{t('verify.title')}</Heading>
        </View>

        {/* Argumentaire badge bleu */}
        <View className="bg-surface rounded-card p-5 gap-3 border border-primary/40 items-center">
          <VerifiedBadge size={40} />
          <Text className="text-fg font-semibold text-lg text-center">{t('onboarding.verifyPrompt')}</Text>
          <Subtitle className="text-center">{t('onboarding.verifyDesc')}</Subtitle>
        </View>

        {/* Statut courant */}
        {status !== 'unverified' ? (
          <View className="items-center">
            <StatusPill
              label={t(`verify.${status}`, { defaultValue: status })}
              color={status === 'verified' ? 'success' : status === 'pending' ? 'warning' : 'danger'}
            />
          </View>
        ) : null}

        {/* Téléversement de la pièce */}
        {status !== 'verified' ? (
          <View className="gap-4">
            {doc ? (
              <View className="items-center gap-2">
                <Image source={{ uri: doc }} style={{ width: '100%', height: 200, borderRadius: 14 }} resizeMode="cover" />
                <Text className="text-success text-sm">✓ {t('verify.selected')}</Text>
              </View>
            ) : (
              <Pressable
                onPress={pickDoc}
                className="h-40 rounded-card border border-dashed border-border bg-surface-alt items-center justify-center gap-2"
              >
                <Text style={{ fontSize: 32 }}>🪪</Text>
                <Text className="text-muted">{t('verify.uploadDoc')}</Text>
              </Pressable>
            )}
            <Text className="text-muted text-xs text-center">🔒 {t('verify.docNote')}</Text>
            <Button label={t('verify.submit')} disabled={!doc} loading={saving} onPress={submit} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
