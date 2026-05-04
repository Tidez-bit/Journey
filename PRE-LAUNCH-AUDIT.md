# 🚀 JOURNEY — PRE-LAUNCH AUDIT RECAP
> **Tanggal Audit:** 2026-05-01 | **Auditor:** Antigravity AI | **Versi:** v1.0

---

## 🏆 LAUNCH READINESS SCORE

| Kategori | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Security | 55/100 | 25% | 13.75 |
| Functionality | 80/100 | 25% | 20.00 |
| Performance | 70/100 | 15% | 10.50 |
| UI/UX | 85/100 | 15% | 12.75 |
| Code Quality | 75/100 | 10% | 7.50 |
| Documentation | 30/100 | 5% | 1.50 |
| Deployment | 45/100 | 5% | 2.25 |
| **TOTAL** | | **100%** | **68 / 100** |

---

## 🎯 REKOMENDASI

> ### ⚠️ CONDITIONAL GO — Score 68/100
> **Selesaikan semua 7 Critical issue sebelum launch.**
> Estimasi waktu fix: **~1 jam total.**

---

## 🔴 CRITICAL ISSUES (7 items — WAJIB fix sebelum launch)

### C1 — JWT Secret Terlalu Lemah
- **File:** `server/.env`
- **Masalah:** `JWT_SECRET="journey_secret_key_2026"` — hanya 26 karakter, bisa di-brute force
- **Fix:**
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  Ganti value di `.env` dan `.env.production` dengan hasil generate di atas.
- **Waktu:** 2 menit

---

### C2 — `JWT_EXPIRE` Env Var Tidak Dibaca
- **File:** `server/controllers/authController.js:9`
- **Masalah:** Token selalu expire 30 hari meski `.env.production` set `JWT_EXPIRE=7d`
  ```js
  // SEKARANG (salah):
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

  // SEHARUSNYA:
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
  ```
- **Waktu:** 2 menit

---

### C3 — CORS Terbuka untuk Semua Origin
- **File:** `server/server.js:22`
- **Masalah:** `app.use(cors())` — mengizinkan request dari domain mana pun
  ```js
  // SEKARANG (berbahaya):
  app.use(cors());

  // SEHARUSNYA:
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  ```
- **Catatan:** `CORS_ORIGIN` sudah ada di `.env.production` — tinggal dihubungkan
- **Waktu:** 5 menit

---

### C4 — `console.log` Membocorkan Email User
- **File:** `client/src/pages/Register.tsx:17`
- **Masalah:**
  ```ts
  console.log('Register submit triggered', { name, email }); // ← leaks PII!
  ```
  Email user terlihat di browser DevTools siapa saja.
- **Fix:** Hapus baris tersebut.
- **Waktu:** 1 menit

---

### C5 — Tidak Ada Input Validation pada `createTrade`
- **File:** `server/controllers/tradeController.js:58`
- **Masalah:** Semua field diterima mentah tanpa validasi — `pair`, `direction`, `entryPrice`, `size`, dll.
- **Fix:** Tambahkan di awal fungsi `createTrade`:
  ```js
  if (!date || !pair || !direction || !entryPrice || !size) {
    return res.status(400).json({ message: 'Required fields: date, pair, direction, entryPrice, size' });
  }
  if (!['LONG', 'SHORT'].includes(direction)) {
    return res.status(400).json({ message: 'Direction must be LONG or SHORT' });
  }
  if (parseFloat(size) <= 0 || parseFloat(entryPrice) <= 0) {
    return res.status(400).json({ message: 'size and entryPrice must be positive numbers' });
  }
  ```
- **Waktu:** 15 menit

---

### C6 — Bug Double-Response di `authMiddleware` (Node.js Crash)
- **File:** `server/middleware/authMiddleware.js`
- **Masalah:** Ketika token invalid/expired, middleware mengirim **dua response** sekaligus → crash `Cannot set headers after they are sent`
  ```js
  // SEKARANG (buggy):
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
    // ← tidak ada return! lanjut ke if(!token) di bawah
  }
  if (!token) {
    res.status(401).json({ ... }); // ← DOUBLE RESPONSE!
  }
  ```
