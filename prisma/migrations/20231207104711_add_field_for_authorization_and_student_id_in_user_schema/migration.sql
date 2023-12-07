/*
  Warnings:

  - A unique constraint covering the columns `[student_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `authorization` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `student_id` VARCHAR(191) NULL,
    MODIFY `avatar` VARCHAR(191) NULL DEFAULT 'https://firebasestorage.googleapis.com/v0/b/ptudwnc2-20ktpm02-2023.appspot.com/o/images%2Favatar%2Fuser-default-avatar.png?alt=media&token=175255db-bb03-476a-841d-0e438ccd0125';

-- CreateIndex
CREATE UNIQUE INDEX `users_student_id_key` ON `users`(`student_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_authorization_fkey` FOREIGN KEY (`authorization`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
