# PSD v1 - Journey

Dokumen ini merangkum spesifikasi sistem Journey berdasarkan implementasi source code saat ini per 2026-05-04.

## 1. Ringkasan Produk

- Nama produk: Journey
- Jenis aplikasi: web app trading journal dan performance tracking
- Target user: trader retail, terutama crypto / futures crypto
- Tujuan utama:
  - mencatat trade secara terstruktur
  - memantau performa trading dan equity
  - mengelola deposit / withdraw
  - mengukur progress target global dan target harian
  - mendokumentasikan trading rules dan pelanggarannya
  - menyimpan hasil scanner / market analysis per pair dan timeframe

## 2. Status Sistem Saat Ini

Journey saat ini sudah berada pada tahap aplikasi fungsional end-to-end untuk use case inti. User dapat register/login, masuk ke dashboard, mencatat transaksi modal, membuat jurnal trade, membuat target, mengelola rules, dan menyimpan data scanner.

Beberapa bagian sudah production-like, tetapi masih ada area yang sifatnya partial, mock, atau belum konsisten antar layer. Ini penting untuk dijadikan baseline sebelum masuk fase pengembangan berikutnya.

## 3. Cakupan Fitur Aktif

### 3.1 Autentikasi

- Register user
- Login user
- Protected route di frontend
- Verifikasi token melalui middleware backend
- Endpoint profil dasar `GET /api/auth/me`

### 3.2 Dashboard

- Ringkasan:
  - current balance
  - total PnL
  - win rate
  - total trades
  - best trade
  - worst trade
  - active win streak
  - max win streak
  - average win / loss
  - profit factor
- Equity curve dari gabungan trade + transaction
- Recent trades
- Risk manager:
  - max loss type: `FIXED` atau `PERCENTAGE`
  - max loss value
  - pemakaian max loss hari ini
- Scanner status flag (`scannerEnabled`)

### 3.3 Trade Journal

- List trade
- Filter by:
  - start date
  - end date
  - pair
  - direction (di level UI)
- Create trade
- Update trade
- Delete trade
- Field trade yang didukung:
  - open time / exit time
  - pair
  - direction
  - entry / SL / TP / exit
  - pnl dan pnlPercent
  - strategy
  - screenshot URL
  - notes
  - tags
  - flag rule violation
  - relasi ke rule yang dilanggar

### 3.4 Capital Management

- List transaction
- Create transaction
- Tipe transaksi:
  - `DEPOSIT`
  - `WITHDRAW`
- Summary:
  - net deposit
  - total PnL
  - current balance

### 3.5 Targets & Compounding

- Target type:
  - `GLOBAL`
  - `DAILY`
- Fitur target global:
  - start balance
  - target balance
  - deadline
  - progress terhadap current balance
- Fitur target harian:
  - daily percent
  - projection 30 / 60 / 90 hari
  - daily logs
  - heatmap konsistensi

### 3.6 Trading Rules

- CRUD rules
- Kategori rule:
  - `ENTRY`
  - `EXIT`
  - `RISK`
  - `PSYCHOLOGY`
- Aktivasi / deaktivasi rule
- Rule stats:
  - compliance rate
  - violation rate
  - total trades
  - trades with violation
  - ranking rule paling sering dilanggar
- Relasi rules ke trade melalui tabel join `TradeRule`

### 3.7 Scanner Pro

- Penyimpanan hasil scanner per:
  - tanggal
  - pair
  - timeframe
- Watchlist default di frontend:
  - BTC/USDT
  - ETH/USDT
  - BNB/USDT
  - SOL/USDT
  - XRP/USDT
- Realtime price ticker via WebSocket
- Manual add scanner record
- Auto scan trigger dari UI
- Detail side panel untuk melihat analisis scanner
- Endpoint helper untuk PD array calculation

## 4. Arsitektur Sistem

## Frontend

- Framework: React 19 + Vite
- Language: TypeScript
- Routing: `react-router-dom`
- State management: Zustand
- HTTP client: Axios
- UI styling: Tailwind CSS
- Animation: Framer Motion
- Charts:
  - Recharts
  - Lightweight Charts

## Backend

- Runtime: Node.js
- Framework: Express
- ORM: Prisma
- Database: MySQL
- Auth: JWT + bcryptjs
- Security middleware:
  - helmet
  - express-rate-limit
  - xss-clean
  - hpp
- Realtime:
  - external Binance WebSocket
  - internal WebSocket server `/ws/prices`

## Pola aplikasi

