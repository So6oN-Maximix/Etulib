/*
  Warnings:

  - The `city` column on the `TutorProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "TutorProfile" DROP COLUMN "city",
ADD COLUMN     "city" INTEGER;
