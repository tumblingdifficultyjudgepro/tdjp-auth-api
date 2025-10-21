// index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();

/* ---------- בסיס ---------- */
app.set('trust proxy', 1); // Render/Proxy
app.use(helmet());
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '1mb' }));

// תגית גרסה לזיהוי בדיפלוי
const BUILD_TAG = 'auth-api v1.0.3';

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

/* ---------- סכימה (יצירה אוטומטית) ---------- */
async function ensureSchema() {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      full_name text NOT NULL,
      role text NOT NULL DEFAULT 'judge',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
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
        routes: ['/health', '/version', '/_debug/db', '/auth/register', '/auth/login'],
    });
});

app.get('/version', (_req, res) => {
    res.json({ version: BUILD_TAG });
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

/* ---------- עוזר קטן ---------- */
const normEmail = (s = '') => s.trim().toLowerCase();

/* ---------- Auth: Register ---------- */
app.post('/auth/register', authLimiter, async (req, res) => {
    try {
        let { email, password, fullName, role = 'judge' } = req.body || {};
        email = normEmail(email);

        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Missing fields' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 chars' });
        }

        const exists = await pool.query('SELECT 1 FROM users WHERE email=$1', [email]);
        if (exists.rowCount) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const ins = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id, email, full_name, role, created_at`,
            [email, password_hash, fullName.trim(), role]
        );

        const user = ins.rows[0];
        const token = signToken({ uid: user.id });

        return res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                createdAt: user.created_at,
            },
            token,
        });
    } catch (e) {
        if (e && e.code === '23505') {
            return res.status(409).json({ error: 'Email already registered' });
        }
        console.error('Register error:', e);
        return res.status(500).json({ error: e.message || 'Server error' });
    }
});

/* ---------- Auth: Login ---------- */
app.post('/auth/login', authLimiter, async (req, res) => {
    try {
        let { email, password } = req.body || {};
        email = normEmail(email);

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        const q = await pool.query(
            `SELECT id, email, full_name, role, password_hash FROM users WHERE email=$1`,
            [email]
        );
        if (!q.rowCount) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const u = q.rows[0];
        const ok = await bcrypt.compare(password, u.password_hash);
        if (!ok) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = signToken({ uid: u.id });
        return res.json({
            user: { id: u.id, email: u.email, fullName: u.full_name, role: u.role },
            token,
        });
    } catch (e) {
        console.error('Login error:', e);
        return res.status(500).json({ error: e.message || 'Server error' });
    }
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
