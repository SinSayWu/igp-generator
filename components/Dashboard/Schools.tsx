"use client";

// Types matching the data from Shell
type CollegeData = {
  id: string;
  name: string;
  type: string;
};

type SchoolsProps = {
  colleges: CollegeData[];
};

export default function SchoolsPage({ colleges }: SchoolsProps) {
  // Group colleges by type
  const universities = colleges.filter((c) => c.type === "University");
  const technicalSchools = colleges.filter((c) => c.type === "Technical");

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">Schools</h2>
        <p className="text-gray-600">
          Browse and track your target colleges and schools to stay organized.
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-6 border rounded-lg p-6">
        <div>
          <p className="text-sm text-gray-500">Target Schools</p>
          <p className="text-2xl font-bold">{colleges.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Universities</p>
          <p className="text-2xl font-bold">{universities.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Technical / Trade</p>
          <p className="text-2xl font-bold">{technicalSchools.length}</p>
        </div>
      </div>

      {/* Target Schools List */}
      <section>
        <h2 className="text-xl font-bold mb-4">Your Target Schools</h2>
        {colleges.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400">
            No target schools added yet. Add schools from your Profile page.
          </div>
        ) : (
          <div className="grid gap-4">
            {colleges.map((college) => (
              <div
                key={college.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <p className="font-semibold">{college.name}</p>
                <span
                  className="px-3 py-1 text-sm font-medium rounded-full"
                  style={{ backgroundColor: "var(--button-color)", color: "var(--foreground)" }}
                >
                  {college.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
