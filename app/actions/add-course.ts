"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { CourseStatus } from "@prisma/client";

export async function addCourse(payload: {
    courseId: string;
    status: CourseStatus;
    grade?: string;
    confidence?: string;
    stress?: string;
}) {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const { courseId, status, grade, confidence, stress } = payload;

    if (!courseId) {
        throw new Error("Missing courseId");
    }

    if (status === "COMPLETED") {
        if (!grade) throw new Error("Grade is required for completed courses");
        if (!confidence) throw new Error("Completed grade level is required");
    }

    if (status === "IN_PROGRESS" && !grade) {
        throw new Error("Grade is required for in-progress courses");
    }

    const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { gradeLevel: true },
    });

    if (!student) {
        throw new Error("Student not found");
    }

    let courseGradeLevel: number | null = null;

    if (status === "COMPLETED" && confidence) {
        if (confidence === "middle") {
            courseGradeLevel = 8;
        } else {
            const parsed = parseInt(confidence, 10);
            if (!isNaN(parsed)) {
                courseGradeLevel = parsed;
            }
        }
    } else if (status === "IN_PROGRESS" || status === "NEXT_SEMESTER") {
        if (student.gradeLevel) {
            courseGradeLevel = student.gradeLevel;
        }
    }

    const normalizedStress =
        status === "IN_PROGRESS" || status === "NEXT_SEMESTER" ? stress || null : null;

    await prisma.studentCourse.upsert({
        where: {
            studentId_courseId: {
                studentId: session.user.id,
                courseId,
            },
        },
        update: {
            grade: grade || null,
            status,
            confidenceLevel: confidence || null,
            stressLevel: normalizedStress,
            gradeLevel: courseGradeLevel,
        },
        create: {
            studentId: session.user.id,
            courseId,
            grade: grade || null,
            status,
            confidenceLevel: confidence || null,
            stressLevel: normalizedStress,
            gradeLevel: courseGradeLevel,
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/profile");
}
