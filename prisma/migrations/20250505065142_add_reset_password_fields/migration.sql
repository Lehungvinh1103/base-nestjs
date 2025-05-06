/*
  Warnings:

  - You are about to drop the column `resetToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `resetToken`,
    DROP COLUMN `resetTokenExpiry`,
    ADD COLUMN `reset_token` VARCHAR(191) NULL,
    ADD COLUMN `reset_token_expiry` DATETIME(3) NULL;
