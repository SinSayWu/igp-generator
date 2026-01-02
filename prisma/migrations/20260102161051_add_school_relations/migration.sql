/*
  Warnings:

  - A unique constraint covering the columns `[name,schoolId]` on the table `Club` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,schoolId]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,schoolId]` on the table `Sport` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schoolId` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Sport` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Club_name_key";

-- DropIndex
DROP INDEX "Course_name_key";

-- DropIndex
DROP INDEX "Sport_name_key";

-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sport" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Club_name_schoolId_key" ON "Club"("name", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_name_schoolId_key" ON "Course"("name", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_name_schoolId_key" ON "Sport"("name", "schoolId");

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sport" ADD CONSTRAINT "Sport_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
