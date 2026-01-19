import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        select: { collegePlanSummary: true },
    });

    if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ summary: student.collegePlanSummary ?? "" });
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { summary?: string };
    const summary = typeof body.summary === "string" ? body.summary.trim() : "";

    if (!summary) {
        return NextResponse.json({ error: "Summary is required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        select: { userId: true },
    });

    if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.student.update({
        where: { userId: session.userId },
        data: { collegePlanSummary: summary },
    });

    return NextResponse.json({ ok: true });
}
