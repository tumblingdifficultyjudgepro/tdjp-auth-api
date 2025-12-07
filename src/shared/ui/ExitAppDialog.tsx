import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, BackHandler } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { t } from '@/shared/i18n';
import { useLang } from '@/shared/state/lang';

type Props = {
  visible: boolean;
  onCancel: () => void;
};

export default function ExitAppDialog({ visible, onCancel }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();

  if (!visible) return null;

  const handleExit = () => {
    BackHandler.exitApp();
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>!</Text>
          </View>

          <Text style={[styles.message, { color: colors.text }]}>
            {lang === 'he' 
              ? 'האם אתה בטוח\nשברצונך לצאת?' 
              : t(lang, 'dialogs.exitApp.message')}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={handleExit}
              style={({ pressed }) => [
                styles.btn,
                { 
                  backgroundColor: '#fee2e2',
                  opacity: pressed ? 0.7 : 1 
                },
              ]}
            >
              <Text style={[styles.btnText, { color: '#ef4444' }]}>
                {t(lang, 'dialogs.exitApp.exit')}
              </Text>
            </Pressable>

            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                { 
                  backgroundColor: '#2196F3',
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.btnText, { color: '#fff' }]}>
                {t(lang, 'dialogs.exitApp.stay')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconText: {
    color: '#ef4444',
    fontSize: 32,
    fontWeight: '900',
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});