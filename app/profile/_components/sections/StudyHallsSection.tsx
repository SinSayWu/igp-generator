"use client";

interface StudyHallsSectionProps {
    isEnabled: boolean;
    minStudyHalls: number;
    maxStudyHalls: number;
    onToggle: (checked: boolean) => void;
    onMinChange: (val: number) => void;
    onMaxChange: (val: number) => void;
}

export function StudyHallsSection({
    isEnabled,
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
                    checked={isEnabled}
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

            {isEnabled && (
                <div
                    className="border rounded-lg p-6 space-y-8"
                    style={{ borderColor: "var(--accent-background)" }}
                >
                    {/* Dual Range Slider */}
                    <div className="relative pt-6 pb-2">
                        {/* Labels above slider */}
                        <div className="absolute top-0 left-0 -mt-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Min: {minStudyHalls}
                            </span>
                        </div>
                        <div className="absolute top-0 right-0 -mt-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Max: {maxStudyHalls}
                            </span>
                        </div>

                        {/* Track Background */}
                        <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-200 rounded-full -translate-y-1/2 overflow-hidden pointer-events-none">
                            {/* Active Range */}
                            {/* Active Range */}
                            <div
                                className="absolute h-full bg-[#d70026]"
                                style={{
                                    left: `${(minStudyHalls / 3) * 100}%`,
                                    right: `${100 - (maxStudyHalls / 3) * 100}%`,
                                }}
                            />
                        </div>

                        {/* Range Inputs */}
                        <div className="relative w-full h-2">
                            <input
                                type="range"
                                min="0"
                                max="3"
                                value={minStudyHalls}
                                onChange={(e) => {
                                    const val = Math.min(parseInt(e.target.value), maxStudyHalls);
                                    onMinChange(val);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#d70026] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:transition-transform z-[var(--min-z,20)]"
                                style={
                                    {
                                        "--min-z": minStudyHalls > 1 ? "20" : "10",
                                    } as React.CSSProperties
                                }
                            />
                            <input
                                type="range"
                                min="0"
                                max="3"
                                value={maxStudyHalls}
                                onChange={(e) => {
                                    const val = Math.max(parseInt(e.target.value), minStudyHalls);
                                    onMaxChange(val);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#d70026] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:transition-transform z-[var(--max-z,10)]"
                                style={
                                    {
                                        "--max-z": maxStudyHalls < 2 ? "20" : "10",
                                    } as React.CSSProperties
                                }
                            />
                        </div>

                        {/* Markers */}
                        <div className="flex justify-between w-full px-1 mt-2">
                            {[0, 1, 2, 3].map((num) => (
                                <div key={num} className="flex flex-col items-center gap-1">
                                    <div
                                        className={`w-0.5 h-1 ${num >= minStudyHalls && num <= maxStudyHalls ? "bg-red-300" : "bg-slate-300"}`}
                                    />
                                    <span
                                        className={`text-[10px] ${num >= minStudyHalls && num <= maxStudyHalls ? "font-bold text-[#d70026]" : "text-slate-400"}`}
                                    >
                                        {num}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-[#d70026] flex items-center gap-3">
                        <span className="text-2xl">📚</span>
                        <div>
                            <p className="font-bold">Study Hall Preference</p>
                            <p className="opacity-90">
                                You are willing to take between{" "}
                                <strong className="text-[#a70825]">{minStudyHalls}</strong> and{" "}
                                <strong className="text-[#a70825]">{maxStudyHalls}</strong> study
                                hall periods per year.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
