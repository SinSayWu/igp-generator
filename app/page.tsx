import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DefaultHomePage from "@/app/defaultHome";

export default async function HomePage() {
    const sessionId = (await cookies()).get("session")?.value;

    if (!sessionId) return <DefaultHomePage />;

    const session = await getSession(sessionId);

    if (!session) return <DefaultHomePage />;

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            student: true,
            admin: true,
        },
    });

    if (!user) return <DefaultHomePage />;

    return (
        <>
            <h1>
                Hello {user.firstName} {user.lastName}
            </h1>
            <h1>Account Type: {user.role}</h1>
            <h1>Email: {user.email}</h1>
            <h1>Gender: {user.gender}</h1>
        </>
    );
}
