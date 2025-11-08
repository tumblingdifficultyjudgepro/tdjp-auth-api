import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import SettingsSheet from './SettingsSheet';

type ModeToggle = 'text' | 'symbol';

const toggleLetter = (colors: any) => ({
  color: colors.text,
  fontSize: 18,
  fontWeight: '900' as const,
  transform: [{ translateY: -1 }],
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' })
});

export default function TopBar({
  titleKey,
  showElementToggle,
  elementMode,
  onToggleElementMode
}: {
  titleKey: string;
  showElementToggle?: boolean;
  elementMode?: ModeToggle;
  onToggleElementMode?: () => void;
}) {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';
  const [open, setOpen] = useState(false);

  const SettingsBtn = (
    <Pressable
      onPress={() => setOpen(true)}
      style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Ionicons name="settings-sharp" size={18} color={colors.text} />
    </Pressable>
  );

  const ToggleBtn = showElementToggle ? (
    <Pressable
      onPress={onToggleElementMode}
      style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {elementMode === 'symbol' ? (
        <Text style={toggleLetter(colors)}>𝐓</Text>
      ) : (
        <Text style={toggleLetter(colors)}>𝐒</Text>
      )}
    </Pressable>
  ) : (
    <View style={styles.sidePlaceholder} />
  );

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={[styles.barWrap, { backgroundColor: colors.bg }]}>
          <View style={styles.bar}>
            {isRTL ? ToggleBtn : SettingsBtn}
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {titleKey ? t(lang, titleKey) : ''}
            </Text>
            {isRTL ? SettingsBtn : ToggleBtn}
          </View>
          <View
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: Platform.select({
                ios: 'rgba(0,0,0,0.08)',
                android: 'rgba(0,0,0,0.12)'
              })
            }}
          />
        </View>
      </SafeAreaView>
      <SettingsSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  barWrap: {},
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sidePlaceholder: { width: 36, height: 36, borderRadius: 18 }
});
