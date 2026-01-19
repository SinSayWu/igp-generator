-- CreateTable
CREATE TABLE "ClubRecommendation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "timing" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "ClubRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "originalId" TEXT,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "locationJson" TEXT NOT NULL,
    "within45Min" BOOLEAN NOT NULL,
    "type" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL,
    "paidDescription" TEXT,
    "timeOfYear" TEXT NOT NULL,
    "timeCommitment" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OpportunityToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubRecommendation_studentId_clubId_key" ON "ClubRecommendation"("studentId", "clubId");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_originalId_key" ON "Opportunity"("originalId");

-- CreateIndex
CREATE INDEX "_OpportunityToStudent_B_index" ON "_OpportunityToStudent"("B");

-- AddForeignKey
ALTER TABLE "ClubRecommendation" ADD CONSTRAINT "ClubRecommendation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubRecommendation" ADD CONSTRAINT "ClubRecommendation_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityToStudent" ADD CONSTRAINT "_OpportunityToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityToStudent" ADD CONSTRAINT "_OpportunityToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
