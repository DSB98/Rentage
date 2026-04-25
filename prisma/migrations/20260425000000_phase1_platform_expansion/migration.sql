-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_senderId_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `bannedReason` TEXT NULL,
    ADD COLUMN `isBanned` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPhoneVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    MODIFY `role` ENUM('OWNER', 'RENTER', 'AGENT', 'AGENCY_ADMIN', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN') NOT NULL;

-- AlterTable
ALTER TABLE `user_profiles` ADD COLUMN `country` VARCHAR(191) NULL DEFAULT 'IN',
    ADD COLUMN `dob` DATETIME(3) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `phoneCountry` VARCHAR(191) NULL DEFAULT '+91',
    ADD COLUMN `pincode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `refresh_tokens` ADD COLUMN `ip` VARCHAR(191) NULL,
    ADD COLUMN `userAgent` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `listings` ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `bookingCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `country` VARCHAR(191) NOT NULL DEFAULT 'IN',
    ADD COLUMN `depositAmount` DECIMAL(10, 2) NULL,
    ADD COLUMN `inquiryCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isAgencyListed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `maxDuration` INTEGER NULL,
    ADD COLUMN `minDuration` INTEGER NULL,
    ADD COLUMN `orgId` VARCHAR(191) NULL,
    ADD COLUMN `pincode` VARCHAR(191) NULL,
    ADD COLUMN `publishedAt` DATETIME(3) NULL,
    ADD COLUMN `ratingAvg` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `ratingCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `requiresKyc` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `slug` VARCHAR(191) NULL,
    ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0,
    MODIFY `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'PAUSED', 'BOOKED', 'INACTIVE', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `conversations` ADD COLUMN `bookingId` VARCHAR(191) NULL,
    ADD COLUMN `inquiryId` VARCHAR(191) NULL,
    ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `messages` ADD COLUMN `fileName` VARCHAR(191) NULL,
    ADD COLUMN `fileUrl` VARCHAR(191) NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `metadata` JSON NULL,
    MODIFY `senderId` VARCHAR(191) NULL,
    MODIFY `messageType` ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM') NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE `subscription_plans` ADD COLUMN `audience` ENUM('OWNER', 'RENTER', 'AGENCY') NOT NULL DEFAULT 'OWNER',
    ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `maxBookingsPerMonth` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `maxInquiriesPerMonth` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `maxOrgMembers` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `trialDays` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `user_subscriptions` ADD COLUMN `cancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `trialEndsAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('TRIALING', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `amountRefunded` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `bookingId` VARCHAR(191) NULL,
    ADD COLUMN `couponId` VARCHAR(191) NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `failureReason` TEXT NULL,
    ADD COLUMN `invoiceId` VARCHAR(191) NULL,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `razorpayOrderId` VARCHAR(191) NULL,
    ADD COLUMN `razorpaySignature` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `channel` ENUM('EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP') NOT NULL DEFAULT 'IN_APP',
    ADD COLUMN `failedAt` DATETIME(3) NULL,
    ADD COLUMN `imageUrl` VARCHAR(191) NULL,
    ADD COLUMN `readAt` DATETIME(3) NULL,
    ADD COLUMN `sentAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `login_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(500) NULL,
    `success` BOOLEAN NOT NULL DEFAULT false,
    `failReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `login_attempts_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `login_attempts_email_createdAt_idx`(`email`, `createdAt`),
    INDEX `login_attempts_ip_createdAt_idx`(`ip`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fcm_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `platform` ENUM('IOS', 'ANDROID', 'WEB') NOT NULL,
    `deviceId` VARCHAR(191) NULL,
    `appVersion` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `fcm_tokens_token_key`(`token`),
    INDEX `fcm_tokens_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `channel` ENUM('EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP') NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notification_preferences_userId_channel_category_key`(`userId`, `channel`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `terms_versions` (
    `id` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,
    `body` LONGTEXT NULL,
    `effectiveAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `terms_versions_kind_isActive_idx`(`kind`, `isActive`),
    UNIQUE INDEX `terms_versions_kind_version_key`(`kind`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consent_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `termsVersionId` VARCHAR(191) NOT NULL,
    `acceptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(500) NULL,

    INDEX `consent_logs_userId_idx`(`userId`),
    UNIQUE INDEX `consent_logs_userId_termsVersionId_key`(`userId`, `termsVersionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('HOME', 'WORK', 'BILLING', 'PICKUP', 'OTHER') NOT NULL DEFAULT 'HOME',
    `label` VARCHAR(191) NULL,
    `line1` VARCHAR(191) NOT NULL,
    `line2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'IN',
    `pincode` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `addresses_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `type` ENUM('AGENCY', 'BUSINESS', 'INDIVIDUAL') NOT NULL DEFAULT 'AGENCY',
    `logoUrl` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `website` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `gstNumber` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizations_slug_key`(`slug`),
    INDEX `organizations_type_idx`(`type`),
    INDEX `organizations_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `org_members` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'AGENT', 'STAFF') NOT NULL DEFAULT 'STAFF',
    `status` ENUM('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED') NOT NULL DEFAULT 'INVITED',
    `invitedById` VARCHAR(191) NULL,
    `invitedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `joinedAt` DATETIME(3) NULL,
    `removedAt` DATETIME(3) NULL,

    INDEX `org_members_userId_idx`(`userId`),
    UNIQUE INDEX `org_members_orgId_userId_key`(`orgId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listing_availability` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isBlocked` BOOLEAN NOT NULL DEFAULT false,
    `reason` VARCHAR(191) NULL,
    `bookingId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `listing_availability_listingId_startDate_endDate_idx`(`listingId`, `startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listing_views` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `listing_views_listingId_createdAt_idx`(`listingId`, `createdAt`),
    INDEX `listing_views_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_searches` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `query` JSON NOT NULL,
    `alertsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `lastRunAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `saved_searches_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inquiries` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `renterId` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NULL,
    `assigneeId` VARCHAR(191) NULL,
    `status` ENUM('NEW', 'CONTACTED', 'NEGOTIATING', 'VISIT_SCHEDULED', 'CONVERTED', 'LOST', 'CLOSED') NOT NULL DEFAULT 'NEW',
    `source` VARCHAR(191) NULL,
    `message` TEXT NULL,
    `budgetMin` DECIMAL(10, 2) NULL,
    `budgetMax` DECIMAL(10, 2) NULL,
    `preferredAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `closedReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `inquiries_listingId_idx`(`listingId`),
    INDEX `inquiries_ownerId_status_idx`(`ownerId`, `status`),
    INDEX `inquiries_renterId_idx`(`renterId`),
    INDEX `inquiries_assigneeId_status_idx`(`assigneeId`, `status`),
    INDEX `inquiries_orgId_status_idx`(`orgId`, `status`),
    INDEX `inquiries_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inquiry_activities` (
    `id` VARCHAR(191) NOT NULL,
    `inquiryId` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `type` ENUM('CREATED', 'STATUS_CHANGED', 'NOTE_ADDED', 'ASSIGNED', 'MESSAGE_SENT', 'CALL_LOGGED', 'VISIT_SCHEDULED', 'BOOKING_CREATED', 'CLOSED') NOT NULL,
    `data` JSON NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inquiry_activities_inquiryId_createdAt_idx`(`inquiryId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `inquiryId` VARCHAR(191) NULL,
    `renterId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `rentPeriod` ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `depositAmount` DECIMAL(10, 2) NULL,
    `platformFee` DECIMAL(10, 2) NULL,
    `taxAmount` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `notes` TEXT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelledReason` TEXT NULL,
    `cancelledById` VARCHAR(191) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bookings_code_key`(`code`),
    INDEX `bookings_listingId_startDate_idx`(`listingId`, `startDate`),
    INDEX `bookings_renterId_status_idx`(`renterId`, `status`),
    INDEX `bookings_ownerId_status_idx`(`ownerId`, `status`),
    INDEX `bookings_orgId_status_idx`(`orgId`, `status`),
    INDEX `bookings_status_startDate_idx`(`status`, `startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kyc_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `legalName` VARCHAR(191) NULL,
    `reviewerId` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `rejectReason` TEXT NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `kyc_submissions_userId_idx`(`userId`),
    INDEX `kyc_submissions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kyc_documents` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `type` ENUM('AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'GST', 'COMPANY_REG', 'ADDRESS_PROOF', 'OTHER') NOT NULL,
    `number` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `filePublicId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `kyc_documents_submissionId_idx`(`submissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NULL,
    `bookingId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(191) NULL,
    `body` TEXT NULL,
    `status` ENUM('PUBLISHED', 'HIDDEN', 'PENDING', 'FLAGGED') NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `reviews_listingId_status_idx`(`listingId`, `status`),
    INDEX `reviews_subjectId_status_idx`(`subjectId`, `status`),
    INDEX `reviews_bookingId_idx`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_reports` (
    `id` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `review_reports_reviewId_idx`(`reviewId`),
    INDEX `review_reports_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `org_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `razorpaySubId` VARCHAR(191) NULL,
    `status` ENUM('TRIALING', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE') NOT NULL DEFAULT 'ACTIVE',
    `trialEndsAt` DATETIME(3) NULL,
    `currentPeriodStart` DATETIME(3) NOT NULL,
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `cancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `org_subscriptions_orgId_key`(`orgId`),
    UNIQUE INDEX `org_subscriptions_razorpaySubId_key`(`razorpaySubId`),
    INDEX `org_subscriptions_status_idx`(`status`),
    INDEX `org_subscriptions_currentPeriodEnd_idx`(`currentPeriodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` ENUM('PERCENT', 'FLAT') NOT NULL DEFAULT 'PERCENT',
    `value` DECIMAL(10, 2) NOT NULL,
    `maxDiscount` DECIMAL(10, 2) NULL,
    `minAmount` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `usageLimit` INTEGER NULL,
    `usagePerUser` INTEGER NOT NULL DEFAULT 1,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `appliesTo` VARCHAR(191) NOT NULL DEFAULT 'any',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `coupons_code_key`(`code`),
    INDEX `coupons_isActive_expiresAt_idx`(`isActive`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `taxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` VARCHAR(191) NOT NULL DEFAULT 'issued',
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueAt` DATETIME(3) NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_number_key`(`number`),
    INDEX `invoices_userId_idx`(`userId`),
    INDEX `invoices_bookingId_idx`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payouts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` ENUM('PENDING', 'PROCESSING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `razorpayPayoutId` VARCHAR(191) NULL,
    `bankAccountId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `scheduledAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `failureReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payouts_razorpayPayoutId_key`(`razorpayPayoutId`),
    INDEX `payouts_userId_status_idx`(`userId`, `status`),
    INDEX `payouts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refund_requests` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `requesterId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSED') NOT NULL DEFAULT 'REQUESTED',
    `reviewerNote` TEXT NULL,
    `processedAt` DATETIME(3) NULL,
    `razorpayRefundId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `refund_requests_razorpayRefundId_key`(`razorpayRefundId`),
    INDEX `refund_requests_bookingId_idx`(`bookingId`),
    INDEX `refund_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `data` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_logs_type_createdAt_idx`(`type`, `createdAt`),
    INDEX `event_logs_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `event_logs_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `users_role_idx` ON `users`(`role`);

-- CreateIndex
CREATE INDEX `users_isActive_idx` ON `users`(`isActive`);

-- CreateIndex
CREATE INDEX `user_profiles_phone_idx` ON `user_profiles`(`phone`);

-- CreateIndex
CREATE UNIQUE INDEX `listings_slug_key` ON `listings`(`slug`);

-- CreateIndex
CREATE INDEX `listings_orgId_idx` ON `listings`(`orgId`);

-- CreateIndex
CREATE INDEX `listings_publishedAt_idx` ON `listings`(`publishedAt`);

-- CreateIndex
CREATE UNIQUE INDEX `conversations_inquiryId_key` ON `conversations`(`inquiryId`);

-- CreateIndex
CREATE INDEX `subscription_plans_audience_isActive_idx` ON `subscription_plans`(`audience`, `isActive`);

-- CreateIndex
CREATE UNIQUE INDEX `payments_razorpayOrderId_key` ON `payments`(`razorpayOrderId`);

-- CreateIndex
CREATE INDEX `payments_bookingId_idx` ON `payments`(`bookingId`);

-- CreateIndex
CREATE INDEX `notifications_type_idx` ON `notifications`(`type`);

-- AddForeignKey
ALTER TABLE `login_attempts` ADD CONSTRAINT `login_attempts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fcm_tokens` ADD CONSTRAINT `fcm_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consent_logs` ADD CONSTRAINT `consent_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consent_logs` ADD CONSTRAINT `consent_logs_termsVersionId_fkey` FOREIGN KEY (`termsVersionId`) REFERENCES `terms_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `org_members` ADD CONSTRAINT `org_members_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `org_members` ADD CONSTRAINT `org_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `org_members` ADD CONSTRAINT `org_members_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listings` ADD CONSTRAINT `listings_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_availability` ADD CONSTRAINT `listing_availability_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_availability` ADD CONSTRAINT `listing_availability_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_views` ADD CONSTRAINT `listing_views_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_views` ADD CONSTRAINT `listing_views_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_searches` ADD CONSTRAINT `saved_searches_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_renterId_fkey` FOREIGN KEY (`renterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiry_activities` ADD CONSTRAINT `inquiry_activities_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `inquiries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiry_activities` ADD CONSTRAINT `inquiry_activities_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `inquiries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_renterId_fkey` FOREIGN KEY (`renterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `inquiries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kyc_submissions` ADD CONSTRAINT `kyc_submissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kyc_submissions` ADD CONSTRAINT `kyc_submissions_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kyc_documents` ADD CONSTRAINT `kyc_documents_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `kyc_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_reports` ADD CONSTRAINT `review_reports_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_reports` ADD CONSTRAINT `review_reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `org_subscriptions` ADD CONSTRAINT `org_subscriptions_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `org_subscriptions` ADD CONSTRAINT `org_subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refund_requests` ADD CONSTRAINT `refund_requests_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refund_requests` ADD CONSTRAINT `refund_requests_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_logs` ADD CONSTRAINT `event_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

