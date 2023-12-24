/*
  Warnings:

  - The values [GRADE_ANOUNCEMENT] on the enum `classroom_announcements_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `classroom_announcements` MODIFY `type` ENUM('GRADE_ANNOUNCEMENT', 'GRADE_REVIEW', 'CLASSROOM_ANNOUNCEMENT', 'OTHERS') NOT NULL;
