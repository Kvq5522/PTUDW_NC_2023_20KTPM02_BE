/*
  Warnings:

  - You are about to drop the column `resource` on the `classroom_announcements` table. All the data in the column will be lost.
  - Added the required column `created_by` to the `classroom_announcements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to_members` to the `classroom_announcements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `classroom_announcements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `classroom_announcements` DROP COLUMN `resource`,
    ADD COLUMN `created_by` INTEGER NOT NULL,
    ADD COLUMN `expected_grade` DOUBLE NULL,
    ADD COLUMN `grade_category` INTEGER NULL,
    ADD COLUMN `to_members` VARCHAR(191) NOT NULL,
    ADD COLUMN `type` ENUM('GRADE_ANOUNCEMENT', 'GRADE_REVIEW', 'CLASSROOM_ANNOUNCEMENT', 'OTHERS') NOT NULL;

-- AddForeignKey
ALTER TABLE `classroom_announcements` ADD CONSTRAINT `classroom_announcements_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classroom_announcements` ADD CONSTRAINT `classroom_announcements_grade_category_fkey` FOREIGN KEY (`grade_category`) REFERENCES `grade_compositions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
