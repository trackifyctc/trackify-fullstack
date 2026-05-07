# Testing Guide for Trackify Bug Fixes

This guide provides comprehensive testing procedures to verify all bug fixes have been properly implemented.

## Prerequisites

1. **Backend Running**: Ensure NestJS backend is running on `http://localhost:3001`
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Frontend Running**: Ensure React frontend is running (typically on `http://localhost:5173`)
   ```bash
   npm install
   npm run dev
   ```

3. **Database**: PostgreSQL should be running with the trackify database initialized

4. **Browser Console**: Open DevTools (F12) and go to Console tab to view debugging logs

## Bug Testing Checklist

### Bug #1: Location Display (Tampilan Lokasi: Data lokasi masih berupa ID)

**Expected Behavior**: Inventory items should display location names, not location IDs

**Test Steps**:
1. Login to the application
2. Navigate to "Inventaris" (Inventory) page
3. Verify that items show location names (e.g., "Warehouse A", "Storage Room") instead of IDs
4. Check console for any location-related errors

**Verification Points**:
- [ ] Location column shows readable names
- [ ] No console errors related to location data
- [ ] Location data is properly loaded with inventory items

**API Verification**:
- Open DevTools Network tab
- Go to Inventory page
- Find the GET request to `/api/inventory`
- Expand the response and verify items have `location: { id, name, code, ... }` object, not just `location_id` string

---

### Bug #2: Edit Inventory Not Working (Edit Inventaris Tidak Berfungsi)

**Expected Behavior**: Users should be able to edit inventory items and changes should be saved

**Test Steps**:
1. Login to application
2. Go to "Inventaris" page
3. Click on any inventory item to open its details
4. Modify at least one field (e.g., quantity, category)
5. Click Save/Update button
6. Verify that:
   - No error message appears
   - Data is updated on the server
   - Item details update in the list

**Verification Points**:
- [ ] Edit form opens without errors
- [ ] Changes can be entered
- [ ] Save button works and shows success
- [ ] Updated data reflects in inventory list
- [ ] Location information is preserved

**Console Verification**:
- Check for any fetch errors
- Look for "API Error" messages
- Verify no 400/500 HTTP errors

---

### Bug #3: Empty History (Menu History Kosong)

**Expected Behavior**: Activity logs should be displayed showing all inventory operations

**Test Steps**:
1. Login to application
2. Navigate to "History" page
3. Perform the following operations:
   - Create a new inventory item
   - Update an existing inventory item
   - Delete an inventory item
4. Refresh the History page and verify that new activity logs appear

**Verification Points**:
- [ ] History page displays activity logs
- [ ] New operations appear in history after refresh
- [ ] Each log shows: user, action, timestamp, and details
- [ ] Recent Activity section on Dashboard shows latest logs

**Test Scenarios**:
```
Action: Create new item "Test Item"
Expected: Activity log shows "Item created: Test Item" with user and timestamp

Action: Update quantity from 5 to 10
Expected: Activity log shows change details

Action: Delete item
Expected: Activity log shows "Item deleted: [name]"
```

**Console Verification**:
- Activity logs should be fetched without errors
- Look for successful API calls to `/api/activity/recent`

---

### Bug #4: Blank Location Page (Halaman Location Blank)

**Expected Behavior**: Locations page should display all warehouse locations with proper layout

**Test Steps**:
1. Login to application
2. Click on "Location" in sidebar
3. Verify page displays:
   - List of all warehouse locations
   - Location details (name, code, capacity)
   - Proper layout and styling
   - No blank/white screen

**Verification Points**:
- [ ] Page loads without white blank screen
- [ ] Locations data is displayed
- [ ] Proper error message if data fails to load
- [ ] Console shows successful data fetch

---

### Bug #5: Camera Features Incomplete (Kamera aktivitas incomplete)

**Expected Behavior**: Camera activity page should display camera monitoring features

**Test Steps**:
1. Login to application
2. Click on "Aktivitas Kamera" (Camera Activity) in sidebar
3. Verify page displays camera monitoring features
4. Check if camera feeds/activity logs display

**Verification Points**:
- [ ] Page loads without errors
- [ ] Camera-related data displays
- [ ] Navigation to camera page works

---

### Critical: Blank Dashboard After Login (New Issue)

**Expected Behavior**: After login, dashboard should load with data or display an error message

**Test Steps**:
1. Close any existing login sessions
2. Refresh the browser
3. Login with valid credentials:
   - Email: `admin@example.com`
   - Password: `123456`
4. Verify dashboard loads properly

**Expected Results - Success Case**:
- Dashboard displays with:
  - Stats cards (Total Barang, Tersedia, Berpindah, Peringatan Aktif)
  - Quick action buttons (Scan, Inventory, Locations, Devices)
  - Recent Activity section with latest logs
  - No white blank screen

