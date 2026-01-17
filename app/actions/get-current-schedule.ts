"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CourseStatus } from "@prisma/client";

export async function getCurrentSchedule() {
    const session = await getSession();
    if (!session || !session.user) {
        return null;
    }

    const studentCourses = await prisma.studentCourse.findMany({
        where: {
            studentId: session.user.id,
            // Fetch ALL courses that have a gradeLevel assigned, regardless of status
            // This includes COMPLETED, IN_PROGRESS, NEXT_SEMESTER, and PLANNED
            gradeLevel: { not: null },
        },
        include: {
            course: true,
        },
    });

    if (studentCourses.length === 0) {
        return null;
    }

    // Transform to Schedule format: { "9": [{name: "Course 1", status: "COMPLETED"}, ...], "10": ... }
    // CHANGED: Returns objects instead of just strings
    const schedule: Record<string, { name: string; status: CourseStatus }[]> = {};

    studentCourses.forEach((sc) => {
        const grade = sc.gradeLevel ? sc.gradeLevel.toString() : "Unassigned";
        if (!schedule[grade]) {
            schedule[grade] = [];
        }
        // Push object with metadata
        schedule[grade].push({
            name: sc.course.name,
            status: sc.status,
        });
    });

    return schedule;
}
