/*
  Warnings:

  - You are about to drop the column `schoolCode` on the `School` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[schoolStudentCode]` on the table `School` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolAdminCode]` on the table `School` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schoolAdminCode` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolStudentCode` to the `School` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "School_schoolCode_key";

-- AlterTable
ALTER TABLE "School" DROP COLUMN "schoolCode",
ADD COLUMN     "schoolAdminCode" INTEGER NOT NULL,
ADD COLUMN     "schoolStudentCode" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "School_schoolStudentCode_key" ON "School"("schoolStudentCode");

-- CreateIndex
CREATE UNIQUE INDEX "School_schoolAdminCode_key" ON "School"("schoolAdminCode");
