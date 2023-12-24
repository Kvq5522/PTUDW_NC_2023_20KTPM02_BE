/*
  Warnings:

  - A unique constraint covering the columns `[student_id,classroom_id,grade_category]` on the table `student_grade_details` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `classrooms` ADD COLUMN `is_archive` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `is_banned` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `student_grade_details_student_id_classroom_id_grade_category_key` ON `student_grade_details`(`student_id`, `classroom_id`, `grade_category`);
