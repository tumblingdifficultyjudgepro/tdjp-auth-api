import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, useWindowDimensions, Pressable, Switch, RefreshControl,
    Animated, Easing, Alert, Platform, Dimensions, ScrollView, Modal, Linking, Keyboard, DeviceEventEmitter, Image as RNImage
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme, useNavigation, useIsFocused } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import exportTariffPDF, { pickAndCacheTariffDirOnce, getCachedTariffDirUri, pickTariffDirAgain } from './tariffExport';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LogViewer from './LogViewer';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';


// ===== Debug Logger (always-on) =====
function _safe(v) { try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); } }
function _sanitizeStack(stack) {
    try {
        if (!stack) return '';
        return String(stack).split('\n').filter(l => !/InternalBytecode\.js/i.test(l)).slice(0, 5).join('\n');
    } catch { return ''; }
}
function _log(...a) { try { console.log('[APP]', ...a.map(_safe)); } catch { } }
function _warn(...a) { try { console.warn('[APP][WARN]', ...a.map(_safe)); } catch { } }
function _error(tag, msg, stack) {
    try {
        const safeMsg = _safe(msg);
        const safeStack = _sanitizeStack(stack);
        console.error('[APP][ERR]', tag, safeMsg, safeStack ? ('\n' + safeStack) : '');
    } catch { }
}
// ====================================



// ===============================================
// ✦ תוכן העניינים (App.js) — ללא שינוי בקוד ✦
// ===============================================
// • פונקציות עזר (Utilities/Helpers)
// • קונטקסטים וספקים (Contexts/Providers)
// • קומפוננטות ותתי־רכיבים (Components)
// • ניווט (Navigation)
// • מסכי אפליקציה (Screens)
// • שונות (Other)

// ---- Theming ----
const palette = {
    bg: '#0E1230',
    card: '#15193B',
    primary: '#6C5CE7',
    primary2: '#A29BFE',
    success: '#25C685',
    danger: '#FF5C7A',
    text: '#F0F3FF',
    muted: '#9AA0C3',
    chip: '#1B1F4A',
    gold: '#F4B400',
    border: '#262B57',
};
const navTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        background: palette.bg,  // נשאר כחול
        card: palette.bg,        // גם הכותרות בלי הבזק
        text: palette.text,
        border: palette.card,    // שומר טון כהה, לא לבן
        primary: palette.text,
        notification: palette.text,
    },
    // ======================================================
    // ✦ פונקציות עזר (Utilities/Helpers) ✦
    // ======================================================
    // --- פונקציה: refreshAll ---
    // חובה כדי למנוע "Cannot read property 'regular' of undefined"
    fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' },
        medium: { fontFamily: 'System', fontWeight: '500' },
        // ======================================================
        // ✦ קונטקסטים וספקים (Contexts/Providers) ✦
        // ======================================================
        // --- פונקציה: useAppRefreshListener ---
        bold: { fontFamily: 'System', fontWeight: '700' },
    },
};


// --- App-wide refresh event (single source of truth) ---
const APP_REFRESH_EVENT = 'APP_REFRESH_EVENT';

export const refreshAll = (payload = {}) => {
    // שלח אירוע גלובלי; כל מסך שמאזין יוכל לרענן את עצמו
    // ======================================================
    // ✦ קומפוננטות ותתי־רכיבים (Components) ✦
    // ======================================================
    // --- פונקציה: ImageComponent ---
    DeviceEventEmitter.emit(APP_REFRESH_EVENT, { ts: Date.now(), ...payload });
};

export function useAppRefreshListener(onRefresh) {
    React.useEffect(() => {
        if (typeof onRefresh !== 'function') return;
        // --- פונקציה: useResponsive ---
        const sub = DeviceEventEmitter.addListener(APP_REFRESH_EVENT, onRefresh);
        return () => sub.remove();
    }, [onRefresh]);
}


// תצוגת תמונה מינימלית ל-thumbnails
function ImageComponent({ uri }) {
    return <RNImage source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
}

const API_BASE = 'https://tdjp-auth-api.onrender.com';

// useResponsive – גרסה יציבה יותר לטאבלט
export function useResponsive() {
    const { width, height } = useWindowDimensions();
    const shortest = Math.min(width, height);
    const isLandscape = width > height;
    // “טאבלט” אם הממד הקצר ≥ 600dp, או iPad
    const isTablet = (Platform.OS === 'ios' ? Platform.isPad : shortest >= 600);
    const isLarge = shortest >= 840;
    return { width, height, isLandscape, isTablet, isLarge };
}

const COUNTRIES = [
    { label: '🇮🇱 ישראל', value: 'ישראל', dial: '+972' },
    { label: '🇬🇧 בריטניה', value: 'בריטניה', dial: '+44' },
    { label: '🇺🇸 ארצות הברית', value: 'ארצות הברית', dial: '+1' },
    { label: '🇷🇺 רוסיה', value: 'רוסיה', dial: '+7' },
    // --- פונקציה: dialByCountry ---
    { label: '🇺🇦 אוקראינה', value: 'אוקראינה', dial: '+380' },
    { label: '🇨🇳 סין', value: 'סין', dial: '+86' },
];

// אגודות (כרגע קצר)
// --- פונקציה: withDialPrefix ---
const CLUBS = ['מכבי אקרוג\'ים', 'הפועל תל אביב', 'שער הנגב', 'מכבי קריית אונו'];

// דרגות
const JUDGE_LEVELS = ['מתחיל', 'מתקדם', 'בינלאומי'];
const BREVET_LEVELS = ['1', '2', '3', '4']; // הוספת 4

// עזר: מציאת קידומת לפי מדינה
function dialByCountry(country) {
    const c = COUNTRIES.find(x => x.value === country);
    return c?.dial || '';
}

// עזר: הצמדת/החלפת קידומת בטלפון לפי מדינה
function withDialPrefix(phone, country) {
    const dial = dialByCountry(country);
    if (!dial) return phone || '';
    const stripped = (phone || '').replace(/^\+\d+\s?/, ''); // מוריד קידומת אם קיימת
    return `${dial}${stripped ? ' ' + stripped : ''}`;
}


// עוטפים כל onPress שצריך לסגור מקלדת לפני הפעולה
const withDismiss = (fn) => () => {
    Keyboard.dismiss();
    if (typeof fn === 'function') fn();
};

// ---- DEV TOGGLE: logs screen ----
const ENABLE_LOGS = false; // כשהתצריך לוגים, שנה ל-true


async function saveToken(t) { if (t) await SecureStore.setItemAsync('tdjp_token', t); }
async function getToken() { return SecureStore.getItemAsync('tdjp_token'); }
async function clearToken() { await SecureStore.deleteItemAsync('tdjp_token'); }

async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
    // NOTE: משדרג טיפול בשגיאות + לוג בטוח לסמליקציה

    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
        const token = await getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// קריאות אימות
async function apiRegister({ email, password, fullName, role = 'judge' }) {
    const r = await apiFetch('/auth/register', { method: 'POST', auth: false, body: { email, password, fullName, role } });
    await saveToken(r.token);
    return normalizeUser(r.user);
}

// הרשמה ארוכה - שולחת את כל השדות ל-/auth/register
async function apiRegisterFull({
    email,
    password,
    firstName,
    lastName,
    phone,
    country,
    isCoach,
    club,          // חובה אם isCoach=true
    isJudge,
    judgeLevel,    // חובה אם isJudge=true
    brevetLevel,   // חובה אם judgeLevel="בינלאומי"
    avatarUrl      // אופציונלי
}) {
    const fullName = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim();
    const body = {
        email,
        password,
        fullName,
        phone,
        country,
        isCoach: !!isCoach,
        club: isCoach ? club : null,
        isJudge: !!isJudge,
        judgeLevel: isJudge ? judgeLevel : null,
        brevetLevel: isJudge && judgeLevel === 'בינלאומי' ? String(brevetLevel) : null,
        avatarUrl: avatarUrl || null
    };
    const res = await apiFetch('/auth/register', { method: 'POST', auth: false, body });
    // מחזיר { user, token }
    return res;
}

// ========== Auth API (ללא אימות מייל/טלפון) ==========

// לוגין / מי אני / לוגאאוט
async function apiLogin({ email, password }) {
    const r = await apiFetch('/auth/login', { method: 'POST', auth: false, body: { email, password } });
    await saveToken(r.token);
    return normalizeUser(r.user);
}
async function apiMe() {
    const r = await apiFetch('/auth/me');
    return normalizeUser(r.user);
}
async function apiLogout() { await clearToken(); }

// איפוס סיסמה במייל (בקשת טוקן) + החלפת סיסמה עם הטוקן
async function apiRequestPasswordReset(email) {
    return apiFetch('/auth/request-password-reset', {
        method: 'POST', auth: false, body: { email }
    });
}
async function apiResetPassword(token, newPassword) {
    return apiFetch('/auth/reset-password', {
        method: 'POST', auth: false, body: { token, newPassword }
    });
}

// עדכון פרטי משתמש מחוברים (אני)
async function apiUpdateMe(patch) { /*LOG:apiUpdateMe*/
    _log('apiUpdateMe:request', patch);
    try {
        const r = await apiFetch('/me', { method: 'PUT', body: patch });
        _log('apiUpdateMe:response', r?.user || r);
        return normalizeUser(r.user);
    } catch (e) {
        _error('apiUpdateMe:error', e?.message || e, e?.stack);
        throw e;
    }
}

// ---- Admin ----
async function apiListUsers({ limit = 50, offset = 0 } = {}) {
    const data = await apiFetch(`/admin/users?limit=${limit}&offset=${offset}`);
    const rows = Array.isArray(data)
        ? data
        : (data?.rows || data?.users || data?.items || data?.data || []);
    const total = (data?.total ?? data?.count ?? rows.length);
    return { rows, total };
}
async function apiDeleteUser(id) {
    return apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
}
async function apiSetAdmin(id, isAdmin) {
    return apiFetch(`/admin/users/${id}`, { method: 'PUT', body: { isAdmin } });
}

// Admin: get + update משתמש
async function apiGetUser(id) {
    try {
        const d = await apiFetch(`/admin/users/${id}`); // ניסיון REST רגיל
        if (d && typeof d === 'object') return d.user || d.data || d;
        return d;
    } catch (e) {
        const msg = String(e?.message || '').toLowerCase();
        if (msg.includes('404') || msg.includes('not found')) {
            const d = await apiFetch(`/admin/users?id=${encodeURIComponent(id)}`);
            if (Array.isArray(d)) return d[0] || null;
            return d.user || d.data || d;
        }
        throw e;
    }
}

async function apiUpdateUser(id, patch) { /*LOG:apiUpdateUser*/
    _log('apiUpdateUser:request', id, patch);
    try {
        const r = await apiFetch(`/admin/users/${id}`, { method: 'PUT', body: patch });
        _log('apiUpdateUser:response', r?.user || r);
        return normalizeUser(r.user);
    } catch (e) {
        _error('apiUpdateUser:error', e?.message || e, e?.stack);
        throw e;
    }
}


function isUserAdmin(u) {
    return !!(u?.isAdmin || u?.role === 'admin');
}



// =====================================
// TDJP – TumbleDifficultyJudgePro
// =====================================

// --- פונקציה: useAuth ---
// --- normalize user coming from API (snake_case -> camelCase)
function normalizeUser(u) {
    if (!u || typeof u !== 'object') return u;
    const first = (u.firstName ?? u.first_name ?? '').toString().trim() || String((u.fullName ?? u.full_name ?? '').split(/\s+/)[0] || '');
    const last = (u.lastName ?? u.last_name ?? '').toString().trim() || String((u.fullName ?? u.full_name ?? '').trim().split(/\s+/).slice(1).join(' '));
    const full = (u.fullName ?? u.full_name ?? `${first} ${last}`.trim()).toString().trim();
    return {
        ...u,
        firstName: first,
        lastName: last,
        fullName: full,
        isAdmin: (u.isAdmin != null ? u.isAdmin : u.is_admin),
        createdAt: u.createdAt || u.created_at,
    };
}
// ===== AUTH CONTEXT =====
const AuthContext = React.createContext(null);
function useAuth() { return React.useContext(AuthContext); }

function AuthProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [userVersion, setUserVersion] = React.useState(0);

    // טעינת סשן בהפעלת האפליקציה
    React.useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                if (token) {
                    const me = await apiMe().catch(() => null);
                    if (me) setUser(me);
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = async (email, password) => {
        const u = await apiLogin({ email, password });
        setUser(u);
        return u;
    };

    const register = async (fullName, email, password, role = 'judge') => {
        const u = await apiRegister({ fullName, email, password, role });
        setUser(u);
        return u;
    };

    const logout = async () => {
        await apiLogout();
        setUser(null);
    };


    const refreshMe = React.useCallback(async () => { /*LOG:refreshMe*/
        if (refreshingRef.current) { _log('refreshMe:skip:inflight'); return null; }
        refreshingRef.current = true;
        try {
            _log('refreshMe:request');
            const me = await apiMe();
            _log('refreshMe:response', me);
            setUser(me);
            setUserVersion(v => v + 1);
            return me;
        } catch (e) {
            _error('refreshMe:error', e?.message || e, e?.stack);
            return null; // לא זורקים כדי לא ליצור לולאה של ניסיונות
        } finally {
            refreshingRef.current = false;
        }
    }, []);

    const value = React.useMemo(() => ({ user, loading, login, register, userVersion, setUser, logout, refreshMe }), [user, userVersion, userVersion, loading, login, register, logout, refreshMe]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


const FEEDBACK_EMAIL = 'Tumblingdifficultyjudgepro@gmail.com';
// TODO: שים פה את כתובת השרת שלך שמקבל POST ושולח מייל בפועל:
const FEEDBACK_ENDPOINT = 'https://YOUR_BACKEND/ideas';

const IDEA_DRAFT_KEY = 'tdjp.ideaDraft.v1';
const IDEA_OUTBOX_KEY = 'tdjp.ideaOutbox.v1';

async function enqueueIdea(item) {
    try {
        const raw = await AsyncStorage.getItem(IDEA_OUTBOX_KEY);
        const arr = raw ? JSON.parse(raw) : [];

        const refreshingRef = React.useRef(false);
        arr.push({ ...item, queuedAt: Date.now() });
        await AsyncStorage.setItem(IDEA_OUTBOX_KEY, JSON.stringify(arr));
    } catch { }
}

async function flushOutbox() {
    try {
        const state = await NetInfo.fetch();
        if (!state.isConnected) return;
        const raw = await AsyncStorage.getItem(IDEA_OUTBOX_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        if (!arr.length) return;
        const ok = [];
        for (const it of arr) {
            try {
                await fetch(FEEDBACK_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(it),
                });
                ok.push(true);
            } catch { ok.push(false); }
        }
        const remaining = arr.filter((_, i) => !ok[i]);
        await AsyncStorage.setItem(IDEA_OUTBOX_KEY, JSON.stringify(remaining));
    } catch { }
}

// ======================================================
// ✦ ניווט (Navigation) ✦
// ======================================================
// --- פונקציה: RootStack ---
// ---- Safe fallbacks (no-ops) for environments without native modules ----
const Haptics = {
    impactAsync: async () => { },
    notificationAsync: async () => { },
    ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
    NotificationFeedbackType: { Success: 'Success', Error: 'Error', Warning: 'Warning' },
};

const Stack = createNativeStackNavigator();

function RootStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'none',                               // בלי אנימציה
                contentStyle: { backgroundColor: palette.bg },   // רקע כחול בזמן מעבר
                detachPreviousScreen: false,                     // לא מנתק את הקודם → אין פלאש
                statusBarStyle: 'light',
                statusBarColor: palette.bg,
                navigationBarColor: palette.bg,
            }}
        >
            <Stack.Screen name="Tabs" component={Tabs} />

            {/* עמוד פרופיל כעמוד Stack מלא (לא טאב) */}
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    animation: 'none',
                    contentStyle: { backgroundColor: palette.bg },
                    detachPreviousScreen: false,
                }}
            />

            {/* "ההתקדמות שלי" – לא בטאבים */}
            <Stack.Screen
                name="MyProgress"
                component={ProgressScreen}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="Auth"
                component={AuthFormScreen}
                options={{
                    animation: 'none',
                    contentStyle: { backgroundColor: palette.bg },
                    detachPreviousScreen: false,
                }}
            />

            <Stack.Screen
                name="Register"
                component={RegisterFullScreen}
                options={{ headerShown: false }}
            />

            {/* לוגים – רק אם מאופשר */}
            {ENABLE_LOGS ? (
                <Stack.Screen name="Logs" component={LogViewer} />
                // --- פונקציה: usePrefs ---
            ) : null}

            <Stack.Screen
                name="AdminUsers"
                component={AdminUsersScreen}
                options={{ headerShown: false }}
            />

        </Stack.Navigator>
    );
}


// ===== Preferences (lang + volume) =====
const PREFS_KEY = 'tdjp.prefs.v1';
const PrefsCtx = createContext(null);
function usePrefs() {
    const ctx = useContext(PrefsCtx);
    if (!ctx) throw new Error('PrefsCtx missing');
    return ctx;
}
const STRINGS = {
    he: {
        tabs: { calc: 'מחשבון', flash: 'כרטיסיות', quiz: 'מבחן', progress: 'משוב', tariff: 'טריף', admin: 'אדמין' },
        common: { reset: 'איפוס', deleteLast: 'מחק אחרון', total: 'סה״כ', loading: 'טוען…', close: 'סגור', settings: 'הגדרות' },
        tariff: {
            header: 'טריף',
            country: 'מדינה',
            athleteName: 'שם המתעמל/ת',
            club: 'אגודה',
            gender: 'מגדר',
            male: 'M',
            female: 'F',
            track: 'מסלול',
            league: 'ליגה',
            national: 'לאומי',
            international: 'בינלאומי',
            level: 'דרגה',
            athleteNo: 'מספר מתעמל',
            rotation: 'סבב',
            pass1: 'פס 1',
            pass2: 'פס 2',
            export: 'ייצוא PDF',
        },
        quiz: {
            header: 'מבחן',
            whatIs: 'מה הערך של:',
            check: 'בדוק',
            summary: 'סיכום מבחן',
            answered10: 'ענית על 10 שאלות',
            newQuiz: 'מבחן חדש',
            progress: (n) => `שאלה ${n} מתוך \u200E10\u200E`,
        },
        flash: { header: 'כרטיסיות' },
        calc: { header: 'מחשבון' },
        prog: { header: 'משוב', strong: 'שולט חזק', mid: 'בינוני', need: 'צריך חיזוק', resetQ: 'איפוס?', resetBody: 'לאפס את כל ההתקדמות?' },
        settings: { volume: 'עוצמת שמע', language: 'שפה', heb: 'עברית', eng: 'English' },
        a11y: { toggleRep: 'החלפת תצוגה', toggleMode: 'החלפת סוג שאלה' },
    },
    en: {
        tabs: { calc: 'Calculator', flash: 'Flashcards', quiz: 'Quiz', progress: 'Progress', tariff: 'Tariff', admin: 'Admin' },
        common: { reset: 'Reset', deleteLast: 'Delete last', total: 'Total', loading: 'Loading…', close: 'Close', settings: 'Settings' },
        tariff: {
            header: 'Tariff',
            country: 'Country',
            athleteName: 'Athlete Name',
            club: 'Club',
            gender: 'Gender',
            male: 'M',
            female: 'F',
            track: 'Track',
            league: 'League',
            national: 'National',
            international: 'International',
            level: 'Level',
            athleteNo: 'Athlete #',
            rotation: 'Rotation',
            pass1: 'Pass 1',
            pass2: 'Pass 2',
            export: 'Export PDF',
        },
        quiz: {
            header: 'Quiz',
            whatIs: 'What is the value of:',
            check: 'Check',
            summary: 'Quiz Summary',
            answered10: 'You answered 10 questions',
            newQuiz: 'New Quiz',
            progress: (n) => `Question ${n} of 10`,
        },
        flash: { header: 'Flashcards' },
        // --- פונקציה: PrefsProvider ---
        calc: { header: 'Calculator' },
        prog: { header: 'Progress', strong: 'Mastered', mid: 'Okay', need: 'Needs Work', resetQ: 'Reset?', resetBody: 'Reset all progress?' },
        settings: { volume: 'Sound volume', language: 'Language', heb: 'Hebrew', eng: 'English' },
        a11y: { toggleRep: 'Toggle representation', toggleMode: 'Toggle question type' },
    }
};
function PrefsProvider({ children }) {
    const [lang, setLang] = useState('he');         // 'he' | 'en'
    const [volume, setVolume] = useState(7);        // 0..10
    const [allowIllegalExport, setAllowIllegalExport] = useState(false); // <<< חדש
    const isRTL = lang === 'he';

    const t = useMemo(() => {
        const L = STRINGS[lang];
        const fn = (path, params) => {
            const parts = path.split('.');
            let cur = L;
            for (const p of parts) cur = cur?.[p];
            if (typeof cur === 'function') return cur(params?.n);
            return cur ?? path;
        };
        return fn;
    }, [lang]);

    // טעינה מה-AsyncStorage
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(PREFS_KEY);
                if (raw) {
                    const data = JSON.parse(raw);
                    if (data.lang) setLang(data.lang);
                    if (typeof data.volume === 'number') {
                        setVolume(Math.max(0, Math.min(10, data.volume)));
                    }
                    // <<< זה הקטע הראשון ששאלת עליו
                    if (typeof data.allowIllegalExport === 'boolean') {
                        setAllowIllegalExport(data.allowIllegalExport);
                    }
                }
            } catch { }
        })();
    }, []);

    // שמירה ל-AsyncStorage (כולל allowIllegalExport)
    useEffect(() => {
        // <<< זה הקטע השני ששאלת עליו
        AsyncStorage.setItem(
            PREFS_KEY,
            JSON.stringify({ lang, volume, allowIllegalExport })
        );
    }, [lang, volume, allowIllegalExport]);

    // ערך הקונטקסט
    // <<< זה הקטע השלישי ששאלת עליו
    const value = {
        lang,
        setLang,
        isRTL,
        t,
        volume,
        setVolume,
        allowIllegalExport,
        setAllowIllegalExport,
    };

    return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

// Prefer real sound via expo-av on native; fall back to WebAudio beep on web/canvas
let _expoAvModule = null;
async function getExpoAv() {
    if (_expoAvModule !== null) return _expoAvModule;
    try { _expoAvModule = await import('expo-av'); } catch (e) { _expoAvModule = null; }
    return _expoAvModule;
}
async function playSound(kind, vol01 = 1) {
    try {
        if (Platform.OS !== 'web') {
            const mod = await getExpoAv();
            if (mod && mod.Audio) {
                await mod.Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
                try {
                    const src = kind === 'success' ? require('./assets/success.mp3') : require('./assets/fail.mp3');
                    const sound = new mod.Audio.Sound();
                    await sound.loadAsync(src);
                    await sound.setVolumeAsync(Math.max(0, Math.min(1, vol01)));
                    await sound.playAsync();
                    sound.setOnPlaybackStatusUpdate((st) => { if (st.didJustFinish) sound.unloadAsync(); });
                    return;
                } catch (_) { }
            }
        }
        const Ctx = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
        if (!Ctx) return;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = kind === 'success' ? 880 : 220;
        osc.connect(gain); gain.connect(ctx.destination);
        const t = ctx.currentTime;
        const peak = 0.2 * Math.max(0, Math.min(1, vol01));
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.01);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        osc.stop(t + 0.21);
        setTimeout(() => ctx.close(), 300);
    } catch (e) { /* ignore */ }
}

// ---- Data: Elements & values ----
const RAW_ELEMENTS = [
    // --- קדימה (Front) ---
    ['קפיצת ידיים', 'Front Handspring', 0.1],
    ['סלטה קדימה בקירוס', 'Front Tuck', 0.6],
    ['סלטה קדימה בקיפול', 'Front Pike', 0.7],
    ['גוף ישר קדימה', 'Front Layout', 0.7],
    ['בראני', 'Barani', 0.8],
    ['בורג קדימה', 'Front Full', 1.0],


    // --- אחורה (Back) ---
    ['ערבית', 'Round Off', 0.1],
    ['פליק פלאק', 'Back Handspring', 0.1],
    ['טמפו', 'Whip', 0.2],
    ['סלטה אחורה בקירוס', 'Back Tuck', 0.5],
    ['סלטה אחורה בקיפול', 'Back Pike', 0.6],
    ['סלטה אחורה בגוף ישר', 'Back Layout', 0.6],
    ['חצי בורג', 'Half Twist', 0.7],
    ['בורג', 'Full', 0.9],
    ['בורג וחצי', '1.5 Twist', 1.1],
    ['דאבל בורג', 'Double Full', 1.3],
    ['דאבל קירוס', 'Double Tuck', 2.0],
    ['דאבל קיפול', 'Double Pike', 2.2],
    ['דאבל גוף ישר', 'Double Layout', 2.4],
    ['דאבל בשפגאט', 'Double Split', 2.4],
    ['האף אאוט גוף ישר', 'Half Out Layout', 2.6],
    ['פול אין קירוס', 'Full In Tuck', 2.4],
    ['פול אאוט קירוס', 'Full Out Tuck', 2.4],
    ['פול אין קיפול', 'Full In Pike', 2.6],
    ['פול אין גוף ישר', 'Full In Layout', 2.8],
    ['פול אאוט גוף ישר', 'Full Out Layout', 2.8],
    ['פול פול קירוס', 'Full Full Tuck', 3.2],
    ['פול פול גוף ישר', 'Full Full Layout', 3.6],
    ['פול פול וחצי קירוס', 'Full In 1.5 Twist Out Tuck', 3.8],
    ['פול פול וחצי גוף ישר', 'Full In 1.5 Twist Out Layout', 4.2],
    ['מילר קירוס', 'Miller Tuck', 4.4],
    ['מילר גוף ישר', 'Miller Layout', 4.8],
    ['קילר', 'Killer', 6.4],
    ['טריפל קירוס', 'Triple Tuck', 4.5],
    ['טריפל קיפול', 'Triple Pike', 5.1],
    ['טריפל גוף ישר', 'Triple Layout', 5.7],
    ['פול אין טריפל קירוס', 'Full In Triple Tuck', 6.3],
    ['פול אין טריפל קיפול', 'Full In Triple Pike', 6.9],
    ['באק פול פול קירוס', 'Back Full Full Tuck', 8.7],
    ['פול פול פול', 'Full Full Full', 11.1],
];


// ===== Per-language keyboard orders =====
// ✳️ שליטה מלאה בסדר – ערכי פה חופשי. שמות חייבים להיות זהים ל-nameHe/nameEn שנוצרים מ-RAW_ELEMENTS.

// -- עברית: קדימה/אחורה --
const ORDER_HE_FORWARD = [
    'קפיצת ידיים',
    'סלטה קדימה בקירוס',
    'סלטה קדימה בקיפול',
    'גוף ישר קדימה',
    'בראני',
    'בורג קדימה',
];

const ORDER_HE_BACKWARD = [
    'ערבית',
    'פליק פלאק',
    'טמפו',
    'סלטה אחורה בקירוס',
    'סלטה אחורה בקיפול',
    'סלטה אחורה בגוף ישר',
    'חצי בורג',
    'בורג',
    'בורג וחצי',
    'דאבל בורג',
    'דאבל קירוס',
    'דאבל קיפול',
    'דאבל גוף ישר',
    'דאבל בשפגאט',
    'פול אין קירוס',
    'פול אאוט קירוס',
    'פול אין קיפול',
    'האף אאוט גוף ישר',
    'פול אין גוף ישר',
    'פול אאוט גוף ישר',
    'פול פול קירוס',
    'פול פול גוף ישר',
    'פול פול וחצי קירוס',
    'פול פול וחצי גוף ישר',
    'מילר קירוס',
    'מילר גוף ישר',
    'קילר',
    'טריפל קירוס',
    'טריפל קיפול',
    'טריפל גוף ישר',
    'פול אין טריפל קירוס',
    'פול אין טריפל קיפול',
    'באק פול פול קירוס',
    'פול פול פול',
];

// -- English: forward/backward --
// ✳️ את/ה קובע/ת כאן את הסדר לאנגלית – בלתי תלוי בעברית.
const ORDER_EN_FORWARD = [
    'Front Handspring',
    'Front Tuck',
    'Front Pike',
    'Front Layout',
    'Barani',
    'Front Full',
];

const ORDER_EN_BACKWARD = [
    'Round Off',
    'Back Handspring',
    'Whip',
    'Back Tuck',
    'Back Pike',
    'Back Layout',
    'Half Twist',
    'Full',
    '1.5 Twist',
    'Double Full',
    'Double Back Tuck',
    'Double Back Pike',
    'Double Layout',
    'Double Split',
    'Half Out Layout',
    'Full In Tuck',
    'Full Out Tuck',
    'Full In Pike',
    'Full In Layout',
    'Full Out Layout',
    'Full Full Tuck',
    'Full Full Layout',
    'Full In 1.5 Twist Out Tuck',
    // --- פונקציה: keyboardElementsFor ---
    'Full In 1.5 Twist Out Layout',
    'Miller Tuck',
    'Miller Layout',
    'Killer',
    'Triple Tuck',
    'Triple Pike',
    'Triple Layout',
    'Full In Triple Tuck',
    'Full In Triple Pike',
    'Back Full Full Tuck',
    'Full Full Full',
];

// ===== Builders =====

// מחזיר מערך של אובייקטי אלמנטים (כולל value) לפי שפה, ללא כותרות
function keyboardElementsFor(lang) {
    const isHe = (lang === 'he');
    const forwardNames = isHe ? ORDER_HE_FORWARD : ORDER_EN_FORWARD;
    const backwardNames = isHe ? ORDER_HE_BACKWARD : ORDER_EN_BACKWARD;

    const pickHe = (nm) => ELEMENTS.find(e => e.nameHe === nm);
    const pickEn = (nm) => ELEMENTS.find(e => e.nameEn === nm);
    const pick = isHe ? pickHe : pickEn;

    const forward = forwardNames.map(pick).filter(Boolean);
    // --- פונקציה: buildKeyboardData ---
    const backward = backwardNames.map(pick).filter(Boolean);

    // הוספת “שאריות” שלא הוגדרו בסדר לעברית/אנגלית (אם שכחת משהו)
    const taken = new Set([...forward, ...backward].map(e => e.id));
    const rest = ELEMENTS.filter(e => !taken.has(e.id));

    return [...forward, ...backward, ...rest];
}

// מחזיר נתונים למקלדת עם כותרות ורווח ביניים (headers + spacer)
function buildKeyboardData(lang) {
    const isHe = (lang === 'he');
    const mkHeader = (id, title) => ({ type: 'header', id, title });
    const mkSpacer = (id, height = 28) => ({ type: 'spacer', id, height });

    const titleForward = isHe ? 'אלמנטים לפנים' : 'Forward elements';
    const titleBackward = isHe ? 'אלמנטים לאחור' : 'Backward elements';

    const base = keyboardElementsFor(lang);

    // חתך “קדימה”/“אחורה” לפי שפה: נשען על הרשימות המפורשות כדי לדעת היכן מסתיימת הקבוצה הראשונה
    const firstGroupNames = isHe ? ORDER_HE_FORWARD : ORDER_EN_FORWARD;

    const idsFirst = new Set(
        base
            .filter(el => (isHe ? firstGroupNames.includes(el.nameHe) : firstGroupNames.includes(el.nameEn)))
            .map(el => el.id)
    );

    const forward = base.filter(el => idsFirst.has(el.id));
    const backward = base.filter(el => !idsFirst.has(el.id));

    return [
        mkHeader('hdr-forward', titleForward),
        ...forward,
        mkSpacer('spacer-between-groups', 28),
        mkHeader('hdr-backward', titleBackward),
        ...backward,
    ];
}



// symbols
const SYMBOLS = {
    'ערבית': '(',
    'פליק פלאק': 'F',
    'טמפו': '^',

    // --- קדימה (Front) ---
    'קפיצת ידיים': 'H',         // חדש
    'סלטה קדימה בקירוס': '.O',
    'סלטה קדימה בקיפול': '.<',
    'גוף ישר קדימה': './',      // חדש
    'בראני': '.1',
    'בורג קדימה': '.2',         // חדש

    // --- אחורה (Back) ---
    'סלטה אחורה בקירוס': 'O',
    'סלטה אחורה בקיפול': '<',
    'סלטה אחורה בגוף ישר': '/',
    'חצי בורג': '1',
    'בורג': '2',
    'בורג וחצי': '3',
    'דאבל בורג': '4',
    'דאבל קירוס': '--O',
    'דאבל קיפול': '--<',
    'דאבל גוף ישר': '--/',
    'דאבל בשפגאט': '--Y',
    'האף אאוט גוף ישר': '-1/',
    'פול אין קירוס': '2-O',
    'פול אאוט קירוס': '-2O',
    'פול אין קיפול': '2-<',
    'פול אין גוף ישר': '2-/',
    'פול אאוט גוף ישר': '-2/',
    'פול פול קירוס': '22O',
    'פול פול גוף ישר': '22/',
    // --- פונקציה: slugify ---
    'פול פול וחצי קירוס': '23O',
    'פול פול וחצי גוף ישר': '23/',
    'מילר קירוס': '24O',
    'מילר גוף ישר': '24/',
    'קילר': '44/',
    'טריפל קירוס': '---O',
    'טריפל קיפול': '---<',
    'טריפל גוף ישר': '---/',
    'פול אין טריפל קירוס': '2--O',
    'פול אין טריפל קיפול': '2--<',
    'באק פול פול קירוס': '-22O',
    'פול פול פול': '222O',
};

