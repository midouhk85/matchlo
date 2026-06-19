import React from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  type TextInputProps,
  type PressableProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/colors';
import { gradientFor } from '@/constants/data';

/* ────────────────────────────────────────────────────────────
 * Primitives UI partagées — uniquement via tokens (tailwind.config.js).
 * Aucune couleur/espacement en dur dans les écrans.
 * ──────────────────────────────────────────────────────────── */

/** Conteneur d'écran : SafeArea + fond thème (sombre par défaut, clair en option). */
export function Screen({
  children,
  className = '',
  light = false,
  scroll = false,
  edges,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const base = light ? 'bg-light-bg' : 'bg-bg';
  const Inner = (
    <View className={`flex-1 ${base} ${className}`}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges ?? ['top', 'bottom']} className={`flex-1 ${base}`}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {Inner}
        </ScrollView>
      ) : (
        Inner
      )}
    </SafeAreaView>
  );
}

export function Heading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <Text className={`text-fg font-bold text-2xl ${className}`}>{children}</Text>;
}

export function Subtitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <Text className={`text-muted font-sans text-base ${className}`}>{children}</Text>;
}

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  icon,
}: {
  label: string;
  onPress?: PressableProps['onPress'];
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    danger: 'bg-danger',
    outline: 'bg-transparent border border-border',
    ghost: 'bg-transparent',
  };
  const textStyles: Record<ButtonVariant, string> = {
    primary: 'text-fg',
    secondary: 'text-fg',
    success: 'text-fg',
    danger: 'text-fg',
    outline: 'text-fg',
    ghost: 'text-primary',
  };
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`h-12 rounded-md flex-row items-center justify-center px-5 ${styles[variant]} ${isDisabled ? 'opacity-50' : 'active:opacity-80'} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? COLORS.primary : COLORS.fg} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={`font-semibold text-base ${textStyles[variant]}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Champ de saisie avec label (marges start/end pour RTL). */
export function TextField({
  label,
  error,
  className = '',
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View className={`gap-2 ${className}`}>
      {label ? <Text className="text-muted font-medium text-sm">{label}</Text> : null}
      <TextInput
        placeholderTextColor={COLORS.muted}
        className="bg-surface-alt text-fg rounded-md px-4 h-12 font-sans text-base border border-border"
        {...props}
      />
      {error ? <Text className="text-danger text-xs">{error}</Text> : null}
    </View>
  );
}

export function TextArea({ label, className = '', ...props }: TextInputProps & { label?: string }) {
  return (
    <View className={`gap-2 ${className}`}>
      {label ? <Text className="text-muted font-medium text-sm">{label}</Text> : null}
      <TextInput
        placeholderTextColor={COLORS.muted}
        multiline
        textAlignVertical="top"
        className="bg-surface-alt text-fg rounded-md px-4 py-3 min-h-[96px] font-sans text-base border border-border"
        {...props}
      />
    </View>
  );
}

/** Chip sélectionnable (filtres, langues, types d'événements). */
export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 h-9 rounded-pill items-center justify-center border ${
        selected ? 'bg-primary border-primary' : 'bg-surface-alt border-border'
      } active:opacity-80`}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-fg' : 'text-muted'}`}>{label}</Text>
    </Pressable>
  );
}

/** Groupe de chips multi-sélection. */
export function ChipGroup({
  options,
  values,
  onToggle,
  single = false,
}: {
  options: readonly string[];
  values: string[];
  onToggle: (v: string) => void;
  single?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => (
        <Chip key={opt} label={opt} selected={values.includes(opt)} onPress={() => onToggle(opt)} />
      ))}
    </View>
  );
}

/** Avatar : photo si dispo, sinon dégradé déterministe avec initiales. */
export function Avatar({
  uri,
  name,
  id,
  size = 48,
}: {
  uri?: string | null;
  name?: string | null;
  id: string;
  size?: number;
}) {
  const initials = (name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (uri) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
        <ExpoImage uri={uri} size={size} />
      </View>
    );
  }
  return (
    <LinearGradient
      colors={gradientFor(id)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text className="text-fg font-bold" style={{ fontSize: size * 0.36 }}>
        {initials}
      </Text>
    </LinearGradient>
  );
}

function ExpoImage({ uri, size }: { uri: string; size: number }) {
  // Image simple via RN (évite une dépendance supplémentaire pour la Phase 1)
  const { Image } = require('react-native');
  return <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />;
}

/** Badge « vérifié » (coche bleue). */
export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <View
      className="bg-primary items-center justify-center rounded-pill"
      style={{ width: size, height: size }}
    >
      <Text style={{ color: COLORS.fg, fontSize: size * 0.6, fontWeight: '700', lineHeight: size }}>✓</Text>
    </View>
  );
}

/** Pastille de statut colorée. */
export function StatusPill({ label, color = 'primary' }: { label: string; color?: keyof typeof COLORS }) {
  return (
    <View className="px-3 h-7 rounded-pill items-center justify-center" style={{ backgroundColor: COLORS[color] + '22' }}>
      <Text className="text-xs font-semibold" style={{ color: COLORS[color] }}>
        {label}
      </Text>
    </View>
  );
}

/** Squelette de chargement (placeholder animé simple). */
export function Skeleton({ className = '', style }: { className?: string; style?: any }) {
  return <View className={`bg-surface-alt rounded-md ${className}`} style={style} />;
}

/** État vide réutilisable. */
export function EmptyState({
  title,
  description,
  emoji = '🗂️',
  action,
}: {
  title: string;
  description?: string;
  emoji?: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-3">
      <Text style={{ fontSize: 44 }}>{emoji}</Text>
      <Text className="text-fg font-semibold text-lg text-center">{title}</Text>
      {description ? <Text className="text-muted text-center text-sm">{description}</Text> : null}
      {action ? <View className="mt-2">{action}</View> : null}
    </View>
  );
}

/** Centre un spinner plein écran. */
export function FullLoader({ light = false }: { light?: boolean }) {
  return (
    <View className={`flex-1 items-center justify-center ${light ? 'bg-light-bg' : 'bg-bg'}`}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );
}
