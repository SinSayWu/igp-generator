import type { RefObject } from "react";
import type { CourseStatus } from "@prisma/client";
import type { CourseCatalogItem } from "../types";

type PendingCourseData = {
    status: CourseStatus;
    grade: string;
    confidence: string;
    stress: string;
};

type AddCourseModalProps = {
    open: boolean;
    modalRef: RefObject<HTMLDivElement | null>;
    dropdownRef: RefObject<HTMLDivElement | null>;
    courseSearchRef: RefObject<HTMLInputElement | null>;
    selectedCourseId: string;
    editingCourseId: string | null;
    pendingCourseData: PendingCourseData;
    selectedGradeKey: "MS" | "9" | "10" | "11" | "12" | null;
    courseSearch: string;
    isCourseDropdownOpen: boolean;
    filteredCourses: CourseCatalogItem[];
    isMutating: boolean;
    onClose: () => void;
    onAddCourse: () => void;
    onDeleteCourse: () => void;
    onCourseSearchChange: (value: string) => void;
    onCourseSelect: (course: CourseCatalogItem) => void;
    setCourseDropdownOpen: (open: boolean) => void;
    setPendingCourseData: (updater: (prev: PendingCourseData) => PendingCourseData) => void;
    setPendingCourseDataValue: (next: PendingCourseData) => void;
    gradeKeyToConfidence: (gradeKey: "MS" | "9" | "10" | "11" | "12") => string;
    isPendingValid: () => boolean;
    currentGrade: number;
};

