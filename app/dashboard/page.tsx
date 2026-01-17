import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/Dashboard/Shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;
    if (!sessionId) redirect("/");

    const session = await getSession(sessionId);
    if (!session) redirect("/");

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            firstName: true,
            lastName: true,
            role: true,
            student: {
                select: {
                    schoolId: true,
                    gradeLevel: true, // <--- Added this to get student's current grade
                    age: true, // Added for onboarding check
                    postHighSchoolPlan: true,
                    interestedInNCAA: true,
                    _count: {
                        select: {
                            clubs: true,
                            sports: true,
                            studentCourses: true,
                            targetColleges: true,
                        },
                    },
                    // Full data for dashboard tabs
                    studentCourses: {
                        select: {
                            id: true,
                            courseId: true,
                            grade: true,
                            status: true,
                            gradeLevel: true,
                            course: {
                                select: {
                                    id: true,
                                    name: true,
                                    department: true,
                                },
                            },
                        },
                    },
                    clubs: {
                        select: {
                            id: true,
                            name: true,
                            category: true,
                        },
                    },
                    sports: {
                        select: {
                            id: true,
                            name: true,
                            season: true,
                        },
                    },
                    targetColleges: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
            },
        },
    });

    if (!user) redirect("/");

    // NEW: Fetch full course catalog for the student's school
    const courseCatalog = await prisma.course.findMany({
        where: { schoolId: user.student?.schoolId ?? undefined },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            department: true,
            credits: true,
            level: true,
            availableGrades: true,
        },
    });

    if (user.role === "STUDENT") {
        if (!user.student?.age) {
            redirect("/onboarding");
        }
    }

    return (
        <DashboardShell
            user={{
                firstName: user.firstName,
                lastName: user.lastName,
                role: String(user.role),
                student: {
                    ...user.student,
                    gradeLevel: user.student?.gradeLevel ?? 9, // Fallback
                },
            }}
            courseCatalog={courseCatalog}
        />
    );
}
