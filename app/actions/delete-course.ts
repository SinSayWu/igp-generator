"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteCourse(studentCourseId: string) {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    try {
        // Verify ownership before deleting
        const course = await prisma.studentCourse.findUnique({
            where: { id: studentCourseId },
        });

        if (!course) {
            throw new Error("Course not found");
        }

        if (course.studentId !== session.user.id) {
            throw new Error("Unauthorized access to delete this course");
        }

        await prisma.studentCourse.delete({
            where: { id: studentCourseId },
        });

        // Revalidate relevant paths to refresh the UI
        revalidatePath("/dashboard");
        revalidatePath("/profile");
    } catch (error) {
        console.error("Failed to delete course:", error);
        throw new Error("Failed to delete course");
    }
}
