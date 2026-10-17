/*
  Warnings:

  - You are about to drop the column `hourlyRate` on the `TutorProfile` table. All the data in the column will be lost.
  - Added the required column `bio` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hourlyRate` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "bio" TEXT NOT NULL,
ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "hourlyRate" INTEGER NOT NULL,
ADD COLUMN     "level" TEXT NOT NULL,
ADD COLUMN     "mode" "Mode" NOT NULL DEFAULT 'DOMICILE';

-- AlterTable
ALTER TABLE "TutorProfile" DROP COLUMN "hourlyRate";
