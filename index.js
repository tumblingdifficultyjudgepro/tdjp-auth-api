// index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// 🆕 נירמול מספרי טלפון
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const app = express();

/* ---------- Basic ---------- */
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '1mb' }));

const BUILD_TAG = 'auth-api v1.2.0';

/* ---------- Constants ---------- */
const ALLOWED_COUNTRIES = ['ישראל', 'בריטניה', 'ארצות הברית', 'רוסיה', 'אוקראינה', 'סין'];
const ALLOWED_CLUBS = ['מכבי אקרוג\'ים', 'הפועל תל אביב', 'שער הנגב', 'מכבי קריית אונו'];
const JUDGE_LEVELS = ['מתחיל', 'מתקדם', 'בינלאומי'];
const BREVET_LEVELS = ['1', '2', '3', '4'];

/* ---------- DB ---------- */
const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL is missing');
  process.exit(1);
}
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
try { console.log('DB host:', new URL(connectionString).hostname); } catch {}

/* ---------- JWT ---------- */
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

/* ---------- Rate limit ---------- */
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

/* ---------- Phone helpers (🆕) ---------- */
const COUNTRY_NAME_TO_ISO2 = {
  'ישראל': 'IL',
  'בריטניה': 'GB',
  'ארצות הברית': 'US',
  'רוסיה': 'RU',
  'אוקראינה': 'UA',
  'סין': 'CN',
};
function normalizeToE164(countryName, phoneRaw) {
  if (!phoneRaw) return null;
  const iso2 = COUNTRY_NAME_TO_ISO2[countryName] || undefined;
  try {
    const p = parsePhoneNumberFromString(String(phoneRaw), iso2);
    if (!p || !p.isValid()) return null;
    return p.number; // "+9725..."
  } catch {
    return null;
  }
}

/* ---------- Schema (DDL) ---------- */
async function ensureSchema() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email         text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      first_name    text,
      last_name     text,
      full_name     text NOT NULL,
      phone         text,
      -- 🆕 טלפון מנורמל ל-E.164 לאכיפת ייחודיות
      phone_e164    text,
      country       text,
      club          text,
      is_coach      boolean NOT NULL DEFAULT false,
      is_judge      boolean NOT NULL DEFAULT true,
      judge_level   text,
      brevet_level  text,
      avatar_url    text,
      role          text NOT NULL DEFAULT 'judge',
      is_admin      boolean NOT NULL DEFAULT false,
      created_at    timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name text;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name  text;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_e164 text;`);
  await pool.query(`
    UPDATE users
    SET
      first_name = COALESCE(first_name,
        CASE WHEN position(' ' in full_name) > 0
             THEN substr(full_name, 1, position(' ' in full_name)-1)
             ELSE full_name END),
      last_name = COALESCE(last_name,
        CASE WHEN position(' ' in full_name) > 0
             THEN trim(substr(full_name, position(' ' in full_name)+1))
             ELSE '' END)
    WHERE full_name IS NOT NULL;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token     text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      used      boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);`);
  // 🆕 אינדקס ייחודי מותנה (NULL מותר, כפילויות לא)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_phone_e164_unique
      ON users(phone_e164)
      WHERE phone_e164 IS NOT NULL;
  `);
}

/* ---------- Helpers ---------- */
const normEmail = (s = '') => s.trim().toLowerCase();
const toFullName = (first = '', last = '') => `${(first || '').trim()} ${(last || '').trim()}`.trim();
function splitFullName(fullName = '') {
  const s = String(fullName).trim();
  if (!s) return { first: '', last: '' };
  const i = s.indexOf(' ');
  if (i === -1) return { first: s, last: '' };
  return { first: s.slice(0, i).trim(), last: s.slice(i + 1).trim() };
}

/* ---------- Auth middleware ---------- */
function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET); // { uid }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
async function requireAdmin(req, res, next) {
  if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
  const q = await pool.query(`SELECT is_admin FROM users WHERE id=$1`, [req.user.uid]);
  if (!q.rowCount || !q.rows[0].is_admin) return res.status(403).json({ error: 'Admin only' });
  next();
}

