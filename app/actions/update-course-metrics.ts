"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const metricScale = ["VERY_LOW", "LOW", "NEUTRAL", "HIGH", "VERY_HIGH"] as const;

type MetricValue = (typeof metricScale)[number];

type UpdateCourseMetricsPayload = {
    courseId: string;
    confidence?: MetricValue;
    stress?: MetricValue;
};

export async function updateCourseMetrics(payload: UpdateCourseMetricsPayload) {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const { courseId, confidence, stress } = payload;

    if (!courseId) {
        throw new Error("Missing courseId");
    }

    const updateData: { confidenceLevel?: string | null; stressLevel?: string | null } = {};

    if (confidence !== undefined) {
        updateData.confidenceLevel = confidence || null;
    }
    if (stress !== undefined) {
        updateData.stressLevel = stress || null;
    }

    if (Object.keys(updateData).length === 0) {
        return;
    }

    await prisma.studentCourse.update({
        where: {
            studentId_courseId: {
                studentId: session.user.id,
                courseId,
            },
        },
        data: updateData,
    });

    revalidatePath("/dashboard");
    revalidatePath("/profile");
}
