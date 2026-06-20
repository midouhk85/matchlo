import { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen, Heading, Subtitle, Button, TextField, TextArea, ChipGroup } from '@/components/ui';
import { SelectField } from '@/components/Picker';
import { LocationField } from '@/components/LocationField';
import { notify } from '@/lib/confirm';
import { WILAYAS, LANGUAGES, NICHES, DELIVERABLES, SOCIAL_NETWORKS } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';
import { uploadImage, pickImage } from '@/lib/upload';
import type { Coords } from '@/lib/location';

const TOTAL = 3;

/** Onboarding influenceur (variante 3 étapes) — cf. §2 ② & §14. */
export default function InfluencerOnboarding() {
  const { t } = useTranslation();
  const { session, refreshProfile } = useSession();
  const userId = session?.user.id;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  // Réseaux : { Instagram: { handle, followers } }
  const [networks, setNetworks] = useState<Record<string, { handle: string; followers: string }>>({});
  const [niches, setNiches] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [ratePerPost, setRatePerPost] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }
  function toggleNetwork(net: string) {
    setNetworks((prev) => {
      const next = { ...prev };
      if (next[net]) delete next[net];
      else next[net] = { handle: '', followers: '' };
      return next;
    });
  }
  function setNet(net: string, field: 'handle' | 'followers', val: string) {
    setNetworks((prev) => ({ ...prev, [net]: { ...prev[net], [field]: val } }));
  }

  async function addPhoto() {
    if (photos.length >= 6) return;
    const uri = await pickImage();
    if (uri) setPhotos((p) => [...p, uri]);
  }
  function isAdult(s: string) {
    const d = new Date(s);
    if (isNaN(d.getTime())) return false;
    return (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000) >= 18;
  }

  const hasNetwork = Object.keys(networks).length > 0;
  const canNext =
    step === 1
      ? photos.length >= 2
      : step === 2
        ? !!firstName && !!lastName && isAdult(birthDate) && !!wilaya && languages.length > 0
        : hasNetwork && niches.length > 0 && deliverables.length > 0 && !!ratePerPost;

  async function finish() {
    if (!userId) return;
    setSubmitting(true);
    try {
      const uploaded: string[] = [];
      for (const uri of photos) {
        const { publicUrl } = await uploadImage('photos', uri, userId);
        if (publicUrl) uploaded.push(publicUrl);
      }

      // social_handles jsonb : {"instagram":{"handle":"@x","followers":12000}}
      const socialHandles: Record<string, { handle: string; followers: number }> = {};
      for (const [net, v] of Object.entries(networks)) {
        socialHandles[net.toLowerCase()] = {
          handle: v.handle,
          followers: v.followers ? parseInt(v.followers, 10) : 0,
        };
      }
      const portfolioUrls = portfolio
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const { error: pErr } = await supabase.from('profiles').insert({
        id: userId,
        role: 'talent',
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        wilaya,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        languages,
        photo_url: uploaded[0] ?? null,
      });
      if (pErr) throw pErr;

      const { error: tErr } = await supabase.from('talent_profiles').insert({
        profile_id: userId,
        talent_type: 'influencer',
        birth_date: birthDate,
        social_handles: socialHandles,
        niches,
        deliverable_types: deliverables,
        rate_per_post_dzd: ratePerPost ? parseInt(ratePerPost, 10) : null,
        portfolio_urls: portfolioUrls,
      });
      if (tErr) throw tErr;

      await refreshProfile();
    } catch (e: any) {
      notify(t('common.error'), e.message ?? '');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <View className="flex-1 px-6 py-6 gap-6">
        <View className="gap-2">
          <Text className="text-muted text-sm">{t('onboarding.step', { current: step, total: TOTAL })}</Text>
          <View className="flex-row gap-2">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <View key={i} className={`flex-1 h-1.5 rounded-pill ${i < step ? 'bg-secondary' : 'bg-surface-alt'}`} />
            ))}
          </View>
        </View>

        {step === 1 && (
          <View className="gap-4">
            <Heading>{t('onboarding.photosTitle')}</Heading>
            <Subtitle>{t('onboarding.photosSubtitle')}</Subtitle>
            <View className="flex-row flex-wrap gap-3">
              {photos.map((uri, i) => (
                <View key={uri} className="relative">
                  <Image source={{ uri }} style={{ width: 100, height: 130, borderRadius: 14 }} />
                  {i === 0 && (
                    <View className="absolute bottom-1 left-1 bg-secondary px-2 py-0.5 rounded-pill">
                      <Text className="text-fg text-xs font-semibold">1</Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => setPhotos((p) => p.filter((u) => u !== uri))}
                    className="absolute -top-2 -right-2 bg-danger w-6 h-6 rounded-pill items-center justify-center"
                  >
                    <Text className="text-fg font-bold">×</Text>
                  </Pressable>
                </View>
              ))}
              {photos.length < 6 && (
                <Pressable
                  onPress={addPhoto}
                  className="w-[100px] h-[130px] rounded-md border border-dashed border-border bg-surface-alt items-center justify-center"
                >
                  <Text className="text-muted text-2xl">＋</Text>
                  <Text className="text-muted text-xs mt-1">{t('onboarding.addPhoto')}</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {step === 2 && (
          <View className="gap-4">
            <Heading>{t('onboarding.infoTitle')}</Heading>
            <TextField label={t('onboarding.firstName')} value={firstName} onChangeText={setFirstName} />
            <TextField label={t('onboarding.lastName')} value={lastName} onChangeText={setLastName} />
            <TextField
              label={t('onboarding.birthDate')}
              placeholder="AAAA-MM-JJ"
              value={birthDate}
              onChangeText={setBirthDate}
              error={birthDate && !isAdult(birthDate) ? t('onboarding.minor') : undefined}
            />
            <SelectField label={t('onboarding.wilaya')} value={wilaya} options={WILAYAS} onChange={setWilaya} />
            <View className="gap-2">
              <Text className="text-muted font-medium text-sm">{t('onboarding.languages')}</Text>
              <ChipGroup options={LANGUAGES} values={languages} onToggle={(v) => toggle(languages, setLanguages, v)} />
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="gap-4">
            <Heading>{t('onboarding.creatorTitle')}</Heading>

            <View className="gap-2">
              <Text className="text-muted font-medium text-sm">{t('onboarding.networks')}</Text>
              <ChipGroup options={SOCIAL_NETWORKS} values={Object.keys(networks)} onToggle={toggleNetwork} />
            </View>

            {Object.keys(networks).map((net) => (
              <View key={net} className="bg-surface rounded-card p-4 gap-3 border border-border">
                <Text className="text-fg font-semibold">{net}</Text>
                <TextField
                  label={t('onboarding.handle')}
                  placeholder="@votrecompte"
                  autoCapitalize="none"
                  value={networks[net].handle}
                  onChangeText={(v) => setNet(net, 'handle', v)}
                />
                <TextField
                  label={t('onboarding.followers')}
                  keyboardType="number-pad"
                  value={networks[net].followers}
                  onChangeText={(v) => setNet(net, 'followers', v)}
                />
              </View>
            ))}

            <View className="gap-2">
              <Text className="text-muted font-medium text-sm">{t('onboarding.niches')}</Text>
              <ChipGroup options={NICHES} values={niches} onToggle={(v) => toggle(niches, setNiches, v)} />
            </View>
            <View className="gap-2">
              <Text className="text-muted font-medium text-sm">{t('onboarding.deliverables')}</Text>
              <ChipGroup options={DELIVERABLES} values={deliverables} onToggle={(v) => toggle(deliverables, setDeliverables, v)} />
            </View>
            <TextField label={t('onboarding.ratePerPost')} keyboardType="number-pad" value={ratePerPost} onChangeText={setRatePerPost} />
            <TextArea label={t('onboarding.portfolio')} placeholder={t('onboarding.portfolioPlaceholder')} value={portfolio} onChangeText={setPortfolio} />
            <LocationField coords={coords} onCaptured={setCoords} />
          </View>
        )}

        <View className="flex-row gap-3 mt-2">
          {step > 1 && (
            <Button label={t('common.back')} variant="outline" className="flex-1" onPress={() => setStep((s) => s - 1)} />
          )}
          {step < TOTAL ? (
            <Button label={t('common.next')} variant="secondary" className="flex-1" disabled={!canNext} onPress={() => setStep((s) => s + 1)} />
          ) : (
            <Button label={t('common.finish')} variant="secondary" className="flex-1" disabled={!canNext} loading={submitting} onPress={finish} />
          )}
        </View>
      </View>
    </Screen>
  );
}
