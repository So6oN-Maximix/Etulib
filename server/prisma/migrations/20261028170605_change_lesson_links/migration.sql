/*
  Warnings:

  - You are about to drop the column `mode` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `Lesson` table. All the data in the column will be lost.
  - Added the required column `courseId` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "mode",
DROP COLUMN "startsAt",
ADD COLUMN     "courseId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
