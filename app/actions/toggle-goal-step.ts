"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function toggleGoalStep(goalId: string, stepId: string) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;
    if (!sessionId) return { error: "Not authenticated" };

    const session = await getSession(sessionId);
    if (!session || !session.userId) return { error: "Invalid session" };

    try {
        const goal = await prisma.goal.findUnique({
            where: { id: goalId, studentId: session.userId },
        });

        if (!goal || !goal.steps || !Array.isArray(goal.steps)) {
            return { error: "Goal or steps not found" };
        }

        const steps = goal.steps as any[];
        const updatedSteps = steps.map((s) => 
            s.id === stepId ? { ...s, completed: !s.completed } : s
        );

        await prisma.goal.update({
            where: { id: goalId },
            data: { steps: updatedSteps },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Toggle step error:", error);
        return { error: "Failed to update step" };
    }
}
