"use client";

interface SubjectInterestsSectionProps {
    subjectInterests: string[];
    onChange: (subjects: string[]) => void;
}

const AVAILABLE_SUBJECTS = [
    "Biology",
    "Chemistry",
    "Physics",
    "Math",
    "English",
    "History",
    "Art",
    "Music",
    "Technology",
    "Business",
];

export function SubjectInterestsSection({
    subjectInterests,
    onChange,
}: SubjectInterestsSectionProps) {
    return (
        <div className="border rounded-lg p-6" style={{ borderColor: "var(--accent-background)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
                Subject Interests
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
                Select the subjects you are passionate about to guide your course selections.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {AVAILABLE_SUBJECTS.map((subject) => {
                    const isSelected = subjectInterests.includes(subject);
                    return (
                        <label
                            key={subject}
                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all text-sm ${
                                isSelected ? "bg-red-50" : "bg-white"
                            }`}
                            style={{
                                borderColor: isSelected
                                    ? "#000000"
                                    : "var(--accent-background)",
                            }}
                        >
                            <input
                                type="checkbox"
                                name="subjectInterests"
                                value={subject}
                                checked={isSelected}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        onChange([...subjectInterests, subject]);
                                    } else {
                                        onChange(subjectInterests.filter((s) => s !== subject));
                                    }
                                }}
                                className="w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="text-xs">{subject}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
