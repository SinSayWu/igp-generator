import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const created = await prisma.user.create({
      data: {
        email: `test_${Date.now()}@example.com`,
        name: "Prisma Works!",
        passwordHash: "test-hash",
      },
    });

    const all = await prisma.user.findMany();
    return Response.json({ created, all });
  } catch (err) {
    console.error("API ERROR:", err);

    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
