/*
  Warnings:

  - Added the required column `birthDate` to the `StudentProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "birthDate" TIMESTAMP(3) NOT NULL;
