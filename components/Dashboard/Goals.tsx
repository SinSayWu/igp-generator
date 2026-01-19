"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { addGoal } from "@/app/actions/add-goal";
import { deleteGoal } from "@/app/actions/delete-goal";
import { toggleGoal } from "@/app/actions/toggle-goal";
import { toggleGoalStep } from "@/app/actions/toggle-goal-step";
import { suggestGoals } from "@/app/actions/suggest-goals";
import ReactMarkdown from "react-markdown";

type Step = {
    id: string;
    title: string;
    completed: boolean;
};

type Goal = {
    id: string;
    title: string;
    priority: string;
    completed: boolean; // Mapped from status === "COMPLETED"
    status: string;
    steps?: any; // JSON from DB
    aiAnalysis?: string | null;
    metadata?: any;
};

// Helper to map DB goal to UI goal
function mapGoal(g: any): Goal {
    let parsedSteps: Step[] = [];
    if (Array.isArray(g.steps)) {
        parsedSteps = g.steps;
    }
    
    return {
        id: g.id,
        title: g.title,
        priority: g.priority,
        status: g.status,
        completed: g.status === "COMPLETED",
        steps: parsedSteps,
        aiAnalysis: g.aiAnalysis,
        metadata: g.metadata,
    };
}

function getPriorityLabel(priority: string) {
    // Legacy support if priority is number (should fit new schema though)
    return priority;
}

function getPriorityColor(priority: string) {
    if (priority === "High") return "text-red-600";
    if (priority === "Medium") return "text-yellow-600";
    return "text-green-600";
}

type GoalsProps = {
    user: {
        firstName: string;
        lastName: string;
        role: string;
    };
    goals: any[];
};

