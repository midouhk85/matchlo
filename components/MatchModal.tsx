import { View, Text, Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui';

/**
 * Écran « C'est un match ! ». Pour une mission influenceur (pending_admin),
 * affiche plutôt l'état « en attente de validation » (chat fermé, cf. §5).
 */
export function MatchModal({
  visible,
  pending,
  onChat,
  onContinue,
}: {
  visible: boolean;
  pending: boolean;
  onChat: () => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 items-center justify-center px-8">
        <LinearGradient
          colors={['#7C5CFF', '#E96FE3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 28, width: '100%', alignItems: 'center', gap: 16 }}
        >
          <Text style={{ fontSize: 56 }}>{pending ? '⏳' : '🎉'}</Text>
          <Text className="font-bold text-center" style={{ color: '#F5C518', fontSize: 30 }}>
            {pending ? t('match.pending') : t('match.title')}
          </Text>
          <Text className="text-fg/90 text-center text-base">
            {pending ? t('match.pendingDesc') : t('match.subtitle')}
          </Text>
          <View className="w-full gap-3 mt-2">
            {!pending ? <Button label={t('match.openChat')} variant="secondary" onPress={onChat} /> : null}
            <Button label={t('match.keepSwiping')} variant="outline" onPress={onContinue} />
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}
