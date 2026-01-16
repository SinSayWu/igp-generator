"use client";

import { NationwideAct } from "@prisma/client";

interface NationwideActsSectionProps {
    acts: NationwideAct[];
    selectedIds: string[];
    onToggle: (id: string) => void;
}

export function NationwideActsSection({ acts, selectedIds, onToggle }: NationwideActsSectionProps) {
    return (
        <div className="border rounded-lg p-6" style={{ borderColor: "var(--accent-background)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
                Nationwide Organizations
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
                Select any major national organizations you are actively involved in.
            </p>

            <div className="flex flex-wrap gap-2">
                {acts.map((act) => {
                    const isSelected = selectedIds.includes(act.id);
                    return (
                        <button
                            key={act.id}
                            type="button"
                            onClick={() => onToggle(act.id)}
                            className={`px-4 py-2 rounded text-xs font-semibold transition-all border ${
                                isSelected ? act.color : "bg-white text-gray-700"
                            }`}
                            style={{
                                borderColor: isSelected
                                    ? "var(--foreground)"
                                    : "var(--accent-background)",
                            }}
                        >
                            {act.name}
                            {isSelected && <span className="ml-1">✓</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
