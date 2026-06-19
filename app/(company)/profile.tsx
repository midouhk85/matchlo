import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Screen, Heading, Avatar, VerifiedBadge, FullLoader, StatusPill, Button } from '@/components/ui';
import { SettingsSection } from '@/components/Settings';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/useSession';

export default function CompanyProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useSession();

  const company = useQuery({
    queryKey: ['companyDetails', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('company_profiles').select('*').eq('profile_id', profile!.id).maybeSingle();
      return data;
    },
  });

  if (!profile) return <FullLoader />;

  const vStatus = profile.verification_status ?? 'unverified';
  const vColor = vStatus === 'verified' ? 'success' : vStatus === 'pending' ? 'warning' : 'danger';

  return (
    <Screen scroll edges={['top']}>
      <View className="px-5 py-4 gap-6">
        <View className="items-center gap-3">
          <Avatar id={profile.id} name={profile.full_name} uri={profile.photo_url} size={96} />
          <View className="flex-row items-center gap-2">
            <Heading>{profile.full_name}</Heading>
            {profile.is_verified ? <VerifiedBadge size={20} /> : null}
          </View>
          <Text className="text-muted">📍 {profile.wilaya ?? '—'}</Text>
          <StatusPill label={t(`verification.${vStatus}`, { defaultValue: vStatus })} color={vColor as any} />
        </View>

        {company.data ? (
          <View className="bg-surface rounded-card p-4 gap-2 border border-border">
            <Info label={t('onboarding.sector')} value={company.data.sector ?? '—'} />
            <Info label={t('onboarding.rcNumber')} value={company.data.rc_number} />
            <Info label={t('onboarding.nif')} value={company.data.nif} />
            {company.data.description ? <Text className="text-muted text-sm mt-1">{company.data.description}</Text> : null}
          </View>
        ) : null}

        {/* Quotas — LECTURE SEULE. Conformité §6.1 : aucune vente/incitation dans l'app mobile. */}
        <View className="gap-2">
          <Text className="text-muted font-medium text-sm">Quotas</Text>
          <View className="flex-row gap-3">
            <Quota label={t('deck.urgent')} value={company.data?.urgent_quota ?? 0} />
            <Quota label="Messages directs" value={company.data?.direct_message_quota ?? 0} />
          </View>
          <Text className="text-muted text-xs">
            Gérez vos quotas depuis votre espace web.
          </Text>
        </View>

        <Button label={t('profile.edit')} variant="outline" onPress={() => router.push('/(company)/edit-profile')} />

        <SettingsSection />
      </View>
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-muted text-sm">{label}</Text>
      <Text className="text-fg font-medium text-sm">{value}</Text>
    </View>
  );
}

function Quota({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 bg-surface rounded-card p-4 items-center border border-border">
      <Text className="text-fg font-bold text-2xl">{value}</Text>
      <Text className="text-muted text-xs text-center">{label}</Text>
    </View>
  );
}
