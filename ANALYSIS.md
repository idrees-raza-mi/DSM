# FleetFlow DSM — Deep Analysis & Completion Roadmap

**Date:** March 2026
**Based on:** Client requirements PDF + full codebase audit
**Purpose:** Gap analysis, missing features, what's next, how to complete

---

## 1. CURRENT STATE SUMMARY

### What Is Fully Built & Working

| Layer | Component | Status |
|---|---|---|
| Backend | Auth (register, login, JWT) | ✅ Done |
| Backend | Driver profile & document management | ✅ Done |
| Backend | Admin driver approval workflow | ✅ Done |
| Backend | Assignment creation & slot management | ✅ Done |
| Backend | Booking system (reserve → confirm → check-in → complete) | ✅ Done |
| Backend | Scoring engine (no-show -20, late cancel -10, completed +2) | ✅ Done |
| Backend | Score tier slot visibility filtering | ✅ Done |
| Backend | Auto-withdrawal cron at T-6h | ✅ Done |
| Backend | No-show detection cron (2h after start) | ✅ Done |
| Backend | GPS + code check-in validation | ✅ Done |
| Backend | Overbooking logic per location/timeslot | ✅ Done |
| Backend | Billing periods & invoice system | ✅ Done |
| Backend | Analytics API endpoints | ✅ Done |
| Backend | Location model with per-city configuration | ✅ Done |
| Mobile | Auth flow (register → login) | ✅ Done |
| Mobile | Onboarding (profile setup, document upload, pending) | ✅ Done |
| Mobile | Available deployments screen (fetch, filter, book) | ✅ Done |
| Mobile | Driver dashboard (upcoming missions, confirm, check-in, cancel) | ✅ Done |
| Mobile | Score screen (score, tier badge, history) | ✅ Done |
| Mobile | Earnings screen (billing periods, invoice upload) | ✅ Done |
| Mobile | Safe area handling (notch + nav bar) | ✅ Done |
| Admin | Login with JWT | ✅ Done |
| Admin | Driver approval / rejection | ✅ Done |
| Admin | Driver list with filters | ✅ Done |
| Admin | Deployment management (create/list assignments) | ✅ Done |
| Admin | Billing page (approve/reject invoices) | ✅ Done |
| Admin | Analytics overview page | ✅ Done |

---

## 2. CRITICAL GAPS — Blocks Core Workflow

These are missing features that make the system incomplete or unusable in production.

---

### GAP 1 — Real Document Upload (CRITICAL)

**What the requirement says:**
Drivers upload identity documents, business registration, bank details proof. Admin reviews these before approving.

**What exists:**
`DocumentUploadScreen` calls `fakeUpload()` which submits a hardcoded fake URL:
```
fileUrl: "https://files.example.com/driver_license.pdf"
```
No actual file is uploaded anywhere.

**What is missing:**
- Cloud file storage integration (Cloudinary, AWS S3, or Firebase Storage)
- Real file picker on mobile (image/PDF selection)
- File upload API endpoint on backend
- Admin UI to actually view/preview the uploaded documents

**Impact:** Admin cannot review real documents. The entire approval workflow is based on fake data. This is the single most critical gap.

---

### GAP 2 — Push Notifications / Reminders (CRITICAL)

**What the requirement says:**
Before each deployment, drivers are reminded at:
- T-24h (24 hours in advance)
- T-12h (12 hours beforehand)
- T-6h (6 hours — last chance to confirm or slot is withdrawn)

**What exists:**
The cron job (`cron.ts`) runs every 15 minutes and checks for assignments approaching the T-6h window. It auto-withdraws unconfirmed bookings. But it does **not send any notification** to the driver.

**What is missing:**
- Push notification service (Firebase Cloud Messaging / Expo Push Notifications)
- `pushToken` field on User model to store device push token
- Token registration on mobile app login
- Notification sender in cron for T-24, T-12, T-6 events
- In-app notification badge/alert when slot is at risk

**Impact:** Drivers have no idea their slot is about to be withdrawn. They lose slots silently. The confirmation system described in the PDF does not actually function.

---

### GAP 3 — Check-in Code Display for Location Supervisors (CRITICAL)

**What the requirement says:**
Check-in requires the driver to enter a code. The code must be displayed at the physical deployment location (by a supervisor, on a screen, etc.) — not to the driver in advance.

**What exists:**
`Assignment.model.ts` has a `checkinCode` field (auto-generated). The backend validates the code on check-in. But there is no way for anyone to see or display this code except by querying the database directly.

