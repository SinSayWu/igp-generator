import { prisma } from "@/lib/prisma";

type TranscriptItem = {
    course_name: string;
    final_grade: number;
    confidence: string;
    stress: string;
    status: string;
    level: string | null;
    credits: number;
    code: string;
    grade_level?: number;
};

type PlannedCourseItem = {
    course_name: string;
    grade_level: number | null;
    level: string | null;
    credits: number;
};

export async function getStudentContext(userId: string) {
    const student = await prisma.student.findUnique({
        where: { userId },
        include: {
            user: true,
            studentCourses: {
                include: {
                    course: true,
                },
            },
            targetColleges: true,
            focusPrograms: true,
            clubs: true,
            sports: true,
            // nationwideActs removed
        },
    });

    if (!student) return null;

    // 1. Construct Completed Courses (Names) & Transcript
    const completedCourses: string[] = [];
    const plannedCourses: PlannedCourseItem[] = [];
    const transcript: TranscriptItem[] = [];
    // NEW: Explicit history map for locking past grades
    const history: Record<string, string[]> = {};

    student.studentCourses.forEach((sc) => {
        let effectiveGradeLevel = sc.gradeLevel ?? null;
        if (effectiveGradeLevel == null && sc.confidenceLevel) {
            if (sc.confidenceLevel === "middle") {
                effectiveGradeLevel = 8;
            } else {
                const parsed = parseInt(sc.confidenceLevel, 10);
                if (!Number.isNaN(parsed)) {
                    effectiveGradeLevel = parsed;
                }
            }
        }

        const gradeStr = effectiveGradeLevel ? effectiveGradeLevel.toString() : "Unassigned";

        if (
            sc.status === "COMPLETED" ||
            sc.status === "IN_PROGRESS" ||
            sc.status === "NEXT_SEMESTER"
        ) {
            completedCourses.push(sc.course.name);

            // Populate history map
            if (!history[gradeStr]) history[gradeStr] = [];
            history[gradeStr].push(sc.course.name);

            transcript.push({
                course_name: sc.course.name,
                final_grade: parseInt(sc.grade || "0"), // approximate
                confidence: sc.confidenceLevel || "Neutral",
                stress: sc.stressLevel || "Neutral",
                status: sc.status,
                // NEW: Rich metadata
                level: sc.course.level,
                credits: sc.course.credits || 0,
                code: sc.course.code || "",
                grade_level: effectiveGradeLevel ?? undefined,
            });
        } else if (sc.status === "PLANNED") {
            plannedCourses.push({
                course_name: sc.course.name,
                grade_level: sc.gradeLevel,
                level: sc.course.level,
                credits: sc.course.credits || 0,
            });
        }
    });

    // 2. Construct Program Intent (Backward compatibility with prompt logic)
    // The prompt checks student.program_intent.jrotc, band, etc.
    // We derive this from focusPrograms or courses.
    const programs = student.focusPrograms.map((p) => p.name.toLowerCase());
    const courseNames = student.studentCourses.map((sc) => sc.course.name.toLowerCase());
    const interests = student.interests.map((i) => i.toLowerCase());

    // Helper to check if any list contains keyword
    const has = (keyword: string) =>
        programs.some((p) => p.includes(keyword)) ||
        courseNames.some((c) => c.includes(keyword)) ||
        interests.some((i) => i.includes(keyword));

    const programIntent = {
        band: has("band"),
        orchestra: has("orchestra"),
        visual_arts: has("art") || has("drawing"),
        jrotc: has("jrotc") || has("rotc"),
        weightlifting: has("weightlifting") || has("strength"),
    };

    // 3. Construct Final JSON Object matching students_v1.json structure
    const studentProfile = {
        id: `${student.user.firstName} ${student.user.lastName}`, // Using real name
        grade: student.gradeLevel,
        difficulty: "CP/Honors", // This might need to be derived or stored in DB. Defaulting for now.
        interests: [...student.interests],
        subject_interests: [...student.subjectInterests], // Passed to help AI
        completed_courses: completedCourses,
        // NEW: Pass explicit history map
        history: history,
        transcript: transcript,
        planned_courses: plannedCourses,
        study_hall_preferences: {
            interested: student.studyHallsPerYear && student.studyHallsPerYear > 0 ? "yes" : "no",
            min_per_year: 0,
            max_per_year: student.studyHallsPerYear || 0,
        },
        program_intent: programIntent,
        target_colleges: student.targetColleges.map((c) => c.name),
        additional_factors: {
            postsecondary_goal: student.postHighSchoolPlan,
            career_interest: student.careerInterest,
            bio: student.bio,
            sports: student.sports.map((s) => s.name),
            clubs: student.clubs.map((c) => c.name),
        },
    };

    // Return as a single-element array to match the mock data format (List of students)
    return [studentProfile];
}
