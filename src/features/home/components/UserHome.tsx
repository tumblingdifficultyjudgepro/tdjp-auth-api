import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import { useAuth } from '@/shared/state/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DailyQuote from './DailyQuote';
import { useNotifications } from '@/shared/state/useNotifications';
import NotificationsModal from '@/shared/ui/NotificationsModal';
import { useNavigation } from '@react-navigation/native';

export default function UserHome() {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const { user, adminUpdateUser } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const { notifications, unreadCount, markRead } = useNotifications(!!user);
    const navigation = useNavigation<any>();

    const isRTL = lang === 'he';
    const textAlign = isRTL ? 'right' : 'left';

    const isPending = user?.profileStatus === 'pending';
    const isRejected = user?.profileStatus === 'rejected';

    const handleAction = async (action: 'approve' | 'reject' | 'edit', targetUserId: string) => {
        try {
            if (action === 'edit') {
                setShowNotifications(false);
                // We need to fetch the user object first ideally, but for now let's hope we can navigate or pass id
                // But AdminUsersScreen passes a User object. 
                // Let's assume we can navigate to AdminUsers or similar? 
                // Actually, EditUser expects a User object. We might need to fetch it.
                // For now, let's navigate to Admin User Management so they can find them.
                navigation.navigate('AdminUsers');
                return;
            }

            if (action === 'approve') {
                await adminUpdateUser(targetUserId, { profileStatus: 'approved' });
                Alert.alert(isRTL ? 'הצלחה' : 'Success', isRTL ? 'המשתמש אושר' : 'User approved');
            } else if (action === 'reject') {
                await adminUpdateUser(targetUserId, { profileStatus: 'rejected' });
                Alert.alert(isRTL ? 'בוצע' : 'Done', isRTL ? 'המשתמש נדחה' : 'User rejected');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Action failed');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scroll}>
            <NotificationsModal
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                markRead={markRead}
                onAction={handleAction}
                colors={colors}
                isRTL={isRTL}
            />

            {/* Header Section */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ flex: 1, paddingHorizontal: 4 }}>
                    <Text style={[styles.greeting, { color: colors.text, textAlign }]}>
                        {t(lang, 'home.greeting')}
                    </Text>
                    <Text style={[styles.username, { color: colors.tint, textAlign }]}>
                        {user?.fullName || user?.name}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => setShowNotifications(true)}
                    style={{ position: 'relative', padding: 8 }}
                >
                    <Ionicons name="notifications-outline" size={28} color={colors.text} />
                    {unreadCount > 0 && (
                        <View style={{
                            position: 'absolute', top: 4, right: 4,
                            backgroundColor: 'red', borderRadius: 10,
                            minWidth: 20, height: 20,
                            justifyContent: 'center', alignItems: 'center'
                        }}>
                            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Status Banners */}
            {isPending && (
                <View style={{
                    backgroundColor: '#fffbeb',
                    padding: 12,
                    marginHorizontal: 20,
                    marginBottom: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#fcd34d',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    shadowColor: "#f59e0b",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3
                }}>
                    <Ionicons name="alert-circle" size={28} color="#f59e0b" />
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Text style={{ color: '#92400e', fontWeight: 'bold', fontSize: 16, textAlign: isRTL ? 'right' : 'left' }}>
                            {isRTL ? 'ממתין לאישור' : 'Pending Approval'}
                        </Text>
                        <Text style={{ color: '#b45309', fontSize: 14, textAlign: isRTL ? 'right' : 'left', marginTop: 2 }}>
                            {isRTL ? 'דרגת השיפוט והאגודה שלך ממתינים לאישור מנהל.' : 'Your judge level and club are pending administrator approval.'}
                        </Text>
                    </View>
                </View>
            )}

            {isRejected && (
                <View style={{
                    backgroundColor: '#fef2f2',
                    padding: 12,
                    marginHorizontal: 20,
                    marginBottom: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#fca5a5',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    shadowColor: "#ef4444",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3
                }}>
                    <Ionicons name="close-circle" size={28} color="#ef4444" />
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Text style={{ color: '#991b1b', fontWeight: 'bold', fontSize: 16, textAlign: isRTL ? 'right' : 'left' }}>
                            {isRTL ? 'פרופיל נדחה' : 'Profile Rejected'}
                        </Text>
                        <Text style={{ color: '#b91c1c', fontSize: 14, textAlign: isRTL ? 'right' : 'left', marginTop: 2 }}>
                            {isRTL ? 'הבקשה שלך לא אושרה. אנא עדכן פרטים או צור קשר.' : 'Your request was not approved. Please update details or contact support.'}
                        </Text>
                    </View>
                </View>
            )}

            {/* Daily Quote - Hero Style (Replaces Daily Element) */}
            <View style={styles.section}>
                <LinearGradient
                    colors={['#667eea', '#764ba2'] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', width: '100%', marginBottom: 12 }}>
                        <Ionicons name="bulb" size={24} color="rgba(255,255,255,0.9)" />
                        <Text style={[styles.heroTitle, { marginHorizontal: 8, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                            {isRTL ? 'הציטוט היומי' : 'Daily Quote'}
                        </Text>
                    </View>

                    <View style={styles.heroContent}>
                        <DailyQuote />
                    </View>
                </LinearGradient>
            </View>

            {/* Quick Actions */}
            <View style={styles.grid}>
                <QuickAction
                    icon="flash"
                    label={t(lang, 'home.quickActions.quiz')}
                    color={['#ff9a9e', '#fecfef'] as const}
                />
                <QuickAction
                    icon="calculator"
                    label={t(lang, 'home.quickActions.calc')}
                    color={['#a18cd1', '#fbc2eb'] as const}
                />
                <QuickAction
                    icon="stats-chart"
                    label={t(lang, 'home.quickActions.stats')}
                    color={['#fbc2eb', '#a6c1ee'] as const}
                />
                <QuickAction
                    icon="book"
                    label={t(lang, 'home.quickActions.rules')}
                    color={['#84fab0', '#8fd3f4'] as const}
                />
            </View>

        </ScrollView>
    );
}

function QuickAction({ icon, label, color }: { icon: any, label: string, color: readonly [string, string, ...string[]] }) {
    const { colors } = useAppTheme();
    return (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card }]} activeOpacity={0.8}>
            <LinearGradient
                colors={color}
                style={styles.iconCircle}
            >
                <Ionicons name={icon} size={24} color="white" />
            </LinearGradient>
            <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: 40,
        gap: 20,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        alignItems: 'center',
    },
    greeting: {
        fontSize: 18,
        opacity: 0.8,
    },
    username: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    section: {
        paddingHorizontal: 20,
    },
    heroCard: {
        borderRadius: 24,
        padding: 24,
        minHeight: 180,
        justifyContent: 'flex-start', // Changed from space-between
        shadowColor: '#764ba2',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
        alignItems: 'center',
    },
    heroTitle: {
        color: 'rgba(255,255,255,0.9)', // Brighter
        fontSize: 16, // Larger
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    heroContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        width: '100%',
        flex: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
        gap: 10,
        justifyContent: 'space-between',
    },
    actionBtn: {
        width: '48%',
        aspectRatio: 1.2,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        elevation: 2,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        fontWeight: '600',
        fontSize: 14,
        textAlign: 'center',
    },
});
