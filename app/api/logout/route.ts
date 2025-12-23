import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const sessionId = req.cookies.get("session")?.value;

    if (sessionId) {
        await prisma.session.deleteMany({
            where: { id: sessionId },
        });
    }

    const res = NextResponse.redirect(new URL("/", req.url), { status: 303 });

    res.cookies.set("session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });

    return res;
}