export default function AddCourseModal({
    open,
    modalRef,
    dropdownRef,
    courseSearchRef,
    selectedCourseId,
    editingCourseId,
    pendingCourseData,
    selectedGradeKey,
    courseSearch,
    isCourseDropdownOpen,
    filteredCourses,
    isMutating,
    onClose,
    onAddCourse,
    onDeleteCourse,
    onCourseSearchChange,
    onCourseSelect,
    setCourseDropdownOpen,
    setPendingCourseData,
    setPendingCourseDataValue,
    gradeKeyToConfidence,
    isPendingValid,
    currentGrade,
}: AddCourseModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                ref={modalRef}
                className="relative w-[900px] max-w-[96vw] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-visible flex flex-col"
            >
                <div className="px-8 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-lg font-semibold text-slate-800">
                        Add a taken or in-progress course
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-lg"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                    {selectedCourseId && (
                        <div className="bg-slate-50 rounded-2xl p-5 border border-indigo-100 animate-fadeIn space-y-5">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded">
                                    Course Details Required
                                </span>
                                <div className="h-px bg-indigo-100 flex-1"></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={pendingCourseData.status}
                                        onChange={(e) => {
                                            const nextStatus = e.target.value as CourseStatus;
                                            setPendingCourseData((prev) => ({
                                                ...prev,
                                                status: nextStatus,
                                                confidence:
                                                    nextStatus === "COMPLETED" && selectedGradeKey
                                                        ? gradeKeyToConfidence(selectedGradeKey)
                                                        : prev.confidence,
                                            }));
                                        }}
                                        className="w-full text-base border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="NEXT_SEMESTER" disabled>
                                            Next Semester (Not allowed here)
                                        </option>
                                        <option value="PLANNED" disabled>
                                            Planned (Not allowed here)
                                        </option>
                                    </select>
                                </div>

                                {(pendingCourseData.status === "COMPLETED" ||
                                    pendingCourseData.status === "IN_PROGRESS") && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Grade <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={pendingCourseData.grade}
                                            onChange={(e) =>
                                                setPendingCourseDataValue({
                                                    ...pendingCourseData,
                                                    grade: e.target.value,
                                                })
                                            }
                                            className="w-full text-base border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 invalid:border-red-300 invalid:text-red-600"
                                        >
                                            <option value="">-- Select Grade --</option>
                                            <option value="A+">A+</option>
                                            <option value="A">A</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B">B</option>
                                            <option value="B-">B-</option>
                                            <option value="C+">C+</option>
                                            <option value="C">C</option>
                                            <option value="C-">C-</option>
                                            <option value="D+">D+</option>
                                            <option value="D">D</option>
                                            <option value="D-">D-</option>
                                            <option value="F">F</option>
                                        </select>
                                    </div>
                                )}

                                {pendingCourseData.status === "COMPLETED" && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Completed in Grade{" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={pendingCourseData.confidence}
                                            onChange={(e) =>
                                                setPendingCourseDataValue({
                                                    ...pendingCourseData,
                                                    confidence: e.target.value,
                                                })
                                            }
                                            className="w-full text-base border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 invalid:border-red-300 invalid:text-red-600"
                                        >
                                            <option value="">-- Select Level --</option>
                                            <option value="middle">Middle School</option>
                                            <option value="9" disabled={currentGrade < 9}>
                                                9th Grade
                                            </option>
                                            <option value="10" disabled={currentGrade < 10}>
                                                10th Grade
                                            </option>
                                            <option value="11" disabled={currentGrade < 11}>
                                                11th Grade
                                            </option>
                                            <option value="12" disabled={currentGrade < 12}>
                                                12th Grade
                                            </option>
                                        </select>
                                    </div>
                                )}

                                {(pendingCourseData.status === "IN_PROGRESS" ||
                                    pendingCourseData.status === "NEXT_SEMESTER") && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                Confidence
                                            </label>
                                            <select
                                                value={pendingCourseData.confidence}
                                                onChange={(e) =>
                                                    setPendingCourseDataValue({
                                                        ...pendingCourseData,
                                                        confidence: e.target.value,
                                                    })
                                                }
                                                className="w-full text-base border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="VERY_LOW">Very Low</option>
                                                <option value="LOW">Low</option>
                                                <option value="NEUTRAL">Neutral</option>
                                                <option value="HIGH">High</option>
                                                <option value="VERY_HIGH">Very High</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                Stress
                                            </label>
                                            <select
                                                value={pendingCourseData.stress}
                                                onChange={(e) =>
                                                    setPendingCourseDataValue({
                                                        ...pendingCourseData,
                                                        stress: e.target.value,
                                                    })
                                                }
                                                className="w-full text-base border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="VERY_LOW">Very Low</option>
                                                <option value="LOW">Low</option>
                                                <option value="NEUTRAL">Neutral</option>
                                                <option value="HIGH">High</option>
                                                <option value="VERY_HIGH">Very High</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-200 px-8 py-6 bg-white overflow-visible">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1" ref={dropdownRef}>
                            <input
                                type="text"
                                value={courseSearch}
                                onChange={(e) => onCourseSearchChange(e.target.value)}
                                onFocus={() => setCourseDropdownOpen(true)}
                                placeholder="Search and add a course..."
                                className="w-full pl-4 pr-10 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                ref={courseSearchRef}
                            />
                            {isCourseDropdownOpen && (
                                <div className="absolute z-[90] left-0 right-0 bottom-full mb-2 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                                    {filteredCourses.length === 0 ? (
                                        <div className="p-4 text-base text-slate-500 text-center">
                                            No matches found
                                        </div>
                                    ) : (
                                        filteredCourses.map((course) => {
                                            const detail = [
                                                course.department,
                                                course.level,
                                                course.credits ? `${course.credits}cr` : "",
                                            ]
                                                .filter(Boolean)
                                                .join(" • ");
                                            return (
                                                <button
                                                    key={course.id}
                                                    type="button"
                                                    onClick={() => onCourseSelect(course)}
                                                    className="w-full text-left px-4 py-3 text-base hover:bg-slate-50 flex items-center justify-between group"
                                                >
                                                    <span className="font-medium text-slate-700 group-hover:text-indigo-700">
                                                        {course.name}
                                                    </span>
                                                    {detail && (
                                                        <span className="text-xs text-slate-400 group-hover:text-indigo-400">
                                                            {detail}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {editingCourseId && (
                                <button
                                    type="button"
                                    onClick={onDeleteCourse}
                                    disabled={isMutating}
                                    className={`
                                        px-5 py-3 rounded-lg text-base font-semibold transition-all
                                        ${
                                            isMutating
                                                ? "bg-rose-100 text-rose-300 cursor-not-allowed"
                                                : "bg-rose-500 text-white hover:bg-rose-600 hover:shadow-md active:scale-95"
                                        }
                                    `}
                                >
                                    Delete Course
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onAddCourse}
                                disabled={!selectedCourseId || !isPendingValid() || isMutating}
                                className={`
                                    px-6 py-3 rounded-lg text-base font-bold shadow-sm transition-all
                                    ${
                                        selectedCourseId && isPendingValid() && !isMutating
                                            ? "bg-slate-800 text-white hover:bg-slate-900 hover:shadow-md active:scale-95"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    }
                                `}
                            >
                                Add Course
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
