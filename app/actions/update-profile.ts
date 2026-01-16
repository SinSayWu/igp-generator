"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CourseStatus } from "@prisma/client";

export async function updateStudentProfile(userId: string, formData: FormData) {
    // 1. Extract IDs
    const clubIds = formData.getAll("clubIds") as string[];
    const sportIds = formData.getAll("sportIds") as string[];
    const collegeIds = formData.getAll("collegeIds") as string[];
    const nationwideActIds = formData.getAll("nationwideActIds") as string[];

    // NEW: Extract Program IDs
    const programIds = formData.getAll("programIds") as string[];

    // NEW: Extract course data
    const courseIds = formData.getAll("courseIds") as string[];
    const courseGrades = formData.getAll("courseGrades") as string[];
    const courseStatuses = formData.getAll("courseStatuses") as string[];
    const courseConfidenceLevels = formData.getAll("courseConfidenceLevels") as string[];
    const courseStressLevels = formData.getAll("courseStressLevels") as string[];

    const interests = formData.getAll("interests") as string[];
    const subjectInterests = formData.getAll("subjectInterests") as string[];
    const rawGrade = formData.get("gradeLevel");
    const gradeLevel = rawGrade ? parseInt(rawGrade as string) : 9;
    const bio = formData.get("bio") as string;
    const postHighSchoolPlan = formData.get("postHighSchoolPlan") as string;
    const careerInterest = formData.get("careerInterest") as string;
    const interestedInNCAA = formData.get("interestedInNCAA") === "on";

    // NEW: Extract study halls
    const rawStudyHalls = formData.get("studyHallsPerYear");
    const studyHallsPerYear = rawStudyHalls ? parseInt(rawStudyHalls as string) : 0;

    // 3. Update Database
    await prisma.student.update({
        where: { userId },
        data: {
            gradeLevel,
            bio,
            interests,
            subjectInterests,
            postHighSchoolPlan,
            careerInterest,
            interestedInNCAA,
            studyHallsPerYear,

            // Relations
            clubs: { set: [], connect: clubIds.map((id) => ({ id })) },
            sports: { set: [], connect: sportIds.map((id) => ({ id })) },

            // NEW: Handle courses through StudentCourse junction table
            studentCourses: {
                deleteMany: {}, // Remove all existing course entries
                create: courseIds.map((courseId, index) => ({
                    courseId,
                    grade: courseGrades[index] || null,
                    status: (courseStatuses[index] || "IN_PROGRESS") as CourseStatus,
                    confidenceLevel: courseConfidenceLevels[index] || null,
                    stressLevel: courseStressLevels[index] || null,
                })),
            },

            targetColleges: { set: [], connect: collegeIds.map((id) => ({ id })) },
            nationwideActs: { set: [], connect: nationwideActIds.map((id) => ({ id })) },

            // NEW: Update Programs
            focusPrograms: {
                set: [],
                connect: programIds.map((id) => ({ id })),
            },
        },
    });

    revalidatePath("/profile");
}
