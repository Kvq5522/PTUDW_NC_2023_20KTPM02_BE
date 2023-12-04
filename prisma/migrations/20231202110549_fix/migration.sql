-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `is_activated` BOOLEAN NOT NULL DEFAULT false,
    `phone_number` VARCHAR(191) NULL,
    `address` VARCHAR(255) NULL,
    `age` INTEGER NULL,
    `gender` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL DEFAULT 'https://firebasestorage.googleapis.com/v0/b/ptudwnc2-20ktpm02-2023.appspot.com/o/images%2Favatar%2Fuser-default-avatar.png?alt=media&token=87041583-59b4-43a6-86eb-a93f06cd8b3e',

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recovery_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,

    UNIQUE INDEX `recovery_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classrooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `owner_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classroom_invitations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `student_invite_code` VARCHAR(191) NOT NULL,
    `teacher_invite_code` VARCHAR(191) NOT NULL,
    `student_invite_uri_code` VARCHAR(191) NOT NULL,
    `teacher_invite_uri_code` VARCHAR(191) NOT NULL,
    `classroom_id` INTEGER NOT NULL,

    UNIQUE INDEX `classroom_invitations_student_invite_code_key`(`student_invite_code`),
    UNIQUE INDEX `classroom_invitations_teacher_invite_code_key`(`teacher_invite_code`),
    UNIQUE INDEX `classroom_invitations_student_invite_uri_code_key`(`student_invite_uri_code`),
    UNIQUE INDEX `classroom_invitations_teacher_invite_uri_code_key`(`teacher_invite_uri_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classroom_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `member_role` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `classroom_id` INTEGER NOT NULL,

    UNIQUE INDEX `classroom_members_member_id_classroom_id_key`(`member_id`, `classroom_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classroom_announcements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `class_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcement_comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL DEFAULT '',
    `announcementId` INTEGER NOT NULL,

    UNIQUE INDEX `announcement_comments_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recovery_tokens` ADD CONSTRAINT `recovery_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classrooms` ADD CONSTRAINT `classrooms_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classroom_invitations` ADD CONSTRAINT `classroom_invitations_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classroom_members` ADD CONSTRAINT `classroom_members_member_role_fkey` FOREIGN KEY (`member_role`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classroom_members` ADD CONSTRAINT `classroom_members_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classroom_members` ADD CONSTRAINT `classroom_members_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classroom_announcements` ADD CONSTRAINT `classroom_announcements_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_comments` ADD CONSTRAINT `announcement_comments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_comments` ADD CONSTRAINT `announcement_comments_announcementId_fkey` FOREIGN KEY (`announcementId`) REFERENCES `classroom_announcements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
