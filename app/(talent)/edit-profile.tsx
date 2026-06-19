import { useState, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { notify } from '@/lib/confirm';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Screen, Heading, Button, TextField, TextArea, ChipGroup, FullLoader } from '@/components/ui';
import { SelectField } from '@/components/Picker';
import { LocationField } from '@/components/LocationField';
import { WILAYAS, LANGUAGES, EVENT_TYPES, AVAILABILITY } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';
import { uploadImage, pickImage } from '@/lib/upload';
import type { Coords } from '@/lib/location';

/** Édition du profil talent (hôte/hôtesse). Met à jour profiles + talent_profiles. */
export default function EditTalentProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { profile, refreshProfile } = useSession();
  const userId = profile?.id;

  const details = useQuery({
    queryKey: ['talentDetails', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('talent_profiles').select('*').eq('profile_id', userId!).maybeSingle();
      return data;
    },
  });

  const [photo, setPhoto] = useState<string | null>(null); // nouvelle photo locale
  const [fullName, setFullName] = useState('');
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [height, setHeight] = useState('');
  const [experience, setExperience] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [dailyRate, setDailyRate] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Pré-remplissage à partir des données existantes
  useEffect(() => {
    if (hydrated || !profile || details.isLoading) return;
    setFullName(profile.full_name ?? '');
    setWilaya(profile.wilaya ?? null);
    setLanguages(profile.languages ?? []);
    if (profile.latitude && profile.longitude) setCoords({ latitude: profile.latitude, longitude: profile.longitude });
    const d = details.data;
    if (d) {
      setBio(d.bio ?? '');
      setHeight(d.height_cm ? String(d.height_cm) : '');
      setExperience(d.experience_years ? String(d.experience_years) : '');
      setEventTypes(d.event_types ?? []);
      setDailyRate(d.daily_rate_dzd ? String(d.daily_rate_dzd) : '');
      setAvailability(d.availability ?? []);
    }
    setHydrated(true);
  }, [profile, details.data, details.isLoading]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  async function changePhoto() {
    const uri = await pickImage();
    if (uri) setPhoto(uri);
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    try {
      let photoUrl = profile?.photo_url ?? null;
      if (photo) {
        const { publicUrl } = await uploadImage('photos', photo, userId);
        if (publicUrl) photoUrl = publicUrl;
      }

      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          wilaya,
          languages,
          photo_url: photoUrl,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        })
        .eq('id', userId);
      if (pErr) throw pErr;

      const { error: tErr } = await supabase
        .from('talent_profiles')
        .update({
          bio: bio || null,
          height_cm: height ? parseInt(height, 10) : null,
          experience_years: experience ? parseInt(experience, 10) : null,
          event_types: eventTypes,
          daily_rate_dzd: dailyRate ? parseInt(dailyRate, 10) : null,
          availability,
        })
        .eq('profile_id', userId);
      if (tErr) throw tErr;

      await refreshProfile();
      qc.invalidateQueries({ queryKey: ['talentDetails', userId] });
      router.back();
    } catch (e: any) {
      notify(t('common.error'), e.message ?? '');
    } finally {
      setSaving(false);
    }
  }

  if (!profile || details.isLoading) return <FullLoader />;

  const currentPhoto = photo ?? profile.photo_url;

  return (
    <Screen scroll edges={['top']}>
      <View className="px-5 py-4 gap-5">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary text-2xl">‹</Text>
          </Pressable>
          <Heading>{t('profile.edit')}</Heading>
        </View>

        {/* Photo */}
        <View className="items-center gap-2">
          <Pressable onPress={changePhoto} className="active:opacity-80">
            {currentPhoto ? (
              <Image source={{ uri: currentPhoto }} style={{ width: 96, height: 96, borderRadius: 48 }} />
            ) : (
              <View className="w-24 h-24 rounded-pill bg-surface-alt border border-dashed border-border items-center justify-center">
                <Text className="text-muted text-2xl">＋</Text>
              </View>
            )}
          </Pressable>
          <Text className="text-primary text-sm">{t('onboarding.addPhoto')}</Text>
        </View>

        <TextField label={t('onboarding.firstName') + ' / ' + t('onboarding.lastName')} value={fullName} onChangeText={setFullName} />
        <SelectField label={t('onboarding.wilaya')} value={wilaya} options={WILAYAS} onChange={setWilaya} />

        <View className="gap-2">
          <Text className="text-muted font-medium text-sm">{t('onboarding.languages')}</Text>
          <ChipGroup options={LANGUAGES} values={languages} onToggle={(v) => toggle(languages, setLanguages, v)} />
        </View>

        <View className="flex-row gap-3">
          <TextField className="flex-1" label={t('onboarding.height')} keyboardType="number-pad" value={height} onChangeText={setHeight} />
          <TextField className="flex-1" label={t('onboarding.experience')} keyboardType="number-pad" value={experience} onChangeText={setExperience} />
        </View>

        <View className="gap-2">
          <Text className="text-muted font-medium text-sm">{t('onboarding.eventTypes')}</Text>
          <ChipGroup options={EVENT_TYPES} values={eventTypes} onToggle={(v) => toggle(eventTypes, setEventTypes, v)} />
        </View>

        <TextField label={t('onboarding.dailyRate')} keyboardType="number-pad" value={dailyRate} onChangeText={setDailyRate} />

        <View className="gap-2">
          <Text className="text-muted font-medium text-sm">{t('onboarding.availability')}</Text>
          <ChipGroup options={AVAILABILITY} values={availability} onToggle={(v) => toggle(availability, setAvailability, v)} />
        </View>

        <TextArea label={t('onboarding.bio')} placeholder={t('onboarding.bioPlaceholder')} value={bio} onChangeText={setBio} />
        <LocationField coords={coords} onCaptured={setCoords} />

        <Button label={t('common.save')} loading={saving} onPress={save} className="mt-2" />
      </View>
    </Screen>
  );
}
