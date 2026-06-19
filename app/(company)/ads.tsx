import { useState } from 'react';
import { View, Text, FlatList, Pressable, Modal, ScrollView, Alert, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Screen, Heading, Button, TextField, FullLoader, EmptyState, StatusPill } from '@/components/ui';
import { SelectField } from '@/components/Picker';
import { LocationField } from '@/components/LocationField';
import { WILAYAS, EVENT_TYPES, formatDZD } from '@/constants/data';
import { COLORS } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';
import type { Coords } from '@/lib/location';

export default function Ads() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { profile } = useSession();
  const [creating, setCreating] = useState(false);

  const missions = useQuery({
    queryKey: ['companyAds', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('company_id', profile!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (missions.isLoading) return <FullLoader />;

  return (
    <Screen edges={['top']}>
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <Heading>{t('tabs.ads')}</Heading>
        <Pressable
          onPress={() => setCreating(true)}
          className="h-10 px-4 rounded-pill bg-primary items-center justify-center active:opacity-80"
        >
          <Text className="text-fg font-semibold text-sm">＋ {t('deck.companyTitle')}</Text>
        </Pressable>
      </View>

      {missions.data && missions.data.length > 0 ? (
        <FlatList
          data={missions.data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}
          renderItem={({ item }) => (
            <View className="bg-surface rounded-card p-4 gap-2 border border-border">
              <View className="flex-row items-center justify-between">
                <Text className="text-fg font-semibold text-base flex-1" numberOfLines={1}>
                  {item.title}
                </Text>
                {item.is_urgent ? <StatusPill label={t('deck.urgent')} color="danger" /> : null}
              </View>
              <View className="flex-row gap-4 flex-wrap">
                <Text className="text-muted text-xs">📍 {item.wilaya ?? '—'}</Text>
                <Text className="text-muted text-xs">💰 {formatDZD(item.pay_dzd)}</Text>
                <Text className="text-muted text-xs">👥 {item.positions ?? '—'}</Text>
                <Text className="text-muted text-xs">• {item.status}</Text>
              </View>
            </View>
          )}
        />
      ) : (
        <EmptyState
          emoji="📢"
          title={t('deck.noMissions')}
          action={<Button label={t('deck.companyTitle')} onPress={() => setCreating(true)} />}
        />
      )}

      <CreateMissionModal
        visible={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          qc.invalidateQueries({ queryKey: ['companyAds'] });
          qc.invalidateQueries({ queryKey: ['myMissions'] });
        }}
      />
    </Screen>
  );
}

/** Formulaire de création d'annonce (mission présentielle, Phase 1). */
function CreateMissionModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const { profile } = useSession();

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<string | null>(null);
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [positions, setPositions] = useState('');
  const [pay, setPay] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [saving, setSaving] = useState(false);

  const valid = !!title && !!wilaya && !!pay;

  function reset() {
    setTitle('');
    setEventType(null);
    setWilaya(null);
    setStartDate('');
    setEndDate('');
    setPositions('');
    setPay('');
    setUrgent(false);
    setCoords(null);
  }

  async function create() {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('missions').insert({
        company_id: profile.id,
        title: title.trim(),
        mission_type: 'onsite',
        event_type: eventType,
        wilaya,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        start_date: startDate || null,
        end_date: endDate || null,
        positions: positions ? parseInt(positions, 10) : null,
        pay_dzd: pay ? parseInt(pay, 10) : null,
        is_urgent: urgent,
        status: 'active',
      });
      if (error) throw error;
      reset();
      onCreated();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? '');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface rounded-t-card max-h-[90%]">
          <View className="items-center py-3">
            <View className="w-10 h-1 rounded-pill bg-border" />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <Heading>{t('deck.companyTitle')}</Heading>
            <TextField label={t('mission.details')} value={title} onChangeText={setTitle} placeholder="Hôtesses pour salon…" />
            <SelectField label={t('onboarding.eventTypes')} value={eventType} options={EVENT_TYPES} onChange={setEventType} />
            <SelectField label={t('onboarding.wilaya')} value={wilaya} options={WILAYAS} onChange={setWilaya} />
            <View className="flex-row gap-3">
              <TextField className="flex-1" label={t('mission.from')} placeholder="AAAA-MM-JJ" value={startDate} onChangeText={setStartDate} />
              <TextField className="flex-1" label={t('mission.to')} placeholder="AAAA-MM-JJ" value={endDate} onChangeText={setEndDate} />
            </View>
            <View className="flex-row gap-3">
              <TextField className="flex-1" label={t('mission.positions')} keyboardType="number-pad" value={positions} onChangeText={setPositions} />
              <TextField className="flex-1" label={t('onboarding.dailyRate')} keyboardType="number-pad" value={pay} onChangeText={setPay} />
            </View>
            <View className="flex-row items-center justify-between bg-surface-alt rounded-md px-4 h-12 border border-border">
              <Text className="text-fg font-medium">{t('deck.urgent')}</Text>
              <Switch value={urgent} onValueChange={setUrgent} trackColor={{ true: COLORS.danger }} />
            </View>
            <LocationField coords={coords} onCaptured={setCoords} />
            <View className="flex-row gap-3 mt-2">
              <Button label={t('common.cancel')} variant="outline" className="flex-1" onPress={onClose} />
              <Button label={t('common.save')} className="flex-1" disabled={!valid} loading={saving} onPress={create} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
