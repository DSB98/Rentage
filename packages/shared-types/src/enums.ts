// ─────────────────────────────────────────────
// ENUMS  (mirror prisma/schema.prisma)
// ─────────────────────────────────────────────

export enum UserRole {
  OWNER = 'OWNER',
  RENTER = 'RENTER',
  AGENT = 'AGENT',
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  BOOKED = 'BOOKED',
  INACTIVE = 'INACTIVE',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum RentPeriod {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PAST_DUE = 'PAST_DUE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum OrgType {
  AGENCY = 'AGENCY',
  BUSINESS = 'BUSINESS',
  INDIVIDUAL = 'INDIVIDUAL',
}

export enum OrgMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  STAFF = 'STAFF',
}

export enum OrgMemberStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REMOVED = 'REMOVED',
}

export enum InquiryStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  NEGOTIATING = 'NEGOTIATING',
  VISIT_SCHEDULED = 'VISIT_SCHEDULED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
  CLOSED = 'CLOSED',
}

export enum InquiryActivityType {
  CREATED = 'CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  NOTE_ADDED = 'NOTE_ADDED',
  ASSIGNED = 'ASSIGNED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  CALL_LOGGED = 'CALL_LOGGED',
  VISIT_SCHEDULED = 'VISIT_SCHEDULED',
  BOOKING_CREATED = 'BOOKING_CREATED',
  CLOSED = 'CLOSED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

export enum KycStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum KycDocType {
  AADHAAR = 'AADHAAR',
  PAN = 'PAN',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  VOTER_ID = 'VOTER_ID',
  GST = 'GST',
  COMPANY_REG = 'COMPANY_REG',
  ADDRESS_PROOF = 'ADDRESS_PROOF',
  OTHER = 'OTHER',
}

export enum ReviewStatus {
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  PENDING = 'PENDING',
  FLAGGED = 'FLAGGED',
}

export enum PlanAudience {
  OWNER = 'OWNER',
  RENTER = 'RENTER',
  AGENCY = 'AGENCY',
}

export enum ChannelType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
}

export enum CouponType {
  PERCENT = 'PERCENT',
  FLAT = 'FLAT',
}

export enum AddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  BILLING = 'BILLING',
  PICKUP = 'PICKUP',
  OTHER = 'OTHER',
}

export enum DevicePlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}

