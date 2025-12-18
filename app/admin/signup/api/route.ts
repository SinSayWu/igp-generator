import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            firstName,
            lastName,
            middleName,
            preferredName,
            gender,
            email,
            password,
            schoolCode,
        } = body;

        if (!email || !password || !schoolCode) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            return NextResponse.json({ error: "Admin already exists" }, { status: 409 });
        }

        const school = await prisma.school.findUnique({
            where: { schoolAdminCode: schoolCode },
        });

        if (school == null) {
            return NextResponse.json({ error: "School code does not exist" }, { status: 400 });
        }

        const schoolId = school.id;

        const passwordHash = await bcrypt.hash(password, 12);

        // Create the User
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                middleName,
                preferredName,
                gender,
                email,
                passwordHash,
                role: "ADMIN",
            },
        });

        // Create the Admin
        await prisma.administrator.create({
            data: {
                userId: user.id,
                schoolId,
            },
        });

        const { session, expiresAt } = await createSession(user.id);

        revalidatePath("/", "layout");

        const res = NextResponse.redirect(
            new URL("/dashboard", req.url)
        );

        res.cookies.set("session", session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: expiresAt,
        });

        return res;
    } catch (error) {
        console.error("ADMIN CREATE ERROR:", error);

        return NextResponse.json(
            {
                error: "Failed to create admin",
                details: error instanceof Error ? error.message : error,
            },
            { status: 500 }
        );
    }
}
