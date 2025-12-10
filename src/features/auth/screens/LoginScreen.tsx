import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import { useAuth } from '@/shared/state/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const getErrorText = (err: string, lang: 'he' | 'en') => {
    if (!err) return '';
    if (err.includes('Invalid credentials')) return t(lang, 'auth.errors.invalidCredentials' as any);
    if (err.includes('MISSING_FIELDS')) return t(lang, 'auth.errors.fillAll' as any);
    return err;
};

import ForgotPasswordDialog from '@/shared/ui/ForgotPasswordDialog';

export default function LoginScreen() {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const { login } = useAuth();
    const navigation = useNavigation<any>();

    const isRTL = lang === 'he';
    const textAlign = isRTL ? 'right' : 'left';
    const flexDirection = isRTL ? 'row-reverse' : 'row';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const [forgotPassVisible, setForgotPassVisible] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            setErr('MISSING_FIELDS');
            return;
        }
        setErr('');
        setBusy(true);
        setBusy(true);
        try {
            await login(email, password, rememberMe);
            if (navigation.canGoBack()) {
                navigation.popToTop();
            } else {
                navigation.navigate('Tabs' as never);
            }
        } catch (e: any) {
            setErr(e.message || 'server');
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { flexDirection }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                    <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t(lang, 'auth.login')}</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text, textAlign }]}>
                                {t(lang, 'auth.email')}
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    color: colors.text,
                                    borderColor: colors.border,
                                    backgroundColor: colors.card,
                                    textAlign
                                }]}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text, textAlign }]}>
                                {t(lang, 'auth.password')}
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    color: colors.text,
                                    borderColor: colors.border,
                                    backgroundColor: colors.card,
                                    textAlign
                                }]}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        {/* Forgot Password Link */}
                        <TouchableOpacity
                            onPress={() => setForgotPassVisible(true)}
                            style={{ alignSelf: isRTL ? 'flex-end' : 'flex-start', marginTop: 8 }}
                        >
                            <Text style={{ color: colors.tint, fontSize: 14, fontWeight: '600' }}>
                                {t(lang, 'auth.forgotPassword')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: isRTL ? 'flex-end' : 'flex-start',
                                alignSelf: 'stretch',
                                marginTop: 12, // Increased top margin
                                marginBottom: 4 // Added bottom margin
                            }}
                            onPress={() => setRememberMe(!rememberMe)}
                            activeOpacity={0.8}
                        >
                            {isRTL ? (
                                <>
                                    <Text style={{ color: colors.text, fontSize: 14, flex: 1, textAlign: 'right' }}>
                                        {t(lang, 'auth.rememberMe' as any)}
                                    </Text>
                                    <View style={{ width: 8 }} />
                                    <Ionicons
                                        name={rememberMe ? "checkbox" : "square-outline"}
                                        size={24}
                                        color={rememberMe ? colors.tint : colors.text}
                                    />
                                </>
                            ) : (
                                <>
                                    <Ionicons
                                        name={rememberMe ? "checkbox" : "square-outline"}
                                        size={24}
                                        color={rememberMe ? colors.tint : colors.text}
                                    />
                                    <View style={{ width: 8 }} />
                                    <Text style={{ color: colors.text, fontSize: 14, flex: 1, textAlign: 'left' }}>
                                        {t(lang, 'auth.rememberMe' as any)}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {!!err && <Text style={[styles.errorText, { textAlign }]}>{getErrorText(err, lang)}</Text>}

                        <TouchableOpacity onPress={handleLogin} disabled={busy}>
                            <LinearGradient
                                colors={['#7c3aed', '#6d28d9']}
                                style={styles.submitBtn}
                            >
                                {busy ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.submitBtnText}>{t(lang, 'auth.submitLogin')}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={[styles.footer, { flexDirection }]}>
                            <Text style={{ color: colors.text }}>
                                {t(lang, 'auth.noAccount')}
                            </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={{ color: colors.tint, fontWeight: 'bold' }}>
                                    {t(lang, 'auth.registerLink')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>


            <ForgotPasswordDialog
                visible={forgotPassVisible}
                onClose={() => setForgotPassVisible(false)}
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 24,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        opacity: 0.8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    submitBtn: {
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
    },
    footer: {
        justifyContent: 'center',
        marginTop: 16,
        gap: 4,
    },
});
