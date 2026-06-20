import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Screen, Heading, EmptyState, FullLoader, StatusPill } from '@/components/ui';
import { formatDZD } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';

const STATUS_COLOR: Record<string, any> = {
  proposed: 'warning',
  accepted: 'primary',
  presence_confirmed: 'success',
  in_progress: 'primary',
  delivered: 'secondary',
  completed: 'success',
  cancelled: 'danger',
  disputed: 'danger',
};

/** « Mes missions » côté talent : engagements issus des matchs, avec statut. */
export default function TalentMissions() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useSession();

  const engagements = useQuery({
    queryKey: ['talentEngagements', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagements')
        .select(
          '*, match:matches!inner(id, talent_id, mission:missions(title, event_type, start_date, pay_dzd, wilaya), company:profiles!matches_company_id_fkey(full_name))',
        )
        .eq('match.talent_id', profile!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (engagements.isLoading) return <FullLoader />;

  return (
    <Screen edges={['top']}>
      <View className="px-5 pt-2 pb-3">
        <Heading>{t('profile.myMissions')}</Heading>
      </View>

      {engagements.data && engagements.data.length > 0 ? (
        <FlatList
          data={engagements.data}
          keyExtractor={(e: any) => e.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}
          renderItem={({ item }: { item: any }) => (
            <Pressable
              onPress={() => item.match?.id && router.push(`/engagement/${item.match.id}`)}
              className="bg-surface rounded-card p-4 gap-2 border border-border active:opacity-80"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-fg font-semibold text-base flex-1" numberOfLines={1}>
                  {item.match?.mission?.title ?? '—'}
                </Text>
                <StatusPill label={item.status} color={STATUS_COLOR[item.status] ?? 'muted'} />
              </View>
              <Text className="text-muted text-sm">{item.match?.company?.full_name}</Text>
              <View className="flex-row gap-4">
                <Text className="text-muted text-xs">📍 {item.match?.mission?.wilaya ?? '—'}</Text>
                <Text className="text-muted text-xs">💰 {formatDZD(item.match?.mission?.pay_dzd)}</Text>
                {item.match?.mission?.start_date ? (
                  <Text className="text-muted text-xs">📅 {item.match.mission.start_date}</Text>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      ) : (
        <EmptyState emoji="📋" title={t('matches.empty')} description={t('matches.emptyDesc')} />
      )}
    </Screen>
  );
}
