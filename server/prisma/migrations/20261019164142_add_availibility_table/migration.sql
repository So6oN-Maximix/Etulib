-- CreateTable
CREATE TABLE "Availibility" (
    "id" SERIAL NOT NULL,
    "tutorId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,

    CONSTRAINT "Availibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Availibility_tutorId_idx" ON "Availibility"("tutorId");

-- AddForeignKey
ALTER TABLE "Availibility" ADD CONSTRAINT "Availibility_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
