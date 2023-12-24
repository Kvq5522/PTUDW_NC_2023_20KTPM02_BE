/*
  Warnings:

  - You are about to drop the column `clasroom_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `type` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_clasroom_id_fkey`;

-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_user_id_fkey`;

-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `clasroom_id`,
    DROP COLUMN `user_id`,
    ADD COLUMN `classroomId` INTEGER NULL,
    ADD COLUMN `classroom_id` INTEGER NULL,
    ADD COLUMN `classroom_name` VARCHAR(191) NULL,
    ADD COLUMN `type` ENUM('GRADE_ANNOUNCEMENT', 'GRADE_REVIEW', 'CLASSROOM_ANNOUNCEMENT', 'OTHERS') NOT NULL;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `classrooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
