import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Image } from 'react-native';

import { VerifiedBadge } from '@/components/ui';
import { COLORS } from '@/constants/colors';
import { gradientFor, formatDZD } from '@/constants/data';
import type { SwipeDir } from '@/components/SwipeDeck';

/* Badges d'intention LIKE / NOPE / SUPER pendant le drag */
function Overlays({ x, y }: { x: any; y: any }) {
  const like = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [40, 140], [0, 1], Extrapolation.CLAMP) }));
  const nope = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-140, -40], [1, 0], Extrapolation.CLAMP) }));
  const sup = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [-120, -40], [1, 0], Extrapolation.CLAMP) }));
  return (
    <>
      <Animated.View style={[badge, { left: 20, borderColor: COLORS.success }, like]}>
        <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 24 }}>LIKE</Text>
      </Animated.View>
      <Animated.View style={[badge, { right: 20, borderColor: COLORS.danger }, nope]}>
        <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 24 }}>NOPE</Text>
      </Animated.View>
      <Animated.View
        style={[badge, { alignSelf: 'center', top: undefined, bottom: 80, borderColor: COLORS.secondary }, sup]}
      >
        <Text style={{ color: COLORS.secondary, fontWeight: '800', fontSize: 22 }}>SUPER ★</Text>
      </Animated.View>
    </>
  );
}

const badge = {
  position: 'absolute' as const,
  top: 40,
  borderWidth: 3,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 6,
  transform: [{ rotate: '-12deg' }],
};

/* ── Carte d'annonce (deck talent) ── */
export function MissionCard({
  mission,
  overlay,
  companyName,
}: {
  mission: any;
  overlay?: { x: any; y: any };
  companyName?: string;
}) {
  return (
    <View className="flex-1 rounded-card overflow-hidden bg-surface border border-border">
      <LinearGradient colors={gradientFor(mission.id)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
        <View className="flex-1 justify-between p-5">
          <View className="flex-row justify-between items-start">
            {mission.is_urgent ? (
              <View className="bg-danger px-3 h-7 rounded-pill items-center justify-center">
                <Text className="text-fg text-xs font-bold">URGENT</Text>
              </View>
            ) : (
              <View />
            )}
            <View className="bg-black/30 px-3 h-7 rounded-pill items-center justify-center">
              <Text className="text-fg text-xs font-semibold">{mission.event_type ?? '—'}</Text>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-fg font-bold text-2xl" numberOfLines={2}>
              {mission.title}
            </Text>
            {companyName ? <Text className="text-fg/80 text-sm font-medium">{companyName}</Text> : null}
            <View className="flex-row flex-wrap gap-2 mt-1">
              <Pill text={`📍 ${mission.wilaya ?? '—'}`} />
              {mission.distance_km != null ? <Pill text={`${mission.distance_km} km`} /> : null}
              <Pill text={`💰 ${formatDZD(mission.pay_dzd)}`} />
              {mission.positions ? <Pill text={`👥 ${mission.positions}`} /> : null}
            </View>
          </View>
        </View>
      </LinearGradient>
      {overlay ? <Overlays x={overlay.x} y={overlay.y} /> : null}
    </View>
  );
}

/* ── Carte de talent (deck entreprise) ── */
export function TalentCard({ talent, overlay }: { talent: any; overlay?: { x: any; y: any } }) {
  return (
    <View className="flex-1 rounded-card overflow-hidden bg-surface border border-border">
      {talent.photo_url ? (
        <Image source={{ uri: talent.photo_url }} style={{ flex: 1 }} resizeMode="cover" />
      ) : (
        <LinearGradient colors={gradientFor(talent.id)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' }}
      />
      <View className="absolute bottom-0 left-0 right-0 p-5 gap-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-fg font-bold text-2xl">{talent.full_name}</Text>
          {talent.is_verified ? <VerifiedBadge size={18} /> : null}
        </View>
        {talent.bio ? (
          <Text className="text-fg/85 text-sm" numberOfLines={2}>
            {talent.bio}
          </Text>
        ) : null}
        <View className="flex-row flex-wrap gap-2 mt-1">
          <Pill text={`📍 ${talent.wilaya ?? '—'}`} />
          {talent.distance_km != null ? <Pill text={`${talent.distance_km} km`} /> : null}
          {talent.experience_years != null ? <Pill text={`⭐ ${talent.experience_years} ans`} /> : null}
          <Pill text={`💰 ${formatDZD(talent.daily_rate_dzd)}`} />
        </View>
      </View>
      {overlay ? <Overlays x={overlay.x} y={overlay.y} /> : null}
    </View>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <View className="bg-black/30 px-3 h-7 rounded-pill items-center justify-center">
      <Text className="text-fg text-xs font-medium">{text}</Text>
    </View>
  );
}

/* ── Boutons d'action sous le deck ── */
export function SwipeButtons({ onSwipe }: { onSwipe: (d: SwipeDir) => void }) {
  return (
    <View className="flex-row items-center justify-center gap-6 py-5">
      <ActionBtn color={COLORS.danger} label="✕" onPress={() => onSwipe('dislike')} size={60} />
      <ActionBtn color={COLORS.secondary} label="★" onPress={() => onSwipe('superlike')} size={50} />
      <ActionBtn color={COLORS.success} label="♥" onPress={() => onSwipe('like')} size={60} />
    </View>
  );
}

function ActionBtn({ color, label, onPress, size }: { color: string; label: string; onPress: () => void; size: number }) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center rounded-pill active:opacity-70"
      style={{ width: size, height: size, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: color }}
    >
      <Text style={{ color, fontSize: size * 0.42, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}
