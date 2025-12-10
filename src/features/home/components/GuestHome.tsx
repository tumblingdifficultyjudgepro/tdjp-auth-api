import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function GuestHome() {
    const { colors } = useAppTheme();
    const { lang } = useLang();
    const navigation = useNavigation<any>();

    const isRTL = lang === 'he';

    return (
        <View style={styles.container}>
            <View style={[styles.header, { alignItems: 'center' }]}>
                <Text style={[styles.title, { color: colors.text, textAlign: 'center' }]}>
                    {t(lang, 'home.guestTitle')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.text, opacity: 0.7, textAlign: 'center' }]}>
                    {t(lang, 'home.guestSubtitle')}
                </Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
                <LinearGradient
                    colors={['#FF8C00', '#FF0080']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                >
                    <Text style={styles.btnText}>
                        {t(lang, 'home.loginAction')}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        gap: 40,
    },
    header: {
        gap: 12,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        lineHeight: 40,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '400',
        lineHeight: 26,
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF0080',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    btnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