**What is missing:**
- Admin dashboard view showing the check-in code per assignment per day
- Printable/displayable code page per location/timeslot
- Option to regenerate the code if compromised

**Impact:** Drivers cannot check in because nobody at the location knows the code. The entire check-in system is unusable.

---

### GAP 4 — Admin: Location Management UI (CRITICAL)

**What the requirement says:**
Each city is controlled separately with its own failure rate, overbooking values, risk times, and key figures.

**What exists:**
`Location.model.ts` and `location.service.ts` are fully built on the backend. Location routes exist. But the admin dashboard has **no page to create, edit, or manage locations**.

**What is missing:**
- Admin "Locations" page in the dashboard
- Create location form (name, city, GPS coordinates, check-in radius, overbooking %)
- Per-city metrics view (failure rate, slot utilization, overbooking stats)
- Edit location settings

**Impact:** No locations exist in the database, so no assignments can be created with a valid location reference. Deployments page cannot function properly.

---

### GAP 5 — Request More Documents Flow (CRITICAL)

**What the requirement says:**
Admin can request more documents from a driver during review.

**What exists:**
Backend route `POST /api/admin/drivers/:id/request-more-documents` exists. Admin dashboard has a "Request Documents" button on the approval page.

**What is missing:**
- Mobile app has no screen or notification showing the driver was asked for more documents
- Driver has no way to know they need to resubmit
- PendingApprovalScreen does not check for this status
- No `requestedDocuments` field or messaging system to tell the driver what is needed

**Impact:** Admin can click the button but the driver never finds out. Application stays stuck.

---

## 3. HIGH PRIORITY GAPS — Core Features Not Yet Functional

---

### GAP 6 — Monthly Billing Auto-Generation Cron

**What the requirement says:**
"An invoice is automatically generated at the end of the month."

**What exists:**
Billing period generation API exists but only runs **on demand** (driver presses "Generate Last Month" button in app).

**What is missing:**
- Cron job that runs on the 1st of each month
- Auto-creates billing periods for every active driver
- Calculates total missions and amounts for the previous month

---

### GAP 7 — Driver Mission History Screen

**What the requirement says:**
Drivers can "see their history" — all past missions, cancellations, no-shows.

**What exists:**
Score history is shown on DriverScoreScreen (why points changed). But there is no dedicated screen showing a timeline of all missions (date, location, time slot, status, pay).

**What is missing:**
- Mission history screen or tab in mobile app
- Filterable list: completed / cancelled / no-show / withdrawn
- Per-mission detail: date, location, slot, pay earned, cancellation reason

---

### GAP 8 — Restricted / Blocked Driver Handling in Mobile App

**What the requirement says:**
- Score < 60 → restricted status (auto set by backend)
- Blocked → cannot access the system
- In case of repeated no-shows: temporary closure

**What exists:**
Backend auto-sets status to `restricted` when score drops below 60. But the mobile app does not check for this. A restricted driver would still see the same dashboard as an active driver.

**What is missing:**
- Mobile app checks `driverProfile.status` on login and after score updates
- If `restricted`: show warning banner, explain consequences
- If `blocked`: show locked screen, contact admin message
- No booking button visible for restricted drivers (score < 60)

---

### GAP 9 — Real-time Slot Status in Admin Dashboard

**What the requirement says:**
Admin dashboard shows a live overview of open / booked / confirmed slots and risk slots.

**What exists:**
Analytics page exists with some stats, but it shows historical data fetched once on page load. No live refresh.

**What is missing:**
- Auto-refresh polling every 30-60 seconds on deployment view
- "Risk slots" highlight: bookings where T-6h is approaching and not yet confirmed
- Slot status board: per location, per timeslot, how many open/booked/confirmed

---

### GAP 10 — Overbooking Substitute Notification

**What the requirement says:**
"Drivers with lower rankings will be substitutes." When too many drivers show up, lower-score drivers are put on a reserve list.

**What exists:**
`isSubstitute` flag is set on bookings when overbooking occurs. But drivers are not told they are substitutes. A substitute driver shows up expecting to work and is turned away without warning.

**What is missing:**
- Notification to driver when marked as substitute
- Mobile dashboard shows "Substitute — you may not be needed" badge
- Admin can activate/deactivate substitutes on the day

---

## 4. MEDIUM PRIORITY GAPS

---

### GAP 11 — Multi-City Role Management

