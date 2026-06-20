import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { FullLoader } from '@/components/ui';
import { COLORS } from '@/constants/colors';
import { formatDZD } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';
import { confirmAction, notify } from '@/lib/confirm';

/**
 * Écran d'engagement — pilote le flux « double feu vert » influenceur (§5) :
 * gate admin → confirmation de paiement (influenceur) → livrable → validation
 * entreprise → terminé → évaluation. Bouton litige à tout moment.
 */
export default function EngagementScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { profile } = useSession();
  const role = profile?.role;

  const [busy, setBusy] = useState(false);
  const [deliverableOpen, setDeliverableOpen] = useState(false);
  const [link, setLink] = useState('');
  const [rateOpen, setRateOpen] = useState(false);

  const q = useQuery({
    queryKey: ['engagement', matchId],
    queryFn: async () => {
      const { data: match, error } = await supabase
        .from('matches')
        .select('*, mission:missions(*), company:profiles!matches_company_id_fkey(id, full_name), talent:profiles!matches_talent_id_fkey(id, full_name)')
        .eq('id', String(matchId))
        .single();
      if (error) throw error;
      const { data: eng } = await supabase.from('engagements').select('*').eq('match_id', String(matchId)).maybeSingle();
      const { data: rating } = await supabase
        .from('ratings')
        .select('id')
        .eq('engagement_id', eng?.id ?? '00000000-0000-0000-0000-000000000000')
        .eq('rater_id', profile!.id)
        .maybeSingle();
      return { match: match as any, eng, alreadyRated: !!rating };
    },
  });

  async function patchEngagement(patch: Record<string, any>) {
    if (!q.data?.eng) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('engagements').update(patch as any).eq('id', q.data.eng.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['engagement', matchId] });
      qc.invalidateQueries({ queryKey: ['talentEngagements'] });
    } catch (e: any) {
      notify(t('common.error'), e.message ?? '');
    } finally {
      setBusy(false);
    }
  }

  async function openDispute() {
    const m = q.data?.match;
    if (!m || !profile) return;
    const otherId = role === 'talent' ? m.company?.id : m.talent?.id;
    setBusy(true);
    try {
      await supabase.from('reports').insert({
        reporter_id: profile.id,
        target_id: otherId,
        reason: 'arnaque/fraude',
        details: `Litige mission ${m.mission?.title ?? ''}`,
      });
      await supabase.from('engagements').update({ status: 'disputed' }).eq('id', q.data!.eng!.id);
      await qc.invalidateQueries({ queryKey: ['engagement', matchId] });
      notify(t('engagement.disputeOpened'));
    } catch (e: any) {
      notify(t('common.error'), e.message ?? '');
    } finally {
      setBusy(false);
    }
  }

  async function submitRating(stars: number, comment: string) {
    const m = q.data?.match;
    if (!m || !profile || !q.data?.eng) return;
    const ratee = role === 'talent' ? m.company?.id : m.talent?.id;
    setBusy(true);
    try {
      const { error } = await supabase.from('ratings').insert({
        engagement_id: q.data.eng.id,
        rater_id: profile.id,
        ratee_id: ratee,
        stars,
        comment: comment || null,
      });
      if (error) throw error;
      setRateOpen(false);
      await qc.invalidateQueries({ queryKey: ['engagement', matchId] });
      notify(t('rating.done'));
    } catch (e: any) {
      notify(t('common.error'), e.message ?? '');
    } finally {
      setBusy(false);
    }
  }

  if (q.isLoading || !q.data) return <FullLoader light />;
  const { match, eng, alreadyRated } = q.data;
  const mission = match.mission;
  const isInfluencer = mission?.mission_type === 'influencer';
  const isTalent = role === 'talent';
  const mod = match.moderation_status;
  const st = eng?.status ?? 'proposed';
  const pendingGate = isInfluencer && mod === 'pending_admin';

  return (
    <SafeAreaView className="flex-1 bg-light-bg" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </Pressable>
        <Text className="text-ink font-semibold text-base ml-2">{t('engagement.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* Récap mission */}
        <View className="bg-light-surface rounded-card p-5 gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-ink-muted text-sm">{isInfluencer ? '📸 ' + t('mission.influencer') : '📍 ' + t('mission.onsite')}</Text>
            <StatePill status={st} pendingGate={pendingGate} t={t} />
          </View>
          <Text className="text-ink font-bold text-xl">{mission?.title}</Text>
          <Text className="text-ink-muted text-sm">
            {(isTalent ? match.company?.full_name : match.talent?.full_name) ?? ''} · 💰 {formatDZD(mission?.pay_dzd)}
          </Text>
        </View>

        {/* Gate de modération admin */}
        {pendingGate ? (
          <Banner emoji="⏳" title={t('engagement.pendingAdmin')} desc={t('engagement.pendingAdminDesc')} />
        ) : (
          <>
            {/* Message neutre conformité §5/§6.1 pour les missions influenceur */}
            {isInfluencer ? (
              <View className="bg-[#EEF2FF] rounded-card p-4">
                <Text className="text-ink text-sm">{t('engagement.paymentNeutral')}</Text>
              </View>
            ) : null}

            {/* Étapes du flux influenceur */}
            {isInfluencer && (st === 'awaiting_payment' || st === 'proposed') ? (
              isTalent ? (
                <Action
                  label={t('engagement.confirmPayment')}
                  color={COLORS.success}
                  busy={busy}
                  onPress={() =>
                    confirmAction(t('engagement.confirmPayment'), t('engagement.confirmPaymentQ'), () =>
                      patchEngagement({ status: 'in_progress', payment_confirmed_at: new Date().toISOString(), payment_confirmed_by: profile!.id }),
                    )
                  }
                />
              ) : (
                <Info text={t('engagement.awaitingPayment')} />
              )
            ) : null}

            {isInfluencer && st === 'in_progress' ? (
              isTalent ? (
                <Action label={t('engagement.submitDeliverable')} color={COLORS.secondary} busy={busy} onPress={() => setDeliverableOpen(true)} />
              ) : (
                <Info text={t('engagement.inProgress')} />
              )
            ) : null}

            {st === 'delivered' ? (
              <View className="gap-3">
                {eng?.deliverable_proof ? (
                  <Pressable onPress={() => Linking.openURL(eng.deliverable_proof!)} className="bg-light-surface rounded-card p-4">
                    <Text className="text-ink-muted text-xs">{t('engagement.deliverableProof')}</Text>
                    <Text className="text-primary text-sm" numberOfLines={1}>{eng.deliverable_proof}</Text>
                  </Pressable>
                ) : null}
                {!isTalent ? (
                  <Action
                    label={t('engagement.validateDeliverable')}
                    color={COLORS.success}
                    busy={busy}
                    onPress={() => confirmAction(t('engagement.validateDeliverable'), t('engagement.validateQ'), () => patchEngagement({ status: 'completed' }))}
                  />
                ) : (
                  <Info text={t('engagement.awaitingValidation')} />
                )}
              </View>
            ) : null}

            {st === 'completed' ? (
              <View className="gap-3">
                <Banner emoji="🎉" title={t('engagement.completed')} />
                {!alreadyRated ? (
                  <Action label={t('rating.rate')} color={COLORS.warning} busy={busy} onPress={() => setRateOpen(true)} />
                ) : null}
              </View>
            ) : null}

            {st === 'disputed' ? <Banner emoji="⚠️" title={t('engagement.disputed')} /> : null}

            {/* Discussion */}
            <Pressable onPress={() => router.replace(`/chat/${match.id}`)} className="bg-light-surface rounded-card p-4 flex-row items-center justify-between">
              <Text className="text-ink font-medium">💬 {t('engagement.openChat')}</Text>
              <Text className="text-ink-muted">›</Text>
            </Pressable>

            {/* Litige (pendant la production / livraison) */}
            {['in_progress', 'delivered'].includes(st) ? (
              <Pressable
                onPress={() => confirmAction(t('engagement.dispute'), t('engagement.disputeQ'), openDispute, { confirmLabel: t('engagement.dispute') })}
                className="items-center py-2"
              >
                <Text className="text-danger font-medium">⚑ {t('engagement.dispute')}</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Modale soumission livrable */}
      <Modal visible={deliverableOpen} transparent animationType="slide" onRequestClose={() => setDeliverableOpen(false)}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setDeliverableOpen(false)}>
          <Pressable className="bg-light-surface rounded-t-card p-6 gap-4" onPress={() => {}}>
            <Text className="text-ink font-bold text-lg">{t('engagement.submitDeliverable')}</Text>
            <TextInput
              value={link}
              onChangeText={setLink}
              autoCapitalize="none"
              placeholder={t('engagement.deliverableLink')}
              placeholderTextColor={COLORS.inkMuted}
              className="bg-light-bg text-ink rounded-md px-4 h-12 border border-[#E2E8F0]"
            />
            <Pressable
              disabled={!link.trim() || busy}
              onPress={async () => {
                await patchEngagement({ status: 'delivered', deliverable_proof: link.trim() });
                setDeliverableOpen(false);
                setLink('');
              }}
              className={`h-12 rounded-md items-center justify-center ${link.trim() ? 'bg-primary' : 'bg-[#CBD5E1]'}`}
            >
              <Text className="text-fg font-semibold">{t('common.send')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modale évaluation */}
      <RatingModal visible={rateOpen} onClose={() => setRateOpen(false)} onSubmit={submitRating} busy={busy} t={t} />
    </SafeAreaView>
  );
}

function StatePill({ status, pendingGate, t }: { status: string; pendingGate: boolean; t: any }) {
  const label = pendingGate ? t('engagement.pendingAdmin') : status;
  const color = pendingGate ? COLORS.warning : status === 'completed' ? COLORS.success : status === 'disputed' ? COLORS.danger : COLORS.primary;
  return (
    <View className="px-3 h-7 rounded-pill items-center justify-center" style={{ backgroundColor: color + '22' }}>
      <Text className="text-xs font-semibold" style={{ color }}>{label}</Text>
    </View>
  );
}

function Banner({ emoji, title, desc }: { emoji: string; title: string; desc?: string }) {
  return (
    <View className="bg-light-surface rounded-card p-5 items-center gap-2">
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
      <Text className="text-ink font-semibold text-base text-center">{title}</Text>
      {desc ? <Text className="text-ink-muted text-sm text-center">{desc}</Text> : null}
    </View>
  );
}

function Info({ text }: { text: string }) {
  return (
    <View className="bg-light-surface rounded-card p-4">
      <Text className="text-ink-muted text-sm text-center">{text}</Text>
    </View>
  );
}

function Action({ label, color, onPress, busy }: { label: string; color: string; onPress: () => void; busy: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={busy} className="h-12 rounded-md items-center justify-center" style={{ backgroundColor: color, opacity: busy ? 0.6 : 1 }}>
      <Text className="text-fg font-semibold text-base">{label}</Text>
    </Pressable>
  );
}

function RatingModal({ visible, onClose, onSubmit, busy, t }: { visible: boolean; onClose: () => void; onSubmit: (s: number, c: string) => void; busy: boolean; t: any }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable className="bg-light-surface rounded-t-card p-6 gap-4" onPress={() => {}}>
          <Text className="text-ink font-bold text-lg">{t('rating.title')}</Text>
          <Text className="text-ink-muted text-sm">{t('rating.subtitle')}</Text>
          <View className="flex-row justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable key={s} onPress={() => setStars(s)}>
                <Text style={{ fontSize: 36 }}>{s <= stars ? '⭐' : '☆'}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={t('rating.comment')}
            placeholderTextColor={COLORS.inkMuted}
            multiline
            className="bg-light-bg text-ink rounded-md px-4 py-3 min-h-[80px] border border-[#E2E8F0]"
          />
          <Pressable onPress={() => onSubmit(stars, comment)} disabled={busy} className="h-12 rounded-md bg-primary items-center justify-center" style={{ opacity: busy ? 0.6 : 1 }}>
            <Text className="text-fg font-semibold">{t('rating.submit')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
