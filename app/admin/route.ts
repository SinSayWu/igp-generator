import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.administrator.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Admin already exists" },
        { status: 409 }
      );
    }

    const school = await prisma.school.findUnique({
        where: { schoolCode: schoolCode },
    })

    if (!school) {
        return NextResponse.json(
            { error: "School code does not exist" },
            { status: 400 },
        )
    }

    const schoolId = school.id;

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.administrator.create({
      data: {
        firstName,
        lastName,
        middleName,
        preferredName,
        gender,
        email,
        passwordHash,
        schoolId,
      },
    });

    return NextResponse.json(
      { id: admin.id, email: admin.email },
      { status: 201 }
    );
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
