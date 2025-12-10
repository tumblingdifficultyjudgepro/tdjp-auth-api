import { useState, useEffect, useCallback } from 'react';
import { apiGetNotifications, apiMarkNotificationRead } from './auth';

export type Notification = {
    id: string;
    user_id: string;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string;
};

export function useNotifications(enabled: boolean = true) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiGetNotifications();
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const markRead = async (id: string) => {
        try {
            await apiMarkNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (e) {
            console.error('Failed to mark read', e);
        }
    };

    useEffect(() => {
        if (enabled) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [enabled, fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return { notifications, unreadCount, fetchNotifications, markRead, loading };
}
