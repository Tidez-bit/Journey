# Scanner Type Fix - Quick Test Guide

**Date**: May 5, 2026  
**Fixes**: Delete modal type mismatch + Backend validation improvements

---

## 🚀 Quick Start

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev

# Open browser
http://localhost:5173
```

---

## ✅ Test 1: Delete Modal Appears (CRITICAL)

**Before Fix**: Modal never appeared  
**After Fix**: Modal should appear immediately

### Steps:
1. Login to Journey app
2. Navigate to **Scanner Pro** page
3. If no scanner records exist:
   - Click "Watchlist" → Add pairs (BTC/USDT, ETH/USDT)
   - Click scan on any pair from Quick Scan section
   - Wait for record to appear in table
4. Find any record in scanner table
5. Click **Trash2 icon** (🗑️) in Actions column

### Expected Results:
- ✅ ConfirmModal appears **immediately**
- ✅ Modal shows:
  - Title: "Hapus Scanner Record"
  - Message: "Record scanner ini akan dihapus permanen. Lanjutkan?"
  - Red warning icon
  - "Batal" and "Hapus" buttons
- ✅ Click "Batal" → Modal closes, record remains
- ✅ Click Trash2 again → Click "Hapus" → Record deleted

### If Modal Doesn't Appear:
```javascript
// Open browser console and check:
console.log(typeof s.id); // Should be "number" or "string"

// Check state type in React DevTools:
// deleteTargetId should be string | null
```

---

## ✅ Test 2: Delete Functionality Works

### Steps:
1. Click Trash2 on any scanner record
2. Modal appears (from Test 1)
3. Click **"Hapus"** button

### Expected Results:
- ✅ Modal closes immediately
- ✅ Record disappears from table
- ✅ No console errors
- ✅ No server errors

### Verify in Database:
```sql
-- Open HeidiSQL
-- Connect to journey database
SELECT * FROM scanners ORDER BY id DESC LIMIT 10;
-- Deleted record should NOT be in results
```

---

## ✅ Test 3: Invalid Delete ID Validation

### Steps:
1. Open browser DevTools → Console
2. Run this command:
```javascript
fetch('http://localhost:5000/api/scanner/invalid', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log)
```

### Expected Results:
- ✅ Response: `{ message: "Invalid scanner ID" }`
- ✅ Status: 400 Bad Request
- ✅ No server crash
- ✅ Error logged in server console

---

## ✅ Test 4: Price Data Validation

### Steps:
1. Add a pair to watchlist (e.g., ETH/USDT)
2. Click scan on that pair
3. Check browser console
4. Check server console

### Expected Results:
- ✅ No "Price data not available" errors
- ✅ Price shows correctly in table (not $0.00)
- ✅ If error occurs, server logs show:
  ```
  Price data not available for pair: ETH/USDT (Binance format: ETHUSDT)
  ```

### If Price Shows $0.00:
1. Check server console for error message
2. Verify Binance WebSocket is connected:
   ```
   [INFO] Binance WebSocket Connected
   ```
3. Check if pair exists in price service:
   ```javascript
   // In browser console
   fetch('http://localhost:5000/api/scanner/price/ETH/USDT', {
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     }
   }).then(r => r.json()).then(console.log)
   ```

---

## ✅ Test 5: Multi-Pair Scanning

### Steps:
1. Add 3+ pairs to watchlist (BTC/USDT, ETH/USDT, SOL/USDT)
2. Click scan on all 3 from Quick Scan section
3. Wait for all scans to complete

### Expected Results:
- ✅ All 3 pairs scan simultaneously
- ✅ All prices show correctly (not $0.00)
- ✅ No console errors
- ✅ No server errors
- ✅ All records appear in table

---

## ✅ Test 6: Type Safety Check

### Steps:
1. Open browser DevTools → React DevTools
2. Find ScannerPro component
3. Check state: `deleteTargetId`

### Expected Results:
- ✅ Type: `string | null`
- ✅ Value when modal open: `"123"` (string)
- ✅ Value when modal closed: `null`

### In Code:
```typescript
// Should be:
const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

// NOT:
const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
```

---

## 🐛 Troubleshooting

### Problem: Modal Still Doesn't Appear

**Check 1**: Verify type change
```bash
cd client/src/pages
grep "deleteTargetId.*useState" ScannerPro.tsx
# Should show: useState<string | null>(null)
```

**Check 2**: Verify String() conversion
```bash
grep "setDeleteTargetId(String" ScannerPro.tsx
# Should show: setDeleteTargetId(String(s.id));
```

**Check 3**: Clear browser cache
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Problem: Delete Returns 400 Error

**Check**: ID format in request
```javascript
// In browser DevTools → Network tab
// Find DELETE request to /api/scanner/:id
// Check if :id is a valid number
```

**Fix**: Ensure String() conversion is applied
```typescript
setDeleteTargetId(String(s.id)); // ✅ Correct
setDeleteTargetId(s.id);         // ❌ Wrong
```

### Problem: Price Shows $0.00

**Check 1**: Binance WebSocket connection
```bash
# In server console, look for:
[INFO] Binance WebSocket Connected
```

**Check 2**: Price service has data
```javascript
// In browser console
fetch('http://localhost:5000/api/scanner/prices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({ pairs: ['BTC/USDT', 'ETH/USDT'] })
}).then(r => r.json()).then(console.log)
```

**Check 3**: Server logs
```bash
# Look for error messages like:
Price data not available for pair: ETH/USDT (Binance format: ETHUSDT)
Invalid price data for ETH/USDT: 0
```

---

## 📊 Success Criteria

| Test | Status | Notes |
|------|--------|-------|
| Delete modal appears | ☐ | Click Trash2 → Modal shows |
| Delete removes record | ☐ | Click Hapus → Record gone |
| Invalid ID validation | ☐ | Returns 400 error |
| Price validation | ☐ | No $0.00 prices |
| Multi-pair scanning | ☐ | All pairs work |
| Type safety | ☐ | string \| null type |

---

## 🎯 Quick Verification Commands

```bash
# Check TypeScript errors
cd client
npm run build

# Check backend starts without errors
cd server
npm run dev
# Look for: Server running on port 5000

# Check Binance connection
# In server console, look for:
# [INFO] Binance WebSocket Connected
```

---

## ✅ Sign-Off

**Tested By**: _________________  
**Date**: _________________  
**All Tests Pass**: ☐ YES  ☐ NO  
**Issues Found**: _________________

---

## 📚 Related Documentation

- `FIX-SCANNER-ANALYZE-DELETE-TYPE-COMPLETE.md` - Full fix details
- `SCANNER-FIX-VERIFICATION.md` - Original scanner fix tests
- `CHANGELOG.md` - All changes documented

---

**Status**: Ready for testing 🚀