export default function Goals({ user, goals: initialGoals }: GoalsProps) {
    const [isMutating, startTransition] = useTransition();
    const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
    
    // Add Goal State
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newPriority, setNewPriority] = useState("Medium");
    
    // Suggestion State
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const goals = initialGoals.map(mapGoal);

    const activeGoals = goals.filter(g => !g.completed);
    const completedGoals = goals.filter(g => g.completed);
    
    // Simple progress calculation
    const calculatedProgress = goals.length > 0 
        ? Math.round((completedGoals.length / goals.length) * 100) 
        : 0;

    const allStages = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const currentStage = Math.floor(calculatedProgress / 10) * 10;

    const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

    const handleAddGoal = async () => {
        if (!newTitle.trim()) return;
        setIsAdding(true);
        startTransition(async () => {
            await addGoal(newTitle, newPriority);
            setNewTitle("");
            setIsAdding(false);
        });
    };
    
    const handleSuggestGoals = async () => {
        setIsSuggesting(true);
        const result = await suggestGoals();
        setIsSuggesting(false);
        if (result.success && result.suggestions) {
            setSuggestions(result.suggestions);
            setShowSuggestions(true);
        }
    };
    
    const handleApproveSuggestion = async (suggestion: any) => {
        startTransition(async () => {
            await addGoal(suggestion.title, suggestion.priority);
        });
        // Remove from list
        setSuggestions(prev => prev.filter(s => s !== suggestion));
        if (suggestions.length <= 1) setShowSuggestions(false);
    };

    const handleToggleGoal = (id: string, status: string) => {
        startTransition(async () => {
            await toggleGoal(id, status);
        });
    };

    const confirmDelete = () => {
        if (!goalToDelete) return;
        startTransition(async () => {
            await deleteGoal(goalToDelete.id);
            setGoalToDelete(null);
        });
    };

    const handleToggleStep = (goalId: string, stepId: string) => {
        startTransition(async () => {
            await toggleGoalStep(goalId, stepId);
        });
    };

    return (
        <div className="flex flex-col gap-6 relative">
            {/* Delete Confirmation Modal */}
            {goalToDelete && (
                <div className="fixed inset-0 flex items-center justify-center z-[100]">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setGoalToDelete(null)}
                    ></div>

                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 z-10 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <svg
                                    className="w-6 h-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Goal?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to delete <span className="font-bold text-gray-800">"{goalToDelete.title}"</span>?
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setGoalToDelete(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Suggestions Modal */}
            {showSuggestions && (
                <div className="fixed inset-0 flex items-center justify-center z-[100]">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowSuggestions(false)}
                    ></div>

                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 z-10 animate-in fade-in zoom-in duration-200 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">✨ Recommended Goals</h3>
                            <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        
                        <div className="space-y-4">
                            {suggestions.map((suggestion, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-lg text-gray-800">{suggestion.title}</h4>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                                    suggestion.priority === "High" ? "bg-red-50 text-red-700 border-red-200" :
                                                    suggestion.priority === "Medium" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                                    "bg-green-50 text-green-700 border-green-200"
                                                }`}>
                                                    {suggestion.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 italic">"{suggestion.reason}"</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button 
                                                onClick={() => setSuggestions(prev => prev.filter(s => s !== suggestion))}
                                                className="px-3 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                Dismiss
                                            </button>
                                            <button 
                                                onClick={() => handleApproveSuggestion(suggestion)}
                                                className="px-3 py-1.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {suggestions.length === 0 && (
                                <p className="text-center text-gray-500 py-8">All suggestions handled! Good luck!</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold">Goals</h2>
                    <p className="text-gray-600">
                        Track your progress and achieve your goals.
                    </p>
                </div>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: "30% 70%" }}>
                {/* Visual Progress */}
                <div className="border border-black rounded-xl p-2 flex flex-col items-center justify-center bg-white">
                    <div className="border border-black rounded-xl p-2 w-full h-[300px] flex overflow-hidden relative">
                        {allStages.map((stage) => (
                            <div
                                key={stage}
                                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                    currentStage === stage ? "opacity-100 z-10" : "opacity-0 z-0"
                                }`}
                            >
                                <Image
                                    src={`/Climb/${stage}.png`}
                                    alt={`Mountain Progress ${stage}%`}
                                    fill
                                    className="object-cover rounded"
                                />
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 font-bold text-lg">{calculatedProgress}% Completed</p>
                </div>

                {/* Goals List */}
                <div className="border border-black rounded-2xl p-6 flex flex-col gap-6 bg-white">
                    {/* Add Goal Form */}
                    <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="font-bold text-sm text-gray-700">Add a New Goal</h3>
                             <button
                                onClick={handleSuggestGoals}
                                disabled={isSuggesting}
                                className="text-xs font-bold text-white bg-[#d70026] hover:bg-[#b00020] px-3 py-1.5 rounded-lg border border-black transition-colors"
                             >
                                {isSuggesting ? "Thinking..." : "Suggest Goals"}
                             </button>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                placeholder="e.g. Qualify for AIME, Learn Python..."
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                disabled={isAdding}
                                onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
                            />
                            <select 
                                className="border rounded-lg px-3 py-2 text-sm"
                                value={newPriority}
                                onChange={(e) => setNewPriority(e.target.value)}
                                disabled={isAdding}
                            >
                                <option value="High">High Priority</option>
                                <option value="Medium">Medium Priority</option>
                                <option value="Low">Low Priority</option>
                            </select>
                            <button 
                                className="bg-[#d70026] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#b00020] border border-black disabled:opacity-50"
                                onClick={handleAddGoal}
                                disabled={isAdding || !newTitle.trim()}
                            >
                                {isAdding ? "Saving..." : "Add"}
                            </button>
                        </div>
                        {isAdding && <p className="text-xs text-indigo-600 animate-pulse">AI is analyzing goal feasibility and generating steps...</p>}
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {goals.length === 0 && <p className="text-gray-500 text-center py-4">No goals set yet. Add one above!</p>}
                        
                        {goals.sort((a,b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map((goal) => (
                            <div
                                key={goal.id}
                                className={`flex flex-col border border-black rounded-xl transition-all duration-300 overflow-hidden ${
                                    goal.completed ? "bg-gray-50 opacity-70" : "bg-white"
                                }`}
                            >
                                <div className="flex items-start justify-between p-4 gap-4">
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                            <p className={`font-bold text-lg leading-tight ${goal.completed ? "line-through text-gray-500" : ""}`}>
                                                {goal.title}
                                            </p>
                                            <span className={`self-start sm:self-auto text-xs font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                                goal.priority === "High" ? "bg-red-50 text-red-700 border-red-200" :
                                                goal.priority === "Medium" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                                "bg-green-50 text-green-700 border-green-200"
                                            }`}>
                                                {goal.priority}
                                            </span>
                                        </div>
                                        <p className="text-xs text-red-700 font-semibold mt-1">
                                            {expandedGoalId === goal.id ? "Click to collapse" : "Click to view AI plan"}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleToggleGoal(goal.id, goal.status)}
                                            className={`px-4 py-2 text-sm font-bold border border-black rounded-xl transition-colors ${
                                                goal.completed
                                                    ? "bg-gray-200 text-gray-500 hover:bg-gray-300"
                                                    : "bg-[var(--button-color)] hover:bg-[var(--button-color-2)]"
                                            }`}
                                        >
                                            {goal.completed ? "Undo" : "Complete"}
                                        </button>
                                        <button 
                                            onClick={() => setGoalToDelete(goal)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete Goal"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedGoalId === goal.id && (
                                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                        {/* Metadata Display */}
                                        {goal.metadata && (Object.keys(goal.metadata).length > 0) && (
                                            <div className="flex flex-wrap gap-3 mb-4 text-xs font-semibold text-gray-600">
                                                {goal.metadata.location && (
                                                    <div className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded">
                                                        <span>📍</span>
                                                        <span>
                                                            {typeof goal.metadata.location === 'object' 
                                                                ? `${goal.metadata.location.city}, ${goal.metadata.location.state}`
                                                                : goal.metadata.location}
                                                        </span>
                                                    </div>
                                                )}
                                                {goal.metadata.time_of_year && (
                                                    <div className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded">
                                                        <span>🗓️</span>
                                                        <span>{goal.metadata.time_of_year}</span>
                                                    </div>
                                                )}
                                                {goal.metadata.time_commitment && (
                                                    <div className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded">
                                                        <span>⏱️</span>
                                                        <span>
                                                            {typeof goal.metadata.time_commitment === 'object'
                                                                ? `${goal.metadata.time_commitment.duration_weeks ? goal.metadata.time_commitment.duration_weeks + " weeks" : ""} ${goal.metadata.time_commitment.schedule || ""}`
                                                                : goal.metadata.time_commitment}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {goal.aiAnalysis && (
                                            <div className="mb-4 text-sm text-gray-700 prose prose-sm max-w-none bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                <p className="font-bold text-blue-800 mb-1"> AI Analysis:</p>
                                                <ReactMarkdown>{goal.aiAnalysis}</ReactMarkdown>
                                            </div>
                                        )}
                                        
                                        {goal.steps && Array.isArray(goal.steps) && goal.steps.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="font-bold text-sm text-gray-800">Action Plan:</p>
                                                {goal.steps.map((step: Step, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3 bg-white p-2 rounded border border-gray-200">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={step.completed} 
                                                            onChange={() => handleToggleStep(goal.id, step.id)}
                                                            className="mt-1"
                                                        />
                                                        <span className={`text-sm ${step.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                                                            {step.title}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
