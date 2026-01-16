"use client";

import { useState } from "react";

type GoalItem = {
  id: string;
  title: string;
  priority: "Low" | "Medium" | "High";
  completed: boolean;
  steps?: { id: string; title: string; completed: boolean }[];
};

export default function Goals() {
  const [goals, setGoals] = useState<GoalItem[]>([
    { id: "g1", title: "Complete college application essays", priority: "High", completed: false, steps: [] },
    { id: "g2", title: "Schedule shadowing hours", priority: "High", completed: false, steps: [] },
  ]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalPriority, setNewGoalPriority] = useState<GoalItem["priority"]>("Medium");

  function toggleGoal(id: string) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  }

  function addGoal() {
    if (!newGoalTitle) return;
    setGoals(prev => [
      ...prev,
      {
        id: `g${prev.length + 1}`,
        title: newGoalTitle,
        priority: newGoalPriority,
        completed: false,
        steps: [],
      },
    ]);
    setNewGoalTitle("");
    setNewGoalPriority("Medium");
  }

  function addStep(goalId: string, stepTitle: string) {
    setGoals(prev =>
      prev.map(g =>
        g.id === goalId
          ? {
              ...g,
              steps: [...(g.steps || []), { id: `s${(g.steps?.length || 0) + 1}`, title: stepTitle, completed: false }],
            }
          : g
      )
    );
  }

  function toggleStep(goalId: string, stepId: string) {
    setGoals(prev =>
      prev.map(g =>
        g.id === goalId
          ? {
              ...g,
              steps: g.steps?.map(s => (s.id === stepId ? { ...s, completed: !s.completed } : s)),
            }
          : g
      )
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Goals</h2>
      <p className="text-gray-600">
        Set and track your academic and personal goals. Add steps to break down big goals into manageable actions.
      </p>

      {/* Add new goal */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={newGoalTitle}
          onChange={e => setNewGoalTitle(e.target.value)}
          placeholder="New goal title"
          className="border rounded px-2 py-1 flex-1"
        />
        <select
          value={newGoalPriority}
          onChange={e => setNewGoalPriority(e.target.value as GoalItem["priority"])}
          className="border rounded px-2 py-1"
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button onClick={addGoal} className="px-4 py-1 bg-var(--button-color) text-white rounded">
          Add Goal
        </button>
      </div>

      {/* Goal list */}
      <div className="grid gap-4">
        {goals
          .sort((a, b) => ({ High: 3, Medium: 2, Low: 1 }[b.priority] - { High: 3, Medium: 2, Low: 1 }[a.priority]))
          .map(goal => (
            <div key={goal.id} className={`border rounded-lg p-4 ${goal.completed ? "bg-green-100" : ""}`}>
              <div className="flex justify-between items-center">
                <p className="font-semibold">{goal.title}</p>
                <div className="flex gap-2 items-center">
                  <span className="text-sm font-bold">{goal.priority}</span>
                  <button
                    onClick={() => toggleGoal(goal.id)}
                    className={`px-3 py-1 font-bold rounded ${goal.completed ? "bg-gray-300 text-gray-600" : "bg-var(--button-color) text-white"}`}
                  >
                    {goal.completed ? "Undo" : "Complete"}
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="ml-4 mt-2 flex flex-col gap-2">
                {(goal.steps || []).map(step => (
                  <div key={step.id} className="flex justify-between items-center border rounded p-2">
                    <p className={`ml-2 ${step.completed ? "line-through text-gray-500" : ""}`}>{step.title}</p>
                    <button
                      onClick={() => toggleStep(goal.id, step.id)}
                      className={`px-2 py-0.5 rounded ${step.completed ? "bg-gray-300 text-gray-600" : "bg-var(--button-color) text-white"}`}
                    >
                      {step.completed ? "Undo" : "Done"}
                    </button>
                  </div>
                ))}
                {/* Add step placeholder */}
                <AddStepInput goalId={goal.id} addStep={addStep} />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// Component to add a step to a goal
function AddStepInput({ goalId, addStep }: { goalId: string; addStep: (goalId: string, stepTitle: string) => void }) {
  const [input, setInput] = useState("");
  return (
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="New step"
        className="border rounded px-2 py-1 flex-1"
      />
      <button
        onClick={() => {
          addStep(goalId, input);
          setInput("");
        }}
        className="px-3 py-1 bg-var(--button-color) text-white rounded"
      >
        Add Step
      </button>
    </div>
  );
}