**Requirement:** Each city can be controlled separately. Implies different admin users per city.

**Missing:**
- Admin user model needs a `cities[]` field
- Super-admin sees all cities; city-admin sees only their city
- All admin queries need city-scope filtering

---

### GAP 12 — Invoice PDF Template

**Requirement (optional in PDF but important):** "Automatic invoice template" — driver uses system data to create their invoice.

**Missing:**
- Auto-generate a PDF invoice template pre-filled with driver's name, IBAN, mission list, total amount
- Downloadable from the EarningsScreen
- Reduces driver error in invoice submission

---

### GAP 13 — Accounting Export

**Requirement (optional):** "Export for accounting"

**Missing:**
- Admin: CSV/Excel export of approved invoices for a given month
- Include driver name, IBAN, amount, mission count
- Feed into external payroll/accounting tools

---

### GAP 14 — Score Dispute / Appeal Mechanism

**Missing from requirements but logically needed:**
- A driver receives a no-show penalty they believe is wrong (GPS failed, code wasn't shown)
- There is no way to dispute or appeal a score deduction
- Admin has no tool to manually adjust a driver's score with a reason

---

### GAP 15 — Admin: Full Audit Log per Driver

**Requirement:** "In case of disputes, everything can be proven."

**What exists:** Score model logs score changes. Booking model stores statuses with timestamps.

**Missing:**
- Admin view showing a full chronological timeline per driver: registered, approved, every booking, every cancellation, every no-show, every score change, every invoice
- Dispute resolution screen using this trail

---

## 5. MINOR / LOW PRIORITY GAPS

| # | Gap | Notes |
|---|---|---|
| 16 | Real-time WebSocket updates in admin | Polling every 30s is sufficient for v1 |
| 17 | Bulk admin operations | Bulk approve/reject drivers, bulk assignment creation |
| 18 | Payment processing integration | Currently "approved" is the end state — no actual payment gateway |
| 19 | GPS polygon boundaries | Currently single point + radius. Large venues may need polygon |
| 20 | Offline mobile check-in fallback | If no signal at check-in location |
| 21 | Business registration document type | Model has it but not shown in DocumentUploadScreen |
| 22 | Driver profile photo in app | Model has profile_photo document type but app doesn't render it |
| 23 | Admin password management | No admin can change their password via UI |
| 24 | Session expiry handling in mobile | JWT expires after 7 days — no refresh token, no graceful re-login prompt |
| 25 | Dark mode | Not mentioned in requirements but standard for driver-facing apps |

---

## 6. FEATURE COMPLETENESS SCORECARD

| System Area | Requirements Coverage | Current Build |
|---|---|---|
| Registration & Approval | 100% defined | 70% — fake document upload |
| Driver Booking Flow | 100% defined | 85% — works but no notifications |
| Confirmation System (T-24/12/6) | 100% defined | 40% — cron works, no notifications sent |
| Check-in System | 100% defined | 60% — backend works, code not displayed |
| Scoring & Ranking | 100% defined | 90% — fully implemented |
| Cancellation Rules | 100% defined | 95% — fully implemented |
| Overbooking | 100% defined | 75% — logic works, no substitute notice |
| Standby & Backup | Partially defined | 30% — reserve list exists, no active management |
| Multi-city Control | 100% defined | 40% — model exists, no admin UI |
| Admin Dashboard | 100% defined | 65% — pages exist, missing live data + locations |
| Billing & Payment | 100% defined | 60% — manual trigger, no PDF, no auto-gen |
| Traceability | 100% defined | 50% — data is stored, no admin audit view |
| Push Notifications | 100% defined | 0% — completely missing |
| Real Document Upload | Implied | 0% — fake URLs |

**Overall:** ~62% of the full system is functional.

---

## 7. WHAT TO BUILD NEXT — PRIORITY ORDER

### Phase 1 — Make the System Usable (2-3 weeks)

These must be done before any real driver can use the system.

1. **Real file upload** — Integrate Cloudinary or Firebase Storage. Add file picker to DocumentUploadScreen. Update admin to preview documents.
2. **Admin: Location management** — Create locations page in admin dashboard. Without real locations, no real assignments.
3. **Check-in code display** — Admin dashboard: per-assignment code display panel. Must be accessible at the deployment site.
4. **Request more documents flow** — Add a status field to driver model, show it in PendingApprovalScreen, allow targeted re-upload.
5. **Restricted/Blocked UI** — Mobile app checks status on auth and blocks appropriately.

### Phase 2 — Make the System Smart (2-3 weeks)

6. **Push notifications** — Firebase Cloud Messaging. T-24/T-12/T-6 reminders. Slot withdrawal alert. Application approved/rejected.
7. **Monthly billing cron** — Auto-generate billing periods on 1st of month for all active drivers.
8. **Mission history screen** — Driver can see all past/upcoming missions with full detail.
9. **Risk slots panel in admin** — Real-time view of slots approaching T-6h without confirmation.
10. **Substitute notification** — When a driver is marked substitute, they see it clearly in the app.

### Phase 3 — Complete the System (2-3 weeks)

11. **Invoice PDF auto-generation** — Pre-filled template driver downloads and submits.
12. **Accounting export** — Admin CSV export of approved invoices.
13. **Admin audit log per driver** — Full timeline for disputes.
14. **Multi-city admin roles** — Scope admin accounts to specific cities.
15. **Score dispute tool** — Admin manually adjusts score with reason; driver sees outcome.

### Phase 4 — Polish & Production (1-2 weeks)

16. JWT refresh token (prevent forced re-login every 7 days)
17. Bulk admin operations
18. Session-expired graceful redirect in mobile app
19. Business registration document type in upload screen
20. Final UI/UX pass on all screens

---

## 8. ARCHITECTURE CONCERNS TO ADDRESS

### 8.1 — No Notification Infrastructure
The system has zero notification capability. This needs to be added at the infrastructure level before Phase 2 can start:
- Add `pushToken: String` to User model
- Add Expo push token registration on mobile login
- Add a `notifications.service.ts` to backend
- All cron jobs call the notification service instead of just updating DB

### 8.2 — File Upload Architecture
Currently all file fields store strings (URLs). The choice of storage provider affects this:
- **Cloudinary** — easiest, free tier available, good for images/PDFs
- **AWS S3** — most scalable, needs more setup
- **Firebase Storage** — consistent with potential FCM for notifications

### 8.3 — Assignment / Location Data Dependency
The deployment management page can create assignments but:
- Assignments require a valid `location` ObjectId
- No locations exist in DB until admin creates them
- This is a chicken-and-egg problem blocking ALL assignment functionality

**Fix:** Seed at least one default location when the system first starts, or force admin to create a location before any deployment can be made.

### 8.4 — Cron Job Reliability
Current cron runs every 15 minutes in the Node.js process. If the server restarts, any pending cron that was mid-cycle is lost. For production:
- Use a dedicated job queue (Bull/BullMQ with Redis)
- Or at minimum add restart-safe cron using DB timestamps

### 8.5 — Score Tier on Slot Visibility
The current implementation filters slots by score tier at query time. If a driver's score changes mid-day, they see different slots. This is correct behaviour but should be clearly communicated to drivers in the app.

---

## 9. THINGS THE CLIENT'S PDF DOES NOT DEFINE (Needs Clarification)

These are gaps in the requirements document itself — decisions that must be made:

| Question | Impact |
|---|---|
| What is the pay rate per assignment? Flat fee or hourly? | Billing calculation |
| What happens if admin rejects an invoice? Can driver resubmit? | Billing flow |
| How long before a no-show can a driver be permanently blocked (how many)? | Scoring policy |
| Can a driver work in multiple cities? | Assignment filter scope |
| Who creates the check-in code — system auto or admin sets it? | Check-in security |
| What is the maximum check-in radius per location type? | GPS accuracy |
| Is there a minimum score to participate after restriction? | Score recovery path |
| What does "disposition informed" mean in the backup system? | Standby/backup feature |
| Are there different pay rates per time slot (morning vs evening)? | Billing precision |
| Can admin re-activate a blocked driver? | Driver status lifecycle |

---

## 10. FINAL VERDICT

The FleetFlow DSM system has a **solid technical foundation**. The backend business logic is well-structured and covers most rules from the PDF correctly. The mobile app screens exist and are connected to real APIs.

However, **3 features make the system completely non-functional for real drivers:**
1. Fake document upload (no real files go anywhere)
2. No push notifications (drivers never get reminded)
3. No check-in code display (drivers cannot check in)

And **1 feature blocks all deployment creation:**
- No admin UI to create locations (all assignment creation silently fails without a valid location)

Everything else is either working or enhancement-level work. The system can be production-ready within **6-8 weeks** of focused development following the Phase 1→4 roadmap above.
