import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, Heading, Subtitle } from '@/components/ui';

/**
 * Choix du sous-type de talent. En Phase 1, seul le parcours hôte/hôtesse est
 * implémenté ; l'influenceur arrive en Phase 2 (gate de modération admin).
 */
export default function TalentType() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen scroll>
      <View className="flex-1 justify-center px-6 gap-8 py-10">
        <Heading>{t('onboarding.talentTypeTitle')}</Heading>

        <View className="gap-4">
          <Pressable onPress={() => router.push('/onboarding/host')} className="active:opacity-80">
            <View className="bg-surface rounded-card p-5 flex-row items-center gap-4 border border-border">
              <LinearGradient
                colors={['#5B8DEF', '#3FD0C9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 28 }}>🙋‍♀️</Text>
              </LinearGradient>
              <View className="flex-1">
                <Text className="text-fg font-semibold text-lg">{t('onboarding.host')}</Text>
                <Text className="text-muted text-sm">{t('onboarding.hostDesc')}</Text>
              </View>
            </View>
          </Pressable>

          {/* Influenceur (Phase 2) */}
          <Pressable onPress={() => router.push('/onboarding/influencer')} className="active:opacity-80">
            <View className="bg-surface rounded-card p-5 flex-row items-center gap-4 border border-border">
              <LinearGradient
                colors={['#7C5CFF', '#E96FE3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 28 }}>📸</Text>
              </LinearGradient>
              <View className="flex-1">
                <Text className="text-fg font-semibold text-lg">{t('onboarding.influencer')}</Text>
                <Text className="text-muted text-sm">{t('onboarding.influencerDesc')}</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
