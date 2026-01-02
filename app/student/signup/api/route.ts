import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

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
            schoolCode, // e.g., 12345
            grade,      // Ensure your form sends this as a number (e.g., 9)
            gradYear,   // Ensure your form sends this as a number (e.g., 2029)
        } = body;

        // 1. Basic Validation
        if (!email || !password || !schoolCode) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 2. Check for existing user
        const existing = await prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
        }

        // 3. Verify School Code
        const school = await prisma.school.findUnique({
            where: { schoolStudentCode: Number(schoolCode) }, // Cast to Number just in case
        });

        if (!school) {
            return NextResponse.json({ error: "Invalid School Code" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // 4. Create User AND Student in ONE step (Transactional)
        // This prevents "orphan" users if student creation fails
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                middleName,
                preferredName,
                gender,
                email,
                passwordHash,
                role: "STUDENT",
                // Create the linked Student profile immediately
                student: {
                    create: {
                        schoolId: school.id,
                        gradeLevel: Number(grade),
                        graduationYear: Number(gradYear),
                        // Clubs, Sports, Bio are initially empty/null
                    }
                }
            },
        });

        // 5. Create Session
        const { session, expiresAt } = await createSession(user.id);

        // 6. Return JSON (Let the frontend handle the redirect)
        const res = NextResponse.json({ success: true });

        res.cookies.set("session", session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: expiresAt,
        });

        return res;

    } catch (error) {
        console.error("SIGNUP ERROR:", error);
        return NextResponse.json(
            { error: "Failed to create account" },
            { status: 500 }
        );
    }
}