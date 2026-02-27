# 🛣️ RoadSense — System Design Document

> AI-Based Automated Road Inspection System for Smart City Maintenance
> Team: Atharva Baodhankar · Esha Chavan · Jay Suryawanshi
> Event: WITCHAR-26 Hackathon · Problem Statement ID: 05

---

## ✅ SETUP STATUS — What's Already Done

| Component | Status | Details |
|---|---|---|
| Supabase Project | ✅ DONE | Project created, Singapore region |
| `profiles` table | ✅ DONE | With role check (inspector/admin) |
| `inspections` table | ✅ DONE | Full schema with GPS, score, image URLs |
| Trigger — auto profile | ✅ DONE | `handle_new_user()` fires on every signup |
| RLS Policies | ✅ DONE | Inspector sees own, Admin sees all |
| Realtime | ✅ DONE | Enabled on inspections table |
| Bucket — originals | ✅ DONE | `road-originals` (public ON) |
| Bucket — annotated | ✅ DONE | `road-annotated` (public ON) |
| Storage Policies | ✅ DONE | Auth users upload, admin deletes |
| Admin User | ✅ DONE | admin@roadsense.com created + role set |
| AI Detection | ✅ DONE | Roboflow YOLOv8 JS code working |
| Bounding Boxes | ✅ DONE | Jimp + Sharp drawing red boxes on image |

---

