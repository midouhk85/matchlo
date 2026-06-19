import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/constants/colors';

/** Onglets de l'espace talent. */
export default function TalentLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{ title: t('tabs.discover'), tabBarIcon: ({ color }) => <Icon e="🔥" color={color} /> }}
      />
      <Tabs.Screen
        name="matches"
        options={{ title: t('tabs.matches'), tabBarIcon: ({ color }) => <Icon e="💬" color={color} /> }}
      />
      <Tabs.Screen
        name="missions"
        options={{ title: t('tabs.missions'), tabBarIcon: ({ color }) => <Icon e="📋" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: ({ color }) => <Icon e="👤" color={color} /> }}
      />
    </Tabs>
  );
}

function Icon({ e, color }: { e: string; color: import('react-native').ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{e}</Text>;
}