- Frontend SPA dengan route terlindungi setelah login
- Backend REST API di prefix `/api`
- Penyimpanan state auth di Zustand persist + localStorage token
- Prisma dipakai langsung di controller

## 5. Struktur Modul Frontend

Route aktif saat ini:

- `/login`
- `/register`
- `/dashboard`
- `/journal`
- `/transactions`
- `/targets`
- `/rules`
- `/scanner`

Layout utama terdiri dari:

- Sidebar navigasi
- Header
- Main content area
- Mobile sidebar toggle

## 6. Struktur Modul Backend

Route backend saat ini:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard/stats`
- `GET /api/trades`
- `POST /api/trades`
- `GET /api/trades/:id`
- `PUT /api/trades/:id`
- `DELETE /api/trades/:id`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/targets`
- `POST /api/targets`
- `PUT /api/targets/:id`
- `DELETE /api/targets/:id`
- `GET /api/targets/daily-logs`
- `POST /api/targets/daily-logs`
- `GET /api/targets/projection`
- `GET /api/rules`
- `POST /api/rules`
- `PUT /api/rules/:id`
- `DELETE /api/rules/:id`
- `GET /api/rules/stats`
- `POST /api/rules/trade-rules`
- `DELETE /api/rules/trade-rules/:id`
- `GET /api/scanner`
- `POST /api/scanner`
- `GET /api/scanner/price/:pair`
- `POST /api/scanner/prices`
- `POST /api/scanner/calculate-pd`
- `GET /api/settings`
- `PUT /api/settings`

## 7. Model Data Saat Ini

### User

- `id`
- `email`
- `password`
- `name`
- `createdAt`
- `scannerEnabled`
- `maxLossType`
- `maxLossValue`
- `maxLossResetDate`

### Trade

- `id`
- `userId`
- `openTime`
- `exitTime`
- `pair`
- `direction`
- `entryPrice`
- `slPrice`
- `tpPrice`
- `exitPrice`
- `pnl`
- `pnlPercent`
- `strategy`
- `screenshotUrl`
- `notes`
- `tags`
- `isRuleViolated`
- relasi ke `TradeRule`

### Transaction

- `id`
- `userId`
- `type`
- `amount`
- `note`
- `date`

### Target

- `id`
- `userId`
- `type`
- `name`
- `startBalance`
- `targetBalance`
- `dailyPercent`
- `deadline`
- `isActive`

### DailyTargetLog

- `id`
- `targetId`
- `userId`
- `date`
- `balanceStart`
- `targetAmount`
- `actualPnl`
- `isAchieved`

### Rule

- `id`
- `userId`
- `title`
- `description`
- `category`
- `isActive`

### TradeRule

- `id`
- `tradeId`
- `ruleId`

### Scanner

- `id`
- `userId`
- `date`
- `pair`
- `timeframe`
- `currentPrice`
- `lastHigh`
- `lastLow`
- `pdArray`
- `pdPercent`
- `liquidityAbove`
- `liquidityBelow`
- `liquiditySide`
- `obBullish`
- `obBearish`
- `obSide`
- `trend`
- `structure`
- `volume`
- `volumeRatio`
- `bias`
- `confidence`
- `notes`

## 8. Aturan Bisnis yang Sudah Tercermin di Kode

### Auth

- email harus unik
- password di-hash dengan bcrypt
- login menghasilkan JWT

### Trade

- field wajib:
  - `openTime`
  - `pair`
  - `direction`
  - `entryPrice`
  - `pnl`
- `direction` hanya `LONG` atau `SHORT`
- harga numerik harus positif
- `exitTime` harus lebih besar dari `openTime`
- `pnlPercent` dihitung backend dari `pnl / entryPrice * 100`
- jika `ruleIds` dikirim, backend akan membuat relasi `TradeRule`

### Transaction

- `type` hanya `DEPOSIT` atau `WITHDRAW`
- `amount` harus > 0

### Target

- projection dihitung secara compounding berdasarkan `dailyPercent`
- daily log menggunakan nilai target harian dari `balanceStart * dailyPercent`

### Rules

- pelanggaran rule disimpan sebagai relasi trade-rule
- trade akan diberi flag `isRuleViolated = true` jika ada rule attached
- jika semua relasi dihapus, flag violation trade di-reset ke `false`

### Scanner

- satu record scanner unik per kombinasi:
  - `userId`
  - `date`
  - `pair`
  - `timeframe`
- helper PD array menghasilkan:
  - `PREMIUM`
  - `DISCOUNT`
  - `EQUILIBRIUM`

