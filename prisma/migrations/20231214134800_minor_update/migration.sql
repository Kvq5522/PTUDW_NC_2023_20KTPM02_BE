/*
  Warnings:

  - You are about to drop the `StudentGradeDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `StudentGradeDetail` DROP FOREIGN KEY `StudentGradeDetail_grade_category_fkey`;

-- DropForeignKey
ALTER TABLE `StudentGradeDetail` DROP FOREIGN KEY `StudentGradeDetail_student_id_classroom_id_fkey`;

-- DropForeignKey
ALTER TABLE `student_grade_lists` DROP FOREIGN KEY `student_grade_lists_student_id_fkey`;

-- DropTable
DROP TABLE `StudentGradeDetail`;

-- CreateTable
CREATE TABLE `student_grade_details` (
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
ALTER TABLE `student_grade_lists` ADD CONSTRAINT `student_grade_lists_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `reserved_student_ids`(`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_grade_details` ADD CONSTRAINT `student_grade_details_grade_category_fkey` FOREIGN KEY (`grade_category`) REFERENCES `grade_compositions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_grade_details` ADD CONSTRAINT `student_grade_details_student_id_classroom_id_fkey` FOREIGN KEY (`student_id`, `classroom_id`) REFERENCES `student_grade_lists`(`student_id`, `classroom_id`) ON DELETE CASCADE ON UPDATE CASCADE;
