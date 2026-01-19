import { prisma } from "@/lib/prisma";
import ProfileEditor from "./ProfileEditor";

/**
 * StudentProfileForm - Server Component
 *
 * Handles all server-side data fetching for the student profile.
 * Separates data layer concerns from UI/state management in ProfileEditor.
 *
 * Flow:
 * 1. Fetch student with their current selections
 * 2. Validate student is assigned to a school
 * 3. Fetch all available options filtered by school
 * 4. Pass all data to ProfileEditor client component
 */

export default async function StudentProfileForm({ userId }: { userId: string }) {
    // --- STEP 1: Fetch the logged-in student and their current selections ---
    const student = await prisma.student.findUnique({
        where: { userId: userId },
        include: {
            user: true,
            clubs: true,
            sports: true,
            studentCourses: {
                include: {
                    course: true,
                },
            },
            targetColleges: true,
            focusPrograms: true,
            savedOpportunities: true, // Ensure this relation is included
        } as any, // Cast the include object to any to bypass potential type issues
    });

    // Validate student exists and is assigned to a school
    if (!student || !(student as any).schoolId) { // Cast student to any for schoolId access if needed
        return <div>Error: Student not assigned to a school.</div>;
    }

    // --- STEP 2: Fetch all available options for the student's school ---
    // Activities & Courses (school-specific)
    const allClubs = await prisma.club.findMany({
        where: { schoolId: (student as any).schoolId },
        orderBy: { name: "asc" },
    });

    const allSports = await prisma.sport.findMany({
        where: { schoolId: (student as any).schoolId },
        orderBy: { name: "asc" },
    });

    const allCourses = await prisma.course.findMany({
        where: { schoolId: (student as any).schoolId },
        orderBy: [{ department: "asc" }, { name: "asc" }],
    });

    // Programs & Pathways (school-specific)
    const schoolPrograms = await prisma.program.findMany({
        where: { schoolId: (student as any).schoolId },
        orderBy: { name: "asc" },
    });

    // Global options (not filtered by school)
    const allColleges = await prisma.college.findMany({
        orderBy: { name: "asc" },
    });
    
    const allOpportunities = await (prisma as any).opportunity.findMany({
        orderBy: { title: "asc" },
    });

    const school = await prisma.school.findUnique({
        where: { id: (student as any).schoolId },
        select: { rigorLevels: true } as any,
    });

    // --- STEP 3: Render ProfileEditor with all data ---
    // ProfileEditor is a client component that handles UI, state, and form submission
    return (
        <ProfileEditor
            userId={userId}
            student={student as any}
            allClubs={allClubs as any}
            allSports={allSports as any}
            allCourses={allCourses as any}
            allColleges={allColleges as any}
            allPrograms={schoolPrograms as any}
            allOpportunities={allOpportunities as any}
            schoolRigorLevels={(school as any)?.rigorLevels ?? ["CP", "Honors", "AP"]}
        />
    );
}
