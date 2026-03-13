# Driver Deployment Platform Monorepo

## Overview

This repository contains a full-stack driver deployment platform inspired by professional ride-sharing systems (Uber, Bolt, Careem). It provides:

- **Backend API server** (Node.js, Express.js, MongoDB, JWT)
- **Driver mobile application** (React Native, Expo)
- **Admin web dashboard** (React)

Both frontend applications connect to the **same backend API and database**. The architecture emphasizes scalability, maintainability, and clean separation of concerns.

## Monorepo Structure

- `backend` – Node.js/Express API server using MongoDB (Mongoose) and JWT authentication.
- `driver-mobile-app` – React Native + Expo mobile app for drivers (onboarding, deployments, check-ins, billing).
- `admin-web-dashboard` – React-based admin dashboard web app for approvals, deployment management, analytics, and billing.

The root `package.json` defines npm workspaces so each part can be developed independently while sharing a single repository.

## Tech Stack

- **Backend**
  - Node.js
  - Express.js
  - MongoDB with Mongoose
  - JWT-based authentication
  - RESTful API design
- **Driver Mobile App**
  - React Native
  - Expo
  - Modern mobile UX patterns
- **Admin Dashboard**
  - React
  - Modern SaaS dashboard UI patterns

## Backend Architecture

Backend source lives under `backend/src` and follows a clean architecture-style layout:

- `config/` – Environment configuration, MongoDB connection, logger setup.
- `models/` – Mongoose models (users, drivers, documents, assignments, billing, etc.).
- `controllers/` – HTTP controllers that orchestrate requests and responses.
- `routes/` – Route definitions mapping URLs to controllers.
- `services/` – Business logic (auth, driver onboarding, assignments, scoring, billing).
- `middleware/` – Cross-cutting middleware (auth, roles, validation, logging, errors).
- `utils/` – Shared helpers (JWT, crypto, time, geo, constants, response helpers).

Core responsibilities:

- Authentication and authorization (drivers, admins).
- Driver onboarding and document management.
- Assignment and deployment scheduling with overbooking.
- Confirmation and check-in flows.
- Driver scoring and ranking.
- Billing, mission summaries, and invoice approval.
- Analytics for bookings, risk, and performance.

## Driver Mobile App Overview

The driver app (in `driver-mobile-app`) is built with React Native and Expo and implements a guided workflow:

- **Welcome / Auth**
  - Welcome screen
  - Register and login screens
- **Onboarding**
  - Profile setup (photo, contact details, bank details)
  - Document upload (license, ID, bank, profile photo)
  - Pending approval screen with clear status messaging
- **Operational Flows**
  - Driver dashboard
  - Available deployments and booking confirmation
  - Assignment confirmations (24h, 12h, 6h checkpoints)
  - GPS + code-based check-in
  - Driver score page with ranking tier
  - Trip history and earnings
  - Profile settings

The UI follows modern ride-hailing patterns: bottom tab navigation, large cards for deployments, clear call-to-action buttons, and status indicators.

## Admin Web Dashboard Overview

The admin dashboard (in `admin-web-dashboard`) is a React SPA with:

- Admin login and session management.
- Driver approval panel (review profiles/documents, approve/reject/request more docs).
- Driver list with status, score, and filters.
- Deployment management (create/update assignments, view fill/confirmation state).
- Booking and risk analytics (no-shows, cancellations, overbooking performance).
- Driver ranking dashboard.
- Billing management and invoice approvals.
- System analytics (global KPIs).

The UI uses modern SaaS dashboard conventions: sidebar navigation, top bar, stat cards, tables, and responsive layouts.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm or yarn
- MongoDB instance (local or remote)
- Expo CLI (for driver-mobile-app)

### Environment Configuration

In `backend`, create a `.env` file (or configure environment variables) with values such as:

```bash
PORT=4000
MONGO_URI=mongodb://localhost:27017/driver_deployment
JWT_SECRET=super-secret-key
JWT_EXPIRES_IN=7d
```

### Install Dependencies

From the monorepo root:

```bash
npm install
```

This will install dependencies for the root and each workspace (`backend`, `driver-mobile-app`, `admin-web-dashboard`).

### Running the Backend

```bash
cd backend
npm install
npm run dev
```

The backend will start an Express server and connect to MongoDB using the configured `MONGO_URI`.

### Running the Driver Mobile App

```bash
cd driver-mobile-app
npm install
npm run start
```

This will start the Expo development server. Use the Expo Go app or an emulator to open the project.

### Running the Admin Web Dashboard

```bash
cd admin-web-dashboard
npm install
npm run dev
```

This starts the admin dashboard in development mode (typically on `http://localhost:5173` or similar, depending on tooling).

## API Overview

High-level API groups exposed by the backend:

- **Auth**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
- **Drivers**
  - `GET /api/drivers/me`
  - `PUT /api/drivers/me/profile`
  - `POST /api/drivers/me/documents`
  - `GET /api/drivers/me/documents`
  - `POST /api/drivers/me/submit-application`
  - `GET /api/drivers/me/application-status`
  - `GET /api/drivers/me/score`
- **Admin / Drivers**
  - `GET /api/admin/drivers/pending`
  - `GET /api/admin/drivers/:id`
  - `POST /api/admin/drivers/:id/approve`
  - `POST /api/admin/drivers/:id/reject`
  - `POST /api/admin/drivers/:id/request-more-documents`
- **Assignments**
  - `GET /api/assignments/available`
  - `POST /api/assignments/:id/reserve`
  - `GET /api/assignments/my`
  - `POST /api/assignments/:id/confirm`
  - `POST /api/assignments/:id/check-in`
- **Billing & Invoices**
  - `GET /api/billing/periods`
  - `GET /api/billing/periods/:id`
  - `POST /api/billing/periods/:id/invoice`
  - `GET /api/admin/invoices`
  - `POST /api/admin/invoices/:id/approve`
  - `POST /api/admin/invoices/:id/reject`
- **Analytics**
  - `GET /api/admin/analytics/overview`
  - `GET /api/admin/analytics/no-shows`
  - `GET /api/admin/analytics/cancellations`
  - `GET /api/admin/analytics/locations`
  - `GET /api/admin/analytics/billing`

Refer to the backend source for full request/response details.

## Scoring & Ranking

- Drivers start with **100 points**.
- Score adjustments:
  - Completed missions → small bonus.
  - Late cancellations → deduction.
  - No-shows → major deduction.
- Ranking levels:
  - 90–100 → priority slots.
  - 70–89 → normal access.
  - Below 70 → limited access.
  - Below 60 → restricted.

These levels influence access to assignments and reserve status in overbooking scenarios.

## Billing Flow

End-of-month billing is driven by:

1. System generates mission summary per driver (billing period).
2. Driver uploads invoice for the period.
3. Admin verifies invoice against the summary.
4. Admin approves payment (status updated in the system).

The driver app exposes earnings and history screens; the admin dashboard exposes billing management and invoice approvals.

## Development Roadmap (High Level)

- Foundations: monorepo, backend core, auth, and configuration.
- Driver onboarding: profile and documents, admin approval.
- Assignments & operations: deployments, confirmations, check-ins, scoring.
- Billing & analytics: mission summaries, invoices, dashboards.
- Polishing: validation, security, notifications, tests, and CI/CD.

This README is a living document and should evolve alongside the implementation.

