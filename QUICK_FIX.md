# Quick Fix for Workflow Errors

## Issues Fixed

### 1. Frontend Supabase Direct Query (403/406 errors)
**Problem**: Frontend was querying Supabase directly, causing auth errors

**Fix**: Changed `InspectionDetail.jsx` to use backend API instead
```javascript
// Before: Direct Supabase query
const { data, error } = await supabase.from('inspections').select('*').eq('id', id).single();

// After: Backend API call
const response = await api.get(`/inspections/${id}`);
```

### 2. Storage Bucket Missing (500 error on complete)
**Problem**: Supabase storage bucket "inspections" doesn't exist

**Fix**: Created `backend/setup-storage.sql` with bucket creation and RLS policies

## What You Need to Do Now

### Step 1: Create Storage Bucket
Go to your Supabase Dashboard:
1. Click on "Storage" in the left sidebar
2. Click "New bucket" button
3. Enter name: `inspections`
4. Check "Public bucket" checkbox
5. Click "Create bucket"

**OR** run the SQL in `backend/setup-storage.sql` in Supabase SQL Editor

### Step 2: Restart Backend Server
The backend server MUST be restarted to ensure workflow routes are loaded:

```bash
cd backend
npm run dev
```

You should see:
```
🚀 RoadSense API running on port 5001
📍 Health check: http://localhost:5001/api/health
```

### Step 3: Test the Workflow
1. Login as admin (admin@roadsense.com)
2. Go to an inspection detail page
3. Try updating the status - should work now (no 404)
4. Upload an after image and complete - should work now (no 500)
5. Login as inspector and add feedback on completed inspection

## Files Changed
- `frontend/src/pages/InspectionDetail.jsx` - Fixed to use backend API
- `backend/setup-storage.sql` - NEW: Storage bucket setup
- `WORKFLOW_SETUP.md` - Updated with complete troubleshooting guide

## Expected Behavior After Fix
- Admin can update repair status ✓
- Admin can upload after image and complete inspection ✓
- Inspector can view repair status and images ✓
- Inspector can add feedback on completed repairs ✓
- Feedback visible to both admin and inspector ✓

## If Still Getting Errors

### 500 Error on Complete
Check backend console logs for detailed error message. Common causes:
- Storage bucket not created
- File too large (max 10MB)
- Wrong file format (only JPEG, PNG allowed)

### 404 Error on Status Update
- Backend server not restarted
- Workflow routes not registered in server.js

### Network Errors
- Backend not running on port 5001
- Frontend not running on port 5174
- CORS issues (check backend CORS config)
