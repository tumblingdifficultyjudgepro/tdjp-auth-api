import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import { useAuth } from '@/shared/state/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

const COUNTRIES = [
    { label: '🇮🇱 ישראל', value: 'ישראל', dial: '+972' },
    { label: '🇬🇧 בריטניה', value: 'בריטניה', dial: '+44' },
    { label: '🇺🇸 ארצות הברית', value: 'ארצות הברית', dial: '+1' },
    { label: '🇷🇺 רוסיה', value: 'רוסיה', dial: '+7' },
    { label: '🇺🇦 אוקראינה', value: 'אוקראינה', dial: '+380' },
    { label: '🇨🇳 סין', value: 'סין', dial: '+86' },
];

const CLUBS = ['מכבי אקרוג\'ים', 'הפועל תל אביב', 'שער הנגב', 'מכבי קריית אונו', 'הפועל לב השרון'];
const JUDGE_LEVELS = ['מתחיל', 'מתקדם', 'בינלאומי'];
const BREVET_LEVELS = ['1', '2', '3', '4'];

// Added forcedContentDirection prop to control input direction independent of UI layout
const InputField = ({ label, value, onChange, secure = false, keyboardType = 'default', colors, prefix, style, isRTL, forcedContentDirection }: any) => {
    // If forcedContentDirection is 'ltr', the input and prefix follow LTR logic (Row, Left Align)
    // Otherwise it follows the global isRTL
    const contentIsRTL = forcedContentDirection ? (forcedContentDirection === 'rtl') : isRTL;

    return (
        <View style={[{ gap: 8 }, style]}>
            <Text style={[styles.label, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
            <View style={[
                styles.inputContainer,
                {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    flexDirection: contentIsRTL ? 'row-reverse' : 'row'
                }
            ]}>
                {prefix && (
                    <Text style={[
                        styles.prefix,
                        {
                            color: colors.muted,
                            // If LTR: Prefix [Space] Input. marginRight.
                            // If RTL: Prefix [Space] Input. marginLeft.
                            marginRight: contentIsRTL ? 0 : 8,
                            marginLeft: contentIsRTL ? 8 : 0
                        }
                    ]}>
                        {prefix}
                    </Text>
                )}
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: colors.text,
                            textAlign: contentIsRTL ? 'right' : 'left'
                        }
                    ]}
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={secure}
                    keyboardType={keyboardType}
                />
            </View>
        </View>
    );
};

