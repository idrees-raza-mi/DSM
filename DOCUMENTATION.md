# FleetFlow DSM — Full Project Documentation

> Driver Scheduling & Management System — A full-stack platform for automated driver deployment scheduling, scoring, billing, and multi-city control.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Getting Started](#4-getting-started)
5. [Backend](#5-backend)
6. [Admin Web Dashboard](#6-admin-web-dashboard)
7. [Driver Mobile App](#7-driver-mobile-app)
8. [Business Rules Implementation](#8-business-rules-implementation)
9. [API Reference](#9-api-reference)
10. [Database Schema](#10-database-schema)
11. [Cron Jobs & Automation](#11-cron-jobs--automation)
12. [File Inventory](#12-file-inventory)

---

## 1. Project Overview

FleetFlow DSM replaces manual driver deployment planning with an automated system. It covers:

- **Driver onboarding** — registration, profile setup, document upload, admin approval
- **Assignment scheduling** — time-slot-based deployment across multiple cities
- **Scoring system** — automated reputation tracking (no-shows, cancellations, completions)
- **Booking lifecycle** — reserve → confirm → check-in → complete (or cancel/no-show)
- **Billing** — monthly mission summaries, invoice submission, admin approval
- **Analytics** — KPIs, no-show rates, fill rates, location performance

### What Was Built

| Component | Status | Files | Lines of Code |
|-----------|--------|-------|---------------|
| Backend (Node.js + Express + MongoDB) | Fully built from scratch | 43 | 2,381 |
| Admin Web Dashboard (React + Vite) | Enhanced from 3 pages to 6 | 23 | 1,781 |
| Driver Mobile App (React Native + Expo) | Implemented from placeholders | 21 | 1,932 |
| **Total** | | **87** | **6,094** |

---

## 2. Architecture

```
FleetFlow/
├── backend/                    ← Node.js + Express + MongoDB + JWT
│   └── src/
│       ├── config/             ← Environment, DB connection, logger
│       ├── models/             ← 8 Mongoose schemas
│       ├── controllers/        ← 7 HTTP request handlers
│       ├── routes/             ← 5 route modules
│       ├── services/           ← 8 business logic modules
│       ├── middleware/         ← Auth, roles, validation, error handling
│       ├── utils/              ← JWT, geo, response helpers, constants
│       ├── cron.ts             ← Scheduled background jobs
│       ├── seed.ts             ← Database seeder
│       ├── app.ts              ← Express app configuration
│       └── server.ts           ← Server startup
│
├── admin-web-dashboard/        ← React + Vite + TypeScript
│   └── src/
│       ├── context/            ← Auth state management
│       ├── services/           ← 5 API service modules
│       ├── components/layout/  ← Sidebar layout
│       └── pages/              ← 6 full pages
│
├── driver-mobile-app/          ← React Native + Expo
│   └── src/
│       ├── context/            ← Auth state management
│       ├── services/           ← 3 API service modules
│       ├── navigation/         ← 4 navigation modules (Auth, Onboarding, Main)
│       ├── components/         ← Reusable UI components
│       └── screens/            ← 11 screens
│
├── package.json                ← Monorepo workspace config
└── CLAUDE.md                   ← Project rules & specifications
```

### Data Flow

```
Driver Mobile App ──→ REST API (Express) ──→ MongoDB
Admin Dashboard   ──→ REST API (Express) ──→ MongoDB
                      ↑
                  JWT Auth + Role Middleware
```

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Runtime | Node.js |
| Backend Framework | Express.js 4.21 |
| Database | MongoDB via Mongoose 8.7 |
| Authentication | JWT (jsonwebtoken 9.0) |
| Password Hashing | bcryptjs 2.4 (salt rounds: 12) |
| Validation | express-validator 7.2 |
| Scheduling | node-cron 3.0 |
| Logging | Winston 3.14 |
| File Uploads | Multer 1.4 |
| Admin Frontend | React + Vite + TypeScript |
| Mobile App | React Native 0.83 + Expo 55 |
| Navigation | React Navigation 7 (native-stack + bottom-tabs) |
| HTTP Client | Axios |
| Language | TypeScript (strict mode) throughout |

---

## 4. Getting Started

### Prerequisites

- **Node.js** 18+
- **MongoDB** running on `localhost:27017` (local install or Docker)
- **Expo Go** app on your phone (for mobile testing)

### Installation

```bash
# Clone and install all workspaces
npm install
```

### Environment Setup

Create `backend/.env`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/fleetflow
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

### Running

Open 3 terminals:

| Terminal | Command | URL |
|----------|---------|-----|
| 1 | `npm run dev:backend` | http://localhost:4000 |
| 2 | `npm run dev:admin` | http://localhost:5173 |
| 3 | `npm run dev:app` | Expo QR / press `w` for web |

### Seed the Database

```bash
npm run seed
```

Creates:
- **Admin account**: `admin@fleetflow.com` / `admin123`
- **5 sample locations**: Berlin, Munich, Hamburg, Frankfurt, Cologne

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:backend` | Start backend with hot-reload |
| `npm run dev:admin` | Start admin dashboard (Vite) |
| `npm run dev:app` | Start mobile app (Expo) |
| `npm run seed` | Seed database with admin + locations |
| `npm run build:backend` | Compile backend TypeScript |
| `npm run build:client` | Build admin dashboard for production |
| `npm run install:all` | Install all workspace dependencies |

---

## 5. Backend

### 5.1 Configuration

#### `backend/src/config/env.ts`
Loads environment variables via dotenv with defaults:
- PORT: 4000
- MONGO_URI: mongodb://localhost:27017/fleetflow
- JWT_EXPIRES_IN: 7d
- NODE_ENV: development

#### `backend/src/config/db.ts`
MongoDB connection via Mongoose. Exits process on connection failure.

#### `backend/src/config/logger.ts`
Winston logger — debug level in development, info in production. Colorized console output with timestamps.

### 5.2 Middleware

| File | Purpose |
|------|---------|
| `auth.middleware.ts` | Extracts JWT from `Authorization: Bearer` header, verifies token, checks user exists and is not blocked, attaches `{userId, role}` to request |
| `roles.middleware.ts` | Role-based access control. Exports `requireAdmin` and `requireDriver` convenience guards |
| `validate.middleware.ts` | Integrates express-validator. Returns 422 with error messages if validation fails |
| `error.middleware.ts` | Centralized error handler — catches ValidationError (400), CastError (400), duplicate key (409), and generic errors (500) |

### 5.3 Utilities

| File | Purpose |
|------|---------|
| `jwt.ts` | `generateToken({userId, role})` and `verifyToken(token)` using env.JWT_SECRET |
| `response.ts` | Standardized response helpers: `sendSuccess`, `sendError`, `sendCreated`, `sendNotFound`, `sendUnauthorized`, `sendForbidden`. All responses follow `{success, data?, message?}` format |
| `geo.ts` | `getDistanceMeters(lat1, lon1, lat2, lon2)` using Haversine formula. `isWithinRadius()` for check-in GPS validation |
| `constants.ts` | All business rule constants — time slots, statuses, scoring values, tier thresholds, overbooking defaults |

### 5.4 Models (8 Mongoose Schemas)

#### User (`User.model.ts`)
| Field | Type | Details |
|-------|------|---------|
| name | String | Required, trimmed |
| email | String | Required, unique, lowercase |
| phone | String | Required |
| password | String | Hashed (bcrypt, salt 12), not selected by default |
| role | Enum | `driver` \| `admin` (default: driver) |
| status | Enum | `under_review` \| `active` \| `restricted` \| `blocked` |
| currentScore | Number | 0–100 (default: 100) |
| onboardingStep | Number | 0=registered, 1=profile, 2=docs, 3=submitted, 4=approved |
| address | String | Optional |
| bankDetails | Object | { bankName, accountName, iban } |
| city | String | Optional |
| applicationNote | String | Rejection/request reason |

Pre-save hook auto-hashes password. Instance method `comparePassword()` for login.

#### Document (`Document.model.ts`)
| Field | Type | Details |
|-------|------|---------|
| driver | ObjectId → User | Required |
| type | Enum | driver_license, id_document, profile_photo, bank_details, business_registration |
| fileUrl | String | Cloud storage URL |
| status | Enum | pending \| approved \| rejected |
| reviewNote | String | Admin feedback |

#### Location (`Location.model.ts`)
| Field | Type | Details |
|-------|------|---------|
| name | String | Location/hub name |
| city | String | City name |
| address | String | Full address |
| coordinates | Object | { lat, lng } for GPS |
| checkinRadiusMeters | Number | Default: 500m |
| overbookingPercent | Number | Default: 5% |
| isActive | Boolean | Soft delete flag |

#### Assignment (`Assignment.model.ts`)
| Field | Type | Details |
|-------|------|---------|
| location | ObjectId → Location | Required |
| date | Date | Day of assignment |
| timeSlot | Enum | morning \| midday \| evening |
| requiredDrivers | Number | Base requirement |
| maxDrivers | Number | Required + overbooking buffer |
| compensation | Number | Pay per driver |
| checkinCode | String | Random 6-digit code |
| startTime | Date | Calculated from date+timeSlot (morning=8am, midday=1pm, evening=6pm) |
| createdBy | ObjectId → User | Admin who created |

Unique index on `location + date + timeSlot`.

#### Booking (`Booking.model.ts`)
| Field | Type | Details |
|-------|------|---------|
| driver | ObjectId → User | Required |
| assignment | ObjectId → Assignment | Required |
| status | Enum | reserved → confirmed → checked_in → completed, or cancelled/no_show/withdrawn |
| reservedAt | Date | When booked |
| confirmedAt | Date | When confirmed |
| checkedInAt | Date | When checked in |
| completedAt | Date | When completed |
| cancelledAt | Date | When cancelled |
| cancellationType | Enum | on_time (>24h) \| late (<24h) |
| isSubstitute | Boolean | True if overbooking surplus |
| confirmations | Object | { t24?, t12?, t6? } — confirmation timestamps per window |

Unique index on `driver + assignment`.

#### Score (`Score.model.ts`)
| Field | Type | Details |
|-------|------|---------|
| driver | ObjectId → User | Required |
| booking | ObjectId → Booking | Optional |
| reason | Enum | no_show \| late_cancel \| completed \| admin_adjustment |
| delta | Number | Points change (+2, -10, -20) |
| scoreBefore | Number | Score before change |
| scoreAfter | Number | Score after change |
| note | String | Optional explanation |

#### BillingPeriod (`BillingPeriod.model.ts`)
| Field | Type | Details |
|-------|------|---------|
| driver | ObjectId → User | Required |
| month | Number | 1–12 |
| year | Number | Year |
| totalMissions | Number | Count of completed missions |
| totalAmount | Number | Sum of compensation |
| missions | Array | [{ booking, date, location, timeSlot, compensation }] |

Unique index on `driver + year + month`.

#### Invoice (`Invoice.model.ts`)
| Field | Type | Details |
|-------|------|---------|
| driver | ObjectId → User | Required |
| billingPeriod | ObjectId → BillingPeriod | Required |
| fileUrl | String | Uploaded invoice document |
| amount | Number | Claimed amount |
| status | Enum | pending → submitted → approved/rejected → paid |
| reviewedBy | ObjectId → User | Admin who reviewed |
| rejectionReason | String | If rejected |

### 5.5 Services (Business Logic)

#### Auth Service (`auth.service.ts`)
- **`registerDriver(name, email, phone, password)`** — Creates driver with `under_review` status, returns JWT token
- **`loginUser(emailOrPhone, password)`** — Finds by email OR phone, verifies password, returns JWT

#### Driver Service (`driver.service.ts`)
- **`getDriverProfile(driverId)`** — Returns full driver profile
- **`updateDriverProfile(driverId, data)`** — Updates profile, advances onboardingStep 0→1
- **`uploadDocument(driverId, type, fileUrl)`** — Upserts document (replaces existing of same type)
- **`listDocuments(driverId)`** — Returns all driver documents
- **`submitApplication(driverId)`** — Validates 4 required docs exist, sets onboardingStep=3
- **`getApplicationStatus(driverId)`** — Returns status and onboarding step

#### Admin Service (`admin.service.ts`)
- **`listPendingDrivers()`** — Drivers with status=under_review AND onboardingStep=3
- **`getDriverById(driverId)`** — Driver with populated documents
- **`approveDriver(driverId)`** — Sets active + onboardingStep=4, approves all docs
- **`rejectDriver(driverId, reason)`** — Sets blocked + stores reason
- **`requestMoreDocuments(driverId, note)`** — Sets onboardingStep=2 (back to upload)
- **`listAllDrivers(filters?)`** — Filter by status, city, search (name/email/phone regex)
- **`updateDriverStatus(driverId, status)`** — Manual status change

#### Assignment Service (`assignment.service.ts`) — 416 lines, largest service

**Driver-facing:**
- **`getAvailableAssignments(driverId)`** — Filters by score tier visibility (priority sees all, limited sees only last 10% slots)
- **`reserveAssignment(driverId, assignmentId)`** — Validates active status, checks max 2/day limit, checks capacity, creates booking
- **`getMyAssignments(driverId)`** — Returns driver's bookings with populated assignment/location data
- **`confirmAssignment(driverId, bookingId)`** — Records confirmation window (t24/t12/t6), sets status=confirmed
- **`checkInAssignment(driverId, bookingId, code, lat, lng)`** — Validates check-in code + GPS radius, marks completed, awards +2 score
- **`cancelAssignment(driverId, bookingId)`** — On-time (>24h, no penalty) or late (<24h, -10 score)

**Admin/system:**
- **`createAssignment(data)`** — Calculates maxDrivers with overbooking %, generates 6-digit check-in code, sets startTime
- **`listAssignments(filters?)`** — With booking stats (reserved, confirmed, checked-in, cancelled, no-shows)
- **`withdrawUnconfirmedBookings()`** — Auto-withdraws unconfirmed bookings T-6h before start
- **`markNoShows()`** — Marks confirmed-but-unchecked-in bookings as no-show, applies -20 penalty

#### Scoring Service (`scoring.service.ts`)
- **`applyScoreChange(driverId, delta, reason)`** — Clamps 0–100, auto-restricts if score <60
- **`applyNoShowPenalty(driverId, bookingId)`** — -20 points
- **`applyLateCancelPenalty(driverId, bookingId)`** — -10 points
- **`applyCompletedBonus(driverId, bookingId)`** — +2 points
- **`getDriverScore(driverId)`** — Returns score + tier (priority/normal/limited/restricted) + history

#### Location Service (`location.service.ts`)
- **`createLocation(data)`** — Creates hub with coordinates and check-in settings
- **`listLocations(city?)`** — Active locations, optionally filtered by city
- **`updateLocation(locationId, data)`** — Partial update

#### Billing Service (`billing.service.ts`)
- **`generateBillingPeriod(driverId, month, year)`** — Aggregates completed bookings into monthly summary
- **`getDriverBillingPeriods(driverId)`** — All periods, newest first
- **`getBillingPeriodById(periodId, driverId)`** — Period with attached invoice
- **`submitInvoice(driverId, periodId, fileUrl, amount)`** — Creates invoice (prevents duplicates)
- **`listAllInvoices(filters?)`** — Admin: all invoices with driver/period data
- **`approveInvoice(invoiceId, adminId)`** — Sets approved
- **`rejectInvoice(invoiceId, adminId, reason)`** — Sets rejected with reason

#### Analytics Service (`analytics.service.ts`)
- **`getOverview()`** — Driver counts, booking counts, rates (no-show/cancellation/completion), top/problem drivers
- **`getNoShowAnalytics()`** — Recent no-shows + top offenders
- **`getCancellationAnalytics()`** — Late vs on-time cancellation breakdown
- **`getLocationAnalytics()`** — Per-location fill rate, completion rate, no-show count
- **`getBillingAnalytics()`** — Invoice counts by status + approved/pending amounts

### 5.6 Controllers

Each controller wraps a service call with error handling and maps HTTP requests to service methods:

| Controller | Endpoints | Auth Required |
|-----------|-----------|---------------|
| `auth.controller.ts` | register, login, logout | No |
| `driver.controller.ts` | 7 endpoints (profile, docs, application, score) | Yes + Driver role |
| `admin.controller.ts` | 7 endpoints (pending, approve, reject, list, status) | Yes + Admin role |
| `assignment.controller.ts` | 8 endpoints (available, reserve, confirm, check-in, cancel, create, list) | Yes + role-specific |
| `billing.controller.ts` | 7 endpoints (periods, invoice, admin approve/reject) | Yes + role-specific |
| `analytics.controller.ts` | 5 endpoints (overview, no-shows, cancellations, locations, billing) | Yes + Admin role |
| `location.controller.ts` | 3 endpoints (create, list, update) | Yes + Admin role |

### 5.7 Routes

| Route File | Base Path | Endpoints |
|-----------|-----------|-----------|
| `auth.routes.ts` | `/api/auth` | POST /register, /login, /logout |
| `driver.routes.ts` | `/api/drivers` | GET/PUT /me/*, POST /me/documents, /me/submit-application |
| `admin.routes.ts` | `/api/admin` | /drivers/*, /assignments/*, /invoices/*, /analytics/*, /locations/* |
| `assignment.routes.ts` | `/api/assignments` | GET /available, /my; POST /:id/reserve, /confirm, /check-in, /cancel |
| `billing.routes.ts` | `/api/billing` | GET /periods, /periods/:id; POST /periods/:id/invoice, /periods/generate |

### 5.8 App & Server Bootstrap

**`app.ts`** — Express configuration:
1. CORS (all origins)
2. JSON body parser
3. URL-encoded body parser
4. Morgan HTTP logging
5. Health check at `/api/health`
6. All route modules mounted
7. 404 handler + centralized error handler

**`server.ts`** — Startup sequence:
1. Connect to MongoDB
2. Start cron jobs
3. Listen on PORT (default 4000)

---

## 6. Admin Web Dashboard

### 6.1 Auth & State

- **`AuthContext.tsx`** — Global context with `login()`, `logout()`, stores JWT token and admin user info
- Token stored in React state (resets on page refresh)
- Protected routes redirect to `/login` if no token

### 6.2 API Service Layer

| Service | Hook | Endpoints |
|---------|------|-----------|
| `api.ts` | `useAuthorizedClient()` | Base Axios client, auto-injects Bearer token |
| `auth.api.ts` | — | `loginAdminApi(email, password)` |
| `drivers.api.ts` | `useDriversApi()` | listPending, listAll, get, approve, reject, requestMoreDocs, updateStatus |
| `assignments.api.ts` | `useAssignmentsApi()` | listAssignments, createAssignment, listLocations, createLocation |
| `billing.api.ts` | `useBillingApi()` | listInvoices, approveInvoice, rejectInvoice |
| `analytics.api.ts` | `useAnalyticsApi()` | getOverview, getNoShows, getCancellations, getLocations, getBilling |

### 6.3 Layout

**`SidebarLayout.tsx`** — Persistent sidebar with:
- FleetX Admin logo
- 5 navigation links: Dashboard, Driver Approvals, All Drivers, Deployments, Billing
- Active route highlighting
- Admin name/email in footer
- Logout button

### 6.4 Pages (6 total)

#### LoginPage
- Email + password form
- Error display
- Redirects to analytics on success

#### AnalyticsPage (Dashboard)
- **6 KPI cards**: Total Drivers, Total Bookings, No-Show Rate, Cancellation Rate, Completion Rate, Active Assignments
- **Driver rankings**: Top 5 by score + Problem drivers (score <70)
- **Location occupancy table**: Fill rate per location with color coding
- **Billing overview**: Pending/approved/rejected/paid invoice counts and amounts

#### DriverApprovalPage
- Lists drivers with `status=under_review` AND `onboardingStep=3`
- Approve/Reject buttons per driver
- Auto-reloads after action

#### DriverListPage
- **Search**: By name, email, or phone
- **Filter**: By status (active, under_review, restricted, blocked)
- **Table**: Name, Email, Phone, City, Status badge, Score badge (color-coded by tier), Actions
- **Actions**: Restrict/Activate toggle, Block/Unblock toggle
- Score tier colors: Green (90+), Blue (70–89), Yellow (60–69), Red (<60)

#### DeploymentManagementPage
- **Create Location form**: Name, city, address, lat/lng, overbooking %
- **Create Deployment form**: Location dropdown, date, time slot, required drivers, compensation
- **Filter**: By date and city
- **Table**: Location, City, Date, Slot, Capacity, Booked, Confirmed, Checked-in, No-Shows, Risk Level, Pay
- **Risk indicator**: Color-coded (Filled/Moderate/At Risk) based on fill rate

#### BillingPage
- **Filter**: By invoice status (all, submitted, approved, rejected, paid)
- **Table**: Driver, Period, Missions, Amount, Status badge, Submitted date, Actions
- **Actions** (for submitted invoices): Approve button, Reject button (prompts for reason)

---

## 7. Driver Mobile App

### 7.1 Navigation Architecture

Three-tier navigation based on auth state:

```
┌─────────────────────────────────────────────────┐
│ RootNavigator                                    │
│                                                  │
│  Not authenticated? → AuthStack                  │
│    ├── WelcomeScreen                             │
│    ├── RegisterScreen                            │
│    └── LoginScreen                               │
│                                                  │
│  Authenticated but onboardingStep < 4?           │
│  → OnboardingStack                               │
│    ├── ProfileSetupScreen                        │
│    ├── DocumentUploadScreen                      │
│    └── PendingApprovalScreen                     │
│                                                  │
│  Fully onboarded + active? → MainTabs            │
│    ├── Dashboard (DriverDashboardScreen)          │
│    ├── Deployments (AvailableDeploymentsScreen)   │
│    ├── Score (DriverScoreScreen)                  │
│    ├── Earnings (EarningsScreen)                  │
│    └── Profile (ProfileSettingsScreen)            │
└─────────────────────────────────────────────────┘
```

### 7.2 Auth & State

**`AuthContext.tsx`** — useReducer-based state management:
- Actions: `LOGIN_START`, `LOGIN_SUCCESS`, `LOGIN_ERROR`, `LOGOUT`, `UPDATE_DRIVER_PROFILE`
- State: `{ token, user, driverProfile, loading }`
- Functions: `login()`, `register()`, `refreshDriver()`, `logout()`
- Error handling: dispatches `LOGIN_ERROR` to reset loading state on failure

### 7.3 API Service Layer

**`api.ts`** — Platform-aware base URL:
- Physical device: Uses IP from `app.json > extra.apiUrl`
- Android emulator: `http://10.0.2.2:4000`
- iOS simulator / web: `http://localhost:4000`

**`auth.api.ts`** — `registerApi()`, `loginApi()`

**`driver.api.ts`** — 17 functions covering:
- Profile: getMe, updateProfile
- Documents: upload, list, submitApplication, getApplicationStatus
- Score: getScore
- Assignments: getAvailable, reserve, getMyAssignments, confirm, checkIn, cancel
- Billing: getBillingPeriods, getBillingPeriod, submitInvoice, generateBillingPeriod

### 7.4 Reusable Components

| Component | Purpose |
|-----------|---------|
| `ScreenContainer` | SafeAreaView wrapper with standard padding and white background |
| `InputField` | Labeled text input supporting all TextInput props (keyboard types, secure entry) |

### 7.5 Screens (11 total)

#### Auth Flow

**WelcomeScreen** — Landing page with "Get started" → Register and "Log in" → Login buttons.

**RegisterScreen** — 4 fields (name, phone, email, password). Calls `register()`, shows error alerts on failure.

**LoginScreen** — 2 fields (email/phone, password). Calls `login()`, shows error alerts on failure.

#### Onboarding Flow

**ProfileSetupScreen** (Step 1/3) — Pre-fills user data. Collects address + bank details (bank name, account holder, IBAN). Calls `updateProfileApi()`.

**DocumentUploadScreen** (Step 2/3) — 4 required documents: driver license, ID, profile photo, bank proof. Shows upload/replace buttons per document. Submit button enabled only when all 4 uploaded.

**PendingApprovalScreen** (Step 3/3) — Shows "Application under review" card with verification info. Refresh button polls for admin approval.

#### Main Tabs

**DriverDashboardScreen** — Greeting with name, status badge, and score. Lists upcoming bookings with full details (location, city, date, slot, compensation, hours until start). Dynamic action buttons:
- **Confirm**: Available when reserved and within 24h of start
- **Check In**: Available when confirmed and within 1h of start (shows code input field)
- **Cancel**: Available for reserved/confirmed bookings (warns about late penalty)

**AvailableDeploymentsScreen** — Lists available assignment slots (filtered by score tier from API). Shows location, compensation, date, slot, remaining capacity. "Make Binding Reservation" button per slot.

**DriverScoreScreen** — Large score display with tier badge (Priority/Normal/Limited/Restricted). Rules reference card showing point values. Score history list with reason, date, and delta.

**EarningsScreen** — Total earnings summary card. Billing period list with mission details (first 3 shown, "+X more" for rest). "Generate Last Month" button. "Upload Invoice" button per period.

**ProfileSettingsScreen** — Displays name, email, phone. Logout button.

---

## 8. Business Rules Implementation

### Time Slots
Each day has 3 slots mapped to start times:
| Slot | Start Time |
|------|-----------|
| Morning | 8:00 AM |
| Midday | 1:00 PM |
| Evening | 6:00 PM |

Planning is per: **Location + Date + TimeSlot**

### Driver Status Lifecycle
```
under_review → active (admin approves)
             → blocked (admin rejects)
active → restricted (score drops below 60, automatic)
       → blocked (admin action)
restricted → active (admin action / score recovers)
```

### Scoring System

| Event | Points | Implementation |
|-------|--------|----------------|
| Starting score | 100 | `User.currentScore` default |
| Completed mission | +2 | `checkInAssignment()` calls `applyCompletedBonus()` |
| Late cancellation (<24h) | -10 | `cancelAssignment()` calls `applyLateCancelPenalty()` |
| No-show | -20 | `markNoShows()` cron calls `applyNoShowPenalty()` |
| Score floor | 0 | Clamped in `applyScoreChange()` |
| Score ceiling | 100 | Clamped in `applyScoreChange()` |

**Tier Visibility:**

| Score Range | Tier | Slot Access |
|-------------|------|-------------|
| 90–100 | Priority | All slots |
| 70–89 | Normal | All slots |
| 60–69 | Limited | Only slots with <10% capacity remaining |
| <60 | Restricted | No slots visible; auto-restricted status |

### Booking Rules
- **Max 2 missions per driver per day** — enforced in `reserveAssignment()`
- **Slot is binding once confirmed** — status transitions enforced
- **Cancellation types**: on_time (>24h before start, no penalty) or late (<24h, -10 score)

### Confirmation System
- Reminders at **T-24h, T-12h, T-6h** before assignment start
- Confirmation tracked per window in `booking.confirmations.{t24, t12, t6}`
- **Auto-withdrawal at T-6h**: Unconfirmed (still `reserved`) bookings are withdrawn by cron job every 15 minutes

### Check-in Validation
Two conditions must be met:
1. **Correct code** — Driver enters the 6-digit `assignment.checkinCode`
2. **GPS proximity** — Driver's coordinates within `location.checkinRadiusMeters` (default 500m)

Failure = no check-in = eventual no-show

### Overbooking
- If 120 slots needed → `maxDrivers = 120 + (120 × overbookingPercent%)`
- Each location has its own `overbookingPercent` (default 5%)
- Drivers booked beyond `requiredDrivers` are marked `isSubstitute: true`

### Billing Flow
1. System generates `BillingPeriod` per driver at month end (or on demand)
2. Driver uploads invoice via `submitInvoice()`
3. Admin verifies: `approveInvoice()` or `rejectInvoice(reason)`
4. Payment released after approval

---

## 9. API Reference

### Authentication (Public)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{name, email, phone, password}` | `{token, user}` |
| POST | `/api/auth/login` | `{emailOrPhone, password}` | `{token, user}` |
| POST | `/api/auth/logout` | — | `{message}` |

### Driver Self-Service (Requires: Auth + Driver Role)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/drivers/me` | — | User profile |
| PUT | `/api/drivers/me/profile` | `{name?, phone?, email?, address?, bankDetails?}` | Updated profile |
| POST | `/api/drivers/me/documents` | `{type, fileUrl}` | Document |
| GET | `/api/drivers/me/documents` | — | Document[] |
| POST | `/api/drivers/me/submit-application` | — | Updated profile |
| GET | `/api/drivers/me/application-status` | — | `{status, onboardingStep}` |
| GET | `/api/drivers/me/score` | — | `{currentScore, tier, history}` |

### Assignments — Driver (Requires: Auth + Driver Role)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/assignments/available` | — | Assignment[] with slotsRemaining |
| POST | `/api/assignments/:id/reserve` | — | Booking |
| GET | `/api/assignments/my` | — | Booking[] with assignment details |
| POST | `/api/assignments/:id/confirm` | — | Updated booking |
| POST | `/api/assignments/:id/check-in` | `{code, lat, lng}` | Completed booking |
| POST | `/api/assignments/:id/cancel` | — | Cancelled booking |

### Billing — Driver (Requires: Auth + Driver Role)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/billing/periods` | — | BillingPeriod[] |
| GET | `/api/billing/periods/:id` | — | `{period, invoice?}` |
| POST | `/api/billing/periods/:id/invoice` | `{fileUrl, amount}` | Invoice |
| POST | `/api/billing/periods/generate` | `{month, year}` | BillingPeriod |

### Admin — Drivers (Requires: Auth + Admin Role)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/admin/drivers/pending` | — | User[] |
| GET | `/api/admin/drivers/:id` | — | User with documents |
| GET | `/api/admin/drivers` | Query: `status, city, search` | User[] |
| POST | `/api/admin/drivers/:id/approve` | — | Updated user |
| POST | `/api/admin/drivers/:id/reject` | `{reason?}` | Updated user |
| POST | `/api/admin/drivers/:id/request-more-documents` | `{note}` | Updated user |
| PUT | `/api/admin/drivers/:id/status` | `{status}` | Updated user |

### Admin — Assignments (Requires: Auth + Admin Role)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/admin/assignments` | `{location, date, timeSlot, requiredDrivers, compensation}` | Assignment |
| GET | `/api/admin/assignments` | Query: `date, locationId, city` | Assignment[] with stats |

### Admin — Locations (Requires: Auth + Admin Role)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/admin/locations` | `{name, city, address, lat, lng, checkinRadiusMeters?, overbookingPercent?}` | Location |
| GET | `/api/admin/locations` | Query: `city` | Location[] |
| PUT | `/api/admin/locations/:id` | Partial location data | Updated location |

### Admin — Invoices (Requires: Auth + Admin Role)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/admin/invoices` | Query: `status` | Invoice[] |
| POST | `/api/admin/invoices/:id/approve` | — | Updated invoice |
| POST | `/api/admin/invoices/:id/reject` | `{reason}` | Updated invoice |

### Admin — Analytics (Requires: Auth + Admin Role)

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/admin/analytics/overview` | KPIs, rates, top/problem drivers |
| GET | `/api/admin/analytics/no-shows` | Recent no-shows + top offenders |
| GET | `/api/admin/analytics/cancellations` | Late vs on-time breakdown |
| GET | `/api/admin/analytics/locations` | Per-location fill rates |
| GET | `/api/admin/analytics/billing` | Invoice counts + amounts by status |

### Response Format

All responses follow:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 10. Database Schema

### Collections & Relationships

```
Users ──────────────┐
  │                  │
  │ 1:N              │ 1:N
  ▼                  ▼
Documents        BillingPeriods ──→ Invoices
                     ▲
                     │ references
Locations            │
  │                  │
  │ 1:N              │
  ▼                  │
Assignments ────→ Bookings ────→ Scores
                  (driver↔assignment)
```

### Indexes

| Collection | Index | Type |
|-----------|-------|------|
| User | email | Unique |
| User | role + status | Compound |
| Document | driver + type | Compound |
| Location | city | Single |
| Assignment | location + date + timeSlot | Unique compound |
| Assignment | date + isActive | Compound |
| Booking | driver + assignment | Unique compound |
| Booking | driver + status | Compound |
| Booking | assignment + status | Compound |
| Score | driver + createdAt (desc) | Compound |
| BillingPeriod | driver + year + month | Unique compound |
| Invoice | driver + status | Compound |
| Invoice | billingPeriod | Single |

---

## 11. Cron Jobs & Automation

| Job | Schedule | Logic |
|-----|----------|-------|
| Auto-withdraw unconfirmed | Every 15 minutes | Finds assignments starting within 6h. Withdraws bookings still in `reserved` status (never confirmed). Slot goes back to pool. |
| Mark no-shows | Every 30 minutes | Finds past assignments (2+ hours after start). Marks `confirmed` but unchecked-in bookings as `no_show`. Applies -20 score penalty per no-show. |

Both jobs log their activity count via Winston logger.

---

## 12. File Inventory

### Backend (43 files, 2,381 lines)

```
backend/
├── .env
├── package.json
├── tsconfig.json
└── src/
    ├── app.ts
    ├── server.ts
    ├── cron.ts
    ├── seed.ts
    ├── config/
    │   ├── db.ts
    │   ├── env.ts
    │   └── logger.ts
    ├── controllers/
    │   ├── admin.controller.ts
    │   ├── analytics.controller.ts
    │   ├── assignment.controller.ts
    │   ├── auth.controller.ts
    │   ├── billing.controller.ts
    │   ├── driver.controller.ts
    │   └── location.controller.ts
    ├── middleware/
    │   ├── auth.middleware.ts
    │   ├── error.middleware.ts
    │   ├── roles.middleware.ts
    │   └── validate.middleware.ts
    ├── models/
    │   ├── Assignment.model.ts
    │   ├── BillingPeriod.model.ts
    │   ├── Booking.model.ts
    │   ├── Document.model.ts
    │   ├── Invoice.model.ts
    │   ├── Location.model.ts
    │   ├── Score.model.ts
    │   └── User.model.ts
    ├── routes/
    │   ├── admin.routes.ts
    │   ├── assignment.routes.ts
    │   ├── auth.routes.ts
    │   ├── billing.routes.ts
    │   └── driver.routes.ts
    ├── services/
    │   ├── admin.service.ts
    │   ├── analytics.service.ts
    │   ├── assignment.service.ts
    │   ├── auth.service.ts
    │   ├── billing.service.ts
    │   ├── driver.service.ts
    │   ├── location.service.ts
    │   └── scoring.service.ts
    └── utils/
        ├── constants.ts
        ├── geo.ts
        ├── jwt.ts
        └── response.ts
```

### Admin Web Dashboard (23 files, 1,781 lines)

```
admin-web-dashboard/
├── package.json
├── tsconfig.json
├── vite.config.mts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── context/
    │   └── AuthContext.tsx
    ├── components/layout/
    │   ├── SidebarLayout.tsx
    │   └── SidebarLayout.css
    ├── pages/
    │   ├── LoginPage.tsx + .css
    │   ├── DriverApprovalPage.tsx + .css
    │   ├── DriverListPage.tsx + .css
    │   ├── DeploymentManagementPage.tsx + .css
    │   ├── BillingPage.tsx + .css
    │   └── AnalyticsPage.tsx + .css
    └── services/
        ├── api.ts
        ├── auth.api.ts
        ├── drivers.api.ts
        ├── assignments.api.ts
        ├── billing.api.ts
        └── analytics.api.ts
```

### Driver Mobile App (21 files, 1,932 lines)

```
driver-mobile-app/
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
└── src/
    ├── context/
    │   └── AuthContext.tsx
    ├── services/
    │   ├── api.ts
    │   ├── auth.api.ts
    │   └── driver.api.ts
    ├── navigation/
    │   ├── index.tsx (RootNavigator)
    │   ├── AuthStack.tsx
    │   ├── OnboardingStack.tsx
    │   └── MainTabs.tsx
    ├── components/
    │   ├── layout/ScreenContainer.tsx
    │   └── forms/InputField.tsx
    └── screens/
        ├── WelcomeScreen.tsx
        ├── RegisterScreen.tsx
        ├── LoginScreen.tsx
        ├── ProfileSetupScreen.tsx
        ├── DocumentUploadScreen.tsx
        ├── PendingApprovalScreen.tsx
        ├── DriverDashboardScreen.tsx
        ├── AvailableDeploymentsScreen.tsx
        ├── DriverScoreScreen.tsx
        ├── EarningsScreen.tsx
        └── ProfileSettingsScreen.tsx
```
