/*
  Warnings:

  - Added the required column `gender` to the `Administrator` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Administrator" ADD COLUMN     "gender" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "backgroundInfo" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "backgroundInfo" TEXT,
ADD COLUMN     "gender" TEXT NOT NULL;
