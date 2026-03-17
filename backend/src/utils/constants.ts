export const TIME_SLOTS = ['morning', 'midday', 'evening'] as const;
export type TimeSlot = typeof TIME_SLOTS[number];

export const DRIVER_STATUSES = ['under_review', 'active', 'restricted', 'blocked'] as const;
export type DriverStatus = typeof DRIVER_STATUSES[number];

export const BOOKING_STATUSES = ['reserved', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show', 'withdrawn'] as const;
export type BookingStatus = typeof BOOKING_STATUSES[number];

export const DOCUMENT_TYPES = ['driver_license', 'id_document', 'profile_photo', 'bank_details', 'business_registration'] as const;
export type DocumentType = typeof DOCUMENT_TYPES[number];

export const ROLES = ['driver', 'admin'] as const;
export type Role = typeof ROLES[number];

export const INVOICE_STATUSES = ['pending', 'submitted', 'approved', 'rejected', 'paid'] as const;
export type InvoiceStatus = typeof INVOICE_STATUSES[number];

// Scoring
export const SCORE_START = 100;
export const SCORE_NO_SHOW = -20;
export const SCORE_LATE_CANCEL = -10;
export const SCORE_COMPLETED = 2;
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

// Score tiers
export const TIER_PRIORITY_MIN = 90;
export const TIER_NORMAL_MIN = 70;
export const TIER_LIMITED_MIN = 60;

// Booking limits
export const MAX_MISSIONS_PER_DAY = 2;

// Confirmation windows (hours before assignment start)
export const CONFIRMATION_WINDOWS = [24, 12, 6] as const;
export const AUTO_WITHDRAW_HOURS = 6;

// Overbooking defaults
export const DEFAULT_OVERBOOKING_PERCENT = 5; // 5% over capacity

// Check-in radius in meters
export const DEFAULT_CHECKIN_RADIUS_METERS = 500;
