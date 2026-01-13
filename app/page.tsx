import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DefaultHomePage from "@/app/defaultHome";

export default async function HomePage() {
  const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;
  if (!sessionId) return <DefaultHomePage />;

  const session = await getSession(sessionId);
  if (!session) return <DefaultHomePage />;

  redirect("/dashboard");
}
