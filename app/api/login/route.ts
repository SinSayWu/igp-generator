import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid Credentials" }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid Credentials" }, { status: 401 });
        }

        const { session, expiresAt } = await createSession(user.id);

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
        console.error("LOGIN ERROR:", error);

        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
