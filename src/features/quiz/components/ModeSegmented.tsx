import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Mode } from '../types';

type Props = {
  mode: Mode;
  onChange: (m: Mode) => void;
  labels: { custom: string; random: string };
  colors: { bg: string; text: string; card: string; tint: string; border: string };
  isRTL: boolean;
};

export default function ModeSegmented({ mode, onChange, labels, colors, isRTL }: Props) {
  const selectedIndex = mode === 'custom' ? 0 : 1;
  const anim = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: selectedIndex,
      useNativeDriver: true,
      friction: 7,
      tension: 120
    }).start();
  }, [selectedIndex, anim]);

  // רוחב highlight יחסי לשני הסגמנטים
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: isRTL ? [50, -50] : [-50, 50] // זז ממרכז לכיוון היעד
  });

  return (
    <View style={[styles.wrap]}>
      <View
        style={[
          styles.segment,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: '#000'
          }
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.highlight,
            {
              backgroundColor: colors.tint,
              transform: [{ translateX }]
            }
          ]}
        />
        <Pressable
          style={styles.item}
          onPress={() => onChange('custom')}
          accessibilityRole="button"
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={mode === 'custom' ? colors.bg : colors.text}
            style={{ marginBottom: 2 }}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.label,
              { color: mode === 'custom' ? colors.bg : colors.text }
            ]}
          >
            {labels.custom}
          </Text>
        </Pressable>
        <Pressable
          style={styles.item}
          onPress={() => onChange('random')}
          accessibilityRole="button"
        >
          <Ionicons
            name="shuffle"
            size={18}
            color={mode === 'random' ? colors.bg : colors.text}
            style={{ marginBottom: 2 }}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.label,
              { color: mode === 'random' ? colors.bg : colors.text }
            ]}
          >
            {labels.random}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const HEIGHT = 44;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12
  },
  segment: {
    width: 280,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    position: 'relative',
    // צל קל
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  item: {
    width: 130,
    height: HEIGHT - 8,
    borderRadius: (HEIGHT - 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  highlight: {
    position: 'absolute',
    top: 4,
    left: '50%',
    marginLeft: -60, // חצי מרוחב הפריט
    width: 120,
    height: HEIGHT - 8,
    borderRadius: (HEIGHT - 8) / 2
  }
});
