import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { useAuth } from '@/shared/state/auth';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/shared/i18n';
import FeedbackModal from '@/features/feedback/components/FeedbackModal';

import { useNavigation } from '@react-navigation/native';

type Props = { visible: boolean; onClose: () => void };

const TARIFF_DIR_KEY = 'tariffExportDirUri';
const ALLOW_ILLEGAL_TARIFF_KEY = 'tariffAllowIllegalExport';

function formatDirLabel(dir: string | null): string {
  if (!dir) return '';
  try {
    const decoded = decodeURIComponent(dir);
    const treeIndex = decoded.indexOf('tree/');
    if (treeIndex !== -1) {
      const treePart = decoded.slice(treeIndex + 'tree/'.length);
      const parts = treePart.split(':');
      if (parts.length === 2) {
        const pathPartRaw = parts[1];
        const pathPart = pathPartRaw.replace(/^\/+/, '');
        if (pathPart.length > 0) return `Internal storage/${pathPart}`;
      }
    }
  } catch { }
  if (dir.length <= 60) return dir;
  return dir.slice(0, 30) + '…' + dir.slice(-20);
}

export default function SettingsSheet({ visible, onClose }: Props) {
  const { colors, mode, setMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const { lang, setLang } = useLang();
  const { logout, user } = useAuth();
  const isRTL = lang === 'he';

  const [tariffDir, setTariffDir] = useState<string | null>(null);
  const [allowIllegalTariffExport, setAllowIllegalTariffExport] = useState(false);

  // State עבור חלונית הפידבק
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const appearanceOrder = isRTL ? (['light', 'blue', 'dark'] as const) : (['dark', 'blue', 'light'] as const);
  const languageOrder = isRTL ? (['he', 'en'] as const) : (['en', 'he'] as const);

  useEffect(() => {
    if (!visible) return;
    AsyncStorage.getItem(TARIFF_DIR_KEY).then(value => setTariffDir(value)).catch(() => { });
    AsyncStorage.getItem(ALLOW_ILLEGAL_TARIFF_KEY).then(value => setAllowIllegalTariffExport(value === '1')).catch(() => { });
  }, [visible]);

  const handlePickTariffDir = async () => {
    if (Platform.OS !== 'android') return;
    const fsAny = FileSystemLegacy as any;
    const saf = fsAny.StorageAccessFramework;
    if (!saf) return;
    try {
      const permissions = await saf.requestDirectoryPermissionsAsync();
      if (!permissions.granted || !permissions.directoryUri) return;
      const dirUri: string = permissions.directoryUri;
      await AsyncStorage.setItem(TARIFF_DIR_KEY, dirUri);
      setTariffDir(dirUri);
    } catch { }
  };

  const handleToggleAllowIllegalTariffExport = async () => {
    const next = !allowIllegalTariffExport;
    setAllowIllegalTariffExport(next);
    try { await AsyncStorage.setItem(ALLOW_ILLEGAL_TARIFF_KEY, next ? '1' : '0'); } catch { }
  };

  const hasDir = !!tariffDir;
  const dirButtonLabel = hasDir ? t(lang, 'settings.tariffLocation.change') : t(lang, 'settings.tariffLocation.choose');
  const dirStatusLabel = hasDir ? formatDirLabel(tariffDir) : t(lang, 'settings.tariffLocation.notSet');

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop} />
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{isRTL ? 'הגדרות' : 'Settings'}</Text>


          {/* Account & Logout Row - Only for logged in users */}
          {user && (
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12, marginBottom: 16 }}>
              {/* Account - Takes flex 1 */}
              <Pressable
                style={({ pressed }) => [
                  styles.accountBtn,
                  {
                    backgroundColor: colors.tint,
                    opacity: pressed ? 0.9 : 1,
                    flex: 1,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    marginVertical: 0,
                  }
                ]}
                onPress={() => {
                  onClose();
                  navigation.navigate('EditUser', { user: user, isSelf: true });
                }}
              >
                <Ionicons name="person-circle" size={24} color="white" />
                <Text style={styles.accountBtnText}>{t(lang, 'settings.myAccount')}</Text>
              </Pressable>

              {/* Logout - Fixed width */}
              <Pressable
                onPress={() => { logout(); onClose(); }}
                style={({ pressed }) => [
                  styles.accountBtn,
                  {
                    backgroundColor: colors.card,
                    borderWidth: 1.5,
                    borderColor: '#ef4444',
                    opacity: pressed ? 0.9 : 1,
                    width: 100,
                    paddingHorizontal: 0,
                    marginVertical: 0,
                  }
                ]}
              >
                <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>{t(lang, 'auth.logout')}</Text>
              </Pressable>
            </View>
          )}

          {/* מיקום טריף */}
          <Text style={[styles.section, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {t(lang, 'settings.tariffLocation.title')}
          </Text>
          <View style={[styles.tariffRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={handlePickTariffDir} style={[styles.tariffButton, { borderColor: colors.border, backgroundColor: colors.tint }]}>
              <Text style={styles.tariffButtonText}>{dirButtonLabel}</Text>
            </Pressable>
            <View style={styles.tariffLabelWrapper}>
              <Text style={[styles.tariffLabel, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                {dirStatusLabel}
              </Text>
            </View>
          </View>

          {/* אפשר ייצוא לא חוקי */}
          <View style={[styles.checkboxRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={handleToggleAllowIllegalTariffExport} style={[styles.checkboxBox, { borderColor: colors.border, backgroundColor: allowIllegalTariffExport ? colors.tint : 'transparent' }]}>
              {allowIllegalTariffExport && <View style={styles.checkboxInner} />}
            </Pressable>
            <View style={styles.checkboxLabelWrapper}>
              <Text style={[styles.checkboxLabel, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {t(lang, 'settings.tariffAllowIllegalExport.title')}
              </Text>
            </View>
          </View>

          {/* שפה */}
          <Text style={[styles.section, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'שפה' : 'Language'}</Text>
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'flex-start' }]}>
            {languageOrder.map(l => {
              const selected = lang === l;
              return (
                <Pressable key={l} onPress={() => setLang(l)} style={[styles.pill, { borderColor: colors.border, backgroundColor: selected ? colors.tint : 'transparent' }]}>
                  <Text style={[styles.pillText, { color: selected ? '#fff' : colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                    {l === 'he' ? 'עברית' : 'English'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* תצוגה */}
          <Text style={[styles.section, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'תצוגה' : 'Appearance'}</Text>
          <View style={[styles.segment, { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'flex-start' }]}>
            {appearanceOrder.map(m => {
              const selected = mode === m;
              return (
                <Pressable key={m} onPress={() => setMode(m)} style={[styles.segmentItem, { borderColor: colors.border, backgroundColor: selected ? colors.tint : 'transparent' }]}>
                  <Text style={[styles.segmentText, { color: selected ? '#fff' : colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                    {m === 'light' ? (isRTL ? 'בהיר' : 'Light') : m === 'blue' ? (isRTL ? 'כחול' : 'Blue') : (isRTL ? 'כהה' : 'Dark')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* --- כפתור פידבק (מעוצב מחדש) --- */}
          <View style={{ marginTop: 24, paddingHorizontal: 4, alignItems: 'center' }}>
            {/* כפתור אדמין */}
            {user?.isAdmin && (
              <Pressable
                onPress={() => { onClose(); navigation.navigate('AdminUsers'); }}
                style={({ pressed }) => [
                  styles.feedbackButton,
                  {
                    borderColor: colors.tint,
                    backgroundColor: pressed ? 'rgba(0,122,255,0.1)' : 'transparent',
                    marginBottom: 12
                  }
                ]}
              >
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Text style={[styles.feedbackText, { color: colors.tint }]}>
                    {isRTL ? 'ניהול משתמשים (Admin)' : 'Admin Panel'}
                  </Text>
                  <Ionicons name="people-circle-outline" size={20} color={colors.tint} />
                </View>
              </Pressable>
            )}

            <Pressable
              onPress={() => setFeedbackVisible(true)}
              style={({ pressed }) => [
                styles.feedbackButton,
                {
                  borderColor: colors.border,
                  backgroundColor: pressed ? 'rgba(128,128,128,0.1)' : 'transparent' // אפקט לחיצה עדין
                }
              ]}
            >
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Text style={[styles.feedbackText, { color: colors.text }]}>
                  {t(lang, 'feedback.btnLabel')}
                </Text>
                {/* אייקון נורה */}
                <Text style={{ fontSize: 18 }}>💡</Text>
              </View>
            </Pressable>
          </View>

          {/* כפתור סגירה */}
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>{isRTL ? 'סגור' : 'Close'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* קומפוננטת המודל לפידבק */}
      <FeedbackModal visible={feedbackVisible} onClose={() => setFeedbackVisible(false)} />
    </>
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
  closeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  tariffRow: { alignItems: 'center', marginBottom: 8 },
  tariffButton: { borderWidth: 1.5, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, minWidth: 110, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginLeft: 8 },
  tariffButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  tariffLabelWrapper: { flex: 1 },
  tariffLabel: { fontSize: 12, fontWeight: '500' },
  checkboxRow: { alignItems: 'center', marginTop: 4, marginBottom: 8, paddingHorizontal: 2 },
  checkboxBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  checkboxInner: { width: 12, height: 12, borderRadius: 3, backgroundColor: '#ffffff' },
  checkboxLabelWrapper: { flex: 1 },
  checkboxLabel: { fontSize: 13, fontWeight: '600' },

  // --- עיצוב חדש לכפתור פידבק (תואם לשאר הכפתורים) ---
  feedbackButton: {
    borderWidth: 1.5,
    borderRadius: 20, // תואם ל-tariffButton
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: '700',
  },
  accountBtn: {
    marginVertical: 12,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  accountBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});