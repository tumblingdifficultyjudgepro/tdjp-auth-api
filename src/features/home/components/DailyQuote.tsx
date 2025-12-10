import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { getDailyQuote } from '../services/quoteService';

export default function DailyQuote() {
    const { colors } = useAppTheme();
    const { lang } = useLang();

    const quote = useMemo(() => getDailyQuote(), []);

    // Always center for hero card appeal
    const textAlign = 'center';

    return (
        <View style={styles.container}>
            {/* Decorative Icon or Quote Mark */}
            <Text style={styles.quoteMark}>❝</Text>

            <Text style={[styles.text, { textAlign }]}>
                {lang === 'he' ? quote.text.he : quote.text.en}
            </Text>

            <Text style={[styles.author, { textAlign }]}>
                — {quote.author}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    quoteMark: {
        fontSize: 40,
        color: 'rgba(255,255,255,0.3)',
        marginBottom: -10, // Pull closer to text
        alignSelf: 'center',
    },
    text: {
        color: 'white',
        fontStyle: 'italic',
        fontSize: 22, // Much larger
        lineHeight: 32,
        fontWeight: '600',
        fontFamily: 'serif', // Try system serif
        marginBottom: 16,
    },
    author: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        opacity: 0.9,
        fontFamily: 'sans-serif-medium', // Contrast font
    },
});
