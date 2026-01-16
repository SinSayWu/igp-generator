"use client";

import { Student } from "@prisma/client";

interface AboutMeSectionProps {
    student: Student;
}

export function AboutMeSection({ student }: AboutMeSectionProps) {
    return (
        <div className="border rounded-lg p-6" style={{ borderColor: "var(--accent-background)" }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
                About Me
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Grade Level
                    </label>
                    <select
                        name="gradeLevel"
                        defaultValue={student.gradeLevel || 9}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition"
                        style={{ borderColor: "var(--accent-background)" }}
                    >
                        <option value="9">Freshman (9th)</option>
                        <option value="10">Sophomore (10th)</option>
                        <option value="11">Junior (11th)</option>
                        <option value="12">Senior (12th)</option>
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
