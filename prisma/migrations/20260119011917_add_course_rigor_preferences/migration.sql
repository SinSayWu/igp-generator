-- AlterTable
ALTER TABLE "School" ADD COLUMN     "rigorLevels" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "desiredCourseRigor" TEXT;
