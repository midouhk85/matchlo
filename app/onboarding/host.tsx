import { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { notify } from '@/lib/confirm';
import { useTranslation } from 'react-i18next';

import { Screen, Heading, Subtitle, Button, TextField, TextArea, ChipGroup } from '@/components/ui';
import { SelectField } from '@/components/Picker';
import { LocationField } from '@/components/LocationField';
import { WILAYAS, LANGUAGES, EVENT_TYPES, GENDERS, AVAILABILITY } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';
import { uploadImage, pickImage } from '@/lib/upload';
import type { Coords } from '@/lib/location';

const TOTAL = 3;

export default function HostOnboarding() {
  const { t } = useTranslation();
  const { session, refreshProfile } = useSession();
  const userId = session?.user.id;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Étape 1 — photos (uris locales)
  const [photos, setPhotos] = useState<string[]>([]);
  // Étape 2 — infos
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  // Étape 3 — pro
  const [height, setHeight] = useState('');
  const [experience, setExperience] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [dailyRate, setDailyRate] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  async function addPhoto() {
    if (photos.length >= 6) return;
    const uri = await pickImage();
    if (uri) setPhotos((p) => [...p, uri]);
  }

  function isAdult(dateStr: string): boolean {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
    return age >= 18;
  }

  // Validation par étape
  const canNext =
    step === 1
      ? photos.length >= 2
      : step === 2
        ? !!firstName && !!lastName && isAdult(birthDate) && !!gender && !!wilaya && languages.length > 0
        : eventTypes.length > 0 && !!dailyRate;

  async function finish() {
    if (!userId) return;
    setSubmitting(true);
    try {
      // 1) Téléverse les photos → première = portrait principal
      const uploaded: string[] = [];
      for (const uri of photos) {
        const { publicUrl } = await uploadImage('photos', uri, userId);
        if (publicUrl) uploaded.push(publicUrl);
      }

      // 2) Profil de base (role talent)
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

      // 3) Détails talent (hôte/hôtesse)
      const { error: tErr } = await supabase.from('talent_profiles').insert({
        profile_id: userId,
        talent_type: 'host',
        birth_date: birthDate,
        gender,
        bio: bio || null,
        height_cm: height ? parseInt(height, 10) : null,
        experience_years: experience ? parseInt(experience, 10) : null,
        event_types: eventTypes,
        daily_rate_dzd: dailyRate ? parseInt(dailyRate, 10) : null,
        availability,
      });
      if (tErr) throw tErr;

      await refreshProfile(); // l'AuthGuard route vers l'espace talent
    } catch (e: any) {
      notify(t('common.error'), e.message ?? '');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <View className="flex-1 px-6 py-6 gap-6">
        {/* Progression */}
        <View className="gap-2">
          <Text className="text-muted text-sm">{t('onboarding.step', { current: step, total: TOTAL })}</Text>
          <View className="flex-row gap-2">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <View
                key={i}
                className={`flex-1 h-1.5 rounded-pill ${i < step ? 'bg-primary' : 'bg-surface-alt'}`}
              />
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
                    <View className="absolute bottom-1 left-1 bg-primary px-2 py-0.5 rounded-pill">
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
            <SelectField label={t('onboarding.gender')} value={gender} options={GENDERS} onChange={setGender} />
            <SelectField label={t('onboarding.wilaya')} value={wilaya} options={WILAYAS} onChange={setWilaya} />
            <View className="gap-2">
              <Text className="text-muted font-medium text-sm">{t('onboarding.languages')}</Text>
              <ChipGroup
                options={LANGUAGES}
                values={languages}
                onToggle={(v) => toggle(languages, setLanguages, v)}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="gap-4">
            <Heading>{t('onboarding.proTitle')}</Heading>
            <View className="flex-row gap-3">
              <TextField
                className="flex-1"
                label={t('onboarding.height')}
                keyboardType="number-pad"
                value={height}
                onChangeText={setHeight}
              />
              <TextField
                className="flex-1"
                label={t('onboarding.experience')}
                keyboardType="number-pad"
                value={experience}
                onChangeText={setExperience}
              />
            </View>
            <View className="gap-2">
              <Text className="text-muted font-medium text-sm">{t('onboarding.eventTypes')}</Text>
              <ChipGroup
                options={EVENT_TYPES}
                values={eventTypes}
                onToggle={(v) => toggle(eventTypes, setEventTypes, v)}
              />
            </View>
            <TextField
              label={t('onboarding.dailyRate')}
              keyboardType="number-pad"
              value={dailyRate}
              onChangeText={setDailyRate}
            />
            <View className="gap-2">
              <Text className="text-muted font-medium text-sm">{t('onboarding.availability')}</Text>
              <ChipGroup
                options={AVAILABILITY}
                values={availability}
                onToggle={(v) => toggle(availability, setAvailability, v)}
              />
            </View>
            <TextArea
              label={t('onboarding.bio')}
              placeholder={t('onboarding.bioPlaceholder')}
              value={bio}
              onChangeText={setBio}
            />
            <LocationField coords={coords} onCaptured={setCoords} />
          </View>
        )}

        {/* Navigation */}
        <View className="flex-row gap-3 mt-2">
          {step > 1 && (
            <Button label={t('common.back')} variant="outline" className="flex-1" onPress={() => setStep((s) => s - 1)} />
          )}
          {step < TOTAL ? (
            <Button label={t('common.next')} className="flex-1" disabled={!canNext} onPress={() => setStep((s) => s + 1)} />
          ) : (
            <Button label={t('common.finish')} className="flex-1" disabled={!canNext} loading={submitting} onPress={finish} />
          )}
        </View>
      </View>
    </Screen>
  );
}
