"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteGoal(goalId: string) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;
    if (!sessionId) return { error: "Not authenticated" };

    const session = await getSession(sessionId);
    if (!session || !session.userId) return { error: "Invalid session" };

    try {
        await prisma.goal.delete({
            where: {
                id: goalId,
                // Ensure ownership
                studentId: session.userId, 
            },
        });
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Delete goal error:", error);
        return { error: "Failed to delete goal" };
    }
}
