import { CourseCatalogItem, StudentCourseData } from "../types";

type ClassesGridProps = {
    scheduleByGrade: Record<string, StudentCourseData[]>;
    courseMap: Record<string, CourseCatalogItem>;
    onDeleteRequest: (courseId: string, courseName: string) => void;
    onAddCourse: (gradeKey: "MS" | "9" | "10" | "11" | "12", onlyHalf?: boolean) => void;
    onEditCourse: (course: StudentCourseData) => void;
    currentGrade: number;
    generatingFuture: boolean;
};

export default function ClassesGrid({
    scheduleByGrade,
    courseMap,
    onDeleteRequest,
    onAddCourse,
    onEditCourse,
    currentGrade,
    generatingFuture,
}: ClassesGridProps) {
    const isFutureGrade = (gradeKey: string) => {
        if (gradeKey === "MS") return false;
        const gradeNum = Number(gradeKey);
        return Number.isFinite(gradeNum) && gradeNum > currentGrade;
    };

    const getCredits = (courseName: string) => {
        const credits = courseMap[courseName]?.credits;
        return typeof credits === "number" && !Number.isNaN(credits) ? credits : 1;
    };

    const buildSlots = (courses: StudentCourseData[]) => {
        const halfCredit: StudentCourseData[] = [];
        const fullCredit: StudentCourseData[][] = [];

        courses.forEach((course) => {
            const credits = getCredits(course.course.name);
            if (credits === 0.5) {
                halfCredit.push(course);
            } else {
                fullCredit.push([course]);
            }
        });

        const halfSlots: StudentCourseData[][] = [];
        for (let i = 0; i < halfCredit.length; i += 2) {
            halfSlots.push(halfCredit.slice(i, i + 2));
        }

        return [...fullCredit, ...halfSlots];
    };
    return (
        <section className="rounded-2xl border border-black bg-white">
            <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-black">
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
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <strong className="font-semibold">
                        Only add courses you’ve taken or are taking.
                    </strong>
                    <span className="ml-2">Click any cell below to add them.</span>
                </div>
            </div>

            <div className="bg-white relative mt-2">
                <div className="flex divide-x divide-black border-b border-black bg-slate-50">
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
                <div className="flex divide-x divide-black">
                    {["MS", "9", "10", "11", "12"].map((gradeKey) => {
                        const gradeCourses = scheduleByGrade[gradeKey] || [];
                        const isFuture = isFutureGrade(gradeKey);
                        const currentGradeKey = currentGrade < 9 ? "MS" : String(currentGrade);
                        const isCurrentGrade = gradeKey === currentGradeKey;
                        const showLoading = generatingFuture && isFuture;
                        const showCurrentStudyHallLoading = generatingFuture && isCurrentGrade;
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
                        const slots = buildSlots(sortedCourses);
                        return (
                            <div
                                key={gradeKey}
                                className={`relative flex-1 divide-y divide-black/10 ${
                                    showLoading ? "overflow-hidden" : ""
                                }`}
                            >
                                {showLoading && (
                                    <div className="pointer-events-none absolute inset-0 z-10">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 via-fuchsia-200 to-cyan-200 opacity-90 animate-pulse" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-indigo-700 shadow">
                                                Generating future classes…
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className={showLoading ? "relative opacity-40" : undefined}>
                                    {slots.map((slot, slotIndex) => {
                                        const isHalfSlot =
                                            slot.length === 1 &&
                                            getCredits(slot[0].course.name) === 0.5;
                                        const isSingleFull =
                                            slot.length === 1 &&
                                            getCredits(slot[0].course.name) !== 0.5;

                                        const renderCourse = (c: StudentCourseData) => {
                                            let statusClass = "border-transparent";
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
                                                    "bg-amber-50/60 hover:bg-amber-100 border-l-4 border-amber-400 cursor-pointer hover:bg-red-50 hover:border-red-400 transition-colors";
                                                badge = (
                                                    <span className="absolute top-1 right-1 text-[8px] font-bold text-amber-700 bg-amber-100 px-1 rounded group-hover:bg-red-100 group-hover:text-red-600">
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

                                            const canEdit = !isFuture && isEditable;
                                            const canDelete = isClickable;
                                            const canInteract = canEdit || canDelete;

                                            return (
                                                <div
                                                    key={c.id}
                                                    onClick={() =>
                                                        canInteract
                                                            ? canDelete
                                                                ? onDeleteRequest(
                                                                      c.id,
                                                                      c.course.name
                                                                  )
                                                                : onEditCourse(c)
                                                            : undefined
                                                    }
                                                    className={`relative h-full w-full px-2 py-1 rounded text-center text-xs transition-colors group ${statusClass}`}
                                                    role={canInteract ? "button" : undefined}
                                                    title={clickTitle}
                                                >
                                                    {badge}
                                                    <span className="cursor-help border-b border-dotted border-slate-400/50 group-hover:border-slate-600 font-semibold">
                                                        {c.course.name}
                                                    </span>
                                                    {detailParts.length > 0 && (
                                                        <span className="block text-[10px] text-slate-500 mt-0.5">
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
                                        };

                                        if (isSingleFull) {
                                            return (
                                                <div
                                                    key={`slot-${gradeKey}-${slotIndex}`}
                                                    className={`relative p-2 h-20 text-sm transition-colors ${
                                                        isFuture ? "" : "hover:bg-slate-50"
                                                    }`}
                                                >
                                                    {renderCourse(slot[0])}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={`slot-${gradeKey}-${slotIndex}`}
                                                className={`relative p-2 h-20 text-sm transition-colors ${
                                                    isFuture ? "" : "hover:bg-slate-50"
                                                }`}
                                            >
                                                <div className="grid grid-cols-2 gap-2 h-full">
                                                    <div className="h-full">
                                                        {slot[0] ? renderCourse(slot[0]) : null}
                                                    </div>
                                                    <div className="h-full">
                                                        {slot[1] ? (
                                                            renderCourse(slot[1])
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    !isFuture &&
                                                                    onAddCourse(
                                                                        gradeKey as
                                                                            | "MS"
                                                                            | "9"
                                                                            | "10"
                                                                            | "11"
                                                                            | "12",
                                                                        true
                                                                    )
                                                                }
                                                                disabled={isFuture}
                                                                className={`w-full h-full rounded border border-dashed text-xs transition-colors ${
                                                                    isFuture
                                                                        ? "text-slate-300 cursor-not-allowed"
                                                                        : showCurrentStudyHallLoading
                                                                          ? "text-indigo-700 border-indigo-300 bg-gradient-to-br from-indigo-200 via-fuchsia-200 to-cyan-200 animate-pulse"
                                                                          : "text-slate-400 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50/60"
                                                                }`}
                                                                title={
                                                                    isFuture
                                                                        ? "You can't add future courses here"
                                                                        : "Add another 0.5 credit course"
                                                                }
                                                            >
                                                                Study Hall
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Array.from({
                                        length: Math.max(0, 8 - slots.length),
                                    }).map((_, idx) => (
                                        <button
                                            key={`empty-${gradeKey}-${idx}`}
                                            type="button"
                                            onClick={() =>
                                                !isFuture &&
                                                onAddCourse(
                                                    gradeKey as "MS" | "9" | "10" | "11" | "12"
                                                )
                                            }
                                            disabled={isFuture}
                                            className={`w-full h-20 p-4 flex items-center justify-center text-center text-xs sm:text-sm transition-colors ${
                                                isFuture
                                                    ? "text-slate-300 cursor-not-allowed"
                                                    : showCurrentStudyHallLoading
                                                      ? "text-indigo-700 border border-indigo-300 bg-gradient-to-br from-indigo-200 via-fuchsia-200 to-cyan-200 animate-pulse"
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
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
