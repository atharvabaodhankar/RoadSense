# RoadSense Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
   - Supabase credentials (already set)
   - Roboflow API key (REGENERATE - was exposed)
   - Google Maps API key
   - Redis credentials (optional for now)

3. Start the server:
```bash
npm run dev
```

## API Endpoints

### POST /api/inspect
Upload road image for inspection
- Auth: Required
- Body: multipart/form-data
  - image: file
  - lat: number
  - lng: number
  - timestamp: ISO string (optional)

### GET /api/inspections
Get all inspections (paginated)
- Auth: Required
- Query: page, limit
- Inspectors see only their own
- Admins see all

### GET /api/inspections/:id
Get single inspection
- Auth: Required

### DELETE /api/inspections/:id
Delete inspection
- Auth: Admin only

### GET /api/stats
Dashboard statistics
- Auth: Admin only

### GET /api/heatmap
Heatmap data (lat/lng/score)
- Auth: Required

### GET /api/health
Health check (public)

## Project Structure

```
backend/
├── lib/
│   └── supabase.js          # Supabase client
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── upload.js            # Multer config
├── routes/
│   ├── inspect.js           # Main inspection route
│   ├── inspections.js       # CRUD operations
│   ├── stats.js             # Dashboard stats
│   └── heatmap.js           # Map data
├── services/
│   ├── roboflow.js          # AI detection
│   ├── annotate.js          # Bounding boxes
│   ├── storage.js           # Supabase storage
│   ├── scorer.js            # Quality score
│   └── geocoder.js          # Reverse geocoding
├── .env
├── .gitignore
└── server.js
```

## Testing

Test the API:
```bash
curl http://localhost:5000/api/health
```

## Notes

- Roboflow uses TWO models: pothole detection + road cracks
- Images are stored in TWO buckets: road-originals + road-annotated
- Quality score: 100 - (penalties based on defect type)
- Status: Good (80+), Moderate (50-79), Critical (<50)
