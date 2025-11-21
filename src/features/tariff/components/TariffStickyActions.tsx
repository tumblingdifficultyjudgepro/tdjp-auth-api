import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { t } from '@/shared/i18n';
import { useLang } from '@/shared/state/lang';

type Props = {
  onReset: () => void;
  onExport: () => void;
  isExporting?: boolean;
};

export default function TariffStickyActions({ onReset, onExport, isExporting }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.buttonsRow} pointerEvents="box-none">
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: '#c0392b',
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={styles.fabText}>
            {t(lang, 'tariff.actions.resetPage')}
          </Text>
        </Pressable>

        <Pressable
          onPress={onExport}
          disabled={isExporting}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.tint,
              opacity: isExporting ? 0.6 : pressed ? 0.8 : 1,
            },
          ]}
        >
          {isExporting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.fabText}>
              {t(lang, 'tariff.actions.exportPdf')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  fab: {
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 999,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    elevation: 6,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
