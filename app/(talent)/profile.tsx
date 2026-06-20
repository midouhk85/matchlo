import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Screen, Heading, Avatar, VerifiedBadge, FullLoader, Button, StatusPill } from '@/components/ui';
import { SettingsSection } from '@/components/Settings';
import { formatDZD } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';

export default function TalentProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useSession();

  const details = useQuery({
    queryKey: ['talentDetails', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('talent_profiles').select('*').eq('profile_id', profile!.id).maybeSingle();
      return data;
    },
  });

  // Nombre de matchs (stat accessible côté talent)
  const matchCount = useQuery({
    queryKey: ['talentMatchCount', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('talent_id', profile!.id);
      return count ?? 0;
    },
  });

  // Note moyenne reçue (évaluations bidirectionnelles, §B)
  const rating = useQuery({
    queryKey: ['talentRating', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc('profile_rating', { p_id: profile!.id });
      return data?.[0] ?? { rating_avg: null, rating_count: 0 };
    },
  });

  if (!profile) return <FullLoader />;

  return (
    <Screen scroll edges={['top']}>
      <View className="px-5 py-4 gap-6">
        {/* En-tête profil */}
        <View className="items-center gap-3">
          <Avatar id={profile.id} name={profile.full_name} uri={profile.photo_url} size={96} />
          <View className="flex-row items-center gap-2">
            <Heading>{profile.full_name}</Heading>
            {profile.is_verified ? <VerifiedBadge size={20} /> : null}
          </View>
          <Text className="text-muted">📍 {profile.wilaya ?? '—'}</Text>
        </View>

        {/* Statistiques */}
        <View className="flex-row gap-3">
          <Stat
            label={t('rating.title')}
            value={rating.data?.rating_count ? `⭐ ${rating.data.rating_avg}` : '—'}
          />
          <Stat label={t('matches.title')} value={String(matchCount.data ?? 0)} />
          <Stat label={t('onboarding.dailyRate')} value={formatDZD(details.data?.daily_rate_dzd)} />
        </View>

        {/* Incitation à la vérification (badge bleu) — non bloquante */}
        {!profile.is_verified ? (
          <Pressable
            onPress={() => router.push('/verify')}
            className="bg-surface rounded-card p-4 gap-2 border border-primary/40 active:opacity-80"
          >
            <View className="flex-row items-center gap-2">
              <VerifiedBadge size={18} />
              <Text className="text-fg font-semibold text-base">{t('onboarding.verifyPrompt')}</Text>
              {profile.verification_status === 'pending' ? (
                <View className="ml-auto"><StatusPill label={t('verify.pending')} color="warning" /></View>
              ) : (
                <Text className="ml-auto text-primary">›</Text>
              )}
            </View>
            <Text className="text-muted text-sm">{t('onboarding.verifyDesc')}</Text>
          </Pressable>
        ) : null}

        {details.data?.bio ? (
          <View className="bg-surface rounded-card p-4 border border-border">
            <Text className="text-fg text-sm">{details.data.bio}</Text>
          </View>
        ) : null}

        <Button label={t('profile.edit')} variant="outline" onPress={() => router.push('/(talent)/edit-profile')} />

        <SettingsSection />
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-surface rounded-card p-4 items-center border border-border">
      <Text className="text-fg font-bold text-lg" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-muted text-xs text-center" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
