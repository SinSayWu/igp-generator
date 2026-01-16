"use client";

type School = {
  id: string;
  name: string;
  status: "in progress" | "applied" | "accepted" | "waitlist" | "rejected";
  decision?: string;
};

type SuggestedSchool = {
  id: string;
  name: string;
  reason: string;
  fit: "Safety" | "Match" | "Reach";
};

export default function SchoolsPage() {
  // Example current and completed applications
  const currentApplications: School[] = [
    { id: "s1", name: "University of Michigan", status: "in progress" },
    { id: "s2", name: "Johns Hopkins University", status: "applied" },
    { id: "s3", name: "Tufts University", status: "waitlist" },
  ];

  const completedApplications: School[] = [
    { id: "s4", name: "Duke University", status: "accepted", decision: "Accepted with scholarship" },
    { id: "s5", name: "Cornell University", status: "rejected", decision: "Rejected" },
  ];

  const suggestedSchools: SuggestedSchool[] = [
    { id: "g1", name: "Harvard University", reason: "Top BME program", fit: "Reach" },
    { id: "g2", name: "Vanderbilt University", reason: "Strong undergraduate research opportunities", fit: "Match" },
    { id: "g3", name: "Rice University", reason: "Great campus culture & collaborative environment", fit: "Match" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
  <h2 className="text-2xl font-bold">Schools</h2>
  <p className="text-gray-600">
    Browse and track your college applications and school targets to stay organized.
  </p>
</div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-6 border rounded-lg p-6">
        <div>
          <p className="text-sm text-gray-500">Applications Submitted</p>
          <p className="text-2xl font-bold">{currentApplications.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Decisions Received</p>
          <p className="text-2xl font-bold">{completedApplications.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Suggested Schools</p>
          <p className="text-2xl font-bold">{suggestedSchools.length}</p>
        </div>
      </div>

      {/* Current Applications */}
      <section>
        <h2 className="text-xl font-bold mb-4">Current Applications</h2>
        <div className="grid gap-4">
          {currentApplications.map(school => (
            <div key={school.id} className="border rounded-lg p-4 flex justify-between items-center">
              <p className="font-semibold">{school.name}</p>
              <span className="capitalize font-bold">{school.status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Completed Applications */}
      <section>
        <h2 className="text-xl font-bold mb-4">Completed Applications</h2>
        <div className="grid gap-3">
          {completedApplications.map(school => (
            <div key={school.id} className="border rounded p-3 flex justify-between">
              <p>{school.name}</p>
              <p className="font-semibold">{school.decision}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Suggested Schools */}
      <section>
        <h2 className="text-xl font-bold mb-4">Suggested Schools</h2>
        <div className="grid gap-4">
          {suggestedSchools.map(school => (
            <div key={school.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold">{school.name}</p>
                <span className="text-sm font-bold">{school.fit}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{school.reason}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
