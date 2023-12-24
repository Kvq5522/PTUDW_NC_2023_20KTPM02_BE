-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_announcement_id_fkey` FOREIGN KEY (`announcement_id`) REFERENCES `classroom_announcements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
