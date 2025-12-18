import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("session")?.value;

  if (sessionId) {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  }

  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.delete("session");

  return res;
}
