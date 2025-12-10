import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

export const API_URL = 'https://tdjp-auth-api.onrender.com';
const API_BASE = API_URL;

export type User = {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
  level?: number;
  profileStatus?: 'pending' | 'approved' | 'rejected';
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email?: string, password?: string, remember?: boolean) => Promise<any>;
  register: (payload: any) => Promise<any>;
  registerStart: (payload: any) => Promise<any>;
  registerVerify: (verificationId: string, code: string) => Promise<any>;
  logout: () => void;

  adminGetUsers: () => Promise<User[]>;
  adminGetRawUsers: () => Promise<any>;
  adminUpdateUser: (id: string, data: any) => Promise<User>;
  adminDeleteUser: (id: string) => Promise<void>;

  updateSelf: (data: any) => Promise<User>;
  deleteSelf: () => Promise<void>;

  changePasswordStart: () => Promise<string>; // Returns verificationId
  changePasswordVerify: (vid: string, code: string) => Promise<void>;
  changePasswordComplete: (vid: string, code: string, pass: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Helpers ---

let memoryToken: string | null = null;

async function saveToken(t: string) { if (t) await SecureStore.setItemAsync('tdjp_token', t); }
async function getToken() {
  if (memoryToken) return memoryToken;
  return SecureStore.getItemAsync('tdjp_token');
}
async function clearToken() {
  memoryToken = null;
  await SecureStore.deleteItemAsync('tdjp_token');
}

async function apiFetch(path: string, { method = 'GET', body, auth = true }: any = {}) {
  const headers: any = { 'Content-Type': 'application/json' };
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

function normalizeUser(u: any): User | null {
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

// --- API Functions ---

async function apiLogin({ email, password }: any) {
  const r = await apiFetch('/auth/login', { method: 'POST', auth: false, body: { email, password } });
  // Do not save token here anymore, let the provider handle it
  return { user: normalizeUser(r.user), token: r.token };
}

async function apiRegisterStart(body: any) {
  const r = await apiFetch('/auth/register/start', { method: 'POST', auth: false, body });
  return r; // returns { ok: true, verificationId: '...', channel: 'email' }
}

async function apiRegisterVerify(body: any) {
  const r = await apiFetch('/auth/register/verify', { method: 'POST', auth: false, body });
  await saveToken(r.token);
  return normalizeUser(r.user);
}

// ... existing apiRegister (legacy) ...
async function apiRegister(body: any) {
  const r = await apiFetch('/auth/register', { method: 'POST', auth: false, body });
  await saveToken(r.token);
  return normalizeUser(r.user);
}

async function apiMe() {
  const r = await apiFetch('/auth/me');
  return normalizeUser(r.user);
}

async function apiAdminGetUsers() {
  console.log('Fetching admin users...');
  const r = await apiFetch('/admin/users');
  console.log('Admin users response:', JSON.stringify(r, null, 2));

  if (Array.isArray(r)) return r.map(normalizeUser).filter(Boolean) as User[];
  if (Array.isArray(r.users)) return r.users.map(normalizeUser).filter(Boolean) as User[];
  if (Array.isArray(r.items)) return r.items.map(normalizeUser).filter(Boolean) as User[];
  if (Array.isArray(r.data)) return r.data.map(normalizeUser).filter(Boolean) as User[];

  return [];
}

async function apiAdminGetRawUsers() {
  const r = await apiFetch('/admin/users');
  return r;
}

async function apiAdminUpdateUser(id: string, body: any) {
  console.log(`Updating user ${id} with body:`, JSON.stringify(body));
  const r = await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body });
  console.log('Update response:', JSON.stringify(r));
  const u = normalizeUser(r.user);
  if (!u) throw new Error('Failed to update user');
  return u;
}



async function apiAdminDeleteUser(id: string) {
  console.log(`Deleting user ${id}`);
  await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
}

async function apiUpdateSelf(data: any) {
  const r = await apiFetch('/me', { method: 'PUT', body: data });
  const u = normalizeUser(r.user);
  if (!u) throw new Error('Failed to update profile');
  return u;
}

async function apiDeleteSelf() {
  await apiFetch('/me', { method: 'DELETE' });
}

async function apiChangePasswordStart() {
  const r = await apiFetch('/auth/change-password/start', { method: 'POST' });
  return r.verificationId;
}

async function apiChangePasswordVerify(verificationId: string, code: string) {
  await apiFetch('/auth/change-password/verify-code', { method: 'POST', body: { verificationId, code } });
}

async function apiChangePasswordComplete(verificationId: string, code: string, newPassword: string) {
  await apiFetch('/auth/change-password/complete', { method: 'POST', body: { verificationId, code, newPassword } });
}

export async function apiForgotPasswordStart(email: string) {
  const r = await apiFetch('/auth/forgot-password/start', { method: 'POST', auth: false, body: { email } });
  return r.verificationId;
}

export async function apiForgotPasswordVerify(verificationId: string, code: string) {
  await apiFetch('/auth/forgot-password/verify', { method: 'POST', auth: false, body: { verificationId, code } });
}

export async function apiForgotPasswordComplete(verificationId: string, code: string, newPassword: string) {
  await apiFetch('/auth/forgot-password/complete', { method: 'POST', auth: false, body: { verificationId, code, newPassword } });
}

export async function apiGetNotifications() {
  return await apiFetch('/notifications');
}

export async function apiMarkNotificationRead(id: string) {
  return await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session
  useEffect(() => {
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

  const login = async (email?: string, password?: string, remember: boolean = true) => {
    const { user: u, token } = await apiLogin({ email, password });
    if (remember) {
      await saveToken(token);
    } else {
      memoryToken = token;
      // Ensure we don't have a persisted token from before
      await SecureStore.deleteItemAsync('tdjp_token');
    }
    setUser(u);
    return u;
  };

  const register = async (payload: any) => {
    const u = await apiRegister(payload);
    setUser(u);
    return u;
  };

  const registerStart = async (payload: any) => {
    return await apiRegisterStart(payload);
  };

  const registerVerify = async (verificationId: string, code: string) => {
    const u = await apiRegisterVerify({ verificationId, code });
    setUser(u);
    return u;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, registerStart, registerVerify, logout,
      adminGetUsers: apiAdminGetUsers,
      adminGetRawUsers: apiAdminGetRawUsers,
      adminUpdateUser: apiAdminUpdateUser,
      adminDeleteUser: apiAdminDeleteUser,
      updateSelf: async (d) => { const u = await apiUpdateSelf(d); setUser(u); return u; },
      deleteSelf: async () => { await apiDeleteSelf(); setUser(null); },
      changePasswordStart: apiChangePasswordStart,
      changePasswordVerify: apiChangePasswordVerify,
      changePasswordComplete: apiChangePasswordComplete
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
