import React from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
    visible: boolean;
    onClose: () => void;
    notifications: any[];
    markRead: (id: string) => void;
    onAction: (action: 'approve' | 'reject' | 'edit', userId: string) => void;
    colors: any;
    isRTL: boolean;
};

export default function NotificationsModal({ visible, onClose, notifications, markRead, onAction, colors, isRTL }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { }}>
                    <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {isRTL ? 'התראות' : 'Notifications'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={notifications}
                        keyExtractor={i => i.id}
                        contentContainerStyle={{ padding: 16 }}
                        ListEmptyComponent={
                            <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 20 }}>
                                {isRTL ? 'אין התראות חדשות' : 'No new notifications'}
                            </Text>
                        }
                        renderItem={({ item }) => {
                            const meta = item.metadata;
                            const isVerification = meta?.type === 'verification';

                            return (
                                <TouchableOpacity
                                    onPress={() => !item.is_read && markRead(item.id)}
                                    style={[styles.item, {
                                        backgroundColor: item.is_read ? 'transparent' : (colors.primary + '10'),
                                        borderColor: colors.border,
                                        borderLeftWidth: isRTL ? 0 : 4,
                                        borderRightWidth: isRTL ? 4 : 0,
                                        borderLeftColor: item.is_read ? 'transparent' : colors.primary,
                                        borderRightColor: item.is_read ? 'transparent' : colors.primary,
                                    }]}
                                >
                                    <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                                        <Text style={[styles.itemTitle, { color: colors.text, fontWeight: item.is_read ? '500' : 'bold' }]}>
                                            {item.title}
                                        </Text>
                                        <Text style={[styles.itemBody, { color: colors.muted, textAlign: isRTL ? 'right' : 'left' }]}>
                                            {item.body}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>
                                            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString().slice(0, 5)}
                                        </Text>

                                        {isVerification && (
                                            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 12 }}>
                                                <TouchableOpacity
                                                    onPress={() => onAction('approve', meta.userId)}
                                                    style={[styles.actionBtn, { backgroundColor: '#22c55e' }]}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>{isRTL ? 'אשר' : 'Approve'}</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() => onAction('reject', meta.userId)}
                                                    style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>{isRTL ? 'דחה' : 'Reject'}</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() => onAction('edit', meta.userId)}
                                                    style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>{isRTL ? 'ערוך' : 'Edit'}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        borderRadius: 16,
        borderWidth: 1,
        maxHeight: '70%',
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        overflow: 'hidden',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    item: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
    },
    itemTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    itemBody: {
        fontSize: 14,
        lineHeight: 20,
    },
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