- **Fix:** Ganti seluruh isi file:
  ```js
  const jwt = require('jsonwebtoken');

  const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  };

  module.exports = { protect };
  ```
- **Waktu:** 5 menit

---

### C7 — API Base URL Hardcoded ke `localhost`
- **File:** `client/src/lib/api.ts:4`
- **Masalah:** `baseURL: 'http://localhost:5000/api'` — akan gagal di production
- **Fix:**
  ```ts
  // api.ts
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  ```
  Buat file `client/.env.production`:
  ```env
  VITE_API_URL=https://api.yourdomain.com/api
  ```
- **Waktu:** 5 menit

---

## 🟠 HIGH ISSUES (8 items — fix Week 1)

### H1 — 8× PrismaClient Instance (Memory Leak)
- **Masalah:** Setiap controller membuat `new PrismaClient()` sendiri → 8 connection pool terpisah
- **Fix:** Buat singleton `server/lib/prisma.js`:
  ```js
  const { PrismaClient } = require('@prisma/client');
  const prisma = global.__prisma || new PrismaClient();
  if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;
  module.exports = prisma;
  ```
  Lalu di setiap controller: `const prisma = require('../lib/prisma');`

### H2 — WebSocket Kirim Semua 500+ Pair Setiap Detik
- **File:** `server/ws/priceSocket.js:12`
- **Masalah:** `priceService.getAllPrices()` = semua pair Binance, broadcast tiap 1 detik ke semua client
- **Fix:** Filter hanya pair dari watchlist user, atau kirim diff saja

### H3 — Tidak Ada PM2 / Process Manager
- **File:** `server/package.json`
- **Masalah:** `"dev": "node server.js"` = sama dengan production, server tidak restart jika crash
- **Fix:** Buat `ecosystem.config.js`:
  ```js
  module.exports = {
    apps: [{ name: 'journey-api', script: 'server.js', instances: 1,
      env_production: { NODE_ENV: 'production' } }]
  };
  ```

### H4 — Tidak Ada Edit/Delete Transaction
- **Masalah:** `transactionController.js` hanya punya `getTransactions` + `createTransaction`
- **Fix:** Tambahkan `updateTransaction` dan `deleteTransaction` beserta route-nya

### H5 — Cascade Delete Tidak Dikonfigurasi di Schema
- **File:** `server/prisma/schema.prisma:115`
- **Masalah:** Hapus Trade tidak otomatis hapus TradeRule terkait
- **Fix:**
  ```prisma
  trade Trade @relation(fields: [tradeId], references: [id], onDelete: Cascade)
  rule  Rule  @relation(fields: [ruleId],  references: [id], onDelete: Cascade)
  ```

### H6 — Tidak Ada Navigasi Mobile
- **File:** `client/src/components/Layout.tsx`
- **Masalah:** Sidebar fixed `w-64`, tidak ada hamburger menu, layout rusak di layar kecil

### H7 — Winston Terinstall Tapi Tidak Dipakai
- **Masalah:** `winston` ada di `package.json` tapi semua logging pakai `console.log/error`
- **Fix:** Buat `server/lib/logger.js` dan replace semua console calls

### H8 — `.env.production` Masih Berisi Placeholder
- **Masalah:**
  ```
  DATABASE_URL=mysql://root:@localhost:3306/journey_db  ← no password!
  JWT_SECRET=super_secure_jwt_secret_min_32_chars_in_prod  ← placeholder!
  FRONTEND_URL=https://yourdomain.com  ← placeholder!
  ```
- **Fix:** Isi dengan nilai production yang sesungguhnya sebelum deploy

---

## 🟡 MEDIUM ISSUES (6 items — fix bulan pertama)

| # | Issue | File |
|---|-------|------|
| M1 | `alert()` dipakai di ScannerPro & Targets — ganti dengan toast | `ScannerPro.tsx:70`, `Targets.tsx:65` |
| M2 | Token disimpan dua kali di localStorage (`token` + `auth-storage`) | `authStore.ts:26` |
| M3 | Banyak `any` type di TypeScript | `TradeForm.tsx`, `ScannerPro.tsx`, `dashboardStore.ts` |
| M4 | Tidak ada React Error Boundary — crash 1 halaman = blank seluruh app | `App.tsx` |
| M5 | Dashboard load SEMUA trade tanpa pagination (bottleneck 1000+ trades) | `dashboardController.js:13` |
| M6 | `Scanner.tsx` adalah file kosong (stub yang tidak terpakai) | `src/pages/Scanner.tsx` |

