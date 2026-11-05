/*
  Warnings:

  - Made the column `isRead` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "isRead" SET NOT NULL;
