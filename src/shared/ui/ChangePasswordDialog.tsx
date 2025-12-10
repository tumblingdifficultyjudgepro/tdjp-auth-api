import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { useAuth } from '@/shared/state/auth';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/shared/i18n';

type Props = {
    visible: boolean;
    onClose: () => void;
};

type Step = 'send' | 'verify' | 'password';

export default function ChangePasswordDialog({ visible, onClose }: Props) {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const { changePasswordStart, changePasswordVerify, changePasswordComplete } = useAuth();
    const isRTL = lang === 'he';

    const [step, setStep] = useState<Step>('send');
    const [loading, setLoading] = useState(false);
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [code, setCode] = useState('');

    // Password fields
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI Feedback
    const [error, setError] = useState('');

    const otpInputRef = useRef<TextInput>(null);

    // Reset on open/close
    useEffect(() => {
        if (!visible) {
            setStep('send');
            setVerificationId(null);
            setCode('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [visible]);

    // Auto-focus OTP when entering verify step
    useEffect(() => {
        if (step === 'verify' && otpInputRef.current) {
            setTimeout(() => otpInputRef.current?.focus(), 100);
        }
    }, [step]);

    // Auto-submit code when 6 digits reached
    useEffect(() => {
        if (step === 'verify' && code.length === 6) {
            handleVerifyCode();
        }
    }, [code]);

    const handleSendCode = async () => {
        setLoading(true);
        setError('');
        try {
            const vid = await changePasswordStart();
            setVerificationId(vid);
            setStep('verify');
        } catch (e: any) {
            setError(e.message || 'Failed to send code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationId) return;
        setLoading(true);
        setError('');
        try {
            await changePasswordVerify(verificationId, code);
            setStep('password');
        } catch (e: any) {
            setError(e.message || 'Invalid code');
            // Shake effect or similar could go here
        } finally {
            setLoading(false);
        }
    };

    const handleSavePassword = async () => {
        if (!newPassword || !confirmPassword) {
            setError(isRTL ? 'נא למלא את כל השדות' : 'Please fill all fields');
            return;
        }
        if (newPassword.length < 8) {
            setError(isRTL ? 'הסיסמה חייבת להיות לפחות 8 תווים' : 'Password must be at least 8 chars');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(isRTL ? 'הסיסמאות אינן תואמות' : 'Passwords show mismatch');
            return;
        }
        if (!verificationId) return;

        setLoading(true);
        setError('');
        try {
            await changePasswordComplete(verificationId, code, newPassword);
            await changePasswordComplete(verificationId, code, newPassword);
            Alert.alert(isRTL ? 'הצלחה' : 'Success', t(lang, 'auth.changePassword.success'));
            onClose();
        } catch (e: any) {
            setError(e.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.title, { color: colors.text }]}>{t(lang, 'auth.changePassword.title')}</Text>

                    {/* Content Area */}
                    <View style={styles.content}>
                        {step === 'send' && (
                            <View style={{ gap: 16 }}>
                                <Text style={[styles.desc, { color: colors.text }]}>
                                    {t(lang, 'auth.changePassword.descriptionStart')}
                                </Text>
                                <Pressable onPress={handleSendCode} disabled={loading} style={[styles.primaryBtn, { backgroundColor: '#3b82f6' }]}>
                                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>{t(lang, 'auth.changePassword.sendCode')}</Text>}
                                </Pressable>
                            </View>
                        )}

                        {step === 'verify' && (
                            <View style={{ gap: 20 }}>
                                <Text style={[styles.desc, { color: colors.text }]}>
                                    {t(lang, 'auth.changePassword.verifyInstruction')}
                                </Text>

                                {/* 6-Box Input */}
                                <View style={{ position: 'relative', height: 60, width: '100%', alignItems: 'center' }}>
                                    <TextInput
                                        ref={otpInputRef}
                                        value={code}
                                        onChangeText={setCode}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        style={styles.hiddenInput}
                                    />
                                    <View style={{ flexDirection: 'row', gap: 8, direction: 'ltr' }}>
                                        {[0, 1, 2, 3, 4, 5].map((i) => (
                                            <View
                                                key={i}
                                                style={[
                                                    styles.otpBox,
                                                    {
                                                        borderColor: code.length === i ? '#3b82f6' : colors.border,
                                                        backgroundColor: colors.bg
                                                    }
                                                ]}
                                            >
                                                <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
                                                    {code[i] || ''}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {loading && <ActivityIndicator color="#3b82f6" />}
                            </View>
                        )}

                        {step === 'password' && (
                            <View style={{ gap: 16 }}>
                                <Text style={[styles.desc, { color: colors.text }]}>
                                    {t(lang, 'auth.changePassword.newPasswordPlaceholder')}
                                </Text>

                                <View style={styles.inputGroup}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder={t(lang, 'auth.changePassword.newPasswordPlaceholder')}
                                        placeholderTextColor={colors.border}
                                        secureTextEntry
                                    />
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        placeholder={t(lang, 'auth.changePassword.confirmPasswordPlaceholder')}
                                        placeholderTextColor={colors.border}
                                        secureTextEntry
                                    />
                                </View>

                                <Pressable onPress={handleSavePassword} disabled={loading} style={[styles.primaryBtn, { backgroundColor: '#3b82f6', marginTop: 10 }]}>
                                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>{t(lang, 'auth.changePassword.saveFinish')}</Text>}
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {/* Error Display */}
                    {!!error && (
                        <Text style={{ color: '#ef4444', textAlign: 'center', fontWeight: 'bold', marginTop: 12 }}>
                            {error}
                        </Text>
                    )}

                    <Pressable onPress={onClose} style={[styles.primaryBtn, { backgroundColor: colors.border, marginTop: 24, elevation: 0 }]}>
                        <Text style={[styles.btnText, { color: colors.text }]}>{t(lang, 'auth.errors.cancel')}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    dialog: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        elevation: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    content: {
        minHeight: 120,
    },
    desc: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        opacity: 0.9,
    },
    primaryBtn: {
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // OTP Styles
    hiddenInput: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0,
        zIndex: 10,
    },
    otpBox: {
        width: 44,
        height: 54,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Password Inputs
    inputGroup: {
        gap: 12,
    },
    input: {
        borderWidth: 1.5,
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 16,
        fontSize: 16,
    },
});