/* ---------- Health ---------- */
app.get('/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true }); }
  catch (e) { console.error('Health DB error:', e); res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/', (_req, res) => {
  res.json({
    ok: true, version: BUILD_TAG,
    routes: ['/health','/version','/_debug/db','/auth/register','/auth/login','/auth/request-password-reset','/auth/reset-password','/me (GET/PUT)','/admin/users (GET, PUT /:id, PATCH /:id, DELETE /:id)'],
  });
});
app.get('/version', (_req, res) => res.json({ version: BUILD_TAG }));
app.get('/whoami', (_req, res) => {
  res.json({ version: BUILD_TAG, node: process.version, env: process.env.NODE_ENV || 'dev', commit: process.env.RENDER_GIT_COMMIT || process.env.COMMIT || null, startedAt: new Date().toISOString() });
});
app.get('/_debug/db', async (_req, res) => {
  try { const r = await pool.query('SELECT now() as now'); res.json({ ok: true, now: r.rows[0].now }); }
  catch (e) { console.error('DB debug error:', e); res.status(500).json({ ok: false, error: e.message }); }
});

/* ---------- Registration validation ---------- */
function validateRegistration({ email, password, firstName, lastName, country, isCoach, club, isJudge, judgeLevel, brevetLevel }) {
  if (!email || !password || !firstName || !lastName) return 'Missing fields';
  if (password.length < 8) return 'Password must be at least 8 chars';
  if (!country || !ALLOWED_COUNTRIES.includes(country)) return 'Invalid country';
  if (isCoach) {
    if (!club || !ALLOWED_CLUBS.includes(club)) return 'Club is required and must be from list';
  }
  if (isJudge) {
    if (!judgeLevel || !JUDGE_LEVELS.includes(judgeLevel)) return 'Invalid judge level';
    if (judgeLevel === 'בינלאומי') {
      if (!brevetLevel || !BREVET_LEVELS.includes(String(brevetLevel))) return 'Brevet level required (1/2/3/4)';
    }
  } else if (brevetLevel) {
    return 'Brevet level not allowed when not a judge';
  }
  return null;
}

