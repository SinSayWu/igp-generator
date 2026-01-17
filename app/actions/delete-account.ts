"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function deleteAccount() {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Not authenticated");
    }

    // Delete user sessions first to avoid foreign key constraint violations
    await prisma.session.deleteMany({
        where: { userId: session.user.id },
    });

    // Delete the user record
    // This should cascade delete student, profiles, courses, etc.
    await prisma.user.delete({
        where: { id: session.user.id },
    });

    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete("session");

    // Redirect to home/login
    redirect("/login");
}
