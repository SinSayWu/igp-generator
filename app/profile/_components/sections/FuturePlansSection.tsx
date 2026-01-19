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

export function FuturePlansSection({
    plan,
    ncaa,
    colleges,
    selectedCollegeIds,
    onPlanChange,
    onCollegeToggle,
    onNcaaToggle,
}: FuturePlansSectionProps) {
    return (
        <div className="border border-black rounded-lg p-6 bg-white">
            <h2 className="text-xl font-bold mb-4 text-[#d70026]">
                Future Plans
            </h2>

            <select
                name="postHighSchoolPlan"
                value={plan}
                onChange={(e) => onPlanChange(e.target.value)}
                className="w-full border border-black p-3 rounded-xl mb-6 focus:ring-2 focus:ring-[#d70026] focus:border-transparent transition bg-white text-sm font-medium"
            >
                <option value="">-- Select a Plan --</option>
                <option value="4 Year College">4 Year College</option>
                <option value="2 Year College">2 Year College</option>
                <option value="Technical College">Technical College</option>
                <option value="Military">Military</option>
                <option value="Workforce">Workforce</option>
                <option value="Other">Other</option>
            </select>

            {/* COLLEGE SELECTION DROPDOWN */}
            {["4 Year College", "2 Year College", "Technical College", "Military"].includes(
                plan
            ) && (
                <div className="border border-black rounded-xl p-5 bg-slate-50">
                    <label className="block text-sm font-black text-gray-900 mb-4 uppercase tracking-tight">
                        Target Colleges
                    </label>

                    <div className="space-y-4">
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    onCollegeToggle(e.target.value);
                                    e.target.value = ""; // Reset dropdown
                                }
                            }}
                            className="w-full border border-black p-3 rounded-xl focus:ring-2 focus:ring-[#d70026] focus:border-transparent transition bg-white text-sm"
                        >
                            <option value="">-- Add a Target College --</option>
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
                                .filter(college => !selectedCollegeIds.includes(college.id))
                                .map((college) => (
                                    <option key={college.id} value={college.id}>
                                        {college.name} ({college.type})
                                    </option>
                                ))}
                        </select>

                        {/* Selected Colleges Display */}
                        <div className="grid gap-3">
                            {colleges
                                .filter(c => selectedCollegeIds.includes(c.id))
                                .map((college) => (
                                    <div
                                        key={college.id}
                                        className="p-3 border border-black rounded-xl bg-white flex flex-col"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-sm text-gray-900">
                                                {college.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onCollegeToggle(college.id)}
                                                className="text-[#d70026] hover:bg-red-50 p-1 rounded-full transition-colors"
                                                title="Remove"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {college.requirements.length > 0 && (
                                            <div className="mt-2 text-xs text-gray-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                <p className="font-black uppercase text-[9px] text-[#d70026] mb-1">Requirements:</p>
                                                <ul className="list-disc pl-4 space-y-0.5">
                                                    {college.requirements.map((req, i) => (
                                                        <li key={i}>{req}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* NCAA Toggle */}
                    <div className="mt-6 pt-4 border-t border-black flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="ncaa-checkbox"
                            checked={ncaa}
                            onChange={(e) => onNcaaToggle(e.target.checked)}
                            className="w-5 h-5 rounded border-black text-[#d70026] focus:ring-[#d70026]"
                        />
                        <label htmlFor="ncaa-checkbox" className="text-sm font-bold text-gray-800 cursor-pointer">
                            I am interested in NCAA Sports Recruiting
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
