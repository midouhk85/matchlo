import React, { useImperativeHandle, useState, forwardRef, useCallback } from 'react';
import { View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

export type SwipeDir = 'like' | 'dislike' | 'superlike';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_X = SCREEN_W * 0.28; // seuil horizontal
const SWIPE_Y = 140; // seuil vertical (superlike)

export interface SwipeDeckHandle {
  swipe: (dir: SwipeDir) => void;
}

interface Props<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T, overlay: { x: any; y: any }) => React.ReactNode;
  onSwipe: (item: T, dir: SwipeDir) => void;
  onEmpty?: () => void;
}

/**
 * Deck de swipe générique (cartes empilées). Gestes via gesture-handler +
 * animations Reanimated. Expose `swipe(dir)` pour les boutons like/dislike/superlike.
 */
function SwipeDeckInner<T>(
  { data, keyExtractor, renderCard, onSwipe }: Props<T>,
  ref: React.Ref<SwipeDeckHandle>,
) {
  const [index, setIndex] = useState(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const current = data[index];
  const next = data[index + 1];

  const advance = useCallback(
    (item: T, dir: SwipeDir) => {
      onSwipe(item, dir);
      setIndex((i) => i + 1);
      x.value = 0;
      y.value = 0;
    },
    [onSwipe],
  );

  const fling = useCallback(
    (dir: SwipeDir) => {
      if (!current) return;
      const item = current;
      if (dir === 'superlike') {
        y.value = withTiming(-SCREEN_W, { duration: 240 }, () => runOnJS(advance)(item, dir));
      } else {
        const to = dir === 'like' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;
        x.value = withTiming(to, { duration: 240 }, () => runOnJS(advance)(item, dir));
      }
    },
    [current, advance],
  );

  useImperativeHandle(ref, () => ({ swipe: fling }), [fling]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY < -SWIPE_Y && Math.abs(e.translationX) < SWIPE_X) {
        // superlike (vers le haut)
        y.value = withTiming(-SCREEN_W, { duration: 220 }, () => {
          if (current) runOnJS(advance)(current, 'superlike');
        });
      } else if (e.translationX > SWIPE_X) {
        x.value = withTiming(SCREEN_W * 1.5, { duration: 220 }, () => {
          if (current) runOnJS(advance)(current, 'like');
        });
      } else if (e.translationX < -SWIPE_X) {
        x.value = withTiming(-SCREEN_W * 1.5, { duration: 220 }, () => {
          if (current) runOnJS(advance)(current, 'dislike');
        });
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
      }
    });

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${interpolate(x.value, [-SCREEN_W, SCREEN_W], [-12, 12], Extrapolation.CLAMP)}deg` },
    ],
  }));

  const nextStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(x.value) / SWIPE_X, 1);
    return {
      transform: [{ scale: interpolate(progress, [0, 1], [0.94, 1], Extrapolation.CLAMP) }],
      opacity: interpolate(progress, [0, 1], [0.6, 1], Extrapolation.CLAMP),
    };
  });

  if (!current) return null;

  return (
    <View className="flex-1">
      {next ? (
        <Animated.View key={keyExtractor(next)} style={[StyleAbsolute, nextStyle]} pointerEvents="none">
          {renderCard(next, { x, y })}
        </Animated.View>
      ) : null}

      <GestureDetector gesture={pan}>
        <Animated.View key={keyExtractor(current)} style={[StyleAbsolute, topStyle]}>
          {renderCard(current, { x, y })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const StyleAbsolute = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

export const SwipeDeck = forwardRef(SwipeDeckInner) as <T>(
  props: Props<T> & { ref?: React.Ref<SwipeDeckHandle> },
) => React.ReactElement;
