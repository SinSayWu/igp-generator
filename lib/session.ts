import { prisma } from "@/lib/prisma";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: string) {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const session = await prisma.session.create({
        data: {
            userId,
            expiresAt,
        },
    });

    return { session, expiresAt };
}

export async function getSession(sessionId: string) {
    return prisma.session.findUnique({
        where: { id: sessionId },
    });
}

export async function destroySession(sessionId: string) {
    await prisma.session.delete({ where: { id: sessionId } });
}
