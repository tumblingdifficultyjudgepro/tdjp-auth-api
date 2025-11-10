import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import SettingsSheet from './SettingsSheet';

type ModeToggle = 'text' | 'symbol';

type Props = {
  titleKey: string;
  showBack?: boolean;
  onBack?: () => void;
  showElementToggle?: boolean;
  elementMode?: ModeToggle;
  onToggleElementMode?: () => void;
};

const letterStyle = (color: string) => ({
  color,
  fontSize: 20,
  fontWeight: '900' as const,
  transform: [{ translateY: -1 }],
  fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'Times New Roman' }),
});

export default function TopBar({
  titleKey,
  showBack,
  onBack,
  showElementToggle,
  elementMode,
  onToggleElementMode,
}: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';
  const [open, setOpen] = useState(false);

  const BackBtn = showBack ? (
    <Pressable
      onPress={onBack}
      style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
      hitSlop={12}
      accessibilityLabel={t(lang, 'quiz.settings.back')}
    >
      <Ionicons name="chevron-back" size={20} color={colors.text} />
    </Pressable>
  ) : (
    <View style={styles.placeholder} />
  );

  const SettingsBtn = (
    <Pressable
      onPress={() => setOpen(true)}
      style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
      hitSlop={12}
      accessibilityLabel="Settings"
    >
      <Ionicons name="settings-sharp" size={18} color={colors.text} />
    </Pressable>
  );

  const ToggleBtn = showElementToggle ? (
    <Pressable
      onPress={onToggleElementMode}
      style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
      hitSlop={12}
      accessibilityLabel={elementMode === 'symbol' ? 'Switch to Text' : 'Switch to Symbols'}
    >
      <Text style={letterStyle(colors.text)}>{elementMode === 'symbol' ? 'T' : 'S'}</Text>
    </Pressable>
  ) : (
    <View style={styles.placeholder} />
  );

  const leftSlotNoBack = isRTL ? ToggleBtn : SettingsBtn;
  const rightSlotNoBack = isRTL ? SettingsBtn : ToggleBtn;
  const leftSlotWithBack = isRTL ? BackBtn : SettingsBtn;
  const rightSlotWithBack = isRTL ? SettingsBtn : BackBtn;

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={[styles.wrap, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
          <View style={styles.sideLeft}>
            {showBack ? leftSlotWithBack : leftSlotNoBack}
          </View>
          <View style={styles.center}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {titleKey ? t(lang, titleKey) : ''}
            </Text>
          </View>
          <View style={styles.sideRight}>
            {showBack ? rightSlotWithBack : rightSlotNoBack}
          </View>
        </View>
      </SafeAreaView>
      <SettingsSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const EDGE = 8;
const BTN = 36;

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 56,
    justifyContent: 'center',
  },
  sideLeft: {
    position: 'absolute',
    left: EDGE,
    top: 10,
    height: BTN,
    justifyContent: 'center',
  },
  sideRight: {
    position: 'absolute',
    right: EDGE,
    top: 10,
    height: BTN,
    justifyContent: 'center',
  },
  center: {
    alignSelf: 'center',
    justifyContent: 'center',
    maxWidth: '70%',
  },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  btn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: { width: BTN, height: BTN, borderRadius: BTN / 2 },
});
   