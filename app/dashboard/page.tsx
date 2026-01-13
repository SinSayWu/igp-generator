import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;
  if (!sessionId) redirect("/");

  const session = await getSession(sessionId);
  if (!session) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      student: true,
      admin: true,
    },
  });

  if (!user) redirect("/");

  return (
    <>
      <h1>
        Hello {user.firstName} {user.lastName}
      </h1>
      <h1>Account Type: {user.role}</h1>
      <h1>Email: {user.email}</h1>
      <h1>Gender: {user.gender}</h1>
    </>
  );
}
