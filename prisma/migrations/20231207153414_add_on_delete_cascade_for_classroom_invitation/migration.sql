-- DropForeignKey
ALTER TABLE `classroom_invitations` DROP FOREIGN KEY `classroom_invitations_classroom_id_fkey`;

-- DropForeignKey
ALTER TABLE `classrooms` DROP FOREIGN KEY `classrooms_owner_id_fkey`;

-- DropForeignKey
ALTER TABLE `recovery_tokens` DROP FOREIGN KEY `recovery_tokens_user_id_fkey`;

-- AddForeignKey
ALTER TABLE `recovery_tokens` ADD CONSTRAINT `recovery_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classrooms` ADD CONSTRAINT `classrooms_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classroom_invitations` ADD CONSTRAINT `classroom_invitations_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
