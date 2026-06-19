import { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Screen, Heading, EmptyState, FullLoader, Button } from '@/components/ui';
import { SwipeDeck, type SwipeDeckHandle, type SwipeDir } from '@/components/SwipeDeck';
import { TalentCard, SwipeButtons } from '@/components/cards';
import { FiltersModal, type DeckFilters } from '@/components/FiltersModal';
import { MatchModal } from '@/components/MatchModal';
import { fetchCompanyDeck, processSwipe, type SwipeResult } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';

export default function Candidates() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { profile } = useSession();
  const deckRef = useRef<SwipeDeckHandle>(null);

  const [missionId, setMissionId] = useState<string | null>(null);
  const [filters, setFilters] = useState<DeckFilters>({ wilaya: null, radiusKm: null });
  const [showFilters, setShowFilters] = useState(false);
  const [matchInfo, setMatchInfo] = useState<SwipeResult | null>(null);

  // Annonces actives de l'entreprise
  const missions = useQuery({
    queryKey: ['myMissions', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('id, title, status')
        .eq('company_id', profile!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Sélectionne la première annonce par défaut
  useEffect(() => {
    if (!missionId && missions.data?.length) setMissionId(missions.data[0].id);
  }, [missions.data]);

  const deck = useQuery({
    queryKey: ['companyDeck', missionId, filters],
    enabled: !!missionId,
    queryFn: () => fetchCompanyDeck(missionId!, filters.wilaya, filters.radiusKm),
  });

  async function handleSwipe(talent: any, dir: SwipeDir) {
    if (!missionId) return;
    try {
      const res = await processSwipe(missionId, talent.id, dir);
      if (res.matched) setMatchInfo(res);
    } catch {
      /* swipe ré-essayable */
    }
  }

  if (missions.isLoading) return <FullLoader />;

  if (!missions.data?.length) {
    return (
      <Screen edges={['top']}>
        <View className="px-5 pt-2 pb-3">
          <Heading>{t('deck.companyTitle')}</Heading>
        </View>
        <EmptyState
          emoji="📢"
          title={t('deck.noMissions')}
          description={t('deck.selectMission')}
          action={<Button label={t('tabs.ads')} onPress={() => router.push('/(company)/ads')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View className="px-5 pt-2 pb-2 flex-row items-center justify-between">
        <Heading>{t('deck.companyTitle')}</Heading>
        <Pressable
          onPress={() => setShowFilters(true)}
          className="h-10 px-4 rounded-pill bg-surface border border-border flex-row items-center active:opacity-80"
        >
          <Text className="text-fg text-sm font-medium">⚙︎ {t('deck.filters')}</Text>
        </Pressable>
      </View>

      {/* Sélecteur d'annonce */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-12 px-5" contentContainerStyle={{ gap: 8 }}>
        {missions.data.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setMissionId(m.id)}
            className={`px-4 h-9 rounded-pill items-center justify-center border ${
              missionId === m.id ? 'bg-primary border-primary' : 'bg-surface-alt border-border'
            }`}
          >
            <Text className={`text-sm font-medium ${missionId === m.id ? 'text-fg' : 'text-muted'}`} numberOfLines={1}>
              {m.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View className="flex-1 px-5 pt-3">
        {deck.isLoading ? (
          <FullLoader />
        ) : deck.data && deck.data.length > 0 ? (
          <SwipeDeck
            ref={deckRef}
            data={deck.data}
            keyExtractor={(tl: any) => tl.id}
            onSwipe={handleSwipe}
            renderCard={(tl: any, overlay) => <TalentCard talent={tl} overlay={overlay} />}
          />
        ) : (
          <EmptyState emoji="🔎" title={t('deck.empty')} description={t('deck.emptyDesc')} />
        )}
      </View>

      {deck.data && deck.data.length > 0 ? <SwipeButtons onSwipe={(d) => deckRef.current?.swipe(d)} /> : null}

      <FiltersModal
        visible={showFilters}
        initial={filters}
        onClose={() => setShowFilters(false)}
        onApply={(f) => {
          setFilters(f);
          setShowFilters(false);
        }}
      />

      <MatchModal
        visible={!!matchInfo}
        pending={matchInfo?.moderation_status === 'pending_admin'}
        onChat={() => {
          const id = matchInfo?.match_id;
          setMatchInfo(null);
          qc.invalidateQueries({ queryKey: ['matches'] });
          if (id) router.push(`/chat/${id}`);
        }}
        onContinue={() => {
          setMatchInfo(null);
          qc.invalidateQueries({ queryKey: ['matches'] });
        }}
      />
    </Screen>
  );
}
