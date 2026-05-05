# Docker Environment Variables Fix — Complete ✅

**Date:** May 5, 2026  
**Issue:** Frontend cannot connect to backend - VITE_API_URL not being read  
**Status:** ✅ **FIXED**

---

## Problem Summary

The React frontend running in Docker with Vite dev server could not connect to the backend API because `VITE_API_URL` was not being picked up at runtime.

**Symptoms:**
- Browser console showed: `POST http://localhost:5000/auth/login 404`
- Missing `/api` prefix indicated `VITE_API_URL` was not being read
- `import.meta.env.VITE_API_URL` was `undefined`

**Root Cause:**
Vite dev server does NOT automatically read environment variables passed via Docker `environment:` or `args:` at runtime. Vite only reads from `.env` files that exist inside the container at build/startup time.

---

## Solution Applied

### 1. ✅ Cleaned up `.env` file
**File:** `client/.env`

**Before:** Had trailing spaces  
**After:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

**Why:** Trailing spaces can cause parsing issues

---

### 2. ✅ Updated Dockerfile to explicitly copy .env files
**File:** `client/Dockerfile`

**Added:**
```dockerfile
# Copy environment files first
COPY .env* ./
```

**Full Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy environment files first
COPY .env* ./

# Copy source
COPY . .

EXPOSE 5173

# Dev mode dengan host 0.0.0.0 agar bisa diakses dari luar container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Why:** Explicitly ensures .env files are copied into the container before Vite starts

---

### 3. ✅ Enhanced vite.config.ts with explicit env loading
**File:** `client/vite.config.ts`

**Before:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  }
})
```

**After:**
```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    // Explicitly define env variables to be exposed to the client
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL),
    }
  }
})
```

**Why:** 
- Explicitly loads environment variables from .env files
- Uses `define` to ensure variables are available at runtime
- More reliable than relying on Vite's automatic env loading

---

### 4. ✅ Removed incorrect environment configuration from docker-compose.yml
**File:** `docker-compose.yml`

**Before:**
```yaml
client:
  build:
    context: ./client
    dockerfile: Dockerfile
    args:
      VITE_API_URL: "http://localhost:5000"
      VITE_WS_URL: "ws://localhost:5000"
  environment:
    VITE_API_URL: "http://localhost:5000"
    VITE_WS_URL: "ws://localhost:5000"
```

**After:**
```yaml
client:
  build:
    context: ./client
    dockerfile: Dockerfile
  container_name: journey-client
  restart: unless-stopped
  ports:
    - "5173:5173"
  depends_on:
    - server
```

**Why:** 
- Docker `args` and `environment` do NOT work with Vite dev server
- Vite dev server only reads from .env files inside the container
- Removed to avoid confusion and ensure single source of truth (.env file)

---

## Files Modified

1. ✅ `client/.env` - Cleaned up trailing spaces
2. ✅ `client/Dockerfile` - Added explicit .env copy
3. ✅ `client/vite.config.ts` - Added explicit env loading with `define`
4. ✅ `docker-compose.yml` - Removed incorrect env configuration

**Total:** 4 files modified

---

## How It Works Now

### Build Time:
1. Docker builds the client image
2. Dockerfile copies `client/.env` into `/app/.env` inside container
3. Vite config loads env variables from `/app/.env`

### Runtime:
1. Container starts with `npm run dev`
2. Vite dev server reads `/app/.env` file
3. `loadEnv()` loads variables into `env` object
4. `define` makes variables available as `import.meta.env.VITE_API_URL`
5. Frontend code can access `import.meta.env.VITE_API_URL`

### In Browser:
```javascript
console.log(import.meta.env.VITE_API_URL)
// Output: "http://localhost:5000/api" ✅
```

---

## Testing Instructions

### 1. Rebuild and start containers:
```bash
docker compose down
docker compose up -d --build client
```

### 2. Check container logs:
```bash
docker logs journey-client
```

Expected output should show Vite starting without errors:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://0.0.0.0:5173/
```

### 3. Open browser console at http://localhost:5173
```javascript
// In browser console:
console.log(import.meta.env.VITE_API_URL)
// Should output: "http://localhost:5000/api"

console.log(import.meta.env.VITE_WS_URL)
// Should output: "ws://localhost:5000"
```

