import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/shared/theme/theme';

import ValueKeyboard from '../components/keyboards/ValueKeyboard';
import TextKeyboard from '../components/keyboards/TextKeyboard';
import SymbolKeyboard from '../components/keyboards/SymbolKeyboard';

type Mode = 'name' | 'value' | 'symbol';

type Props = {
  mode: Mode;
  colors: Colors;
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  lang: 'he' | 'en';
  isRTL: boolean;
  placeholder?: string;
  status?: 'idle' | 'correct' | 'wrong';
  correctAnswerText?: string;
  correctAnswerSymbol?: string;
  bottomOffset?: number;
};

export default function OpenAnswerBar({
  mode,
  colors,
  value,
  onChange,
  onSubmit,
  lang,
  isRTL,
  placeholder = '',
  status = 'idle',
  correctAnswerText,
  correctAnswerSymbol,
  bottomOffset = Platform.select({ ios: 8, android: 6, default: 6 }) as number,
}: Props) {
  const insets = useSafeAreaInsets();
  const tSubmit = lang === 'he' ? 'אישור' : 'Submit';

  const GREEN = '#22c55e';
  const RED = '#ef4444';

  const frameBorderColor =
    status === 'correct' ? GREEN : status === 'wrong' ? RED : colors.border;

  const handleKey = (k: string) => {
    if (k === 'BACKSPACE') onChange(value.slice(0, -1));
    else onChange(value + k);
  };

  const handleSubmit = () => onSubmit();

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: colors.border,
          backgroundColor: colors.bg,
          paddingBottom: bottomOffset + insets.bottom,
        },
      ]}
    >
      {status === 'wrong' && (correctAnswerText || correctAnswerSymbol) ? (
        <View style={[styles.bannerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {!!correctAnswerText && (
            <Text style={[styles.correctBanner, { color: GREEN, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {correctAnswerText}
            </Text>
          )}
          {!!correctAnswerSymbol && (
            <Text
              style={[
                styles.correctSymbol,
                {
                  color: GREEN,
                  writingDirection: 'ltr',
                },
              ]}
            >
              {'\u2066'}{correctAnswerSymbol}{'\u2069'}
            </Text>
          )}
        </View>
      ) : null}

      <View
        style={[
          styles.displayRow,
          {
            flexDirection: isRTL ? 'row' : 'row-reverse',
            backgroundColor: '#fff',
            borderColor: frameBorderColor,
          },
        ]}
      >
        <View style={styles.displayTextWrap}>
          <Text numberOfLines={1} style={[styles.displayText, { color: colors.text }]}>
            {value?.length ? value : placeholder}
          </Text>
        </View>

        <Pressable
          onPress={handleSubmit}
          accessibilityRole="button"
          hitSlop={8}
          style={[styles.submitBtn, { backgroundColor: colors.tint }]}
        >
          <Text style={styles.submitText}>{tSubmit}</Text>
        </Pressable>
      </View>

      {mode === 'value' && (
        <ValueKeyboard
          isRTL={isRTL}
          lang={lang}
          colors={colors}
          onKey={handleKey}
          onBackspace={() => handleKey('BACKSPACE')}
        />
      )}

      {mode === 'name' && (
        <TextKeyboard
          isRTL={isRTL}
          lang={lang}
          colors={colors}
          onKey={handleKey}
          onBackspace={() => handleKey('BACKSPACE')}
        />
      )}

      {mode === 'symbol' && (
        <SymbolKeyboard
          isRTL={isRTL}
          lang={lang}
          colors={colors}
          onKey={handleKey}
          onBackspace={() => handleKey('BACKSPACE')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  bannerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  correctBanner: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
  },
  correctSymbol: {
    fontSize: 20,
    fontWeight: '800',
  },
  displayRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  displayTextWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 38,
    paddingHorizontal: 8,
  },
  displayText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  submitBtn: {
    minWidth: 88,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
