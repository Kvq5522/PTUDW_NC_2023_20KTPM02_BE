/*
  Warnings:

  - You are about to drop the column `classroom_name` on the `notifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `classroom_name`;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
