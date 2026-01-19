"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function toggleGoal(goalId: string, currentStatus: string) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;
    if (!sessionId) return { error: "Not authenticated" };

    const session = await getSession(sessionId);
    if (!session || !session.userId) return { error: "Invalid session" };

    const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";

    try {
        await prisma.goal.update({
            where: {
                id: goalId,
                studentId: session.userId,
            },
            data: {
                status: newStatus,
            },
        });
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Toggle goal error:", error);
        return { error: "Failed to update goal" };
    }
}
