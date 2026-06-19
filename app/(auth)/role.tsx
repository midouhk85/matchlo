import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, Heading, Subtitle } from '@/components/ui';

/**
 * Choix du rôle après authentification. Le profil n'est créé qu'à la fin de
 * l'onboarding (l'insert profiles exige un `role`).
 */
export default function RoleChoice() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen scroll>
      <View className="flex-1 justify-center px-6 gap-8 py-10">
        <View className="gap-2">
          <Heading>{t('auth.roleTitle')}</Heading>
          <Subtitle>{t('auth.roleSubtitle')}</Subtitle>
        </View>

        <View className="gap-4">
          <RoleCard
            emoji="🌟"
            colors={['#7C5CFF', '#E96FE3']}
            title={t('auth.talentTitle')}
            desc={t('auth.talentDesc')}
            onPress={() => router.push('/onboarding/talent-type')}
          />
          <RoleCard
            emoji="🏢"
            colors={['#5B8DEF', '#3FD0C9']}
            title={t('auth.companyTitle')}
            desc={t('auth.companyDesc')}
            onPress={() => router.push('/onboarding/company')}
          />
        </View>
      </View>
    </Screen>
  );
}

function RoleCard({
  emoji,
  colors,
  title,
  desc,
  onPress,
}: {
  emoji: string;
  colors: [string, string];
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <View className="bg-surface rounded-card p-5 flex-row items-center gap-4 border border-border">
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
        </LinearGradient>
        <View className="flex-1">
          <Text className="text-fg font-semibold text-lg">{title}</Text>
          <Text className="text-muted text-sm">{desc}</Text>
        </View>
      </View>
    </Pressable>
  );
}
