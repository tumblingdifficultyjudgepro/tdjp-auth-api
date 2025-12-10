import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { useAuth, User } from '@/shared/state/auth';
import { useFocusEffect } from '@react-navigation/native';

export default function AdminUsersScreen({ navigation }: any) {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const { adminGetUsers, adminUpdateUser } = useAuth();
    const isRTL = lang === 'he';

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await adminGetUsers();
            setUsers(res);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUsers();
        }, [])
    );

    const handleEditUser = (user: User) => {
        // Navigate to dedicated Edit User Screen
        navigation.navigate('EditUser', { user: user });
    };

    const sortedUsers = React.useMemo(() => {
        return [...users].sort((a, b) => {
            // Pending first
            if (a.profileStatus === 'pending' && b.profileStatus !== 'pending') return -1;
            if (a.profileStatus !== 'pending' && b.profileStatus === 'pending') return 1;
            // Alphabetical
            return (a.firstName || '').localeCompare(b.firstName || '');
        });
    }, [users]);

    const renderItem = ({ item }: { item: User }) => {
        const isPending = item.profileStatus === 'pending';
        return (
            <TouchableOpacity
                style={[
                    styles.itemRow,
                    {
                        borderBottomColor: colors.border,
                        backgroundColor: isPending ? '#fffbeb' : 'transparent', // Yellowish background for pending
                    }
                ]}
                onPress={() => handleEditUser(item)}
            >
                <View style={{ width: '100%', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.name, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                                {item.firstName} {item.lastName}
                                {item.isAdmin && <Text style={{ color: colors.tint, fontSize: 12, fontWeight: 'normal' }}> {isRTL ? '(מנהל)' : '(Admin)'}</Text>}
                            </Text>
                            {isPending && (
                                <View style={{ backgroundColor: '#fbbf24', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                                    <Text style={{ fontSize: 10, color: '#78350f', fontWeight: 'bold' }}>
                                        {isRTL ? 'ממתין' : 'Pending'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.email, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{item.email}</Text>
                    </View>
                    <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.muted} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{isRTL ? 'ניהול משתמשים' : 'User Management'}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : (
                <FlatList
                    data={sortedUsers}
                    keyExtractor={item => item.id || Math.random().toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: colors.text, opacity: 0.6 }}>
                                {isRTL ? 'לא נמצאו משתמשים' : 'No users found'}
                            </Text>
                        </View>
                    }
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { height: 56, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1 },
    title: { fontSize: 18, fontWeight: 'bold' },
    backBtn: { padding: 8 },
    list: { padding: 0 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    itemRow: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        justifyContent: 'center'
    },
    name: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    email: { fontSize: 14, opacity: 0.7 },
});
