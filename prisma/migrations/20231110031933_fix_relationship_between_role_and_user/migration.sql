-- AlterTable
ALTER TABLE `users` ADD COLUMN `role_id` INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
