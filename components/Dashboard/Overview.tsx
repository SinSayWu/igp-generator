"use client";

import { useState } from "react";
import DashboardShell from "./Shell";
import Image from "next/image";

type Goal = {
  id: string;
  title: string;
  weight: number;
  completed: boolean;
};

function getPriorityLabel(weight: number) {
  if (weight === 3) return "High";
  if (weight === 2) return "Medium";
  return "Low";
}

function getPriorityColor(weight: number) {
  if (weight === 3) return "text-red-600";
  if (weight === 2) return "text-yellow-600";
  return "text-green-600";
}

type OverviewProps = {
  user: {
    firstName: string;
    lastName: string;
    role: string;
  };
};

export default function Overview({ user }: OverviewProps) {
  const [goals, setGoals] = useState<Goal[]>([
    { id: "g1", title: "Complete profile setup", weight: 3, completed: false },
    { id: "g2", title: "Submit first college application", weight: 2, completed: false },
    { id: "g3", title: "Join a club", weight: 1, completed: false },
    { id: "g4", title: "Complete essay draft", weight: 1, completed: false },
    { id: "g5", title: "Schedule shadowing", weight: 3, completed: false },
  ]);

  const calculatedProgress = Math.round(
    (goals.filter(g => g.completed).reduce((sum, g) => sum + g.weight, 0) /
      goals.reduce((sum, g) => sum + g.weight, 0)) * 100
  );

  const imageMap: { [key: number]: string } = {
    0: "/Climb/0.png",
    10: "/Climb/10.png",
    20: "/Climb/20.png",
    30: "/Climb/30.png",
    40: "/Climb/40.png",
    50: "/Climb/50.png",
    60: "/Climb/60.png",
    70: "/Climb/70.png",
    80: "/Climb/80.png",
    90: "/Climb/90.png",
    100: "/Climb/100.png",
  };

  const currentStage = Math.floor(calculatedProgress / 10) * 10;
  const currentImage = imageMap[currentStage];

  function toggleGoal(id: string) {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, completed: !g.completed } : g)));
  }

const overviewGoals = [...goals]
  .filter(g => !g.completed)          // optional, but recommended
  .sort((a, b) => b.weight - a.weight)
  .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
  <h2 className="text-2xl font-bold">Overview</h2>
  <p className="text-gray-600">
    See your top goals and tasks, track progress, and get a snapshot of your overall achievements.
  </p>

      <div className="grid gap-6" style={{ gridTemplateColumns: "30% 70%" }}>
        <div className="border rounded-lg p-2 flex flex-col items-center justify-center">
          <div className="border-4 border-gray-300 rounded-lg p-2 w-full h-full flex overflow-hidden">
            <Image
                src={currentImage}
                alt={`Mountain Progress ${currentStage}%`}
                width={400}
                height={400}
                className="object-cover rounded"
                />
          </div>
          <p className="mt-2 font-semibold text-center"></p>
        </div>

        <div className="border rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-4">Task Overview</h2>
          {overviewGoals.map(goal => (
            <div
              key={goal.id}
              className={`flex items-center justify-between border p-4 rounded ${
                goal.completed ? "bg-green-100" : ""
              }`}
            >
              <div>
                <p className="font-semibold">{goal.title}</p>
                <p className={`text-sm font-semibold ${getPriorityColor(goal.weight)}`}>
                    Priority: {getPriorityLabel(goal.weight)}
                  </p>
              </div>
              <button
                onClick={() => toggleGoal(goal.id)}
                className={`px-4 py-2 font-bold rounded ${
                  goal.completed ? "bg-gray-300 text-gray-600" : "bg-var(--button-color)"
                }`}
              >
                {goal.completed ? "Undo" : "Complete"}
              </button>
            </div>
          ))}
        </div>
      </div>
  </div>
  );

}
