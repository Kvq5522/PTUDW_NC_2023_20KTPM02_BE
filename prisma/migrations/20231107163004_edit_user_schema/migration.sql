/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `password` VARCHAR(255) NOT NULL,
    MODIFY `first_name` VARCHAR(255) NOT NULL,
    MODIFY `last_name` VARCHAR(255) NOT NULL,
    MODIFY `phone_number` VARCHAR(191) NULL,
    MODIFY `address` VARCHAR(255) NULL,
    MODIFY `age` INTEGER NULL,
    MODIFY `gender` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_email_key` ON `users`(`email`);
