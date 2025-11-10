import React, { useRef } from 'react';
import { View, Pressable, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/shared/theme/theme';

type Props = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

export default function BottomPrimaryButton({ text, onPress, disabled, loading, testID }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;
  const isBlocked = disabled || loading;

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 12, backgroundColor: colors.bg }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityState={{ disabled: !!isBlocked, busy: !!loading }}
          style={[
            styles.btn,
            {
              backgroundColor: colors.tint,
              opacity: isBlocked ? 0.5 : 1,
              shadowColor: colors.tint,
            },
          ]}
          disabled={isBlocked}
          onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 20, bounciness: 0 }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start()}
          onPress={onPress}
        >
          <Text style={styles.txt}>{loading ? '...' : text}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  txt: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
