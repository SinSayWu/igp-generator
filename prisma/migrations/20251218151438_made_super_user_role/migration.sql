/*
  Warnings:

  - The primary key for the `Administrator` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Administrator` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Administrator` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Administrator` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Administrator` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Administrator` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Administrator` table. All the data in the column will be lost.
  - You are about to drop the column `middleName` on the `Administrator` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Administrator` table. All the data in the column will be lost.
  - You are about to drop the column `preferredName` on the `Administrator` table. All the data in the column will be lost.
  - You are about to drop the column `adminId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `userType` on the `Session` table. All the data in the column will be lost.
  - The primary key for the `Student` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `backgroundInfo` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `middleName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `preferredName` on the `Student` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Administrator` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gradeLevel` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN');

-- DropForeignKey
ALTER TABLE "Administrator" DROP CONSTRAINT "Administrator_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_schoolId_fkey";

-- DropIndex
DROP INDEX "Administrator_email_key";

-- DropIndex
DROP INDEX "Student_email_key";

-- DropIndex
DROP INDEX "Student_phoneNumber_key";

-- AlterTable
ALTER TABLE "Administrator" DROP CONSTRAINT "Administrator_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "firstName",
DROP COLUMN "gender",
DROP COLUMN "id",
DROP COLUMN "lastName",
DROP COLUMN "middleName",
DROP COLUMN "passwordHash",
DROP COLUMN "preferredName",
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "schoolId" DROP NOT NULL,
ADD CONSTRAINT "Administrator_pkey" PRIMARY KEY ("userId");

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "adminId",
DROP COLUMN "studentId",
DROP COLUMN "userType",
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Student" DROP CONSTRAINT "Student_pkey",
DROP COLUMN "backgroundInfo",
DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "firstName",
DROP COLUMN "gender",
DROP COLUMN "grade",
DROP COLUMN "id",
DROP COLUMN "lastName",
DROP COLUMN "middleName",
DROP COLUMN "passwordHash",
DROP COLUMN "phoneNumber",
DROP COLUMN "preferredName",
ADD COLUMN     "gpa" DOUBLE PRECISION,
ADD COLUMN     "gradeLevel" INTEGER NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "graduationYear" DROP NOT NULL,
ALTER COLUMN "schoolId" DROP NOT NULL,
ADD CONSTRAINT "Student_pkey" PRIMARY KEY ("userId");

-- DropEnum
DROP TYPE "UserType";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "preferredName" TEXT,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordHash" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Administrator" ADD CONSTRAINT "Administrator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Administrator" ADD CONSTRAINT "Administrator_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
