import { CourseCatalogItem, StudentCourseData } from "../types";

type ClassesGridProps = {
    scheduleByGrade: Record<string, StudentCourseData[]>;
    courseMap: Record<string, CourseCatalogItem>;
    onDeleteRequest: (courseId: string, courseName: string) => void;
    onAddCourse: (gradeKey: "MS" | "9" | "10" | "11" | "12") => void;
    onEditCourse: (course: StudentCourseData) => void;
    currentGrade: number;
};

export default function ClassesGrid({
    scheduleByGrade,
    courseMap,
    onDeleteRequest,
    onAddCourse,
    onEditCourse,
    currentGrade,
}: ClassesGridProps) {
    const isFutureGrade = (gradeKey: string) => {
        if (gradeKey === "MS") return false;
        const gradeNum = Number(gradeKey);
        return Number.isFinite(gradeNum) && gradeNum > currentGrade;
    };
    return (
        <section className="rounded-xl shadow-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span>🗓️</span> Projected 4-Year Plan
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Click any cell to add a course you’ve already taken or are currently taking.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-6 pb-6">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <strong className="font-semibold">
                        Only add courses you’ve taken or are taking.
                    </strong>
                    <span className="ml-2">Click any cell below to add them.</span>
                </div>
            </div>

            <div className="bg-white relative mt-2">
                <div className="flex divide-x divide-slate-200 border-b border-slate-200 bg-slate-50">
                    {[
                        { key: "MS", label: "Middle School" },
                        { key: "9", label: "9th Grade" },
                        { key: "10", label: "10th Grade" },
                        { key: "11", label: "11th Grade" },
                        { key: "12", label: "12th Grade" },
                    ].map((col) => (
                        <div
                            key={col.key}
                            className={`flex-1 p-4 text-center font-bold uppercase tracking-wide text-sm ${
                                isFutureGrade(col.key)
                                    ? "text-slate-400 bg-slate-50"
                                    : "text-slate-700"
                            }`}
                        >
                            {col.label}
                        </div>
                    ))}
                </div>
                <div className="flex divide-x divide-slate-200">
                    {["MS", "9", "10", "11", "12"].map((gradeKey) => {
                        const gradeCourses = scheduleByGrade[gradeKey] || [];
                        const isFuture = isFutureGrade(gradeKey);
                        const sortedCourses = [...gradeCourses].sort((a, b) => {
                            const statusRank: Record<string, number> = {
                                IN_PROGRESS: 0,
                                COMPLETED: 1,
                                PLANNED: 2,
                                NEXT_SEMESTER: 3,
                            };
                            const rankA = statusRank[a.status] ?? 9;
                            const rankB = statusRank[b.status] ?? 9;
                            if (rankA !== rankB) return rankA - rankB;

                            const normalizeDept = (dept?: string) => (dept || "").toLowerCase();
                            const subjectRank = (dept?: string) => {
                                const normalized = normalizeDept(dept);
                                if (normalized.includes("math")) return 0;
                                if (normalized.includes("english") || normalized.includes("ela"))
                                    return 1;
                                if (normalized.includes("science")) return 2;
                                if (normalized.includes("history") || normalized.includes("social"))
                                    return 3;
                                if (
                                    normalized.includes("foreign") ||
                                    normalized.includes("language")
                                )
                                    return 4;
                                return 5;
                            };

                            const subjectA = subjectRank(a.course.department);
                            const subjectB = subjectRank(b.course.department);
                            if (subjectA !== subjectB) return subjectA - subjectB;

                            return a.course.name.localeCompare(b.course.name, undefined, {
                                sensitivity: "base",
                            });
                        });
                        return (
                            <div
                                key={gradeKey}
                                className={`flex-1 divide-y divide-slate-100 ${
                                    isFuture ? "bg-slate-50/60" : ""
                                }`}
                            >
                                {sortedCourses.map((c) => {
                                    let statusClass = "hover:bg-indigo-50 border-transparent";
                                    let badge = null;
                                    let isClickable = false;
                                    let isEditable = false;
                                    let clickTitle: string | undefined;

                                    if (c.status === "COMPLETED") {
                                        statusClass =
                                            "bg-emerald-50/50 hover:bg-emerald-100 border-l-4 border-emerald-400 cursor-pointer";
                                        badge = (
                                            <span className="absolute top-1 right-1 text-[8px] font-bold text-emerald-600 bg-emerald-100 px-1 rounded">
                                                DONE
                                            </span>
                                        );
                                        isEditable = true;
                                        clickTitle = "Click to edit this course";
                                    } else if (c.status === "IN_PROGRESS") {
                                        statusClass =
                                            "bg-blue-50/50 hover:bg-blue-100 border-l-4 border-blue-400 cursor-pointer";
                                        badge = (
                                            <span className="absolute top-1 right-1 text-[8px] font-bold text-blue-600 bg-blue-100 px-1 rounded">
                                                NOW
                                            </span>
                                        );
                                        isEditable = true;
                                        clickTitle = "Click to edit this course";
                                    } else if (c.status === "PLANNED") {
                                        statusClass =
                                            "bg-indigo-50/30 hover:bg-indigo-100 border-l-4 border-indigo-400 cursor-pointer hover:bg-red-50 hover:border-red-400 transition-colors";
                                        badge = (
                                            <span className="absolute top-1 right-1 text-[8px] font-bold text-indigo-600 bg-indigo-100 px-1 rounded group-hover:bg-red-100 group-hover:text-red-600">
                                                PLAN
                                            </span>
                                        );
                                        isClickable = true;
                                        clickTitle = "Click to remove this planned course";
                                    }

                                    const meta = courseMap[c.course.name];
                                    const department = c.course.department;
                                    const detailParts = [
                                        department,
                                        meta?.level,
                                        meta?.credits ? `${meta.credits} cr` : undefined,
                                    ].filter(Boolean);

                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() =>
                                                !isFuture &&
                                                (isClickable
                                                    ? onDeleteRequest(c.id, c.course.name)
                                                    : isEditable
                                                      ? onEditCourse(c)
                                                      : undefined)
                                            }
                                            className={`relative p-2 h-20 flex flex-col items-center justify-center text-center text-sm transition-colors group ${statusClass}`}
                                            role={isClickable || isEditable ? "button" : undefined}
                                            title={clickTitle}
                                        >
                                            {badge}
                                            <span className="cursor-help border-b border-dotted border-slate-400/50 group-hover:border-slate-600">
                                                {c.course.name}
                                            </span>
                                            {detailParts.length > 0 && (
                                                <span className="mt-1 text-[10px] leading-tight text-slate-500">
                                                    {detailParts.join(" • ")}
                                                </span>
                                            )}

                                            {(meta || c.course) && (
                                                <div className="absolute hidden group-hover:block z-50 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none text-left">
                                                    <div className="font-bold mb-1 text-indigo-300">
                                                        {c.course.name}
                                                    </div>
                                                    <div className="flex gap-2 mb-1">
                                                        {meta?.level && (
                                                            <span className="bg-slate-700 px-1.5 rounded">
                                                                {meta.level}
                                                            </span>
                                                        )}
                                                        {meta?.credits && (
                                                            <span className="bg-slate-700 px-1.5 rounded">
                                                                {meta.credits} cr
                                                            </span>
                                                        )}
                                                        <span className="bg-slate-700 px-1.5 rounded">
                                                            {c.course.department}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {Array.from({
                                    length: Math.max(0, 8 - gradeCourses.length),
                                }).map((_, idx) => (
                                    <button
                                        key={`empty-${gradeKey}-${idx}`}
                                        type="button"
                                        onClick={() =>
                                            !isFuture &&
                                            onAddCourse(gradeKey as "MS" | "9" | "10" | "11" | "12")
                                        }
                                        disabled={isFuture}
                                        className={`w-full h-20 p-4 flex items-center justify-center text-center text-xs sm:text-sm transition-colors ${
                                            isFuture
                                                ? "text-slate-300 cursor-not-allowed"
                                                : "text-slate-500 hover:text-indigo-700 hover:bg-indigo-50/60"
                                        }`}
                                        title={
                                            isFuture
                                                ? "You can't add future courses here"
                                                : "Click to add a course you’ve already taken or are taking"
                                        }
                                    >
                                        <span className="font-medium">Study Hall</span>
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
