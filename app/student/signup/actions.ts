"use server";

import { prisma } from "@/lib/prisma";
import { CourseStatus, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { cookies } from "next/headers";

export async function getSchoolData(schoolCode: number) {
    const school = await prisma.school.findUnique({
        where: { schoolStudentCode: schoolCode },
        include: {
            clubs: true,
            sports: true,
            courses: true,
            programs: true,
        },
    });

    if (!school) {
        return { error: "School not found" };
    }

    const allColleges = await prisma.college.findMany();

    return {
        schoolId: school.id,
        schoolName: school.name,
        allClubs: school.clubs,
        allSports: school.sports,
        allCourses: school.courses,
        allPrograms: school.programs,
        allColleges: allColleges,
    };
}

export async function checkEmailExists(email: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    return !!existing;
}

export interface MyCourse {
    id: string;
    name: string;
    status: string;
    grade?: string;
    gradeLevel?: number;
    confidence?: string;
    stress?: string;
}

export interface SignupData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    schoolCode: number;
    gradeLevel: number;
    age: number;
    bio: string;
    courses: MyCourse[];
    subjectInterests: string[];
    studyHallsPerYear: number;
    maxStudyHallsPerYear?: number;
    clubIds: string[];
    sportIds: string[];
    collegeIds: string[];
    programIds: string[];
    postHighSchoolPlan: string;
    careerInterest: string;
    interestedInNCAA: boolean;
    middleName?: string;
}

export async function signupAndProfileSetup(data: SignupData) {
    const {
        firstName,
        lastName,
        middleName,
        email,
        password,
        schoolCode,
        gradeLevel,
        age,
        bio,
        courses,
        subjectInterests,
        studyHallsPerYear,
        maxStudyHallsPerYear,
        clubIds,
        sportIds,
        collegeIds,
        programIds,
        postHighSchoolPlan,
        careerInterest,
        interestedInNCAA,
    } = data;

    // 1. Basic Check
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new Error("User with this email already exists");
    }

    // 2. Resolve School
    const school = await prisma.school.findUnique({
        where: { schoolStudentCode: schoolCode },
    });
    if (!school) throw new Error("Invalid School Code");

    // 3. Hash Password
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Transactional Create
    // We create User -> Student -> Connect Relations
    // Note: We are creating "StudentCourse" records here too

    // Prepare nested writes
    const studentData: Prisma.StudentCreateWithoutUserInput = {
        school: { connect: { id: school.id } },
        gradeLevel,
        graduationYear: new Date().getFullYear() + (12 - gradeLevel), // Approximation
        age,
        bio,
        subjectInterests,
        maxStudyHallsPerYear: maxStudyHallsPerYear || studyHallsPerYear, // Fallback to min if not set
        studyHallsPerYear,
        postHighSchoolPlan,
        careerInterest,
        interestedInNCAA,
        clubs: {
            connect: clubIds.map((id) => ({ id })),
        },
        sports: {
            connect: sportIds.map((id) => ({ id })),
        },
        targetColleges: {
            connect: collegeIds.map((id) => ({ id })),
        },
        focusPrograms: {
            connect: programIds.map((id) => ({ id })),
        },
    };

    if (courses && courses.length > 0) {
        studentData.studentCourses = {
            create: courses.map((c) => ({
                courseId: c.id,
                status: c.status as CourseStatus,
                grade: c.grade,
                gradeLevel: c.gradeLevel, // e.g., 9, 10
                // confidence/stress might be ignored unless schema calls for it
                // schema has confidence/stress on Course? No, usually on the relation.
                // Let's check schema later. For now, match existing `completeOnboarding` payload usage.
            })),
        };
    }

    try {
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                middleName,
                email,
                passwordHash,
                role: "STUDENT",
                gender: "Not Specified", // Or add to form
                student: {
                    create: studentData,
                },
            },
        });

        // 5. Create Session
        const { session, expiresAt } = await createSession(user.id);
        const cookieStore = await cookies();
        cookieStore.set("session", session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: expiresAt,
        });

        return { success: true };
    } catch (e) {
        console.error("Signup Transaction Failed:", e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        throw new Error("Failed to create account: " + errorMessage);
    }
}
