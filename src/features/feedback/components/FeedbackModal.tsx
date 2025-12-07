import React, { useState, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, 
  Alert, Image as RNImage, ActivityIndicator, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAppTheme } from '@/shared/theme/theme'; 
import { useLang } from '@/shared/state/lang';       
import { t } from '@/shared/i18n';                   

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  const WORKER_URL = 'https://tdjp-feedback.tumblingdifficultyjudgepro.workers.dev';

  const palette = {
    primary: '#6C5CE7',
    muted: '#9AA0C3',
    border: colors.border || '#262B57',
    card: colors.card || '#15193B',
    text: colors.text || '#F0F3FF',
    tint: '#6C5CE7'
  };

  const [fullName, setFullName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'idea' | 'bug' | null>(null);
  const [attachments, setAttachments] = useState<ImagePicker.ImagePickerAsset[]>([]);
  
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [doneType, setDoneType] = useState<'idea' | 'bug' | null>(null);

  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  
  const requiredOk = !!(fullName.trim() && subject.trim() && message.trim() && feedbackType);

  const pickAttachment = async () => {
    if (attachments.length >= 3) {
      Alert.alert(t(lang, 'feedback.maxImages'));
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t(lang, 'feedback.noPermission'));
      return;
    }
    
    // 👇👇👇 חזרנו ל-MediaTypeOptions כדי לסדר את שגיאת ה-TS 👇👇👇
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      setAttachments(prev => [...prev, res.assets[0]]);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments(arr => arr.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!requiredOk || busy || !feedbackType) return;
    setBusy(true);

    try {
      const formData = new FormData();
      
      formData.append('type', feedbackType);
      formData.append('fullName', fullName);
      formData.append('subject', subject);
      formData.append('message', message);
      formData.append('lang', lang);
      formData.append('platform', Platform.OS);
      formData.append('ts', Date.now().toString());

      attachments.forEach((a, i) => {
        const file = {
          uri: a.uri,
          name: a.fileName || `image_${i}.jpg`,
          type: a.mimeType || 'image/jpeg',
        };
        // @ts-ignore
        formData.append(`attachment${i}`, file);
      });

      const res = await fetch(WORKER_URL, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Server response was not ok');
      }

      setDoneType(feedbackType);
      setDone(true);
      
      setFullName('');
      setSubject('');
      setMessage('');
      setAttachments([]);
      setFeedbackType(null);

    } catch (err: any) {
      console.error(err);
      Alert.alert(t(lang, 'feedback.errorTitle'), t(lang, 'feedback.sendError'));
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
      setDone(false);
      onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          
          {done ? (
             <View style={{ alignItems: 'center', padding: 20 }}>
                <Ionicons name="checkmark-circle-outline" size={64} color={palette.primary} />
                <Text style={[styles.title, { color: palette.text, marginTop: 16 }]}>
                    {doneType === 'idea' ? t(lang, 'feedback.successIdeaTitle') : t(lang, 'feedback.successBugTitle')}
                </Text>
                <Text style={{ color: palette.text, textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
                    {doneType === 'idea' ? t(lang, 'feedback.successIdeaBody') : t(lang, 'feedback.successBugBody')}
                </Text>
                <TouchableOpacity onPress={handleClose} style={[styles.btn, { backgroundColor: palette.primary, width: '100%' }]}>
                  <Text style={styles.btnText}>{t(lang, 'feedback.close')}</Text>
                </TouchableOpacity>
             </View>
          ) : (
            <KeyboardAwareScrollView
              ref={scrollRef}
              enableOnAndroid
              extraScrollHeight={20}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <Text style={[styles.title, { color: palette.text }]}>{t(lang, 'feedback.title')}</Text>

              <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => setFeedbackType('idea')}
                  style={[
                    styles.pill, 
                    { borderColor: palette.border },
                    feedbackType === 'idea' && { backgroundColor: palette.primary, borderColor: palette.primary }
                  ]}
                >
                  <Text style={[styles.pillText, { color: feedbackType === 'idea' ? '#fff' : palette.text }]}>
                    {t(lang, 'feedback.typeIdea')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFeedbackType('bug')}
                  style={[
                    styles.pill, 
                    { borderColor: palette.border },
                    feedbackType === 'bug' && { backgroundColor: palette.primary, borderColor: palette.primary }
                  ]}
                >
                  <Text style={[styles.pillText, { color: feedbackType === 'bug' ? '#fff' : palette.text }]}>
                    {t(lang, 'feedback.typeBug')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: palette.muted, textAlign: isRTL ? 'right' : 'left' }]}>{t(lang, 'feedback.name')}</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                style={[styles.input, { color: palette.text, borderColor: palette.border, textAlign: isRTL ? 'right' : 'left' }]}
              />

              <Text style={[styles.label, { color: palette.muted, textAlign: isRTL ? 'right' : 'left' }]}>{t(lang, 'feedback.subject')}</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                style={[styles.input, { color: palette.text, borderColor: palette.border, textAlign: isRTL ? 'right' : 'left' }]}
              />

              <Text style={[styles.label, { color: palette.muted, textAlign: isRTL ? 'right' : 'left' }]}>{t(lang, 'feedback.message')}</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                style={[styles.input, { color: palette.text, borderColor: palette.border, textAlign: isRTL ? 'right' : 'left', minHeight: 100, textAlignVertical: 'top' }]}
              />

              <TouchableOpacity onPress={pickAttachment} style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 10 }}>
                 <Ionicons name="attach" size={20} color={palette.text} />
                 <Text style={{ color: palette.text, fontWeight: '600', marginHorizontal: 6 }}>{t(lang, 'feedback.attach')}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginBottom: 16 }}>
                {attachments.map((a, i) => (
                  <View key={i} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden' }}>
                     <RNImage source={{ uri: a.uri }} style={{ width: '100%', height: '100%' }} />
                     <TouchableOpacity 
                        onPress={() => removeAttachment(i)}
                        style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 2 }}
                     >
                        <Ionicons name="close" size={16} color="#fff" />
                     </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10 }}>
                 <TouchableOpacity 
                    onPress={handleSend}
                    disabled={!requiredOk || busy}
                    style={[
                        styles.btn, 
                        { backgroundColor: palette.primary, flex: 1 },
                        (!requiredOk || busy) && { opacity: 0.5 }
                    ]}
                 >
                    {busy ? <ActivityIndicator color="#fff" /> : (
                        <>
                            <Ionicons name="send" size={16} color="#fff" style={{ marginHorizontal: 6 }} />
                            <Text style={styles.btnText}>{t(lang, 'feedback.send')}</Text>
                        </>
                    )}
                 </TouchableOpacity>

                 <TouchableOpacity 
                    onPress={handleClose}
                    style={[styles.btn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: palette.border, flex: 1 }]}
                 >
                    <Text style={[styles.btnText, { color: palette.text }]}>{t(lang, 'feedback.cancel')}</Text>
                 </TouchableOpacity>
              </View>

            </KeyboardAwareScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { 
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      justifyContent: 'center', 
      alignItems: 'center' 
  },
  card: { 
      width: '90%', 
      maxWidth: 450, 
      borderRadius: 16, 
      borderWidth: 1, 
      padding: 20, 
      maxHeight: '85%'
  },
  title: { 
      fontSize: 20, 
      fontWeight: '800', 
      textAlign: 'center', 
      marginBottom: 16 
  },
  label: { 
      fontSize: 12, 
      fontWeight: '700', 
      marginBottom: 6 
  },
  input: { 
      borderWidth: 1, 
      borderRadius: 10, 
      padding: 12, 
      fontSize: 14, 
      marginBottom: 12 
  },
  pill: { 
      borderWidth: 1, 
      borderRadius: 20, 
      paddingVertical: 8, 
      paddingHorizontal: 16 
  },
  pillText: { 
      fontSize: 14, 
      fontWeight: '700' 
  },
  btn: { 
      paddingVertical: 12, 
      borderRadius: 12, 
      alignItems: 'center', 
      justifyContent: 'center', 
      flexDirection: 'row' 
  },
  btnText: { 
      color: '#fff', 
      fontWeight: '800', 
      fontSize: 16 
  }
});