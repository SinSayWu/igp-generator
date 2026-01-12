/*
  Warnings:

  - You are about to drop the column `gpa` on the `Student` table. All the data in the column will be lost.
  - The `interests` column on the `Student` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `graduationYear` on table `Student` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "gpa",
ADD COLUMN     "careerInterest" TEXT,
ADD COLUMN     "interestedInNCAA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postHighSchoolPlan" TEXT,
ALTER COLUMN "graduationYear" SET NOT NULL,
DROP COLUMN "interests",
ADD COLUMN     "interests" TEXT[];

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requirements" TEXT[],

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CollegeToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CollegeToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "College_name_key" ON "College"("name");

-- CreateIndex
CREATE INDEX "_CollegeToStudent_B_index" ON "_CollegeToStudent"("B");

-- AddForeignKey
ALTER TABLE "_CollegeToStudent" ADD CONSTRAINT "_CollegeToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollegeToStudent" ADD CONSTRAINT "_CollegeToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
