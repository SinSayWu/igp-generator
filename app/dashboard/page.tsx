import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/Dashboard/Shell";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;
    if (!sessionId) redirect("/");

    const session = await getSession(sessionId);
    if (!session) redirect("/");

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            student: true,
            admin: true,
        },
    });

    if (!user) redirect("/");

    return (
        <DashboardShell
            user={{ firstName: user.firstName, lastName: user.lastName, role: user.role }}
            progress={0}
        />
    );
}
