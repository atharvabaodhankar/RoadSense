# Workflow Setup Guide

## Overview
The repair workflow system allows:
- Admins to update repair status, add notes, set estimated completion dates
- Admins to mark inspections as completed by uploading an "after" image
- Users (inspectors) to add feedback and ratings on completed repairs

## Database Setup

### 1. Add Workflow Fields to Inspections Table
Run the SQL migration in Supabase SQL Editor:

```bash
# File: node-test/add-workflow-fields.sql
```

This adds the following fields:
- `repair_status` - pending, in_progress, completed, rejected
- `after_image_url` - URL of the repair completion image
- `approved_by` - Admin user ID who approved/updated
- `approved_at` - Timestamp of approval
- `completion_date` - Date when repair was completed
- `estimated_completion_date` - Expected completion date
- `admin_notes` - Notes from admin about the repair
- `user_feedback` - Feedback from the user after completion
- `user_rating` - 1-5 star rating from user
- `feedback_at` - Timestamp when feedback was submitted

### 2. Create Supabase Storage Bucket
Run the storage setup SQL in Supabase SQL Editor:

```bash
# File: backend/setup-storage.sql
```

This creates:
- A public storage bucket named "inspections"
- RLS policies for read/write access
- Public read access for all images
- Authenticated users can upload
- Admins can delete

**IMPORTANT**: You can also create the bucket manually in Supabase Dashboard:
1. Go to Storage section
2. Click "New bucket"
3. Name: `inspections`
4. Public: `Yes` (checked)
5. Click "Create bucket"

## Backend Setup

### 1. Workflow Routes
The workflow routes are in `backend/routes/workflow.js`:

- `PATCH /api/workflow/:id/status` - Admin updates repair status
- `POST /api/workflow/:id/complete` - Admin completes with after image (REQUIRED)
- `POST /api/workflow/:id/feedback` - User adds feedback on completed repairs

### 2. Server Configuration
Routes are registered in `backend/server.js`:

```javascript
const workflowRoute = require("./routes/workflow");
app.use("/api/workflow", workflowRoute);
```

### 3. Restart Backend Server
**CRITICAL**: After adding workflow routes, you MUST restart the backend:

```bash
cd backend
npm run dev
```

The server should show:
```
🚀 RoadSense API running on port 5001
📍 Health check: http://localhost:5001/api/health
```

## Frontend Implementation

### InspectionDetail Page
Located at `frontend/src/pages/InspectionDetail.jsx`

**Admin View:**
- Update repair status dropdown (pending/in_progress/rejected)
- Set estimated completion date (for in_progress status)
- Add admin notes
- Upload after image (REQUIRED to complete)
- Set completion date
- Complete button (disabled without after image)

**Inspector View:**
- View repair status banner with color coding
- See before/after images
- Add feedback form (only on completed repairs)
- Star rating system (1-5 stars)
- Feedback textarea

**Both Views:**
- Original image
- AI-annotated image with defects
- After image (when completed)
- Location map
- Defect details
- Feedback display (once submitted)

## Workflow Process

### Step 1: Inspector Reports Issue
1. Inspector uploads road image
2. AI detects defects
3. Inspection created with `repair_status: 'pending'`

### Step 2: Admin Reviews
1. Admin views inspection in detail page
2. Updates status to "in_progress"
3. Sets estimated completion date
4. Adds admin notes about repair plan

### Step 3: Admin Completes Repair
1. Admin uploads "after" image showing completed repair
2. Sets completion date
3. Clicks "Complete Inspection"
4. Status changes to "completed"

### Step 4: User Provides Feedback
1. Inspector views completed inspection
2. Sees before/after images
3. Adds feedback about repair quality
4. Gives 1-5 star rating
5. Feedback visible to admin and user

## Troubleshooting

### 500 Error on Complete
**Cause**: Storage bucket doesn't exist or upload failed

**Solution**:
1. Check Supabase Dashboard → Storage
2. Verify "inspections" bucket exists and is public
3. Run `backend/setup-storage.sql` if missing
4. Check backend console logs for detailed error

### 404 Error on Status Update
**Cause**: Workflow routes not loaded

**Solution**:
1. Verify `backend/routes/workflow.js` exists
2. Check `backend/server.js` has workflow route registered
3. **RESTART backend server**: `cd backend && npm run dev`

### 403/406 Errors on Supabase
**Cause**: Frontend trying to query Supabase directly

**Solution**:
- Frontend now uses backend API (`/api/inspections/:id`)
- All Supabase queries go through backend with proper auth

### After Image Not Uploading
**Cause**: File size too large or wrong format

**Solution**:
- Max file size: 10MB
- Allowed formats: JPEG, JPG, PNG
- Check browser console for errors

### Feedback Not Showing
**Cause**: Inspection not completed or not own inspection

**Solution**:
- Feedback only available on completed repairs
- Users can only add feedback to their own inspections
- Admin can view all feedback

## Testing Checklist

- [ ] Backend server running on port 5001
- [ ] Supabase storage bucket "inspections" exists and is public
- [ ] Admin can update repair status
- [ ] Admin can set estimated completion date
- [ ] Admin can add admin notes
- [ ] Admin can upload after image
- [ ] Admin cannot complete without after image
- [ ] Inspector can view repair status
- [ ] Inspector can see before/after images
- [ ] Inspector can add feedback on completed repairs
- [ ] Feedback shows star rating
- [ ] Feedback visible to both admin and user

## API Endpoints

### Update Status (Admin Only)
```
PATCH /api/workflow/:id/status
Authorization: Bearer <token>

Body:
{
  "repair_status": "in_progress",
  "estimated_completion_date": "2026-03-15",
  "admin_notes": "Repair scheduled for next week"
}
```

### Complete Inspection (Admin Only)
```
POST /api/workflow/:id/complete
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- after_image: <file>
- completion_date: "2026-03-01"
- admin_notes: "Repair completed successfully"
```

### Add Feedback (Inspector Only)
```
POST /api/workflow/:id/feedback
Authorization: Bearer <token>

Body:
{
  "user_feedback": "Great repair work, road is smooth now!",
  "user_rating": 5
}
```

## Notes

- After image is REQUIRED to mark inspection as completed
- Users can only add feedback once per inspection
- Feedback can only be added to completed inspections
- Admin notes are visible to both admin and users
- All timestamps use ISO 8601 format
- Images are stored in Supabase Storage with public URLs
