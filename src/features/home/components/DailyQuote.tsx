import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { getDailyQuote } from '../services/quoteService';

export default function DailyQuote() {
    const { colors } = useAppTheme();
    const { lang } = useLang();

    const quote = useMemo(() => getDailyQuote(), []);
    const isRTL = lang === 'he';

    return (
        <View style={styles.container}>
            <Text style={[styles.text, { color: colors.text, fontStyle: 'italic', textAlign: isRTL ? 'right' : 'left' }]}>
                "{lang === 'he' ? quote.text.he : quote.text.en}"
            </Text>
            <Text style={[styles.author, { color: colors.tint, marginTop: 8, textAlign: isRTL ? 'left' : 'right' }]}>
                — {quote.author}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
    },
    author: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});
