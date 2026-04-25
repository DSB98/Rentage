-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NULL,
    `role` ENUM('OWNER', 'RENTER', 'ADMIN') NOT NULL,
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `emailVerificationToken` VARCHAR(500) NULL,
    `passwordResetToken` VARCHAR(500) NULL,
    `passwordResetExpiry` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,

    UNIQUE INDEX `user_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `oauth_accounts_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    INDEX `refresh_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `categories_parentId_idx`(`parentId`),
    INDEX `categories_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listings` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `rentPeriod` ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
    `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `address` TEXT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `listings_ownerId_idx`(`ownerId`),
    INDEX `listings_categoryId_idx`(`categoryId`),
    INDEX `listings_status_idx`(`status`),
    INDEX `listings_city_idx`(`city`),
    INDEX `listings_state_idx`(`state`),
    INDEX `listings_price_idx`(`price`),
    INDEX `listings_createdAt_idx`(`createdAt`),
    FULLTEXT INDEX `listings_title_description_idx`(`title`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listing_images` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `listing_images_listingId_idx`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listing_amenities` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,

    INDEX `listing_amenities_listingId_idx`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_listings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `saved_listings_userId_idx`(`userId`),
    UNIQUE INDEX `saved_listings_userId_listingId_key`(`userId`, `listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `renterId` VARCHAR(191) NOT NULL,
    `lastMessageAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `conversations_ownerId_idx`(`ownerId`),
    INDEX `conversations_renterId_idx`(`renterId`),
    INDEX `conversations_lastMessageAt_idx`(`lastMessageAt`),
    UNIQUE INDEX `conversations_listingId_renterId_key`(`listingId`, `renterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `messageType` ENUM('TEXT', 'IMAGE') NOT NULL DEFAULT 'TEXT',
    `imageUrl` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    INDEX `messages_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_reveals` (
    `id` VARCHAR(191) NOT NULL,
    `revealerId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contact_reveals_revealerId_createdAt_idx`(`revealerId`, `createdAt`),
    UNIQUE INDEX `contact_reveals_revealerId_listingId_key`(`revealerId`, `listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `interval` VARCHAR(191) NOT NULL DEFAULT 'monthly',
    `maxListings` INTEGER NOT NULL,
    `maxContactReveals` INTEGER NOT NULL,
    `features` JSON NULL,
    `razorpayPlanId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscription_plans_name_key`(`name`),
    UNIQUE INDEX `subscription_plans_slug_key`(`slug`),
    UNIQUE INDEX `subscription_plans_razorpayPlanId_key`(`razorpayPlanId`),
    INDEX `subscription_plans_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `razorpaySubId` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE') NOT NULL DEFAULT 'ACTIVE',
    `currentPeriodStart` DATETIME(3) NOT NULL,
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_subscriptions_userId_key`(`userId`),
    UNIQUE INDEX `user_subscriptions_razorpaySubId_key`(`razorpaySubId`),
    INDEX `user_subscriptions_userId_idx`(`userId`),
    INDEX `user_subscriptions_status_idx`(`status`),
    INDEX `user_subscriptions_currentPeriodEnd_idx`(`currentPeriodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `razorpayPaymentId` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` ENUM('PENDING', 'CAPTURED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `method` VARCHAR(191) NULL,
    `invoiceUrl` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_razorpayPaymentId_key`(`razorpayPaymentId`),
    INDEX `payments_userId_idx`(`userId`),
    INDEX `payments_status_idx`(`status`),
    INDEX `payments_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `data` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `notifications_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'PENDING',
    `adminNotes` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reports_listingId_idx`(`listingId`),
    INDEX `reports_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_logs` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_logs_adminId_idx`(`adminId`),
    INDEX `admin_logs_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `admin_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oauth_accounts` ADD CONSTRAINT `oauth_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listings` ADD CONSTRAINT `listings_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listings` ADD CONSTRAINT `listings_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_images` ADD CONSTRAINT `listing_images_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_amenities` ADD CONSTRAINT `listing_amenities_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_listings` ADD CONSTRAINT `saved_listings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_listings` ADD CONSTRAINT `saved_listings_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_renterId_fkey` FOREIGN KEY (`renterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_reveals` ADD CONSTRAINT `contact_reveals_revealerId_fkey` FOREIGN KEY (`revealerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_reveals` ADD CONSTRAINT `contact_reveals_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_reveals` ADD CONSTRAINT `contact_reveals_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_subscriptions` ADD CONSTRAINT `user_subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_subscriptions` ADD CONSTRAINT `user_subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_logs` ADD CONSTRAINT `admin_logs_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
