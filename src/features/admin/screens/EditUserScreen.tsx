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
import CustomConfirmDialog from '@/shared/ui/CustomConfirmDialog';
import ChangePasswordDialog from '@/shared/ui/ChangePasswordDialog';


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

const InputField = ({ label, value, onChange, secure = false, keyboardType = 'default', colors, prefix, style, isRTL, forcedContentDirection }: any) => {
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

const PendingBadge = ({ isRTL, text }: any) => (
    <View style={{ backgroundColor: '#fffbeb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fcd34d', flexDirection: 'row', alignItems: 'center', marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }}>
        <Ionicons name="time-outline" size={12} color="#b45309" />
        <Text style={{ fontSize: 10, color: '#92400e', marginLeft: 4, fontWeight: 'bold' }}>{text}</Text>
    </View>
);

const SelectButton = ({ label, value, placeholder, onPress, colors, style, isRTL, badge, disabled }: any) => (
    <View style={[{ gap: 8 }, style]}>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            {badge}
        </View>
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.inputContainer,
                {
                    borderColor: colors.border,
                    backgroundColor: disabled ? 'transparent' : colors.card,
                    justifyContent: 'space-between',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    opacity: disabled ? 0.6 : 1
                }
            ]}
        >
            <Text
                style={{ color: value ? colors.text : colors.muted, fontSize: 16, flex: 1, textAlign: isRTL ? 'right' : 'left' }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
            >
                {value || placeholder}
            </Text>
            {!disabled && <Ionicons name="chevron-down" size={20} color={colors.muted} style={{ marginLeft: isRTL ? 8 : 0, marginRight: isRTL ? 0 : 8 }} />}
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

export default function EditUserScreen() {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const { adminUpdateUser, adminRejectUser, adminDeleteUser, updateSelf, deleteSelf, user: currentUser } = useAuth();
    const navigation = useNavigation<any>();
    const params = useRoute().params as any;
    const editUser = params?.user;
    const isSelf = params?.isSelf || false;

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
    const [isAdmin, setIsAdmin] = useState(false);

    const [club, setClub] = useState('');
    const [judgeLevel, setJudgeLevel] = useState('');
    const [brevet, setBrevet] = useState('1');

    const [busy, setBusy] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [changePassVisible, setChangePassVisible] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'country' | 'club' | 'level' | null>(null);

    type AlertConfig = {
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'destructive' | 'info';
        onConfirm?: () => void;
        onCancel?: () => void;
        confirmLabel?: string;
        cancelLabel?: string;
        cancelTextColor?: string;
    };

    const [alertConfig, setAlertConfig] = useState<AlertConfig>({ visible: false, title: '', message: '', type: 'info', onConfirm: () => { } });

    // Initial Population
    useEffect(() => {
        if (editUser) {
            setFirstName(editUser.firstName || '');
            setLastName(editUser.lastName || '');
            setEmail(editUser.email || '');

            const fullPhone = editUser.phone || '';
            const c = COUNTRIES.find(x => fullPhone.startsWith(x.dial));
            if (c) {
                setCountryValue(c.value);
                setLocalPhone(fullPhone.replace(c.dial, '').trim());
            } else {
                setLocalPhone(fullPhone);
            }

            // Simple role logic based on 'role' string or flags
            if (editUser.role === 'judge' || editUser.is_judge) setIsJudge(true);
            if (editUser.role === 'coach' || editUser.is_coach) setIsCoach(true);

            // Admin status
            if (editUser.isAdmin || editUser.is_admin) setIsAdmin(true);

            if (editUser.club) setClub(editUser.club);
            if (editUser.judge_level || editUser.judgeLevel) setJudgeLevel(editUser.judge_level || editUser.judgeLevel);
            if (editUser.brevet_level || editUser.brevetLevel) setBrevet(String(editUser.brevet_level || editUser.brevetLevel));
            if (editUser.avatarUrl || editUser.avatar_url) setAvatar(editUser.avatarUrl || editUser.avatar_url);
        }
    }, [editUser]);


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

    const canApprove = currentUser?.isAdmin && !isSelf && editUser?.profileStatus === 'pending';

    const handleApprove = async () => {
        setBusy(true);
        try {
            await adminUpdateUser(editUser.id, {
                // We send current state fields to ensure they are saved if edited
                firstName, lastName, phone: localPhone?.replace(dial, '')?.trim(), // Basic phone logic needs care, assume unchanged or just use partial
                country: countryValue,
                club: isCoach ? club : null,
                isCoach, isJudge,
                judgeLevel: isJudge ? judgeLevel : null,
                brevetLevel: isJudge && judgeLevel === 'בינלאומי' ? brevet : null,
                profileStatus: 'approved'
            });
            Alert.alert("Success", "User approved");
            navigation.goBack();
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setBusy(false);
        }
    };

    const handleReject = async () => {
        Alert.alert(
            t(lang, 'auth.editUser.reject'),
            t(lang, 'auth.editUser.rejectConfirm'),
            [
                { text: t(lang, 'auth.errors.cancel'), style: 'cancel' },
                {
                    text: t(lang, 'auth.editUser.reject'),
                    style: 'destructive',
                    onPress: async () => {
                        setBusy(true);
                        try {
                            await adminRejectUser(editUser.id);
                            Alert.alert("Success", t(lang, 'auth.editUser.rejectSuccess'));
                            navigation.goBack();
                        } catch (e: any) {
                            Alert.alert("Error", e.message);
                        } finally {
                            setBusy(false);
                        }
                    }
                }
            ]
        );
    };

    const isPending = editUser?.profileStatus === 'pending';
    const pendingText = isRTL ? 'ממתין לאישור' : 'Pending';



    const handleSave = async () => {
        // Validation
        if (!firstName || !lastName || !email || !localPhone || !countryValue) {
            Alert.alert('Error', t(lang, 'auth.errors.fillAll'));
            return;
        }

        setBusy(true);
        try {
            const fullName = `${firstName} ${lastName}`;

            const payload: any = {
                // Identity
                email,
                phone: dial + ' ' + localPhone,

                // Profile
                firstName,
                lastName,
                fullName,
                country: countryValue,
                avatarUrl: avatar,

                // Roles & Permissions
                role: isJudge ? 'judge' : isCoach ? 'coach' : 'user',
                isAdmin, // Supported by PATCH now

                // Specifics
                isCoach,
                club: isCoach ? club : null,

                isJudge,
                judgeLevel: isJudge ? judgeLevel : null,
                brevetLevel: isJudge && judgeLevel === 'בינלאומי' ? brevet : null,
            };

            if (password && !isSelf) payload.password = password;

            console.log('Sending update payload:', JSON.stringify(payload, null, 2));

            if (isSelf) {
                await updateSelf(payload);
            } else {
                await adminUpdateUser(editUser.id, payload);
            }

            setAlertConfig({
                visible: true,
                title: isRTL ? "הצלחה" : "Success",
                message: isRTL ? "המשתמש עודכן בהצלחה" : "User updated successfully",
                type: 'success',
                confirmLabel: isRTL ? 'אישור' : 'OK',
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    navigation.goBack();
                }
            });
        } catch (e: any) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: e.message || 'Update failed',
                type: 'destructive',
                confirmLabel: 'OK',
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = () => {
        setAlertConfig({
            visible: true,
            title: t(lang, 'auth.editUser.deleteConfirmTitle'),
            message: t(lang, 'auth.editUser.deleteConfirmBody'),
            type: 'destructive',
            confirmLabel: t(lang, 'auth.editUser.deleteConfirmBtn'),
            cancelLabel: t(lang, 'auth.errors.cancel'),
            cancelTextColor: 'white',
            onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false })),
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                setBusy(true);
                try {
                    if (isSelf) {
                        await deleteSelf();
                        // Logout handled by provider usually, or redirect
                    } else {
                        await adminDeleteUser(editUser.id);
                        navigation.goBack();
                    }
                } catch (e: any) {
                    setBusy(false);
                    setTimeout(() => {
                        setAlertConfig({
                            visible: true,
                            title: 'Error',
                            message: e.message,
                            type: 'destructive',
                            confirmLabel: 'OK',
                            onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                        });
                    }, 500);
                }
            }
        });
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

                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
                    {isSelf ? t(lang, 'auth.editUser.myAccountTitle') : t(lang, 'auth.editUser.editUserTitle')}
                </Text>

                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Avatar Section */}
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        {canApprove && (
                            <TouchableOpacity
                                onPress={handleApprove}
                                style={{
                                    backgroundColor: '#f59e0b',
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    borderRadius: 20,
                                    marginBottom: 20,
                                    flexDirection: isRTL ? 'row-reverse' : 'row',
                                    alignItems: 'center',
                                    shadowColor: "#f59e0b",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 4,
                                    elevation: 5
                                }}
                            >
                                <Ionicons name="checkmark-circle" size={20} color="white" />
                                <Text style={{ color: 'white', fontWeight: 'bold', marginHorizontal: 8, fontSize: 16 }}>
                                    {isRTL ? 'אשר משתמש' : 'Approve User'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => setShowControls(!showControls)} activeOpacity={0.8}>
                            <View style={[styles.avatarCircle, { backgroundColor: '#3b82f6', overflow: 'hidden' }]}>
                                {avatar ? (
                                    <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <Ionicons name="person" size={40} color="white" />
                                )}
                            </View>
                            {!showControls && (
                                <View style={styles.plusBadge}>
                                    <Ionicons name="create" size={14} color="white" />
                                </View>
                            )}
                        </TouchableOpacity>

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
                                forcedContentDirection="ltr"
                            />
                            <SelectButton
                                label={t(lang, 'auth.country')}
                                value={selectedCountry ? selectedCountry.label : ''}
                                placeholder="בחר מדינה"
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
                            forcedContentDirection="ltr"
                        />

                        {isSelf ? (
                            <TouchableOpacity
                                onPress={() => setChangePassVisible(true)}
                                style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }]}
                            >
                                <Text style={{ color: colors.tint, fontWeight: 'bold', fontSize: 16 }}>
                                    {t(lang, 'auth.changePassword.btnLabel')}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <InputField
                                label={(t(lang, 'auth.password') || 'סיסמה') + ' (השאר ריק ללא שינוי)'}
                                value={password}
                                onChange={setPassword}
                                secure={true}
                                colors={colors}
                                isRTL={isRTL}
                                forcedContentDirection="ltr"
                            />
                        )}

                        {/* Row 4: Toggles - Only Admin can change roles, but Self can see them (implicit via fields below) */}
                        {!isSelf && (
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
                                </View>
                            </View>
                        )}

                        {/* PENDING / REJECTED SECTION WRAPPER */}
                        {isPending ? (
                            <View style={{
                                backgroundColor: '#fffbeb',
                                padding: 12,
                                borderRadius: 12,
                                marginTop: 16,
                                borderWidth: 1,
                                borderColor: '#fcd34d',
                                gap: 12
                            }}>
                                {/* Header of Pending Box */}
                                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                                    <Ionicons name="time-outline" size={20} color="#b45309" />
                                    <Text style={{ color: '#92400e', fontWeight: 'bold', marginHorizontal: 8 }}>
                                        {isRTL ? 'ממתין לאישור מנהל' : 'Pending Admin Approval'}
                                    </Text>
                                </View>

                                {/* Row 5: Club | Judge Level (Inside Box) */}
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={{ flex: 1 }}>
                                        {(isCoach || (isSelf && editUser?.isCoach)) && (
                                            <SelectButton
                                                label={t(lang, 'auth.club')}
                                                value={club}
                                                placeholder="בחר אגודה"
                                                onPress={() => openModal('club')}
                                                colors={colors}
                                                isRTL={isRTL}
                                                style={{ backgroundColor: 'transparent' }}
                                            />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        {(isJudge || (isSelf && editUser?.isJudge)) && (
                                            <SelectButton
                                                label={t(lang, 'auth.judgeLevel')}
                                                value={judgeLevel}
                                                placeholder="בחר דרגה"
                                                onPress={() => openModal('level')}
                                                colors={colors}
                                                isRTL={isRTL}
                                                style={{ backgroundColor: 'transparent' }}
                                            />
                                        )}
                                    </View>
                                </View>

                                {/* Brevet Level (Inside Box) */}
                                {isJudge && judgeLevel === 'בינלאומי' && (
                                    <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
                                        <Text style={[styles.label, { color: colors.text, marginBottom: 8, textAlign: isRTL ? 'right' : 'left', width: '100%' }]}>
                                            {t(lang, 'auth.brevet')}
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                                            {[4, 3, 2, 1].map(l => (
                                                <View
                                                    key={l}
                                                    style={[styles.circleBtn, {
                                                        borderColor: brevet === String(l) ? '#3b82f6' : colors.border,
                                                        backgroundColor: brevet === String(l) ? '#3b82f6' : 'white',
                                                        opacity: 0.6
                                                    }]}
                                                >
                                                    <Text style={{ color: brevet === String(l) ? 'white' : colors.text, fontWeight: 'bold' }}>{l}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        ) : (
                            /* Regular Layout if NOT pending */
                            <>
                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                                    <View style={{ flex: 1 }}>
                                        {(isCoach || (isSelf && editUser?.isCoach)) && (
                                            <SelectButton
                                                label={t(lang, 'auth.club')}
                                                value={club}
                                                placeholder="בחר אגודה"
                                                onPress={() => openModal('club')}
                                                colors={colors}
                                                isRTL={isRTL}
                                            />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        {(isJudge || (isSelf && editUser?.isJudge)) && (
                                            <SelectButton
                                                label={t(lang, 'auth.judgeLevel')}
                                                value={judgeLevel}
                                                placeholder="בחר דרגה"
                                                onPress={() => openModal('level')}
                                                colors={colors}
                                                isRTL={isRTL}
                                            />
                                        )}
                                    </View>
                                </View>

                                {/* Brevet Level (Regular) */}
                                {isJudge && judgeLevel === 'בינלאומי' && (
                                    <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
                                        <Text style={[styles.label, { color: colors.text, marginBottom: 8, textAlign: isRTL ? 'right' : 'left', width: '100%' }]}>
                                            {t(lang, 'auth.brevet')}
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                                            {[4, 3, 2, 1].map(l => (
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
                            </>
                        )}


                        {
                            isPending ? (
                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                                    <TouchableOpacity onPress={handleReject} disabled={busy} style={{ flex: 1 }}>
                                        <View style={[styles.submitBtn, { backgroundColor: '#ef4444' }]}>
                                            {busy ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <Text style={styles.submitBtnText}>{t(lang, 'auth.editUser.reject') || 'דחה'}</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleApprove} disabled={busy} style={{ flex: 1 }}>
                                        <LinearGradient
                                            colors={['#10b981', '#059669']}
                                            style={styles.submitBtn}
                                        >
                                            {busy ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <Text style={styles.submitBtnText}>{'אשר'}</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={handleSave} disabled={busy} style={{ marginTop: 20 }}>
                                    <LinearGradient
                                        colors={['#3b82f6', '#2563eb']}
                                        style={styles.submitBtn}
                                    >
                                        {busy ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text style={styles.submitBtnText}>{t(lang, 'auth.editUser.save')}</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            )
                        }

                        <TouchableOpacity onPress={handleDelete} disabled={busy} style={{ marginTop: 24, marginBottom: 40 }}>
                            <View style={[styles.roleBtn, { borderColor: '#ef4444', height: 50 }]}>
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600' }}>
                                    {t(lang, 'auth.editUser.deleteAccount')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View >
                </ScrollView >
            </KeyboardAvoidingView >

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

            <CustomConfirmDialog
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmLabel={alertConfig.confirmLabel}
                cancelLabel={alertConfig.cancelLabel}
                cancelTextColor={alertConfig.cancelTextColor}
                onConfirm={alertConfig.onConfirm || (() => { setAlertConfig(prev => ({ ...prev, visible: false })) })} // Fallback to close
                onCancel={alertConfig.onCancel}
            />

            <ChangePasswordDialog
                visible={changePassVisible}
                onClose={() => setChangePassVisible(false)}
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 40,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)'
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
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
        borderColor: 'white'
    },
    avatarControls: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 16
    },
    controlBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        backgroundColor: 'white',
        elevation: 2
    },
    content: {
        padding: 24,
    },
    form: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
    },
    prefix: {
        fontSize: 16,
        fontWeight: '500',
    },
    roleBtn: {
        borderWidth: 1,
        borderRadius: 12,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    checkIcon: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 2,
    },
    circleBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    submitBtn: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 40,
    },
    modalContent: {
        maxHeight: 400,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    modalItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
});
