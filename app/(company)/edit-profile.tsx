import { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Screen, Heading, Button, TextField, TextArea, FullLoader } from '@/components/ui';
import { SelectField } from '@/components/Picker';
import { LocationField } from '@/components/LocationField';
import { WILAYAS, SECTORS } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';
import { uploadImage, pickImage } from '@/lib/upload';
import type { Coords } from '@/lib/location';

/** Édition du profil entreprise. Met à jour profiles + company_profiles. */
export default function EditCompanyProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { profile, refreshProfile } = useSession();
  const userId = profile?.id;

  const company = useQuery({
    queryKey: ['companyDetails', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('company_profiles').select('*').eq('profile_id', userId!).maybeSingle();
      return data;
    },
  });

  const [logo, setLogo] = useState<string | null>(null);
  const [legalName, setLegalName] = useState('');
  const [sector, setSector] = useState<string | null>(null);
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [rc, setRc] = useState('');
  const [nif, setNif] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated || !profile || company.isLoading) return;
    setWilaya(profile.wilaya ?? null);
    if (profile.latitude && profile.longitude) setCoords({ latitude: profile.latitude, longitude: profile.longitude });
    const c = company.data;
    if (c) {
      setLegalName(c.legal_name ?? '');
      setSector(c.sector ?? null);
      setDescription(c.description ?? '');
      setRc(c.rc_number ?? '');
      setNif(c.nif ?? '');
    }
    setHydrated(true);
  }, [profile, company.data, company.isLoading]);

  async function changeLogo() {
    const uri = await pickImage();
    if (uri) setLogo(uri);
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    try {
      let logoUrl = profile?.photo_url ?? null;
      if (logo) {
        const { publicUrl } = await uploadImage('logos', logo, userId);
        if (publicUrl) logoUrl = publicUrl;
      }

      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          full_name: legalName.trim(),
          wilaya,
          photo_url: logoUrl,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        })
        .eq('id', userId);
      if (pErr) throw pErr;

      const { error: cErr } = await supabase
        .from('company_profiles')
        .update({
          legal_name: legalName.trim(),
          sector,
          description: description || null,
          logo_url: logoUrl,
          rc_number: rc.trim(),
          nif: nif.trim(),
        })
        .eq('profile_id', userId);
      if (cErr) throw cErr;

      await refreshProfile();
      qc.invalidateQueries({ queryKey: ['companyDetails', userId] });
      router.back();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? '');
    } finally {
      setSaving(false);
    }
  }

  if (!profile || company.isLoading) return <FullLoader />;
  const currentLogo = logo ?? profile.photo_url;

  return (
    <Screen scroll edges={['top']}>
      <View className="px-5 py-4 gap-5">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary text-2xl">‹</Text>
          </Pressable>
          <Heading>{t('profile.edit')}</Heading>
        </View>

        <View className="items-center gap-2">
          <Pressable onPress={changeLogo} className="active:opacity-80">
            {currentLogo ? (
              <Image source={{ uri: currentLogo }} style={{ width: 96, height: 96, borderRadius: 20 }} />
            ) : (
              <View className="w-24 h-24 rounded-card bg-surface-alt border border-dashed border-border items-center justify-center">
                <Text className="text-muted text-2xl">🏢</Text>
              </View>
            )}
          </Pressable>
          <Text className="text-primary text-sm">{t('onboarding.logo')}</Text>
        </View>

        <TextField label={t('onboarding.legalName')} value={legalName} onChangeText={setLegalName} />
        <SelectField label={t('onboarding.sector')} value={sector} options={SECTORS} onChange={setSector} />
        <SelectField label={t('onboarding.wilaya')} value={wilaya} options={WILAYAS} onChange={setWilaya} />
        <TextArea label={t('onboarding.description')} value={description} onChangeText={setDescription} />
        <TextField label={t('onboarding.rcNumber')} value={rc} onChangeText={setRc} />
        <TextField label={t('onboarding.nif')} value={nif} onChangeText={setNif} keyboardType="number-pad" />
        <LocationField coords={coords} onCaptured={setCoords} />

        <Button label={t('common.save')} loading={saving} onPress={save} className="mt-2" />
      </View>
    </Screen>
  );
}
