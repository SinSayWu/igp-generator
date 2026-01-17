/*
  Warnings:

  - You are about to drop the `NationwideAct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_NationwideActToStudent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_NationwideActToStudent" DROP CONSTRAINT "_NationwideActToStudent_A_fkey";

-- DropForeignKey
ALTER TABLE "_NationwideActToStudent" DROP CONSTRAINT "_NationwideActToStudent_B_fkey";

-- DropTable
DROP TABLE "NationwideAct";

-- DropTable
DROP TABLE "_NationwideActToStudent";
