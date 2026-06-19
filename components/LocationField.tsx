import { useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { capturePosition, type Coords } from '@/lib/location';
import { COLORS } from '@/constants/colors';

/**
 * Capture de la position (lat/lng) à l'onboarding.
 * Repli sur saisie manuelle de la wilaya si la permission GPS est refusée.
 */
export function LocationField({
  coords,
  onCaptured,
}: {
  coords: Coords | null;
  onCaptured: (c: Coords | null) => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  async function useGps() {
    setLoading(true);
    const c = await capturePosition();
    setLoading(false);
    if (!c) {
      setDenied(true);
      onCaptured(null);
      return;
    }
    setDenied(false);
    onCaptured(c);
  }

  return (
    <View className="gap-3 bg-surface rounded-card p-4 border border-border">
      <Text className="text-fg font-semibold text-base">📍 {t('onboarding.location')}</Text>
      <Text className="text-muted text-sm">{t('onboarding.locationDesc')}</Text>
      {coords ? (
        <View className="flex-row items-center gap-2">
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success }} />
          <Text className="text-success text-sm font-medium">
            {t('onboarding.locationCaptured')} ({coords.latitude.toFixed(3)}, {coords.longitude.toFixed(3)})
          </Text>
        </View>
      ) : null}
      <Button label={t('onboarding.useGps')} variant="outline" onPress={useGps} loading={loading} />
      {denied ? (
        <Text className="text-warning text-xs">
          {t('onboarding.manualLocation')} — {t('onboarding.wilaya')}
        </Text>
      ) : null}
    </View>
  );
}
