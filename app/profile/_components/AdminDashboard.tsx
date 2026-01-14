import { prisma } from "@/lib/prisma"

export default async function AdminDashboard({ userId }: { userId: string }) {
  // 1. Fetch Admin details
  const admin = await prisma.administrator.findUnique({
    where: { userId: userId },
    include: { school: true }
  })

  // 2. Fetch School Stats (e.g. how many students are in the system)
  const studentCount = await prisma.student.count()
  const clubCount = await prisma.club.count()
  const sportCount = await prisma.sport.count()

  if (!admin) {
    return <div className="p-8 text-red-600">Error: Admin record not found.</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administrator Dashboard</h1>
          <p className="text-gray-500">
            Welcome back. Managing <span className="font-semibold text-[var(--foreground-2)]">{admin.school?.name || "School System"}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <span className="bg-[var(--button-color)] text-black px-4 py-2 rounded-full text-sm font-bold shadow-sm">
            Admin Access
          </span>
          <span className="bg-gray-100 text-black px-4 py-2 rounded-full text-sm font-medium shadow-sm">
            Code: {admin.school?.schoolAdminCode || "N/A"}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--button-color-2)] rounded-bl-full -mr-2 -mt-2"></div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Students</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">{studentCount}</p>
          </div>
          <div className="text-xs text-[var(--foreground-2)] font-medium">Active Profiles</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Clubs</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">{clubCount}</p>
          </div>
          <div className="text-xs text-[var(--foreground-2)] font-medium">Extracurriculars</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Sports</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">{sportCount}</p>
          </div>
          <div className="text-xs text-[var(--foreground-2)] font-medium">Athletic Programs</div>
        </div>
      </div>

      {/* Admin Actions Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Quick Tools */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Management Tools</h2>
          <div className="space-y-4">
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-[var(--button-color)] border rounded-lg transition-colors flex justify-between group">
              <span className="font-medium text-gray-700 group-hover:text-black">Manage Course Catalog</span>
              <span className="text-gray-400">→</span>
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-[var(--button-color)] border rounded-lg transition-colors flex justify-between group">
              <span className="font-medium text-gray-700 group-hover:text-black">View Student IGPs</span>
              <span className="text-gray-400">→</span>
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-[var(--button-color)] border rounded-lg transition-colors flex justify-between group">
              <span className="font-medium text-gray-700 group-hover:text-black">Update School Settings</span>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </div>

        {/* System Status / Info */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">System Info</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex justify-between border-b pb-2">
              <span>Database Status</span>
              <span className="text-[var(--foreground-2)] font-medium">● Connected</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>School Code (Student)</span>
              <span className="font-mono bg-gray-100 px-2 rounded">{admin.school?.schoolStudentCode}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>School Code (Admin)</span>
              <span className="font-mono bg-gray-100 px-2 rounded">{admin.school?.schoolAdminCode}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}