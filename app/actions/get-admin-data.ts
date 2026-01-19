"use server";

import { prisma } from "@/lib/prisma";
import { StudentCourseData } from "@/components/Dashboard/types";

export async function getAdminData(userId: string) {
  const admin = await prisma.administrator.findUnique({
    where: { userId },
    include: { school: true }
  });

  if (!admin) return null;

  const studentCount = await prisma.student.count();
  const clubCount = await prisma.club.count();
  const sportCount = await prisma.sport.count();

  return {
    admin,
    stats: {
      studentCount,
      clubCount,
      sportCount
    }
  };
}

export async function getAllStudents() {
  return await prisma.student.findMany({
    select: {
      userId: true,
      gradeLevel: true,
      postHighSchoolPlan: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: {
      user: {
        lastName: 'asc'
      }
    }
  });
}

export async function getStudentIGPData(studentUserId: string) {
  const student = await prisma.student.findUnique({
    where: { userId: studentUserId },
    include: {
      studentCourses: {
        include: {
          course: true
        }
      },
      goals: true,
      user: true
    }
  });

  return student;
}
