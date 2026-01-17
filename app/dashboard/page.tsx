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
                },
            },
        },
    });

    if (!user) redirect("/");

    return (
        <DashboardShell
            user={{
                firstName: user.firstName,
                lastName: user.lastName,
                role: String(user.role),
                student: user.student,
            }}
        />
    );
}