/* ---------- Auth: Register ---------- */
app.post('/auth/register', authLimiter, async (req, res) => {
  try {
    let {
      email, password,
      firstName, lastName, fullName,
      phone, country, club,
      isCoach = false, isJudge = true,
      judgeLevel = null, brevetLevel = null,
      avatarUrl = null
    } = req.body || {};

    email = normEmail(email);

    if ((!firstName || !lastName) && fullName) {
      const p = splitFullName(fullName);
      firstName = firstName || p.first;
      lastName  = lastName  || p.last;
    }
    const full_name = toFullName(firstName, lastName);

    const err = validateRegistration({ email, password, firstName, lastName, country, isCoach, club, isJudge, judgeLevel, brevetLevel });
    if (err) return res.status(400).json({ error: err });

    // 🆕 נירמול טלפון ובדיקת ייחודיות
    const phone_e164 = phone ? normalizeToE164(country, phone) : null;
    if (phone && !phone_e164) {
      return res.status(400).json({ error: 'Invalid phone number', code: 'PHONE_INVALID' });
    }

    const emailExists = await pool.query(`SELECT 1 FROM users WHERE email=$1`, [email]);
    if (emailExists.rowCount) return res.status(409).json({ error: 'Email already registered' });

    if (phone_e164) {
      const phoneExists = await pool.query(`SELECT 1 FROM users WHERE phone_e164=$1`, [phone_e164]);
      if (phoneExists.rowCount) return res.status(409).json({ error: 'Phone already registered', code: 'PHONE_TAKEN' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const ins = await pool.query(
      `INSERT INTO users
        (email, password_hash, first_name, last_name, full_name, phone, phone_e164, country, club,
         is_coach, is_judge, judge_level, brevet_level, avatar_url, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id, email, first_name, last_name, phone, country, club,
                 is_coach, is_judge, judge_level, brevet_level, avatar_url,
                 role, is_admin, created_at`,
      [email, password_hash, firstName || null, lastName || null, full_name,
       phone || null, phone_e164, country || null, club || null,
       !!isCoach, !!isJudge, judgeLevel || null, brevetLevel ? String(brevetLevel) : null,
       avatarUrl || null, (isJudge ? 'judge' : (isCoach ? 'coach' : 'user'))]
    );

    const u = ins.rows[0];
    const token = signToken({ uid: u.id });
    return res.status(201).json({
      user: {
        id: u.id, email: u.email,
        firstName: u.first_name, lastName: u.last_name,
        phone: u.phone, country: u.country, club: u.club,
        isCoach: u.is_coach, isJudge: u.is_judge,
        judgeLevel: u.judge_level, brevetLevel: u.brevet_level,
        avatarUrl: u.avatar_url, role: u.role, isAdmin: u.is_admin,
        createdAt: u.created_at
      },
      token
    });
  } catch (e) {
    if (e?.code === '23505') return res.status(409).json({ error: 'Email or phone already registered' });
    console.error('Register error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
});

/* ---------- Auth: Login ---------- */
app.post('/auth/login', authLimiter, async (req, res) => {
  try {
    let { email, password } = req.body || {};
    email = normEmail(email);
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const q = await pool.query(
      `SELECT id, email, first_name, last_name, phone, country, club, is_coach, is_judge,
              judge_level, brevet_level, avatar_url, role, is_admin, password_hash
         FROM users WHERE email=$1`,
      [email]
    );
    if (!q.rowCount) return res.status(401).json({ error: 'Invalid credentials' });

    const u = q.rows[0];
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ uid: u.id });
    res.json({
      user: {
        id: u.id, email: u.email,
        firstName: u.first_name, lastName: u.last_name,
        phone: u.phone, country: u.country, club: u.club,
        isCoach: u.is_coach, isJudge: u.is_judge,
        judgeLevel: u.judge_level, brevetLevel: u.brevet_level,
        avatarUrl: u.avatar_url, role: u.role, isAdmin: u.is_admin
      },
      token
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
});

/* ---------- Profile: /me ---------- */
app.get('/me', requireAuth, async (req, res) => {
  const q = await pool.query(
    `SELECT id, email, first_name, last_name, phone, country, club, is_coach, is_judge,
            judge_level, brevet_level, avatar_url, role, is_admin, created_at
       FROM users WHERE id=$1`, [req.user.uid]);
  if (!q.rowCount) return res.status(404).json({ error: 'User not found' });
  const u = q.rows[0];
  res.json({
    user: {
      id: u.id, email: u.email,
      firstName: u.first_name, lastName: u.last_name,
      phone: u.phone, country: u.country, club: u.club,
      isCoach: u.is_coach, isJudge: u.is_judge,
      judgeLevel: u.judge_level, brevetLevel: u.brevet_level,
      avatarUrl: u.avatar_url, role: u.role, isAdmin: u.is_admin, createdAt: u.created_at
    }
  });
});

app.put('/me', requireAuth, async (req, res) => {
  try {
    const {
      firstName, lastName,
      phone, country, club, isCoach, isJudge, judgeLevel, brevetLevel, avatarUrl
    } = req.body || {};

    if (country && !ALLOWED_COUNTRIES.includes(country)) return res.status(400).json({ error: 'Invalid country' });
    if (typeof isCoach === 'boolean' && isCoach) {
      if (club && !ALLOWED_CLUBS.includes(club)) return res.status(400).json({ error: 'Club must be from list' });
    }
    if (typeof isJudge === 'boolean' && isJudge) {
      if (judgeLevel && !JUDGE_LEVELS.includes(judgeLevel)) return res.status(400).json({ error: 'Invalid judge level' });
      if (judgeLevel === 'בינלאומי') {
        if (!BREVET_LEVELS.includes(String(brevetLevel))) return res.status(400).json({ error: 'Brevet level required (1/2/3/4)' });
      }
    }

    // 🆕 נירמול טלפון ובדיקת ייחודיות (כשנשלח phone)
    let phone_e164;
    if (phone !== undefined) {
      phone_e164 = phone ? normalizeToE164(country, phone) : null;
      if (phone && !phone_e164) {
        return res.status(400).json({ error: 'Invalid phone number', code: 'PHONE_INVALID' });
      }
      if (phone_e164) {
        const exists = await pool.query(`SELECT 1 FROM users WHERE phone_e164=$1 AND id<>$2`, [phone_e164, req.user.uid]);
        if (exists.rowCount) return res.status(409).json({ error: 'Phone already registered', code: 'PHONE_TAKEN' });
      }
    }

    const full_name = (firstName || lastName) ? toFullName(firstName, lastName) : null;

    const q = await pool.query(
      `UPDATE users SET
          first_name   = COALESCE($2, first_name),
          last_name    = COALESCE($3, last_name),
          full_name    = COALESCE($4, full_name),
          phone        = COALESCE($5, phone),
          phone_e164   = COALESCE($6, phone_e164),
          country      = COALESCE($7, country),
          club         = COALESCE($8, club),
          is_coach     = COALESCE($9, is_coach),
          is_judge     = COALESCE($10, is_judge),
          judge_level  = COALESCE($11, judge_level),
          brevet_level = COALESCE($12, brevet_level),
          avatar_url   = COALESCE($13, avatar_url)
       WHERE id=$1
       RETURNING id, email, first_name, last_name, phone, country, club, is_coach, is_judge,
                 judge_level, brevet_level, avatar_url, role, is_admin, created_at`,
      [req.user.uid,
       firstName ?? null,
       lastName ?? null,
       full_name,
       phone ?? null,
       phone_e164 ?? null,
       country ?? null,
       club ?? null,
       typeof isCoach === 'boolean' ? isCoach : null,
       typeof isJudge === 'boolean' ? isJudge : null,
       judgeLevel ?? null,
       brevetLevel ? String(brevetLevel) : null,
       avatarUrl ?? null
      ]
    );
    const u = q.rows[0];
    res.json({
      user: {
        id: u.id, email: u.email,
        firstName: u.first_name, lastName: u.last_name,
        phone: u.phone, country: u.country, club: u.club,
        isCoach: u.is_coach, isJudge: u.is_judge,
        judgeLevel: u.judge_level, brevetLevel: u.brevet_level,
        avatarUrl: u.avatar_url, role: u.role, isAdmin: u.is_admin, createdAt: u.created_at
      }
    });
  } catch (e) {
    console.error('PUT /me error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
});

/* ---------- Password reset ---------- */
app.post('/auth/request-password-reset', authLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const em = normEmail(email);

  const q = await pool.query(`SELECT id FROM users WHERE email=$1`, [em]);
  if (!q.rowCount) return res.json({ ok: true });

  const userId = q.rows[0].id;
  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 30 * 60 * 1000);

  await pool.query(`INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1,$2,$3)`, [userId, token, expires]);
  return res.json({ ok: true, token }); // בדיקות
});

app.post('/auth/reset-password', authLimiter, async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ error: 'Missing fields' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 chars' });

  const q = await pool.query(`SELECT id, user_id, expires_at, used FROM password_resets WHERE token=$1`, [token]);
  if (!q.rowCount) return res.status(400).json({ error: 'Invalid token' });

  const row = q.rows[0];
  if (row.used) return res.status(400).json({ error: 'Token already used' });
  if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Token expired' });

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [hash, row.user_id]);
  await pool.query(`UPDATE password_resets SET used=true WHERE id=$1`, [row.id]);
  return res.json({ ok: true });
});

/* ---------- Admin ---------- */
app.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
  const q = await pool.query(
    `SELECT id, email, first_name, last_name, phone, country, club, is_coach, is_judge,
            judge_level, brevet_level, avatar_url, role, is_admin, created_at
       FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  res.json({ items: q.rows, nextOffset: offset + q.rowCount });
});

app.get('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const q = await pool.query(
    `SELECT id, email, first_name, last_name, phone, country, club, is_coach, is_judge,
            judge_level, brevet_level, avatar_url, role, is_admin, created_at
       FROM users WHERE id=$1`,
    [req.params.id]
  );
  if (!q.rowCount) return res.status(404).json({ error: 'User not found' });
  res.json({ user: q.rows[0] });
});

app.patch('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};

    const first_name   = b.first_name   ?? b.firstName;
    const last_name    = b.last_name    ?? b.lastName;
    const email        = b.email ? normEmail(b.email) : undefined;
    const phone        = b.phone;
    const country      = b.country;
    const club         = b.club;
    const is_coach     = (typeof b.is_coach === 'boolean') ? b.is_coach : b.isCoach;
    const is_judge     = (typeof b.is_judge === 'boolean') ? b.is_judge : b.isJudge;
    const judge_level  = b.judge_level  ?? b.judgeLevel;
    const brevet_level = b.brevet_level ?? (b.brevetLevel != null ? String(b.brevetLevel) : undefined);
    const avatar_url   = b.avatar_url   ?? b.avatarUrl;

    if (country !== undefined && country !== null && !ALLOWED_COUNTRIES.includes(country)) {
      return res.status(400).json({ error: 'Invalid country' });
    }
    if (is_coach !== undefined && is_coach) {
      if (club !== undefined && club !== null && !ALLOWED_CLUBS.includes(club)) {
        return res.status(400).json({ error: 'Club must be from list' });
      }
    }
    if (is_judge !== undefined && is_judge) {
      if (judge_level !== undefined && judge_level !== null && !JUDGE_LEVELS.includes(judge_level)) {
        return res.status(400).json({ error: 'Invalid judge level' });
      }
      if (judge_level === 'בינלאומי') {
        if (brevet_level === undefined || !BREVET_LEVELS.includes(String(brevet_level))) {
          return res.status(400).json({ error: 'Brevet level required (1/2/3/4)' });
        }
      }
    }

    // 🆕 נירמול טלפון ובדיקת ייחודיות (כשנשלח phone)
    let phone_e164;
    if (phone !== undefined) {
      phone_e164 = phone ? normalizeToE164(country, phone) : null;
      if (phone && !phone_e164) {
        return res.status(400).json({ error: 'Invalid phone number', code: 'PHONE_INVALID' });
      }
      if (phone_e164) {
        const exists = await pool.query(`SELECT 1 FROM users WHERE phone_e164=$1 AND id<>$2`, [phone_e164, req.params.id]);
        if (exists.rowCount) return res.status(409).json({ error: 'Phone already registered', code: 'PHONE_TAKEN' });
      }
    }

    const sets = [];
    const vals = [];
    const add = (col, val) => {
      if (val !== undefined) {
        sets.push(`${col} = $${sets.length + 1}`);
        vals.push(val);
      }
    };

    add('first_name',   first_name ?? null);
    add('last_name',    last_name ?? null);
    add('phone',        phone ?? null);
    add('phone_e164',   phone_e164 ?? null); // 🆕
    add('country',      country ?? null);
    add('club',         club ?? null);
    add('is_coach',     (typeof is_coach === 'boolean') ? is_coach : null);
    add('is_judge',     (typeof is_judge === 'boolean') ? is_judge : null);
    add('judge_level',  judge_level ?? null);
    add('brevet_level', brevet_level ?? null);
    add('avatar_url',   avatar_url ?? null);
    add('email',        email ?? null);

    if (first_name !== undefined || last_name !== undefined) {
      const full_name = toFullName(first_name ?? null, last_name ?? null);
      add('full_name', full_name || null);
    }

    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });

    vals.push(req.params.id);

    const q = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${vals.length}
         RETURNING id, email, first_name, last_name, phone, country, club, is_coach, is_judge,
                   judge_level, brevet_level, avatar_url, role, is_admin, created_at`,
      vals
    );
    if (!q.rowCount) return res.status(404).json({ error: 'User not found' });

    res.json({ user: q.rows[0] });
  } catch (e) {
    console.error('Admin PATCH error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

app.put('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const { isAdmin } = req.body || {};
  if (typeof isAdmin !== 'boolean') return res.status(400).json({ error: 'Missing isAdmin' });
  const q = await pool.query(
    `UPDATE users SET is_admin=$2 WHERE id=$1
       RETURNING id, email, first_name, last_name, is_admin`,
    [req.params.id, isAdmin]
  );
  if (!q.rowCount) return res.status(404).json({ error: 'User not found' });
  res.json({ user: q.rows[0] });
});

app.delete('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM users WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Global error handler ---------- */
app.use((err, req, res, _next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: err?.message || 'Unhandled server error', where: `${req.method} ${req.url}` });
});

/* ---------- Start ---------- */
const port = process.env.PORT || 10000;
(async () => {
  try { await ensureSchema(); app.listen(port, () => console.log('API on :' + port)); }
  catch (e) { console.error('Startup error:', e); process.exit(1); }
})();
