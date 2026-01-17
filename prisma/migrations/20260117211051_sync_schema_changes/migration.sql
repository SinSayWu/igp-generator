-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "studentLeaders" TEXT,
ADD COLUMN     "teacherLeader" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "availableGrades" INTEGER[],
ADD COLUMN     "bundleId" TEXT,
ADD COLUMN     "countsForGrad" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "credits" DOUBLE PRECISION,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "prerequisites" TEXT,
ADD COLUMN     "programTag" TEXT,
ADD COLUMN     "requirements" TEXT[];

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "age" INTEGER;
