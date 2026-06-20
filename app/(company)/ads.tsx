import { useState } from 'react';
import { View, Text, FlatList, Pressable, Modal, ScrollView, Switch } from 'react-native';
import { notify } from '@/lib/confirm';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Screen, Heading, Button, TextField, TextArea, ChipGroup, FullLoader, EmptyState, StatusPill } from '@/components/ui';
import { SelectField } from '@/components/Picker';
import { LocationField } from '@/components/LocationField';
import { WILAYAS, EVENT_TYPES, DELIVERABLES, formatDZD } from '@/constants/data';
import { COLORS } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';
import type { Coords } from '@/lib/location';
import type { TablesInsert } from '@/lib/database.types';

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

  const [missionType, setMissionType] = useState<'onsite' | 'influencer'>('onsite');
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<string | null>(null);
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [positions, setPositions] = useState('');
  const [pay, setPay] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  // Influenceur
  const [brief, setBrief] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const valid =
    missionType === 'onsite'
      ? !!title && !!wilaya && !!pay
      : !!title && !!brief && deliverables.length > 0 && !!pay;

  function reset() {
    setMissionType('onsite');
    setTitle('');
    setEventType(null);
    setWilaya(null);
    setStartDate('');
    setEndDate('');
    setPositions('');
    setPay('');
    setUrgent(false);
    setCoords(null);
    setBrief('');
    setDeliverables([]);
  }

  function toggleDeliverable(v: string) {
    setDeliverables((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));
  }

  async function create() {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const base = {
        company_id: profile.id,
        title: title.trim(),
        pay_dzd: pay ? parseInt(pay, 10) : null,
        status: 'active',
      };
      const payload: TablesInsert<'missions'> =
        missionType === 'onsite'
          ? {
              ...base,
              mission_type: 'onsite' as const,
              event_type: eventType,
              wilaya,
              latitude: coords?.latitude ?? null,
              longitude: coords?.longitude ?? null,
              start_date: startDate || null,
              end_date: endDate || null,
              positions: positions ? parseInt(positions, 10) : null,
              is_urgent: urgent,
            }
          : {
              ...base,
              mission_type: 'influencer' as const,
              wilaya: wilaya, // facultatif (mission à distance)
              end_date: endDate || null, // deadline
              positions: 1,
              required_profile: { brief: brief.trim(), deliverables },
            };
      const { error } = await supabase.from('missions').insert(payload);
      if (error) throw error;
      reset();
      onCreated();
    } catch (e: any) {
      // Quota d'annonces urgentes épuisé → rechargement sur le web (§6.1)
      if (typeof e?.message === 'string' && e.message.includes('quota_urgent')) {
        notify(t('billing.urgentQuotaEmpty'));
      } else {
        notify(t('common.error'), e.message ?? '');
      }
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

            {/* Sélecteur de type d'annonce */}
            <View className="gap-2">
              <Text className="text-muted font-medium text-sm">{t('mission.type')}</Text>
              <View className="flex-row gap-2">
                <TypeTab label={`📍 ${t('mission.onsite')}`} active={missionType === 'onsite'} onPress={() => setMissionType('onsite')} />
                <TypeTab label={`📸 ${t('mission.influencer')}`} active={missionType === 'influencer'} onPress={() => setMissionType('influencer')} />
              </View>
            </View>

            <TextField label={t('mission.details')} value={title} onChangeText={setTitle} placeholder={missionType === 'onsite' ? 'Hôtesses pour salon…' : 'Campagne lancement produit…'} />

            {missionType === 'onsite' ? (
              <>
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
              </>
            ) : (
              <>
                <TextArea label={t('mission.brief')} placeholder={t('mission.briefPlaceholder')} value={brief} onChangeText={setBrief} />
                <View className="gap-2">
                  <Text className="text-muted font-medium text-sm">{t('onboarding.deliverables')}</Text>
                  <ChipGroup options={DELIVERABLES} values={deliverables} onToggle={toggleDeliverable} />
                </View>
                <TextField label={t('mission.deadline')} placeholder="AAAA-MM-JJ" value={endDate} onChangeText={setEndDate} />
                <TextField label={t('onboarding.ratePerPost')} keyboardType="number-pad" value={pay} onChangeText={setPay} />
              </>
            )}

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

function TypeTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 h-11 rounded-md items-center justify-center border ${
        active ? 'bg-primary border-primary' : 'bg-surface-alt border-border'
      }`}
    >
      <Text className={`font-medium ${active ? 'text-fg' : 'text-muted'}`}>{label}</Text>
    </Pressable>
  );
}
