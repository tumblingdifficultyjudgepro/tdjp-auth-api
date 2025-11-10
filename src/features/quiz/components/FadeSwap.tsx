import React, { useRef, useEffect } from 'react';
import { Animated, ViewStyle } from 'react-native';

type Props = { id: string; style?: ViewStyle; children: React.ReactNode; duration?: number };

export default function FadeSwap({ id, style, children, duration = 140 }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }).start();
  }, [id]);
  return <Animated.View style={[{ flex: 1, opacity }, style]}>{children}</Animated.View>;
}
