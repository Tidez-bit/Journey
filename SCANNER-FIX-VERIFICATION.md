# Scanner Fix Verification Guide

**Date**: May 5, 2026  
**Fix**: Scanner Delete & Multi-Pair Scan

---

## Prerequisites

1. Backend server running: `cd server && npm run dev`
2. Frontend running: `cd client && npm run dev`
3. User logged in to the app
4. Navigate to Scanner Pro page

---

## Test 1: Multi-Pair Scanning ✅

### Setup
1. Click "Watchlist" button in control bar
2. Add at least 3 pairs (e.g., BTC/USDT, ETH/USDT, SOL/USDT)
3. Close watchlist modal

### Test Steps

#### A. Quick Scan Section
1. **Verify**: Quick Scan Watchlist section appears below Price Ticker
2. **Verify**: All watchlist pairs shown as buttons
3. **Verify**: Pair count displayed (e.g., "3 pairs")
4. Click on "BTC/USDT" button
5. **Expected**: Button shows spinning RefreshCw icon
6. **Expected**: Button is disabled during scan
7. **Expected**: Other pair buttons remain enabled and clickable
8. Click on "ETH/USDT" button while BTC/USDT is still scanning
9. **Expected**: Both pairs scan simultaneously
10. **Expected**: Each has independent loading state
11. Wait for scans to complete
12. **Expected**: Scanner table updates with new records

#### B. Table Scan Column
1. Scroll to scanner table
2. **Verify**: "Scan" column exists between "Structure" and "Actions"
3. Click RefreshCw button on any row
4. **Expected**: That row's button shows spinning icon
5. **Expected**: Other rows' scan buttons remain enabled
6. Click scan button on different row
7. **Expected**: Both rows scan independently
8. **Expected**: Table updates after each scan completes

### Success Criteria
- ✅ Multiple pairs can scan simultaneously
- ✅ Each pair has independent loading state
- ✅ No blocking between different pairs
- ✅ Quick Scan section works correctly
- ✅ Table scan buttons work correctly

---

## Test 2: Delete Functionality ✅

### Setup
1. Ensure scanner table has at least 2 records
2. If not, scan some pairs first

### Test Steps

#### A. Delete Button Visibility
1. **Verify**: "Actions" column exists in table (last column)
2. **Verify**: Each row has Eye (view) and Trash2 (delete) buttons
3. Hover over Trash2 button
4. **Expected**: Button changes color to red
5. **Expected**: Tooltip shows "Delete record"

#### B. Delete Confirmation Modal
1. Click Trash2 button on any scanner record
2. **Expected**: ConfirmModal appears with:
   - Title: "Hapus Scanner Record"
   - Message: "Record scanner ini akan dihapus permanen. Lanjutkan?"
   - Red warning icon
   - "Batal" (Cancel) button
   - "Hapus" (Delete) button in red
3. Click "Batal"
4. **Expected**: Modal closes, record still in table
5. Click Trash2 button again
6. Click "Hapus"
7. **Expected**: Modal closes
8. **Expected**: Record disappears from table immediately

#### C. Database Verification
1. Open HeidiSQL (or your MySQL client)
2. Connect to `journey` database
3. Query: `SELECT * FROM scanners ORDER BY id DESC LIMIT 10;`
4. **Expected**: Deleted record is NOT in the database
5. **Expected**: Other records remain intact

#### D. Multiple Deletes
1. Delete another record from the table
2. **Expected**: Works correctly
3. Delete all records one by one
4. **Expected**: Table shows empty state:
   - Zap icon
   - "No scan data available"
   - "Scan pairs from your watchlist..."

### Success Criteria
- ✅ Delete button visible in Actions column
- ✅ ConfirmModal appears with correct Indonesian text
- ✅ Cancel button works (no deletion)
- ✅ Delete button removes record from UI
- ✅ Record deleted from database
- ✅ Multiple deletes work correctly
- ✅ Empty state shows when no records

---

## Test 3: Integration Test ✅

### Scenario: Full Workflow
1. Start with empty scanner table
2. Add 3 pairs to watchlist
3. Scan all 3 pairs from Quick Scan section
4. **Expected**: 3 records appear in table
5. Re-scan 1 pair from table Scan column
6. **Expected**: That record updates (check timestamp)
7. Delete 1 record
8. **Expected**: 2 records remain
9. Scan a new pair from Quick Scan
10. **Expected**: 3 records in table again
11. Delete all records
12. **Expected**: Empty state shows

### Success Criteria
- ✅ Scan → View → Delete workflow works smoothly
- ✅ No errors in browser console
- ✅ No errors in server logs
- ✅ UI updates correctly after each action

---

## Test 4: Error Handling ✅

### A. Delete Non-Existent Record
1. Open browser DevTools → Network tab
2. Note a scanner record ID (e.g., 123)
3. Delete that record
4. Try to delete it again by manually calling API:
   ```javascript
   fetch('http://localhost:5000/api/scanner/123', {
     method: 'DELETE',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     }
   })
   ```
5. **Expected**: 404 error "Scanner record not found"

### B. Delete Another User's Record
1. Login as User A, create scanner record (note ID)
2. Logout, login as User B
3. Try to delete User A's record via API
4. **Expected**: 404 error (ownership verification)

### C. Network Error
1. Stop backend server
2. Try to delete a record
3. **Expected**: Error logged in console
4. **Expected**: Record remains in UI (no false deletion)

### Success Criteria
- ✅ Proper error handling for non-existent records
- ✅ User ownership verification works
- ✅ Network errors handled gracefully

---

## Test 5: Performance Test ✅

### Scenario: Stress Test
1. Add 10 pairs to watchlist
2. Click scan on all 10 pairs rapidly from Quick Scan section
3. **Expected**: All 10 pairs scan simultaneously
4. **Expected**: No UI freezing or lag
5. **Expected**: All records appear in table
6. Delete all 10 records one by one
7. **Expected**: Each delete is instant
8. **Expected**: No performance degradation

### Success Criteria
- ✅ Handles 10+ simultaneous scans
- ✅ UI remains responsive
- ✅ Delete operations are fast

---

## Rollback Plan

If issues are found:

1. **Backend Rollback**:
   ```bash
   cd server
   git checkout HEAD~1 controllers/scannerController.js
   git checkout HEAD~1 routes/scannerRoutes.js
   npm run dev
   ```

2. **Frontend Rollback**:
   ```bash
   cd client
   git checkout HEAD~1 src/pages/ScannerPro.tsx
   npm run dev
   ```

3. **Database**: No schema changes, no rollback needed

---

## Known Limitations

1. **Scanner.tsx**: Placeholder file not updated (no functionality yet)
2. **Bulk Operations**: No "Delete All" or "Scan All" buttons
3. **Notifications**: No toast/notification on scan success/failure
4. **Scan History**: No visual indicator of last scan time in Quick Scan

---

## Success Checklist

- [ ] Multi-pair scanning works (Test 1)
- [ ] Delete functionality works (Test 2)
- [ ] Integration workflow smooth (Test 3)
- [ ] Error handling correct (Test 4)
- [ ] Performance acceptable (Test 5)
- [ ] No console errors
- [ ] No server errors
- [ ] Database records correct

---

## Sign-Off

**Tested By**: _________________  
**Date**: _________________  
**Status**: ☐ PASS  ☐ FAIL  
**Notes**: _________________

---

**Next Steps After Verification**:
1. ✅ Mark task as complete
2. ✅ Update project documentation
3. ✅ Commit changes to git
4. ✅ Deploy to staging (if applicable)
