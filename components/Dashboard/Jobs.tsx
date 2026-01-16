"use client";

type JobItem = {
  id: string;
  title: string;
  company: string;
  term: string;
  status: "current" | "completed";
  roleDescription?: string;
};

type SuggestedJob = {
  id: string;
  title: string;
  reason: string;
  priority: "Low" | "Medium" | "High";
  suggestions: string[];
};

export default function Jobs() {
  const currentJobs: JobItem[] = [
    {
      id: "j1",
      title: "Lab Assistant",
      company: "Greenville Hospital",
      term: "Spring 2026",
      status: "current",
      roleDescription: "Assist with tumor research experiments and data entry",
    },
  ];

  const completedJobs: JobItem[] = [
    {
      id: "j2",
      title: "Intern",
      company: "Biotech Startup",
      term: "Summer 2025",
      status: "completed",
      roleDescription: "Shadowed lab processes and assisted in experiments",
    },
  ];

  const suggestedJobs: SuggestedJob[] = [
    {
      id: "s1",
      title: "Research Intern",
      reason: "Gain hands-on experience for biomedical and clinical research",
      priority: "High",
      suggestions: [
        "Reach out to university labs for summer internships",
        "Document lab work for your portfolio",
      ],
    },
    {
      id: "s2",
      title: "Software Internship",
      reason: "Strengthen coding and technical skills for BME projects",
      priority: "Medium",
      suggestions: [
        "Build a small project or tool for a local lab or club",
        "Learn Python for data analysis",
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-10">
<div className="flex flex-col gap-6">
  <h2 className="text-2xl font-bold">Jobs & Internships</h2>
  <p className="text-gray-600">
    Explore job and internship opportunities, and manage your career-building experiences.
  </p>
</div>

      {/* Overview / Summary */}
      <div className="grid grid-cols-3 gap-6 border rounded-lg p-6">
        <div>
          <p className="text-sm text-gray-500">Current Positions</p>
          <p className="text-2xl font-bold">{currentJobs.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Completed Positions</p>
          <p className="text-2xl font-bold">{completedJobs.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Suggested Jobs</p>
          <p className="text-2xl font-bold">{suggestedJobs.length}</p>
        </div>
      </div>

      {/* Current Jobs */}
      <section>
        <h2 className="text-xl font-bold mb-4">Current Jobs & Internships</h2>
        <div className="grid gap-4">
          {currentJobs.map(j => (
            <div key={j.id} className="border rounded-lg p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="font-semibold">{j.title}</p>
                <span className="text-sm font-bold capitalize">{j.status}</span>
              </div>
              <p className="text-gray-500">{j.company} • {j.term}</p>
              {j.roleDescription && <p className="text-sm text-gray-600">{j.roleDescription}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Completed Jobs */}
      <section>
        <h2 className="text-xl font-bold mb-4">Completed Jobs & Internships</h2>
        <div className="grid gap-3">
          {completedJobs.map(j => (
            <div key={j.id} className="border rounded p-3 flex justify-between">
              <div>
                <p className="font-semibold">{j.title}</p>
                <p className="text-sm text-gray-500">{j.company} • {j.term}</p>
              </div>
              <span className="capitalize font-bold">{j.status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Suggested Jobs */}
      <section>
        <h2 className="text-xl font-bold mb-4">Suggested Jobs & Internships</h2>
        <div className="grid gap-4">
          {suggestedJobs.map(s => (
            <div key={s.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold">{s.title}</p>
                <span className="text-sm font-bold">{s.priority}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{s.reason}</p>

              {/* Personalized suggestions */}
              <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                {s.suggestions.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
