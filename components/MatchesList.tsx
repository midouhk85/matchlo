import { View, Text, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Screen, Heading, Avatar, EmptyState, FullLoader, VerifiedBadge, StatusPill } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';

/** Liste des matchs + accès au chat. Partagée talent/entreprise. */
export function MatchesList() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useSession();
  const role = profile?.role;

  const matches = useQuery({
    queryKey: ['matches', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(
          '*, mission:missions(title, mission_type), company:profiles!matches_company_id_fkey(id, full_name, photo_url, is_verified), talent:profiles!matches_talent_id_fkey(id, full_name, photo_url, is_verified)',
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (matches.isLoading) return <FullLoader />;

  return (
    <Screen edges={['top']}>
      <View className="px-5 pt-2 pb-3">
        <Heading>{t('matches.title')}</Heading>
      </View>

      {matches.data && matches.data.length > 0 ? (
        <FlatList
          data={matches.data}
          keyExtractor={(m: any) => m.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}
          renderItem={({ item }: { item: any }) => {
            const other = role === 'talent' ? item.company : item.talent;
            const pending = item.moderation_status === 'pending_admin';
            return (
              <Pressable
                onPress={() => router.push(`/chat/${item.id}`)}
                className="bg-surface rounded-card p-4 flex-row items-center gap-3 border border-border active:opacity-80"
              >
                <Avatar id={other?.id ?? item.id} name={other?.full_name} uri={other?.photo_url} size={52} />
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-fg font-semibold text-base" numberOfLines={1}>
                      {other?.full_name ?? '—'}
                    </Text>
                    {other?.is_verified ? <VerifiedBadge size={15} /> : null}
                  </View>
                  <Text className="text-muted text-sm" numberOfLines={1}>
                    {item.mission?.title ?? ''}
                  </Text>
                </View>
                {pending ? <StatusPill label={t('match.pending')} color="warning" /> : <Text className="text-muted">›</Text>}
              </Pressable>
            );
          }}
        />
      ) : (
        <EmptyState emoji="💌" title={t('matches.empty')} description={t('matches.emptyDesc')} />
      )}
    </Screen>
  );
}
