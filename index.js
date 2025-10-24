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

const app = express();

/* ---------- הגדרות בסיס ---------- */
app.set('trust proxy', 1); // Render/Proxy
app.use(helmet());
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '1mb' }));

const BUILD_TAG = 'auth-api v1.1.1'; // היה 1.1.0

/* ---------- קבועים לאימותי טופס ---------- */
const ALLOWED_COUNTRIES = ['ישראל', 'בריטניה', 'ארצות הברית', 'רוסיה', 'אוקראינה', 'סין'];
const ALLOWED_CLUBS = ['מכבי אקרוג\'ים', 'הפועל תל אביב', 'שער הנגב', 'מכבי קריית אונו']; // תרחיב בהמשך
const JUDGE_LEVELS = ['מתחיל', 'מתקדם', 'בינלאומי'];
const BREVET_LEVELS = ['1', '2', '3'];

/* ---------- DB (Neon) ---------- */
const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('❌ DATABASE_URL is missing');
    process.exit(1);
}
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});
try {
    const host = new URL(connectionString).hostname;
    console.log('DB host:', host);
} catch { }

/* ---------- JWT ---------- */
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

/* ---------- Rate limit ---------- */
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
}));
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
});

/* ---------- סכימה (DDL) ---------- */
async function ensureSchema() {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      full_name text NOT NULL,
      phone text,
      country text,                -- "ישראל" | "בריטניה" | "ארצות הברית" | "רוסיה" | "אוקראינה" | "סין"
      club text,                   -- "מכבי אקרוג'ים" | "הפועל תל אביב" | "שער הנגב" | "מכבי קריית אונו"
      is_coach boolean NOT NULL DEFAULT false,
      is_judge boolean NOT NULL DEFAULT true,
      judge_level text,            -- "מתחיל" | "מתקדם" | "בינלאומי"
      brevet_level text,           -- אם judge_level="בינלאומי": "1" | "2" | "3"
      avatar_url text,             -- תמונת פרופיל (URL)
      role text NOT NULL DEFAULT 'judge', -- תאימות אחורה
      is_admin boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      used boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);`);
}

/* ---------- עזר ---------- */
const normEmail = (s = '') => s.trim().toLowerCase();

/* ---------- Middleware אימות ---------- */
function requireAuth(req, res, next) {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; // { uid }
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

/* ---------- Health & Diagnostics ---------- */
app.get('/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true });
    } catch (e) {
        console.error('Health DB error:', e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.get('/', (_req, res) => {
    res.json({
        ok: true,
        version: BUILD_TAG,
        routes: [
            '/health', '/version', '/_debug/db',
            '/auth/register', '/auth/login', '/auth/request-password-reset', '/auth/reset-password',
            '/me (GET/PUT)',
            '/admin/users (GET, PUT /:id, DELETE /:id)',
        ],
    });
});

app.get('/version', (_req, res) => res.json({ version: BUILD_TAG }));

// מי רץ? עוזר לוודא שאנחנו על הבילד הנכון
app.get('/whoami', (_req, res) => {
    res.json({
        version: BUILD_TAG,
        node: process.version,
        env: process.env.NODE_ENV || 'dev',
        commit: process.env.RENDER_GIT_COMMIT || process.env.COMMIT || null,
        startedAt: new Date().toISOString()
    });
});


app.get('/_debug/db', async (_req, res) => {
    try {
        const r = await pool.query('SELECT now() as now');
        res.json({ ok: true, now: r.rows[0].now });
    } catch (e) {
        console.error('DB debug error:', e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

/* ---------- ולידציה להרשמה ---------- */
function validateRegistration({ email, password, fullName, country, isCoach, club, isJudge, judgeLevel, brevetLevel }) {
    if (!email || !password || !fullName) return 'Missing fields';
    if (password.length < 8) return 'Password must be at least 8 chars';

    // מדינה חובה אחרי פרטים בסיסיים
    if (!country || !ALLOWED_COUNTRIES.includes(country)) return 'Invalid country';

    // אם מאמן -> אגודה חובה מרשימה קיימת (עד שתרחיב)
    if (isCoach) {
        if (!club || !ALLOWED_CLUBS.includes(club)) return 'Club is required and must be from list';
    }

    // בלוק שופט: אם סומן isJudge, דרגת שיפוט חובה
    if (isJudge) {
        if (!judgeLevel || !JUDGE_LEVELS.includes(judgeLevel)) return 'Invalid judge level';
        if (judgeLevel === 'בינלאומי') {
            if (!brevetLevel || !BREVET_LEVELS.includes(String(brevetLevel))) return 'Brevet level required (1/2/3)';
        }
    } else {
        // אם לא שופט, אין ברווה
        if (brevetLevel) return 'Brevet level not allowed when not a judge';
    }

    // "שופט ניטרלי" לא קיים כשדה — הכלל שלך שהניטרלי רק אם לא מאמן נשמר ל-UI.
    return null;
}

/* ---------- Auth: Register ---------- */
app.post('/auth/register', authLimiter, async (req, res) => {
    try {
        let {
            email, password, fullName,
            phone, country, club,
            isCoach = false, isJudge = true,
            judgeLevel = null, brevetLevel = null,
            avatarUrl = null
        } = req.body || {};

        email = normEmail(email);

        const err = validateRegistration({ email, password, fullName, country, isCoach, club, isJudge, judgeLevel, brevetLevel });
        if (err) return res.status(400).json({ error: err });

        const exists = await pool.query(`SELECT 1 FROM users WHERE email=$1`, [email]);
        if (exists.rowCount) return res.status(409).json({ error: 'Email already registered' });

        const password_hash = await bcrypt.hash(password, 10);
        const ins = await pool.query(
            `INSERT INTO users
        (email, password_hash, full_name, phone, country, club,
         is_coach, is_judge, judge_level, brevet_level, avatar_url, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, email, full_name, phone, country, club, is_coach, is_judge,
                 judge_level, brevet_level, avatar_url, role, is_admin, created_at`,
            [email, password_hash, fullName, phone || null, country || null, club || null,
                !!isCoach, !!isJudge, judgeLevel || null, brevetLevel ? String(brevetLevel) : null, avatarUrl || null,
                (isJudge ? 'judge' : (isCoach ? 'coach' : 'user'))]
        );

        const user = ins.rows[0];
        const token = signToken({ uid: user.id });
        return res.status(201).json({
            user: {
                id: user.id, email: user.email, fullName: user.full_name,
                phone: user.phone, country: user.country, club: user.club,
                isCoach: user.is_coach, isJudge: user.is_judge,
                judgeLevel: user.judge_level, brevetLevel: user.brevet_level,
                avatarUrl: user.avatar_url, role: user.role, isAdmin: user.is_admin,
                createdAt: user.created_at
            },
            token
        });
    } catch (e) {
        if (e?.code === '23505') return res.status(409).json({ error: 'Email already registered' });
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
            `SELECT id, email, full_name, phone, country, club, is_coach, is_judge,
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
                id: u.id, email: u.email, fullName: u.full_name,
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

/* ---------- פרופיל: /me ---------- */
app.get('/me', requireAuth, async (req, res) => {
    const q = await pool.query(
        `SELECT id, email, full_name, phone, country, club, is_coach, is_judge,
            judge_level, brevet_level, avatar_url, role, is_admin, created_at
     FROM users WHERE id=$1`, [req.user.uid]);
    if (!q.rowCount) return res.status(404).json({ error: 'User not found' });
    const u = q.rows[0];
    res.json({
        user: {
            id: u.id, email: u.email, fullName: u.full_name,
            phone: u.phone, country: u.country, club: u.club,
            isCoach: u.is_coach, isJudge: u.is_judge,
            judgeLevel: u.judge_level, brevetLevel: u.brevet_level,
            avatarUrl: u.avatar_url, role: u.role, isAdmin: u.is_admin, createdAt: u.created_at
        }
    });
});

app.put('/me', requireAuth, async (req, res) => {
    const { fullName, phone, country, club, isCoach, isJudge, judgeLevel, brevetLevel, avatarUrl } = req.body || {};

    // ולידציות בסיס (אם שולחים ערכים חדשים)
    if (country && !ALLOWED_COUNTRIES.includes(country)) return res.status(400).json({ error: 'Invalid country' });
    if (typeof isCoach === 'boolean' && isCoach) {
        if (club && !ALLOWED_CLUBS.includes(club)) return res.status(400).json({ error: 'Club must be from list' });
    }
    if (typeof isJudge === 'boolean' && isJudge) {
        if (judgeLevel && !JUDGE_LEVELS.includes(judgeLevel)) return res.status(400).json({ error: 'Invalid judge level' });
        if (judgeLevel === 'בינלאומי') {
            if (!BREVET_LEVELS.includes(String(brevetLevel))) return res.status(400).json({ error: 'Brevet level required (1/2/3)' });
        }
    }

    const q = await pool.query(
        `UPDATE users SET
        full_name   = COALESCE($2, full_name),
        phone       = COALESCE($3, phone),
        country     = COALESCE($4, country),
        club        = COALESCE($5, club),
        is_coach    = COALESCE($6, is_coach),
        is_judge    = COALESCE($7, is_judge),
        judge_level = COALESCE($8, judge_level),
        brevet_level= COALESCE($9, brevet_level),
        avatar_url  = COALESCE($10, avatar_url)
     WHERE id=$1
     RETURNING id, email, full_name, phone, country, club, is_coach, is_judge,
               judge_level, brevet_level, avatar_url, role, is_admin, created_at`,
        [req.user.uid,
        fullName ?? null,
        phone ?? null,
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
            id: u.id, email: u.email, fullName: u.full_name,
            phone: u.phone, country: u.country, club: u.club,
            isCoach: u.is_coach, isJudge: u.is_judge,
            judgeLevel: u.judge_level, brevetLevel: u.brevet_level,
            avatarUrl: u.avatar_url, role: u.role, isAdmin: u.is_admin, createdAt: u.created_at
        }
    });
});

