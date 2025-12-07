import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import { useAuth } from '@/shared/state/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DailyQuote from './DailyQuote';
import { getDailyElement } from '../services/elementService';

export default function UserHome() {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const { user } = useAuth();

    const isRTL = lang === 'he';
    const textAlign = isRTL ? 'right' : 'left';
    const alignItems = isRTL ? 'flex-end' : 'flex-start';
    const flexDirection = isRTL ? 'row-reverse' : 'row';

    const dailyElement = useMemo(() => getDailyElement(), []);

    // Standard React Native Animation (Safe & Stable)
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.1,
                        duration: 1500,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(opacityAnim, {
                        toValue: 0.7,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, [scaleAnim, opacityAnim]);

    return (
        <ScrollView contentContainerStyle={styles.scroll}>

            {/* Header Section */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ flex: 1, alignItems }}>
                    <Text style={[styles.greeting, { color: colors.text }]}>
                        {t(lang, 'home.greeting')},
                    </Text>
                    <Text style={[styles.username, { color: colors.tint }]}>
                        {user?.name}
                    </Text>
                </View>
                <View style={styles.rankContainer}>
                    <LinearGradient
                        colors={['#4facfe', '#00f2fe'] as const}
                        style={styles.rankBadge}
                    >
                        <Text style={styles.rankText}>Lvl {user?.level}</Text>
                    </LinearGradient>
                </View>
            </View>

            {/* Daily Quote - Moved Up & Redesigned */}
            <View style={styles.section}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={[styles.quoteContainer, { borderColor: colors.border }]}
                >
                    <DailyQuote />
                </LinearGradient>
            </View>

            {/* Hero / Element of the Day */}
            <View style={styles.section}>
                <LinearGradient
                    colors={['#667eea', '#764ba2'] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', width: '100%' }}>
                        <Text style={styles.heroTitle}>{t(lang, 'home.elementOfTheDay')}</Text>
                        <View style={styles.valueBadge}>
                            <Text style={styles.valueText}>{dailyElement.value.toFixed(1)}</Text>
                        </View>
                    </View>

                    <View style={styles.heroContent}>
                        <Animated.Text
                            style={[
                                styles.elementSymbol,
                                {
                                    transform: [{ scale: scaleAnim }],
                                    opacity: opacityAnim
                                }
                            ]}
                        >
                            {dailyElement.symbol}
                        </Animated.Text>
                    </View>

                    <Text style={styles.elementName}>
                        {lang === 'he' ? dailyElement.name.he : dailyElement.name.en}
                    </Text>
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
    rankContainer: {
        marginLeft: 10,
    },
    rankBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    rankText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    section: {
        paddingHorizontal: 20,
    },
    quoteContainer: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 2,
        overflow: 'hidden',
    },
    heroCard: {
        borderRadius: 24,
        padding: 24,
        minHeight: 180,
        justifyContent: 'space-between',
        shadowColor: '#764ba2',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
        alignItems: 'center',
    },
    heroTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    valueBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    valueText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    heroContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        height: 120, // Keep height consistent
        width: '100%',
    },
    elementSymbol: {
        fontSize: 60,
        color: 'white',
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    elementName: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
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
