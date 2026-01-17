import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OnboardingWizard from "./_components/OnboardingWizard";

export default async function OnboardingPage() {
    const session = await getSession();
    if (!session?.user) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            student: {
                include: {
                    clubs: true,
                    sports: true,
                    studentCourses: {
                        include: {
                            course: true,
                        },
                    },
                    targetColleges: true,
                    focusPrograms: true,
                },
            },
        },
    });

    if (!user || !user.student) redirect("/login");
    const student = user.student;

    // Fetch Lists
    if (!student.schoolId) {
        // Technically shouldn't happen if signup forces it, but handle it
        return <div>Error: No School ID assigned. Please contact support.</div>;
    }

    const allClubs = await prisma.club.findMany({
        where: { schoolId: student.schoolId },
        orderBy: { name: "asc" },
    });

    const allSports = await prisma.sport.findMany({
        where: { schoolId: student.schoolId },
        orderBy: { name: "asc" },
    });

    const allCourses = await prisma.course.findMany({
        where: { schoolId: student.schoolId },
        orderBy: [{ department: "asc" }, { name: "asc" }],
    });

    const schoolPrograms = await prisma.program.findMany({
        where: { schoolId: student.schoolId },
        orderBy: { name: "asc" },
    });

    const allColleges = await prisma.college.findMany({
        orderBy: { name: "asc" },
    });

    return (
        <OnboardingWizard
            student={student}
            allClubs={allClubs}
            allSports={allSports}
            allCourses={allCourses}
            allColleges={allColleges}
            allPrograms={schoolPrograms}
        />
    );
}