function slugify(s) {
    return s
        .replace(/\u00A0/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}0-9 ]/gu, '')
        .replace(/\s+/g, '-');
}
const ELEMENTS = RAW_ELEMENTS.map(([he, en, value]) => ({
    // --- פונקציה: labelFor ---
    id: slugify(he),
    nameHe: he,
    nameEn: en,
    symbol: SYMBOLS[he] || '',
    value: Number(value.toFixed(1)),
}));
const VALUE_SET = Array.from(new Set(ELEMENTS.map(e => e.value))).sort((a, b) => a - b);

// ---- Helpers for labels ----
const formatVal = (v) => v.toFixed(1);
const nameFor = (el, lang) => (lang === 'he' ? el.nameHe : el.nameEn);
const labelFor = (elOrId, repMode, lang) => {
    const e = typeof elOrId === 'string' ? ELEMENTS.find(x => x.id === elOrId) : elOrId;
    if (!e) return '';
    return repMode === 'symbols' ? e.symbol : nameFor(e, lang);
};
// ---- Labels: keep size, wrap to 2 lines max, no truncation ----
const WRAP_HE = {
    'קפיצת ידיים': 'קפיצת ידיים',
    'סלטה קדימה בקירוס': 'סלטה קדימה בקירוס',
    'סלטה קדימה בקיפול': 'סלטה קדימה בקיפול',
    'גוף ישר קדימה': 'גוף ישר קדימה',
    'בראני': 'בראני',
    'בורג קדימה': 'בורג\nקדימה',

    'ערבית': 'ערבית',
    'פליק פלאק': 'פליק פלאק',
    'טמפו': 'טמפו',
    'סלטה אחורה בקירוס': 'סלטה אחורה\nבקירוס',
    'סלטה אחורה בקיפול': 'סלטה אחורה\nבקיפול',
    'סלטה אחורה בגוף ישר': 'סלטה אחורה\nבגוף ישר',
    'חצי בורג': 'חצי\nבורג',
    'בורג': 'בורג',
    'בורג וחצי': 'בורג\nוחצי',
    'דאבל בורג': 'דאבל\nבורג',
    'דאבל קירוס': 'דאבל\nקירוס',
    'דאבל קיפול': 'דאבל\nקיפול',
    'דאבל גוף ישר': 'דאבל\nגוף ישר',
    'דאבל בשפגאט': 'דאבל\nבשפגאט',
    'האף אאוט גוף ישר': 'האף אאוט\nגוף ישר',
    'פול אין קירוס': 'פול אין\nקירוס',
    'פול אאוט קירוס': 'פול אאוט\nקירוס',
    'פול אין קיפול': 'פול אין\nקיפול',
    'פול אין גוף ישר': 'פול אין\nגוף ישר',
    'פול אאוט גוף ישר': 'פול אאוט\nגוף ישר',
    'פול פול קירוס': 'פול פול\nקירוס',
    'פול פול גוף ישר': 'פול פול\nגוף ישר',
    'פול פול וחצי קירוס': 'פול פול וחצי\nקירוס',
    'פול פול וחצי גוף ישר': 'פול פול וחצי\nגוף ישר',
    'מילר קירוס': 'מילר\nקירוס',
    'מילר גוף ישר': 'מילר\nגוף ישר',
    'קילר': 'קילר',
    'טריפל קירוס': 'טריפל\nקירוס',
    'טריפל קיפול': 'טריפל\nקיפול',
    'טריפל גוף ישר': 'טריפל\nגוף ישר',
    'פול אין טריפל קירוס': 'פול אין טריפל\nקירוס',
    'פול אין טריפל קיפול': 'פול אין טריפל\nקיפול',
    'באק פול פול קירוס': 'באק פול פול\nקירוס',
    'פול פול פול': 'פול פול\nפול',
};

const WRAP_EN = {
    'Front Handspring': 'Front\nHandspring',
    'Front Tuck': 'Front\nTuck',
    'Front Pike': 'Front\nPike',
    'Front Layout': 'Front\nLayout',
    'Barani': 'Barani',
    'Front Full': 'Front\nFull',

    'Round Off': 'Round\nOff',
    'Back Handspring': 'Back\nHandspring',
    'Whip': 'Whip',
    'Back Tuck': 'Back\nTuck',
    'Back Pike': 'Back\nPike',
    'Back Layout': 'Back\nLayout',
    'Half Twist': 'Half\nTwist',
    'Full': 'Full',
    '1.5 Twist': '1.5\nTwist',
    'Double Full': 'Double\nFull',
    'Double Back Tuck': 'Double\nBack Tuck',
    'Double Back Pike': 'Double\nBack Pike',
    'Double Layout': 'Double\nLayout',
    'Double Split': 'Double\nSplit',
    'Half Out Layout': 'Half Out\nLayout',
    'Full In Tuck': 'Full In\nTuck',
    'Full Out Tuck': 'Full Out\nTuck',
    'Full In Pike': 'Full In\nPike',
    'Full In Layout': 'Full In\nLayout',
    'Full Out Layout': 'Full Out\nLayout',
    'Full Full Tuck': 'Full Full\nTuck',
    'Full Full Layout': 'Full Full\nLayout',
    'Full In 1.5 Twist Out Tuck': 'Full In 1.5\nTwist Out\nTuck',
    'Full In 1.5 Twist Out Layout': 'Full In 1.5\nTwist Out\nLayout',
    'Miller Tuck': 'Miller\nTuck',
    'Miller Layout': 'Miller\nLayout',
    'Killer': 'Killer',
    // --- פונקציה: AuthModal ---
    'Triple Tuck': 'Triple\nTuck',
    'Triple Pike': 'Triple\nPike',
    'Triple Layout': 'Triple\nLayout',
    'Full In Triple Tuck': 'Full In Triple\nTuck',
    'Full In Triple Pike': 'Full In Triple\nPike',
    'Back Full Full Tuck': 'Back Full Full\nTuck',
    'Full Full Full': 'Full Full\nFull',
};

