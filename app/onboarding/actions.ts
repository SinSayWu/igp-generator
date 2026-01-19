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

// Types for the onboarding/profile update payload
interface MyCourse {
    id: string;
    status: string;
    grade?: string | null;
    gradeLevel?: number;
    confidence?: string | null;
    stress?: string | null;
}

interface OnboardingData {
    gradeLevel: number;
    age: number;
    bio: string;
    courses: MyCourse[];
    subjectInterests: string[];
    studyHallsPerYear: number;
    maxStudyHallsPerYear: number;
    clubIds: string[];
    sportIds: string[];
    collegeIds: string[];
    programIds: string[];
    postHighSchoolPlan: string;
    careerInterest: string;
    interestedInNCAA: boolean;
    desiredCourseRigor?: string;
}

export async function completeOnboarding(userId: string, data: OnboardingData) {
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
            maxStudyHallsPerYear,

            // Step 4
            clubIds,
            sportIds,

            // Step 4
            collegeIds,
            programIds,
            postHighSchoolPlan,
            careerInterest,
            interestedInNCAA,
            desiredCourseRigor,
        } = data;

        await prisma.student.update({
            where: { userId },
            data: {
                gradeLevel,
                age,
                bio,
                subjectInterests: subjectInterests || [],
                studyHallsPerYear: studyHallsPerYear || 0,
                maxStudyHallsPerYear: maxStudyHallsPerYear || studyHallsPerYear || 0,
                postHighSchoolPlan,
                careerInterest,
                interestedInNCAA,
                ...(desiredCourseRigor ? { desiredCourseRigor } : { desiredCourseRigor: null }),

                // Set relations
                clubs: { set: [], connect: clubIds.map((id) => ({ id })) },
                sports: { set: [], connect: sportIds.map((id) => ({ id })) },
                targetColleges: { set: [], connect: collegeIds.map((id) => ({ id })) },
                focusPrograms: { set: [], connect: programIds.map((id) => ({ id })) },

                // Courses
                studentCourses: {
                    deleteMany: {},
                    create: data.courses.map((c) => ({
                        courseId: c.id,
                        status: c.status as CourseStatus,
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
