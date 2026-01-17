"use client";

// Types matching the data from Shell
type StudentCourseData = {
  id: string;
  courseId: string;
  grade: string | null;
  status: string;
  course: {
    id: string;
    name: string;
    department: string;
  };
};

type ClassesPageProps = {
  courses: StudentCourseData[];
};

export default function ClassesPage({ courses }: ClassesPageProps) {
  // Separate courses by status
  const currentCourses = courses.filter((c) => c.status === "IN_PROGRESS");
  const completedCourses = courses.filter((c) => c.status === "COMPLETED");
  const nextSemesterCourses = courses.filter((c) => c.status === "NEXT_SEMESTER");

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">Classes</h2>
        <p className="text-gray-600">
          Track your current and completed classes, view grades, and explore suggested future
          courses.
        </p>
      </div>

      {/* Overview Bar */}
      <div className="grid grid-cols-3 gap-6 border rounded-lg p-6">
        <div>
          <p className="text-sm text-gray-500">Current Classes</p>
          <p className="text-2xl font-bold">{currentCourses.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Completed Classes</p>
          <p className="text-2xl font-bold">{completedCourses.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Next Semester</p>
          <p className="text-2xl font-bold">{nextSemesterCourses.length}</p>
        </div>
      </div>

      {/* Current Classes */}
      <section>
        <h2 className="text-xl font-bold mb-4">Current Classes</h2>
        {currentCourses.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400">
            No current classes. Add classes from your Profile page.
          </div>
        ) : (
          <div className="grid gap-4">
            {currentCourses.map((c) => (
              <div
                key={c.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{c.course.name}</p>
                  <p className="text-sm text-gray-500">{c.course.department}</p>
                </div>
                <span
                  className="px-3 py-1 text-sm font-medium rounded-full"
                  style={{ backgroundColor: "var(--button-color)", color: "var(--foreground)" }}
                >
                  {c.grade || "In Progress"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Classes */}
      <section>
        <h2 className="text-xl font-bold mb-4">Completed Classes</h2>
        {completedCourses.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-400">
            No completed classes yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {completedCourses.map((c) => (
              <div key={c.id} className="border rounded p-3 flex justify-between">
                <p>{c.course.name}</p>
                <span
                  className="px-2 py-0.5 text-sm font-semibold rounded"
                  style={{ backgroundColor: "var(--button-color)", color: "var(--foreground)" }}
                >
                  {c.grade || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Next Semester */}
      {nextSemesterCourses.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Next Semester</h2>
          <div className="grid gap-3">
            {nextSemesterCourses.map((c) => (
              <div key={c.id} className="border rounded p-3 flex justify-between">
                <p>{c.course.name}</p>
                <span className="text-sm text-gray-500">{c.course.department}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}