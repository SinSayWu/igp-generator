"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CourseStatus } from "@prisma/client";

export async function verifySchoolCode(code: number) {
    const school = await prisma.school.findUnique({
        where: { schoolStudentCode: code },
    });
    return !!school;
}

export async function completeOnboarding(userId: string, data: any) {
    try {
        const {
            // Step 1
            gradeLevel,
            age,
            bio,

            // Step 2
            courses, // Array of { id, status, grade... }

            // Step 3
            subjectInterests,
            studyHallsPerYear,

            // Step 4
            clubIds,
            sportIds,

            // Step 4
            collegeIds,
            programIds,
            postHighSchoolPlan,
            careerInterest,
            interestedInNCAA,
        } = data;

        await prisma.student.update({
            where: { userId },
            data: {
                gradeLevel,
                age,
                bio,
                subjectInterests: subjectInterests || [],
                studyHallsPerYear: studyHallsPerYear || 0,
                postHighSchoolPlan,
                careerInterest,
                interestedInNCAA,

                // Set relations
                clubs: { set: [], connect: clubIds.map((id: string) => ({ id })) },
                sports: { set: [], connect: sportIds.map((id: string) => ({ id })) },
                targetColleges: { set: [], connect: collegeIds.map((id: string) => ({ id })) },
                focusPrograms: { set: [], connect: programIds.map((id: string) => ({ id })) },

                // Courses
                studentCourses: {
                    deleteMany: {},
                    create: courses.map((c: any) => ({
                        courseId: c.id,
                        status: c.status,
                        grade: c.grade || null,
                        confidenceLevel: c.confidence || null,
                        stressLevel: c.stress || null,
                        gradeLevel: c.gradeLevel || gradeLevel, // Fallback to current grade if not specified
                    })),
                },
            },
        });

        revalidatePath("/dashboard");
    } catch (error) {
        console.error("Onboarding Error:", error);
        throw new Error("Failed to save profile");
    }

    redirect("/dashboard");
}
