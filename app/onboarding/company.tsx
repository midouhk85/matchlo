import { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { notify } from '@/lib/confirm';
import { useTranslation } from 'react-i18next';

import { Screen, Heading, Subtitle, Button, TextField, TextArea } from '@/components/ui';
import { SelectField } from '@/components/Picker';
import { LocationField } from '@/components/LocationField';
import { WILAYAS, SECTORS } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';
import { uploadImage, pickImage } from '@/lib/upload';
import type { Coords } from '@/lib/location';

export default function CompanyOnboarding() {
  const { t } = useTranslation();
  const { session, refreshProfile } = useSession();
  const userId = session?.user.id;

  const [logo, setLogo] = useState<string | null>(null);
  const [legalName, setLegalName] = useState('');
  const [sector, setSector] = useState<string | null>(null);
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [rc, setRc] = useState('');
  const [nif, setNif] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const valid = !!legalName && !!sector && !!wilaya && !!rc && !!nif;

  async function pickLogo() {
    const uri = await pickImage();
    if (uri) setLogo(uri);
  }

  async function submit() {
    if (!userId) return;
    setSubmitting(true);
    try {
      let logoUrl: string | null = null;
      if (logo) {
        const { publicUrl } = await uploadImage('logos', logo, userId);
        logoUrl = publicUrl;
      }

      // Profil de base (role company) — vérification d'entreprise en attente
      const { error: pErr } = await supabase.from('profiles').insert({
        id: userId,
        role: 'company',
        full_name: legalName.trim(),
        wilaya,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        photo_url: logoUrl,
        verification_status: 'pending',
      });
      if (pErr) throw pErr;

      const { error: cErr } = await supabase.from('company_profiles').insert({
        profile_id: userId,
        legal_name: legalName.trim(),
        sector,
        description: description || null,
        logo_url: logoUrl,
        rc_number: rc.trim(),
        nif: nif.trim(),
      });
      if (cErr) throw cErr;

      await refreshProfile();
    } catch (e: any) {
      notify(t('common.error'), e.message ?? '');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <View className="flex-1 px-6 py-6 gap-5">
        <Heading>{t('onboarding.companyTitle')}</Heading>

        {/* Logo */}
        <View className="items-center gap-2">
          <Pressable onPress={pickLogo} className="active:opacity-80">
            {logo ? (
              <Image source={{ uri: logo }} style={{ width: 96, height: 96, borderRadius: 20 }} />
            ) : (
              <View className="w-24 h-24 rounded-card bg-surface-alt border border-dashed border-border items-center justify-center">
                <Text className="text-muted text-2xl">🏢</Text>
                <Text className="text-muted text-xs mt-1">{t('onboarding.logo')}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <TextField label={t('onboarding.legalName')} value={legalName} onChangeText={setLegalName} />
        <SelectField label={t('onboarding.sector')} value={sector} options={SECTORS} onChange={setSector} />
        <SelectField label={t('onboarding.wilaya')} value={wilaya} options={WILAYAS} onChange={setWilaya} />
        <TextArea label={t('onboarding.description')} value={description} onChangeText={setDescription} />
        <TextField label={t('onboarding.rcNumber')} value={rc} onChangeText={setRc} placeholder="16/00-1234567" />
        <TextField label={t('onboarding.nif')} value={nif} onChangeText={setNif} keyboardType="number-pad" />
        <LocationField coords={coords} onCaptured={setCoords} />

        <Button
          label={t('onboarding.submitCompany')}
          disabled={!valid}
          loading={submitting}
          onPress={submit}
          className="mt-2"
        />
      </View>
    </Screen>
  );
}
