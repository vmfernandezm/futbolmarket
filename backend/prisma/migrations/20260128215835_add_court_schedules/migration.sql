-- CreateTable
CREATE TABLE "CourtSchedule" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourtSchedule_courtId_idx" ON "CourtSchedule"("courtId");

-- CreateIndex
CREATE INDEX "CourtSchedule_dayOfWeek_idx" ON "CourtSchedule"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "CourtSchedule_courtId_dayOfWeek_startTime_endTime_key" ON "CourtSchedule"("courtId", "dayOfWeek", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "CourtSchedule" ADD CONSTRAINT "CourtSchedule_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
