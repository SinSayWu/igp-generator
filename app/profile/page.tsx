import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import StudentProfileForm from "@/app/profile/_components/StudentProfileForm"
import AdminDashboard from "@/app/profile/_components/AdminDashboard"


export default async function ProfilePage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { student: true, admin: true } 
  })

  if (!user) redirect("/login")

  // TRAFFIC COP
  if (user.role === 'ADMIN') {
    return <AdminDashboard userId={user.id} />
  }

  if (user.role === 'STUDENT') {
    // If they are a student user but don't have a student record yet, handle that error
    if (!user.student) {
      return <div>Error: Student record not found for this user.</div>
    }
    return <StudentProfileForm userId={user.id} />
  }
}