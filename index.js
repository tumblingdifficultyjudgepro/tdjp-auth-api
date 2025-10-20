import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pkg from "pg";

const { Pool } = pkg;

const {
  DATABASE_URL,        // postgres://USER:PASS@HOST/DB
  JWT_SECRET,          // סוד לחתימת JWT
  PORT = 8080,
  CORS_ORIGIN = "*"    // אפשר להגביל לדומיין האפליקציה שלך בפרודקשן
} = process.env;

if (!DATABASE_URL || !JWT_SECRET) {
  console.error("Missing DATABASE_URL or JWT_SECRET env vars");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
const app = express();

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: false }));
app.use(express.json());

const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 100 });
app.use("/auth", authLimiter);

const signToken = (user) => jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
const authMiddleware = (req, res, next) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "Invalid token" }); }
};

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, fullName, role = "judge" } = req.body || {};
    if (!email || !password || password.length < 8) return res.status(400).json({ error: "Invalid email/password" });
    if (!["judge", "coach"].includes(role)) return res.status(400).json({ error: "Invalid role" });

    const pwHash = await bcrypt.hash(password, 12);
    const q = `insert into users (email, password_hash, full_name, role)
               values ($1,$2,$3,$4)
               returning id, email, full_name, role, created_at`;
    const { rows } = await pool.query(q, [email.toLowerCase(), pwHash, fullName || null, role]);
    const user = rows[0];
    const token = signToken(user);
    return res.status(201).json({ user, token });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Email already exists" });
    console.error(e); return res.status(500).json({ error: "Server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Missing email/password" });

    const { rows } = await pool.query("select * from users where email = $1 limit 1", [email.toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const safeUser = { id: user.id, email: user.email, full_name: user.full_name, role: user.role, created_at: user.created_at };
    const token = signToken(safeUser);
    return res.json({ user: safeUser, token });
  } catch (e) {
    console.error(e); return res.status(500).json({ error: "Server error" });
  }
});

app.get("/me", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "select id,email,full_name,role,created_at from users where id = $1 limit 1",
      [req.user.sub]
    );
    return res.json({ user: rows[0] || null });
  } catch (e) {
    console.error(e); return res.status(500).json({ error: "Server error" });
  }
});

app.put("/me", authMiddleware, async (req, res) => {
  try {
    const { fullName, role } = req.body || {};
    if (role && !["judge","coach"].includes(role)) return res.status(400).json({ error: "Invalid role" });
    const { rows } = await pool.query(
      "update users set full_name = coalesce($1, full_name), role = coalesce($2, role) where id = $3 returning id,email,full_name,role,created_at",
      [fullName ?? null, role ?? null, req.user.sub]
    );
    return res.json({ user: rows[0] });
  } catch (e) {
    console.error(e); return res.status(500).json({ error: "Server error" });
  }
});

// ---- ADMIN USERS LIST (protected) ----
app.get('/admin/users', authMiddleware, async (req, res) => {
    try {
        // בקרת הרשאות בסיסית: רק coach (אפשר להחליף ל-'admin' אם תוסיף תפקיד)
        const me = await pool.query('select role from users where id=$1', [req.user.sub]);
        if (!me.rows[0] || me.rows[0].role !== 'coach') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
        const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

        const { rows } = await pool.query(
            `select id, email, full_name, role, created_at
       from users
       order by created_at desc
       limit $1 offset $2`,
            [limit, offset]
        );
        res.json({ users: rows, limit, offset });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// ---- ADMIN USERS COUNT (protected) ----
app.get('/admin/users/count', authMiddleware, async (req, res) => {
    try {
        const me = await pool.query('select role from users where id=$1', [req.user.sub]);
        if (!me.rows[0] || me.rows[0].role !== 'coach') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const { rows } = await pool.query('select count(*)::int as count from users');
        res.json({ count: rows[0].count });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});


app.listen(PORT, () => console.log(`API on :${PORT}`));
