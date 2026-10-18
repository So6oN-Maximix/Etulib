-- CreateTable
CREATE TABLE "Experience" (
    "id" SERIAL NOT NULL,
    "tutorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Experience_tutorId_idx" ON "Experience"("tutorId");

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