/* ---------- איפוס סיסמה ---------- */
app.post('/auth/request-password-reset', authLimiter, async (req, res) => {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Missing email' });
    const em = normEmail(email);

    const q = await pool.query(`SELECT id FROM users WHERE email=$1`, [em]);
    if (!q.rowCount) return res.json({ ok: true }); // לא חושפים אם קיים/לא

    const userId = q.rows[0].id;
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query(
        `INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1,$2,$3)`,
        [userId, token, expires]
    );

    // כאן בפועל שולחים מייל. כרגע לצורך בדיקות מחזירים token:
    return res.json({ ok: true, token });
});

app.post('/auth/reset-password', authLimiter, async (req, res) => {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) return res.status(400).json({ error: 'Missing fields' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 chars' });

    const q = await pool.query(
        `SELECT id, user_id, expires_at, used FROM password_resets WHERE token=$1`, [token]);
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
        `SELECT id, email, full_name, phone, country, club, is_coach, is_judge, judge_level, brevet_level, avatar_url, role, is_admin, created_at
     FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    res.json({ items: q.rows, nextOffset: offset + q.rowCount });
});

app.put('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
    const { isAdmin } = req.body || {};
    if (typeof isAdmin !== 'boolean') return res.status(400).json({ error: 'Missing isAdmin' });
    const q = await pool.query(
        `UPDATE users SET is_admin=$2 WHERE id=$1
     RETURNING id, email, full_name, is_admin`,
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
    res.status(500).json({
        error: err?.message || 'Unhandled server error',
        where: `${req.method} ${req.url}`,
    });
});

/* ---------- Start ---------- */
const port = process.env.PORT || 10000;
(async () => {
    try {
        await ensureSchema();
        app.listen(port, () => console.log('API on :' + port));
    } catch (e) {
        console.error('Startup error:', e);
        process.exit(1);
    }
})();
