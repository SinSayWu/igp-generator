"use client";

type Activity = {
  id: string;
  name: string;
  role: string;
  term: string;
  status: "current" | "completed";
};

type SuggestedActivity = {
  id: string;
  name: string;
  reason: string;
  priority: "Low" | "Medium" | "High";
  suggestions: string[]; // personalized suggestions
};

export default function Extracurriculars() {
  const currentActivities: Activity[] = [
    { id: "a1", name: "Debate Club", role: "Member", term: "Spring 2026", status: "current" },
    { id: "a2", name: "Soccer Team", role: "Forward", term: "Spring 2026", status: "current" },
  ];

  const completedActivities: Activity[] = [
    { id: "a3", name: "Science Olympiad", role: "Team Captain", term: "Fall 2025", status: "completed" },
    { id: "a4", name: "Volunteer at Hospital", role: "Volunteer", term: "Summer 2025", status: "completed" },
  ];

  const suggestedActivities: SuggestedActivity[] = [
    {
      id: "s1",
      name: "Robotics Club",
      reason: "Enhances engineering skills",
      priority: "High",
      suggestions: [
        "Take on a leadership role in a project team",
        "Participate in a regional robotics competition",
      ],
    },
    {
      id: "s2",
      name: "Student Government",
      reason: "Builds leadership experience",
      priority: "Medium",
      suggestions: [
        "Run for a committee position",
        "Organize a school-wide event",
      ],
    },
    {
      id: "s3",
      name: "Chess Club",
      reason: "Improves strategic thinking",
      priority: "Low",
      suggestions: [
        "Compete in a local chess tournament",
        "Host a practice session for beginners",
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-10">
<div className="flex flex-col gap-6">
  <h2 className="text-2xl font-bold">Extracurriculars</h2>
  <p className="text-gray-600">
    Monitor your clubs, sports, volunteer work, and other activities to balance your schedule.
  </p>
</div>

      {/* Summary / Overview */}
      <div className="grid grid-cols-3 gap-6 border rounded-lg p-6">
        <div>
          <p className="text-sm text-gray-500">Current Activities</p>
          <p className="text-2xl font-bold">{currentActivities.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Completed Activities</p>
          <p className="text-2xl font-bold">{completedActivities.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Suggested Activities</p>
          <p className="text-2xl font-bold">{suggestedActivities.length}</p>
        </div>
      </div>

      {/* Current Activities */}
      <section>
        <h2 className="text-xl font-bold mb-4">Current Activities</h2>
        <div className="grid gap-4">
          {currentActivities.map(a => (
            <div key={a.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{a.name}</p>
                <p className="text-sm text-gray-500">{a.role} • {a.term}</p>
              </div>
              <span className="capitalize font-bold">{a.status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Completed Activities */}
      <section>
        <h2 className="text-xl font-bold mb-4">Completed Activities</h2>
        <div className="grid gap-3">
          {completedActivities.map(a => (
            <div key={a.id} className="border rounded p-3 flex justify-between">
              <p>{a.name}</p>
              <span className="font-semibold">{a.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Suggested Activities */}
      <section>
        <h2 className="text-xl font-bold mb-4">Suggested Activities</h2>
        <div className="grid gap-4">
          {suggestedActivities.map(s => (
            <div key={s.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold">{s.name}</p>
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
