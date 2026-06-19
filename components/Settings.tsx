import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGS, changeLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui';
import { useSession } from '@/store/useSession';
import { confirmAction } from '@/lib/confirm';

/** Sélecteur de langue (FR/AR/EN) + déconnexion, partagé par les profils. */
export function SettingsSection() {
  const { t, i18n } = useTranslation();
  const { signOut } = useSession();

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-muted font-medium text-sm">{t('profile.language')}</Text>
        <View className="flex-row gap-2">
          {LANGS.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => changeLanguage(l.code)}
              className={`flex-1 h-11 rounded-md items-center justify-center border ${
                i18n.language === l.code ? 'bg-primary border-primary' : 'bg-surface-alt border-border'
              }`}
            >
              <Text className={`font-medium ${i18n.language === l.code ? 'text-fg' : 'text-muted'}`}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Button
        label={t('auth.signOut')}
        variant="outline"
        onPress={() =>
          confirmAction(t('auth.signOut'), '', () => signOut(), {
            confirmLabel: t('auth.signOut'),
            cancelLabel: t('common.cancel'),
          })
        }
      />
    </View>
  );
}
