import { useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Screen, Heading, EmptyState, FullLoader, Button } from '@/components/ui';
import { SwipeDeck, type SwipeDeckHandle, type SwipeDir } from '@/components/SwipeDeck';
import { MissionCard, SwipeButtons } from '@/components/cards';
import { FiltersModal, type DeckFilters } from '@/components/FiltersModal';
import { MatchModal } from '@/components/MatchModal';
import { fetchTalentDeck, processSwipe, type SwipeResult } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function Discover() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const deckRef = useRef<SwipeDeckHandle>(null);

  const [filters, setFilters] = useState<DeckFilters>({ wilaya: null, radiusKm: null });
  const [showFilters, setShowFilters] = useState(false);
  const [matchInfo, setMatchInfo] = useState<SwipeResult | null>(null);

  const deck = useQuery({
    queryKey: ['talentDeck', filters],
    queryFn: () => fetchTalentDeck(filters.wilaya, filters.radiusKm),
  });

  // Noms des entreprises pour les cartes
  const companies = useQuery({
    queryKey: ['deckCompanies', deck.data?.map((m: any) => m.company_id)],
    enabled: !!deck.data?.length,
    queryFn: async () => {
      const ids = [...new Set((deck.data ?? []).map((m: any) => m.company_id).filter(Boolean))];
      if (!ids.length) return {} as Record<string, string>;
      const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids as string[]);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name ?? ''])) as Record<string, string>;
    },
  });

  async function handleSwipe(mission: any, dir: SwipeDir) {
    try {
      const res = await processSwipe(mission.id, null, dir);
      if (res.matched) setMatchInfo(res);
    } catch {
      // erreur silencieuse côté UX ; le swipe reste enregistré au prochain essai
    }
  }

  if (deck.isLoading) return <FullLoader />;

  return (
    <Screen edges={['top']}>
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <Heading>{t('deck.talentTitle')}</Heading>
        <Pressable
          onPress={() => setShowFilters(true)}
          className="h-10 px-4 rounded-pill bg-surface border border-border flex-row items-center gap-2 active:opacity-80"
        >
          <Text className="text-fg text-sm font-medium">⚙︎ {t('deck.filters')}</Text>
        </Pressable>
      </View>

      <View className="flex-1 px-5">
        {deck.data && deck.data.length > 0 ? (
          <SwipeDeck
            ref={deckRef}
            data={deck.data}
            keyExtractor={(m: any) => m.id}
            onSwipe={handleSwipe}
            renderCard={(m: any, overlay) => (
              <MissionCard mission={m} overlay={overlay} companyName={companies.data?.[m.company_id]} />
            )}
          />
        ) : (
          <EmptyState
            emoji="🎯"
            title={t('deck.empty')}
            description={t('deck.emptyDesc')}
            action={<Button label={t('deck.filters')} variant="outline" onPress={() => setShowFilters(true)} />}
          />
        )}
      </View>

      {deck.data && deck.data.length > 0 ? (
        <SwipeButtons onSwipe={(d) => deckRef.current?.swipe(d)} />
      ) : null}

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
