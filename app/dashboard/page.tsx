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
        include: {
            student: {
                include: {
                    studentCourses: {
                        include: {
                            course: true,
                        },
                    },
                    clubs: true,
                },
            },
        },
    }) as any;

    if (!user) redirect("/");

    if (user.role === "STUDENT") {
        if (!user.student || !user.student.gradeLevel || !user.student.age) {
            redirect("/onboarding");
        }
    }

    const courseCatalog = await prisma.course.findMany({
        where: { schoolId: user.student?.schoolId ?? undefined },
        orderBy: { name: "asc" },
    });

    return (
        <DashboardShell
            user={{
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                student: user.student ? {
                    ...(user.student),
                    clubs: (user.student.clubs || []).map((c: any) => ({
                        ...c,
                        teacherLeader: c.teacherLeader
                    })),
                    studentCourses: (user.student.studentCourses || []).map((sc: any) => ({
                        ...sc,
                        gradeLevel: sc.gradeLevel
                    }))
                } : null,
            }}
            courseCatalog={courseCatalog as any}
        />
    );
}