---

## ✅ MODULE STATUS

| Module | Status | Catatan |
|--------|--------|---------|
| Auth — Register | ✅ OK | Hapus console.log |
| Auth — Login | ✅ OK | |
| Auth — Logout | ✅ OK | Clears localStorage + Zustand |
| Auth — Protected Routes | ✅ OK | ProtectedRoute component berfungsi |
| Auth — Token Refresh | ❌ Tidak Ada | Gap, mitigasi dengan token 30d |
| Transactions — CRUD | ⚠️ Partial | Read + Create OK. **Edit/Delete tidak ada** |
| Journal — Create/Edit/Delete | ✅ OK | |
| Journal — PnL Formula | ✅ Benar | `pnlPercent = (pnl / size) * 100` |
| Journal — Screenshot | ⚠️ URL Only | Multer installed tapi tidak dipakai |
| Journal — Rule Violation | ✅ OK | Pre-trade checklist berfungsi |
| Dashboard — Equity Curve | ✅ OK | |
| Dashboard — Win Rate | ✅ Benar | `(wins / total) * 100` |
| Dashboard — Max Loss Widget | ✅ OK | Feature baru berfungsi |
| Targets — Global + Daily | ✅ OK | |
| Targets — Heatmap | ✅ OK | Bulan berjalan |
| Targets — Projection | ✅ OK | Compound 30 hari |
| Rules — CRUD | ✅ OK | |
| Rules — Violation Tracking | ✅ OK | Join table TradeRule benar |
| Scanner — Real-time Price | ✅ OK | Binance WS dengan auto-reconnect |
| Scanner — Toggle ON/OFF | ✅ OK | scannerEnabled flag |
| Scanner — Auto Scan | ⚠️ Mock | Data hardcoded, bukan analisis nyata |

---

## 📋 CHECKLIST LAUNCH DAY

### ✅ Sebelum Deploy (Wajib)
- [ ] **C1:** Generate + set JWT secret baru (64-char hex)
- [ ] **C2:** Ubah `'30d'` → `process.env.JWT_EXPIRE || '7d'` di authController
- [ ] **C3:** Fix CORS pakai `process.env.CORS_ORIGIN`
- [ ] **C4:** Hapus `console.log` di `Register.tsx`
- [ ] **C5:** Tambah validasi di `createTrade`
- [ ] **C6:** Rewrite `authMiddleware.js` (fix double-response bug)
- [ ] **C7:** Ubah `baseURL` api.ts → `import.meta.env.VITE_API_URL`
- [ ] **C8:** Isi semua placeholder di `.env.production` dengan nilai nyata
- [ ] Backup database production sebelum deploy
- [ ] Jalankan `npx prisma migrate deploy` di production

### ✅ Saat Launch
- [ ] Cek `GET /api/health` → `{ status: 'ok' }`
- [ ] Test alur utama: Register → Login → Create Trade → Cek Dashboard
- [ ] Verifikasi WebSocket price stream aktif di Scanner
- [ ] Monitor error log 30 menit pertama

### ✅ 24 Jam Pertama Post-Launch
- [ ] Pantau error rate (target < 1%)
- [ ] Cek memory usage server
- [ ] Verifikasi tidak ada error di logs
- [ ] Fix hotfix jika ada issue kritis

---

## ⏱️ ESTIMASI WAKTU FIX

| Fase | Items | Total Waktu |
|------|-------|-------------|
| 🔴 Critical (sebelum launch) | C1–C7 | ~47 menit |
| 🟠 High (Week 1) | H1–H8 | ~5 jam |
| 🟡 Medium (Bulan 1) | M1–M6 | ~8 jam |

---

*Journey Pre-Launch Audit — Generated by Antigravity AI — 2026-05-01*
