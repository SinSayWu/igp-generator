import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function getSession() {
  const cookieStore = await cookies()
  
  // FIX: Changed "sessionId" to "session" to match your login route
  const sessionId = cookieStore.get("session")?.value

  if (!sessionId) return null

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { 
      user: true // We need this to distinguish between Student and Admin
    } 
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session
}