**Expected Results - Error Case**:
- If backend is not running, should display error message:
  - Red alert box with error description
  - "Reload Page" button to retry
  - Console shows which API call failed

**Verification Points**:
- [ ] Dashboard loads after login
- [ ] Stats display correctly
- [ ] Recent activity shows logs
- [ ] Error state displays if backend unavailable
- [ ] No infinite loading spinner
- [ ] Console shows successful/failed API calls

---

## Browser Console Debugging

When testing, watch the console for the following helpful messages:

### Expected Console Logs

**Successful Login Flow**:
```
AuthContext: Attempting login for admin@example.com
AuthContext: Login response received, token: eyJ...
AuthContext: User data received: {id: 1, email: "admin@example.com", ...}
AuthContext: User state updated, returning true
Starting login process...
Login result: true
Login successful, navigating to dashboard...
DashboardPage mounted/updated: {loading: false, error: null, inventoryCount: 25, logsCount: 8}
```

**Data Fetching**:
```
Error fetching inventory: [error details if failed]
Error fetching activity logs: [error details if failed]
```

### Error Messages to Watch For

- `API Error: /api/inventory` - Backend not accessible
- `HTTP 401: Unauthorized` - Token expired
- `Network or parsing error` - Connection issue
- `Session expired. Please login again.` - Token validation failed

---

## Performance Verification

1. **API Response Time**: Monitor Network tab in DevTools
   - Inventory list should load in < 1 second
   - Activity logs should load in < 1 second
   - Dashboard should fully load in < 2 seconds

2. **Memory Usage**: Check for memory leaks
   - Open multiple pages
   - Come back to dashboard
   - Check that memory usage is stable

3. **Network Requests**: Verify no duplicate requests
   - Watch Network tab
   - Should see each endpoint called only once per load
   - No infinite polling or duplicate requests

---

## Integration Testing

### Complete User Flow

1. **Start Fresh**
   - Close browser
   - Clear localStorage
   - Reopen browser and go to app

2. **Login**
   - Enter credentials
   - Verify successful login
   - Dashboard loads properly

3. **Create Item**
   - Go to Inventory
   - Create new item
   - Verify activity log created

4. **View History**
   - Go to History page
   - Verify creation appears in logs

5. **Update Item**
   - Go back to Inventory
   - Edit the created item
   - Verify update appears in history

6. **Check Dashboard**
   - Return to Dashboard
   - Verify stats updated
   - Verify activity in Recent Activity section

7. **Logout and Login Again**
   - Logout
   - Login with same credentials
   - Verify dashboard loads with same data

---

## Troubleshooting

### Issue: Blank White Screen After Login

**Possible Causes**:
1. Backend not running
2. CORS issues
3. Invalid token
4. Database connection issue

**Debug Steps**:
1. Check browser console for error messages
2. Check Network tab for failed API calls
3. Verify backend is running: `http://localhost:3001/api/health`
4. Check backend console for errors

### Issue: Location Shows as ID

**Possible Causes**:
1. Location relation not loaded in query
2. Stale browser cache

**Debug Steps**:
1. Clear browser cache
2. Check Network response for location object structure
3. Check backend logs for query execution

### Issue: Activity Logs Not Appearing

**Possible Causes**:
1. Activity service not properly injected
2. User ID not being passed to service
3. Activity logs not being created

**Debug Steps**:
1. Create a new inventory item
2. Check backend logs for activity creation
3. Check database: `SELECT * FROM activities ORDER BY created_at DESC LIMIT 5;`

---

## Database Verification

Use these SQL queries to verify data integrity:

```sql
-- Check inventory items with locations
SELECT i.id, i.name, i.quantity, l.name as location_name
FROM inventory i
LEFT JOIN locations l ON i.location_id = l.id
ORDER BY i.created_at DESC LIMIT 10;

-- Check activity logs
SELECT id, user_id, action, description, created_at
FROM activities
ORDER BY created_at DESC LIMIT 20;

-- Check location data
SELECT id, name, code, capacity
FROM locations
ORDER BY created_at DESC;
```

---

## Sign-Off Checklist

- [ ] Bug #1 (Location Display): VERIFIED
- [ ] Bug #2 (Edit Inventory): VERIFIED
- [ ] Bug #3 (Empty History): VERIFIED
- [ ] Bug #4 (Blank Location Page): VERIFIED
- [ ] Bug #5 (Camera Features): VERIFIED
- [ ] Critical Issue (Blank Dashboard): VERIFIED
- [ ] No console errors during normal operation
- [ ] All API calls succeed
- [ ] Dashboard loads without errors
- [ ] User can complete full workflow
- [ ] Activity logging works for all operations
