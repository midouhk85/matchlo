import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { FullLoader, VerifiedBadge } from '@/components/ui';
import { COLORS } from '@/constants/colors';
import { formatDZD } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { processSwipe } from '@/lib/api';

/** Détail de mission (vue talent) — thème clair (cf. charte §12). */
export default function MissionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const mission = useQuery({
    queryKey: ['mission', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('*, company:profiles!missions_company_id_fkey(full_name, is_verified)')
        .eq('id', String(id))
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  async function apply() {
    if (!mission.data) return;
    setApplying(true);
    try {
      await processSwipe(mission.data.id, null, 'like');
      setApplied(true);
    } finally {
      setApplying(false);
    }
  }

  if (mission.isLoading) return <FullLoader light />;
  const m = mission.data;

  return (
    <SafeAreaView className="flex-1 bg-light-bg" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </Pressable>
        <Text className="text-ink font-semibold text-base ml-2">{t('mission.details')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View className="bg-light-surface rounded-card p-5 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-ink-muted text-sm">{m.event_type ?? '—'}</Text>
            {m.is_urgent ? (
              <View className="bg-danger px-3 h-7 rounded-pill items-center justify-center">
                <Text className="text-fg text-xs font-bold">{t('deck.urgent')}</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-ink font-bold text-2xl">{m.title}</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-ink-muted text-sm">{m.company?.full_name}</Text>
            {m.company?.is_verified ? <VerifiedBadge size={14} /> : null}
          </View>
        </View>

        <View className="bg-light-surface rounded-card p-5 gap-4">
          <Row icon="💰" label={t('mission.pay')} value={formatDZD(m.pay_dzd)} />
          <Row icon="📍" label={t('onboarding.wilaya')} value={m.wilaya ?? '—'} />
          <Row
            icon="📅"
            label={t('mission.dates')}
            value={m.start_date ? `${t('mission.from')} ${m.start_date}${m.end_date ? ` ${t('mission.to')} ${m.end_date}` : ''}` : '—'}
          />
          <Row icon="👥" label={t('mission.positions')} value={String(m.positions ?? '—')} />
        </View>

        {m.required_profile ? (
          <View className="bg-light-surface rounded-card p-5 gap-2">
            <Text className="text-ink font-semibold text-base">{t('mission.profile')}</Text>
            <Text className="text-ink-muted text-sm">{JSON.stringify(m.required_profile, null, 2)}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="px-5 pb-2">
        <Pressable
          onPress={apply}
          disabled={applying || applied}
          className={`h-12 rounded-md items-center justify-center ${applied ? 'bg-success' : 'bg-primary'} ${applying ? 'opacity-60' : 'active:opacity-80'}`}
        >
          <Text className="text-fg font-semibold text-base">
            {applied ? `✓ ${t('mission.applied')}` : t('mission.apply')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <Text>{icon}</Text>
        <Text className="text-ink-muted text-sm">{label}</Text>
      </View>
      <Text className="text-ink font-medium text-sm flex-1 text-right" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