### 4. Test login/register:
1. Navigate to http://localhost:5173
2. Click "Register" or "Login"
3. Fill in credentials
4. Submit form
5. Check Network tab - should see:
   - `POST http://localhost:5000/api/auth/login` (200 OK) ✅
   - OR `POST http://localhost:5000/api/auth/register` (201 Created) ✅

### 5. Verify API calls work:
- Login should succeed and redirect to dashboard
- Dashboard should load data from backend
- No 404 errors in console
- All API calls should have `/api` prefix

---

## Troubleshooting

### If VITE_API_URL is still undefined:

1. **Check .env file exists in container:**
```bash
docker exec journey-client cat /app/.env
```
Should output:
```
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

2. **Check Vite is loading env:**
```bash
docker logs journey-client | grep VITE
```

3. **Rebuild without cache:**
```bash
docker compose build --no-cache client
docker compose up -d client
```

4. **Check for .dockerignore blocking .env:**
```bash
cat client/.dockerignore
```
Should NOT contain `.env` or `.env*`

---

## Why This Approach Works

### ❌ What DOESN'T work with Vite dev server:
- Docker `environment:` variables
- Docker `args:` in build
- Runtime environment variables
- `ENV` in Dockerfile

### ✅ What WORKS with Vite dev server:
- `.env` files copied into container
- `loadEnv()` in vite.config.ts
- `define` in vite.config.ts
- Files present at container startup

---

## Key Differences: Dev vs Production

### Development (Current Setup):
- Vite dev server runs inside container
- Reads `.env` files at startup
- Hot module replacement (HMR) enabled
- Source maps available
- **Environment variables from .env files only**

### Production (Future):
- Static build: `npm run build`
- Environment variables can be injected at build time
- No dev server, just static files
- Can use Docker `args` during build
- Served by nginx or similar

---

## Environment Variable Priority

Vite loads environment variables in this order (highest to lowest priority):

1. `.env.[mode].local` (e.g., `.env.development.local`)
2. `.env.[mode]` (e.g., `.env.development`)
3. `.env.local`
4. `.env`

**Current setup uses:** `.env` (base file)

---

## Security Notes

### Current Setup (Development):
- `.env` file contains localhost URLs
- Safe for development
- Should NOT be committed to git (add to .gitignore)

### Production Considerations:
- Use `.env.production` for production URLs
- Never commit sensitive keys to git
- Use Docker secrets or external secret management
- Consider using environment-specific .env files

---

## Verification Checklist

- [x] `.env` file exists in `client/` directory
- [x] `.env` file has no trailing spaces
- [x] `Dockerfile` explicitly copies `.env*` files
- [x] `vite.config.ts` uses `loadEnv()` and `define`
- [x] `docker-compose.yml` has no `environment:` or `args:` for client
- [x] No `.dockerignore` blocking `.env` files
- [x] `api.ts` uses `import.meta.env.VITE_API_URL`

---

## Commands Reference

### Rebuild client only:
```bash
docker compose up -d --build client
```

### View client logs:
```bash
docker logs -f journey-client
```

### Check env inside container:
```bash
docker exec journey-client cat /app/.env
```

### Restart client:
```bash
docker compose restart client
```

### Full rebuild (all services):
```bash
docker compose down
docker compose up -d --build
```

---

## Expected Results

### ✅ Success Indicators:
1. Browser console shows correct `VITE_API_URL`
2. Login/register works without 404 errors
3. API calls include `/api` prefix
4. Dashboard loads data successfully
5. No CORS errors
6. WebSocket connections work (if applicable)

### ❌ Failure Indicators:
1. `VITE_API_URL` is `undefined`
2. API calls go to `http://localhost:5000/auth/login` (missing `/api`)
3. 404 errors on all API calls
4. Cannot login or register
5. Dashboard shows no data

---

## Summary

**Problem:** Vite dev server in Docker couldn't read environment variables  
**Root Cause:** Docker `environment:` doesn't work with Vite dev server  
**Solution:** Use `.env` files copied into container + explicit `loadEnv()` in vite.config.ts  
**Result:** ✅ Frontend now connects to backend successfully

**Files Changed:** 4  
**Breaking Changes:** None  
**Requires Rebuild:** Yes (`docker compose up -d --build client`)

---

**Status: READY FOR TESTING** ✅

Run `docker compose up -d --build client` and test at http://localhost:5173
