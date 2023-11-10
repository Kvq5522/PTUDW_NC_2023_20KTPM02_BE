/*
  Warnings:

  - You are about to drop the column `role_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_role_id_fkey`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `role_id`;
