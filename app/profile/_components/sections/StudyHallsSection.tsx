"use client";

interface StudyHallsSectionProps {
    studyHalls: number;
    minStudyHalls: number;
    maxStudyHalls: number;
    onToggle: (checked: boolean) => void;
    onMinChange: (val: number) => void;
    onMaxChange: (val: number) => void;
}

export function StudyHallsSection({
    studyHalls,
    minStudyHalls,
    maxStudyHalls,
    onToggle,
    onMinChange,
    onMaxChange,
}: StudyHallsSectionProps) {
    return (
        <div className="border rounded-lg p-6" style={{ borderColor: "var(--accent-background)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
                Study Halls
            </h2>

            <div className="flex items-center gap-2 mb-4">
                <input
                    type="checkbox"
                    id="studyHallsToggle"
                    checked={studyHalls > 0}
                    onChange={(e) => onToggle(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                />
                <label
                    htmlFor="studyHallsToggle"
                    className="font-semibold text-gray-900 cursor-pointer text-sm"
                >
                    I want to add study halls
                </label>
            </div>

            {studyHalls > 0 && (
                <div
                    className="border rounded-lg p-4 space-y-4"
                    style={{ borderColor: "var(--accent-background)" }}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Minimum Study Halls
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="8"
                                    value={minStudyHalls}
                                    onChange={(e) => {
                                        const val = Math.max(
                                            1,
                                            Math.min(8, parseInt(e.target.value) || 1)
                                        );
                                        onMinChange(val);
                                    }}
                                    className="w-16 px-2 py-1 border rounded text-center text-sm focus:ring-2 focus:border-transparent"
                                    style={{ borderColor: "var(--accent-background)" }}
                                />
                                <span className="text-gray-700 text-sm">periods</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Maximum Study Halls
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="8"
                                    value={maxStudyHalls}
                                    onChange={(e) => {
                                        const val = Math.max(
                                            minStudyHalls,
                                            Math.min(8, parseInt(e.target.value) || minStudyHalls)
                                        );
                                        onMaxChange(val);
                                    }}
                                    className="w-16 px-2 py-1 border rounded text-center text-sm focus:ring-2 focus:border-transparent"
                                    style={{ borderColor: "var(--accent-background)" }}
                                />
                                <span className="text-gray-700 text-sm">periods</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 p-3 border rounded text-sm text-gray-800">
                        <span className="font-bold">Your range:</span> {minStudyHalls} -{" "}
                        {maxStudyHalls} study hall periods per year
                    </div>
                </div>
            )}
        </div>
    );
}
