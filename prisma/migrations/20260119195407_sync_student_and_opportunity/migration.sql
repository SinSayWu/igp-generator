/*
  Warnings:

  - You are about to drop the column `within45Min` on the `Opportunity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Opportunity" DROP COLUMN "within45Min";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "latestClubAnalysis" TEXT,
ADD COLUMN     "latestCourseAnalysis" TEXT,
ADD COLUMN     "latestOpportunityAnalysis" TEXT;

-- CreateTable
CREATE TABLE "OpportunityRecommendation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchReason" TEXT NOT NULL,
    "actionPlan" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "generatedTags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "OpportunityRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "steps" JSONB,
    "aiAnalysis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityRecommendation_studentId_opportunityId_key" ON "OpportunityRecommendation"("studentId", "opportunityId");

-- CreateIndex
CREATE INDEX "Goal_studentId_idx" ON "Goal"("studentId");

-- AddForeignKey
ALTER TABLE "OpportunityRecommendation" ADD CONSTRAINT "OpportunityRecommendation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityRecommendation" ADD CONSTRAINT "OpportunityRecommendation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
