"use client";

import { Student } from "@prisma/client";

interface AboutMeSectionProps {
    student: Student;
    rigorLevels: string[];
}

export function AboutMeSection({ student, rigorLevels }: AboutMeSectionProps) {
    return (
        <div className="border rounded-lg p-6" style={{ borderColor: "var(--accent-background)" }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
                About Me
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Name</label>
                    <input
                        type="text"
                        name="name"
                        defaultValue={(student as any).user ? `${(student as any).user.firstName} ${(student as any).user.lastName}` : ""}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition"
                        style={{ borderColor: "var(--accent-background)" }}
                        placeholder="Your name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Grade Level
                    </label>
                    <div className="text-base font-medium text-slate-800">
                        {(() => {
                            switch (student.gradeLevel) {
                                case 9:
                                    return "Freshman (9th)";
                                case 10:
                                    return "Sophomore (10th)";
                                case 11:
                                    return "Junior (11th)";
                                case 12:
                                    return "Senior (12th)";
                                default:
                                    return `Grade ${student.gradeLevel || "N/A"}`;
                            }
                        })()}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Course Rigor Preference (Optional)
                    </label>
                    <select
                        name="desiredCourseRigor"
                        defaultValue={(student as any).desiredCourseRigor || ""}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition"
                        style={{ borderColor: "var(--accent-background)" }}
                    >
                        <option value="">No preference</option>
                        {rigorLevels.map((level) => (
                            <option key={level} value={level}>
                                {level}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Bio</label>
                    <textarea
                        name="bio"
                        defaultValue={student.bio || ""}
                        className="w-full px-4 py-2 border rounded-lg h-24 focus:ring-2 focus:border-transparent transition resize-none"
                        style={{ borderColor: "var(--accent-background)" }}
                        placeholder="Tell us about yourself..."
                    />
                </div>
            </div>
        </div>
    );
}
