"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setGoalStepStatus(goalId: string, stepId: string, completed: boolean) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;
    if (!sessionId) return { error: "Not authenticated" };

    const session = await getSession(sessionId);
    if (!session || !session.userId) return { error: "Invalid session" };

    try {
        const goal = await (prisma as any).goal.findUnique({
            where: { id: goalId, studentId: session.userId },
        });

        if (!goal || !goal.steps || !Array.isArray(goal.steps)) {
            return { error: "Goal or steps not found" };
        }

        const steps = goal.steps as any[];
        const stepIndex = steps.findIndex(s => s.id === stepId);
        
        if (stepIndex === -1) return { error: "Step not found" };
        if (steps[stepIndex].completed === completed) return { success: true }; // Already in desired state

        const updatedSteps = [...steps];
        updatedSteps[stepIndex] = { ...steps[stepIndex], completed };

        // Auto-complete logic for the whole goal
        const allCompleted = updatedSteps.every(s => s.completed);
        let status = goal.status;
        if (allCompleted) {
            status = "COMPLETED";
        } else {
            status = "ACTIVE";
        }

        await (prisma as any).goal.update({
            where: { id: goalId },
            data: { 
                steps: updatedSteps,
                status: status
            },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Set goal step status error:", error);
        return { error: "Failed to update step" };
    }
}
