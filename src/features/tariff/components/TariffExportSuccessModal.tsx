import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { t } from '@/shared/i18n';
import { useLang } from '@/shared/state/lang';

type Props = {
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  onShare: () => void;
};

export default function TariffExportSuccessModal({ visible, onOpen, onClose, onShare }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t(lang, 'tariff.export.successTitle')}
          </Text>
          <View style={styles.buttonsRow}>
            <Pressable
              onPress={onOpen}
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                {
                  backgroundColor: colors.tint,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: '#ffffff' }]}>
                {t(lang, 'tariff.export.open')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                {
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {t(lang, 'tariff.export.close')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onShare}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                {
                  borderColor: colors.tint,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.tint }]}>
                {t(lang, 'tariff.export.share')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    marginRight: 6,
  },
  secondaryButton: {
    marginLeft: 6,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
