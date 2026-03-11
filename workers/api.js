/**
 * Netixa API — Cloudflare Worker
 * Handles: /api/register, /api/login, /api/me, /api/logout,
 *          /api/orders (GET/POST), /api/masterclass (GET/POST),
 *          /api/products (GET/POST/PUT/DELETE), /api/users, /api/stats (admin)
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function err(msg, status = 400) {
  return json({ error: msg }, status);
}

// Simple SHA-256 hash using Web Crypto API (available in Workers)
async function sha256(text) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Generate a random session token
function randomToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Verify Authorization header, return user session or null
async function getSession(request, DB) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  const row = await DB.prepare("SELECT * FROM sessions WHERE token = ?")
    .bind(token)
    .first();
  return row || null;
}

export default {
  async fetch(request, env) {
    const { DB } = env;
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // ─── POST /api/register ──────────────────────────────────────────────
    if (path === "/api/register" && request.method === "POST") {
      const { name, email, password, whatsapp } = await request.json();

      if (!name || !email || !password)
        return err("Name, email and password are required.");
      if (password.length < 6)
        return err("Password must be at least 6 characters.");

      const existing = await DB.prepare("SELECT id FROM users WHERE email = ?")
        .bind(email)
        .first();
      if (existing) return err("Email already registered.", 409);

      const hash = await sha256(password);
      await DB.prepare(
        "INSERT INTO users (name, email, password_hash, whatsapp) VALUES (?, ?, ?, ?)",
      )
        .bind(name, email, hash, whatsapp || null)
        .run();

      // Auto-login: create session
      const token = randomToken();
      await DB.prepare(
        "INSERT INTO sessions (token, user_email, role, name) VALUES (?, ?, ?, ?)",
      )
        .bind(token, email, "student", name)
        .run();

      return json({ token, name, email, role: "student" });
    }

    // ─── POST /api/login ─────────────────────────────────────────────────
    if (path === "/api/login" && request.method === "POST") {
      const { email, password } = await request.json();
      if (!email || !password) return err("Email and password are required.");

      const hash = await sha256(password);
      const user = await DB.prepare(
        "SELECT * FROM users WHERE email = ? AND password_hash = ?",
      )
        .bind(email, hash)
        .first();

      if (!user) return err("Invalid credentials.", 401);

      const token = randomToken();
      await DB.prepare(
        "INSERT INTO sessions (token, user_email, role, name) VALUES (?, ?, ?, ?)",
      )
        .bind(token, user.email, user.role, user.name)
        .run();

      return json({
        token,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }

    // ─── GET /api/me ─────────────────────────────────────────────────────
    if (path === "/api/me" && request.method === "GET") {
      const session = await getSession(request, DB);
      if (!session) return err("Not authenticated.", 401);
      return json({
        name: session.name,
        email: session.user_email,
        role: session.role,
      });
    }

    // ─── POST /api/logout ────────────────────────────────────────────────
    if (path === "/api/logout" && request.method === "POST") {
      const session = await getSession(request, DB);
      if (session) {
        await DB.prepare("DELETE FROM sessions WHERE token = ?")
          .bind(
            (request.headers.get("Authorization") || "")
              .replace("Bearer ", "")
              .trim(),
          )
          .run();
      }
      return json({ ok: true });
    }

    // ─── POST /api/orders ────────────────────────────────────────────────
    if (path === "/api/orders" && request.method === "POST") {
      const session = await getSession(request, DB);
      if (!session) return err("Not authenticated.", 401);

      const { product_name, payment_id, amount } = await request.json();
      if (!product_name) return err("product_name is required.");

      await DB.prepare(
        "INSERT INTO orders (user_email, product_name, payment_id, amount) VALUES (?, ?, ?, ?)",
      )
        .bind(session.user_email, product_name, payment_id || null, amount || 0)
        .run();

      return json({ ok: true });
    }

    // ─── GET /api/orders ─────────────────────────────────────────────────
    if (path === "/api/orders" && request.method === "GET") {
      const session = await getSession(request, DB);
      if (!session) return err("Not authenticated.", 401);

      let rows;
      if (session.role === "admin") {
        rows = await DB.prepare("SELECT * FROM orders ORDER BY id DESC").all();
      } else {
        rows = await DB.prepare(
          "SELECT * FROM orders WHERE user_email = ? ORDER BY id DESC",
        )
          .bind(session.user_email)
          .all();
      }
      return json(rows.results);
    }

    // ─── POST /api/masterclass ───────────────────────────────────────────
    if (path === "/api/masterclass" && request.method === "POST") {
      const session = await getSession(request, DB);
      if (!session) return err("Not authenticated.", 401);

      // Get user details for whatsapp
      const user = await DB.prepare("SELECT * FROM users WHERE email = ?")
        .bind(session.user_email)
        .first();

      await DB.prepare(
        "INSERT OR IGNORE INTO masterclass (user_email, name, whatsapp) VALUES (?, ?, ?)",
      )
        .bind(session.user_email, session.name || "", user?.whatsapp || "")
        .run();

      return json({ ok: true, registered: true });
    }

    // ─── GET /api/masterclass ────────────────────────────────────────────
    if (path === "/api/masterclass" && request.method === "GET") {
      const session = await getSession(request, DB);
      if (!session || session.role !== "admin") return err("Admin only.", 403);
      const rows = await DB.prepare(
        "SELECT * FROM masterclass ORDER BY id DESC",
      ).all();
      return json(rows.results);
    }

    // ─── GET /api/users (admin only) ─────────────────────────────────────
    if (path === "/api/users" && request.method === "GET") {
      const session = await getSession(request, DB);
      if (!session || session.role !== "admin") return err("Admin only.", 403);
      const rows = await DB.prepare(
        "SELECT id, name, email, role, whatsapp, created_at FROM users ORDER BY id DESC",
      ).all();
      return json(rows.results);
    }

    // ─── GET /api/stats (admin only) ─────────────────────────────────────
    if (path === "/api/stats" && request.method === "GET") {
      const session = await getSession(request, DB);
      if (!session || session.role !== "admin") return err("Admin only.", 403);

      const [users, orders, masterclass] = await Promise.all([
        DB.prepare("SELECT COUNT(*) as count FROM users").first(),
        DB.prepare("SELECT COUNT(*) as count FROM orders").first(),
        DB.prepare("SELECT COUNT(*) as count FROM masterclass").first(),
      ]);

      return json({
        users: users.count,
        orders: orders.count,
        masterclass: masterclass.count,
      });
    }

    // ─── GET /api/products (PUBLIC — no auth needed) ─────────────────────
    if (path === "/api/products" && request.method === "GET") {
      const rows = await DB.prepare("SELECT * FROM products WHERE status = ? ORDER BY id ASC")
        .bind("Active").all();
      return json(rows.results);
    }

    // ─── POST /api/products (admin: create) ──────────────────────────────
    if (path === "/api/products" && request.method === "POST") {
      const session = await getSession(request, DB);
      if (!session || session.role !== "admin") return err("Admin only.", 403);
      const { name, price, old_price, desc, img } = await request.json();
      if (!name || !price) return err("name and price are required.");
      const result = await DB.prepare(
        "INSERT INTO products (name, price, old_price, desc, img) VALUES (?, ?, ?, ?, ?)"
      ).bind(name, price, old_price || "₹499", desc || "", img || "").run();
      return json({ ok: true, id: result.meta?.last_row_id });
    }

    // ─── PUT /api/products/:id (admin: update) ───────────────────────────
    if (path.startsWith("/api/products/") && request.method === "PUT") {
      const session = await getSession(request, DB);
      if (!session || session.role !== "admin") return err("Admin only.", 403);
      const id = path.split("/")[3];
      const { name, price, old_price, desc, img, status } = await request.json();
      await DB.prepare(
        "UPDATE products SET name=?, price=?, old_price=?, desc=?, img=?, status=? WHERE id=?"
      ).bind(name, price, old_price || "₹499", desc || "", img || "", status || "Active", id).run();
      return json({ ok: true });
    }

    // ─── DELETE /api/products/:id (admin: delete) ────────────────────────
    if (path.startsWith("/api/products/") && request.method === "DELETE") {
      const session = await getSession(request, DB);
      if (!session || session.role !== "admin") return err("Admin only.", 403);
      const id = path.split("/")[3];
      await DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }

    // ─── Proxy non-API requests to GitHub Pages (static site) ────────────
    // This handles netixa.tech being a custom domain on this Worker.
    // Any request that isn't /api/* is forwarded to GitHub Pages transparently.
    if (!path.startsWith("/api/")) {
      const STATIC_ORIGIN = "https://iamarjunaravind.github.io/masterclass";
      const staticUrl = STATIC_ORIGIN + path + (url.search || "");
      const staticReq = new Request(staticUrl, {
        method: request.method,
        headers: request.headers,
      });
      try {
        const staticRes = await fetch(staticReq);
        // Return the response with the original headers, allowing caching
        return new Response(staticRes.body, {
          status: staticRes.status,
          statusText: staticRes.statusText,
          headers: staticRes.headers,
        });
      } catch (e) {
        return new Response("Site temporarily unavailable.", { status: 502 });
      }
    }

    return err("Not found.", 404);
  },
};