## 📌 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [Supabase Setup — COMPLETED](#4-supabase-setup--completed)
5. [Frontend Design](#5-frontend-design)
6. [Backend Design](#6-backend-design)
7. [AI Detection Pipeline — COMPLETED](#7-ai-detection-pipeline--completed)
8. [Database Schema — COMPLETED](#8-database-schema--completed)
9. [Image Storage — COMPLETED](#9-image-storage--completed)
10. [Google Maps Integration](#10-google-maps-integration)
11. [Redis Caching & Queue](#11-redis-caching--queue)
12. [API Endpoints](#12-api-endpoints)
13. [Data Flow — Step by Step](#13-data-flow--step-by-step)
14. [Quality Score Algorithm](#14-quality-score-algorithm)
15. [User Roles — COMPLETED](#15-user-roles--completed)
16. [Folder Structure](#16-folder-structure)
17. [Environment Variables](#17-environment-variables)
18. [Scalability Considerations](#18-scalability-considerations)
19. [Build Order for Hackathon](#19-build-order-for-hackathon)

---

## 1. Project Overview

**RoadSense** is a full-stack web application that:

- Accepts road photos from field inspectors via browser or mobile
- Auto-tags GPS location using the device's geolocation API
- Detects potholes, cracks, and alligator cracking using **YOLOv8 via Roboflow JS**
- Draws red bounding boxes on the annotated image using **Jimp + Sharp**
- Stores both original and annotated images in **Supabase Storage**
- Computes a **Road Quality Score (0–100)** based on defect type and count
- Plots every inspection as a **live heatmap on Google Maps** (red = critical)
- Stores all inspection data in **Supabase PostgreSQL**
- Pushes live heatmap updates via **Supabase Realtime**
- Caches repeated queries using **Redis (Upstash)**
- Sends **auto-alerts** when a zone drops to Critical level
- Exports **PDF reports** per inspection zone

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React.js)                         │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐   │
│  │  Upload Page  │   │   Dashboard   │   │   Map / Heatmap Page  │   │
│  │  + GPS Tag   │   │  Score Cards  │   │  Google Maps API      │   │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘   │
└─────────┼─────────────────┼──────────────────────┼────────────────┘
          │                 │                        │
          │  REST API (axios)                        │ Supabase Realtime
          ▼                 ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  1. Receive image + GPS + timestamp (Multer)                │   │
│  │  2. Check Redis cache                                       │   │
│  │  3. Call Roboflow API (YOLOv8 JS) ✅ WORKING               │   │
│  │  4. Draw bounding boxes (Jimp + Sharp) ✅ WORKING          │   │
│  │  5. Upload original  → road-originals bucket ✅            │   │
│  │  6. Upload annotated → road-annotated bucket ✅            │   │
│  │  7. Calculate quality score                                 │   │
│  │  8. Save inspection  → Supabase PostgreSQL ✅              │   │
│  │  9. Cache result in Redis                                   │   │
│  │  10. Return response to frontend                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────┬──────────────────────┬───────────────────────┬──────────────┘
       │                      │                        │
       ▼                      ▼                        ▼
┌─────────────┐   ┌───────────────────────┐   ┌──────────────────┐
│  Roboflow   │   │       Supabase        │   │  Redis (Upstash) │
│  YOLOv8 API │   │                       │   │                  │
│  ✅ WORKING │   │  PostgreSQL ✅        │   │  API cache       │
│             │   │  road-originals ✅    │   │  Job queue       │
│  Detects:   │   │  road-annotated ✅    │   │  Rate limiting   │
│  - pothole  │   │  Realtime ✅          │   │                  │
│  - crack    │   │  Auth ✅              │   └──────────────────┘
│  - alligator│   │  RLS ✅              │
└─────────────┘   └───────────────────────┘
```

---

## 3. Tech Stack

| Layer | Technology | Status |
|---|---|---|
| Frontend | React.js + Tailwind CSS | 🔲 To Build |
| Maps & GPS | Google Maps JS API + Geocoding + Heatmap | 🔲 To Build |
| AI Detection | YOLOv8 via Roboflow JS API | ✅ Working |
| Image Annotation | Sharp + Jimp | ✅ Working |
| Backend | Node.js + Express.js | 🔲 To Build |
| Database | Supabase PostgreSQL | ✅ Done |
| Image Storage | Supabase Storage (2 buckets) | ✅ Done |
| Realtime | Supabase Realtime | ✅ Done |
| Auth | Supabase Auth (JWT) | ✅ Done |
| Caching & Queue | Redis via Upstash + Bull | 🔲 To Setup |
| PDF Export | jsPDF + html2canvas | 🔲 To Build |
| File Upload | Multer | 🔲 To Install |

> ⚠️ No Python Flask needed — Roboflow has a JS API, entire stack is JavaScript

---

## 4. Supabase Setup — COMPLETED ✅

### Project Details
```
Project Name : roadsense
Region       : Singapore (closest to Pune)
Status       : Active and working
```

### Tables Created ✅
```
public.profiles      → stores user role (inspector / admin)
public.inspections   → stores all road inspection records
```

### Trigger Created ✅
```
Function : handle_new_user()
Trigger  : on_auth_user_created
Fires    : AFTER INSERT on auth.users
Does     : Auto-creates profile row with role = 'inspector'
Fix      : ON CONFLICT DO NOTHING (prevents crash)
```

### RLS Status ✅
```
profiles    → RLS ON
inspections → RLS ON
```

### Realtime ✅
```
inspections table → added to supabase_realtime publication
```

### Storage Buckets ✅

| Bucket Name | Public | Stores |
|---|---|---|
| `road-originals` | ✅ ON | Raw photo from inspector's device |
| `road-annotated` | ✅ ON | Same photo with red bounding boxes drawn |

### Users ✅
```
admin@roadsense.com → role: admin    (manually set via SQL UPDATE)
New signups         → role: inspector (auto via trigger, no manual work)
```

---

## 5. Frontend Design

### Pages

```
/               → Landing page
/login          → Supabase Auth login
/signup         → Inspector self-signup (free, open)
/upload         → Inspector upload page (core feature)
/dashboard      → Admin only — all inspections + stats
/map            → Full-screen Google Maps heatmap
/inspection/:id → Single inspection detail
```

### Role-Based Routing

```javascript
// Inspector sees: /upload, /inspection/:id (own only)
// Admin sees:     /dashboard, /map, all inspections, delete, export
```

### GPS Tagging Code (Frontend)

```javascript
useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    (pos) => setLocation({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    }),
    () => setShowManualPicker(true)  // fallback: click on map to pin
  )
}, [])
```

### Realtime Heatmap Listener

```javascript
const channel = supabase
  .channel("inspections")
  .on("postgres_changes",
    { event: "INSERT", schema: "public", table: "inspections" },
    (payload) => addHeatmapPoint(payload.new)
  )
  .subscribe()
```

---

## 6. Backend Design

### Install Packages

```bash
cd server
npm install express dotenv @supabase/supabase-js axios multer jimp sharp ioredis bull
```

### Full Inspect Route Logic

```javascript
// POST /api/inspect
router.post("/", upload.single("image"), async (req, res) => {
  const { lat, lng, timestamp } = req.body
  const imageBuffer = req.file.buffer

  // 1. Check Redis cache
  const cacheKey = `inspect:${lat}:${lng}`
  const cached = await redis.get(cacheKey)
  if (cached) return res.json(JSON.parse(cached))

  // 2. Call Roboflow (YOLOv8)
  const base64Image = imageBuffer.toString("base64")
  const roboflowRes = await axios.post(process.env.ROBOFLOW_MODEL_URL, base64Image, {
    params: {
      api_key: process.env.ROBOFLOW_API_KEY,
      confidence: 30,
      overlap: 25
    },
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  })
  const predictions = roboflowRes.data.predictions

  // 3. Draw bounding boxes
  const annotatedBuffer = await drawBoundingBoxes(imageBuffer, predictions)

  // 4. Upload BOTH to Supabase Storage
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`
  const originalUrl  = await uploadToStorage("road-originals", fileName, imageBuffer)
  const annotatedUrl = await uploadToStorage("road-annotated", fileName, annotatedBuffer)

  // 5. Calculate score
  const { score, status } = calculateScore(predictions)

  // 6. Reverse geocode
  const address = await reverseGeocode(lat, lng)

  // 7. Save to Supabase
  const { data } = await supabase.from("inspections").insert({
    lat, lng, address,
    timestamp: timestamp || new Date().toISOString(),
    score, status,
    defect_count: predictions.length,
    defects: predictions,
    original_image_url: originalUrl,
    annotated_image_url: annotatedUrl,
    inspector_id: req.user.id
  }).select().single()

  // 8. Cache result
  await redis.set(cacheKey, JSON.stringify(data), "EX", 3600)

  res.json(data)
})
```

### Storage Upload Function

```javascript
async function uploadToStorage(bucket, fileName, buffer) {
  const { error } = await supabase.storage
    .from(bucket)              // "road-originals" or "road-annotated"
    .upload(fileName, buffer, {
      contentType: "image/png",
      upsert: false
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return publicUrl
}
```

---

## 7. AI Detection Pipeline — COMPLETED ✅

### What's Working

```javascript
// ✅ THIS CODE IS ALREADY TESTED AND WORKING
const axios = require("axios")
const fs    = require("fs")
const Jimp  = require("jimp")
const sharp = require("sharp")

const image = fs.readFileSync("wow.png", { encoding: "base64" })

axios({
  method: "POST",
  url: process.env.ROBOFLOW_MODEL_URL,
  params: {
    api_key:    process.env.ROBOFLOW_API_KEY,  // store in .env ONLY
    confidence: 30,
    overlap:    25
  },
  data: image,
  headers: { "Content-Type": "application/x-www-form-urlencoded" }
})
```

### Detects 3 Classes ✅

```
pothole            → penalty: 15 pts (most severe)
alligator cracking → penalty: 10 pts (medium)
crack              → penalty:  5 pts (minor)
```

### Bounding Box Colors

```javascript
const color = cls === "pothole"            ? 0xFF0000FF   // 🔴 Red
            : cls === "alligator cracking" ? 0xFF8800FF   // 🟠 Orange
            : 0xFFFF00FF                                  // 🟡 Yellow
```

### ⚠️ Important — Regenerate Roboflow Key

```
The Roboflow API key was accidentally exposed in chat.
Go to roboflow.com → Settings → API Keys → Regenerate
Then put new key in .env ONLY — never hardcode in code
```

---

## 8. Database Schema — COMPLETED ✅

```sql
-- profiles (CREATED ✅)
CREATE TABLE profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT,
  name       TEXT,
  role       TEXT DEFAULT 'inspector' CHECK (role IN ('inspector', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- inspections (CREATED ✅)
CREATE TABLE inspections (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          TIMESTAMPTZ DEFAULT now(),
  lat                 DECIMAL(10, 7) NOT NULL,
  lng                 DECIMAL(10, 7) NOT NULL,
  address             TEXT,
  timestamp           TIMESTAMPTZ NOT NULL,
  score               INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  status              TEXT NOT NULL CHECK (status IN ('Good','Moderate','Critical')),
  defect_count        INTEGER DEFAULT 0,
  defects             JSONB,
  original_image_url  TEXT,        -- points to road-originals bucket
  annotated_image_url TEXT,        -- points to road-annotated bucket
  inspector_id        UUID REFERENCES auth.users(id),
  zone                TEXT
);
```

---

## 9. Image Storage — COMPLETED ✅

### 2 Buckets in Supabase Storage

```
road-originals/          ← Bucket 1 ✅ Public ON
└── 1234567_abc.png      raw photo from inspector

road-annotated/          ← Bucket 2 ✅ Public ON
└── 1234567_abc.png      same photo + red bounding boxes drawn by Jimp
```

### Same filename used in both buckets — easy to match

```javascript
const fileName = `${Date.now()}_${uuid}.png`
uploadToStorage("road-originals", fileName, originalBuffer)
uploadToStorage("road-annotated", fileName, annotatedBuffer)
```

### Both URLs saved in inspections table

```
inspections.original_image_url  → road-originals/file.png
inspections.annotated_image_url → road-annotated/file.png
```

Dashboard shows both side-by-side: before detection and after detection.

---

## 10. Google Maps Integration

### APIs Needed

| API | Purpose |
|---|---|
| Maps JavaScript API | Base map rendering |
| Visualization Library | Heatmap layer |
| Geocoding API | lat/lng → readable address |

### Heatmap Setup

```javascript
const heatmap = new google.maps.visualization.HeatmapLayer({
  data: inspections.map(i => ({
    location: new google.maps.LatLng(i.lat, i.lng),
    weight: 100 - i.score   // low score = high weight = more red
  })),
  map: map,
  radius: 30,
  gradient: [
    "rgba(0, 255, 0, 0)",
    "rgba(0, 255, 0, 1)",    // green  = good roads
    "rgba(255, 255, 0, 1)",  // yellow = moderate
    "rgba(255, 165, 0, 1)",  // orange
    "rgba(255, 0, 0, 1)"     // red    = critical
  ]
})
```

### Reverse Geocoding

```javascript
async function reverseGeocode(lat, lng) {
  const res = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    { params: { latlng: `${lat},${lng}`, key: process.env.GOOGLE_MAPS_API_KEY } }
  )
  return res.data.results[0]?.formatted_address || "Unknown location"
}
```

---

## 11. Redis Caching & Queue

### Cache Keys & TTL

```
Key                     Value                  TTL
──────────────────────  ─────────────────────  ───────
inspect:{lat}:{lng}     Full inspection result  1 hour
stats:dashboard         Aggregated stats        5 mins
inspections:list        Recent 50 records       2 mins
zone:{name}:score       Avg score for zone      10 mins
```

### Bull Queue for Concurrent Uploads

```javascript
const Queue = require("bull")
const inspectionQueue = new Queue("inspections", process.env.UPSTASH_REDIS_URL)

app.post("/api/inspect", async (req, res) => {
  const job = await inspectionQueue.add({
    image: req.file.buffer.toString("base64"),
    lat: req.body.lat,
    lng: req.body.lng
  })
  res.json({ jobId: job.id, status: "queued" })
})

inspectionQueue.process(async (job) => {
  // full detection + save logic here
})
```

---

## 12. API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/inspect` | Submit photo + GPS | ✅ |
| GET | `/api/inspections` | All inspections paginated | ✅ |
| GET | `/api/inspections/:id` | Single inspection | ✅ |
| GET | `/api/stats` | Dashboard numbers | ✅ |
| GET | `/api/heatmap` | All lat/lng/score for map | ✅ |
| GET | `/api/export/:zone` | PDF report data | ✅ Admin only |
| GET | `/api/health` | Server alive check | ❌ Public |

---

## 13. Data Flow — Step by Step

```
INSPECTOR       FRONTEND           BACKEND              EXTERNAL
─────────       ────────           ───────              ────────

Opens app  →  GPS auto-tag
              navigator.geolocation
           ←  lat/lng returned

Picks photo →  Preview shown

Submits    →  POST /api/inspect
              { image, lat, lng }
                              →  Redis check
                                 Cache miss
                              →  Roboflow ─────────→  YOLOv8 model
                              ←  predictions ←────────

                              →  Draw boxes (Jimp)
                              →  Calculate score
                              →  Geocode ──────────→  Google Maps API
                              ←  address ←────────────

                              →  Upload ───────────→  road-originals ✅
                              →  Upload ───────────→  road-annotated ✅
                              ←  both URLs ←──────────

                              →  INSERT ───────────→  Supabase DB ✅
                              →  Redis cache set

           ←  JSON response
           →  Show annotated image
           →  Show score badge

Dashboard  ←──────────────────────────────────────  Supabase Realtime
auto-update   New INSERT fires                       instantly
           →  New heatmap point added
           →  Map turns redder live
```

---

## 14. Quality Score Algorithm

```javascript
function calculateScore(predictions) {
  const PENALTIES = {
    "pothole":            15,
    "alligator cracking": 10,
    "crack":               5
  }

  let totalPenalty = 0
  predictions.forEach(defect => {
    totalPenalty += PENALTIES[defect.class] || 5
  })

  const score  = Math.max(0, 100 - totalPenalty)
  const status = score >= 80 ? "Good"
               : score >= 50 ? "Moderate"
               :               "Critical"

  return { score, status }
}
```

### Examples

| Defects Found | Penalty | Score | Status |
|---|---|---|---|
| None | 0 | 100 | 🟢 Good |
| 2 cracks | 10 | 90 | 🟢 Good |
| 1 pothole + 1 crack | 20 | 80 | 🟢 Good |
| 2 potholes + 1 crack | 35 | 65 | 🟡 Moderate |
| 4 potholes | 60 | 40 | 🔴 Critical |
| 7+ defects | 100+ | 0 | 🔴 Critical |

---

## 15. User Roles — COMPLETED ✅

| Role | Who | Can Do |
|---|---|---|
| `inspector` | Field worker | Upload photos · See own inspections only |
| `admin` | Municipal officer | See ALL · Delete · Export PDF · Full dashboard |

### How It Works

```
Anyone visits /signup
      ↓
Enters email + password
      ↓
Supabase creates auth.users row
      ↓
Trigger handle_new_user() fires automatically
      ↓
profiles row created → role = 'inspector' ✅

Admin logs in with admin@roadsense.com
      ↓
profiles.role = 'admin'
      ↓
Full dashboard access ✅
```

### Admin Credentials

```
Email    : admin@roadsense.com
Password : Admin@1234   ← change before demo!
Role     : admin (set via SQL UPDATE profiles)
```

---

## 16. Folder Structure

```
roadsense/
│
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadForm.jsx       # image upload + GPS
│   │   │   ├── ScoreBadge.jsx       # 🔴🟡🟢 score display
│   │   │   ├── HeatMap.jsx          # Google Maps heatmap
│   │   │   ├── InspectionCard.jsx   # single result card
│   │   │   ├── Dashboard.jsx        # admin stats
│   │   │   └── PDFExport.jsx        # export button
│   │   ├── pages/
│   │   │   ├── Upload.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Map.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   └── maps.js
│   │   └── App.jsx
│   ├── .env                         # VITE_ keys only
│   └── package.json
│
├── server/                          # Node.js Backend
│   ├── routes/
│   │   ├── inspect.js               # POST /api/inspect
│   │   ├── inspections.js           # GET list + single
│   │   ├── stats.js                 # GET dashboard stats
│   │   └── export.js                # GET PDF data
│   ├── services/
│   │   ├── roboflow.js              # ✅ working YOLOv8 detection
│   │   ├── annotate.js              # ✅ Jimp + Sharp boxes
│   │   ├── storage.js               # upload to both buckets
│   │   ├── scorer.js                # quality score logic
│   │   ├── geocoder.js              # reverse geocoding
│   │   └── cache.js                 # Redis helpers
│   ├── middleware/
│   │   ├── auth.js                  # JWT verify
│   │   └── upload.js                # Multer config
│   ├── lib/
│   │   ├── supabase.js              # Supabase admin client
│   │   └── redis.js                 # Redis connection
│   ├── server.js
│   ├── .env                         # ALL secrets live here only
│   └── package.json
│
├── .gitignore                       # must include .env !
└── SYSTEM_DESIGN.md
```

---

## 17. Environment Variables

```bash
# server/.env — ALL secrets here, never in frontend, never in git

# Supabase ✅ (project already created)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...       # backend only — NEVER in frontend

# Roboflow ⚠️ REGENERATE KEY — was exposed in chat
ROBOFLOW_API_KEY=new_regenerated_key_here
ROBOFLOW_MODEL_URL=https://serverless.roboflow.com/road-damage-detection-lfxky/1

# Google Maps
GOOGLE_MAPS_API_KEY=your_key_here

# Redis Upstash
UPSTASH_REDIS_URL=rediss://your_url
UPSTASH_REDIS_TOKEN=your_token

PORT=5000
NODE_ENV=development
```

```bash
# client/.env — only these, nothing secret

VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GOOGLE_MAPS_KEY=your_key_here
```

---

## 18. Scalability Considerations

| Concern | Solution |
|---|---|
| Concurrent uploads | Redis Bull queue — no blocking |
| Same road inspected twice | Redis 1hr cache — no repeat API calls |
| Slow dashboard | Cached aggregated stats + paginated queries |
| Roboflow rate limits | Redis cache prevents redundant calls |
| Heavy heatmap | Cluster markers at low zoom level |
| Image storage | Supabase free tier 1GB — enough for hackathon |
| Many realtime users | Supabase Realtime handles WebSocket connections |
| Large images | Sharp resizes to 1024px max before Roboflow call |

---

## 19. Build Order for Hackathon

```
✅ Hour 1-2  — AI Detection + Bounding Boxes         DONE ✅
✅            — Supabase DB + Buckets + Auth + RLS    DONE ✅
✅            — Admin user created                    DONE ✅
✅            — Inspector self-signup working         DONE ✅

🔲 Hour 2-3  — Express server
               Multer file upload
               POST /api/inspect route
               Quality score function
               Reverse geocode

🔲 Hour 3-4  — Upload images to both buckets
               Save inspection to Supabase
               Redis cache setup
               Test full backend flow

🔲 Hour 4-5  — React frontend
               Login + Signup pages
               Upload form with GPS auto-tag
               Show annotated image + score badge

🔲 Hour 5-6  — Google Maps heatmap
               Supabase Realtime listener
               Admin dashboard with stats

🔲 Hour 6-7  — Connect frontend + backend end-to-end
               Role-based page routing
               Full flow test

🔲 Hour 7-8  — PDF export
               Polish UI
               Pre-seed 20 Pune road records for demo
               Rehearse presentation
```

---
## 20. Frontend UI Standards & Agentic IDE Instructions

> Paste this section as the system prompt or first instruction to any agentic IDE
> (Cursor, Windsurf, Lovable, Bolt, v0, Replit Agent, etc.) before generating any UI.

---

### Design System — Non-Negotiable Rules

Every single UI file generated for this project MUST follow these rules exactly.
Do not deviate. Do not use defaults. Do not use component library defaults unstyled.

#### Colors (use as CSS variables or Tailwind config — never hardcode elsewhere)
```
--color-bg:           #F9F9F8   /* warm off-white — page background */
--color-surface:      #FFFFFF   /* card / panel background */
--color-border:       #E8E8E5   /* all borders — 1px solid only */
--color-text-primary: #1A1A18   /* headings, labels, strong text */
--color-text-body:    #3E3E3B   /* body copy */
--color-text-muted:   #8F8F8B   /* secondary labels, placeholders */
--color-primary:      #15803d   /* green — CTAs, active states, live dots */
--color-primary-dark: #166534   /* green hover state */
--color-status-good:      #16a34a  /* score Good */
--color-status-moderate:  #d97706  /* score Moderate */
--color-status-critical:  #dc2626  /* score Critical */
```

#### Typography
- Font: **Inter** (Google Fonts) — import weights 300, 400, 500, 600, 700
- Monospace font: `ui-monospace, SFMono-Regular, Menlo, monospace` — use for ALL scores,
  GPS coordinates, timestamps, IDs, stat numbers, code-like labels
- Body smoothing: always set `-webkit-font-smoothing: antialiased`
- Heading tracking: `letter-spacing: -0.03em` on all h1/h2
- Never use: Arial, Roboto, system-ui as the primary font

#### Spacing & Shape
- Border radius: 10px for cards, 6px for buttons/chips/inputs, 20px for status pills
- Shadows: extremely subtle only — `0 1px 3px rgba(0,0,0,0.06)` — never heavy drop shadows
- Card borders: always `1px solid #E8E8E5` — on hover transition to `1px solid #1A1A18`
- Max content width: 1000px centered
- Sidebar width: 240px fixed

---

### Component Patterns — Build Exactly Like This

#### Status Pills
```html
<!-- Good -->
<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;
border-radius:20px;font-size:11.5px;font-weight:500;
background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;">
  <span style="width:5px;height:5px;border-radius:50%;background:#16a34a;"></span>
  Good
</span>

<!-- Moderate -->
<span style="...background:#fefce8;color:#ca8a04;border:1px solid #fde68a;">
  <span style="...background:#ca8a04;"></span>Moderate
</span>

<!-- Critical — add pulsing glow animation -->
<span style="...background:#fef2f2;color:#dc2626;border:1px solid #fecaca;
animation: pulse-red 2s infinite;">
  <span style="...background:#dc2626;"></span>Critical
</span>
```

#### Score Display
- Score number: font-size 48–56px, font-weight 700, letter-spacing -3px, color matches status
- Always pair with: status pill + thin progress bar (5px height, color matches status) + `/100` in muted monospace
- Progress bar: `height:5px; border-radius:3px; background:#E8E8E5` with colored fill div inside

#### Defect Chips
```html
<span style="display:inline-flex;align-items:center;gap:5px;padding:2px 8px;
border-radius:20px;font-size:11px;font-weight:500;font-family:monospace;
background:#fef2f2;color:#dc2626;border:1px solid #fecaca;">
  <span style="width:5px;height:5px;border-radius:50%;background:#dc2626;"></span>
  Pothole ×2
</span>
```
Colors: Pothole → red `#dc2626` / Alligator Crack → amber `#d97706` / Crack → grey `#9ca3af`

#### Inspector Avatar
```html
<div style="width:28px;height:28px;border-radius:50%;background:#F4F4F2;
border:1px solid #E8E8E5;display:flex;align-items:center;justify-content:center;
font-size:10px;font-weight:600;color:#3E3E3B;">RK</div>
```

#### Score Bar in Table
```html
<div style="display:flex;align-items:center;gap:8px;">
  <div style="width:52px;height:4px;border-radius:2px;background:#E8E8E5;overflow:hidden;">
    <div style="width:38%;height:100%;background:#dc2626;border-radius:2px;"></div>
  </div>
  <span style="font-size:12.5px;font-weight:600;font-family:monospace;color:#dc2626;">38</span>
</div>
```

#### Live Indicator
```html
<div style="display:flex;align-items:center;gap:6px;">
  <span style="width:7px;height:7px;border-radius:50%;background:#16a34a;
  animation:pulse-dot 2s infinite;"></span>
  <span style="font-size:11.5px;color:#16a34a;font-weight:500;font-family:monospace;">Live</span>
</div>

<style>
@keyframes pulse-dot {
  0%,100% { opacity:1; }
  50% { opacity:0.5; }
}
</style>
```

---

### Page-by-Page Generation Instructions

When generating any page, tell the agent:

**For ALL pages:**
> "Use the RoadSense design system defined above. Inter font, #F9F9F8 background,
> white cards with 1px #E8E8E5 borders, #15803d primary green, #1A1A18 civic black.
> No shadows heavier than 0 1px 3px rgba(0,0,0,0.06). No purple. No gradients on backgrounds.
> Monospace font for all numbers, scores, GPS, timestamps, and IDs."

**For the Upload Page (`/upload`):**
> "Two-column layout. Left: dashed-border drag-drop zone with upload icon, GPS coordinates
> auto-detected shown as monospace text with a map-pin icon, a Re-detect button.
> Right: image preview area that shows the annotated image after analysis, with the
> Road Quality Score (large number + status pill + progress bar) and defect chips below it.
> Full-width black submit button at the bottom."

**For the Admin Dashboard (`/dashboard`):**
> "Fixed 240px left sidebar with logo, nav links, active state shown as a 3px left black border strip,
> and user profile card at bottom. Top bar with page title, pulsing green live dot, Export and Refresh buttons.
> Red alert banner if critical zones exist. 4 stat cards in a row with trend delta badges.
> Zone cards with large score number and progress bar. Inspections table with score bars,
> inspector avatars, status pills, defect count, timestamp. Right panel with defect breakdown bars
> and mini heatmap preview."

**For the Map Page (`/map`):**
> "Full-screen map area with Google Maps heatmap. Floating search + filter bar at top.
> Side drawer that slides in on marker click showing: address, score badge, defect list,
> annotated image thumbnail, inspector name, timestamp, Export PDF button.
> Legend card bottom-right with colored dots for Good/Moderate/Critical."

**For the Inspector Upload Page (mobile-first):**
> "Single column layout optimized for mobile. Large tap targets (minimum 44px).
> GPS status shown prominently. Upload zone takes 60% of viewport height on mobile.
> Score result shown as a full-width card after submission."

---

### What to NEVER Do

Tell the agent explicitly:
```
DO NOT:
- Use purple, blue gradients, or glassmorphism anywhere
- Use heavy box shadows or card elevation effects
- Use any font other than Inter for UI text
- Use emoji as primary icons — use Material Symbols Outlined instead
- Generate placeholder grey boxes instead of actual UI components
- Use Tailwind's default border-radius (rounded-full on cards looks wrong)
- Put secrets or API keys in frontend files
- Use localStorage or sessionStorage
- Generate lorem ipsum text — use real RoadSense content
- Make the sidebar wider than 240px or narrower than 200px
- Use status colors for decorative purposes — only use red/amber/green for actual status
```

---

### Animations Allowed

Only these — no others unless explicitly requested:
```css
/* Live pulse — for green dots only */
@keyframes pulse-dot { 0%,100%{opacity:1;} 50%{opacity:0.5;} }

/* Critical alert pulse — for red status pills only */
@keyframes pulse-red { 0%,100%{box-shadow:none;} 50%{box-shadow:0 0 0 3px rgba(220,38,38,0.12);} }

/* Page load reveal — stagger with animation-delay on cards */
@keyframes fadeUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }

/* New row flash — for Realtime updates in tables */
/* Apply background:#eff6ff then transition to transparent after 2s */
```

---

### Realtime UI Behavior

When a new inspection arrives via Supabase Realtime:
1. Prepend new row to the top of the inspections table
2. Flash the row background `#eff6ff` (light blue) for 2 seconds then fade to transparent
3. Increment the "Total Inspections" stat card counter with a brief scale animation
4. If the new inspection is Critical, update the alert banner count
5. Add the new lat/lng point to the heatmap layer

---

### File Generation Checklist

Before considering any UI file complete, verify:

- [ ] Font is Inter loaded from Google Fonts
- [ ] Background is #F9F9F8, cards are #FFFFFF
- [ ] All borders are 1px solid #E8E8E5
- [ ] All scores and GPS values use monospace font
- [ ] Status colors are ONLY used for Good/Moderate/Critical states
- [ ] Primary green is #15803d (not #17a155 or any other shade)
- [ ] Sidebar has active state left border indicator
- [ ] Mobile breakpoints tested at 480px, 768px, 1024px
- [ ] No hardcoded secrets or API keys
- [ ] Live dot has pulse animation
- [ ] Critical status pill has pulse-red animation
- [ ] Page load has staggered fadeUp on cards

*Built for WITCHAR-26 Hackathon · RoadSense Team · February 2026*
*Last updated: Supabase fully configured · AI detection working · Ready to build backend*
