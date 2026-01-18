"use client";

import { Program } from "@prisma/client";

interface PathwaysSectionProps {
    programs: Program[];
    selectedProgramIds: string[];
    onToggle: (id: string) => void;
}

export function PathwaysSection({ programs, selectedProgramIds, onToggle }: PathwaysSectionProps) {
    return (
        <div className="border rounded-lg p-6" style={{ borderColor: "var(--accent-background)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
                Pathways & Elective Focus
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
                Select the specialized programs or pathways you are currently pursuing at your
                school.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {programs.map((prog) => {
                    const isSelected = selectedProgramIds.includes(prog.id);
                    return (
                        <div
                            key={prog.id}
                            onClick={() => onToggle(prog.id)}
                            className={`p-4 rounded border cursor-pointer transition-all select-none ${
                                isSelected ? "bg-red-50" : "bg-white hover:bg-gray-50"
                            }`}
                            style={{
                                borderColor: isSelected
                                    ? "#d70026"
                                    : "var(--accent-background)",
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition ${
                                        isSelected ? "bg-[#d70026]" : ""
                                    }`}
                                    style={{ borderColor: "var(--accent-background)" }}
                                >
                                    {isSelected && (
                                        <svg
                                            className="w-3 h-3 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm">{prog.name}</h3>
                                    {prog.description && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            {prog.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
