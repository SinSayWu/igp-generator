-- AlterEnum
ALTER TYPE "CourseStatus" ADD VALUE 'PLANNED';

-- AlterTable
ALTER TABLE "StudentCourse" ADD COLUMN     "gradeLevel" INTEGER;
