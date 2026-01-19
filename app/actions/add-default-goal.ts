"use server";

import { prisma } from "@/lib/prisma";

export async function addDefaultGoal(studentId: string) {
    const defaultGoal = {
        title: "Explore the Website",
        priority: "Medium",
        status: "ACTIVE",
        aiAnalysis: "Welcome to Summit! This goal is designed to help you get familiar with your new academic dashboard. Exploring all features will ensure you get the most out of the AI-powered tools.",
        steps: [
            { id: crypto.randomUUID(), title: "Visit all dashboard tabs", completed: false },
            { id: crypto.randomUUID(), title: "View your student profile", completed: false },
            { id: crypto.randomUUID(), title: "Generate an AI recommendation or plan", completed: false },
        ]
    };

    try {
        await (prisma as any).goal.create({
            data: {
                studentId,
                title: defaultGoal.title,
                priority: defaultGoal.priority,
                status: defaultGoal.status,
                aiAnalysis: defaultGoal.aiAnalysis,
                steps: defaultGoal.steps,
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to add default goal:", error);
        return { error: "Failed to add default goal" };
    }
}
