/*
  Warnings:

  - You are about to drop the column `classroomId` on the `notifications` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_classroomId_fkey`;

-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `classroomId`,
    ADD COLUMN `announcement_id` INTEGER NULL;
