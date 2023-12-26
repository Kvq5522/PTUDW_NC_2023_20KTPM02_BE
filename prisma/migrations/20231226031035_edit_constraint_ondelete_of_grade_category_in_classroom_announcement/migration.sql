-- DropForeignKey
ALTER TABLE `classroom_announcements` DROP FOREIGN KEY `classroom_announcements_grade_category_fkey`;

-- AddForeignKey
ALTER TABLE `classroom_announcements` ADD CONSTRAINT `classroom_announcements_grade_category_fkey` FOREIGN KEY (`grade_category`) REFERENCES `grade_compositions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
