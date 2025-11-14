import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function IllegalExportDialog({ visible, onCancel, onConfirm }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t(lang, 'tariff.illegalExportTitle')}</Text>
          <Text style={[styles.msg, { color: colors.text }]}>{t(lang, 'tariff.illegalExportMsg')}</Text>
          <View style={styles.row}>
            <Pressable onPress={onCancel} style={[styles.btn, { borderColor: colors.border }]}>
              <Text style={[styles.btnText, { color: colors.text }]}>{t(lang, 'common.cancel')}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.cta, { backgroundColor: colors.tint }]}>
              <Text style={styles.ctaText}>{t(lang, 'tariff.exportAnyway')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  card: { width: '100%', maxWidth: 420, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  msg: { fontSize: 14, opacity: 0.9 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  btnText: { fontSize: 12, fontWeight: '600' },
  cta: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  ctaText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
