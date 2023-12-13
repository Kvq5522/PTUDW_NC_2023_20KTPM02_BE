/*
  Warnings:

  - You are about to drop the column `userId` on the `announcement_comments` table. All the data in the column will be lost.
  - You are about to drop the column `class_id` on the `classroom_announcements` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `announcement_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `announcement_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classroom_id` to the `classroom_announcements` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `announcement_comments` DROP FOREIGN KEY `announcement_comments_userId_fkey`;

-- DropForeignKey
ALTER TABLE `classroom_announcements` DROP FOREIGN KEY `classroom_announcements_class_id_fkey`;

-- AlterTable
ALTER TABLE `announcement_comments` DROP COLUMN `userId`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `user_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `classroom_announcements` DROP COLUMN `class_id`,
    ADD COLUMN `classroom_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `reserved_student_ids` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `reserved_student_ids_student_id_key`(`student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grade_compositions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `classroom_id` INTEGER NOT NULL,
    `grade_percent` DOUBLE NOT NULL,
    `is_finalized` BOOLEAN NOT NULL DEFAULT false,
    `index` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_grade_lists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `classroom_id` INTEGER NOT NULL,

    UNIQUE INDEX `student_grade_lists_student_id_classroom_id_key`(`student_id`, `classroom_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentGradeDetail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `grade_category` INTEGER NOT NULL,
    `grade` DOUBLE NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `classroom_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `reserved_student_ids`(`student_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classroom_announcements` ADD CONSTRAINT `classroom_announcements_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_comments` ADD CONSTRAINT `announcement_comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grade_compositions` ADD CONSTRAINT `grade_compositions_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_grade_lists` ADD CONSTRAINT `student_grade_lists_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `reserved_student_ids`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_grade_lists` ADD CONSTRAINT `student_grade_lists_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentGradeDetail` ADD CONSTRAINT `StudentGradeDetail_grade_category_fkey` FOREIGN KEY (`grade_category`) REFERENCES `grade_compositions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentGradeDetail` ADD CONSTRAINT `StudentGradeDetail_student_id_classroom_id_fkey` FOREIGN KEY (`student_id`, `classroom_id`) REFERENCES `student_grade_lists`(`student_id`, `classroom_id`) ON DELETE CASCADE ON UPDATE CASCADE;
