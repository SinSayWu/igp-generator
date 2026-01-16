"use client";

type ClassItem = {
  id: string;
  name: string;
  term: string;
  credits: number;
  status: "current" | "completed";
  grade?: string;
};

type SuggestedClass = {
  id: string;
  name: string;
  reason: string;
  difficulty: "Safe" | "Recommended" | "Stretch";
};

export default function ClassesPage() {
  const currentClasses: ClassItem[] = [
    { id: "c1", name: "AP Physics C", term: "Spring 2026", credits: 1, status: "current", grade: "A-" },
    { id: "c2", name: "AP Statistics", term: "Spring 2026", credits: 1, status: "current", grade: "A" },
    { id: "c3", name: "AP Spanish", term: "Spring 2026", credits: 1, status: "current", grade: "B+" },
  ];

  const completedClasses: ClassItem[] = [
    { id: "c4", name: "AP Biology", term: "Fall 2025", credits: 1, status: "completed", grade: "A" },
    { id: "c5", name: "Honors Chemistry", term: "Spring 2025", credits: 1, status: "completed", grade: "A-" },
  ];

  const suggestedClasses: SuggestedClass[] = [
    {
      id: "s1",
      name: "AP Calculus BC",
      reason: "Strong alignment with engineering & pre-med paths",
      difficulty: "Stretch",
    },
    {
      id: "s2",
      name: "Biomedical Research Seminar",
      reason: "Builds research depth early",
      difficulty: "Recommended",
    },
    {
      id: "s3",
      name: "AP Psychology",
      reason: "Balances STEM-heavy schedule",
      difficulty: "Safe",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
  <h2 className="text-2xl font-bold">Classes</h2>
  <p className="text-gray-600">
    Track your current and completed classes, view grades, and explore suggested future courses.
  </p>
</div>

        {/* Overview Bar */}
        <div className="grid grid-cols-3 gap-6 border rounded-lg p-6">
          <div>
            <p className="text-sm text-gray-500">Current GPA</p>
            <p className="text-2xl font-bold">4.0</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Credits In Progress</p>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Credits Completed</p>
            <p className="text-2xl font-bold">2</p>
          </div>
        </div>

        {/* Current Classes */}
        <section>
          <h2 className="text-xl font-bold mb-4">Current Classes</h2>
          <div className="grid gap-4">
            {currentClasses.map(c => (
              <div key={c.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.term} • {c.credits} credit</p>
                </div>
                <div className="text-lg font-bold">{c.grade}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Completed Classes */}
        <section>
          <h2 className="text-xl font-bold mb-4">Completed Classes</h2>
          <div className="grid gap-3">
            {completedClasses.map(c => (
              <div key={c.id} className="border rounded p-3 flex justify-between">
                <p>{c.name}</p>
                <p className="font-semibold">{c.grade}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Suggested Classes */}
        <section>
          <h2 className="text-xl font-bold mb-4">Suggested Next Classes</h2>
          <div className="grid gap-4">
            {suggestedClasses.map(s => (
              <div key={s.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{s.name}</p>
                  <span className="text-sm font-bold">{s.difficulty}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{s.reason}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
  )};