/*
  Warnings:

  - You are about to drop the column `announcementId` on the `announcement_comments` table. All the data in the column will be lost.
  - Added the required column `announcement_id` to the `announcement_comments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `announcement_comments` DROP FOREIGN KEY `announcement_comments_announcementId_fkey`;

-- AlterTable
ALTER TABLE `announcement_comments` DROP COLUMN `announcementId`,
    ADD COLUMN `announcement_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `announcement_comments` ADD CONSTRAINT `announcement_comments_announcement_id_fkey` FOREIGN KEY (`announcement_id`) REFERENCES `classroom_announcements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
