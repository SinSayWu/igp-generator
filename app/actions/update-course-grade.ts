"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateCourseGrade(payload: { courseId: string; grade?: string }) {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const { courseId, grade } = payload;

    if (!courseId) {
        throw new Error("Missing courseId");
    }

    await prisma.studentCourse.update({
        where: {
            studentId_courseId: {
                studentId: session.user.id,
                courseId,
            },
        },
        data: {
            grade: grade || null,
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/profile");
}
