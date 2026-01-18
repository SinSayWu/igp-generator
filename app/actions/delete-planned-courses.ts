"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { CourseStatus } from "@prisma/client";

export async function deletePlannedCourses() {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    await prisma.studentCourse.deleteMany({
        where: {
            studentId: session.user.id,
            status: CourseStatus.PLANNED,
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/profile");
}
