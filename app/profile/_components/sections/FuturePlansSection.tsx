"use client";

import { College } from "@prisma/client";

interface FuturePlansSectionProps {
    plan: string;
    ncaa: boolean;
    colleges: College[];
    selectedCollegeIds: string[];
    onPlanChange: (plan: string) => void;
    onCollegeToggle: (id: string) => void;
    onNcaaToggle: (checked: boolean) => void;
}

export function FutureePlansSection({
    plan,
    ncaa,
    colleges,
    selectedCollegeIds,
    onPlanChange,
    onCollegeToggle,
    onNcaaToggle,
}: FuturePlansSectionProps) {
    return (
        <div className="border rounded-lg p-6" style={{ borderColor: "var(--accent-background)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
                Future Plans
            </h2>

            <select
                name="postHighSchoolPlan"
                value={plan}
                onChange={(e) => onPlanChange(e.target.value)}
                className="w-full border p-2 rounded mb-6 focus:ring-2 focus:border-transparent transition bg-white text-sm"
                style={{ borderColor: "var(--accent-background)" }}
            >
                <option value="">-- Select a Plan --</option>
                <option value="4 Year College">4 Year College</option>
                <option value="2 Year College">2 Year College</option>
                <option value="Technical College">Technical College</option>
                <option value="Military">Military</option>
                <option value="Workforce">Workforce</option>
                <option value="Other">Other</option>
            </select>

            {/* COLLEGE SELECTION GRID */}
            {["4 Year College", "2 Year College", "Technical College", "Military"].includes(
                plan
            ) && (
                <div
                    className="border rounded-lg p-4"
                    style={{ borderColor: "var(--accent-background)" }}
                >
                    <label className="block text-sm font-bold text-gray-900 mb-4">
                        Select Target Colleges
                    </label>

                    <div className="space-y-3">
                        {colleges
                            .filter((college) => {
                                if (plan === "2 Year College" || plan === "Technical College")
                                    return college.type === "Technical";
                                if (plan === "4 Year College")
                                    return (
                                        college.type === "University" || college.type === "Military"
                                    );
                                if (plan === "Military") return college.type === "Military";
                                return true;
                            })
                            .map((college) => {
                                const isChecked = selectedCollegeIds.includes(college.id);
                                return (
                                    <div
                                        key={college.id}
                                        className={`p-3 border rounded transition-all ${
                                            isChecked ? "bg-yellow-50" : "bg-white"
                                        }`}
                                        style={{
                                            borderColor: isChecked
                                                ? "var(--foreground)"
                                                : "var(--accent-background)",
                                        }}
                                    >
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                value={college.id}
                                                checked={isChecked}
                                                onChange={() => onCollegeToggle(college.id)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="font-semibold text-sm text-gray-900">
                                                {college.name}
                                            </span>
                                        </label>

                                        {isChecked && (
                                            <div className="mt-2 text-xs text-gray-600 space-y-2">
                                                {college.requirements.length > 0 && (
                                                    <div>
                                                        <p className="font-bold text-xs">
                                                            Requirements:
                                                        </p>
                                                        <ul className="list-disc pl-5 space-y-0.5">
                                                            {college.requirements.map((req, i) => (
                                                                <li key={i} className="text-xs">
                                                                    {req}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {college.suggestions.length > 0 && (
                                                    <div>
                                                        <p className="font-bold text-xs">
                                                            Recommendations:
                                                        </p>
                                                        <ul className="list-disc pl-5 space-y-0.5">
                                                            {college.suggestions.map((sug, i) => (
                                                                <li key={i} className="text-xs">
                                                                    {sug}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>

                    {/* NCAA Toggle */}
                    <div
                        className="pt-3 border-t flex items-center space-x-2"
                        style={{ borderColor: "var(--accent-background)" }}
                    >
                        <input
                            type="checkbox"
                            checked={ncaa}
                            onChange={(e) => onNcaaToggle(e.target.checked)}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm font-medium text-gray-800">
                            I am interested in NCAA Sports Recruiting
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