// ===== AUTH MODAL (Login / Sign up) =====
function AuthModal({ open, mode = 'login', onClose, onSuccess }) {
    const { lang, isRTL } = usePrefs();
    const he = lang === 'he';
    const { login, register } = useAuth();

    const [fullName, setFullName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [role, setRole] = React.useState('judge');
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState('');

    // אימות אחרי הרשמה
    const [verifyOpen, setVerifyOpen] = React.useState(false);
    const [verifyId, setVerifyId] = React.useState(null);
    const [verifyChannel, setVerifyChannel] = React.useState('email'); // 'email' | 'phone'
    const [verifyDest, setVerifyDest] = React.useState(null);
    const [code, setCode] = React.useState(['', '', '', '', '', '']);
    const [busyVerify, setBusyVerify] = React.useState(false);


    const isSignup = mode === 'signup';

    const t = (k) => {
        const H = {
            loginTitle: 'התחברות',
            signupTitle: 'הרשמה',
            name: 'שם מלא',
            email: 'אימייל',
            pass: 'סיסמה',
            role: 'תפקיד',
            judge: 'שופט',
            coach: 'מאמן',
            submitLogin: 'התחבר',
            submitSignup: 'הרשמה',
            cancel: 'ביטול',
        };
        const E = {
            loginTitle: 'Sign in',
            signupTitle: 'Sign up',
            name: 'Full name',
            email: 'Email',
            pass: 'Password',
            role: 'Role',
            judge: 'Judge',
            coach: 'Coach',
            submitLogin: 'Sign in',
            submitSignup: 'Sign up',
            cancel: 'Cancel',
        };
        return he ? H[k] : E[k];
    };

    const onSubmit = async () => {
        try {
            setErr(''); setBusy(true);
            if (isSignup) {
                await register(fullName.trim(), email.trim(), password, role);
            } else {
                await login(email.trim(), password);
            }
            onSuccess?.();
            onClose?.();
        } catch (e) {
            setErr(e.message || 'Error');
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    return (
        <View style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
            alignItems: 'center', justifyContent: 'center'
        }}>
            <View style={{
                width: '88%', maxWidth: 420, backgroundColor: palette.card,
                borderRadius: 16, padding: 16, gap: 10, direction: isRTL ? 'rtl' : 'ltr',
                borderWidth: 1, borderColor: palette.border
            }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: palette.text }}>
                    {isSignup ? t('signupTitle') : t('loginTitle')}
                </Text>

                {isSignup && (
                    <>
                        <Text style={{ fontSize: 12, color: palette.muted }}>{t('name')}</Text>
                        <TextInput
                            value={fullName} onChangeText={setFullName}
                            placeholder={he ? 'לדוגמה: יעל לוי' : 'e.g. Jane Doe'}
                            style={{ borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, color: palette.text }}
                        />
                        <Text style={{ fontSize: 12, color: palette.muted }}>{t('role')}</Text>
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
                            <TouchableOpacity onPress={() => setRole('judge')}
                                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: role === 'judge' ? palette.primary : palette.border }}>
                                <Text style={{ color: role === 'judge' ? palette.primary : palette.text }}>{t('judge')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setRole('coach')}
                                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: role === 'coach' ? palette.primary : palette.border }}>
                                <Text style={{ color: role === 'coach' ? palette.primary : palette.text }}>{t('coach')}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <Text style={{ fontSize: 12, color: palette.muted }}>{t('email')}</Text>
                <TextInput
                    value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
                    placeholder={'name@example.com'}
                    style={{ borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, color: palette.text }}
                />

                <Text style={{ fontSize: 12, color: palette.muted }}>{t('pass')}</Text>
                <TextInput
                    value={password} onChangeText={setPassword} secureTextEntry
                    placeholder={he ? 'לפחות 8 תווים' : 'At least 8 characters'}
                    style={{ borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, color: palette.text }}
                />

                {!!err && <Text style={{ color: '#dc2626' }}>{err}</Text>}

                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 6 }}>
                    <TouchableOpacity
                        onPress={onSubmit}
                        disabled={busy}
                        style={{ flex: 1, backgroundColor: '#7c3aed', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '800' }}>{busy ? '...' : (isSignup ? t('submitSignup') : t('submitLogin'))}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onClose}


                        // ======================================================
                        // ✦ מסכי אפליקציה (Screens) ✦
                        // ======================================================
                        // --- פונקציה: AuthFormScreen ---
                        style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: palette.border }}
                    >
                        <Text style={{ color: palette.text }}>{t('cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// ===== מסך התחברות/הרשמה =====
function AuthFormScreen({ route }) {
    const { lang, isRTL } = usePrefs();
    const he = lang === 'he';
    const navigation = useNavigation();

    // מגיע מ־navigate(..., { mode: 'login' | 'signup' })
    const mode = route?.params?.mode === 'signup' ? 'signup' : 'login';
    const isSignup = mode === 'signup';

    // שדות קלט
    const [fullName, setFullName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [role, setRole] = React.useState('judge'); // לשימוש בהרשמה
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState('');
    const { login, register } = useAuth();

    const t = (k) => {
        const H = {
            titleLogin: 'התחברות',
            titleSignup: 'הרשמה',
            name: 'שם מלא',
            email: 'אימייל',
            pass: 'סיסמה',
            role: 'תפקיד',
            judge: 'שופט',
            coach: 'מאמן',
            submitLogin: 'התחבר',
            submitSignup: 'הרשמה',
            cancel: 'ביטול',
        };
        const E = {
            titleLogin: 'Sign in',
            titleSignup: 'Sign up',
            name: 'Full name',
            email: 'Email',
            pass: 'Password',
            role: 'Role',
            judge: 'Judge',
            coach: 'Coach',
            submitLogin: 'Sign in',
            submitSignup: 'Sign up',
            cancel: 'Cancel',
        };
        return he ? H[k] : E[k];
    };

    const submit = async () => {
        try {
            setErr('');
            setBusy(true);

            if (isSignup) {
                // ישמור טוקן ויעדכן user דרך ה-AuthContext
                await register(fullName.trim(), email.trim(), password, role);
            } else {
                // ישמור טוקן ויעדכן user דרך ה-AuthContext
                await login(email.trim(), password);
            }

            navigation.navigate('Profile');
        } catch (e) {
            setErr(e?.message || (he ? 'שגיאה' : 'Error'));
        } finally {
            setBusy(false);
        }
    };


    // כפתור חזרה עגול
    const BackButton = () => (
        <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
            style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: palette.card,
                borderWidth: 1, borderColor: palette.border,
                alignItems: 'center', justifyContent: 'center',
            }}
            accessibilityLabel={he ? 'חזרה' : 'Back'}
        >
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={palette.text} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.screen, { flex: 1, backgroundColor: palette.screen }]} edges={['top']}>
            <Header
                title={isSignup ? t('titleSignup') : t('titleLogin')}
                start={<BackButton />}
            />

            <ScrollView
                contentContainerStyle={{ padding: 16, gap: 10, direction: isRTL ? 'rtl' : 'ltr' }}
                keyboardShouldPersistTaps="handled"
            >
                {isSignup && (
                    <>
                        <Text style={{ fontSize: 12, color: palette.muted }}>{t('name')}</Text>
                        <TextInput
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder={he ? 'לדוגמה: נועה לוי' : 'e.g. Jane Doe'}
                            style={{ borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, color: palette.text }}
                        />

                        <Text style={{ fontSize: 12, color: palette.muted }}>{t('role')}</Text>
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => setRole('judge')}
                                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: role === 'judge' ? palette.primary : palette.border }}
                            >
                                <Text style={{ color: role === 'judge' ? palette.primary : palette.text }}>{t('judge')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setRole('coach')}
                                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: role === 'coach' ? palette.primary : palette.border }}
                            >
                                <Text style={{ color: role === 'coach' ? palette.primary : palette.text }}>{t('coach')}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <Text style={{ fontSize: 12, color: palette.muted }}>{t('email')}</Text>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="name@example.com"
                    style={{ borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, color: palette.text }}
                />

                <Text style={{ fontSize: 12, color: palette.muted }}>{t('pass')}</Text>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder={he ? 'לפחות 8 תווים' : 'At least 8 characters'}
                    style={{ borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, color: palette.text }}
                />

                {!!err && <Text style={{ color: '#dc2626' }}>{err}</Text>}

                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 6 }}>
                    <TouchableOpacity
                        onPress={submit}
                        disabled={busy}
                        style={{ flex: 1, backgroundColor: '#7c3aed', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '800' }}>{busy ? '...' : (isSignup ? t('submitSignup') : t('submitLogin'))}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile')}
                        style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: palette.border }}
                    >
                        <Text style={{ color: palette.text }}>{t('cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}


// ---- Labels: שתי שורות מקסימום, בלי הקטנת פונט, בלי "יתומים" ----
function keyLabelFor(item, repMode, lang) {
    if (!item) return '';
    if (repMode === 'symbols') return item.symbol || '';

    const NBSP = '\u00A0';
    const nm = (lang === 'he' ? item.nameHe : item.nameEn) || '';

    // מפות שבירה ידניות אם יש (WRAP_HE/WRAP_EN)
    const manual = (lang === 'he'
        ? (typeof WRAP_HE !== 'undefined' && WRAP_HE[nm])
        : (typeof WRAP_EN !== 'undefined' && WRAP_EN[nm]));
    if (manual) {
        return manual;
    }

    // פיצול למילים
    const words = nm.split(' ').filter(Boolean);
    if (words.length <= 2) {
        // קצר מלכתחילה—שורה אחת
        return nm;
    }

    // איזון ראשוני: חצי-חצי
    let mid = Math.ceil(words.length / 2);
    let left = words.slice(0, mid);
    let right = words.slice(mid);

    // --- כללי "בלי יתומים" ---
    // 1) אל תסיים שורה ראשונה במילה של תו אחד (או באנגלית: מילות קישור קצרות)
    const shortLen = (lang === 'he' ? 1 : 2);   // בעברית מילה של תו אחד; באנגלית <=2 ("of","in","to")
    const isShort = (w) => (w && w.replace(/[^\p{L}\p{N}]/gu, '').length <= shortLen);

    // אם השורה השנייה מתחילה במילה קצרה – משיבים מילה אחת מההתחלה שלה לסוף השורה הראשונה
    // עד שלא מתחילה במילה קצרה (או שנגמר מה להזיז)
    while (right.length > 0 && isShort(right[0])) {
        left.push(right.shift());
    }

    // אם השורה הראשונה נגמרת במילה קצרה – מעבירים אותה לתחילת השורה השנייה
    while (left.length > 1 && isShort(left[left.length - 1])) {
        right.unshift(left.pop());
    }

    // בונוס: אם נשארה בשורה השנייה מילה ראשונה באורך 2 בעברית (למשל "עם","על") – נעביר מילה אחת נוספת מההתחלה כדי שלא תתחיל במילה קצרה
    if (lang === 'he' && right.length > 1 && right[0].length === 2) {
        left.push(right.shift());
    }

    // שמור על צמדים קבועים שלא נשברים:
    // "סלטה קדימה" / "סלטה אחורה" / "Back Handspring" וכד'
    const joinPairs = (arr) => {
        const s = arr.join(' ');
        return s
            .replace(/סלטה קדימה/g, `סלטה${NBSP}קדימה`)
            .replace(/סלטה אחורה/g, `סלטה${NBSP}אחורה`)
            .replace(/Back Handspring/g, `Back${NBSP}Handspring`)
            .replace(/Front Handspring/g, `Front${NBSP}Handspring`)
            .replace(/Back Layout/g, `Back${NBSP}Layout`)
            // --- פונקציה: ElementsKeyboardUnified ---
            .replace(/Front Layout/g, `Front${NBSP}Layout`);
    };

    // בשורה השנייה – מחליפים רווחים ל־NBSP כדי שלא תישבר שוב לשלוש שורות
    const line1 = joinPairs(left);
    const line2 = joinPairs(right).replace(/ /g, NBSP);

    return `${line1}\n${line2}`;
}


// ====== Keyboard (Unified, centered labels/symbols, per-language sortbar tuning) ======
function ElementsKeyboardUnified({
    onPressElement,
    columns = 3,
    colGap = 12,
    keyHeight = 98,
    valueHeight = 26,
}) {
    const { lang, isRTL } = usePrefs();
    const { repMode } = useProgress();
    const navigation = useNavigation();

    // --- שליטה ידנית בסרגל המיון (כמו שהיה) ---
    const SORTBAR_SHIFT_HE_X = 260; // עברית: + ימינה, - שמאלה
    const SORTBAR_SHIFT_EN_X = 0;   // אנגלית
    const ARROW_SIDE_HE = 'right';  // 'left' | 'right'
    const ARROW_SIDE_EN = 'right';

    const SHIFT_X = lang === 'he' ? SORTBAR_SHIFT_HE_X : SORTBAR_SHIFT_EN_X;
    const ARROW_SIDE = lang === 'he' ? ARROW_SIDE_HE : ARROW_SIDE_EN;

    // --- טקסט שם אלמנט: בעברית כמו באנגלית, קבוע ---
    const NAME_HE_SIZE = 13, NAME_HE_LINE = 15;
    const NAME_EN_SIZE = 13, NAME_EN_LINE = 15;

    // --- פריסה: רוחבי קוביות ---
    const screenW = Dimensions.get('window').width;
    const sidePad = 8;
    const keyW = Math.floor((screenW - sidePad * 2 - colGap * (columns - 1)) / columns);

    // --- מקור נתוני מקלדת לפי שפה ---
    const gridSource = React.useMemo(() => keyboardElementsFor(lang), [lang]);

    // --- מצב משותף (מיון/נעיצות/שימוש) – נשמר ב-AsyncStorage ---
    const SORT_KEY_KEY = 'tdjp.sortKey.v1';
    const SORT_DIR_KEY = 'tdjp.sortDir.v1';
    const PIN_KEY = 'tdjp.pinned.v1';
    const USE_KEY = 'tdjp.usage.v1';

    const [sortKey, setSortKey] = React.useState('direction'); // 'direction' | 'difficulty' | 'usage'
    const [sortDir, setSortDir] = React.useState('down');      // 'down' | 'up'
    const [pinned, setPinned] = React.useState([]);            // ids (עד 3)
    const [usage, setUsage] = React.useState({});              // { [id]: count }

    // טוסטים/דיאלוגים
    const [pinLimit, setPinLimit] = React.useState(false);
    const pinLimitTimerRef = React.useRef(null);
    const [confirmUnpinId, setConfirmUnpinId] = React.useState(null);

    // טעינה מה-storage
    const reloadFromStorage = React.useCallback(async () => {
        try { const v = await AsyncStorage.getItem(SORT_KEY_KEY); if (v) setSortKey(v); } catch { }
        try { const v = await AsyncStorage.getItem(SORT_DIR_KEY); if (v) setSortDir(v); } catch { }
        try { const v = await AsyncStorage.getItem(PIN_KEY); if (v) setPinned(JSON.parse(v)); } catch { }
        try { const v = await AsyncStorage.getItem(USE_KEY); if (v) setUsage(JSON.parse(v)); } catch { }
    }, []);

    React.useEffect(() => { reloadFromStorage(); }, [reloadFromStorage]);
    React.useEffect(() => {
        const unsub = navigation.addListener('focus', reloadFromStorage);
        return unsub;
    }, [navigation, reloadFromStorage]);

    // שמירה ל-storage
    React.useEffect(() => { AsyncStorage.setItem(SORT_KEY_KEY, String(sortKey)).catch(() => { }); }, [sortKey]);
    React.useEffect(() => { AsyncStorage.setItem(SORT_DIR_KEY, String(sortDir)).catch(() => { }); }, [sortDir]);
    React.useEffect(() => { AsyncStorage.setItem(PIN_KEY, JSON.stringify(pinned)).catch(() => { }); }, [pinned]);

    // שימוש (Usage)
    const bumpUsage = React.useCallback((id) => {
        setUsage(prev => {
            const next = { ...prev, [id]: (prev[id] || 0) + 1 };
            AsyncStorage.setItem(USE_KEY, JSON.stringify(next)).catch(() => { });
            return next;
        });
    }, []);

    // === לוגיקה חדשה למיון לפי "כיוון תנועה" ===
    // משתמשות ברשימות ORDER_HE_FORWARD/ORDER_HE_BACKWARD וגרסאות האנגליות כדי לזהות קדימה/אחורה.
    const forwardIds = React.useMemo(() => {
        const names = (lang === 'he') ? ORDER_HE_FORWARD : ORDER_EN_FORWARD;
        return new Set(
            names
                .map(nm => ELEMENTS.find(e => (lang === 'he' ? e.nameHe === nm : e.nameEn === nm)))
                .filter(Boolean)
                .map(e => e.id)
        );
    }, [lang]);

    const backwardIds = React.useMemo(() => {
        const names = (lang === 'he') ? ORDER_HE_BACKWARD : ORDER_EN_BACKWARD;
        return new Set(
            names
                .map(nm => ELEMENTS.find(e => (lang === 'he' ? e.nameHe === nm : e.nameEn === nm)))
                .filter(Boolean)
                .map(e => e.id)
        );
    }, [lang]);

    const isForward = (el) => forwardIds.has(el.id);
    const isBackward = (el) => backwardIds.has(el.id);
    const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

    const cycleSortKey = React.useCallback(() => {
        setSortKey(k => (k === 'direction' ? 'difficulty' : k === 'difficulty' ? 'usage' : 'direction'));
    }, []);
    const toggleSortDir = React.useCallback(() => {
        setSortDir(d => (d === 'down' ? 'up' : 'down'));
    }, []);

    const dataForKeyboard = React.useMemo(() => {
        const pinOrder = new Map(pinned.map((id, idx) => [id, idx]));
        const sorted = [...gridSource].sort((a, b) => {
            // 1) נעוצים תמיד למעלה, לפי סדר הנעיצה
            const pa = pinOrder.has(a.id), pb = pinOrder.has(b.id);
            if (pa && pb) return (pinOrder.get(a.id) || 0) - (pinOrder.get(b.id) || 0);
            if (pa) return -1;
            if (pb) return 1;

            // 2) מיון לפי סוג
            if (sortKey === 'difficulty') {
                return cmp(a.value, b.value) * (sortDir === 'down' ? 1 : -1);
            }
            if (sortKey === 'usage') {
                const ua = usage[a.id] || 0, ub = usage[b.id] || 0;
                return cmp(ub, ua) * (sortDir === 'down' ? 1 : -1);
            }

            // 3) direction: 'down' = קדימה→אחורה, 'up' = אחורה→קדימה
            // מזהים Forward/Backward לפי הרשימות לשפה הנוכחית (לא לפי שדה movement שאינו קיים)
            const rank = (el) => {
                const f = isForward(el);
                const b = isBackward(el);
                // אם לא נמצא באף סט (בגלל “שאריות”), נשקול אותן כ"אחורה" בסוף
                const base = f ? 0 : (b ? 1 : 2);
                // אם sortDir==='up' נהפוך את הדירוג
                return (sortDir === 'down') ? base : (2 - base); // 0<->2, 1 נשאר באמצע, בפועל: forward והאחרים מתהפכים
            };
            return cmp(rank(a), rank(b));
        });
        return sorted;
    }, [gridSource, pinned, sortKey, sortDir, usage, isForward, isBackward]);

    // --- סרגל מיון (UI כמו שהיה) ---
    const SortBar = (
        <View style={{ marginHorizontal: -16, paddingHorizontal: 0, marginTop: 0, marginBottom: 8 }}>
            <View style={[styles.secondaryBtn, { alignSelf: 'stretch', borderRadius: 0, paddingHorizontal: 12, paddingVertical: 8, margin: 0 }]}>
                <View
                    style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        justifyContent: isRTL ? 'flex-end' : 'flex-start',
                        gap: 8,
                        transform: [{ translateX: SHIFT_X }],
                    }}
                >
                    {(ARROW_SIDE === 'left') ? (
                        <>
                            <TouchableOpacity onPress={toggleSortDir} activeOpacity={0.8} style={{ paddingHorizontal: 6, paddingVertical: 2 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Text style={styles.secondaryBtnText}>{sortDir === 'down' ? '▼' : '▲'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={cycleSortKey} activeOpacity={0.8} style={{ paddingVertical: 2 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Text style={[styles.secondaryBtnText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                                    {lang === 'he'
                                        ? (sortKey === 'direction' ? 'כיוון תנועה' : sortKey === 'difficulty' ? 'דרגת קושי' : 'נתוני שימוש')
                                        : (sortKey === 'direction' ? 'Movement' : sortKey === 'difficulty' ? 'Difficulty' : 'Usage')}
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity onPress={cycleSortKey} activeOpacity={0.8} style={{ paddingVertical: 2 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Text style={[styles.secondaryBtnText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                                    {lang === 'he'
                                        ? (sortKey === 'direction' ? 'כיוון תנועה' : sortKey === 'difficulty' ? 'דרגת קושי' : 'נתוני שימוש')
                                        : (sortKey === 'direction' ? 'Movement' : sortKey === 'difficulty' ? 'Difficulty' : 'Usage')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleSortDir} activeOpacity={0.8} style={{ paddingHorizontal: 6, paddingVertical: 2 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Text style={styles.secondaryBtnText}>{sortDir === 'down' ? '▼' : '▲'}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <View style={{ marginTop: 0 }}>
            {SortBar}

            <FlatList
                data={dataForKeyboard}
                keyExtractor={(i) => i.id}
                numColumns={columns}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: sidePad }}
                columnWrapperStyle={{
                    justifyContent: 'space-between',
                    gap: colGap,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                }}
                renderItem={({ item }) => {
                    const isPinned = pinned.includes(item.id);
                    const canPin = isPinned || pinned.length < 3;

                    const onPressPin = () => {
                        if (isPinned) return setConfirmUnpinId(item.id);
                        if (!canPin) {
                            setPinLimit(true);
                            if (pinLimitTimerRef.current) clearTimeout(pinLimitTimerRef.current);
                            pinLimitTimerRef.current = setTimeout(() => setPinLimit(false), 1400);
                            return;
                        }
                        setPinned(list => [...list, item.id]);
                    };

                    const isSymbols = repMode === 'symbols';
                    const displayLabel = keyLabelFor(item, repMode, lang);

                    return (
                        <TouchableOpacity
                            onPress={() => { onPressElement?.(item.id); bumpUsage(item.id); }}
                            style={[
                                styles.keyBtn,
                                isSymbols && styles.keyBtnSymbols,
                                { width: keyW, height: keyHeight, overflow: 'hidden' },
                            ]}
                            activeOpacity={0.7}
                        >
                            {/* Pin badge */}
                            <View style={[styles.pinWrap, lang === 'he' ? { right: 2 } : { left: 2 }]} pointerEvents="box-none">
                                <TouchableOpacity
                                    onPress={onPressPin}
                                    activeOpacity={0.8}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={[
                                        styles.pinButton,
                                        isPinned ? styles.pinButtonActive : styles.pinButtonIdle,
                                        (!isPinned && !canPin) && styles.pinButtonDisabled,
                                        { transform: [{ rotate: isRTL ? '-16deg' : '16deg' }] },
                                    ]}
                                    accessibilityRole="button"
                                    accessibilityLabel={lang === 'he' ? (isPinned ? 'הסר נעיצה' : 'נעץ אלמנט') : (isPinned ? 'Unpin element' : 'Pin element')}
                                >
                                    <Ionicons
                                        size={20}
                                        name={isPinned ? 'pin' : 'pin-outline'}
                                        color={isPinned ? (palette?.danger || '#FF3B30') : '#FFFFFF'}
                                        style={{ textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1.5 }}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* גוף המקש */}
                            <View style={[styles.keyBtnInner, { flex: 1, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 0 }]}>
                                {/* שכבת שם/סימבול – ממורכזת אנכית בין TOP לערך למטה */}
                                <View
                                    style={{
                                        position: 'absolute',
                                        left: 8,
                                        right: 8,
                                        top: 8,
                                        bottom: valueHeight,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                    pointerEvents="none"
                                >
                                    {isSymbols ? (
                                        <Text
                                            style={[
                                                styles.keyLabelSymbol,
                                                Platform.select({ ios: { fontFamily: 'Menlo' }, android: { fontFamily: 'monospace' } }),
                                                { fontSize: 34, lineHeight: 36, textAlign: 'center', color: '#fff' },
                                            ]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.7}
                                            allowFontScaling={false}
                                            ellipsizeMode="clip"
                                        >
                                            {displayLabel}
                                        </Text>
                                    ) : (
                                        <Text
                                            style={[
                                                styles.keyLabel,
                                                { writingDirection: isRTL ? 'rtl' : 'ltr', textAlign: 'center' },
                                                {
                                                    fontSize: lang === 'he' ? NAME_HE_SIZE : NAME_EN_SIZE,
                                                    lineHeight: lang === 'he' ? NAME_HE_LINE : NAME_EN_LINE,
                                                },
                                            ]}
                                            numberOfLines={3}
                                            adjustsFontSizeToFit={false}
                                            allowFontScaling={false}
                                            ellipsizeMode="clip"
                                        >
                                            {displayLabel}
                                        </Text>
                                    )}
                                </View>

                                {/* value — מודבק לתחתית ושקוף */}
                                <View
                                    style={{
                                        position: 'absolute',
                                        left: 8,
                                        right: 8,
                                        bottom: 0,
                                        height: valueHeight,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'transparent',
                                    }}
                                    pointerEvents="none"
                                >
                                    <Text
                                        style={[
                                            styles.keyValue,
                                            isSymbols && styles.keyValueSymbols,
                                            { backgroundColor: 'transparent', fontSize: 13, lineHeight: 14, marginBottom: Platform.OS === 'android' ? -2 : -1 },
                                        ]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.85}
                                        allowFontScaling={false}
                                        {...Platform.select({ android: { includeFontPadding: false } })}
                                    >
                                        {formatVal(item.value)}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* טוסט “אפשר לנעוץ עד 3 אלמנטים” */}
            <Modal visible={pinLimit} transparent animationType="fade" onRequestClose={() => setPinLimit(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalCard, { alignItems: 'center' }]}>
                        <Ionicons name="information-circle-outline" size={42} color={palette.primary} />
                        <Text style={[styles.modalTitle, { textAlign: 'center', marginTop: 8 }]}>
                            {lang === 'he' ? 'אפשר לנעוץ עד 3 אלמנטים' : 'You can pin up to 3 elements'}
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* דיאלוג הסרת נעיצה */}
            <Modal visible={!!confirmUnpinId} transparent animationType="fade" onRequestClose={() => setConfirmUnpinId(null)}>
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.modalTitle, { alignSelf: 'stretch', textAlign: 'center' }]}>
                            {lang === 'he' ? 'להסיר את הנעיצה מהאלמנט?' : 'Remove pin from element?'}
                        </Text>
                        <View style={[styles.row, { gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row', alignSelf: 'center' }]}>
                            <TouchableOpacity
                                onPress={() => { if (confirmUnpinId) setPinned(list => list.filter(x => x !== confirmUnpinId)); setConfirmUnpinId(null); }}
                                activeOpacity={0.7}
                                style={[styles.modalBtn, styles.modalBtnPrimary]}
                            >
                                <Text style={styles.modalBtnText}>{lang === 'he' ? 'הסר' : 'Remove'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setConfirmUnpinId(null)}
                                activeOpacity={0.7}
                                style={[styles.modalBtn, styles.modalBtnSecondary]}
                            >
                                <Text style={styles.modalBtnText}>{lang === 'he' ? 'בטל' : 'Cancel'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}



// ===== Tariff legality validator (REPLACE) =====
const ID_ARABIT = slugify('ערבית');
const ID_BORG = slugify('בורג אחורה');
// ======================================================
// ✦ שונות (Other) ✦
// ======================================================
// --- פונקציה: validatePasses ---
const ID_TEMPO = slugify('טמפו');
const ID_FLICK = slugify('פליק פלאק');

// מותר לחזור בתוך פס (intra-pass)
const ALLOWED_INTRA_REPEAT = new Set([ID_TEMPO, ID_FLICK, ID_BORG]);
// מותר לחזור בין פסים (cross-pass) – מוסיפים כאן גם "ערבית"
const ALLOWED_CROSS_REPEAT = new Set([ID_TEMPO, ID_FLICK, ID_BORG, ID_ARABIT]);

// ===== Tariff legality validator (REPLACE) =====
function validatePasses(pass1Ids = [], pass2Ids = [], lang = 'he') {
    // Helpers
    const he = lang === 'he';
    const mkIdxMap = (arr) => {
        const m = new Map();
        arr.forEach((id, i) => {
            if (!id) return;
            if (!m.has(id)) m.set(id, []);
            m.get(id).push(i);
        });
        return m;
    };

    // existing checks (reuse existing logic but extend)
    function checkSinglePass(arr) {
        const badIdx = new Set();
        const messages = new Set();
        const m = mkIdxMap(arr);

        // (ב) איסור כפילות בתוך פס (למעט המותרים)
        for (const [id, idxs] of m.entries()) {
            if (ALLOWED_INTRA_REPEAT.has(id)) continue;
            if (idxs.length > 1) {
                idxs.forEach(i => badIdx.add(i));
                messages.add(he ? 'חזרה על אלמנט בתוך הפס' : 'Element repeated in pass');
            }
        }

        // (ג) בורג אחורה – עד 3 בתוך פס
        const borg = m.get(ID_BORG) || [];
        if (borg.length > 3) {
            borg.slice(3).forEach(i => badIdx.add(i));
            messages.add(he ? 'מותר עד 3 ברגים אחורה בפס' : 'Max 3 back fulls per pass');
        }

        return { badIdx, messages: Array.from(messages) };
    }

    // run existing per-pass checks
    const p1 = checkSinglePass(pass1Ids);
    const p2 = checkSinglePass(pass2Ids);

    // (ד) כפילויות בין פס 1 לפס 2 – מותרות בין פסים רק מהסט ALLOWED_CROSS_REPEAT
    const m1 = new Map();
    pass1Ids.forEach((id, i) => { if (!id) return; if (!m1.has(id)) m1.set(id, []); m1.get(id).push(i); });
    const m2 = new Map();
    pass2Ids.forEach((id, i) => { if (!id) return; if (!m2.has(id)) m2.set(id, []); m2.get(id).push(i); });

    const crossMsgs = new Set();
    let hasCrossDup = false;

    for (const [id, idxs1] of m1.entries()) {
        if (!id || ALLOWED_CROSS_REPEAT.has(id)) continue;
        const idxs2 = m2.get(id) || [];
        if (idxs1.length && idxs2.length) {
            hasCrossDup = true;
            idxs1.forEach(i => p1.badIdx.add(i));
            idxs2.forEach(i => p2.badIdx.add(i));
        }
    }
    if (hasCrossDup) {
        crossMsgs.add(he ? 'חזרה על אלמנט בין פס 1 לפס 2' : 'Element repeated across passes');
    }

    // (ה) כלל סיום: רק פס אחד רשאי להסתיים ב"בורג אחורה"
    const lastIdx1 = (() => { for (let i = pass1Ids.length - 1; i >= 0; i--) if (pass1Ids[i]) return i; return -1; })();
    const lastIdx2 = (() => { for (let i = pass2Ids.length - 1; i >= 0; i--) if (pass2Ids[i]) return i; return -1; })();

    const p1EndsWithBorg = lastIdx1 >= 0 && pass1Ids[lastIdx1] === ID_BORG;
    const p2EndsWithBorg = lastIdx2 >= 0 && pass2Ids[lastIdx2] === ID_BORG;

    if (p1EndsWithBorg && p2EndsWithBorg) {
        if (lastIdx1 >= 0) p1.badIdx.add(lastIdx1);
        if (lastIdx2 >= 0) p2.badIdx.add(lastIdx2);
        crossMsgs.add(he ? 'רק אחד מהפסים יכול להסתיים ב״בורג אחורה״' : 'Only one pass may end with Back Full');
    }

    // -----------------------------
    // NEW RULES — direction change & flick/tempo -> forward
    // -----------------------------

    // Build forward/back sets according to language lists
    const forwardNames = (lang === 'he') ? ORDER_HE_FORWARD : ORDER_EN_FORWARD;
    const backwardNames = (lang === 'he') ? ORDER_HE_BACKWARD : ORDER_EN_BACKWARD;
    // maps of id -> direction
    const forwardIds = new Set((forwardNames.map(nm => {
        const e = ELEMENTS.find(x => (lang === 'he' ? x.nameHe === nm : x.nameEn === nm));
        return e ? e.id : null;
    })).filter(Boolean));
    const backwardIds = new Set((backwardNames.map(nm => {
        const e = ELEMENTS.find(x => (lang === 'he' ? x.nameHe === nm : x.nameEn === nm));
        return e ? e.id : null;
    })).filter(Boolean));

    function analyzeDirectionRules(arr, pObj) {
        // pObj is { badIdx:Set, messages:Array } from earlier; we'll add more messages & badIdx
        const n = arr.length;
        // find last non-empty index
        const lastNonEmpty = (() => { for (let i = n - 1; i >= 0; i--) if (arr[i]) return i; return -1; })();

        for (let i = 0; i < n - 1; i++) {
            const id = arr[i];
            const nextId = arr[i + 1];
            if (!id || !nextId) continue;

            const isCurrBack = backwardIds.has(id);
            const isNextForward = forwardIds.has(nextId);

            // 1) SPECIFIC: פליק פלאק / טמפו לפני אלמנט קדימה — תמיד לא חוקי (הודעה מיוחדת)
            if ((id === ID_FLICK || id === ID_TEMPO) && isNextForward) {
                // mark both elements as bad
                pObj.badIdx.add(i);
                pObj.badIdx.add(i + 1);
                const msg = id === ID_FLICK
                    ? (he ? 'פליק פלאק לאלמנט קדימה' : 'Flick/Back Handspring into forward element')
                    : (he ? 'טמפו לאלמנט קדימה' : 'Tempo/Whip into forward element');
                pObj.messages.push(msg);
            }

            // 2) GENERAL: מעבר מסדרה אחורה -> קדימה (back -> front) — מותר **רק** אם זה סוף הפס.
            if (isCurrBack && isNextForward) {
                // allowed only if the forward element is the last non-empty element in the pass
                if (i + 1 !== lastNonEmpty) {
                    // יצא באמצע הפס => לא חוקי
                    // סימן אזהרה: נסמן את האלמנטים המעורבים (ה־back וה־first forward)
                    pObj.badIdx.add(i);
                    pObj.badIdx.add(i + 1);
                    pObj.messages.push(he ? 'שינוי כיוון תנועה באמצע פס' : 'Change of movement direction in middle of pass');
                }
            }
        }

        // return pObj (modified)
        return pObj;
    }

    analyzeDirectionRules(pass1Ids, p1);
    analyzeDirectionRules(pass2Ids, p2);

    // Prepare final result structure (convert Sets -> Arrays for external use)
    const result = {
        isLegal: p1.badIdx.size === 0 && p2.badIdx.size === 0 && crossMsgs.size === 0,
        // --- פונקציה: IllegalExportDialog ---
        p1: { badIdx: Array.from(p1.badIdx).sort((a, b) => a - b), messages: Array.from(new Set([...(p1.messages || [])])) },
        p2: { badIdx: Array.from(p2.badIdx).sort((a, b) => a - b), messages: Array.from(new Set([...(p2.messages || [])])) },
        both: { messages: Array.from(crossMsgs) },
    };
    return result;
}


// ===== Modal for illegal export (ADD) =====
function IllegalExportDialog({ visible, onCancel, onConfirm, lang, isRTL }) {
    const he = lang === 'he';

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.modalBackdrop}>
                <View style={[styles.modalCard, { alignItems: 'center' }]}>
                    <Ionicons name="warning-outline" size={42} color={palette.gold} />
                    <Text style={[styles.modalTitle, { textAlign: 'center', marginTop: 8 }]}>
                        {he ? 'הפסים אינם חוקיים' : 'Passes are illegal'}
                    </Text>

                    {/* שתי שורות נפרדות */}
                    <View style={{ marginTop: 6, alignSelf: 'stretch', paddingHorizontal: 4 }}>
                        <Text
                            style={{
                                color: palette.muted,
                                textAlign: 'center',
                                writingDirection: he ? 'rtl' : 'ltr',
                                includeFontPadding: false,
                            }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.9}
                        >
                            {he ? 'הפסים מכילים טעויות.' : 'The passes contain errors.'}
                        </Text>

                        <Text
                            style={{
                                color: palette.muted,
                                textAlign: 'center',
                                writingDirection: he ? 'rtl' : 'ltr',
                                marginTop: 2,
                                includeFontPadding: false,
                            }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}
                        >
                            {he
                                ? `להמשיך בכל זאת ולייצא\u00A0\u200EPDF?`
                                : 'Continue and export the PDF anyway?'}
                        </Text>
                    </View>

                    {/* כפתורים – "ייצא בכל זאת" מעט גדול יותר */}
                    <View
                        style={{
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            gap: 10,
                            marginTop: 14,
                            alignSelf: 'stretch',
                        }}
                    >
                        <TouchableOpacity
                            onPress={onCancel}
                            style={[
                                styles.secondaryBtn,
                                {
                                    flex: 0.9, // קטן יותר
                                    paddingVertical: 12,
                                    justifyContent: 'center',
                                },
                            ]}
                        >
                            <Text style={styles.secondaryBtnText}>{he ? 'ביטול' : 'Cancel'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            style={[
                                styles.primaryBtn,
                                {
                                    flex: 1.1, // גדול יותר
                                    marginTop: 0,
                                    paddingVertical: 14, // גם טיפה יותר גובה
                                },
                            ]}
                        >
                            <Ionicons name="download-outline" size={18} color="#fff" />
                            <Text style={styles.primaryBtnText}>{he ? 'ייצא בכל זאת' : 'Export anyway'}</Text>
                            {/* פונקציה: defaultProgress */}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}


// ---- Persistence for progress ----
const STORAGE_KEY = 'tdjp.progress.v2';
const OLD_NAME = 'אין פול פול קירוס';
const NEW_NAME = 'באק פול פול קירוס';
const OLD_ID = slugify(OLD_NAME);
const NEW_ID = slugify(NEW_NAME);

function defaultProgress() {
    const map = {};
    ELEMENTS.forEach(e => { map[e.id] = { correct: 0, wrong: 0 }; });
    return map;
}
async function loadProgress() {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : defaultProgress();
        if (data[OLD_ID] && !data[NEW_ID]) {
            data[NEW_ID] = data[OLD_ID];
            // --- פונקציה: useProgress ---
            delete data[OLD_ID];
        }
        const base = defaultProgress();
        return { ...base, ...data };
    } catch {
        return defaultProgress();
    }
}
// --- פונקציה: weightedSample ---
async function saveProgress(p) {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { }
}

// ---- Context / Progress ----
const ProgressCtx = createContext(null);
function useProgress() {
    const ctx = useContext(ProgressCtx);
    if (!ctx) throw new Error('ProgressCtx missing');
    return ctx;
}



// ---- Utilities ----
function weightedSample(items, weights, k) {
    const res = [];
    // --- פונקציה: closeDistractors ---
    const pool = items.map((it, i) => ({ it, w: Math.max(0.0001, weights[i]) }));
    for (let n = 0; n < Math.min(k, pool.length); n++) {
        const total = pool.reduce((s, p) => s + p.w, 0);
        let r = Math.random() * total;
        const idx = pool.findIndex(p => (r -= p.w) < 0);
        res.push(pool[idx].it);
        pool.splice(idx, 1);
    }
    return res;
}
function closeDistractors(correct) {
    const candidates = VALUE_SET.filter(v => v !== correct).sort((a, b) => Math.abs(a - correct) - Math.abs(b - correct));
    const chosen = [];
    // --- פונקציה: shuffle ---
    for (const v of candidates) { if (chosen.length >= 3) break; chosen.push(v); }
    while (chosen.length < 3) {
        const step = ((Math.random() > 0.5) ? 1 : -1) * 0.1 * (Math.random() > 0.5 ? 1 : 2);
        const v = Number((correct + step).toFixed(1));
        if (v !== correct && !chosen.includes(v)) chosen.push(v);
    }
    return chosen.slice(0, 3).map(v => Number(v.toFixed(1)));
}
function shuffle(a) {
    const arr = [...a];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor((Math.random() * (i + 1)));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ---- Attachments helpers (images) ----
async function ensureMediaPermissions() {
    // גלריה
    const { status: media } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // מצלמה (לא חובה — רק אם תרצה לצלם מיד)
    const { status: camera } = await ImagePicker.requestCameraPermissionsAsync();
    return (media === 'granted'); // די לנו בגלריה בשביל עכשיו
}

async function pickImageFromLibrary({ base64 = true } = {}) {
    const ok = await ensureMediaPermissions();
    if (!ok) {
        Alert.alert('הרשאה נחוצה', 'יש לאשר גישה לגלריה כדי לצרף תמונה.');
        return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,       // דחיסה קלה
        base64,             // מאפשר שמירה ל-outbox + שליחה כ-JSON
        allowsMultipleSelection: false,
        exif: false,
    });
    if (res.canceled) return null;

    const a = res.assets?.[0];
    if (!a) return null;

    // הגבלת משקל בסיסית לבסיס64 (אם גדול מדי, נשלח בלי base64)
    const base64Str = a.base64 || null;
    // --- פונקציה: IdeaFormModal ---
    const approxBytes = base64Str ? (base64Str.length * 3) / 4 : 0;
    const MAX_B64 = 1.5 * 1024 * 1024; // ~1.5MB

    return {
        uri: a.uri,
        width: a.width,
        height: a.height,
        type: a.mimeType || 'image/jpeg',
        base64: (base64Str && approxBytes <= MAX_B64) ? base64Str : null,
        size: approxBytes || null,
        fileName: a.fileName || null,
    };
}

function IdeaFormModal({ visible, onClose, lang, isRTL }) {
    const he = lang === 'he';
    const WORKER_URL = 'https://tdjp-feedback.tumblingdifficultyjudgepro.workers.dev';

    const [fullName, setFullName] = React.useState('');
    const [subject, setSubject] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [feedbackType, setFeedbackType] = React.useState(null);
    const [attachments, setAttachments] = React.useState([]);
    const [busy, setBusy] = React.useState(false);
    const [done, setDone] = React.useState(false);
    const [doneType, setDoneType] = React.useState(null);

    const scrollRef = React.useRef(null);
    const refFullName = React.useRef(null);
    const refSubject = React.useRef(null);
    const refMessage = React.useRef(null);

    const requiredOk = !!(fullName.trim() && subject.trim() && message.trim() && feedbackType);

    // בחירת תמונה
    const pickAttachment = async () => {
        if (attachments.length >= 3) {
            Alert.alert(he ? 'מקסימום 3 תמונות' : 'Up to 3 images');
            return;
        }
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(he ? 'אין הרשאה' : 'Permission denied');
                return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.6,
            });
            if (!res.canceled) {
                const img = res.assets[0];
                setAttachments(prev => [...prev, img]);
            }
        } catch (e) {
            Alert.alert('שגיאה', e.message);
        }
    };

    const removeAttachment = (idx) => setAttachments(arr => arr.filter((_, i) => i !== idx));

    const scrollToInput = (ref) => {
        try {
            if (scrollRef.current && ref?.current) {
                scrollRef.current.scrollToFocusedInput(ref.current);
            }
        } catch { }
    };

    // שליחה
    const sendFeedback = async () => {
        if (!requiredOk || busy) return;
        setBusy(true);

        try {
            // שולחים כ-FormData כדי לכלול קבצים אמיתיים
            const formData = new FormData();
            formData.append('type', feedbackType); // מציין אם זה רעיון או באג
            formData.append('fullName', fullName);
            formData.append('subject', subject);
            formData.append('message', message);
            formData.append('lang', lang);
            formData.append('platform', Platform.OS);
            formData.append('ts', Date.now().toString());

            attachments.forEach((a, i) => {
                formData.append(`attachment${i}`, {
                    uri: a.uri,
                    name: a.fileName || `image${i + 1}.jpg`,
                    type: a.mimeType || 'image/jpeg',
                });
            });

            const res = await fetch(WORKER_URL, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('send_failed');

            setFullName('');
            setSubject('');
            setMessage('');
            setAttachments([]);
            setFeedbackType(null);
            setDoneType(feedbackType);
            setDone(true);
        } catch (err) {
            Alert.alert(he ? 'שגיאה בשליחה' : 'Send failed', err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <View style={[styles.modalCard, { alignItems: 'stretch' }]}>
                    <KeyboardAwareScrollView
                        ref={scrollRef}
                        enableOnAndroid
                        extraScrollHeight={20}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: -400, flexGrow: 1 }}

                    >
                        <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
                            {he ? 'שליחת פידבק' : 'Send Feedback'}
                        </Text>

                        {/* סוג הפידבק */}
                        <View style={{ alignItems: 'center', marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    onPress={() => setFeedbackType('idea')}
                                    style={[
                                        styles.pill,
                                        feedbackType === 'idea' && { backgroundColor: palette.primary, borderColor: palette.primary },
                                    ]}
                                >
                                    <Text style={[styles.pillText, feedbackType === 'idea' && { color: '#fff' }]}>
                                        {he ? 'רעיון לשיפור' : 'Feature Idea'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setFeedbackType('bug')}
                                    style={[
                                        styles.pill,
                                        feedbackType === 'bug' && { backgroundColor: palette.primary, borderColor: palette.primary },
                                    ]}
                                >
                                    <Text style={[styles.pillText, feedbackType === 'bug' && { color: '#fff' }]}>
                                        {he ? 'באג לתיקון' : 'Bug to Fix'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* שם מלא */}
                        <Text style={[styles.modalLabel, { textAlign: he ? 'right' : 'left' }]}>
                            {he ? 'שם מלא' : 'Full Name'}
                        </Text>
                        <TextInput
                            ref={refFullName}
                            onFocus={() => scrollToInput(refFullName)}
                            value={fullName}
                            onChangeText={setFullName}
                            style={[styles.tarInputWide, { textAlign: he ? 'right' : 'left' }]}
                        />

                        {/* נושא */}
                        <Text style={[styles.modalLabel, { textAlign: he ? 'right' : 'left' }]}>
                            {he ? 'נושא' : 'Subject'}
                        </Text>
                        <TextInput
                            ref={refSubject}
                            onFocus={() => scrollToInput(refSubject)}
                            value={subject}
                            onChangeText={setSubject}
                            style={[styles.tarInputWide, { textAlign: he ? 'right' : 'left' }]}
                        />

                        {/* תוכן */}
                        <Text style={[styles.modalLabel, { textAlign: he ? 'right' : 'left' }]}>
                            {he ? 'תוכן ההודעה' : 'Message'}
                        </Text>
                        <TextInput
                            ref={refMessage}
                            onFocus={() => scrollToInput(refMessage)}
                            value={message}
                            onChangeText={setMessage}
                            style={[styles.tarInputWide, { minHeight: 110, textAlignVertical: 'top', textAlign: he ? 'right' : 'left' }]}
                            multiline
                        />

                        {/* צרף תמונה */}
                        <View style={{ flexDirection: he ? 'row-reverse' : 'row', marginTop: 10, alignItems: 'center' }}>
                            <TouchableOpacity
                                onPress={pickAttachment}
                                style={[styles.secondaryBtn, { alignSelf: 'flex-start' }]}
                            >
                                <Ionicons name="attach-outline" size={16} color={palette.text} />
                                <Text style={styles.secondaryBtnText}>{he ? 'צרף תמונה' : 'Attach image'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* תמונות ממוזערות */}
                        {attachments.length > 0 && (
                            <View style={{ flexDirection: he ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                {attachments.map((a, i) => (
                                    <View key={`${a.uri}-${i}`} style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden' }}>
                                        <TouchableOpacity
                                            onPress={() => removeAttachment(i)}
                                            style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#0008', borderRadius: 10, zIndex: 2 }}
                                        >
                                            <Text style={{ color: '#fff', paddingHorizontal: 4 }}>×</Text>
                                        </TouchableOpacity>
                                        <RNImage source={{ uri: a.uri }} style={{ width: '100%', height: '100%' }} />
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* כפתורים */}
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10, marginTop: 16 }}>
                            <TouchableOpacity
                                onPress={sendFeedback}
                                disabled={!requiredOk || busy}
                                style={[
                                    styles.primaryBtn,
                                    { flex: 1 },
                                    (!requiredOk || busy) && { opacity: 0.6 },
                                ]}
                            >
                                <Ionicons name="send-outline" size={18} color="#fff" />
                                <Text style={styles.primaryBtnText}>{he ? 'שלח' : 'Send'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={onClose}
                                style={[styles.secondaryBtn, { flex: 1, paddingVertical: 12, justifyContent: 'center' }]}
                            >
                                <Text style={styles.secondaryBtnText}>{he ? 'ביטול' : 'Cancel'}</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAwareScrollView>

                    {/* הודעת תודה */}
                    <Modal visible={done} transparent animationType="fade" onRequestClose={() => setDone(false)}>
                        <View style={styles.modalBackdrop}>
                            <View style={[styles.modalCard, { alignItems: 'center' }]}>
                                {doneType === 'bug' ? (
                                    <>
                                        <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
                                            {he ? 'תודה על הדיווח!' : 'Thanks for the report!'}
                                        </Text>
                                        <Text style={{ textAlign: 'center', marginTop: 6 }}>
                                            {he ? 'ננסה לטפל בזה בהקדם.' : 'We’ll fix it as soon as possible.'}
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
                                            {he ? 'תודה על הרעיון!' : 'Thanks for your idea!'}
                                        </Text>
                                        <Text style={{ textAlign: 'center', marginTop: 6 }}>
                                            {he ? 'נשקול ליישם אותו.' : 'We’ll consider adding it soon.'}
                                        </Text>
                                    </>
                                )}

                                <TouchableOpacity
                                    onPress={() => { setDone(false); setDoneType(null); onClose?.(); }}
                                    style={[styles.secondaryBtn, { marginTop: 12 }]}
                                >
                                    {/* פונקציה: SettingsButton */}
                                    <Text style={styles.secondaryBtnText}>{he ? 'סגור' : 'Close'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>
            </View>
        </Modal>
    );
}





// ---------- Header (+ Settings) ----------
function SettingsButton() {
    const { t, isRTL, volume, setVolume, lang, setLang, allowIllegalExport, setAllowIllegalExport } = usePrefs();
    const [open, setOpen] = useState(false);
    const [tariffDir, setTariffDir] = useState(null);
    const navigation = useNavigation();
    const [ideaOpen, setIdeaOpen] = useState(false);

    // מציג מיקום תיקייה קריא יחסית מ-URI של SAF
    const prettySafPath = React.useCallback((uri) => {
        try {
            if (!uri) return '';
            const dec = decodeURIComponent(uri);
            const marker = '/tree/';
            const i = dec.indexOf(marker);
            if (i >= 0) {
                let path = dec.slice(i + marker.length);
                path = path.replace(/^primary:/, 'Internal storage/');
                return path;
            }
            return dec;
        } catch {
            return uri || '';
        }
    }, []);

    // 🔄 רענון הערך מה־cache (משתמש בקוד הקיים שלך getCachedTariffDirUri)
    const refreshTariffDir = React.useCallback(async () => {
        try {
            const cached = await getCachedTariffDirUri();
            if (cached) setTariffDir(cached);
            else setTariffDir(null);
        } catch {
            // ignore
        }
    }, []);

    // טען ערך התחלתי (בטעינת הכפתור)
    useEffect(() => {
        (async () => { await refreshTariffDir(); })();
    }, [refreshTariffDir]);

    // ⚡ חשוב: בכל פתיחת מודאל ההגדרות—רענון כדי לשקף בחירה שנעשתה במסכים אחרים (למשל ייצוא ראשון)
    useEffect(() => {
        if (open) { refreshTariffDir(); }
    }, [open, refreshTariffDir]);

    const changeVol = (d) => setVolume(v => Math.max(0, Math.min(10, v + d)));

    const chooseTariffFolder = async () => {
        if (Platform.OS !== 'android') {
            Alert.alert(
                lang === 'he' ? 'לא נתמך' : 'Not supported',
                lang === 'he' ? 'בחירת תיקייה נתמכת רק באנדרואיד.' : 'Folder picking is Android-only.'
            );
            return;
        }
        // בחירה מחדש (הפונקציה שלך). אחרי בחירה—גם מציגים מייד וגם מנסים לרענן מה־cache.
        const uri = await pickTariffDirAgain();
        if (uri) {
            setTariffDir(uri);                 // עדכון מיידי ל-UI
            try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { }
            try { await refreshTariffDir(); } catch { } // ואם הפונקציה גם מקשֶת בפנים—נציג את הערך מה־cache
        }
    };

    const hasDir = !!tariffDir;
    const dirLabel = hasDir ? prettySafPath(tariffDir) : (lang === 'he' ? 'לא נבחרה תיקייה' : 'Not set');

    return (
        <>
            {/* פתיחת הגדרות: מרענן לפני פתיחה כדי לשקף בחירה קודמת שנעשתה במסכים אחרים */}
            <TouchableOpacity
                onPress={async () => { await refreshTariffDir(); setOpen(true); }}
                style={styles.settingsBtn}
                accessibilityLabel={t('common.settings')}
                activeOpacity={0.7}
            >
                <Ionicons name="settings-outline" size={18} color={palette.text} />
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.modalTitle, { alignSelf: 'stretch', textAlign: 'center' }]}>{t('common.settings')}</Text>

                        {/* Volume */}
                        <Text style={styles.modalLabel}>
                            {lang === 'he' ? `עוצמת שמע (${volume}/10)` : `Sound volume (${volume}/10)`}
                        </Text>
                        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity style={styles.secondaryBtn} onPress={() => changeVol(-1)} activeOpacity={0.7}>
                                <Ionicons name="remove" size={16} color={palette.text} />
                            </TouchableOpacity>
                            <View style={{ width: 12 }} />
                            <TouchableOpacity style={styles.secondaryBtn} onPress={() => changeVol(+1)} activeOpacity={0.7}>
                                <Ionicons name="add" size={16} color={palette.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Tariff folder (Android) */}
                        <Text style={[styles.modalLabel, { marginTop: 14 }]}>
                            {lang === 'he' ? 'מיקום דפי טריף' : 'Tariff sheets location'}
                        </Text>
                        <View
                            style={[
                                styles.row,
                                {
                                    flexDirection: isRTL ? 'row-reverse' : 'row',
                                    alignSelf: 'stretch',
                                    alignItems: 'center',
                                    gap: 10,
                                },
                            ]}
                        >
                            <TouchableOpacity onPress={chooseTariffFolder} style={styles.secondaryBtn} activeOpacity={0.7}>
                                <Ionicons name="folder-outline" size={16} color={palette.text} />
                                <Text style={styles.secondaryBtnText}>
                                    {lang === 'he' ? (hasDir ? 'שינוי מיקום' : 'בחר תיקייה') : (hasDir ? 'Change location' : 'Choose folder')}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.dirBox}>
                                <Text
                                    style={[styles.dirText, { textAlign: isRTL ? 'right' : 'left' }]}
                                    numberOfLines={2}
                                    ellipsizeMode="middle"
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.9}
                                >
                                    {dirLabel}
                                </Text>
                            </View>
                        </View>

                        {/* ⬇️ הועבר מתחת ל"מיקום דפי טריף" */}
                        <TouchableOpacity
                            onPress={() => setAllowIllegalExport(v => !v)}
                            style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10 }]}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={allowIllegalExport ? 'checkbox-outline' : 'square-outline'}
                                size={20}
                                color={allowIllegalExport ? palette.primary : palette.muted}
                            />
                            <Text style={{ color: palette.text, fontSize: 14, fontWeight: '700' }}>
                                {lang === 'he'
                                    ? 'אפשר הדפסת טריף לפסים לא חוקיים'
                                    : 'Allow exporting tariff with illegal passes'}
                            </Text>
                        </TouchableOpacity>

                        {/* Language */}
                        <Text style={[styles.modalLabel, { marginTop: 14 }]}>{lang === 'he' ? 'שפה' : 'Language'}</Text>
                        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity
                                onPress={() => setLang('he')}
                                style={[styles.pill, lang === 'he' && { backgroundColor: palette.primary }]}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.pillText, lang === 'he' && { color: '#fff' }]}>{lang === 'he' ? 'עברית' : 'Hebrew'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setLang('en')}
                                style={[styles.pill, lang === 'en' && { backgroundColor: palette.primary }]}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.pillText, lang === 'en' && { color: '#fff' }]}>{lang === 'he' ? 'אנגלית' : 'English'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Send Idea */}
                        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity onPress={() => setIdeaOpen(true)} style={styles.secondaryBtn} activeOpacity={0.7}>
                                <Ionicons name="bulb-outline" size={16} color={palette.text} />
                                <Text style={styles.secondaryBtnText}>
                                    {lang === 'he' ? 'הצע רעיון/דווח על באג' : 'Suggest an idea/report a bug'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => setOpen(false)} style={[styles.primaryBtn, { alignSelf: 'stretch', marginTop: 16 }]} activeOpacity={0.8}>
                            <Text style={styles.primaryBtnText}>{lang === 'he' ? 'סגור' : 'Close'}</Text>
                        </TouchableOpacity>

                        {/* App Logs */}
                        {ENABLE_LOGS && (
                            <>
                                <Text style={[styles.modalLabel, { marginTop: 14 }]}>
                                    {lang === 'he' ? 'יומן מערכת' : 'App logs'}
                                </Text>
                                <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <TouchableOpacity
                                        onPress={() => { setOpen(false); navigation.navigate('Logs'); }}
                                        style={styles.secondaryBtn}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="bug-outline" size={16} color={palette.text} />
                                        <Text style={styles.secondaryBtnText}>
                                            {lang === 'he' ? 'פתח לוגים' : 'Open logs'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                        {/* פונקציה: ProfileButton */}
                    </View>
                </View>
            </Modal>

            <IdeaFormModal
                visible={ideaOpen}
                onClose={() => setIdeaOpen(false)}
                lang={lang}
                isRTL={isRTL}
            />
        </>
    );
}

// ---------- Profile Button (round like Settings) ----------
function ProfileButton() {
    const navigation = useNavigation();
    const { isRTL } = usePrefs();

    return (
        <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
            style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: palette.card,
                borderWidth: 1, borderColor: palette.border,
                alignItems: 'center', justifyContent: 'center'
            }}
            // --- פונקציה: StartHeaderButtons ---
            accessibilityLabel={isRTL ? 'פרופיל' : 'Profile'}
        >
            {/* אייקון ראש "רגיל" בתוך עיגול – כמו ההגדרות */}
            <Ionicons name="person-outline" size={18} color={palette.text} />
        </TouchableOpacity>
    );
}


// עטיפה שממקמת את הפרופיל משמאל להגדרות בעברית
// עטיפת כפתורי ההדר — פרופיל בקצה, הגדרות לצידו
function StartHeaderButtons() {
    const { isRTL } = usePrefs();

    // סדר חדש: קודם פרופיל ואז הגדרות
    // --- פונקציה: Header ---
    // flexDirection משתנה לפי RTL כדי שהילד הראשון יישב בקצה
    return (
        <View
            style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <ProfileButton />
            <SettingsButton />
        </View>
    );
}



function Header({ title, start, end }) {
    const insets = useSafeAreaInsets();
    const { isRTL } = usePrefs();
    const padTop = Math.max(12, insets.top + 8);
    return (
        <View style={[styles.header, { paddingTop: padTop }]}>
            <Text style={styles.headerTitle}>{title}</Text>

            {/* start-edge (RTL: right, LTR: left) */}
            {/* פונקציה: ProgressProvider */}
            <View style={[styles.headerPinnedEdge, isRTL ? { right: 12, top: padTop + 2 } : { left: 12, top: padTop + 2 }]}>
                {start}
            </View>
            {/* end-edge (RTL: left, LTR: right) */}
            <View style={[styles.headerPinnedEdge, isRTL ? { left: 12, top: padTop + 2 } : { right: 12, top: padTop + 2 }]}>
                {end}
            </View>
        </View>
    );
}

// ---------- Provider ----------
function ProgressProvider({ children }) {
    const { volume, t } = usePrefs();

    const [progress, setProgress] = useState(null);
    const [repMode, setRepMode] = useState('names'); // 'names' | 'symbols'

    useEffect(() => { (async () => setProgress(await loadProgress()))(); }, []);
    useEffect(() => { if (progress) saveProgress(progress); }, [progress]);

    const bump = async (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setProgress(p => { const n = { ...(p || defaultProgress()) }; if (!n[id]) n[id] = { correct: 0, wrong: 0 }; n[id].correct += 1; return { ...n }; });
        playSound('success', volume / 10);
    };
    const drop = async (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setProgress(p => { const n = { ...(p || defaultProgress()) }; if (!n[id]) n[id] = { correct: 0, wrong: 0 }; n[id].wrong += 1; return { ...n }; });
        playSound('fail', volume / 10);
    };
    const record = async (id, ok) => ok ? bump(id) : drop(id);
    const reset = async () => setProgress(defaultProgress());
    const toggleRepMode = () => setRepMode(m => m === 'names' ? 'symbols' : 'names');

    if (!progress) {
        // --- פונקציה: FlipCard ---
        return <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.headerTitle}>{t('common.loading')}</Text>
        </SafeAreaView>;
    }
    return <ProgressCtx.Provider value={{ progress, bump, drop, record, reset, repMode, toggleRepMode }}>{children}</ProgressCtx.Provider>;
}

// ---------- Flashcards ----------
function FlipCard({ title, value, onIKnow, onIDontKnow }) {
    const flipAnim = useRef(new Animated.Value(0)).current;
    const [flipped, setFlipped] = useState(false);

    const front = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
    const back = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

    const flip = () =>
        Animated.timing(flipAnim, {
            toValue: flipped ? 0 : 180,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => setFlipped(!flipped));

    return (
        <View style={styles.cardWrap}>
            <TouchableOpacity activeOpacity={0.95} onPress={flip}>
                <View>
                    {/* FRONT */}
                    <Animated.View
                        pointerEvents={flipped ? 'none' : 'auto'} // כשלא הפוך – רק הפרונט מקבל מגע
                        style={[
                            styles.card,
                            styles.cardSide,
                            {
                                transform: [{ rotateY: front }],
                                backfaceVisibility: 'hidden',
                                backgroundColor: palette.card,
                            },
                        ]}
                    >
                        <Text style={styles.cardFrontText} adjustsFontSizeToFit numberOfLines={2}>
                            {title}
                        </Text>
                    </Animated.View>

                    {/* BACK */}
                    <Animated.View
                        pointerEvents={flipped ? 'auto' : 'none'} // כשהכרטיס הפוך – רק הבאק מקבל מגע
                        style={[
                            styles.card,
                            styles.cardSide,
                            {
                                transform: [{ rotateY: back }],
                                backfaceVisibility: 'hidden',
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: palette.card,
                            },
                        ]}
                    >
                        <Text style={styles.valueText}>{formatVal(value)}</Text>

                        <View style={styles.inlineActions}>
                            <TouchableOpacity
                                disabled={!flipped} // לא ניתן ללחוץ כשהכרטיס לא הפוך
                                onPress={onIDontKnow}
                                style={[styles.iconBtn, styles.iconBtnWrong, !flipped && { opacity: 0.5 }]}
                            >
                                <Ionicons name="close" size={22} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                disabled={!flipped} // לא ניתן ללחוץ כשהכרטיס לא הפוך
                                onPress={onIKnow}
                                // --- פונקציה: RepToggle ---
                                style={[styles.iconBtn, styles.iconBtnRight, !flipped && { opacity: 0.5 }]}
                            >
                                <Ionicons name="checkmark" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </TouchableOpacity>
        </View>
    );
}
// --- פונקציה: AdminUsersScreen ---
function RepToggle({ repMode, toggleRepMode }) {
    const { t } = usePrefs();
    return (
        <TouchableOpacity onPress={toggleRepMode} style={styles.modeToggle} accessibilityLabel={t('a11y.toggleRep')}>
            <Ionicons name={repMode === 'symbols' ? 'code-slash-outline' : 'reader-outline'} size={18} color={palette.text} />
        </TouchableOpacity>
    );
}

function AdminUsersScreen({ navigation }) {
    const { lang } = usePrefs();
    const he = lang === 'he';

    // מצב
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [offset, setOffset] = React.useState(0);
    const [hasMore, setHasMore] = React.useState(true);

    // הגנות נגד ריבוי בקשות
    const limit = 50;
    const lastFetchAt = React.useRef(0);

    const load = React.useCallback(async (reset = false) => {
        if (loading) return;
        const now = Date.now();
        if (now - lastFetchAt.current < 800) return; // מניעת רצף מהיר
        lastFetchAt.current = now;

        try {
            setLoading(true);
            const o = reset ? 0 : offset;
            const data = await apiListUsers({ limit, offset: o });
            const batch = data?.rows || [];

            if (reset) {
                setRows(batch);
                setOffset(batch.length);
            } else {
                setRows(prev => [...prev, ...batch]);
                setOffset(o + batch.length);
            }
            setHasMore(batch.length === limit);
        } catch (e) {
            const msg = (e?.message || '').toString();
            if (msg.includes('429')) {
                Alert.alert(he ? 'שגיאה' : 'Error', he ? 'עודף בקשות (Rate limit). נסה/י שוב בעוד רגע.' : 'Too many requests. Try again shortly.');
            } else {
                Alert.alert(he ? 'שגיאה' : 'Error', msg || (he ? 'טעינת משתמשים נכשלה' : 'Load failed'));
            }
        } finally {
            setLoading(false);
        }
    }, [loading, offset, limit, he]);

    useAppRefreshListener(() => {
        load(true);            // מרענן את הרשימה אוטומטית
    });

    // טעינה ראשונית
    React.useEffect(() => { load(true); }, []);

    // רענון אוטומטי בכל פעם שהמסך מקבל פוקוס (כשחוזרים מעריכת משתמש/מחיקה)
    React.useEffect(() => {
        const unsub = navigation.addListener('focus', () => load(true));
        return unsub;
    }, [navigation, load]);

    const goToUser = (id) => {
        // נכנסים למסך ההרשמה הקיים כשהוא מאוכלס בפרטי המשתמש (הטעינה נעשית בפנים)
        navigation.navigate('Register', { mode: 'adminViewUser', userId: id });
    };

    const renderItem = ({ item }) => {
        const full = [item.first_name, item.last_name].filter(Boolean).join(' ') || (item.fullName || '');
        return (
            <TouchableOpacity
                onPress={() => goToUser(item.id)}
                style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: palette.border, backgroundColor: palette.card }}
                activeOpacity={0.8}
            >
                <Text style={{ color: palette.text, fontWeight: '700' }}>{full}</Text>
                <Text style={{ color: palette.muted }}>{item.email}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.screen }}>
            <Header title={he ? 'ניהול משתמשים' : 'Manage Users'} />
            <FlatList
                data={rows}
                keyExtractor={(it) => String(it.id)}
                renderItem={renderItem}
                onEndReachedThreshold={0.2}
                onEndReached={() => { if (!loading && hasMore) load(false); }}
                ListFooterComponent={
                    loading
                        ? <Text style={{ textAlign: 'center', color: palette.muted, padding: 12 }}>...</Text>
                        : !hasMore && rows.length > 0
                            ? <Text style={{ textAlign: 'center', color: palette.muted, padding: 12 }}>{he ? 'הגעת לסוף' : 'No more users'}</Text>
                            : null
                }
                refreshing={loading}
                onRefresh={() => load(true)}
            />
        </SafeAreaView>
    );
}



// ---------- Profile Screen ----------

function ProfileScreen() { /*LOG:ProfileScreen*/
    const { lang, isRTL } = usePrefs();
    const navigation = useNavigation();
    const he = lang === 'he';
    const pageDir = isRTL ? 'rtl' : 'ltr';
    const isFocused = useIsFocused();

    const [refreshing, setRefreshing] = React.useState(false);

    // מצב התחברות אמיתי + רענון עצמי
    const { user, logout, refreshMe, userVersion } = useAuth?.() || { user: null, logout: async () => { }, refreshMe: null };
    const loggedIn = !!user;

    const onPullToRefresh = React.useCallback(async () => {
        try {
            setRefreshing(true);
            // מרענן נתוני משתמש מתוך ה-AuthContext (כבר קיים אצלך)
            await refreshMe?.();
        } catch (e) {
            // שקט
        } finally {
            setRefreshing(false);
        }
    }, [refreshMe]);

    const avatarSrc = user?.avatarUrl
        ? `${user.avatarUrl}${user.avatarUrl.includes('?') ? '&' : '?'}v=${userVersion}`
        : (user?.avatar_url
            ? `${user.avatar_url}${String(user.avatar_url).includes('?') ? '&' : '?'}v=${userVersion}`
            : null);

    // רענון אוטומטי כשחוזרים למסך (כדי שפרטים יתעדכנו מיד לאחר שמירה)
    React.useEffect(() => {
        if (isFocused) {
            try { refreshMe?.(); } catch (_) { }
        }
    }, [isFocused, refreshMe]);

    // פרופיל מתעדכן כשמגיע אירוע גלובלי (וגם מקונטקסט המשתמש שכבר עודכן ב-refreshMe)
    useAppRefreshListener(() => {
        try { refreshMe?.(); } catch { }
    });

    // תצוגת שם
    const displayName = React.useMemo(() => {
        if (!loggedIn) return he ? 'אורח' : 'Guest';
        const first = user?.first_name ?? user?.firstName;
        const last = user?.last_name ?? user?.lastName;
        const pair = [first, last].filter(Boolean).join(' ').trim();
        if (pair) return pair;
        const full = user?.fullName ?? user?.full_name;
        return (full || (he ? 'משתמש' : 'User')).trim();
    }, [loggedIn, user, he]);

    // Handlers
    const handleGoBack = React.useCallback(() => navigation.navigate('Tabs'), [navigation]);
    const handleSignIn = () => navigation.navigate('Auth', { mode: 'login' });
    const handleSignUp = () => navigation.navigate('Register');

    // עריכת עצמי – פותח את אותו מסך הרשמה במצב selfEdit
    const handleEdit = () => navigation.navigate('Register', { selfEdit: true });
    const handleProgress = () => navigation.navigate('MyProgress');
    const handleLogout = async () => {
        try { await logout?.(); } catch { }
        navigation.replace('Profile'); // חוזר למסך אורח
    };

    // כפתור חזרה עגול
    const BackButton = React.useCallback(
        () => (
            <TouchableOpacity
                onPress={handleGoBack}
                activeOpacity={0.85}
                style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: palette.card,
                    borderWidth: 1, borderColor: palette.border,
                    alignItems: 'center', justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel={he ? 'חזרה' : 'Back'}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
                <Ionicons
                    name={isRTL ? 'chevron-forward' : 'chevron-back'}
                    size={22}
                    color={palette.text}
                />
            </TouchableOpacity>
        ),
        [handleGoBack, he, isRTL]
    );

    // סדר כפתורי ההדר: הגדרות + חזרה
    const HeaderStartOnProfile = React.useCallback(
        () => (
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                <SettingsButton />
                <BackButton />
            </View>
        ),
        [isRTL, BackButton]
    );

    return (
        <SafeAreaView
            style={[styles.screen, { flex: 1, backgroundColor: palette.screen, direction: pageDir }]}
            edges={['top']}
        >
            <Header title={he ? 'פרופיל' : 'Profile'} start={<HeaderStartOnProfile />} />

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 24, alignItems: 'center', gap: 12, direction: pageDir }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={(
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onPullToRefresh}
                        progressViewOffset={0}
                        tintColor={palette.text}
                        colors={[palette.text]}
                    />
                )}
            >
                {/* תמונת פרופיל */}
                <View style={{ width: 104, height: 104, borderRadius: 52, overflow: 'hidden', borderWidth: 2, borderColor: palette.border }}>
                    {loggedIn && (avatarSrc) ? (
                        // שימוש אמיתי במחרוזת עם v=userVersion + key כדי לעקוף קאש ולכפות רנדר
                        <ImageComponent key={userVersion} uri={avatarSrc} />
                    ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card }}>
                            <Ionicons name="person-outline" size={44} color={palette.muted} />
                        </View>
                    )}
                </View>

                {/* שם */}
                <Text style={{ color: palette.text, fontSize: 20, fontWeight: '900', marginTop: 8 }}>
                    {displayName}
                </Text>

                {/* מצב אורח */}
                {!loggedIn && (
                    <View style={{ marginTop: 14, alignSelf: 'stretch', alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={handleSignIn}
                            activeOpacity={0.9}
                            style={{
                                alignSelf: 'stretch',
                                marginHorizontal: 4,
                                paddingVertical: 14,
                                borderRadius: 14,
                                backgroundColor: '#7c3aed',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
                                flexDirection: 'row', gap: 8,
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={he ? 'התחברות' : 'Sign in'}
                        >
                            <Ionicons name="log-in-outline" size={18} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
                                {he ? 'התחברות' : 'Sign in'}
                            </Text>
                        </TouchableOpacity>

                        <View style={{ alignSelf: 'stretch', paddingTop: 8, paddingHorizontal: 16 }}>
                            <Text style={{ fontSize: 13, color: palette.muted, textAlign: 'center', flexWrap: 'wrap', writingDirection: isRTL ? 'rtl' : 'ltr' }}>
                                {he ? 'עוד אין לך חשבון? ' : "Don't have an account? "}
                                <Text
                                    onPress={handleSignUp}
                                    accessibilityRole="link"
                                    accessibilityLabel={he ? 'הירשם כאן' : 'Sign up'}
                                    style={{ color: '#6b21a8', textDecorationLine: 'underline', fontWeight: '700' }}
                                >
                                    {he ? 'הירשם כאן' : 'Sign up'}
                                </Text>
                                {he ? '\u200F' : ''}
                            </Text>
                        </View>
                    </View>
                )}

                {/* מצב מחובר */}
                {loggedIn && (
                    <View style={{ marginTop: 14, alignSelf: 'stretch', gap: 10 }}>
                        <TouchableOpacity
                            onPress={handleEdit}
                            activeOpacity={0.9}
                            style={[styles.primaryBtn, { alignSelf: 'stretch', backgroundColor: '#7c3aed' }]}
                            accessibilityRole="button"
                            accessibilityLabel={he ? 'עריכת פרטים' : 'Edit details'}
                        >
                            <Ionicons name="pencil-outline" size={18} color="#fff" />
                            <Text style={styles.primaryBtnText}>{he ? 'עריכת פרטים' : 'Edit details'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleProgress}
                            activeOpacity={0.9}
                            style={[styles.secondaryBtn, { alignSelf: 'stretch', borderColor: palette.border }]}
                            accessibilityRole="button"
                            accessibilityLabel={he ? 'ההתקדמות שלי' : 'My Progress'}
                        >
                            <Ionicons name="bar-chart-outline" size={18} color={palette.text} />
                            <Text style={styles.secondaryBtnText}>{he ? 'ההתקדמות שלי' : 'My Progress'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleLogout}
                            activeOpacity={0.9}
                            style={[styles.secondaryBtn, { alignSelf: 'stretch', borderColor: '#dc2626' }]}
                            accessibilityRole="button"
                            accessibilityLabel={he ? 'התנתק' : 'Log out'}
                        >
                            <Ionicons name="exit-outline" size={18} color="#dc2626" />
                            <Text style={[styles.secondaryBtnText, { color: '#dc2626', fontWeight: '700' }]}>
                                {he ? 'התנתק' : 'Log out'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}



// ---------- Register (user or admin-view) ----------
function RegisterFullScreen({ navigation, route }) {

    const justSavedRef = React.useRef(false);
    const __logOnceRef = React.useRef(false);
    if (__DEV__ && !__logOnceRef.current) { console.log('RegisterFullScreen route.params =', route?.params); __logOnceRef.current = true; }
    const { lang, isRTL } = usePrefs();
    const he = lang === 'he';
    const insets = useSafeAreaInsets();
    const { user, refreshMe, userVersion } = useAuth(); // 👈 הוסף userVersion
    const selfEdit = !!route?.params?.selfEdit;
    const [refreshing, setRefreshing] = React.useState(false);

    const onPullToRefresh = React.useCallback(async () => {
        try {
            setRefreshing(true);
            await refreshMe?.(); // טען מחדש מהשרת/קונטקסט
        } catch (e) {
        } finally {
            setRefreshing(false);
        }
    }, [refreshMe]);

    // חשוב: רענון אמין כשחוזרים למסך
    const isFocused = useIsFocused();

    // --- זיהוי מצב אדמין (צפייה/עריכה בפרטי משתמש קיים) ---
    const userId = route?.params?.userId || null;
    const adminView = !!userId;
    const [editMode, setEditMode] = React.useState(selfEdit ? false : !adminView);
    const readOnly = (adminView || selfEdit) && !editMode;

    // --- גלילה + מדידת מיקום בלוק סיסמה (נשאר לצורך scroll בלבד) + גובה מקלדת ---
    const scrollRef = React.useRef(null);
    const passwordBlockY = React.useRef(0);
    const [kbHeight, setKbHeight] = React.useState(0);

    React.useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e?.endCoordinates?.height ?? 0));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
        return () => { showSub?.remove?.(); hideSub?.remove?.(); };
    }, []);

    const scrollPasswordIntoView = React.useCallback(() => {
        requestAnimationFrame(() => {
            const y = Math.max(0, passwordBlockY.current - 100);
            scrollRef.current?.scrollTo?.({ y, animated: true });
        });
    }, []);

    // --- Toast קטן מעוצב לאישורי פעולה ---
    const [toast, setToast] = React.useState(null); // { text: '...', kind: 'ok'|'warn'|'err' }
    const showToast = React.useCallback((text, kind = 'ok') => {
        setToast({ text, kind });
        setTimeout(() => setToast(null), 1800);
    }, []);

    // --- Modal אישור מחיקה מעוצב ---
    const [confirmOpen, setConfirmOpen] = React.useState(false);

    // תמונת פרופיל
    const [avatarUrl, setAvatarUrl] = React.useState('');
    const [imageMenuOpen, setImageMenuOpen] = React.useState(false);

    // 👇 תצוגת אווטאר: מוסיף ?v= רק ל-HTTP/S כדי לא לשבור file://
    const previewSrc = React.useMemo(() => {
        if (!avatarUrl) return '';
        const isHttp = /^https?:\/\//i.test(String(avatarUrl));
        if (!isHttp) return avatarUrl;
        return `${avatarUrl}${String(avatarUrl).includes('?') ? '&' : '?'}v=${userVersion}`;
    }, [avatarUrl, userVersion]);

    // בסיס
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');

    // מדינה + טלפון
    const [country, setCountry] = React.useState('');
    const dial = React.useMemo(() => {
        const c = COUNTRIES.find(x => x.value === country);
        return c?.dial || '';
    }, [country]);
    const [localPhone, setLocalPhone] = React.useState('');

    // אימייל
    const [email, setEmail] = React.useState('');

    // מאמן/שופט
    const [isCoach, setIsCoach] = React.useState(false);
    const [isJudge, setIsJudge] = React.useState(false);
    const [club, setClub] = React.useState('');

    const [judgeLevel, setJudgeLevel] = React.useState('');
    const [brevetLevel, setBrevetLevel] = React.useState('1');
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState('');

    // מצב פתיחה של תפריטים (overlay)
    const [countryOpen, setCountryOpen] = React.useState(false);
    const [clubOpen, setClubOpen] = React.useState(false);
    const [judgeOpen, setJudgeOpen] = React.useState(false);

    // דגל לנטרול גלילת העמוד כשגוללים בתוך רשימה
    const [listScrolling, setListScrolling] = React.useState(false);

    // --- Ready כדי להציג את כל הטופס רק אחרי טעינה באדמין ---
    const [ready, setReady] = React.useState(!adminView);

    // ---------- עזרים ----------
    const parseCountryParts = (label) => {
        const m = /^([\p{Extended_Pictographic}\p{Regional_Indicator}]+)\s*(.+)$/u.exec(label || '');
        if (m) return { flag: m[1], name: m[2] };
        return { flag: '', name: label || '' };
    };

    function countryValueFromLabel(labelOrValue) {
        if (!labelOrValue) return '';
        const hit = COUNTRIES.find(
            c => c.value === labelOrValue || (c.label && c.label.includes(labelOrValue))
        );
        return hit?.value || '';
    }

    function setPhonePartsFromServer(serverPhone) {
        const m = /^\s*\+\d+\s*(.+)$/.exec(serverPhone || '');
        if (m) setLocalPhone(m[1].trim());
        else setLocalPhone((serverPhone || '').trim());
    }

    // פתיחה בלעדית של תפריטים (חסום כש-readonly)
    const openOnly = (key) => {
        if (readOnly) return;
        setCountryOpen(key === 'country');
        setClubOpen(key === 'club');
        setJudgeOpen(key === 'judge');
    };

    // בחירת תמונה (חסום כש-readonly)
    const onPickCamera = async () => {
        if (readOnly) return;
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') return Alert.alert('שגיאה', 'אין הרשאת מצלמה');
            const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
            if (!res.canceled && res.assets?.[0]?.uri) setAvatarUrl(res.assets[0].uri);
        } finally { setImageMenuOpen(false); }
    };
    const onPickGallery = async () => {
        if (readOnly) return;
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return Alert.alert('שגיאה', 'אין הרשאת גלריה');
            const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
            if (!res.canceled && res.assets?.[0]?.uri) setAvatarUrl(res.assets[0].uri);
        } finally { setImageMenuOpen(false); }
    };
    const onRemoveImage = () => { if (!readOnly) { setAvatarUrl(''); setImageMenuOpen(false); } };

    // ולידציה (ללא סיסמה)
    const validate = () => {
        if (!firstName.trim() || !lastName.trim()) return 'נא למלא שם פרטי ושם משפחה';
        if (!/^\S+@\S+\.\S+$/.test(email)) return 'כתובת מייל לא תקינה';
        if (!localPhone.trim()) return 'נא למלא מספר טלפון';
        if (isCoach && !CLUBS.includes(club)) return 'נא לבחור אגודה מהרשימה';
        if (isJudge) {
            if (!JUDGE_LEVELS.includes(judgeLevel)) return 'דרגת שיפוט לא חוקית';
            if (judgeLevel === 'בינלאומי' && !['1', '2', '3', '4'].includes(String(brevetLevel))) return 'נא לבחור דרגת ברווה (1–4)';
        }
        return null;
    };

    // --- טעינת משתמש באדמין ---
    const loadUser = React.useCallback(async () => {
        if (!adminView) return;
        setBusy(true);
        try {
            const res = await apiGetUser(userId);
            let u = res?.user || res?.item || (Array.isArray(res?.items) ? res.items.find(x => x.id === userId) : res);
            if (!u && Array.isArray(res?.items) && res.items.length) u = res.items[0];
            if (!u) throw new Error('User not found');

            setFirstName(u.first_name ?? u.firstName ?? (u.full_name ?? u.fullName ?? '').split(/\s+/)[0] ?? '');
            setLastName(
                u.last_name ??
                u.lastName ??
                ((u.full_name ?? u.fullName ?? '').trim().split(/\s+/).slice(1).join(' '))
            );
            setEmail(u.email || '');
            setPhonePartsFromServer(u.phone || '');
            setCountry(countryValueFromLabel(u.country || ''));
            setClub(u.club || '');
            setIsCoach(!!(u.is_coach ?? u.isCoach));
            setIsJudge(!!(u.is_judge ?? u.isJudge));
            setJudgeLevel(u.judge_level ?? u.judgeLevel ?? '');
            setBrevetLevel(String(u.brevet_level ?? u.brevetLevel ?? '1'));
            setAvatarUrl(u.avatar_url ?? u.avatarUrl ?? '');
            setReady(true);
        } catch (e) {
            console.log('apiGetUser error:', e);
            Alert.alert('שגיאה', e?.message || 'Load failed');
        } finally {
            setBusy(false);
        }
    }, [adminView, userId]);

    // --- סנכרון שדות מה־/me (selfEdit) למסך ---
    const syncFromMe = React.useCallback(() => {
        if (!selfEdit || !user) return;
        const full = String(user.fullName ?? user.full_name ?? '').trim();
        const fnFromSplit = full.split(/\s+/)[0] || '';
        const lnFromSplit = full.split(/\s+/).slice(1).join(' ') || '';

        const fn = user.first_name ?? user.firstName ?? fnFromSplit;
        const ln = user.last_name ?? user.lastName ?? lnFromSplit;

        setFirstName(fn);
        setLastName(ln);
        setEmail(user.email || '');
        setCountry(user.country || 'ישראל');
        setLocalPhone(user.phone ? user.phone.replace(/^\+\d+\s?/, '') : '');
        setClub(user.club || '');
        setIsCoach(!!(user.isCoach ?? user.is_coach));
        setIsJudge(!!(user.isJudge ?? user.is_judge));
        setJudgeLevel(user.judgeLevel ?? user.judge_level ?? '');
        setBrevetLevel(String(user.brevetLevel ?? user.brevet_level ?? '1'));
        setAvatarUrl(user.avatarUrl ?? user.avatar_url ?? '');
    }, [selfEdit, user]);

    // --- טעינה ראשונית ---
    const loadOnceRef = React.useRef(false);
    React.useEffect(() => {
        if (loadOnceRef.current) return;
        loadOnceRef.current = true;
        if (adminView) loadUser();
        if (selfEdit && !justSavedRef.current) syncFromMe();
    }, [adminView, selfEdit, loadUser, syncFromMe]);

    // --- רענון אמין כשחוזרים לפוקוס (וחזרו ממסך אחר) ---
    React.useEffect(() => {
        if (!isFocused) return;
        if (adminView) {
            // באדמין תמיד למשוך מהשרת מחדש
            loadUser();
        } else if (selfEdit) {
            // ב-selfEdit קודם לעדכן /me ואז לשפוך לשדות
            (async () => {
                try { if (!justSavedRef.current) { await refreshMe?.(); } } catch { }
                if (!justSavedRef.current) syncFromMe();
            })();
        }
    }, [isFocused, adminView, selfEdit, loadUser, refreshMe, syncFromMe]);

    // --- שליחה ברישום רגיל (ללא אדמין/ללא selfEdit) ---
    // שים לב: סיסמה קיימת רק ברישום (השארנו כאן רק לשם התאימות שלך; בעריכה אין סיסמה בכלל)
    const [password, setPassword] = React.useState('');
    const [showPwd, setShowPwd] = React.useState(false);

    const onSubmit = async () => {
        setError('');
        const err = validate();
        if (err) { setError(err); return; }
        try {
            setBusy(true);
            const phone = `${dial} ${localPhone.replace(/^\s+/, '')}`;
            await apiRegisterFull({
                email, password, firstName, lastName,
                phone, country, isCoach, club: isCoach ? club : null,
                isJudge, judgeLevel: isJudge ? judgeLevel : null,
                brevetLevel: isJudge && judgeLevel === 'בינלאומי' ? brevetLevel : null,
                avatarUrl: avatarUrl || null,
            });
            // רענון גלובלי חיוני: פרופיל, כותרות, וכו'
            try { await refreshMe?.(); } catch { }
            showToast('נרשמת בהצלחה', 'ok');
            navigation.navigate('Profile', { __refresh: Date.now() });
        } catch (e) {
            setError(e?.message || 'שגיאת שרת');
        } finally {
            setBusy(false);
        }
    };

    // --- שמירת שינויים באדמין ---
    const onAdminSave = React.useCallback(async () => { /*LOG:onAdminSave*/
        _log('onAdminSave:start');
        setError('');
        const err = validate();
        if (err) { setError(err); return; }
        try {
            setBusy(true);
            const phone = `${dial} ${localPhone.replace(/^\s+/, '')}`;
            const payload = {
                first_name: firstName?.trim(),
                last_name: lastName?.trim(),
                email: email?.trim(),
                phone,
                country,
                isCoach,
                club: isCoach ? club : null,
                isJudge,
                judgeLevel: isJudge ? judgeLevel : null,
                brevetLevel: isJudge && judgeLevel === 'בינלאומי' ? brevetLevel : null,
                avatarUrl: avatarUrl || null,
            };
            _log('onSelfSave:payload', payload);
            const __adminUpdated = await apiUpdateUser(userId, payload);
            _log('onAdminSave:updated', __adminUpdated);

            // טען שוב למסך כדי להציג בדיוק את מה שבשרת
            await loadUser();

            // רענון גלובלי — מסכי אדמין/פרופיל אחרים יטענו מחדש
            try { await refreshMe?.(); } catch { }
            refreshAll({ reason: 'user-updated:admin', userId });

            setEditMode(false); // נשארים במסך
            showToast(he ? 'השינויים נשמרו בהצלחה' : 'Saved', 'ok');
            setTimeout(() => { justSavedRef.current = false; }, 1500);
            _log('onSelfSave:done');
        } catch (e) {
            setError(e?.message || 'שגיאת שרת');
        } finally {
            setBusy(false);
        }
    }, [userId, firstName, lastName, email, localPhone, dial, country, isCoach, club, isJudge, judgeLevel, brevetLevel, avatarUrl, he, loadUser, refreshMe]);


    // --- שמירת "עצמי" ב-selfEdit (/me) ---
    const onSelfSave = React.useCallback(async () => { /*LOG:onSelfSave*/
        justSavedRef.current = true;
        _log('onSelfSave:start');
        setError('');
        const err = validate();
        if (err) { setError(err); return; }
        try {
            setBusy(true);

            const phone = `${dial} ${localPhone.replace(/^\s+/, '')}`;
            const payload = {
                // snake_case (common backend)
                first_name: firstName?.trim(),
                last_name: lastName?.trim(),
                email: email?.trim(),
                phone,
                country,
                is_coach: !!isCoach,
                club: isCoach ? club : null,
                is_judge: !!isJudge,
                judge_level: isJudge ? judgeLevel : null,
                brevet_level: String(brevetLevel),
                avatar_url: avatarUrl || null,
                // camelCase (fallback backends)
                firstName: firstName?.trim(),
                lastName: lastName?.trim(),
                isCoach: !!isCoach,
                isJudge: !!isJudge,
                judgeLevel: isJudge ? judgeLevel : null,
                brevetLevel: String(brevetLevel),
                avatarUrl: avatarUrl || null,
            };


            const __updatedMe = await apiUpdateMe(payload);
            _log('onSelfSave:updatedMe', __updatedMe);
            try { setUser?.(normalizeUser(__updatedMe)); } catch { }
            // --- עדכון מיידי של השדות על המסך ---
            try {
                const u = __updatedMe || {};
                const full = String(u.fullName ?? u.full_name ?? '').trim();
                const fnSplit = full.split(/\s+/);
                const fallbackFn = fnSplit[0] || '';
                const fallbackLn = fnSplit.slice(1).join(' ') || '';
                const newFirst = (u.first_name ?? u.firstName ?? fallbackFn) || '';
                const newLast = (u.last_name ?? u.lastName ?? fallbackLn) || '';
                const newEmail = u.email ?? '';
                const newCountry = u.country ?? country ?? 'ישראל';
                const newPhone = (u.phone ?? phone ?? '').replace(/^\s+/, '');
                const newClub = u.club ?? (isCoach ? club : '');
                const newIsCoach = !!(u.isCoach ?? u.is_coach ?? isCoach);
                const newIsJudge = !!(u.isJudge ?? u.is_judge ?? isJudge);
                const newJudgeLevel = (u.judgeLevel ?? u.judge_level ?? (newIsJudge ? judgeLevel : null)) || null;
                const newBrevetLevel = String(u.brevetLevel ?? u.brevet_level ?? brevetLevel ?? '') || '';
                const newAvatarUrl = (u.avatarUrl ?? u.avatar_url ?? avatarUrl) || '';
                setFirstName(newFirst);
                setLastName(newLast);
                setEmail(newEmail);
                setCountry(newCountry);
                setLocalPhone(newPhone.replace(/^\+\d+\s?/, ''));
                setClub(newIsCoach ? (newClub || '') : '');
                setIsCoach(newIsCoach);
                setIsJudge(newIsJudge);
                setJudgeLevel(newIsJudge ? newJudgeLevel : null);
                setBrevetLevel(String(newBrevetLevel || brevetLevel || '1'));
                setAvatarUrl(newAvatarUrl || '');
            } catch { }


            // רענון קונטקסט /me כדי שכל המסכים שצורכים useAuth().user יתעדכנו
            try { await refreshMe?.(); } catch { }
            // אם יש לך פונקציה ששופכת /me לטופס:
            try { syncFromMe?.(); } catch { }

            // שגר ריענון גלובלי — פרופיל, רשימות אדמין וכו' יאזינו ויטענו מחדש
            refreshAll({ reason: 'user-updated:self' });

            setEditMode(false); // נשארים במסך
            showToast(he ? 'השינויים נשמרו בהצלחה' : 'Saved', 'ok');
            setTimeout(() => { justSavedRef.current = false; }, 1500);
            _log('onSelfSave:done');
        } catch (e) {
            setError(e?.message || 'שגיאת שרת');
        } finally {
            setBusy(false);
        }
    }, [firstName, lastName, email, localPhone, dial, country, isCoach, club, isJudge, judgeLevel, brevetLevel, avatarUrl, he, refreshMe, syncFromMe]);


    // --- כפתורי כותרת: חץ חזור הכי ימני, שלידו עריכה/שמירה (גם selfEdit) ---
    React.useLayoutEffect(() => {
        const BackBtn = () => (
            <TouchableOpacity
                onPress={() => selfEdit
                    ? navigation.navigate('Profile', { __refresh: Date.now() })
                    : navigation.navigate('Tabs', { screen: 'admin', params: { __refresh: Date.now() } })
                }
                activeOpacity={0.85}
                style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: palette.card,
                    borderWidth: 1, borderColor: palette.border,
                    alignItems: 'center', justifyContent: 'center',
                }}
                accessibilityLabel={he ? 'חזרה' : 'Back'}
            >
                <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={palette.text} />
            </TouchableOpacity>
        );

        const Actions = (adminView || selfEdit) ? () => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {!editMode ? (
                    <TouchableOpacity
                        onPress={() => setEditMode(true)}
                        activeOpacity={0.9}
                        style={[styles.secondaryBtn, { paddingVertical: 8, paddingHorizontal: 12 }]}
                    >
                        <Text style={styles.secondaryBtnText}>{he ? 'עריכה' : 'Edit'}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={async () => {
                            if (selfEdit) { await onSelfSave(); } else { await onAdminSave(); }
                        }}
                        activeOpacity={0.9}
                        style={{ backgroundColor: '#7c3aed', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '800' }}>
                            {busy ? (he ? 'שומר…' : 'Saving…') : (he ? 'שמירה' : 'Save')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        ) : undefined;

        navigation.setOptions({
            headerShown: true,
            title: adminView ? (he ? 'פרטי משתמש' : 'User Details') : '',
            headerTitle: () => null,
            headerBackVisible: false,
            headerLeft: undefined,
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {(adminView || selfEdit) ? <Actions /> : null}
                    <BackBtn />
                </View>
            ),
            headerRightContainerStyle: { paddingRight: 8 },
            headerStyle: { backgroundColor: palette.screen },
        });
    }, [navigation, he, adminView, selfEdit, editMode, onAdminSave, onSelfSave, isRTL, busy]);

    // תווית מדינה
    const countryObj = country ? COUNTRIES.find(c => c.value === country) : null;
    const countryLabelRaw = countryObj ? countryObj.label : 'בחר מדינה';
    const { name: countryName, flag: countryFlag } = parseCountryParts(countryLabelRaw);

    const APP_FOOTER_BG = '#0B1220';
    const overlaysOpen = countryOpen || clubOpen || judgeOpen;
    const extraTopPad = overlaysOpen ? 6 : 0;
    const extraBottomPad = overlaysOpen ? 24 : 0;
    const UNDER_TOGGLE_HEIGHT = 20;

    // --- פעולת מחיקה באדמין ---
    const confirmDelete = React.useCallback(async () => {
        try {
            setBusy(true);
            await apiDeleteUser(userId);
            setConfirmOpen(false);
            showToast(he ? 'המחיקה הושלמה' : 'Deleted', 'ok');
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        { name: 'Tabs', state: { index: 0, routes: [{ name: 'admin', params: { __refresh: Date.now() } }] } },
                    ],
                })
            );
        } catch (e) {
            Alert.alert('שגיאה', e?.message || 'Delete failed');
        } finally {
            setBusy(false);
        }
    }, [navigation, userId, he]);

    return (
        <View style={{ flex: 1 }}>
            {/* Toast */}
            {toast && (
                <View style={{
                    position: 'absolute', top: insets.top + 8, left: 12, right: 12, zIndex: 999,
                    backgroundColor: toast.kind === 'ok' ? '#1F2A44' : (toast.kind === 'warn' ? '#664D1A' : '#5B1A1A'),
                    borderColor: toast.kind === 'ok' ? '#2C3A57' : (toast.kind === 'warn' ? '#8C6E2B' : '#7F1D1D'),
                    borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
                    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, elevation: 6
                }}>
                    <Text style={{ color: '#E8EDFF', textAlign: 'center', fontWeight: '700' }}>{toast.text}</Text>
                </View>
            )}

            {/* Modal אישור מחיקה (אדמין) */}
            <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: '#0B1220', borderRadius: 16, borderWidth: 1, borderColor: '#273244', width: '100%', maxWidth: 420, padding: 16 }}>
                        <Text style={{ color: '#E8EDFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
                            {he ? 'מחיקת משתמש' : 'Delete User'}
                        </Text>
                        <Text style={{ color: '#C9D2E4', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
                            {he ? 'האם אתה בטוח שאתה רוצה למחוק את החשבון?' : 'Are you sure you want to delete this account?'}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity onPress={() => setConfirmOpen(false)} activeOpacity={0.9}
                                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2C3A57', backgroundColor: '#1F2A44' }}>
                                <Text style={{ color: '#E8EDFF', textAlign: 'center', fontWeight: '700' }}>{he ? 'ביטול' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmDelete} activeOpacity={0.9}
                                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#dc2626' }}>
                                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '800' }}>{he ? 'מחק' : 'Delete'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ScrollView
                ref={scrollRef}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={[
                    regStyles.container,
                    { flexGrow: 1, paddingTop: extraTopPad, paddingBottom: Math.max(8, insets.bottom + 60) + extraBottomPad + kbHeight }
                ]}
                showsVerticalScrollIndicator
                overScrollMode="always"
                scrollEnabled={!listScrolling}
                alwaysBounceVertical           // iOS: רענון גם בלי גלילה
                refreshControl={(
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onPullToRefresh}
                        progressViewOffset={0}
                        tintColor={palette.text}
                        colors={[palette.text]}
                    />
                )}
            >
                {/* לא מציגים את הטופס עד שהמידע נטען באדמין */}
                {(!adminView || ready) ? (
                    <>
                        {/* שורה 1: תמונת פרופיל + תפריט */}
                        <View style={{ alignitems: 'center' }}>
                            <View style={{ position: 'relative' }}>
                                <TouchableOpacity
                                    style={regStyles.avatarWrap}
                                    activeOpacity={0.9}
                                    onPress={() => !readOnly && setImageMenuOpen(v => !v)}
                                    disabled={readOnly}
                                >
                                    {avatarUrl ? (
                                        <RNImage key={userVersion} source={{ uri: previewSrc || avatarUrl }} style={regStyles.avatarImg} />
                                    ) : (
                                        <View style={regStyles.avatarPlaceholder}>
                                            <Ionicons name="person" size={40} color="#E8EDFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {imageMenuOpen && !readOnly && (
                                    <View style={{ position: 'absolute', right: -6, bottom: -6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <TouchableOpacity onPress={onPickCamera} activeOpacity={0.9} style={avatarBtnStyle()}>
                                            <Ionicons name="camera" size={18} color="#E8EDFF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={onPickGallery} activeOpacity={0.9} style={avatarBtnStyle()}>
                                            <Ionicons name="images" size={18} color="#E8EDFF" />
                                        </TouchableOpacity>
                                        {!!avatarUrl && (
                                            <TouchableOpacity onPress={onRemoveImage} activeOpacity={0.9} style={avatarDelBtnStyle()}>
                                                <Ionicons name="trash" size={18} color="#F87171" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* שורה 2: שם משפחה | שם פרטי */}
                        <View style={regStyles.rowRtl}>
                            <View style={[regStyles.col, { marginHorizontal: 6 }]}>
                                <Text style={regStyles.label}>שם משפחה</Text>
                                <TextInput style={regStyles.input} value={lastName} onChangeText={setLastName} editable={!readOnly} />
                            </View>
                            <View style={[regStyles.col, { marginHorizontal: 6 }]}>
                                <Text style={regStyles.label}>שם פרטי</Text>
                                <TextInput style={regStyles.input} value={firstName} onChangeText={setFirstName} editable={!readOnly} />
                            </View>
                        </View>

                        {/* שורה 3: טלפון | מדינה */}
                        <View style={[regStyles.rowRtl, { alignItems: 'stretch' }]}>
                            {/* טלפון */}
                            <View style={[regStyles.col, { marginHorizontal: 6, minWidth: 0 }]}>
                                <Text style={regStyles.label}>מספר טלפון</Text>
                                <View style={[
                                    regStyles.input,
                                    { marginBottom: 0, minHeight: 48, paddingHorizontal: 12, flexDirection: 'row-reverse', alignItems: 'center' },
                                    readOnly && { opacity: 0.8 }
                                ]}>
                                    <Text style={[regStyles.dialText, { opacity: 0.9 }]}>{dial}</Text>
                                    <View style={{ width: 8 }} />
                                    <TextInput
                                        style={{ flex: 1, minWidth: 0, padding: 0, margin: 0, color: '#fff' }}
                                        value={localPhone}
                                        onChangeText={setLocalPhone}
                                        keyboardType="phone-pad"
                                        placeholder=""
                                        placeholderTextColor="#9aa3b2"
                                        textAlign="left"
                                        editable={!readOnly}
                                    />
                                </View>
                            </View>

                            {/* מדינה */}
                            <View style={[regStyles.col, { marginHorizontal: 6, minWidth: 0 }]}>
                                <Text style={regStyles.label}>מדינה</Text>
                                <View style={{ position: 'relative' }}>
                                    <TouchableOpacity
                                        style={[regStyles.selectBtn, { minHeight: 48, flexDirection: 'row', alignItems: 'center' }, readOnly && { opacity: 0.8 }]}
                                        activeOpacity={0.9}
                                        onPress={() => countryOpen ? openOnly(null) : openOnly('country')}
                                        disabled={readOnly}
                                    >
                                        {!!parseCountryParts(countryObj?.label || '').flag && (
                                            <Text style={{ fontSize: 18, marginRight: 6 }}>
                                                {parseCountryParts(countryObj?.label || '').flag}
                                            </Text>
                                        )}
                                        <Text style={[regStyles.selectText, { flex: 1, textAlign: 'left' }]} numberOfLines={1}>
                                            {country ? parseCountryParts(countryObj?.label || '').name : 'בחר מדינה'}
                                        </Text>
                                        <Ionicons name={countryOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#fff" />
                                    </TouchableOpacity>

                                    {countryOpen && !readOnly && (
                                        <View pointerEvents="box-none" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, elevation: 6 }}>
                                            <View style={{ marginTop: 6, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#273244', overflow: 'hidden' }}>
                                                <ScrollView
                                                    style={{ maxHeight: 44 * 3 + 8 }}
                                                    keyboardShouldPersistTaps="handled"
                                                    showsVerticalScrollIndicator
                                                    nestedScrollEnabled
                                                    onTouchStart={() => setListScrolling(true)}
                                                    onScrollBeginDrag={() => setListScrolling(true)}
                                                    onScrollEndDrag={() => setListScrolling(false)}
                                                    onMomentumScrollEnd={() => setListScrolling(false)}
                                                    onTouchEnd={() => setListScrolling(false)}
                                                    onTouchCancel={() => setListScrolling(false)}
                                                >
                                                    {COUNTRIES.map((c) => {
                                                        const { name, flag } = parseCountryParts(c.label);
                                                        return (
                                                            <TouchableOpacity
                                                                key={c.value}
                                                                onPress={() => { setCountry(c.value); openOnly(null); }}
                                                                style={{ paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                                                                activeOpacity={0.9}
                                                            >
                                                                {!!flag && <Text style={{ fontSize: 18 }}>{flag}</Text>}
                                                                <Text style={{ color: '#fff', fontSize: 14, textAlign: 'left', flex: 1 }} numberOfLines={1}>
                                                                    {name}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </ScrollView>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* שורה 4: אימייל */}
                        <Text style={regStyles.label}>אימייל</Text>
                        <TextInput
                            style={regStyles.input}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!readOnly}
                        />

                        {/* אין סיסמה בעריכה — הוסר לגמרי */}

                        {/* שורה 5: מאמן | שופט */}
                        <View style={[regStyles.rowRtl, { alignItems: 'flex-start' }]}>
                            {/* מאמן */}
                            <View style={[regStyles.col, { marginHorizontal: 6, minWidth: 0 }]}>
                                <TouchableOpacity
                                    onPress={() => !readOnly && setIsCoach(v => !v)}
                                    activeOpacity={0.9}
                                    disabled={readOnly}
                                    style={[regStyles.toggleBox, isCoach && regStyles.toggleBoxActive, { alignSelf: 'stretch', opacity: readOnly ? 0.8 : 1 }]}
                                >
                                    <Ionicons name={isCoach ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={isCoach ? '#fff' : '#9aa3b2'} />
                                    <Text style={[regStyles.toggleText, isCoach && regStyles.toggleTextActive]}>אני מאמן/ת</Text>
                                </TouchableOpacity>
                                <View style={{ height: 20 }} />
                            </View>

                            {/* שופט */}
                            <View style={[regStyles.col, { marginHorizontal: 6, minWidth: 0 }]}>
                                <TouchableOpacity
                                    onPress={() => !readOnly && setIsJudge(v => !v)}
                                    activeOpacity={0.9}
                                    disabled={readOnly}
                                    style={[regStyles.toggleBox, isJudge && regStyles.toggleBoxActive, { alignSelf: 'stretch', opacity: readOnly ? 0.8 : 1 }]}
                                >
                                    <Ionicons name={isJudge ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={isJudge ? '#fff' : '#9aa3b2'} />
                                    <Text style={[regStyles.toggleText, isJudge && regStyles.toggleTextActive]}>אני שופט/ת</Text>
                                </TouchableOpacity>

                                <View style={{ height: 20, justifyContent: 'center' }}>
                                    {isJudge && !isCoach && (
                                        <Text style={{ color: '#FFD54F', fontSize: 12, textAlign: 'left' }}>
                                            שופט ניטרלי
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* שורה 6: אגודה | דרגת שיפוט */}
                        {(isCoach || isJudge) && (
                            <View style={[regStyles.rowRtl, { flexWrap: 'nowrap', alignItems: 'flex-start' }]}>
                                {/* אגודה – אם מאמן */}
                                <View style={[regStyles.col, { marginHorizontal: 6, minWidth: 0 }]}>
                                    {isCoach && (
                                        <>
                                            <Text style={regStyles.subLabel}>אגודה</Text>
                                            <View style={{ position: 'relative' }}>
                                                <TouchableOpacity
                                                    style={[regStyles.selectBtn, { minHeight: 48, flexDirection: 'row', alignItems: 'center' }, readOnly && { opacity: 0.8 }]}
                                                    activeOpacity={0.9}
                                                    onPress={() => clubOpen ? openOnly(null) : openOnly('club')}
                                                    disabled={readOnly}
                                                >
                                                    <Text style={[regStyles.selectText, { flex: 1, textAlign: 'left' }]}>{club || 'בחר אגודה'}</Text>
                                                    <Ionicons name={clubOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#fff" />
                                                </TouchableOpacity>
                                                {clubOpen && !readOnly && (
                                                    <View style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, elevation: 6 }}>
                                                        <View style={{
                                                            marginTop: 6, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 4,
                                                            borderWidth: 1, borderColor: '#273244', overflow: 'hidden'
                                                        }}>
                                                            <ScrollView
                                                                style={{ maxHeight: 44 * 3 + 8 }}
                                                                keyboardShouldPersistTaps="handled"
                                                                showsVerticalScrollIndicator
                                                                nestedScrollEnabled
                                                                onTouchStart={() => setListScrolling(true)}
                                                                onScrollBeginDrag={() => setListScrolling(true)}
                                                                onScrollEndDrag={() => setListScrolling(false)}
                                                                onMomentumScrollEnd={() => setListScrolling(false)}
                                                                onTouchEnd={() => setListScrolling(false)}
                                                                onTouchCancel={() => setListScrolling(false)}
                                                            >
                                                                {CLUBS.map((x) => (
                                                                    <TouchableOpacity
                                                                        key={x}
                                                                        onPress={() => { setClub(x); openOnly(null); }}
                                                                        style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                                                                        activeOpacity={0.9}
                                                                    >
                                                                        <Text style={{ color: '#fff', fontSize: 14, textAlign: 'left' }}>{x}</Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </ScrollView>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        </>
                                    )}
                                </View>

                                {/* דרגת שיפוט */}
                                <View style={[regStyles.col, { marginHorizontal: 6, minWidth: 0 }]}>
                                    {isJudge && (
                                        <>
                                            <Text style={regStyles.subLabel}>דרגת שיפוט</Text>
                                            <View style={{ position: 'relative' }}>
                                                <TouchableOpacity
                                                    style={[regStyles.selectBtn, { minHeight: 48, flexDirection: 'row', alignItems: 'center' }, readOnly && { opacity: 0.8 }]}
                                                    activeOpacity={0.9}
                                                    onPress={() => judgeOpen ? openOnly(null) : openOnly('judge')}
                                                    disabled={readOnly}
                                                >
                                                    <Text style={[regStyles.selectText, { flex: 1, textAlign: 'left' }]}>{judgeLevel || 'בחר דרגת שיפוט'}</Text>
                                                    <Ionicons name={judgeOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#fff" />
                                                </TouchableOpacity>
                                                {judgeOpen && !readOnly && (
                                                    <View style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, elevation: 6 }}>
                                                        <View style={{
                                                            marginTop: 6, backgroundColor: '#111827', borderRadius: 12,
                                                            paddingVertical: 4, borderWidth: 1, borderColor: '#273244', overflow: 'hidden'
                                                        }}>
                                                            <ScrollView
                                                                style={{ maxHeight: 44 * 3 + 8 }}
                                                                keyboardShouldPersistTaps="handled"
                                                                showsVerticalScrollIndicator
                                                                nestedScrollEnabled
                                                                onTouchStart={() => setListScrolling(true)}
                                                                onScrollBeginDrag={() => setListScrolling(true)}
                                                                onScrollEndDrag={() => setListScrolling(false)}
                                                                onMomentumScrollEnd={() => setListScrolling(false)}
                                                                onTouchEnd={() => setListScrolling(false)}
                                                                onTouchCancel={() => setListScrolling(false)}
                                                            >
                                                                {JUDGE_LEVELS.map((x) => (
                                                                    <TouchableOpacity
                                                                        key={x}
                                                                        onPress={() => { setJudgeLevel(x); openOnly(null); }}
                                                                        style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                                                                        activeOpacity={0.9}
                                                                    >
                                                                        <Text style={{ color: '#fff', fontSize: 14, textAlign: 'left' }}>{x}</Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </ScrollView>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>

                                            {judgeLevel === 'בינלאומי' && (
                                                <>
                                                    <Text style={[regStyles.subLabel, { marginTop: 8 }]}>דרגת ברווה</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                                        {['1', '2', '3', '4'].map((v) => {
                                                            const active = brevetLevel === v;
                                                            return (
                                                                <TouchableOpacity
                                                                    key={v}
                                                                    onPress={() => !readOnly && setBrevetLevel(v)}
                                                                    activeOpacity={0.9}
                                                                    disabled={readOnly}
                                                                    style={{
                                                                        width: 36, height: 36, borderRadius: 18,
                                                                        alignItems: 'center', justifyContent: 'center',
                                                                        borderWidth: 2,
                                                                        borderColor: active ? '#5B7CFA' : '#273244',
                                                                        backgroundColor: active ? 'rgba(91,124,250,0.12)' : 'transparent',
                                                                        opacity: readOnly ? 0.8 : 1
                                                                    }}
                                                                >
                                                                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{v}</Text>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                </>
                                            )}
                                        </>
                                    )}
                                </View>
                            </View>
                        )}

                        {!!error && <Text style={regStyles.error}>{error}</Text>}

                        {/* כפתור שליחה – רק ברישום רגיל */}
                        {(!adminView && !selfEdit) && (
                            <TouchableOpacity
                                disabled={busy}
                                onPress={onSubmit}
                                style={[regStyles.btn, busy && { opacity: 0.7 }, { marginBottom: 12 }]}
                            >
                                <Text style={regStyles.btnText}>{busy ? 'שולח…' : 'הרשמה'}</Text>
                            </TouchableOpacity>
                        )}

                        {/* כפתור מחיקה — רק באדמין */}
                        {adminView && ready && (
                            <TouchableOpacity
                                onPress={() => setConfirmOpen(true)}
                                style={{ marginTop: 16, backgroundColor: '#dc2626', paddingVertical: 12, borderRadius: 12, alignItems: 'center', opacity: busy ? 0.7 : 1 }}
                                disabled={busy}
                            >
                                <Text style={{ color: '#fff', fontWeight: '800' }}>{he ? 'מחיקת משתמש' : 'Delete User'}</Text>
                            </TouchableOpacity>
                        )}

                        {overlaysOpen ? <View style={{ height: 16 }} /> : null}
                    </>
                ) : (
                    // שלד טעינה קצר
                    <View style={{ padding: 16 }}>
                        <View style={{ height: 16 }} />
                        <View style={{ height: 48, backgroundColor: '#111827', borderRadius: 12, opacity: 0.4, marginBottom: 12 }} />
                        <View style={{ height: 48, backgroundColor: '#111827', borderRadius: 12, opacity: 0.4, marginBottom: 12 }} />
                        <View style={{ height: 48, backgroundColor: '#111827', borderRadius: 12, opacity: 0.4, marginBottom: 12 }} />
                    </View>
                )}
            </ScrollView>

            {/* בלוק תחתון קבוע */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: insets.bottom + 10, backgroundColor: '#0B1220' }} />
        </View >
    );

    // --- עזרי UI קטנים ---
    function avatarBtnStyle() {
        return {
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: '#1F2A44',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: '#2C3A57',
            shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
        };
    }
    // --- פונקציה: AnchoredSelect ---
    function avatarDelBtnStyle() {
        return {
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: '#2A1212',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: '#7F1D1D',
            shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
        };
    }
}



function AnchoredSelect({ anchor, visible, items, onSelect, onClose }) {
    if (!visible || !anchor) return null;

    // חישוב מיקום: מתחת ל־anchor, רוחב זהה
    const sheetStyle = {
        position: 'absolute',
        top: (anchor.y || 0) + (anchor.height || 0) + 6,
        left: anchor.x || 0,
        width: (anchor.width || 220),
    };

    return (
        <View style={selectStyles.overlay} pointerEvents="box-none">
            <TouchableOpacity style={selectStyles.backdrop} activeOpacity={1} onPress={onClose} />
            <View style={[selectStyles.sheet, sheetStyle]}>
                <ScrollView style={{ maxHeight: 300 }}>
                    {items.map(it => (
                        <TouchableOpacity key={it.key} style={selectStyles.row} onPress={() => onSelect?.(it.key)}>
                            <Text style={selectStyles.rowText}>{it.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const selectStyles = StyleSheet.create({
    overlay: { position: 'absolute', inset: 0 },
    backdrop: { position: 'absolute', inset: 0, backgroundColor: 'transparent' },
    sheet: {
        backgroundColor: palette.card, borderRadius: 12,
        borderWidth: 1, borderColor: palette.border,
        // --- פונקציה: ImageMenu ---
        shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14,
        elevation: 12,
    },
    row: {
        paddingVertical: 12, paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border,
    },
    rowText: { color: '#fff', fontSize: 14 },
});


function ImageMenu({ open, onClose, onPickCamera, onPickGallery, onRemove }) {
    if (!open) return null;
    return (
        <View style={imgMenuStyles.root}>
            <View style={imgMenuStyles.sheet}>
                <Text style={imgMenuStyles.title}>תמונת פרופיל</Text>
                <TouchableOpacity style={imgMenuStyles.row} onPress={onPickCamera}>
                    <Ionicons name="camera" size={18} color="#fff" /><Text style={imgMenuStyles.rowText}>צלם תמונה</Text>
                </TouchableOpacity>
                <TouchableOpacity style={imgMenuStyles.row} onPress={onPickGallery}>
                    <Ionicons name="images" size={18} color="#fff" /><Text style={imgMenuStyles.rowText}>בחר מהגלריה</Text>
                </TouchableOpacity>
                {onRemove && (
                    <TouchableOpacity style={[imgMenuStyles.row, { borderColor: '#5c1b1b' }]} onPress={onRemove}>
                        <Ionicons name="trash" size={18} color="#ffb4b4" /><Text style={[imgMenuStyles.rowText, { color: '#ffb4b4' }]}>הסר תמונה</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={imgMenuStyles.cancel} onPress={onClose}><Text style={imgMenuStyles.cancelText}>סגור</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={imgMenuStyles.backdrop} activeOpacity={1} onPress={onClose} />
        </View>
    );
}

const imgMenuStyles = StyleSheet.create({
    root: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'flex-end' },
    backdrop: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
    sheet: {
        width: '100%', backgroundColor: palette.card, borderTopLeftRadius: 16, borderTopRightRadius: 16,
        borderTopWidth: 1, borderColor: palette.border, padding: 14,
    },
    title: { color: '#fff', fontWeight: '800', marginBottom: 8 },
    row: {
        // --- פונקציה: SelectModal ---
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.border,
    },
    rowText: { color: '#fff' },
    cancel: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.border, borderRadius: 10, marginTop: 8 },
    cancelText: { color: '#fff' },
});


function SelectModal({ open, title, items, onSelect, onClose }) {
    if (!open) return null;
    return (
        <View style={sel.root}>
            <View style={sel.sheet}>
                <Text style={sel.title}>{title}</Text>
                <ScrollView style={{ maxHeight: 380 }}>
                    {items.map(it => (
                        <TouchableOpacity key={it.key} style={sel.row} onPress={() => onSelect?.(it.key)}>
                            <Text style={sel.rowText}>{it.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity onPress={onClose} style={sel.cancel}>
                    <Text style={sel.cancelText}>סגור</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const sel = StyleSheet.create({
    root: {
        position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center', justifyContent: 'center', padding: 16,
    },
    sheet: {
        width: '100%', maxWidth: 460, backgroundColor: palette.card,
        borderRadius: 16, padding: 14, borderWidth: 1, borderColor: palette.border,
    },
    title: { color: palette.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
    row: {
        paddingVertical: 12, paddingHorizontal: 10,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border,
        // --- פונקציה: FlashcardsScreen ---
    },
    rowText: { color: '#fff', fontSize: 14 },
    cancel: {
        marginTop: 8, alignSelf: 'flex-end',
        paddingVertical: 8, paddingHorizontal: 14,
        borderWidth: 1, borderColor: palette.border, borderRadius: 10,
    },
    cancelText: { color: palette.text, fontWeight: '600' },
});





// ---------- Flashcards ----------
function FlashcardsScreen() {
    const { bump, drop, repMode, toggleRepMode } = useProgress();
    const { t, lang, isRTL } = usePrefs();

    // כמה פיקסלים קבועים של "רווח" בתחתית הרשימה (שנה לפי הטעם: 0/6/8/12...)
    const EXTRA_BOTTOM_PX = 8;

    // ✨ מקור כרונולוגי (נשען על ELEMENTS לפי הקובץ)
    const chrono = React.useMemo(() => ELEMENTS, []);

    // ✨ מצב תצוגה נוכחי
    const [cards, setCards] = useState(chrono);
    const [isShuffled, setIsShuffled] = useState(false);

    // ✨ אנימציה עדינה בהחלפת סדר
    const fade = useRef(new Animated.Value(1)).current;
    const spin = useRef(new Animated.Value(0)).current; // מסובב טיפה את ה-FAB בלחיצה

    // ערבוב שמבטיח סדר "חדש" (לא זהה לנוכחי)
    const shuffleDifferent = React.useCallback((base, current) => {
        const maxTries = 8;
        for (let n = 0; n < maxTries; n++) {
            // Fisher-Yates
            const a = [...base];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            // שונה מהרשימה הנוכחית?
            const same = a.length === current.length && a.every((x, i) => x.id === current[i].id);
            if (!same) return a;
        }
        // fallback: אם משום מה יצא אותו דבר — מבצעים החלפה קטנה
        if (base.length > 1) {
            const b = [...base];
            [b[0], b[1]] = [b[1], b[0]];
            return b;
        }
        return base;
    }, []);

    const animateSwap = React.useCallback((next, fabSpinDir = 1) => {
        Animated.parallel([
            Animated.sequence([
                Animated.timing(fade, { toValue: 0.15, duration: 120, useNativeDriver: true }),
                Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
            ]),
            Animated.sequence([
                Animated.timing(spin, { toValue: fabSpinDir, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(spin, { toValue: 0, duration: 0, useNativeDriver: true }), // אפס בחזרה
            ]),
        ]).start();
        setCards(next);
    }, [fade, spin]);

    const doShuffle = React.useCallback(() => {
        const next = shuffleDifferent(chrono, cards);
        animateSwap(next, 1);
        setIsShuffled(true);
    }, [chrono, cards, shuffleDifferent, animateSwap]);

    const restoreChrono = React.useCallback(() => {
        // אם כבר כרונולוגי — לא עושים כלום
        const same = cards.length === chrono.length && cards.every((x, i) => x.id === chrono[i].id);
        if (!same) animateSwap(chrono, -1);
        setIsShuffled(false);
    }, [animateSwap, cards, chrono]);

    const filtered = cards;

    // סיבוב לאייקון ה-FAB
    const fabRotate = spin.interpolate({ inputRange: [-1, 1], outputRange: ['-180deg', '180deg'] });

    // מאפייני גלילה שמונעים Overscroll (“בונס”) ומקצרים לפי פיקסלים
    const noBounceProps = Platform.OS === 'ios'
        ? { bounces: false, alwaysBounceVertical: false }
        : { overScrollMode: 'never' };

    return (
        <SafeAreaView
            style={[
                styles.screen,
                { flex: 1, backgroundColor: palette.screen, direction: isRTL ? 'rtl' : 'ltr' }
            ]}
            edges={['top']}
        >
            <Header
                title={t('flash.header')}
                start={<StartHeaderButtons />} end={
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <RepToggle repMode={repMode} toggleRepMode={toggleRepMode} />
                    </View>
                }
            />

            {/* הרשימה עם דהייה עדינה בזמן החלפת סדר */}
            <Animated.View style={{ flex: 1, opacity: fade }}>
                <FlatList
                    data={filtered}
                    keyExtractor={i => i.id}
                    renderItem={({ item }) => (
                        <View style={{ marginBottom: 12 }}>
                            <FlipCard
                                title={labelFor(item, repMode, lang)}
                                value={item.value}
                                onIKnow={() => bump(item.id)}
                                onIDontKnow={() => drop(item.id)}
                            />
                        </View>
                    )}

                    // ביטול overscroll (“בונס”) בכל הפלטפורמות
                    {...noBounceProps}

                    // קיצור תחתון קשיח בפיקסלים — מחליף את 140px שהיו קודם
                    contentContainerStyle={{
                        padding: 12,
                        paddingBottom: EXTRA_BOTTOM_PX,
                        direction: isRTL ? 'rtl' : 'ltr',
                    }}

                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                />
            </Animated.View>

            {/* ⚪ FAB קבוע במסך: בעברית ימין-למטה, באנגלית שמאל-למטה */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        bottom: 20,
                        // RTL: מימין; LTR: משמאל
                        [isRTL ? 'right' : 'left']: 20,
                        zIndex: 50,
                        transform: [{ rotate: fabRotate }],
                    },
                ]}
                pointerEvents="box-none"
            >
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={isShuffled ? restoreChrono : doShuffle}
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: palette.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 6,
                    }}
                    accessibilityLabel={
                        isShuffled
                            ? (lang === 'he' ? 'חזרה לסדר כרונולוגי' : 'Restore chronological order')
                            : (lang === 'he' ? 'ערבב את הסדר' : 'Shuffle order')
                    }
                >
                    {/*פונקציה: ModeToggle */}
                    {/* אייקון מתחלף: קובייה ↔ רענון */}
                    <Ionicons
                        name={isShuffled ? 'refresh-circle-outline' : 'cube-outline'}
                        size={28}
                        color="#fff"
                    />
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
}



// ---------- Quiz ----------
// --- פונקציה: QuizScreen ---
function ModeToggle({ mcq, setMcq }) {
    const { t } = usePrefs();
    return (
        <TouchableOpacity onPress={() => setMcq(v => !v)} style={styles.modeToggle} accessibilityLabel={t('a11y.toggleMode')}>
            <Ionicons name={mcq ? 'list-outline' : 'create-outline'} size={18} color={palette.text} />
        </TouchableOpacity>
    );
}
const FEEDBACK_HOLD_MS = 2000;
function QuizScreen() {
    const { progress, record, repMode, toggleRepMode } = useProgress();
    const { t, lang, isRTL } = usePrefs();
    const [modeMCQ, setModeMCQ] = useState(true);
    const [round, setRound] = useState(0);

    const { questions } = useMemo(() => {
        const weights = ELEMENTS.map(e => {
            const s = progress[e.id] || { correct: 0, wrong: 0 };
            const total = s.correct + s.wrong;
            const acc = total ? s.correct / total : 0;
            return 1 + (1 - acc) * 3 + (total === 0 ? 2 : 0);
        });
        const items = ELEMENTS.map((e, idx) => ({ e, w: weights[idx] }));
        const chosen = weightedSample(items, items.map(i => i.w), 10).map(i => i.e);
        return { questions: chosen.map(e => ({ id: e.id, nameHe: e.nameHe, nameEn: e.nameEn, symbol: e.symbol, value: e.value })) };
    }, [round]);

    const [idx, setIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);
    const [selected, setSelected] = useState(null);
    const [input, setInput] = useState('');
    const [options, setOptions] = useState([]);

    const [feedback, setFeedback] = useState({ active: false, status: null, correctValue: null });
    const timerRef = useRef(null);

    const current = Array.isArray(questions) ? (questions[idx] || null) : null;

    useEffect(() => {
        setIdx(0); setScore(0); setDone(false); setSelected(null); setInput('');
        setFeedback({ active: false, status: null, correctValue: null });
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    }, [round]);

    useEffect(() => {
        if (!Array.isArray(questions) || !questions[idx]) { setOptions([]); return; }
        setSelected(null); setInput(''); setFeedback({ active: false, status: null, correctValue: null });
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        if (modeMCQ) {
            const v = questions[idx].value;
            const distractors = closeDistractors(v);
            const opts = shuffle([v, ...distractors]).map(n => Number(n.toFixed(1)));
            setOptions(opts);
        } else setOptions([]);
    }, [idx, modeMCQ, questions]);

    const proceedNext = () => { if (idx + 1 >= 10) setDone(true); else setIdx(i => i + 1); };

    const onPressOption = async (v) => {
        if (done || feedback.active || !current) return;
        const correctValue = current.value;
        {
            const ok = Math.abs(v - correctValue) < 0.05;

            setSelected(v);
            setFeedback({ active: true, status: ok ? 'right' : 'wrong', correctValue });
            if (ok) setScore(s => s + 1);

            await record(current.id, ok);

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setFeedback({ active: false, status: null, correctValue: null });
                setSelected(null);
                proceedNext();
                timerRef.current = null;
            }, FEEDBACK_HOLD_MS);
        }
    };

    const onAnswer = async (ok) => {
        if (done) return;
        if (ok) setScore(s => s + 1);
        await record(current.id, ok);
        proceedNext();
    };

    // QuizScreen — replace checkFree
    const checkFree = async () => {
        if (done || feedback.active || !current) return;

        const parsed = String(input || '').replace(',', '.');
        const num = Number.parseFloat(parsed);
        const ok = Number.isFinite(num) && Math.abs(num - current.value) < 0.05;

        setFeedback({ active: true, status: ok ? 'right' : 'wrong', correctValue: current.value });

        // עדכון סטטיסטיקה+צליל מיידית
        await record(current.id, ok);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setFeedback({ active: false, status: null, correctValue: null });
            if (ok) setScore(s => s + 1);
            proceedNext();
            timerRef.current = null;
        }, FEEDBACK_HOLD_MS);
    };

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    if (!current) {
        return (
            <SafeAreaView
                style={[styles.screen, { flex: 1, backgroundColor: palette.screen, direction: isRTL ? 'rtl' : 'ltr' }]}
                edges={['top']}
            >
                <Header
                    title={t('quiz.header')}
                    start={<StartHeaderButtons />} end={<View style={{ flexDirection: 'row', gap: 8 }}>
                        <RepToggle repMode={repMode} toggleRepMode={toggleRepMode} />
                        <ModeToggle mcq={modeMCQ} setMcq={setModeMCQ} />
                    </View>}
                />
            </SafeAreaView>
        );
    }

    if (done) {
        return (
            <SafeAreaView
                style={[styles.screen, { flex: 1, backgroundColor: palette.screen, direction: isRTL ? 'rtl' : 'ltr' }]}
                edges={['top']}
            >
                <Header
                    title={t('quiz.header')}
                    start={<StartHeaderButtons />} end={<View style={{ flexDirection: 'row', gap: 8 }}>
                        <RepToggle repMode={repMode} toggleRepMode={toggleRepMode} />
                        <ModeToggle mcq={modeMCQ} setMcq={setModeMCQ} />
                    </View>}
                />
                <View style={styles.quizCard}>
                    <Text style={styles.quizTitle}>{t('quiz.summary')}</Text>
                    <Text style={[styles.muted, { marginTop: 8 }]}>{t('quiz.answered10')}</Text>
                    <Text style={[styles.resultText, { fontSize: 24, marginTop: 10 }]}> {score}/10</Text>
                    <TouchableOpacity onPress={() => setRound(r => r + 1)} style={[styles.primaryBtn, { marginTop: 16 }]}>
                        <Ionicons name="refresh" size={18} color="#fff" />
                        <Text style={styles.primaryBtnText}>{t('quiz.newQuiz')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={[styles.screen, { flex: 1, backgroundColor: palette.screen, direction: isRTL ? 'rtl' : 'ltr' }]}
            edges={['top']}
        >
            <Header
                title={t('quiz.header')}
                start={<StartHeaderButtons />} end={<View style={{ flexDirection: 'row', gap: 8 }}>
                    <RepToggle repMode={repMode} toggleRepMode={toggleRepMode} />
                    <ModeToggle mcq={modeMCQ} setMcq={setModeMCQ} />
                </View>}
            />
            <ProgressBar value={idx / 10} />

            <View style={styles.quizCard}>
                <Text style={styles.quizQ}>{t('quiz.whatIs')}</Text>
                <Text style={styles.quizTitle}>{repMode === 'symbols' ? current.symbol : (lang === 'he' ? current.nameHe : current.nameEn)}</Text>

                {modeMCQ ? (
                    <View style={{ marginTop: 16 }}>
                        {options.map((v) => {
                            const isCorrect = Math.abs(v - current.value) < 0.05;
                            const isSelected = selected === v;

                            const glow = feedback.active
                                ? (isSelected && feedback.status === 'right'
                                    ? styles.optionCorrect
                                    : (isSelected && feedback.status === 'wrong'
                                        ? styles.optionWrong
                                        : (feedback.status === 'wrong' && isCorrect
                                            ? styles.optionCorrect
                                            : null)))
                                : (isSelected ? styles.optionActive : null);

                            return (
                                <TouchableOpacity
                                    key={String(v)}
                                    disabled={done || feedback.active}
                                    onPress={() => onPressOption(v)}
                                    style={[styles.optionBtn, glow]}
                                >
                                    <Text style={styles.optionText}>{formatVal(v)}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : (
                    <View style={{ marginTop: 16 }}>
                        <TextInput
                            keyboardType="numeric"
                            placeholder=""
                            placeholderTextColor={palette.muted}
                            value={input}
                            onChangeText={setInput}
                            style={[
                                styles.input,
                                feedback.active && (feedback.status === 'right' ? styles.inputCorrect : styles.inputWrong),
                            ]}
                            textAlign="center"
                        />
                        {/* מציג תשובה נכונה כששגוי */}
                        {feedback.active && feedback.status === 'wrong' && (
                            <Text style={styles.correctAnswerText}>
                                {lang === 'he'
                                    ? `התשובה הנכונה: ${formatVal(current.value)}`
                                    : `Correct: ${formatVal(current.value)}`
                                }
                            </Text>
                        )}
                        <TouchableOpacity
                            onPress={checkFree}
                            disabled={done || feedback.active || !String(input || '').trim()}
                            style={[styles.primaryBtn, (done || feedback.active) && { opacity: 0.6 }]}
                        >
                            <Ionicons name="checkmark" size={18} color="#fff" />
                            <Text style={styles.primaryBtnText}>{t('quiz.check')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={[styles.quizFooter, { alignSelf: 'stretch' }]}>
                <Text
                    style={styles.quizProgress}
                    // --- פונקציה: CalculatorScreen ---
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    ellipsizeMode="middle"
                >
                    {t('quiz.progress', { n: idx + 1 })}
                </Text>
            </View>
        </SafeAreaView>
    );
}


// ---------- Calculator (uses unified keyboard) ----------
function CalculatorScreen() {
    const { repMode, toggleRepMode } = useProgress();
    const { t, isRTL, lang } = usePrefs();
    const [selected, setSelected] = useState([]);

    // === שליטה באזור ההדבקה (כמו בטריף) ===
    const STICKY_TOP_OFFSET_PX = 0;
    const STICKY_ATTACH_EARLY_PX = -78;
    const STICKY_DETACH_UP_PX = -102;

    // מידות מסגרת “סלוטים”
    const screenW = Dimensions.get('window').width;
    const OUTER = 16, INNER = 14, GAP = 6;
    const frameW = screenW - OUTER * 2;
    const slotW = Math.floor((frameW - INNER * 2 - GAP * 7) / 8) - 1;

    // חישובי סה״כ
    const list = selected.map(id => ELEMENTS.find(e => e.id === id)).filter(Boolean);
    const total = list.reduce((s, e) => s + e.value, 0);

    // פעולות
    const add = (id) => setSelected(arr => (arr.length >= 8 ? arr : [...arr, id]));
    const deleteLast = () => setSelected(arr => arr.slice(0, -1));
    const clearAll = () => setSelected([]);

    // במצב symbols הסלוטים תמיד LTR; שמות לפי RTL/LTR
    const rowDir = repMode === 'symbols' ? 'row' : (isRTL ? 'row-reverse' : 'row');

    // ===== דביק: מדידות/סטייט =====
    const [scrollY, setScrollY] = useState(0);
    const [headerH, setHeaderH] = useState(0); // גובה ה־Header להצמדה מתחתיו

    const [wrapY, setWrapY] = useState(0);     // Y של המסגרת הכוללת
    const [symRelY, setSymRelY] = useState(0); // Y יחסי של שורת הסימבולים בתוך המסגרת
    const [symH, setSymH] = useState(0);       // גובה שורת הסימבולים

    const symAbsY = wrapY + symRelY;

    const [stickyVis, setStickyVis] = useState(false);

    // מעקב כיוון גלילה + סינון תת־פיקסלים (כמו בטריף)
    const lastYRef = useRef(0);
    const dirRef = useRef('down'); // <-- בלי ג׳נריק TS

    useEffect(() => {
        const y = Math.round(scrollY);
        const prev = lastYRef.current;
        const dir = y > prev ? 'down' : (y < prev ? 'up' : dirRef.current);
        lastYRef.current = y;
        dirRef.current = dir;

        const topEdge = y + headerH;

        const attach = symAbsY - STICKY_ATTACH_EARLY_PX;
        const detach = symAbsY - STICKY_DETACH_UP_PX;

        if (!stickyVis && dir === 'down' && topEdge >= attach) setStickyVis(true);
        else if (stickyVis && dir === 'up' && topEdge <= detach) setStickyVis(false);
    }, [scrollY, headerH, symAbsY, stickyVis, STICKY_ATTACH_EARLY_PX, STICKY_DETACH_UP_PX]);

    const stickyIds = selected; // במחשבון יש רק פס אחד

    return (
        <SafeAreaView
            style={[styles.screen, { flex: 1, backgroundColor: palette.screen, direction: isRTL ? 'rtl' : 'ltr' }]}
            edges={['top']}
        >
            <View style={{ flex: 1, direction: 'ltr' }}>
                {/* Header עם מדידת גובה לצורך offset לשורה הדביקה */}
                <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
                    <Header
                        title={t('calc.header')}
                        start={<StartHeaderButtons />}
                        end={
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <RepToggle repMode={repMode} toggleRepMode={toggleRepMode} />
                            </View>
                        }
                    />
                </View>

                {/* רשימה עם כותרת הכוללת: שורת סימבולים, שורת ערכים, סה״כ, כפתורים ומקלדת */}
                <FlatList
                    data={[]}
                    keyExtractor={(_, i) => String(i)}
                    onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
                    scrollEventThrottle={16}
                    keyboardShouldPersistTaps="always"
                    ListHeaderComponent={
                        <View style={[styles.section, { paddingHorizontal: OUTER }]}>
                            {/* מסגרת הסלוטים */}
                            <View
                                style={[styles.slotFrame, { width: frameW, paddingHorizontal: INNER, alignSelf: 'center' }]}
                                onLayout={(e) => setWrapY(e.nativeEvent.layout.y)}
                            >
                                {/* ROW 1: סימבולים — מקור. כשדביק: מסתירים אותו (opacity:0) */}
                                <View
                                    onLayout={(e) => { setSymRelY(e.nativeEvent.layout.y); setSymH(e.nativeEvent.layout.height); }}
                                    style={[
                                        { flexDirection: rowDir, justifyContent: 'space-between', gap: GAP },
                                        stickyVis && { opacity: 0 }, // מסתיר את המקור בזמן הדביקה
                                    ]}
                                >
                                    {Array.from({ length: 8 }).map((_, i) => {
                                        const e = list[i];
                                        return (
                                            <View key={i} style={[styles.slotBox, { width: slotW }]}>
                                                <Text
                                                    style={[
                                                        repMode === 'symbols'
                                                            ? [styles.slotSymbol, Platform.select({ ios: { fontFamily: 'Menlo' }, android: { fontFamily: 'monospace' } })]
                                                            : [styles.slotName, { writingDirection: isRTL ? 'rtl' : 'ltr' }],
                                                    ]}
                                                    numberOfLines={repMode === 'symbols' ? 1 : 1}
                                                    adjustsFontSizeToFit={repMode === 'symbols'}
                                                    minimumFontScale={repMode === 'symbols' ? 0.6 : 1}
                                                >
                                                    {e ? labelFor(e, repMode, lang) : '—'}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* ROW 2: ערכי דרגות קושי בלבד (בלי בונוסים) */}
                                <View style={{ flexDirection: rowDir, justifyContent: 'space-between', gap: GAP, marginTop: 6 }}>
                                    {Array.from({ length: 8 }).map((_, i) => {
                                        const e = list[i];
                                        return (
                                            <View key={i} style={[styles.slotBox, styles.slotBoxSmall, { width: slotW }]}>
                                                <Text style={styles.slotValue} numberOfLines={1}>
                                                    {e ? formatVal(e.value) : '—'}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* total bar */}
                            <View style={[styles.calcBar, { justifyContent: isRTL ? 'flex-end' : 'flex-start' }]}>
                                {isRTL ? (
                                    <>
                                        <Text style={styles.calcValue}>{formatVal(total)}</Text>
                                        <Text style={styles.calcLabel}>{t('common.total')}</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.calcLabel}>{t('common.total')}</Text>
                                        <Text style={styles.calcValue}>{formatVal(total)}</Text>
                                    </>
                                )}
                            </View>

                            {/* action buttons */}
                            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 12, marginBottom: 14 }}>
                                <TouchableOpacity onPress={withDismiss(deleteLast)} style={styles.secondaryBtn}>
                                    {lang === 'en' ? (
                                        <>
                                            <Text style={styles.secondaryBtnText}>{t('common.deleteLast')}</Text>
                                            <Ionicons name="backspace-outline" size={16} color={palette.text} />
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="backspace-outline" size={16} color={palette.text} />
                                            <Text style={styles.secondaryBtnText}>{t('common.deleteLast')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity onPress={withDismiss(clearAll)} style={styles.secondaryBtn}>
                                    {lang === 'en' ? (
                                        <>
                                            <Text style={[styles.secondaryBtnText, { color: palette.danger }]}>{t('common.reset')}</Text>
                                            <Ionicons name="trash-outline" size={16} color={palette.danger} />
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="trash-outline" size={16} color={palette.danger} />
                                            <Text style={[styles.secondaryBtnText, { color: palette.danger }]}>{t('common.reset')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* ================= מקלדת מרוכזת ================= */}
                            <ElementsKeyboardUnified
                                columns={3}
                                colGap={12}
                                keyHeight={98}
                                valueHeight={28}
                                onPressElement={add}
                            />
                        </View>
                    }
                    renderItem={null}
                    showsVerticalScrollIndicator={false}
                    {...(Platform.OS === 'ios'
                        ? { bounces: false, alwaysBounceVertical: false }
                        : { overScrollMode: 'never' })}
                />

                {/* ===== שורת סימבולים דביקה (Overlay מעל המקלדת) ===== */}
                {stickyVis && (
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            top: headerH + STICKY_TOP_OFFSET_PX,
                            left: OUTER,
                            right: OUTER,
                            zIndex: 1000,
                            elevation: 1000,
                        }}
                    >
                        <View style={[styles.slotFrame, { paddingHorizontal: INNER, backgroundColor: palette.card }]}>
                            <View style={{ flexDirection: rowDir, justifyContent: 'space-between', gap: GAP }}>
                                {Array.from({ length: 8 }).map((_, i) => {
                                    const e = ELEMENTS.find(el => el.id === stickyIds[i]);
                                    return (
                                        <View key={i} style={[styles.slotBox, { width: slotW }]}>
                                            <Text
                                                style={[
                                                    repMode === 'symbols'
                                                        ? [styles.slotSymbol, Platform.select({ ios: { fontFamily: 'Menlo' }, android: { fontFamily: 'monospace' } })]
                                                        : [styles.slotName, { writingDirection: isRTL ? 'rtl' : 'ltr' }],
                                                ]}
                                                numberOfLines={repMode === 'symbols' ? 1 : 1}
                                                adjustsFontSizeToFit={repMode === 'symbols'}
                                                minimumFontScale={repMode === 'symbols' ? 0.6 : 1}
                                            >
                                                {e ? labelFor(e, repMode, lang) : '—'}
                                                {/* פונקציה: Stat */}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                )}
            </View>
            {/* פונקציה: ProgressScreen */}
        </SafeAreaView>
    );
}





// ---------- Progress ----------
function Stat({ title, value, color }) {
    return (
        <View style={[styles.statCard, { borderColor: color }]}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={[styles.statTitle, { color }]}>{title}</Text>
        </View>
    );
}

function ProgressScreen() {
    const { progress, reset } = useProgress();
    const { t, lang, isRTL } = usePrefs();
    const total = ELEMENTS.length;

    // כמה פיקסלים קבועים של "רווח" בתחתית (שנה לפי הטעם: 0/6/8/12...)
    const EXTRA_BOTTOM_PX = 8;

    // שמירה על הכתיבה המקורית של העמוד (כמו בקוד שלך)
    const pageDir = 'ltr';

    const table = ELEMENTS.map(e => {
        const s = progress[e.id] || { correct: 0, wrong: 0 };
        const totalAns = s.correct + s.wrong;
        const acc = totalAns ? Math.round((s.correct / totalAns) * 100) : 0;
        return { ...e, correct: s.correct, wrong: s.wrong, acc };
    });
    const strong = table.filter(x => x.acc >= 80 && x.correct >= 3);
    const mid = table.filter(x => x.acc >= 50 && (x.acc < 80 || x.correct < 3));
    const need = table.filter(x => x.acc < 50);

    // אפשר להשאיר את ההוק — לא משתמשים בו יותר לפיצול
    const { isTablet, isLandscape } = useResponsive?.() || { isTablet: false, isLandscape: false };

    // ביטול overscroll (“בונס”) בכל הפלטפורמות
    const noBounceProps = Platform.OS === 'ios'
        ? { bounces: false, alwaysBounceVertical: false }
        : { overScrollMode: 'never' };

    // מודאל איפוס ממותג
    const [confirmOpen, setConfirmOpen] = useState(false);
    const ConfirmResetModal = (
        <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
            <View style={styles.confirmModalBackdrop}>
                <View style={styles.confirmModalCard}>
                    <Text style={styles.confirmModalTitle}>{t('prog.resetQ')}</Text>
                    <Text style={styles.confirmModalText}>{t('prog.resetBody')}</Text>

                    <View style={styles.confirmActions}>
                        <TouchableOpacity onPress={() => setConfirmOpen(false)} style={styles.confirmBtn}>
                            <Text style={styles.confirmBtnText}>{lang === 'he' ? 'ביטול' : 'Cancel'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => { setConfirmOpen(false); reset(); }}
                            style={[styles.confirmBtn, styles.confirmBtnDanger]}
                        >
                            <Text style={[styles.confirmBtnText, styles.confirmBtnDangerText]}>{t('common.reset')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // תצוגה אחידה בכל המכשירים (כמו בטלפון), ללא פיצול פאנלים
    return (
        <SafeAreaView
            style={[styles.screen, { flex: 1, backgroundColor: palette.screen, direction: isRTL ? 'rtl' : 'ltr' }]}
            edges={['top']}
        >
            <Header title={t('prog.header')} start={<StartHeaderButtons />} />

            <ScrollView
                {...noBounceProps}
                contentContainerStyle={{ paddingBottom: EXTRA_BOTTOM_PX, direction: pageDir }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.statsRow}>
                    <Stat title={t('prog.strong')} value={`${strong.length}/${total}`} color={palette.success} />
                    <Stat title={t('prog.mid')} value={`${mid.length}/${total}`} color={palette.primary} />
                    <Stat title={t('prog.need')} value={`${need.length}/${total}`} color={palette.danger} />
                </View>

                <View className="section" style={styles.section}>
                    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', writingDirection: pageDir }]}>
                        {t('prog.need')}
                    </Text>
                    {need.map(i => (
                        <View key={i.id} style={[styles.rowItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text
                                style={[
                                    styles.rowName,
                                    { textAlign: isRTL ? 'right' : 'left', writingDirection: pageDir }
                                ]}
                            >
                                {labelFor(i, 'names', lang)}
                            </Text>
                            <Text style={styles.rowVal}>{formatVal(i.value)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', writingDirection: pageDir }]}>
                        {t('prog.mid')}
                    </Text>
                    {mid.map(i => (
                        <View key={i.id} style={[styles.rowItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text
                                style={[
                                    styles.rowName,
                                    { textAlign: isRTL ? 'right' : 'left', writingDirection: pageDir }
                                ]}
                            >
                                {labelFor(i, 'names', lang)}
                            </Text>
                            <Text style={styles.rowVal}>{formatVal(i.value)}</Text>
                        </View>
                    ))}
                </View>

                <View style={[styles.section, { paddingBottom: 12 }]}>
                    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', writingDirection: pageDir }]}>
                        {t('prog.strong')}
                    </Text>
                    {strong.map(i => (
                        <View key={i.id} style={[styles.rowItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text
                                style={[
                                    styles.rowName,
                                    { textAlign: isRTL ? 'right' : 'left', writingDirection: pageDir }
                                ]}
                            >
                                {labelFor(i, 'names', lang)}
                            </Text>
                            <Text style={styles.rowVal}>{formatVal(i.value)}</Text>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[
                            styles.secondaryBtn,
                            { alignSelf: isRTL ? 'flex-end' : 'flex-start', marginTop: 10 }
                        ]}
                        onPress={() => setConfirmOpen(true)}
                    >
                        {/* פונקציה: KeyTile */}
                        <Ionicons name="trash" size={16} color={palette.danger} />
                        <Text style={[styles.secondaryBtnText, { color: palette.danger }]}>{t('common.reset')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {ConfirmResetModal}
        </SafeAreaView>
    );
}



function KeyTile({ item, isRTL, lang, repMode, onPress,
    nameFontSize = 14,
    nameLineHeight = 18,
    keyHeight = 98,
    valueHeight = 28,
    kbGap = 8,
    keyWidth }) {
    const [lineCount, setLineCount] = React.useState(1);

    const isSpecialHeLong =
        lang === 'he' && item.nameHe === 'דאבל סלטה אחורה בגוף ישר עם שפגאט';
    const isSymbols = repMode === 'symbols';

    const displayLabel = isSymbols
        ? (item.symbol || '')
        : (isSpecialHeLong
            ? 'דאבל סלטה\nאחורה בגוף\nישר עם שפגאט'
            : keyLabelFor(item, repMode, lang));

    const onTextLayout = (e) => {
        const n = Math.min(3, (e?.nativeEvent?.lines || []).length || 1);
        if (n !== lineCount) setLineCount(n);
    };

    return (
        <TouchableOpacity onPress={onPress} style={[styles.keyBtn, isSymbols && styles.keyBtnSymbols, repMode === 'symbols' && styles.keyBtnSymbols,]}>
            <View style={[styles.keyBtnInner, isSymbols && styles.keyBtnInnerSymbols]}>
                <View style={[styles.labelWrap, isSymbols && styles.labelWrapSymbols]}>
                    <Text
                        onTextLayout={onTextLayout}
                        style={[
                            styles.keyLabel,
                            isSymbols
                                ? [
                                    styles.keyLabelSymbol,
                                    Platform.select({
                                        ios: { fontFamily: 'Menlo' },
                                        android: { fontFamily: 'monospace' },
                                    }),
                                ]
                                : { writingDirection: isRTL ? 'rtl' : 'ltr' },
                            isSpecialHeLong && styles.keyLabelLong,
                        ]}
                        numberOfLines={3}
                        adjustsFontSizeToFit
                        minimumFontScale={0.65}
                        ellipsizeMode="tail"
                    >
                        {displayLabel}
                    </Text>
                </View>

                {/* פונקציה: valueOfElementId */}
                <Text style={[styles.keyValue, isSymbols && styles.keyValueSymbols]}>
                    {formatVal(item.value)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

/* =========================
// --- פונקציה: normalizeTrackKey ---
   Bonus rules (same as tariffExport.js)
   ========================= */

// שליפת ערך אלמנט לפי id מתוך ELEMENTS
function valueOfElementId(id, ELEMENTS) {
    if (!id || !Array.isArray(ELEMENTS)) return null;
    const el = ELEMENTS.find(e => e && e.id === id);
    return (el && typeof el.value === 'number') ? el.value : null;
}

// נירמול מסלול (עברית/אנגלית)
function normalizeTrackKey(v) {
    const s = String(v ?? '').trim().toLowerCase();
    if (!s) return null;
    if (s === 'league') return 'league';
    // --- פונקציה: normalizeLeagueLevel ---
    if (s === 'national') return 'national';
    if (s === 'international') return 'international';
    if (s.includes('ליגה')) return 'league';
    if (s.startsWith('לאומ')) return 'national';          // לאומי/לאומית
    if (s.startsWith('בינלאומ')) return 'international';  // בינלאומי/בינלאומית
    return null;
}

// נירמול דרגת ליגה (מספרים→אותיות; אות לא מזוהה→"א")
function normalizeLeagueLevel(lv) {
    if (lv == null) return 'א';
    // --- פונקציה: normalizeGender ---
    const s = String(lv).trim();
    if (/^\d+$/.test(s)) {
        const n = parseInt(s, 10);
        if (n === 4) return 'ד';
        if (n === 3) return 'ג';
        if (n === 2) return 'ב';
        // --- פונקציה: calcPassValues ---
        return 'א';
    }
    if (s.includes('ד')) return 'ד';
    if (s.includes('ג')) return 'ג';
    if (s.includes('ב')) return 'ב';
    return 'א';
}

// נירמול מגדר
function normalizeGender(g) {
    const s = String(g ?? '').trim().toUpperCase();
    return s === 'F' ? 'F' : 'M';
}

/**
 * מחזירה מערך ערכי קושי לכל תא (או null אם התא ריק)
 */
export function calcPassValues(passIds = [], { ELEMENTS, passLimit = 8 } = {}) {
    const out = Array.from({ length: passLimit }).map(() => null);
    for (let i = 0; i < passLimit; i++) {
        const id = passIds[i];
        if (!id) { out[i] = null; continue; }
        out[i] = valueOfElementId(id, ELEMENTS);
    }
    return out;
}

/**
 * חישוב בונוסים לפי החוקים של tariffExport.js
 *
 * פרמטרים:
 * - passIds:  מערך ה־id-ים בפס (אורך ≤ passLimit)
 * - options:
 *    - autoBonus:   האם להציג/לחשב בונוסים (אם false → null בתאים → יופיע "—")
// --- פונקציה: calcPassBonuses ---
 *    - track:       'league' | 'national' | 'international' או בעברית
 *    - level:       דרגת ליגה (א/ב/ג/ד או 1/2/3/4)
 *    - gender:      'M' | 'F'
 *    - passLimit:   5 בליגה, אחרת 8 (ברירת מחדל 8)
 *    - ELEMENTS:    מערך האלמנטים לצורך קריאת value
 *
 * מחזירה:
 *  מערך באורך passLimit – null לתאים ריקים, מספרים לתאים מאוישים (0/0.3/0.4/1.0)
 */
export function calcPassBonuses(
    passIds = [],
    {
        autoBonus = true,
        track = 'league',
        level = 'א',
        gender = 'M',
        passLimit = 8,
        ELEMENTS = [],
    } = {}
) {
    // אם Auto Bonus כבוי – לא מציגים ערכים (null → "—")
    if (!autoBonus) return Array.from({ length: passLimit }).map(() => null);

    const tKey = normalizeTrackKey(track);
    const lv = normalizeLeagueLevel(level);
    const g = normalizeGender(gender);

    const out = Array.from({ length: passLimit }).map(() => null);
    const presentCount = (passIds || []).slice(0, passLimit).filter(Boolean).length;

    if (!tKey) {
        // מסלול לא מזוהה – אפס/נאלים בהתאם לנוכחות
        for (let i = 0; i < passLimit; i++) out[i] = passIds[i] ? 0 : null;
        return out;
    }

    if (tKey === 'league') {
        // א: אין בונוס; ב: מ-5+, ג: מ-4+, ד: מ-3+ (כולם +0.3)
        // אינדקסים 0-based: 3→האלמנט ה-4, 4→ה-5 וכו'
        const startIdxByLevel = { 'א': Infinity, 'ב': 4, 'ג': 3, 'ד': 2 };
        const startIdx = startIdxByLevel[lv] ?? Infinity;

        for (let i = 0; i < passLimit; i++) {
            if (!passIds[i]) { out[i] = null; continue; }
            out[i] = (i >= startIdx && i < presentCount) ? 0.3 : 0;
        }
        return out;
    }

    if (tKey === 'national') {
        // לאומי: רק לאלמנטים 6–8 אם קיימים: 6→0.3, 7→0.3, 8→0.4
        for (let i = 0; i < passLimit; i++) {
            if (!passIds[i]) { out[i] = null; continue; }
            if (i === 5 && presentCount >= 6) out[i] = 0.3;
            else if (i === 6 && presentCount >= 7) out[i] = 0.3;
            else if (i === 7 && presentCount >= 8) out[i] = 0.4;
            else out[i] = 0;
        }
        return out;
    }

    // international
    {
        const threshold = (g === 'F') ? 2.0 : 4.4;
        let qualifiedSeen = 0;

        for (let i = 0; i < passLimit; i++) {
            const id = passIds[i];
            if (!id) { out[i] = null; continue; }

            const v = valueOfElementId(id, ELEMENTS);
            // --- פונקציה: TariffScreen ---
            const qualifies = typeof v === 'number' && v >= threshold;
            if (qualifies && i < presentCount) {
                qualifiedSeen += 1;
                out[i] = (qualifiedSeen >= 2) ? 1.0 : 0.0; // רק מהשני שעובר סף
            } else {
                out[i] = 0.0;
            }
        }
        return out;
    }
}


// ---------- Tariff (uses unified keyboard) ----------
function TariffScreen() {
    const { repMode, toggleRepMode } = useProgress();
    const { t, lang, isRTL, allowIllegalExport } = usePrefs();

    // === שליטה באזור ההדבקה (כולל תיקון ריצוד) ===
    const STICKY_TOP_OFFSET_PX = 0;
    const STICKY_ATTACH_EARLY_PX = -78;
    const STICKY_DETACH_UP_PX = -102;

    // סוף העמוד (אפשר לשנות): כמה פיקסלים אחרי/לפני הכפתור האחרון ברשימה
    const PAGE_END_PX = 0;

    // כמה פיקסלים של "רווח" קבוע בסוף העמוד ל־FlatList (משאיר כמו אצלך)
    const EXTRA_BOTTOM_PX = 8;
    const pageDir = 'ltr';

    // ===== טופס/שדות =====
    const [country, setCountry] = useState('IL');
    const [countryOpen, setCountryOpen] = useState(false);
    const [gymnast, setGymnast] = useState('');
    const [club, setClub] = useState('');
    const [level, setLevel] = useState(null);
    const [compNo, setCompNo] = useState('');
    const [round, setRound] = useState('');
    const [gender, setGender] = useState(null);
    const [track, setTrack] = useState(null);
    const [autoBonus, setAutoBonus] = useState(true);
    const listRef = useRef(null);

    // פסים
    const [pass1, setPass1] = useState([]);
    const [pass2, setPass2] = useState([]);
    const [activePass, setActivePass] = useState(null); // 1 | 2 | null
    const legality = React.useMemo(
        () => validatePasses(pass1, pass2, lang),
        [pass1, pass2, lang]
    );

    // “צריך לבחור פס קודם” (טוסט קצר)
    const [needPass, setNeedPass] = useState(false);
    const needPassTimerRef = useRef(null);
    useEffect(() => () => { if (needPassTimerRef.current) clearTimeout(needPassTimerRef.current); }, []);
    const showNeedPassMsg = () => {
        setNeedPass(true);
        if (needPassTimerRef.current) clearTimeout(needPassTimerRef.current);
        needPassTimerRef.current = setTimeout(() => setNeedPass(false), 1400);
    };
    const requirePass = () => { if (!activePass) { showNeedPassMsg(); return false; } return true; };

    // ייצוא PDF
    const [dlg, setDlg] = useState({ open: false, uri: null, localUri: null });
    const [illegalDlgOpen, setIllegalDlgOpen] = useState(false);

    const exportPdf = async () => {
        const proceed = async () => {
            try {
                const storageDirUri = Platform.OS === 'android' ? await pickAndCacheTariffDirOnce() : null;
                const { uri, localUri } = await exportTariffPDF({
                    lang,
                    form: {
                        athleteName: gymnast,
                        club,
                        gender,
                        track,
                        level,
                        athleteNo: compNo,
                        rotation: round,
                        country,
                        autoBonus,
                    },
                    pass1, pass2, elements: ELEMENTS,
                    fileName: `${lang === 'he' ? 'דף טריף' : 'Tariff'} - ${gymnast || 'Athlete'}.pdf`,
                    share: false,
                    storageDirUri,
                });
                setDlg({ open: true, uri: uri || localUri, localUri });
            } catch (e) {
                console.warn('PDF export failed', e);
                Alert.alert(lang === 'he' ? 'שגיאת ייצוא' : 'Export Error', e?.message || String(e));
            }
        };

        if (!legality.isLegal) {
            if (!allowIllegalExport) return;
            setIllegalDlgOpen(true);
            return;
        }
        await proceed();
    };

    const openPdf = async (u) => {
        if (!u) return;
        try {
            if (Platform.OS === 'android') {
                const contentUri = u.startsWith('file://') ? await FileSystem.getContentUriAsync(u) : u;
                const READ = 1;
                try {
                    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: contentUri, type: 'application/pdf', flags: READ });
                } catch {
                    await IntentLauncher.startActivityAsync('android.intent.action.SEND', { type: 'application/pdf', flags: READ, extra: { 'android.intent.extra.STREAM': contentUri } });
                }
            } else {
                const ok = await Linking.openURL(u).catch(() => false);
                if (ok === false) {
                    const can = await Sharing.isAvailableAsync();
                    if (can && u) await Sharing.shareAsync(u, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
                }
            }
        } catch (e) {
            Alert.alert(lang === 'he' ? 'שגיאה' : 'Error', e?.message || String(e));
        }
    };

    // איפוס עמוד
    const resetPage = () => {
        Keyboard.dismiss();
        setGymnast(''); setClub('');
        setGender(null); setTrack(null); setLevel(null);
        setCompNo(''); setRound(''); setCountry('IL');
        setPass1([]); setPass2([]); setActivePass(null);
        try { listRef.current?.scrollToOffset?.({ offset: 0, animated: true }); } catch { }
    };

    // עוזרי UI
    const { width: screenW } = Dimensions.get('window');
    const OUTER = 16, INNER = 14, GAP = 6;
    const frameW = screenW - OUTER * 2;
    const slotW = (w => Math.floor((w - INNER * 2 - GAP * 7) / 8) - 1)(frameW);
    const inputPropsCommon = { blurOnSubmit: false, autoCorrect: false, autoCapitalize: 'none', underlineColorAndroid: 'transparent', importantForAutofill: 'no' };

    // מדינות
    const COUNTRIES = [
        { k: 'IL', he: 'ישראל', en: 'Israel', flag: '🇮🇱' },
        { k: 'GB', he: 'בריטניה', en: 'United Kingdom', flag: '🇬🇧' },
        { k: 'US', he: 'ארצות הברית', en: 'United States', flag: '🇺🇸' },
        { k: 'RU', he: 'רוסיה', en: 'Russia', flag: '🇷🇺' },
        { k: 'UA', he: 'אוקראינה', en: 'Ukraine', flag: '🇺🇦' },
        { k: 'CN', he: 'סין', en: 'China', flag: '🇨🇳' },
    ];
    const curCountry = COUNTRIES.find(c => c.k === country) || COUNTRIES[0];
    const countryName = lang === 'he' ? curCountry.he : (lang === 'en' ? (curCountry.k === 'IL' ? 'Israel' : curCountry.en) : curCountry.en);

    const passLimit = useMemo(() => (track === 'league' ? 5 : 8), [track]);
    const rowDir = repMode === 'symbols' ? 'row' : (isRTL ? 'row-reverse' : 'row');
    const isIsrael = country === 'IL';
    const showAutoBonus = isIsrael;

    // פעולות מקלדת לפסים
    const addElement = (id) => {
        if (!requirePass()) return;
        const arr = activePass === 1 ? pass1 : pass2;
        if (arr.length >= passLimit) return;
        (activePass === 1 ? setPass1 : setPass2)([...arr, id]);
    };
    const deleteLast = () => {
        if (!requirePass()) return;
        const arr = activePass === 1 ? pass1 : pass2;
        if (!arr.length) return;
        (activePass === 1 ? setPass1 : setPass2)(arr.slice(0, -1));
    };
    const clearAll = () => {
        if (!requirePass()) return;
        if (activePass === 1) setPass1([]); else setPass2([]);
    };

    // תווית בסלוט
    const boxLabel = (idOrNull) => {
        if (!idOrNull) return '—';
        const el = ELEMENTS.find(e => e.id === idOrNull);
        if (!el) return '—';
        return repMode === 'symbols' ? el.symbol : (lang === 'he' ? el.nameHe : el.nameEn);
    };

    // ------ קומפוננטות שורה (קושי/בונוס) ------
    const safeFormatVal = (v) => {
        if (typeof formatVal === 'function') return formatVal(v);
        if (typeof v === 'number') return (Math.round(v * 100) / 100).toString();
        return String(v);
    };

    // שורת דרגת קושי
    const PassValuesRow = ({ ids, limit }) => {
        const n = Math.max(limit ?? ids.length, 1);
        const cellW = (Dimensions.get('window').width - 16 * 2 - 14 * 2 - 6 * (n - 1)) / n - 1;
        const vals = calcPassValues(
            Array.from({ length: n }).map((_, i) => ids[i] || null),
            { ELEMENTS, passLimit: n }
        );
        return (
            <View style={{ flexDirection: rowDir, justifyContent: 'space-between', gap: 6, marginTop: 6 }}>
                {Array.from({ length: n }).map((_, i) => (
                    <View key={i} style={[styles.slotBox, styles.slotBoxSmall, { width: cellW }]}>
                        <Text style={styles.slotValue} numberOfLines={1}>
                            {typeof vals[i] === 'number' ? safeFormatVal(vals[i]) : '—'}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    // שורת בונוסים
    const PassBonusRow = ({ ids, limit }) => {
        if (!(autoBonus && showAutoBonus)) return null;
        const n = Math.max(limit ?? ids.length, 1);
        const cellW = (Dimensions.get('window').width - 16 * 2 - 14 * 2 - 6 * (n - 1)) / n - 1;
        const bonuses = calcPassBonuses(
            Array.from({ length: n }).map((_, i) => ids[i] || null),
            { autoBonus: true, track, level, gender, passLimit: n, ELEMENTS }
        );
        return (
            <View style={{ flexDirection: rowDir, justifyContent: 'space-between', gap: 6, marginTop: 4 }}>
                {Array.from({ length: n }).map((_, i) => (
                    <View key={i} style={[styles.slotBox, styles.slotBoxSmall, { width: cellW }]}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#7DD3FC' }} numberOfLines={1}>
                            {typeof bonuses[i] === 'number' ? safeFormatVal(bonuses[i]) : '—'}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    // קומפ’ אזהרות קטנה
    const WarningList = ({ msgs, top = 6 }) => {
        if (!Array.isArray(msgs) || msgs.length === 0) return null;
        return (
            <View style={{ marginTop: top, paddingHorizontal: 4, gap: 4 }}>
                {msgs.map((m, i) => (
                    <View key={i} style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="warning-outline" size={18} color={palette.gold} />
                        <Text style={{ color: palette.gold, fontSize: 12, fontWeight: '800', textAlign: isRTL ? 'right' : 'left', flexShrink: 1 }}>
                            {m}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    // ===== דבוק-למעלה (מדידות/סטייט) =====
    const [scrollY, setScrollY] = useState(0);
    const [headerH, setHeaderH] = useState(0);

    // pass1
    const [p1WrapY, setP1WrapY] = useState(0);
    const [p1SymRelY, setP1SymRelY] = useState(0);
    const [p1SymH, setP1SymH] = useState(0);

    // pass2
    const [p2WrapY, setP2WrapY] = useState(0);
    const [p2SymRelY, setP2SymRelY] = useState(0);
    const [p2SymH, setP2SymH] = useState(0);

    const p1SymAbsY = p1WrapY + p1SymRelY;
    const p2SymAbsY = p2WrapY + p2SymRelY;

    // היסטרזיס דביקות
    const [sticky1Vis, setSticky1Vis] = useState(false);
    const [sticky2Vis, setSticky2Vis] = useState(false);

    // מעקב כיוון גלילה + סינון תת־פיקסלים
    const lastYRef = useRef(0);
    const dirRef = useRef('down'); // 'up' | 'down'

    useEffect(() => {
        const y = Math.round(scrollY);
        const prev = lastYRef.current;
        const dir = y > prev ? 'down' : (y < prev ? 'up' : dirRef.current);
        lastYRef.current = y;
        dirRef.current = dir;

        const topEdge = y + headerH;

        // ספי הצמדה/שחרור לכל פס
        const attach1 = p1SymAbsY - STICKY_ATTACH_EARLY_PX;
        const detach1 = p1SymAbsY - STICKY_DETACH_UP_PX;
        const attach2 = p2SymAbsY - STICKY_ATTACH_EARLY_PX;
        const detach2 = p2SymAbsY - STICKY_DETACH_UP_PX;

        // פס 1
        if (activePass === 1 && p1SymAbsY > 0) {
            if (!sticky1Vis && dir === 'down' && topEdge >= attach1) setSticky1Vis(true);
            else if (sticky1Vis && dir === 'up' && topEdge <= detach1) setSticky1Vis(false);
        } else {
            if (sticky1Vis) setSticky1Vis(false);
        }

        // פס 2
        if (activePass === 2 && p2SymAbsY > 0) {
            if (!sticky2Vis && dir === 'down' && topEdge >= attach2) setSticky2Vis(true);
            else if (sticky2Vis && dir === 'up' && topEdge <= detach2) setSticky2Vis(false);
        } else {
            if (sticky2Vis) setSticky2Vis(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scrollY, headerH, activePass, p1SymAbsY, p2SymAbsY, STICKY_ATTACH_EARLY_PX, STICKY_DETACH_UP_PX]);

    const sticky1Visible = sticky1Vis;
    const sticky2Visible = sticky2Vis;
    const stickyVisible = sticky1Visible || sticky2Visible;

    // אילו מזהים מוצגים בדביקה
    const stickyIds = sticky1Visible ? pass1 : sticky2Visible ? pass2 : [];
    const stickyIllegal = sticky1Visible ? (legality?.p1?.badIdx || []) : sticky2Visible ? (legality?.p2?.badIdx || []) : [];

    // הסתרת השורה המקורית בזמן הדבקה
    const hideP1Original = sticky1Visible;
    const hideP2Original = sticky2Visible;

    // ===== Footer צף לכל אורך הגלילה (ללא רקע) =====
    const [atBottom, setAtBottom] = useState(false);

    // כפתורי ייצוא/איפוס בתחתית (כבר קיים — בלי שינוי)
    const FooterActions = () => (
        <View style={{ paddingHorizontal: 12, marginTop: 14, marginBottom: 28 }}>
            <TouchableOpacity
                onPress={withDismiss(exportPdf)}
                style={[styles.primaryBtn, !legality.isLegal && !allowIllegalExport && { opacity: 0.5 }]}
                disabled={!legality.isLegal && !allowIllegalExport}
            >
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>{lang === 'he' ? 'ייצוא ל-PDF' : 'Export PDF'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={withDismiss(resetPage)}
                style={{ backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 }}
                accessibilityLabel={lang === 'he' ? 'אפס עמוד' : 'Reset page'}
            >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                    {lang === 'he' ? 'אפס עמוד' : 'Reset page'}
                </Text>
            </TouchableOpacity>

            {(!legality.isLegal && !allowIllegalExport) && (
                <View style={[styles.warnBox, { alignSelf: 'stretch', marginTop: 8 }, isRTL ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' }]}>
                    <Ionicons name="warning-outline" size={18} color={palette.gold} />
                    <Text
                        style={[
                            styles.warnText,
                            lang === 'he' ? { writingDirection: 'rtl', textAlign: 'right', flex: 1 } : { writingDirection: 'ltr', textAlign: 'left', flex: 1 },
                        ]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                    >
                        {lang === 'he' ? 'הפסים אינם חוקיים' : 'Passes are illegal'}
                    </Text>
                </View>
            )}
        </View>
    );

    // Header של הרשימה – כל הטופס/כפתורים/פסים (לוגיקה ללא שינוי)
    const ListHeader = (
        <View style={styles.section}>
            {/* ---- מדינה + בונוס ---- */}
            <View style={{ marginTop: 4 }}>
                <Text style={[styles.tarLabel, isRTL ? styles.rtl : styles.ltr, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
                    {lang === 'he' ? 'מדינה' : 'State'}
                </Text>

                <View style={[styles.tarCountryBar, { justifyContent: isRTL ? 'flex-end' : 'flex-start' }]}>
                    {lang === 'en' ? (
                        <>
                            {/* כפתור המדינה */}
                            <View style={[styles.countryWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                                {(() => {
                                    const chevPadStyle = isRTL ? { paddingLeft: 28 } : { paddingRight: 28 };
                                    const chevPosStyle = isRTL ? { left: 6 } : { right: 6 };
                                    return (
                                        <>
                                            <TouchableOpacity
                                                onPress={withDismiss(() => setCountryOpen(o => !o))}
                                                activeOpacity={0.9}
                                                style={[styles.countryCurrent, { flexDirection: isRTL ? 'row-reverse' : 'row' }, chevPadStyle]}
                                            >
                                                <Text style={styles.countryFlag}>{curCountry.flag}</Text>
                                                <Text
                                                    style={[styles.countryText, { writingDirection: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }]}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >
                                                    {countryName}
                                                </Text>
                                                <View style={[styles.countryChevronWrap, chevPosStyle]}>
                                                    <Ionicons name={countryOpen ? 'chevron-up' : 'chevron-down'} size={16} color={palette.text} />
                                                </View>
                                            </TouchableOpacity>

                                            {countryOpen && (
                                                <View style={[styles.countryDropdownOverlay, isRTL ? { right: 0 } : { left: 0 }]}>
                                                    <View style={styles.countryDropdown}>
                                                        {COUNTRIES.filter(c => c.k !== country).map(op => (
                                                            <TouchableOpacity
                                                                key={op.k}
                                                                onPress={() => { setCountry(op.k); setCountryOpen(false); }}
                                                                style={[styles.countryOption, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                                            >
                                                                <Text style={styles.countryFlag}>{op.flag}</Text>
                                                                <Text
                                                                    style={[styles.countryText, { writingDirection: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }]}
                                                                    numberOfLines={1}
                                                                    ellipsizeMode="tail"
                                                                >
                                                                    {lang === 'he' ? op.he : op.en}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </View>
                                            )}
                                        </>
                                    );
                                })()}
                            </View>

                            {/* בונוס (אם ישראל) */}
                            {showAutoBonus && (
                                <TouchableOpacity
                                    onPress={withDismiss(() => setAutoBonus(v => !v))}
                                    style={[styles.autoBonusWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name={autoBonus ? 'checkbox-outline' : 'square-outline'} size={20} color={autoBonus ? palette.primary : palette.muted} />
                                    <Text style={styles.tarInlineLabel} numberOfLines={1} ellipsizeMode="tail">
                                        {lang === 'he' ? 'חישוב בונוס אוטומטי' : 'Auto Bonus Calculation'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <>
                            {/* בעברית — קודם הבונוס, ואז כפתור המדינה */}
                            {showAutoBonus && (
                                <TouchableOpacity
                                    onPress={() => setAutoBonus(v => !v)}
                                    style={[styles.autoBonusWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name={autoBonus ? 'checkbox-outline' : 'square-outline'} size={20} color={autoBonus ? palette.primary : palette.muted} />
                                    <Text style={styles.tarInlineLabel} numberOfLines={1} ellipsizeMode="tail">
                                        {lang === 'he' ? 'חישוב בונוס אוטומטי' : 'Auto bonus calculation'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <View style={[styles.countryWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                                {(() => {
                                    const chevPadStyle = isRTL ? { paddingLeft: 28 } : { paddingRight: 28 };
                                    const chevPosStyle = isRTL ? { left: 6 } : { right: 6 };
                                    return (
                                        <>
                                            <TouchableOpacity
                                                onPress={withDismiss(() => setCountryOpen(o => !o))}
                                                activeOpacity={0.9}
                                                style={[styles.countryCurrent, { flexDirection: isRTL ? 'row-reverse' : 'row' }, chevPadStyle]}
                                            >
                                                <Text style={styles.countryFlag}>{curCountry.flag}</Text>
                                                <Text
                                                    style={[styles.countryText, { writingDirection: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }]}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >
                                                    {countryName}
                                                </Text>
                                                <View style={[styles.countryChevronWrap, chevPosStyle]}>
                                                    <Ionicons name={countryOpen ? 'chevron-up' : 'chevron-down'} size={16} color={palette.text} />
                                                </View>
                                            </TouchableOpacity>

                                            {countryOpen && (
                                                <View style={[styles.countryDropdownOverlay, isRTL ? { right: 0 } : { left: 0 }]}>
                                                    <View style={styles.countryDropdown}>
                                                        {COUNTRIES.filter(c => c.k !== country).map(op => (
                                                            <TouchableOpacity
                                                                key={op.k}
                                                                onPress={withDismiss(() => { setCountry(op.k); setCountryOpen(false); })}
                                                                style={[styles.countryOption, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                                            >
                                                                <Text style={styles.countryFlag}>{op.flag}</Text>
                                                                <Text
                                                                    style={[styles.countryText, { writingDirection: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }]}
                                                                    numberOfLines={1}
                                                                    ellipsizeMode="tail"
                                                                >
                                                                    {lang === 'he' ? op.he : op.en}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </View>
                                            )}
                                        </>
                                    );
                                })()}
                            </View>
                        </>
                    )}
                </View>
            </View>

            {/* כשישראל לא נבחרה – הודעת "בקרוב" */}
            {!isIsrael && (
                <View style={styles.comingSoonCard}>
                    <Text style={styles.comingSoonText}>
                        {lang === 'he' ? 'בקרוב יגיע !' : 'Coming Soon !'}
                    </Text>
                </View>
            )}

            {/* שאר הטופס – כשישראל */}
            {isIsrael && (
                <>
                    {/* שם / אגודה */}
                    <View style={[styles.tarRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.tarCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.tarLabel, isRTL ? styles.rtl : styles.ltr]}>
                                {lang === 'he' ? 'שם המתעמל/ת' : 'Gymnast Name'}
                            </Text>
                            <TextInput
                                value={gymnast}
                                onChangeText={setGymnast}
                                style={[styles.tarInputWide, isRTL ? styles.rtl : styles.ltr, { alignSelf: 'stretch' }]}
                                placeholder=""
                                placeholderTextColor={palette.muted}
                                multiline={false}
                                numberOfLines={1}
                                returnKeyType="done"
                                {...inputPropsCommon}
                            />
                        </View>

                        <View style={[styles.tarCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.tarLabel, isRTL ? styles.rtl : styles.ltr]}>
                                {lang === 'he' ? 'אגודה' : 'Club'}
                            </Text>
                            <TextInput
                                value={club}
                                onChangeText={setClub}
                                style={[styles.tarInputWide, isRTL ? styles.rtl : styles.ltr, { alignSelf: 'stretch' }]}
                                placeholder=""
                                placeholderTextColor={palette.muted}
                                multiline={false}
                                numberOfLines={1}
                                returnKeyType="done"
                                {...inputPropsCommon}
                            />
                        </View>
                    </View>

                    {/* מספר / סבב / מגדר */}
                    <View style={[styles.tarRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.tarColSmall, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.tarLabel, isRTL ? styles.rtl : styles.ltr]}>
                                {lang === 'he' ? 'מספר מתעמל' : 'Gymnast Number'}
                            </Text>
                            <TextInput
                                value={compNo}
                                onChangeText={(v) => /^\d{0,3}$/.test(v) && setCompNo(v)}
                                style={[styles.tarInputSmall, { alignSelf: isRTL ? 'flex-end' : 'flex-start', textAlign: 'center' }]}
                                keyboardType="number-pad"
                                returnKeyType="done"
                                {...inputPropsCommon}
                            />
                        </View>

                        <View style={[styles.tarColSmall, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.tarLabel, isRTL ? styles.rtl : styles.ltr]}>
                                {lang === 'he' ? 'סבב' : 'Round'}
                            </Text>
                            <TextInput
                                value={round}
                                onChangeText={(v) => /^\d{0,2}$/.test(v) && setRound(v)}
                                style={[styles.tarInputSmall, { alignSelf: isRTL ? 'flex-end' : 'flex-start', textAlign: 'center' }]}
                                keyboardType="number-pad"
                                returnKeyType="done"
                                {...inputPropsCommon}
                            />
                        </View>

                        <View style={[styles.tarCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.tarLabel, isRTL ? styles.rtl : styles.ltr]}>
                                {lang === 'he' ? 'מגדר' : 'Gender'}
                            </Text>
                            <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row', alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
                                {['M', 'F'].map(g => (
                                    <TouchableOpacity
                                        key={g}
                                        onPress={withDismiss(() => setGender(cur => (cur === g ? null : g)))}
                                        style={[styles.pill, gender === g && { backgroundColor: palette.primary }]}
                                    >
                                        <Text style={[styles.pillText, gender === g && { color: '#fff' }]}>{g}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* מסלול */}
                    <View style={[styles.tarRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.tarCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.tarLabel, isRTL ? styles.rtl : styles.ltr]}>
                                {lang === 'ה' ? 'מסלול' : 'Track'}
                            </Text>
                            <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row', alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
                                {[
                                    { k: 'league', he: 'ליגה', en: 'League' },
                                    { k: 'national', he: 'לאומי', en: 'National' },
                                    { k: 'international', he: 'בינלאומי', en: 'International' },
                                ].map(op => (
                                    <TouchableOpacity
                                        key={op.k}
                                        onPress={withDismiss(() => setTrack(cur => { const next = (cur === op.k ? null : op.k); setLevel(null); return next; }))}
                                        style={[styles.pill, track === op.k && { backgroundColor: palette.primary }]}
                                    >
                                        <Text style={[styles.pillText, track === op.k && { color: '#fff' }]}>{lang === 'he' ? op.he : op.en}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* דרגה */}
                    {track && (
                        <View style={[styles.tarRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <View style={[styles.tarCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                                <Text style={[styles.tarLabel, isRTL ? styles.rtl : styles.ltr]}>
                                    {lang === 'he' ? 'דרגה' : 'Level'}
                                </Text>
                                <View
                                    style={[
                                        styles.row,
                                        {
                                            flexWrap: 'wrap',
                                            gap: 6,
                                            flexDirection: (track === 'international' ? 'row' : (isRTL ? 'row-reverse' : 'row')),
                                            alignSelf: isRTL ? 'flex-end' : 'flex-start',
                                        },
                                    ]}
                                >
                                    {(track === 'league'
                                        ? ['א', 'ב', 'ג', 'ד']
                                        : track === 'national'
                                            ? ['1', '2', '3', '4', '5']
                                            : ['Age 1', 'Age 2', 'Junior', 'Age 3', 'Senior']
                                    ).map(lv => (
                                        <TouchableOpacity
                                            key={lv}
                                            onPress={() => setLevel(cur => (cur === lv ? null : lv))}
                                            style={[styles.pill, level === lv && { backgroundColor: palette.primary }]}
                                        >
                                            <Text style={[styles.pillText, level === lv && { color: '#fff' }]}>{lv}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ===== פס 1 ===== */}
                    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', marginTop: 8 }]}>
                        {lang === 'he' ? 'פס 1' : 'Pass 1'}
                    </Text>

                    {/* עטיפה של פס 1 לצורך מדידה */}
                    <View onLayout={e => { setP1WrapY(e.nativeEvent.layout.y); }}>
                        {/* מלבן עליון – סימבולים בלבד (לחיץ) */}
                        <TouchableOpacity activeOpacity={0.9} onPress={withDismiss(() => setActivePass(p => (p === 1 ? null : 1)))}>
                            <View
                                onLayout={e => { setP1SymRelY(e.nativeEvent.layout.y); setP1SymH(e.nativeEvent.layout.height); }}
                                style={[
                                    styles.slotFrame,
                                    activePass === 1 && styles.slotFrameActive,
                                    { alignSelf: 'stretch', paddingHorizontal: 14 },
                                    hideP1Original && { opacity: 0 },
                                ]}
                            >
                                <View style={{ flexDirection: rowDir, justifyContent: 'space-between', gap: 6 }}>
                                    {Array.from({ length: passLimit }).map((_, i) => {
                                        const cellW = (Dimensions.get('window').width - 16 * 2 - 14 * 2 - 6 * (passLimit - 1)) / passLimit - 1;
                                        const isIllegalCell = Array.isArray(legality?.p1?.badIdx) && legality.p1.badIdx.includes(i);
                                        return (
                                            <View key={i} style={[styles.slotBox, { width: cellW }, isIllegalCell && { borderColor: palette.gold, borderWidth: 2 }]}>
                                                <Text
                                                    style={[
                                                        repMode === 'symbols'
                                                            ? [styles.slotSymbol, Platform.select({ ios: { fontFamily: 'Menlo' }, android: { fontFamily: 'monospace' } })]
                                                            : [styles.slotName, { writingDirection: isRTL ? 'rtl' : 'ltr' }, lang !== 'he' ? { textAlign: 'center', flexShrink: 2, fontSize: 7, lineHeight: 10 } : null],
                                                    ]}
                                                    numberOfLines={repMode === 'symbols' ? 1 : (lang === 'he' ? 1 : 2)}
                                                    adjustsFontSizeToFit={repMode === 'symbols'}
                                                    minimumFontScale={repMode === 'symbols' ? 0.6 : 1}
                                                >
                                                    {boxLabel(pass1[i])}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* מלבן תחתון – ערכים + בונוסים */}
                        <View style={[styles.slotFrame, { alignSelf: 'stretch', paddingHorizontal: 14, paddingVertical: 8, marginTop: 6 }]}>
                            <PassValuesRow ids={pass1} limit={passLimit} />
                            <PassBonusRow ids={pass1} limit={passLimit} />
                        </View>

                        <WarningList msgs={legality?.p1?.messages} top={6} />
                    </View>

                    {/* ===== פס 2 ===== */}
                    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', marginTop: 10 }]}>
                        {lang === 'he' ? 'פס 2' : 'Pass 2'}
                    </Text>

                    {/* עטיפה של פס 2 לצורך מדידה */}
                    <View onLayout={e => { setP2WrapY(e.nativeEvent.layout.y); }}>
                        {/* מלבן עליון – סימבולים בלבד (לחיץ) */}
                        <TouchableOpacity activeOpacity={0.9} onPress={withDismiss(() => setActivePass(p => (p === 2 ? null : 2)))}>
                            <View
                                onLayout={e => { setP2SymRelY(e.nativeEvent.layout.y); setP2SymH(e.nativeEvent.layout.height); }}
                                style={[
                                    styles.slotFrame,
                                    activePass === 2 && styles.slotFrameActive,
                                    { alignSelf: 'stretch', paddingHorizontal: 14 },
                                    hideP2Original && { opacity: 0 },
                                ]}
                            >
                                <View style={{ flexDirection: rowDir, justifyContent: 'space-between', gap: 6 }}>
                                    {Array.from({ length: passLimit }).map((_, i) => {
                                        const cellW = (Dimensions.get('window').width - 16 * 2 - 14 * 2 - 6 * (passLimit - 1)) / passLimit - 1;
                                        const isIllegalCell = Array.isArray(legality?.p2?.badIdx) && legality.p2.badIdx.includes(i);
                                        return (
                                            <View key={i} style={[styles.slotBox, { width: cellW }, isIllegalCell && { borderColor: palette.gold, borderWidth: 2 }]}>
                                                <Text
                                                    style={[
                                                        repMode === 'symbols'
                                                            ? [styles.slotSymbol, Platform.select({ ios: { fontFamily: 'Menlo' }, android: { fontFamily: 'monospace' } })]
                                                            : [styles.slotName, { writingDirection: isRTL ? 'rtl' : 'ltr' }, lang !== 'he' ? { textAlign: 'center', flexShrink: 2, fontSize: 7, lineHeight: 10 } : null],
                                                    ]}
                                                    numberOfLines={repMode === 'symbols' ? 1 : (lang === 'he' ? 1 : 2)}
                                                    adjustsFontSizeToFit={repMode === 'symbols'}
                                                    minimumFontScale={repMode === 'symbols' ? 0.6 : 1}
                                                >
                                                    {boxLabel(pass2[i])}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* מלבן תחתון – ערכים + בונוסים */}
                        <View style={[styles.slotFrame, { alignSelf: 'stretch', paddingHorizontal: 14, paddingVertical: 8, marginTop: 6 }]}>
                            <PassValuesRow ids={pass2} limit={passLimit} />
                            <PassBonusRow ids={pass2} limit={passLimit} />
                        </View>

                        <WarningList msgs={legality?.p2?.messages} top={6} />
                    </View>

                    <WarningList msgs={legality?.both?.messages} top={8} />

                    {/* מחיקה / איפוס */}
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 12, marginBottom: 8 }}>
                        <TouchableOpacity onPress={deleteLast} style={styles.secondaryBtn} activeOpacity={0.7}>
                            {lang === 'en' ? (
                                <>
                                    <Text style={styles.secondaryBtnText}>{t('common.deleteLast')}</Text>
                                    <Ionicons name="backspace-outline" size={16} color={palette.text} />
                                </>
                            ) : (
                                <>
                                    <Ionicons name="backspace-outline" size={16} color={palette.text} />
                                    <Text style={styles.secondaryBtnText}>{t('common.deleteLast')}</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={clearAll} style={styles.secondaryBtn} activeOpacity={0.7}>
                            {lang === 'en' ? (
                                <>
                                    <Text style={[styles.secondaryBtnText, { color: palette.danger }]}>{t('common.reset')}</Text>
                                    <Ionicons name="trash-outline" size={16} color={palette.danger} />
                                </>
                            ) : (
                                <>
                                    <Ionicons name="trash-outline" size={16} color={palette.danger} />
                                    <Text style={[styles.secondaryBtnText, { color: palette.danger }]}>{t('common.reset')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* === המקלדת האחודה === */}
                    <ElementsKeyboardUnified onPressElement={(id) => { if (requirePass()) addElement(id); }} />

                    {/* פעולות תחתונות (קיים) */}
                    <FooterActions />
                </>
            )}
        </View>
    );

    // ===== סטיילים ל-Footer הצף (ללא רקע/מסגרת/צל) =====
    const floatingFooterStyles = StyleSheet.create({
        wrap: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 120,
            pointerEvents: 'box-none',
        },
        bar: {
            marginHorizontal: 12,
            marginBottom: 12,
        },
        // סגנון בסיס אחיד לשני הכפתורים בפוטר הקבוע
        actionBtn: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
            paddingVertical: 14,
            paddingHorizontal: 12,
            borderRadius: 10,
        },
        // ביטול מרווח עליון אפשרי שמוגדר בתוך primaryBtn
        primaryFix: { marginTop: 0 },
        // רקע אדום לאיפוס
        resetBtn: { backgroundColor: '#dc2626' },
    });


    return (
        <SafeAreaView
            style={[styles.screen, { flex: 1, backgroundColor: palette.screen, direction: isRTL ? 'rtl' : 'ltr' }]}
            edges={['top']}
        >
            <View style={{ flex: 1, direction: pageDir }}>
                {/* Header עם מדידת גובה לצורך offset לשורה הדביקה */}
                <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
                    <Header
                        title={lang === 'he' ? 'טריף' : 'Tariff'}
                        start={<StartHeaderButtons />} end={
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity onPress={toggleRepMode} style={styles.modeToggle} accessibilityLabel={t('a11y.toggleRep')}>
                                    <Ionicons name={repMode === 'symbols' ? 'code-slash-outline' : 'reader-outline'} size={18} color={palette.text} />
                                </TouchableOpacity>
                            </View>
                        }
                    />
                </View>

                <FlatList
                    ref={listRef}
                    data={[]}
                    keyExtractor={(_, i) => String(i)}
                    keyboardShouldPersistTaps="always"
                    ListHeaderComponent={ListHeader}
                    onScroll={(e) => {
                        const y = e?.nativeEvent?.contentOffset?.y ?? 0;
                        setScrollY(y);
                        // מרחק מתחתית – כדי להסתיר את ה-Footer הצף כשמגיעים לתחתית
                        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent || {};
                        const distanceFromBottom =
                            (contentSize?.height || 0) - ((contentOffset?.y || 0) + (layoutMeasurement?.height || 0));
                        setAtBottom(distanceFromBottom <= 72);
                    }}
                    scrollEventThrottle={16}
                    {...(Platform.OS === 'ios'
                        ? { bounces: false, alwaysBounceVertical: false }
                        : { overScrollMode: 'never' })}
                    // סוף העמוד נשלט ע"י PAGE_END_PX (ברירת מחדל 0)
                    contentContainerStyle={{ direction: pageDir, paddingBottom: EXTRA_BOTTOM_PX + PAGE_END_PX }}
                    showsVerticalScrollIndicator={false}
                />

                {/* ===== שורת סימבולים "דביקה לאחר ההגעה" מתחת ל-Header ===== */}
                {stickyVisible && (
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            top: headerH + STICKY_TOP_OFFSET_PX,
                            left: OUTER,
                            right: OUTER,
                            zIndex: 50,
                        }}
                    >
                        <View style={[styles.slotFrame, { paddingHorizontal: 14, backgroundColor: palette.card }]}>
                            <View style={{ flexDirection: rowDir, justifyContent: 'space-between', gap: 6 }}>
                                {Array.from({ length: passLimit }).map((_, i) => {
                                    const cellW = (Dimensions.get('window').width - 16 * 2 - 14 * 2 - 6 * (passLimit - 1)) / passLimit - 1;
                                    const isIllegalCell = Array.isArray(stickyIllegal) && stickyIllegal.includes(i);
                                    return (
                                        <View key={i} style={[styles.slotBox, { width: cellW }, isIllegalCell && { borderColor: palette.gold, borderWidth: 2 }]}>
                                            <Text
                                                style={[
                                                    repMode === 'symbols'
                                                        ? [styles.slotSymbol, Platform.select({ ios: { fontFamily: 'Menlo' }, android: { fontFamily: 'monospace' } })]
                                                        : [styles.slotName, { writingDirection: isRTL ? 'rtl' : 'ltr' }, lang !== 'he' ? { textAlign: 'center', flexShrink: 2, fontSize: 7, lineHeight: 10 } : null],
                                                ]}
                                                numberOfLines={repMode === 'symbols' ? 1 : (lang === 'he' ? 1 : 2)}
                                                adjustsFontSizeToFit={repMode === 'symbols'}
                                                minimumFontScale={repMode === 'symbols' ? 0.6 : 1}
                                            >
                                                {boxLabel(stickyIds[i])}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                )}

                {/* ===== Footer צף — שקוף (ללא רקע) ===== */}
                <View pointerEvents="box-none" style={floatingFooterStyles.wrap}>
                    <Animated.View
                        style={[
                            floatingFooterStyles.bar,
                            { flexDirection: isRTL ? 'row-reverse' : 'row' },
                            atBottom ? { opacity: 0, transform: [{ translateY: 80 }] } : { opacity: 1, transform: [{ translateY: 0 }] },
                        ]}
                    >
                        {/* Export (כפתור כחול) */}
                        <TouchableOpacity
                            onPress={withDismiss(exportPdf)}
                            activeOpacity={0.85}
                            style={[
                                styles.primaryBtn,
                                floatingFooterStyles.actionBtn,
                                floatingFooterStyles.primaryFix,
                                !legality.isLegal && !allowIllegalExport && { opacity: 0.5 },
                            ]}
                            disabled={!legality.isLegal && !allowIllegalExport}
                            accessibilityRole="button"
                            accessibilityLabel={lang === 'he' ? 'ייצא PDF' : 'Export PDF'}
                        >
                            <Ionicons name="download-outline" size={18} color="#fff" />
                            <Text style={styles.primaryBtnText}>
                                {lang === 'he' ? 'ייצוא ל-PDF' : 'Export PDF'}
                            </Text>
                        </TouchableOpacity>

                        {/* רווח אופקי ביניהם */}
                        <View style={{ width: 8 }} />

                        {/* Reset (כפתור אדום — יחיד) */}
                        <TouchableOpacity
                            onPress={withDismiss(resetPage)}
                            activeOpacity={0.85}
                            style={[floatingFooterStyles.actionBtn, floatingFooterStyles.resetBtn]}
                            accessibilityRole="button"
                            accessibilityLabel={lang === 'he' ? 'אפס עמוד' : 'Reset page'}
                        >
                            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                                {lang === 'he' ? 'אפס עמוד' : 'Reset page'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* מודאל "נשמר בהצלחה" */}
                <Modal visible={dlg.open} transparent animationType="fade" onRequestClose={() => setDlg({ open: false, uri: null, localUri: null })}>
                    <View style={styles.modalBackdrop}>
                        <View style={[styles.modalCard, { alignItems: 'center' }]}>
                            <Text style={styles.modalTitle}>{lang === 'he' ? 'הקובץ נשמר בהצלחה!' : 'File saved successfully!'}</Text>

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, alignSelf: 'stretch' }}>
                                <TouchableOpacity onPress={() => openPdf(dlg.uri || dlg.localUri)} style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}>
                                    <Ionicons name="document-text-outline" size={18} color="#fff" />
                                    <Text style={styles.primaryBtnText}>{lang === 'he' ? 'פתח' : 'Open'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setDlg({ open: false, uri: null, localUri: null })}
                                    style={[styles.secondaryBtn, { flex: 1, paddingVertical: 12, justifyContent: 'center' }]}
                                >
                                    <Text style={styles.secondaryBtnText}>
                                        {lang === 'he' ? 'סגור' : 'Close'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={async () => {
                                        try {
                                            const u = dlg.localUri || dlg.uri;
                                            const can = await Sharing.isAvailableAsync();
                                            if (can && u) {
                                                await Sharing.shareAsync(u, { dialogTitle: lang === 'he' ? 'שתף PDF' : 'Share PDF', UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
                                            }
                                        } catch { }
                                    }}
                                    style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                                >
                                    <Ionicons name="share-outline" size={18} color="#fff" />
                                    <Text style={styles.primaryBtnText}>{lang === 'he' ? 'שתף' : 'Share'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* ייצוא לא חוקי – אישור */}
                <IllegalExportDialog
                    visible={illegalDlgOpen}
                    lang={lang}
                    isRTL={isRTL}
                    onCancel={() => setIllegalDlgOpen(false)}
                    onConfirm={async () => {
                        setIllegalDlgOpen(false);
                        try {
                            const storageDirUri = Platform.OS === 'android' ? await pickAndCacheTariffDirOnce() : null;
                            const { uri, localUri } = await exportTariffPDF({
                                lang,
                                form: {
                                    athleteName: gymnast,
                                    club,
                                    gender,
                                    track,
                                    level,
                                    athleteNo: compNo,
                                    rotation: round,
                                    country,
                                    autoBonus,
                                },
                                pass1, pass2, elements: ELEMENTS,
                                fileName: `${lang === 'he' ? 'דף טריף' : 'Tariff'} - ${gymnast || 'Athlete'}.pdf`,
                                share: false,
                                storageDirUri,
                            });
                            setDlg({ open: true, uri: uri || localUri, localUri });
                        } catch (e) {
                            console.warn('PDF export failed', e);
                            Alert.alert(lang === 'he' ? 'שגיאת ייצוא' : 'Export Error', e?.message || String(e));
                        }
                    }}
                />

                {/* טוסט "צריך לבחור פס קודם" */}
                <Modal visible={needPass} transparent animationType="fade" onRequestClose={() => setNeedPass(false)}>
                    <View style={styles.modalBackdrop}>
                        <View style={[styles.modalCard, { alignItems: 'center' }]}>
                            <Ionicons name="information-circle-outline" size={42} color={palette.primary} />
                            <Text style={[styles.modalTitle, { textAlign: 'center', marginTop: 8 }]}>
                                {/* פונקציה: Tabs */}
                                {lang === 'he' ? 'צריך לבחור פס קודם' : 'Please choose a pass first'}
                            </Text>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}






// ---------- Tabs ----------
const Tab = createBottomTabNavigator();

function Tabs() {
    const { t, lang } = usePrefs();
    const { user } = useAuth?.() || { user: null }; // נשען על useAuth אם קיים
    const isAdmin = !!(user?.isAdmin || user?.role === 'admin');

    // כיוון לפי שפת האפליקציה בלבד
    const appDir = lang === 'he' ? 'rtl' : 'ltr';

    // סדר לוגי אחיד; הכיוון יחליט איך זה מוצג (RTL/LTR)
    const orderedBase = ['tariff', 'calc', 'flash', 'quiz'];
    const ordered = isAdmin ? [...orderedBase, 'admin'] : orderedBase;

    // מיפוי מסך→קומפוננטה+תיוג
    const screens = {
        calc: { component: CalculatorScreen, label: t('tabs.calc') },
        flash: { component: FlashcardsScreen, label: t('tabs.flash') },
        quiz: { component: QuizScreen, label: t('tabs.quiz') },
        progress: { component: ProgressScreen, label: t('tabs.progress') },
        tariff: { component: TariffScreen, label: t('tabs.tariff') },

        // ↓ נוסף מינימלית: מסך אדמין (נדרש שתהיה לך קומפוננטה AdminUsersScreen ב-App.js)
        admin: { component: AdminUsersScreen, label: t?.('tabs.admin') ?? (lang === 'he' ? 'אדמין' : 'Admin') },
    };

    return (
        <View style={{ flex: 1, direction: appDir }}>
            <Tab.Navigator
                detachInactiveScreens={false}
                sceneContainerStyle={{ direction: appDir, backgroundColor: (palette?.screen ?? palette?.bg) ?? '#0E1230' }}
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarStyle: [
                        { backgroundColor: palette.card, borderTopColor: palette.border },
                        { direction: appDir },
                    ],
                    tabBarLabelStyle: {
                        fontSize: 12,
                        paddingBottom: 4,
                        writingDirection: appDir,
                        textAlign: 'center',
                    },
                    tabBarItemStyle: { flexDirection: appDir === 'rtl' ? 'row-reverse' : 'row' },
                    tabBarActiveTintColor: palette.primary,
                    tabBarInactiveTintColor: palette.muted,
                    tabBarIcon: ({ color, size }) => {
                        const map = {
                            calc: 'calculator-outline',
                            flash: 'albums-outline',
                            quiz: 'help-circle-outline',
                            progress: 'bar-chart-outline',
                            tariff: 'document-text-outline',
                            admin: 'settings-outline',
                        };
                        return <Ionicons name={map[route.name] || 'albums-outline'} size={size} color={color} />;
                    },
                })}
            >


                {/* פונקציה: ComposedApp */}
                {ordered.map((key) => (
                    <Tab.Screen
                        key={key}
                        name={key}
                        component={screens[key].component}
                        options={{ tabBarLabel: screens[key].label }}
                    />
                ))}
            </Tab.Navigator>
        </View>
    );
}


function ComposedApp() {
    // RTL מהעדפות, בדיוק כמו שהיה
    const { isRTL } = usePrefs();
    const appDir = isRTL ? 'rtl' : 'ltr';

    // נשתמש בהוק הקיים בקובץ כדי לדעת אם זה טאבלט / לנדסקייפ
    const { isTablet } = useResponsive();

    // חדש: טלפון נעול לאורך; טאבלט – לא נעול (יכול להסתובב)
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                if (isTablet) {
                    // טאבלט – לשחרר נעילה כדי לאפשר גם Landscape
                    await ScreenOrientation.unlockAsync();
                } else {
                    // טלפון – לנעול לאורך בלבד
                    await ScreenOrientation.lockAsync(
                        ScreenOrientation.OrientationLock.PORTRAIT_UP
                    );
                }
            } catch (e) {
                // שקט: אם אין מודול/הרשאה, לא מפיל את האפליקציה
            }
            if (cancelled) return;
        })();

        return () => { cancelled = true; };
    }, [isTablet]);

    // עוטפים את הניווט כמו במבנה המקורי
    return (
        <View style={{ flex: 1, direction: appDir }}>
            <View style={{ flex: 1 }}>
                {/* שכבת רקע קבועה מאחורי הניווט */}
                <View
                    pointerEvents="none"
                    style={{ position: 'absolute', inset: 0, backgroundColor: palette.bg }}
                />
                <NavigationContainer theme={navTheme}>
                    <ProgressProvider>
                        <RootStack />
                        {/* פונקציה: ProgressBar */}
                    </ProgressProvider>
                </NavigationContainer>
            </View>
        </View>
    );
}


export default function App() {
    return (
        <AuthProvider>
            <PrefsProvider>
                <ComposedApp />
            </PrefsProvider>
        </AuthProvider>
    );
}




// ---------- Progress bar ----------
function ProgressBar({ value }) {
    return (
        <View style={styles.progressWrap}>
            <View style={[styles.progressFill, { width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }]} />
        </View>
    );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: palette.bg },

    header: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 12,
        paddingHorizontal: 12,
        backgroundColor: 'transparent',
        position: 'relative',
    },

    headerTitle: {
        color: palette.text, fontSize: 26, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase',
        textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3
    },

    headerPinnedEdge: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
    },

    quizProgress: {
        color: palette.muted,
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 16,
        alignSelf: 'stretch',
        paddingHorizontal: 8,
    },


    quizFooter: {
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 12,
    },

    // כפתור חזרה עגול – כמו בטריף
    roundBackBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: palette.card,
        borderWidth: 1, borderColor: palette.border,
        alignItems: 'center', justifyContent: 'center',
    },

    // כרטיס אחיד (כמו הטריף)
    card: {
        backgroundColor: palette.card,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: palette.border,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: palette.text,
        marginBottom: 8
    },

    fieldLabel: {
        fontSize: 12,
        color: palette.muted,
        marginBottom: 6
    },

    fieldInput: {
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        color: palette.text,
        marginBottom: 10
    },

    pickerBox: {
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 10,
        marginBottom: 10
    },

    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4
    },

    avatarPreview: {
        width: '100%',
        aspectRatio: 3 / 1,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.border,
        marginTop: 8
    },

    helpText: {
        fontSize: 12,
        color: palette.muted,
        marginTop: 2
    },

    primaryBtn: {
        backgroundColor: '#7c3aed',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0
    },

    primaryBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16
    },


    settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.chip, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: palette.border },

    // Cards
    cardWrap: { borderRadius: 16, backgroundColor: 'transparent' },
    card: { height: 150, borderRadius: 16 },
    cardSide: { alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: palette.border },
    cardFrontText: { color: palette.text, fontSize: 22, fontWeight: '800', textAlign: 'center', alignSelf: 'stretch', paddingHorizontal: 8 },
    valueText: { color: palette.primary, fontSize: 48, fontWeight: '900', textAlign: 'center' },
    inlineActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    iconBtnRight: { backgroundColor: '#25C685' }, iconBtnWrong: { backgroundColor: '#FF5C7A' },

    // Quiz
    quizCard: { marginHorizontal: 12, marginTop: 10, backgroundColor: palette.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: palette.border },
    quizQ: { color: palette.muted, fontSize: 14, textAlign: 'center' },
    quizTitle: { color: palette.text, fontSize: 22, fontWeight: '900', marginTop: 6, textAlign: 'center' },
    optionBtn: { borderWidth: 1, borderColor: palette.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginVertical: 6, backgroundColor: palette.chip, overflow: 'visible' },
    optionActive: { borderColor: palette.primary },
    optionCorrect: {
        borderColor: palette.success,
        borderWidth: 2,
        ...Platform.select({
            ios: { shadowColor: '#00C781', shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: {},
        }),
    },
    optionWrong: {
        borderColor: palette.danger,
        borderWidth: 2,
        ...Platform.select({
            ios: { shadowColor: '#FF5C7A', shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: {},
        }),
    },
    optionText: { color: palette.text, fontSize: 18, textAlign: 'center' },
    input: { backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 12, color: palette.text, padding: 12, fontSize: 18, marginTop: 6 },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: palette.primary, borderRadius: 12, paddingVertical: 12, marginTop: 10 },
    primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    muted: { color: palette.muted, textAlign: 'center' },
    resultText: { color: palette.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
    inputCorrect: {
        borderColor: palette.success,
        borderWidth: 2,
        ...(Platform.select({
            ios: { shadowColor: '#00C781', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: {},
        })),
    },
    inputWrong: {
        borderColor: palette.danger,
        borderWidth: 2,
        ...(Platform.select({
            ios: { shadowColor: '#FF5C7A', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: {},
        })),
    },
    correctAnswerText: {
        color: palette.success,
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 8,
    },

    // Stats / Progress
    statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, marginTop: 10 },
    statCard: { flex: 1, backgroundColor: palette.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: palette.border },
    statValue: { color: palette.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    statTitle: { fontSize: 12, textAlign: 'center', marginTop: 4 },
    section: { marginTop: 14, paddingHorizontal: 12 },
    sectionTitle: { color: palette.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
    rowItem: { backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    rowName: { color: palette.text, fontSize: 14, flex: 1, paddingHorizontal: 6 },
    rowVal: { color: palette.primary2, fontSize: 14, fontWeight: '800' },

    progressWrap: { height: 8, backgroundColor: '#1B1F4A', borderRadius: 999, marginHorizontal: 12, overflow: 'hidden' },
    progressFill: { height: 8, backgroundColor: palette.primary },

    modeToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.chip, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: palette.border },

    confirmModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmModalCard: {
        width: '86%',
        backgroundColor: palette.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 16,
    },
    confirmModalTitle: {
        color: palette.text,
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
    },
    confirmModalText: {
        color: palette.muted,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
        alignSelf: 'stretch',
    },
    confirmBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.chip,
    },
    confirmBtnText: {
        color: palette.text,
        fontWeight: '800',
        fontSize: 16,
    },
    confirmBtnDanger: {
        borderColor: '#7a1f1f',
        backgroundColor: '#311313',
    },
    confirmBtnDangerText: {
        color: '#ff6b6b',
    },

    // Calculator – top slots
    slotFrame: { backgroundColor: '#161A34', borderRadius: 14, borderWidth: 1, borderColor: palette.border, paddingVertical: 10, marginTop: 10 },
    slotBox: { height: 42, borderRadius: 10, backgroundColor: '#1A1E3E', borderWidth: 1, borderColor: '#2b2f61', alignItems: 'center', justifyContent: 'center' },
    slotBoxSmall: { height: 34 },
    slotName: { color: palette.text, fontSize: 12, fontWeight: '700', textAlign: 'center', paddingHorizontal: 4 },
    slotSymbol: { color: palette.text, fontSize: 16, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, writingDirection: 'ltr' },
    slotValue: { color: palette.gold, fontSize: 12, fontWeight: '800' },

    calcBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingHorizontal: 12 },
    calcLabel: { color: palette.text, fontSize: 14, fontWeight: '900' },
    calcValue: { color: palette.gold, fontSize: 18, fontWeight: '900' },

    secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.chip },
    secondaryBtnText: { color: palette.text, fontSize: 14, fontWeight: '700' },

    // Calculator – keyboard tiles
    keyBtn: {
        backgroundColor: palette.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        marginBottom: 8,
        paddingHorizontal: 8,
        paddingVertical: 8,
        width: (Dimensions.get('window').width - 16 * 2 - 10) / 3 - 4,
        height: 88,                           // רגיל (שמות)
    },
    keyBtnSymbols: {
        height: 76,                           // קטן יותר במצב סימבולס
        paddingVertical: 6,
    },
    keyBtnInner: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',     // טקסט למעלה, ערך למטה
    },
    keyLabel: {
        color: palette.text,
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'center',
        paddingHorizontal: 4,
        lineHeight: 18,
        includeFontPadding: false,
    },
    keyLabelSymbol: {                        // סימבולס – טיפה גדול יותר
        fontSize: 18,
        lineHeight: 22,
        letterSpacing: 0.5,
    },
    keyLabelLong: {                          // לשם הארוך עם שפגאט – 3 שורות טיפה גדול
        fontSize: 16,
        lineHeight: 19,
    },
    keyValue: {
        color: palette.gold,
        fontSize: 13,
        fontWeight: '900',
        marginTop: 6,
        textAlign: 'center',
    },
    keyValueSymbols: {
        marginTop: 4,                        // רווח קטן יותר כשאריח קטן
    },

    // Settings modal
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
    modalCard: { width: '86%', backgroundColor: palette.card, borderRadius: 16, borderWidth: 1, borderColor: palette.border, padding: 16 },
    modalTitle: { color: palette.text, fontSize: 18, fontWeight: '900' },
    modalLabel: { color: palette.text, fontSize: 14, fontWeight: '700', marginTop: 6 },
    row: { alignItems: 'center', marginTop: 8 },
    pill: { backgroundColor: palette.chip, borderWidth: 1, borderColor: palette.border, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 },
    pillText: { color: palette.text, fontSize: 14, fontWeight: '700' },

    // --- Tariff styles ---
    formRow: { marginTop: 10 },
    formCol: {},
    label: { color: palette.muted, fontSize: 12, fontWeight: '700', marginBottom: 4, textAlign: 'right' },

    chipBtn: {
        backgroundColor: palette.chip, borderWidth: 1, borderColor: palette.border,
        borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12
    },
    chipText: { color: palette.text, fontSize: 14, fontWeight: '700' },

    passWrap: { backgroundColor: palette.card, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 10 },
    passTitle: { color: palette.text, fontSize: 14, fontWeight: '800', marginBottom: 6, textAlign: 'right' },
    passRow: { gap: 6, justifyContent: 'space-between' },
    slotCell: { flex: 1, minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: palette.border, backgroundColor: '#1A1E3E', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    slotCellText: { color: palette.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },

    kbGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
    kbKey: {
        backgroundColor: palette.card, borderRadius: 12, borderWidth: 1, borderColor: palette.border,
        marginBottom: 8, paddingHorizontal: 8, paddingVertical: 8,
        width: (Dimensions.get('window').width - 16 * 2 - 10) / 3 - 4, height: 88,
    },
    kbKeyInner: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'space-between' },
    kbKeyLabel: { color: palette.text, fontSize: 14, fontWeight: '800', textAlign: 'center', lineHeight: 18, includeFontPadding: false },
    keyBtnInnerSymbols: { paddingTop: 10 },

    // --- Tariff layout helpers ---
    tarRow: { gap: 10, marginTop: 10, alignItems: 'flex-end' },
    tarCol: { flex: 1 },
    tarColSmall: { width: 110 },

    tarInputWide: {
        backgroundColor: palette.card,
        borderColor: palette.border,
        borderWidth: 1,
        borderRadius: 10,
        color: palette.text,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 14,
    },

    tarLabel: { color: palette.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 },
    tarInput: { backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 10, color: palette.text, padding: 10, fontSize: 14 },
    tarInputSmall: { backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 10, color: palette.text, paddingVertical: 8, paddingHorizontal: 10, fontSize: 14, width: 72 },

    // כיווניות
    rtl: { writingDirection: 'rtl', textAlign: 'right' },
    ltr: { writingDirection: 'ltr', textAlign: 'left' },

    // הדגשת פס פעיל
    slotFrameActive: {
        borderColor: palette.primary,
        borderWidth: 1.5,
        ...Platform.select({
            ios: { shadowColor: palette.primary, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: {},
        }),
    },
    dirBox: {
        flex: 1,
        minHeight: 40,
        backgroundColor: palette.chip,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
    dirText: {
        color: palette.muted,
        fontSize: 13,
        lineHeight: 16,
    },

    // --- Country picker styles (תוספת) ---
    countryCurrent: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: palette.chip,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        minWidth: 180,
    },
    countryFlag: {
        fontSize: 18,
    },
    countryText: {
        color: palette.text,
        fontSize: 14,
        fontWeight: '800',
        flex: 1,            // חשוב: שימתח לרוחב, כדי שב־RTL הטקסט יוכל להיצמד לימין
    },
    countryDropdown: {
        backgroundColor: palette.card,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 12,
        paddingVertical: 6,
        width: '100%',       // === בדיוק רוחב הכפתור
        overflow: 'hidden',
    },

    countryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },

    // --- Inline label לבונוס האוטומטי (תוספת) ---
    tarInlineLabel: {
        color: palette.text,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 0, // אין מרווח תחתון בשורה
        marginTop: 1,    // מוריד טיפה את הכיתוב כדי להתיישר עם האייקון
    },

    // שורת המדינה + בונוס (תמיד שמאל -> ימין כדי שהבונוס יהיה משמאל לכפתור)
    tarCountryBar: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        gap: 8, // היה 10 – קצת יותר קרוב
    },

    // עוטף לכפתור המדינה (עבור overlay)
    countryWrap: {
        position: 'relative',
        zIndex: 50,
    },

    // חץ מקובע
    countryChevron: {
        position: 'absolute',
        top: '50%',
        marginTop: -8,
        opacity: 0.9,
        pointerEvents: 'none',
    },

    // overlay של הרשימה (לא דוחף למטה)
    countryDropdownOverlay: {
        position: 'absolute',
        top: '100%',
        width: '100%',
        zIndex: 50,
        elevation: 20,
        marginTop: 6,
    },

    // עטיפה לטוגל הבונוס כדי שהטקסט לא "יברח"
    autoBonusWrap: {
        alignItems: 'center',
        gap: 8,
        maxWidth: '55%',
    },

    countryChevronWrap: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        justifyContent: 'center',  // מרכז אנכי אמיתי
        opacity: 0.9,
        pointerEvents: 'none',
        width: 22,                  // מעט מקום ללחיצה/מרווח
    },
    comingSoonCard: {
        alignSelf: 'stretch',
        backgroundColor: palette.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 16,
        marginTop: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    comingSoonText: {
        color: palette.text,
        fontSize: 18,
        fontWeight: '900',
    },

    warnBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#1B1F4A',
        borderColor: palette.gold,
        borderWidth: 1.5,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginTop: 8,
    },
    warnText: {
        color: palette.gold,
        fontSize: 13,
        fontWeight: '800',
    },

    primaryBtnLg: {
        minWidth: 120,        // כפתור רחב יותר
        paddingVertical: 12,  // גבוה יותר
        paddingHorizontal: 18,
        borderRadius: 10,     // אם תרצה אותו עגול יותר מהרגיל
    },
    primaryBtnTextLg: {
        fontSize: 18,         // טקסט גדול וברור
        fontWeight: '700',
    },


    pinWrap: {
        position: 'absolute',
        top: 2,
        zIndex: 20,
        backgroundColor: 'transparent',
    },

    pinButton: {
        width: 24,            // ↑ היה 18 — הגדלנו
        height: 24,           // ↑ היה 18 — הגדלנו
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        shadowColor: '#000',
        shadowOpacity: 0.22,  // ↑ קצת יותר מודגש כדי שהלבן יבלוט
        shadowRadius: 2.5,
        shadowOffset: { width: 0, height: 1 },
        elevation: 3,
    },



    modalBtn: {
        minWidth: 120,
        height: 44,                 // ← גובה אחיד לשני הכפתורים
        paddingHorizontal: 18,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',   // ← מרכז אנכית ואופקית
        // נטרול השפעות שונות של primary/secondary:
        margin: 0,
    },

    modalBtnPrimary: {
        backgroundColor: palette?.primary ?? '#3B82F6',
        borderWidth: 0,
    },

    modalBtnSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: palette?.border ?? 'rgba(0,0,0,0.2)',
    },

    modalBtnText: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        includeFontPadding: false,  // ← מונע עודף גובה באנדרואיד
        lineHeight: 22,             // ← קבע ליציבות ויזואלית
        color: palette?.onPrimary ?? '#ffffff', // יוחלף ידנית אם צריך
    },


    btnCenter: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    pinButtonIdle: {
        opacity: 1,          // לא-נעוץ לבן – השארנו מלא
    },

    slotBonusValue: { color: '#7DD3FC', fontSize: 12, fontWeight: '800' },

    pinButtonActive: {
        opacity: 1,          // נעוץ אדום – מלא
    },

    pinButtonDisabled: {
        opacity: 0.35,       // כשהמגבלה מלאה (3 נעוצים) – מדומעם
    }

});

const rstyles = {
    screen: { flex: 1 },
    scroll: { padding: 16, gap: 12 },

    title: { color: palette.text, fontSize: 22, fontWeight: '800' },              // :contentReference[oaicite:0]{index=0}
    subtitle: { color: palette.muted, marginTop: 4, marginBottom: 8 },            // :contentReference[oaicite:1]{index=1}

    card: {
        backgroundColor: palette.card,                                             // כרטיסים בצבעי האפליקציה
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2
    },

    sectionHeading: { color: palette.text, fontWeight: '800', fontSize: 16, marginBottom: 8 },
    label: { color: palette.muted, fontSize: 12, marginBottom: 6 },

    input: {
        borderWidth: 1, borderColor: palette.border, borderRadius: 10,
        paddingVertical: 10, paddingHorizontal: 12,
        color: palette.text, marginBottom: 10
    },

    pickerBox: {
        borderWidth: 1, borderColor: palette.border, borderRadius: 10,
        marginBottom: 10, overflow: 'hidden'
    },

    row: { flexDirection: 'row' },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    col: { flexDirection: 'column' },

    help: { color: palette.muted, fontSize: 12, marginTop: 2 },

    primaryBtn: {
        backgroundColor: palette.primary,                                          // כפתור ראשי בצבע הראשי של האפליקציה
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6
    },
    primaryBtnText: { color: palette.onPrimary ?? '#fff', fontWeight: '800', fontSize: 16 }, // :contentReference[oaicite:2]{index=2}

    // Avatar
    avatarWrap: {
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: palette.card,
        borderWidth: 2, borderColor: palette.border,
        overflow: 'hidden'
    },
    avatarImg: { width: '100%', height: '100%', borderRadius: 55 },
    avatarBadge: {
        position: 'absolute', bottom: 6, right: 6,
        backgroundColor: palette.primary,
        borderRadius: 12, paddingHorizontal: 6, paddingVertical: 4,
        borderWidth: 1, borderColor: palette.border
    }
};

const stylesReg = StyleSheet.create({
    container: { padding: 16, gap: 10, backgroundColor: '#111', flexGrow: 1 },
    label: { color: '#fff', fontWeight: '600', marginBottom: 6 },
    subLabel: { color: '#fff', marginTop: 6, marginBottom: 6 },
    input: { borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 12, color: '#fff', backgroundColor: '#1a1a1a', marginBottom: 10 },
    pickerBox: { borderWidth: 1, borderColor: '#333', borderRadius: 10, backgroundColor: '#1a1a1a', marginBottom: 10 },
    picker: { color: '#fff' }, // Android: עובד; iOS: שולט פחות—אבל עטפנו בקופסה כהה
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    col: { flex: 1 },
    block: { borderWidth: 1, borderColor: '#222', backgroundColor: '#161616', padding: 12, borderRadius: 12, marginTop: 8 },
    rowInline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    blockTitle: { color: '#fff', fontWeight: '700' },
    neutralBadge: { color: '#0ad', fontWeight: '700', marginTop: 6, marginBottom: 4 },
    btn: { backgroundColor: '#0a84ff', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    btnText: { color: '#fff', fontWeight: '800' },
    error: { color: '#ff6b6b', marginTop: 8 },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#222' },
    avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    smallBtn: { backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
    smallBtnText: { color: '#fff', fontWeight: '600' },
});

const regStyles = StyleSheet.create({
    container: { padding: 16, gap: 10, backgroundColor: palette.screen, flexGrow: 1 },

    // אווטאר – כחול עם דמות
    avatarWrap: { alignSelf: 'center', marginBottom: 10 },
    avatarImg: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: '#4F7DFF' },
    avatarPlaceholder: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: '#2B4DFF',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#4F7DFF',
    },

    col: { flex: 1, minWidth: 0 },              // ← מאפשר לשורות להתחלק באופן גמיש
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'ltr', flexShrink: 1 },



    // ליד row ו-col:
    row: { flexDirection: 'row', alignItems: 'flex-end' },
    rowRtl: { flexDirection: 'row-reverse', alignItems: 'flex-end' }, // ← חדש
    col: { flex: 1 },

    label: { color: '#fff', fontWeight: '600', marginBottom: 6 },
    subLabel: { color: '#fff', marginTop: 6, marginBottom: 6 },

    input: {
        borderWidth: 1, borderColor: palette.border, borderRadius: 10,
        paddingVertical: 10, paddingHorizontal: 12, color: palette.text,
        backgroundColor: palette.card, marginBottom: 10,
    },

    // בחירת תיבות בסגנון “טריף”
    selectBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: palette.border, borderRadius: 10,
        paddingVertical: 12, paddingHorizontal: 12, backgroundColor: palette.card, marginBottom: 10,
    },
    selectText: { color: '#fff', fontSize: 14 },

    row: { flexDirection: 'row', alignItems: 'flex-end' },
    col: { flex: 1 },

    // טלפון: dial משמאל למספר
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'ltr' },
    dialBox: {
        minWidth: 70, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10,
        borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card, marginRight: 8,
    },
    dialText: { color: '#fff', fontWeight: '700', textAlign: 'center' },

    // קופסאות Toggle מאמן/שופט – זה לצד זה
    toggleBox: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 12, paddingHorizontal: 12,
        borderRadius: 12, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card,
    },
    toggleBoxActive: { backgroundColor: '#2B4DFF', borderColor: '#2B4DFF' },
    toggleText: { color: '#9aa3b2', fontWeight: '700' },
    toggleTextActive: { color: '#fff' },

    neutralBadge: { color: '#0ad', fontWeight: '700', marginTop: 6, marginBottom: 4 },

    btn: { backgroundColor: '#0a84ff', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    btnText: { color: '#fff', fontWeight: '800' },
    error: { color: '#ff6b6b', marginTop: 8 },
});