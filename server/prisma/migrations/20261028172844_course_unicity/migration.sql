/*
  Warnings:

  - A unique constraint covering the columns `[tutorId,startDate]` on the table `Lesson` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Lesson_tutorId_startDate_key" ON "Lesson"("tutorId", "startDate");
