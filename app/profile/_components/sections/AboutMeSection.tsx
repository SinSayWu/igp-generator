"use client";

import { Student } from "@prisma/client";

interface AboutMeSectionProps {
    student: Student & { user: { firstName: string; lastName: string } };
    rigorLevels: string[];
    bio: string;
    onBioChange: (val: string) => void;
    desiredCourseRigor: string;
    onRigorChange: (val: string) => void;
}

export function AboutMeSection({
    student,
    rigorLevels,
    bio,
    onBioChange,
    desiredCourseRigor,
    onRigorChange,
}: AboutMeSectionProps) {
    return (
        <div className="border rounded-lg p-6" style={{ borderColor: "var(--accent-background)" }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
                About Me
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Name</label>
                    <div className="text-base font-medium text-slate-800 py-2">
                        {student.user.firstName} {student.user.lastName}
                    </div>
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
                        value={desiredCourseRigor}
                        onChange={(e) => onRigorChange(e.target.value)}
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
                        value={bio}
                        onChange={(e) => onBioChange(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg h-24 focus:ring-2 focus:border-transparent transition resize-none"
                        style={{ borderColor: "var(--accent-background)" }}
                        placeholder="Tell us about yourself..."
                    />
                </div>
            </div>
        </div>
    );
}
