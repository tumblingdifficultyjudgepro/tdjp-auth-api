import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { Ionicons } from '@expo/vector-icons';

type Props = {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'destructive' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    category?: string; // dummy for avoiding complexity error if needed
    cancelTextColor?: string;
};

export default function CustomConfirmDialog({
    visible,
    title,
    message,
    type = 'info',
    onConfirm,
    onCancel,
    confirmLabel = 'OK',
    cancelLabel,
    cancelTextColor
}: Props) {
    const { colors } = useAppTheme();

    if (!visible) return null;

    const iconName = type === 'success' ? 'checkmark' : type === 'destructive' ? 'trash' : 'information';
    const iconColor = type === 'success' ? '#22c55e' : type === 'destructive' ? '#ef4444' : '#3b82f6';
    const iconBg = type === 'success' ? '#dcfce7' : type === 'destructive' ? '#fee2e2' : '#dbeafe';

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel || onConfirm}>
            <View style={styles.overlay}>
                <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>

                    <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                        <Ionicons name={iconName} size={32} color={iconColor} />
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.text }]}>{message}</Text>

                    <View style={styles.actions}>
                        {cancelLabel && onCancel && (
                            <Pressable
                                onPress={onCancel}
                                style={({ pressed }) => [
                                    styles.btn,
                                    {
                                        backgroundColor: colors.border,
                                        opacity: pressed ? 0.7 : 1
                                    },
                                ]}
                            >
                                <Text style={[styles.btnText, { color: cancelTextColor || colors.text }]}>{cancelLabel}</Text>
                            </Pressable>
                        )}

                        <Pressable
                            onPress={onConfirm}
                            style={({ pressed }) => [
                                styles.btn,
                                {
                                    backgroundColor: iconColor,
                                    opacity: pressed ? 0.9 : 1,
                                    flex: 1
                                },
                            ]}
                        >
                            <Text style={[styles.btnText, { color: '#fff' }]}>{confirmLabel}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    dialog: {
        width: '100%',
        maxWidth: 350,
        borderRadius: 24,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderWidth: 1,
        elevation: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        justifyContent: 'center',
    },
    btn: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    btnText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
