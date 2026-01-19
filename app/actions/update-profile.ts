"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CourseStatus } from "@prisma/client";

export async function updateStudentProfile(userId: string, formData: FormData) {
    // 1. Extract IDs
    const clubIds = formData.getAll("clubIds") as string[];
    const sportIds = formData.getAll("sportIds") as string[];
    const collegeIds = formData.getAll("collegeIds") as string[];

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
    const gradeLevel = rawGrade ? parseInt(rawGrade as string) : undefined;

    const bioRaw = formData.get("bio");
    const bio = typeof bioRaw === "string" ? bioRaw : undefined;

    const postHighSchoolPlanRaw = formData.get("postHighSchoolPlan");
    const postHighSchoolPlan =
        typeof postHighSchoolPlanRaw === "string"
            ? postHighSchoolPlanRaw.length
                ? postHighSchoolPlanRaw
                : null
            : undefined;

    const careerInterestRaw = formData.get("careerInterest");
    const careerInterest = typeof careerInterestRaw === "string" ? careerInterestRaw : undefined;

    const interestedInNCAARaw = formData.get("interestedInNCAA");
    const interestedInNCAA =
        interestedInNCAARaw == null
            ? undefined
            : interestedInNCAARaw === "on" || interestedInNCAARaw === "true";

    const desiredCourseRigorRaw = formData.get("desiredCourseRigor");
    const desiredCourseRigor =
        typeof desiredCourseRigorRaw === "string" ? desiredCourseRigorRaw.trim() : undefined;

    // NEW: Extract study halls
    const rawStudyHalls = formData.get("studyHallsPerYear");
    const studyHallsPerYear = rawStudyHalls ? parseInt(rawStudyHalls as string) : undefined;
    const rawMaxStudyHalls = formData.get("maxStudyHallsPerYear");
    const maxStudyHallsPerYear = rawMaxStudyHalls
        ? parseInt(rawMaxStudyHalls as string)
        : undefined;

    // 3. Update Database
    await prisma.student.update({
        where: { userId },
        data: {
            ...(gradeLevel == null ? {} : { gradeLevel }),
            ...(bio === undefined ? {} : { bio }),
            interests,
            subjectInterests,
            ...(postHighSchoolPlan === undefined ? {} : { postHighSchoolPlan }),
            ...(careerInterest === undefined ? {} : { careerInterest }),
            ...(interestedInNCAA === undefined ? {} : { interestedInNCAA }),
            ...(desiredCourseRigor === undefined
                ? {}
                : { desiredCourseRigor: desiredCourseRigor || null }),
            ...(studyHallsPerYear == null ? {} : { studyHallsPerYear }),
            ...(maxStudyHallsPerYear == null ? {} : { maxStudyHallsPerYear }),

            // Relations
            clubs: { set: [], connect: clubIds.map((id) => ({ id })) },
            sports: { set: [], connect: sportIds.map((id) => ({ id })) },

            // NEW: Handle courses through StudentCourse junction table
            studentCourses: {
                deleteMany: {}, // Remove all existing course entries
                create: courseIds.map((courseId, index) => {
                    const status = (courseStatuses[index] || "IN_PROGRESS") as CourseStatus;
                    const confidence = courseConfidenceLevels[index] || null;

                    // Logic to determine gradeLevel (year taken)
                    let courseGradeLevel: number | null = null;

                    if (status === "COMPLETED" && confidence) {
                        // The UI stores the completed grade (e.g. "9", "10") in the confidence field
                        if (confidence === "middle") {
                            courseGradeLevel = 8;
                        } else {
                            const parsed = parseInt(confidence);
                            if (!isNaN(parsed)) {
                                courseGradeLevel = parsed;
                            }
                        }
                    } else if (status === "IN_PROGRESS" || status === "NEXT_SEMESTER") {
                        // Assume current grade level for active courses
                        if (gradeLevel) {
                            courseGradeLevel = gradeLevel;
                        }
                    }

                    return {
                        courseId,
                        grade: courseGrades[index] || null,
                        status: status,
                        confidenceLevel: confidence,
                        stressLevel: courseStressLevels[index] || null,
                        gradeLevel: courseGradeLevel,
                    };
                }),
            },

            targetColleges: { set: [], connect: collegeIds.map((id) => ({ id })) },

            // NEW: Update Programs
            focusPrograms: {
                set: [],
                connect: programIds.map((id) => ({ id })),
            },
        },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard", "layout");
}
