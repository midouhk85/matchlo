import { useState } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Chip } from '@/components/ui';
import { SelectField } from '@/components/Picker';
import { WILAYAS, RADIUS_OPTIONS } from '@/constants/data';

export interface DeckFilters {
  wilaya: string | null;
  radiusKm: number | null;
}

/** Filtres de deck : wilaya + rayon (km). Communs aux deux côtés (§4 ⑤). */
export function FiltersModal({
  visible,
  initial,
  onClose,
  onApply,
}: {
  visible: boolean;
  initial: DeckFilters;
  onClose: () => void;
  onApply: (f: DeckFilters) => void;
}) {
  const { t } = useTranslation();
  const [wilaya, setWilaya] = useState<string | null>(initial.wilaya);
  const [radiusKm, setRadiusKm] = useState<number | null>(initial.radiusKm);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable className="bg-surface rounded-t-card p-6 gap-5" onPress={() => {}}>
          <View className="items-center">
            <View className="w-10 h-1 rounded-pill bg-border" />
          </View>
          <Text className="text-fg font-bold text-xl">{t('deck.filters')}</Text>

          <SelectField
            label={t('deck.wilaya')}
            value={wilaya}
            placeholder={t('common.all')}
            options={[t('common.all'), ...WILAYAS]}
            onChange={(v) => setWilaya(v === t('common.all') ? null : v)}
          />

          <View className="gap-2">
            <Text className="text-muted font-medium text-sm">{t('deck.radius')}</Text>
            <View className="flex-row flex-wrap gap-2">
              <Chip label={t('common.all')} selected={radiusKm === null} onPress={() => setRadiusKm(null)} />
              {RADIUS_OPTIONS.map((r) => (
                <Chip key={r} label={`${r} ${t('common.km')}`} selected={radiusKm === r} onPress={() => setRadiusKm(r)} />
              ))}
            </View>
          </View>

          <View className="flex-row gap-3 mt-2">
            <Button
              label={t('deck.reset')}
              variant="outline"
              className="flex-1"
              onPress={() => {
                setWilaya(null);
                setRadiusKm(null);
                onApply({ wilaya: null, radiusKm: null });
              }}
            />
            <Button label={t('deck.apply')} className="flex-1" onPress={() => onApply({ wilaya, radiusKm })} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