const SelectButton = ({ label, value, placeholder, onPress, colors, style, isRTL }: any) => (
    <View style={[{ gap: 8 }, style]}>
        <Text style={[styles.label, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
        <TouchableOpacity
            onPress={onPress}
            style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'space-between', flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
            <Text
                style={{ color: value ? colors.text : colors.muted, fontSize: 16, flex: 1, textAlign: isRTL ? 'right' : 'left' }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
            >
                {value || placeholder}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.muted} style={{ marginLeft: isRTL ? 8 : 0, marginRight: isRTL ? 0 : 8 }} />
        </TouchableOpacity>
    </View>
);

const RoleButton = ({ label, checked, onPress, colors }: any) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.roleBtn,
            {
                backgroundColor: checked ? '#3b82f6' : 'transparent',
                borderColor: checked ? '#3b82f6' : colors.border
            }
        ]}
    >
        <Text
            style={{
                color: checked ? 'white' : '#888',
                fontSize: 16,
                fontWeight: '600',
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
        >
            {label}
        </Text>
        {checked && <View style={styles.checkIcon}><Ionicons name="checkmark" size={12} color="#3b82f6" /></View>}
    </TouchableOpacity>
);

const getErrorText = (err: string, lang: 'he' | 'en') => {
    if (!err) return '';
    // Check if error matches a key in auth.errors
    const key = Object.keys(t(lang, 'auth.errors')).find(k => k === err || err.includes(k) || err.includes(k.toUpperCase()));
    if (key) return t(lang, `auth.errors.${key}` as any);

    // Manual mapping for common backend codes
    if (err.includes('EMAIL_TAKEN')) return t(lang, 'auth.errors.emailTaken');
    if (err.includes('PHONE_TAKEN')) return t(lang, 'auth.errors.phoneTaken');
    if (err.includes('MISSING_FIELDS')) return t(lang, 'auth.errors.fillAll');
    if (err.includes('INVALID_CODE')) return t(lang, 'auth.errors.invalidCode');
    if (err.includes('CODE_EXPIRED')) return t(lang, 'auth.errors.codeExpired');

    return err; // Fallback to original text
};

export default function RegisterScreen() {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const { registerStart, registerVerify, adminUpdateUser } = useAuth();
    const navigation = useNavigation<any>();
    const params = useRoute().params as any;
    const editUser = params?.editUser;

    const isRTL = lang === 'he';

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');

    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);

    const [countryValue, setCountryValue] = useState('');
    const selectedCountry = useMemo(() => COUNTRIES.find(c => c.value === countryValue), [countryValue]);

    const dial = selectedCountry?.dial || '';
    const [localPhone, setLocalPhone] = useState('');

    const [isJudge, setIsJudge] = useState(false);
    const [isCoach, setIsCoach] = useState(false);

    const [club, setClub] = useState('');
    const [judgeLevel, setJudgeLevel] = useState('');
    const [brevet, setBrevet] = useState('1');

    // Pre-fill if editing
    useEffect(() => {
        if (editUser) {
            setFirstName(editUser.firstName || '');
            setLastName(editUser.lastName || '');
            setEmail(editUser.email || '');

            // Handle Phone
            const fullPhone = editUser.phone || '';
            // Try to detect country from dial code (Simple heuristic)
            const c = COUNTRIES.find(x => fullPhone.startsWith(x.dial));
            if (c) {
                setCountryValue(c.value);
                setLocalPhone(fullPhone.replace(c.dial, '').trim());
            } else {
                setLocalPhone(fullPhone);
            }

            // Role
            if (editUser.role === 'judge') setIsJudge(true);
            if (editUser.role === 'coach') setIsCoach(true);
            // TODO: Club/Level/Avatar might need complex mapping if backend format differs, assuming standard for now
            if (editUser.club) setClub(editUser.club);
            if (editUser.judgeLevel) setJudgeLevel(editUser.judgeLevel);
            if (editUser.brevetLevel) setBrevet(String(editUser.brevetLevel));
            if (editUser.avatarUrl) setAvatar(editUser.avatarUrl);
        }
    }, [editUser]);

    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const [showControls, setShowControls] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'country' | 'club' | 'level' | null>(null);

    // Verification State
    const [showVerification, setShowVerification] = useState(false);
    const [verificationId, setVerificationId] = useState('');
    const [verifyStep, setVerifyStep] = useState<'method' | 'code'>('code'); // Start directly at code
    const [verifyMethod, setVerifyMethod] = useState<'sms' | 'email'>('email'); // Default to email
    const [otpCode, setOtpCode] = useState('');

    // OTP Input Logic
    const otpInputRef = React.useRef<TextInput>(null);
    const handleOtpChange = (text: string) => {
        // Allow only numbers and max 6 digits
        const numeric = text.replace(/[^0-9]/g, '');
        if (numeric.length <= 6) {
            setOtpCode(numeric);
        }
    };

    const openModal = (type: 'country' | 'club' | 'level') => {
        setModalType(type);
        setModalVisible(true);
    };

    const handleSelect = (item: any) => {
        if (modalType === 'country') setCountryValue(item.value);
        if (modalType === 'club') setClub(item);
        if (modalType === 'level') setJudgeLevel(item);
        setModalVisible(false);
    };

    const handleCameraPress = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled && result.assets[0].base64) {
            setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
            setShowControls(false);
        }
    };

    const handleGalleryPress = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Gallery permission is required');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled && result.assets[0].base64) {
            setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
            setShowControls(false);
        }
    };

    const handleRemoveAvatar = () => {
        setAvatar(null);
        setShowControls(false);
    };

    const handleRegister = async () => {
        // Validation: Password optional in edit mode
        if (!firstName || !lastName || !email || (!editUser && !password) || !localPhone || !countryValue) {
            setErr(t(lang, 'auth.errors.fillAll'));
            return;
        }
        if (isCoach && !club) {
            setErr(t(lang, 'auth.errors.selectClub'));
            return;
        }
        if (isJudge) {
            if (!judgeLevel) {
                setErr(t(lang, 'auth.errors.invalidJudgeLevel'));
                return;
            }
            if (judgeLevel === 'בינלאומי' && !brevet) {
                setErr(t(lang, 'auth.errors.selectBrevet'));
                return;
            }
        }

        setErr('');
        setBusy(true);
        try {
            const fullName = `${firstName} ${lastName}`;
            const payload: any = {
                email,
                fullName,
                firstName,
                lastName,
                phone: dial + ' ' + localPhone,
                country: countryValue,
                role: isJudge ? 'judge' : isCoach ? 'coach' : 'user', // Basic role logic
                isCoach,
                club: isCoach ? club : null,
                isJudge,
                judgeLevel: isJudge ? judgeLevel : null,
                brevetLevel: isJudge && judgeLevel === 'בינלאומי' ? brevet : null,
                avatarUrl: avatar
            };

            // Edit Mode
            if (editUser) {
                if (password) payload.password = password;
                // Add isAdmin toggle if current user is admin? No, stick to simple edit for now or just what's here.
                // The prompt asked for "Admin sets details", so we should probably allow setting isAdmin here too?
                // For now, let's just save the profile details. Admin status was in the list screen.

                await adminUpdateUser(editUser.id, payload);
                Alert.alert("Success", "User updated");
                navigation.goBack();
                return;
            }

            payload.password = password;
            const payloadWithChannel = { ...payload, channel: 'email' };

            // Call START registration (sends email)
            const response = await registerStart(payloadWithChannel);
            setVerificationId(response.verificationId);

            // Registration initiated! Show verification Flow.
            setBusy(false);
            setShowVerification(true);
            setVerifyStep('code');
        } catch (e: any) {
            setErr(e.message || (lang === 'he' ? 'שגיאה בהרשמה' : 'Registration failed'));
        } finally {
            setBusy(false);
        }
    };

    const listData = useMemo(() => {
        if (modalType === 'country') return COUNTRIES;
        if (modalType === 'level') return JUDGE_LEVELS;
        if (modalType === 'club') return CLUBS;
        return [];
    }, [modalType]);

    const coachLabel = t(lang, 'auth.coach');
    const judgeLabel = t(lang, 'auth.judge');

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                    <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={() => setShowControls(!showControls)} activeOpacity={0.8}>
                        <View style={[styles.avatarCircle, { backgroundColor: '#3b82f6', overflow: 'hidden' }]}>
                            {avatar ? (
                                <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <Ionicons name="person" size={40} color="white" />
                            )}
                        </View>
                        {/* Plus Badge - only show if controls are HIDDEN */}
                        {!showControls && (
                            <View style={styles.plusBadge}>
                                <Ionicons name="add" size={16} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Controls - only show if controls are VISIBLE */}
                    {showControls && (
                        <View style={styles.avatarControls}>
                            <TouchableOpacity onPress={handleCameraPress} style={[styles.controlBtn, { borderColor: colors.border }]}>
                                <Ionicons name="camera" size={18} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleGalleryPress} style={[styles.controlBtn, { borderColor: colors.border }]}>
                                <Ionicons name="images" size={18} color={colors.text} />
                            </TouchableOpacity>
                            {!!avatar && (
                                <TouchableOpacity onPress={handleRemoveAvatar} style={[styles.controlBtn, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]}>
                                    <Ionicons name="trash" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.form}>

                        {/* Row 1: Last Name | First Name */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <InputField
                                label={t(lang, 'auth.lastName')}
                                value={lastName}
                                onChange={setLastName}
                                colors={colors}
                                style={{ flex: 1 }}
                                isRTL={isRTL}
                            />
                            <InputField
                                label={t(lang, 'auth.firstName')}
                                value={firstName}
                                onChange={setFirstName}
                                colors={colors}
                                style={{ flex: 1 }}
                                isRTL={isRTL}
                            />
                        </View>

                        {/* Row 2: Phone | Country */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <InputField
                                label={t(lang, 'auth.phone')}
                                value={localPhone}
                                onChange={setLocalPhone}
                                keyboardType="phone-pad"
                                colors={colors}
                                prefix={dial}
                                style={{ flex: 1 }}
                                isRTL={isRTL}
                                forcedContentDirection="ltr" // Force LTR for phone input
                            />
                            <SelectButton
                                label={t(lang, 'auth.country')}
                                value={selectedCountry ? selectedCountry.label : ''}
                                placeholder={t(lang, 'auth.selectCountry')}
                                onPress={() => openModal('country')}
                                colors={colors}
                                style={{ flex: 1 }}
                                isRTL={isRTL}
                            />
                        </View>

                        {/* Row 3: Email */}
                        <InputField
                            label={t(lang, 'auth.email')}
                            value={email}
                            onChange={setEmail}
                            keyboardType="email-address"
                            colors={colors}
                            isRTL={isRTL}
                            forcedContentDirection="ltr" // Force LTR for email
                        />

                        <InputField
                            label={(t(lang, 'auth.password') || 'סיסמה') + (editUser ? ' (השאר ריק ללא שינוי)' : '')}
                            value={password}
                            onChange={setPassword}
                            secure={true}
                            colors={colors}
                            isRTL={isRTL}
                            forcedContentDirection="ltr"
                        />

                        {/* Row 4: Toggles - Coach | Judge */}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                            <View style={{ flex: 1 }}>
                                <RoleButton
                                    label={coachLabel}
                                    checked={isCoach}
                                    onPress={() => setIsCoach(!isCoach)}
                                    colors={colors}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <RoleButton
                                    label={judgeLabel}
                                    checked={isJudge}
                                    onPress={() => setIsJudge(!isJudge)}
                                    colors={colors}
                                />
                                {isJudge && !isCoach && (
                                    <Text style={{
                                        color: '#eab308', // Yellow-500
                                        fontSize: 12,
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        marginTop: 4
                                    }}>
                                        {t(lang, 'auth.errors.neutralJudge' as any)}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Row 5: Club | Judge Level */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                {isCoach && (
                                    <SelectButton
                                        label={t(lang, 'auth.club')}
                                        value={club}
                                        placeholder={t(lang, 'auth.selectClubPlaceholder')}
                                        onPress={() => openModal('club')}
                                        colors={colors}
                                        isRTL={isRTL}
                                    />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                {isJudge && (
                                    <SelectButton
                                        label={t(lang, 'auth.judgeLevel')}
                                        value={judgeLevel}
                                        placeholder={t(lang, 'auth.selectJudgeLevel')}
                                        onPress={() => openModal('level')}
                                        colors={colors}
                                        isRTL={isRTL}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Brevet Level - Smaller circles + Right aligned */}
                        {isJudge && judgeLevel === 'בינלאומי' && (
                            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', marginTop: 8 }}>
                                <Text style={[styles.label, { color: colors.text, marginBottom: 8, textAlign: isRTL ? 'right' : 'left', width: '100%' }]}>
                                    {t(lang, 'auth.brevet')}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 8, justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                                    {(isRTL ? [4, 3, 2, 1] : [1, 2, 3, 4]).map(l => (
                                        <TouchableOpacity
                                            key={l}
                                            onPress={() => setBrevet(String(l))}
                                            style={[styles.circleBtn, {
                                                borderColor: brevet === String(l) ? '#3b82f6' : colors.border,
                                                backgroundColor: brevet === String(l) ? '#3b82f6' : 'transparent'
                                            }]}
                                        >
                                            <Text style={{ color: brevet === String(l) ? 'white' : colors.text, fontWeight: 'bold' }}>{l}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}


                        {!!err && <Text style={[styles.errorText, { textAlign: 'center' }]}>{err}</Text>}

                        <TouchableOpacity onPress={handleRegister} disabled={busy} style={{ marginTop: 20 }}>
                            <LinearGradient
                                colors={['#3b82f6', '#2563eb']}
                                style={styles.submitBtn}
                            >
                                {busy ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.submitBtnText}>{editUser ? (isRTL ? 'שמור שינויים' : 'Save Changes') : t(lang, 'auth.submitRegister')}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Verification Modal */}
            <Modal visible={showVerification} transparent animationType="slide">
                <View style={styles.verifyOverlay}>
                    <View style={[styles.verifyContent, { backgroundColor: colors.card, borderColor: colors.border }]}>

                        {verifyStep === 'method' && (
                            <View style={{ alignItems: 'center', gap: 20 }}>
                                <Text style={[styles.verifyTitle, { color: colors.text }]}>
                                    {t(lang, 'auth.verifyTitle') || 'אימות חשבון'}
                                </Text>
                                <Text style={[styles.verifySubtitle, { color: colors.muted }]}>
                                    {t(lang, 'auth.verifySubtitle') || 'איך תרצה לקבל את קוד האימות?'}
                                </Text>

                                <View style={{ flexDirection: 'row', gap: 16, width: '100%' }}>
                                    <TouchableOpacity
                                        style={[styles.methodBtn, { borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                                        onPress={() => { setVerifyMethod('sms'); setVerifyStep('code'); }}
                                    >
                                        <Ionicons name="chatbubble-ellipses-outline" size={32} color="#3b82f6" />
                                        <Text style={{ color: colors.text, marginTop: 8, fontWeight: '600' }}>SMS</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.methodBtn, { borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                                        onPress={() => { setVerifyMethod('email'); setVerifyStep('code'); }}
                                    >
                                        <Ionicons name="mail-outline" size={32} color="#3b82f6" />
                                        <Text style={{ color: colors.text, marginTop: 8, fontWeight: '600' }}>Email</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {verifyStep === 'code' && (
                            <View style={{ alignItems: 'center', gap: 20, width: '100%' }}>
                                <Text style={[styles.verifyTitle, { color: colors.text }]}>
                                    {t(lang, 'auth.enterCode')}
                                </Text>

                                <View style={{ alignItems: 'center' }}>
                                    <Text style={[styles.verifySubtitle, { color: colors.muted }]}>
                                        {t(lang, 'auth.verifySubtitle')}
                                    </Text>
                                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>
                                        {email}
                                    </Text>
                                </View>

                                {/* Hidden Input Overlay */}
                                <View style={{ position: 'relative', height: 60, width: '100%' }}>
                                    <TextInput
                                        ref={otpInputRef}
                                        value={otpCode}
                                        onChangeText={handleOtpChange}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        autoFocus
                                        style={{
                                            position: 'absolute', opacity: 0, width: '100%', height: '100%', zIndex: 10
                                        }}
                                    />
                                    {/* Visible Boxes */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: '100%', direction: 'ltr' }}>
                                        {[0, 1, 2, 3, 4, 5].map((i) => (
                                            <View
                                                key={i}
                                                style={[
                                                    styles.otpBox,
                                                    {
                                                        borderColor: otpCode.length === i ? '#3b82f6' : colors.border,
                                                        backgroundColor: colors.bg
                                                    }
                                                ]}
                                            >
                                                <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
                                                    {otpCode[i] || ''}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Error / Success Message */}
                                {!!err && (
                                    <Text style={[styles.errorText, { textAlign: 'center', fontWeight: 'bold', color: err === 'SUCCESS_MSG' ? '#10b981' : '#ef4444' }]}>
                                        {err === 'SUCCESS_MSG' ? t(lang, 'auth.verifySuccess') : getErrorText(err, lang)}
                                    </Text>
                                )}

                                {/* Verify Action Button */}
                                <TouchableOpacity
                                    onPress={async () => {
                                        if (otpCode.length === 6) {
                                            setBusy(true);
                                            setErr('');
                                            try {
                                                await registerVerify(verificationId, otpCode);
                                                // Success!
                                                setErr('SUCCESS_MSG');
                                                setTimeout(() => {
                                                    setShowVerification(false);
                                                    if (navigation.canGoBack()) navigation.popToTop();
                                                    else navigation.navigate('Tabs' as never);
                                                }, 2000);
                                            } catch (e: any) {
                                                setBusy(false);
                                                // Map backend error code to local error state
                                                const code = e.error || e.message || 'server';
                                                // Note: e.error usually contains the code like 'INVALID_CODE' from our backend
                                                setErr(code);
                                            }
                                        }
                                    }}
                                    disabled={otpCode.length < 6 || busy || err === 'SUCCESS_MSG'}
                                    style={{
                                        marginTop: 20,
                                        backgroundColor: err === 'SUCCESS_MSG' ? '#10b981' : '#3b82f6',
                                        paddingHorizontal: 32,
                                        paddingVertical: 14,
                                        borderRadius: 12,
                                        width: '100%',
                                        alignItems: 'center',
                                        opacity: otpCode.length < 6 ? 0.5 : 1
                                    }}
                                >
                                    {busy ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                                            {err === 'SUCCESS_MSG' ? t(lang, 'auth.verifySuccess') : t(lang, 'auth.verifyBtn')}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal visible={modalVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <FlatList
                            data={listData}
                            keyExtractor={(item: any) => modalType === 'country' ? item.value : item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => handleSelect(item)}
                                >
                                    {modalType === 'country' ? (
                                        <Text style={{ color: colors.text, fontSize: 18, textAlign: 'center' }}>
                                            {item.label}
                                        </Text>
                                    ) : (
                                        <Text style={{ color: colors.text, fontSize: 18, textAlign: 'center' }}>{item}</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 40, // Added top spacing
        paddingBottom: 20
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    avatarSection: {
        alignItems: 'center',
        justifyContent: 'center',
        // gap removed, controls are absolute
        width: 80, // strict width to match avatar for absolute positioning context
        height: 80,
    },
    avatarControls: {
        position: 'absolute',
        bottom: -10,
        right: -20, // shifting right to not cover center
        flexDirection: 'row',
        gap: 8,
        zIndex: 10
    },
    controlBtn: {
        width: 36, // slightly smaller controls
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        backgroundColor: 'white', // Ensure opaque background
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3b82f6',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
        zIndex: 5
    },
    content: {
        padding: 24,
    },
    form: {
        gap: 20,
        paddingBottom: 40
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4
    },
    inputContainer: {
        height: 54,
        borderWidth: 1,
        borderRadius: 12,
        alignItems: 'center',
        paddingHorizontal: 10, // Reduced from 16
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 14,
    },
    roleBtn: {
        height: 54,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        position: 'relative'
    },
    checkIcon: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center'
    },
    circleBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtn: {
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
    prefix: {
        fontSize: 14,
        flexShrink: 0,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        maxHeight: '50%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16
    },
    modalItem: {
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333'
    },
    // Verification Styles
    verifyOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20
    },
    verifyContent: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 30,
        minHeight: 300,
        justifyContent: 'center'
    },
    verifyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    verifySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10
    },
    methodBtn: {
        flex: 1,
        height: 100,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    otpBox: {
        width: 45,
        height: 60,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    verifyBtn: {
        width: '100%',
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10
    }
});
