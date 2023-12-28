/*
  Warnings:

  - You are about to drop the column `is_archive` on the `classrooms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `classrooms` DROP COLUMN `is_archive`,
    ADD COLUMN `is_archived` BOOLEAN NOT NULL DEFAULT false;