## 9. Integrasi Eksternal

### Binance WebSocket

- source realtime price: `wss://stream.binance.com:9443/ws/!miniTicker@arr`
- backend menyimpan seluruh ticker `*USDT` ke memory map
- frontend menerima broadcast dari backend melalui `/ws/prices`

### Local persistence

- auth state disimpan via Zustand persist
- token juga disimpan terpisah di `localStorage`

## 10. Kondisi Implementasi Per Modul

### Sudah solid / usable

- auth dasar
- CRUD trade
- dashboard summary
- create transaction
- target projection
- CRUD rules
- scanner record persistence
- realtime ticker feed

### Masih partial / belum lengkap

- transaction belum punya edit dan delete
- screenshot trade masih URL only, belum upload file
- scanner detail notes di panel belum persist ke backend
- auto scan di UI masih simulasi, belum analisis pasar yang sebenarnya
- filter scanner di tabel belum aktif
- export journal masih mock alert
- tombol view detail trade di journal belum punya perilaku nyata

## 11. Known Gaps dan Risiko Teknis

Bagian ini penting untuk perencanaan tahap berikutnya karena berdampak langsung ke scope pekerjaan.

### Gap fungsional

- `client/src/pages/Scanner.tsx` masih placeholder, tetapi route aktif memakai `ScannerPro.tsx`
- watchlist scanner masih hardcoded di store frontend
- tidak ada pengelolaan profile user selain settings risk/scanner

### Gap konsistensi data / implementasi

- perhitungan daily target log di backend memakai field `trade.date`, padahal schema trade menggunakan `openTime`
- query historical trade untuk target harian juga memakai `date`, bukan `openTime`
- artinya fitur `createDailyLog` berisiko tidak berjalan benar tanpa perbaikan query

### Gap arsitektur

- hampir setiap controller membuat instance `PrismaClient` sendiri
- belum ada layer service/domain yang memisahkan business logic dari controller
- belum ada test automated di repo

### Gap performa

- dashboard mengambil seluruh trade dan transaction user lalu menghitung statistik di memory
- backend websocket menyiarkan semua harga yang tersimpan ke setiap client setiap 1 detik
- pendekatan ini masih cukup untuk fase awal, tetapi akan menjadi bottleneck saat data user atau koneksi bertambah

### Gap UX

- masih ada beberapa feedback UI berbasis `alert()` / `confirm()`
- validasi frontend belum sepenuhnya konsisten antar form
- masih ada beberapa teks UI / komentar yang menunjukkan placeholder atau demo behavior

## 12. Baseline Non-Functional Saat Ini

### Security

- JWT auth aktif
- password hashed
- helmet, rate limit, xss-clean, hpp aktif
- CORS memakai env `CORS_ORIGIN` dengan fallback localhost

### Operasional

- backend dijalankan dari `server.js`
- frontend dibangun via Vite
- database dikelola dengan Prisma migration

### Observability

- logging masih dominan `console.log` / `console.error`
- `winston` ada di dependency backend tetapi belum dipakai

## 13. Rekomendasi Fokus Tahap Berikutnya

Jika dokumen ini dipakai sebagai dasar planning, prioritas yang paling masuk akal adalah:

1. Stabilize data correctness
   - perbaiki query target harian yang masih mengacu ke field trade yang salah
   - review ulang perhitungan balance, max loss, dan projection

2. Lengkapi fitur partial
   - edit/delete transaction
   - persist notes scanner
   - export journal
   - detail trade view

3. Naikkan kualitas arsitektur
   - prisma singleton
   - logging terpusat
   - environment config yang lebih rapi
   - test dasar untuk auth, trade, dashboard, target

4. Matangkan scanner engine
   - ganti auto scan mock menjadi rule engine / signal engine sungguhan
   - simpan watchlist per user
   - tambahkan filter dan ranking hasil scan

5. Siapkan production readiness
   - audit env
   - error handling lebih konsisten
   - pagination / aggregation strategy untuk data besar
   - monitoring dan deployment flow

## 14. Kesimpulan

Journey saat ini sudah lebih dari sekadar prototype UI. Sistem inti trading journal, analytics dasar, target, rules, dan scanner persistence sudah ada dan saling terhubung. Namun baseline ini masih membutuhkan satu fase stabilisasi agar layak dijadikan fondasi untuk fitur lanjutan yang lebih cerdas, khususnya pada area target harian, scanner automation, dan kualitas arsitektur backend.
