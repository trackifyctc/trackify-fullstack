# Quick Validation Checklist

## Pre-Test Setup

- [ ] Backend is running: `cd backend && npm run start:dev`
- [ ] Frontend is running: `npm run dev`
- [ ] PostgreSQL database is running
- [ ] Browser DevTools Console is open (F12)
- [ ] Test credentials ready:
  - Email: `admin@example.com`
  - Password: `123456`

---

## Quick Test Flow (5 minutes)

### 1. Fresh Login Test
- [ ] Close all browser tabs
- [ ] Go to `http://localhost:5173` (or your frontend URL)
- [ ] Clear localStorage in DevTools (Application → Storage → LocalStorage)
- [ ] Login with test credentials
- [ ] **Expected**: Dashboard loads with data (no white blank screen)
- [ ] **Console check**: Look for "DashboardPage mounted/updated" message

### 2. Location Display Test
- [ ] Click "Inventaris" (Inventory) page
- [ ] **Expected**: See location names in the location column (not IDs)
- [ ] Open DevTools Network tab
- [ ] Refresh page
- [ ] Find GET `/api/inventory` request
- [ ] Check response JSON - should show `location: { id, name, code, ... }`

### 3. Activity Logging Test
- [ ] Still on Inventory page
- [ ] Create a new item (click "Tambah Item" or + button)
- [ ] Fill in item details and save
- [ ] Go to "History" page
- [ ] **Expected**: New item appears in activity log with "Created by [user]"
- [ ] Return to Inventory page
- [ ] Edit any item (change quantity, category, etc.)
- [ ] Go to History
- [ ] **Expected**: Update appears in activity log

### 4. Error Handling Test
- [ ] Stop backend server (Ctrl+C in backend terminal)
- [ ] On frontend, click "Reload Dashboard" or refresh
- [ ] **Expected**: See red error box saying "Error Loading Dashboard"
- [ ] **Expected**: See error message and "Reload Page" button
- [ ] Start backend server again
- [ ] Click "Reload Page" button
- [ ] **Expected**: Dashboard loads properly

### 5. Session/Token Test
- [ ] Login with valid credentials
- [ ] Go to DevTools → Application → Storage → LocalStorage
- [ ] Find token starting with "eyJ"
- [ ] Delete the token (simulate expired session)
- [ ] Try to refresh page or navigate
- [ ] **Expected**: Redirected to login page with message about session expiration

---

## Console Log Verification

Open DevTools Console (F12 → Console tab) and check for these messages after login:

**Should See** ✅:
```
AuthContext: Attempting login for admin@example.com
AuthContext: Login response received, token: eyJ...
AuthContext: User data received: {id: 1, full_name: "...", ...}
AuthContext: User state updated, returning true
DashboardPage mounted/updated: {loading: false, error: null, inventoryCount: X, logsCount: Y}
```

**Should NOT See** ❌:
```
Uncaught Error
404 Not Found
Infinite loop warning
Failed to fetch
```

---

## Network Tab Verification

With DevTools open (Network tab):

**Inventory Page Load Should Show**:
1. GET `/api/inventory` - Status 200, Response includes location objects
2. GET `/api/activity/recent` - Status 200, Response includes activity logs

**Each Response Should Include**:
- Inventory items with `location: { id, name, code, ... }` (NOT just location_id)
- Activity logs with `user`, `action`, `description`, `created_at`

---

## Database Verification (Optional)

If you have database access, run these SQL queries:

```sql
-- Check recent inventory items with locations
SELECT i.id, i.name, i.quantity, l.name as location 
FROM inventory i 
LEFT JOIN locations l ON i.location_id = l.id 
ORDER BY i.created_at DESC 
LIMIT 5;

-- Check activity logs
SELECT user_id, action, description, created_at 
FROM activities 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Final Validation Summary

| Test | Status | Notes |
|------|--------|-------|
| Login → Dashboard loads | ✅/❌ | |
| Location shows names | ✅/❌ | |
| Inventory edit works | ✅/❌ | |
| Activity logs appear | ✅/❌ | |
| Error displays properly | ✅/❌ | |
| Console shows correct logs | ✅/❌ | |
| No 404/500 errors | ✅/❌ | |

---

## Troubleshooting Quick Guide

**Issue: Still seeing blank dashboard after login**
- [ ] Check console for errors (look for red text)
- [ ] Verify backend is running: `http://localhost:3001/api/health`
- [ ] Check Network tab for failed API calls
- [ ] Clear browser cache: Ctrl+Shift+Delete

**Issue: Location still shows as ID**
- [ ] Verify backend was restarted after changes
- [ ] Check Network response in DevTools for location object
- [ ] Clear frontend cache and rebuild: `npm run build`

**Issue: Activity logs not appearing**
- [ ] Create/edit an item and wait 2 seconds
- [ ] Refresh History page
- [ ] Check backend logs for activity creation errors
- [ ] Check database for activity records

**Issue: "Session expired" error**
- [ ] This is EXPECTED behavior when token is invalid
- [ ] Login again to get new token
- [ ] Check that token is stored in localStorage

---

## Sign-Off

When all ✅ marks are filled, the system is ready for production:

- [ ] Fresh login works
- [ ] Dashboard displays data
- [ ] Locations show names
- [ ] Inventory edits work
- [ ] Activity logs created
- [ ] Errors display properly
- [ ] Console clean (no red errors)
- [ ] Network requests succeed

**Tester Name**: ________________  
**Date**: ________________  
**Status**: ✅ READY FOR DEPLOYMENT

---

## Quick Reference Links

- **Frontend**: http://localhost:5173
- **Backend Health**: http://localhost:3001/api/health
- **API Base**: http://localhost:3001/api

### Test Accounts
- Admin: `admin@example.com` / `123456`
- (Add other test accounts if available)

### Documentation
- [Bug Fixes Summary](./BUG_FIXES_SUMMARY.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [README](./README.md)
