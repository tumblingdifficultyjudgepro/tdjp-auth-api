import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';

type Props = { visible: boolean; onClose: () => void };

export default function SettingsSheet({ visible, onClose }: Props) {
  const { colors, mode, setMode } = useAppTheme();
  const { lang, setLang } = useLang();
  const isRTL = lang === 'he';

  const appearanceOrder = isRTL ? (['light', 'blue', 'dark'] as const) : (['dark', 'blue', 'light'] as const);
  const languageOrder = isRTL ? (['he', 'en'] as const) : (['en', 'he'] as const);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop} />
      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{isRTL ? 'הגדרות' : 'Settings'}</Text>

        <Text style={[styles.section, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'שפה' : 'Language'}
        </Text>
        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'flex-start' }]}>
          {languageOrder.map(l => {
            const selected = lang === l;
            return (
              <Pressable
                key={l}
                onPress={() => setLang(l)}
                style={[
                  styles.pill,
                  {
                    borderColor: colors.border,
                    backgroundColor: selected ? colors.tint : 'transparent'
                  }
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: selected ? '#fff' : colors.text, textAlign: isRTL ? 'right' : 'left' }
                  ]}
                >
                  {l === 'he' ? 'עברית' : 'English'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'תצוגה' : 'Appearance'}
        </Text>
        <View style={[styles.segment, { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'flex-start' }]}>
          {appearanceOrder.map(m => {
            const selected = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.segmentItem,
                  {
                    borderColor: colors.border,
                    backgroundColor: selected ? colors.tint : 'transparent'
                  }
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: selected ? '#fff' : colors.text, textAlign: isRTL ? 'right' : 'left' }
                  ]}
                >
                  {m === 'light' ? (isRTL ? 'בהיר' : 'Light') : m === 'blue' ? (isRTL ? 'כחול' : 'Blue') : (isRTL ? 'כהה' : 'Dark')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>{isRTL ? 'סגור' : 'Close'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  panel: { position: 'absolute', left: 16, right: 16, top: 80, borderRadius: 16, borderWidth: 1.5, padding: 16 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  section: { fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  row: { gap: 8, alignItems: 'center' },
  pill: { borderWidth: 1.5, borderRadius: 24, paddingVertical: 8, paddingHorizontal: 14, minWidth: 96, alignItems: 'center' },
  pillText: { fontSize: 14, fontWeight: '600' },
  segment: { gap: 8, marginTop: 4, alignItems: 'center' },
  segmentItem: { flexShrink: 0, borderWidth: 1.5, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, minWidth: 96, alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '700' },
  actions: { marginTop: 14, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { backgroundColor: '#e74c3c', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  closeText: { color: '#fff', fontSize: 14, fontWeight: '800' }
});
