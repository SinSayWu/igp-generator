"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CourseStatus } from "@prisma/client";
import { addCourse } from "@/app/actions/add-course";
import { deleteCourse } from "@/app/actions/delete-course";
import { updateCourseMetrics } from "@/app/actions/update-course-metrics";
import { CourseCatalogItem, StudentCourseData } from "../types";
import AddCourseModal from "./AddCourseModal";
import ClassesGrid from "./ClassesGrid";
import CourseCatalog from "./CourseCatalog";
import DebugModal from "./DebugModal";
import DeleteCourseModal from "./DeleteCourseModal";
import SummaryCards from "./SummaryCards";

type ClassesPageProps = {
    courses: StudentCourseData[];
    courseCatalog: CourseCatalogItem[];
    currentGrade: number;
};

type PendingCourseData = {
    status: CourseStatus;
    grade: string;
    confidence: string;
    stress: string;
};

const metricScale = ["VERY_LOW", "LOW", "NEUTRAL", "HIGH", "VERY_HIGH"] as const;
const metricLabels = ["Very Low", "Low", "Neutral", "High", "Very High"];
const metricTickLabels = ["Very Low", "Low", "Neutral", "High", "Very High"];

type MetricIndex = 0 | 1 | 2 | 3 | 4;

export default function ClassesPage({ courses, courseCatalog, currentGrade }: ClassesPageProps) {
    const router = useRouter();
    const [generating, setGenerating] = useState(false);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [isMutating, startTransition] = useTransition();

    const [debugInfo, setDebugInfo] = useState<{ draft: string; audit: string } | null>(null);
    const [showDebug, setShowDebug] = useState(false);

    const [courseToDelete, setCourseToDelete] = useState<{ id: string; name: string } | null>(null);

    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [editingCourseCatalogId, setEditingCourseCatalogId] = useState<string | null>(null);
    const [pendingCourseData, setPendingCourseData] = useState<PendingCourseData>({
        status: "COMPLETED",
        grade: "A+",
        confidence: "NEUTRAL",
        stress: "NEUTRAL",
    });
    const [courseSearch, setCourseSearch] = useState("");
    const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
    const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
    const [selectedGradeKey, setSelectedGradeKey] = useState<
        "MS" | "9" | "10" | "11" | "12" | null
    >(null);
    const [currentMetrics, setCurrentMetrics] = useState<
        Map<string, { stress: MetricIndex; confidence: MetricIndex }>
    >(new Map());

    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const courseSearchRef = useRef<HTMLInputElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    const handleDeleteRequest = (courseId: string, courseName: string) => {
        setCourseToDelete({ id: courseId, name: courseName });
    };

    const confirmDelete = async () => {
        if (!courseToDelete) return;

        const id = courseToDelete.id;
        setCourseToDelete(null);

        startTransition(async () => {
            await deleteCourse(id);
            router.refresh();
        });
    };

    const cancelDelete = () => {
        setCourseToDelete(null);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCourseDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (modalRef.current?.contains(target)) return;
            if (dropdownRef.current?.contains(target)) return;
            setIsAddCourseOpen(false);
        };

        if (isAddCourseOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isAddCourseOpen]);

    useEffect(() => {
        if (!isAddCourseOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isAddCourseOpen]);

    const currentCourses = useMemo(
        () => courses.filter((c) => c.status === "IN_PROGRESS"),
        [courses]
    );
    const completedCourses = useMemo(
        () => courses.filter((c) => c.status === "COMPLETED"),
        [courses]
    );
    const nextSemesterCourses = useMemo(
        () => courses.filter((c) => c.status === "NEXT_SEMESTER"),
        [courses]
    );
    const plannedCourses = useMemo(() => courses.filter((c) => c.status === "PLANNED"), [courses]);

    const metricIndexFromValue = (value?: string | null): MetricIndex => {
        if (!value) return 2;
        const idx = metricScale.indexOf(value as (typeof metricScale)[number]);
        return (idx >= 0 ? idx : 2) as MetricIndex;
    };

    const metricValueFromIndex = (index: number) =>
        metricScale[Math.min(Math.max(index, 0), metricScale.length - 1)];

    useEffect(() => {
        const next = new Map<string, { stress: MetricIndex; confidence: MetricIndex }>();
        currentCourses.forEach((course) => {
            next.set(course.courseId, {
                stress: metricIndexFromValue(course.stressLevel),
                confidence: metricIndexFromValue(course.confidenceLevel),
            });
        });
        setCurrentMetrics(next);
    }, [currentCourses]);

    const courseMap: Record<string, CourseCatalogItem> = {};
    courseCatalog.forEach((c) => {
        courseMap[c.name] = c;
    });

    const scheduleByGrade: Record<string, StudentCourseData[]> = {
        MS: [],
        "9": [],
        "10": [],
        "11": [],
        "12": [],
    };

    courses.forEach((c) => {
        let assignedGradeKey = "";
        const gl = c.gradeLevel;

        if (gl !== null && gl !== undefined) {
            if (gl < 9) {
                assignedGradeKey = "MS";
            } else {
                assignedGradeKey = gl.toString();
            }
        } else {
            const catalogEntry = courseMap[c.course.name];

            if (c.status === "IN_PROGRESS") {
                if (currentGrade < 9) assignedGradeKey = "MS";
                else assignedGradeKey = currentGrade.toString();
            } else if (c.status === "PLANNED") {
                const next = currentGrade + 1;
                if (next < 9) assignedGradeKey = "MS";
                else assignedGradeKey = next.toString();
            } else if (c.status === "COMPLETED") {
                if (
                    catalogEntry &&
                    catalogEntry.availableGrades &&
                    catalogEntry.availableGrades.length > 0
                ) {
                    const minGrade = Math.min(...catalogEntry.availableGrades);

                    if (minGrade >= 9) {
                        assignedGradeKey = minGrade.toString();
                    } else {
                        assignedGradeKey = "9";
                    }

                    const isCommonMS = [
                        "Algebra 1",
                        "Geometry",
                        "English 1",
                        "Physical Science",
                        "Computer Science Essentials",
                    ].some((n) => c.course.name.includes(n));
                    if (isCommonMS && currentGrade >= 10 && minGrade === 9) {
                        assignedGradeKey = "9";
                    }
                } else {
                    assignedGradeKey = Math.max(9, currentGrade - 1).toString();
                }
            }
        }

        if (assignedGradeKey) {
            if (scheduleByGrade[assignedGradeKey]) {
                scheduleByGrade[assignedGradeKey].push(c);
            } else if (["0", "7", "8"].includes(assignedGradeKey)) {
                scheduleByGrade["MS"].push(c);
            }
        }
    });

    const availableCourses = courseCatalog.filter(
        (c) => !courses.some((existing) => existing.courseId === c.id)
    );

    const filteredCourses = availableCourses.filter((course) => {
        if (!courseSearch) return true;
        const lowerSearch = courseSearch.toLowerCase();
        const detail = [
            course.department,
            course.level,
            course.credits ? `${course.credits}cr` : "",
        ]
            .filter(Boolean)
            .join(" • ")
            .toLowerCase();
        return course.name.toLowerCase().includes(lowerSearch) || detail.includes(lowerSearch);
    });

    const isPendingValid = () => {
        const { status, grade, confidence } = pendingCourseData;
        if (status === "COMPLETED") return !!grade && !!confidence;
        if (status === "IN_PROGRESS") return !!grade;
        return false;
    };

    const handleAddCourse = () => {
        if (!selectedCourseId || !isPendingValid()) return;
        if (
            pendingCourseData.status !== "COMPLETED" &&
            pendingCourseData.status !== "IN_PROGRESS"
        ) {
            return;
        }

        startTransition(async () => {
            if (
                editingCourseId &&
                editingCourseCatalogId &&
                selectedCourseId !== editingCourseCatalogId
            ) {
                await deleteCourse(editingCourseId);
            }
            await addCourse({
                courseId: selectedCourseId,
                status: pendingCourseData.status,
                grade: pendingCourseData.grade || undefined,
                confidence: pendingCourseData.confidence || undefined,
                stress: pendingCourseData.stress || undefined,
            });

            setSelectedCourseId("");
            setEditingCourseId(null);
            setEditingCourseCatalogId(null);
            setCourseSearch("");
            setPendingCourseData({
                status: "COMPLETED",
                grade: "A+",
                confidence: "NEUTRAL",
                stress: "NEUTRAL",
            });
            setIsCourseDropdownOpen(false);
            setIsAddCourseOpen(false);
            router.refresh();
        });
    };

    const gradeKeyToConfidence = (gradeKey: "MS" | "9" | "10" | "11" | "12") =>
        gradeKey === "MS" ? "middle" : gradeKey;

    const openAddCourseModal = (gradeKey: "MS" | "9" | "10" | "11" | "12") => {
        setSelectedGradeKey(gradeKey);
        const isCurrentGrade =
            (gradeKey === "MS" && currentGrade < 9) ||
            (gradeKey !== "MS" && Number(gradeKey) === currentGrade);
        const confidence = gradeKeyToConfidence(gradeKey);
        setPendingCourseData((prev) => ({
            ...prev,
            status: isCurrentGrade ? "IN_PROGRESS" : "COMPLETED",
            grade: prev.grade || "A+",
            confidence: isCurrentGrade ? "NEUTRAL" : confidence,
            stress: "NEUTRAL",
        }));
        setEditingCourseId(null);
        setEditingCourseCatalogId(null);
        setIsAddCourseOpen(true);
        setIsCourseDropdownOpen(true);
        setTimeout(() => courseSearchRef.current?.focus(), 0);
    };

    const resolveGradeKeyFromCourse = (course: StudentCourseData) => {
        if (course.confidenceLevel) {
            if (course.confidenceLevel === "middle") return "MS";
            if (["9", "10", "11", "12"].includes(course.confidenceLevel)) {
                return course.confidenceLevel as "9" | "10" | "11" | "12";
            }
        }
        if (course.gradeLevel !== null && course.gradeLevel !== undefined) {
            if (course.gradeLevel < 9) return "MS";
            return String(course.gradeLevel) as "9" | "10" | "11" | "12";
        }
        return null;
    };

    const openEditCourseModal = (course: StudentCourseData) => {
        const gradeKey = resolveGradeKeyFromCourse(course);
        setSelectedGradeKey(gradeKey);
        setSelectedCourseId(course.courseId);
        setEditingCourseId(course.id);
        setEditingCourseCatalogId(course.courseId);
        setCourseSearch(course.course.name);
        setPendingCourseData({
            status: course.status as CourseStatus,
            grade: course.grade ?? "",
            confidence: course.confidenceLevel ?? "",
            stress: course.stressLevel ?? "",
        });
        setIsAddCourseOpen(true);
        setIsCourseDropdownOpen(false);
    };

    const handleGenerateFuture = async () => {
        setGenerating(true);
        setDebugInfo(null);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "user",
                            content:
                                "Please generate my potential future courses for the next school year based on my history.",
                        },
                    ],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.debug) {
                    setDebugInfo({
                        draft: data.debug.draftContent,
                        audit: data.debug.auditContent,
                    });
                }
                router.refresh();
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error("Failed to generate courses:", errData.error || res.statusText);
                alert(`Error: ${errData.error || "Failed to generate courses"}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    const handleCourseSearchChange = (value: string) => {
        setCourseSearch(value);
        if (selectedCourseId) setSelectedCourseId("");
        setIsCourseDropdownOpen(true);
    };

    const handleCourseSelect = (course: CourseCatalogItem) => {
        setSelectedCourseId(course.id);
        setCourseSearch(course.name);
        setIsCourseDropdownOpen(false);
    };

    const updateMetricState = (courseId: string, field: "stress" | "confidence", index: number) => {
        setCurrentMetrics((prev) => {
            const next = new Map(prev);
            const existing = next.get(courseId) || { stress: 2, confidence: 2 };
            next.set(courseId, {
                ...existing,
                [field]: Math.min(Math.max(index, 0), 4) as MetricIndex,
            });
            return next;
        });
    };

    const saveMetric = (courseId: string, field: "stress" | "confidence", index: number) => {
        startTransition(async () => {
            await updateCourseMetrics({
                courseId,
                [field]: metricValueFromIndex(index),
            });
            router.refresh();
        });
    };

    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">Classes</h2>
                        <p className="text-gray-600">
                            Track your current and completed classes, view grades, and explore
                            suggested future courses.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {debugInfo && (
                            <button
                                onClick={() => setShowDebug(true)}
                                className="bg-gray-100 text-gray-600 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                            >
                                🧠 Debug Thought Process
                            </button>
                        )}
                        <button
                            onClick={handleGenerateFuture}
                            disabled={generating}
                            className={`
                        relative overflow-hidden group
                        bg-gradient-to-r from-indigo-600 to-purple-600 
                        text-white font-bold py-3 px-6 rounded-xl shadow-lg 
                        hover:shadow-xl hover:scale-105 transition-all duration-300
                        disabled:opacity-70 disabled:cursor-not-allowed
                    `}
                        >
                            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -skew-x-12 -translate-x-[150%]"></div>
                            {generating ? (
                                <span className="flex items-center gap-2">
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Thinking...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <span>✨</span> Generate Potential Future Courses
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <SummaryCards
                currentCount={currentCourses.length}
                completedCount={completedCourses.length}
                nextCount={nextSemesterCourses.length}
                plannedCount={plannedCourses.length}
            />

            <ClassesGrid
                scheduleByGrade={scheduleByGrade}
                courseMap={courseMap}
                onDeleteRequest={handleDeleteRequest}
                onAddCourse={openAddCourseModal}
                onEditCourse={openEditCourseModal}
                currentGrade={currentGrade}
            />

            <AddCourseModal
                open={isAddCourseOpen}
                modalRef={modalRef}
                dropdownRef={dropdownRef}
                courseSearchRef={courseSearchRef}
                selectedCourseId={selectedCourseId}
                pendingCourseData={pendingCourseData}
                selectedGradeKey={selectedGradeKey}
                courseSearch={courseSearch}
                isCourseDropdownOpen={isCourseDropdownOpen}
                filteredCourses={filteredCourses}
                isMutating={isMutating}
                onClose={() => setIsAddCourseOpen(false)}
                onAddCourse={handleAddCourse}
                onCourseSearchChange={handleCourseSearchChange}
                onCourseSelect={handleCourseSelect}
                setCourseDropdownOpen={setIsCourseDropdownOpen}
                setPendingCourseData={setPendingCourseData}
                setPendingCourseDataValue={setPendingCourseData}
                gradeKeyToConfidence={gradeKeyToConfidence}
                isPendingValid={isPendingValid}
                currentGrade={currentGrade}
            />

            <section>
                <h2 className="text-xl font-bold mb-4">Current Classes</h2>
                {currentCourses.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400">
                        No current classes. Add them above or from your Profile page.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {currentCourses.map((c) => (
                            <div
                                key={c.id}
                                className="border rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-4"
                            >
                                <div className="min-w-[180px] flex-1 min-w-0">
                                    <p className="font-semibold truncate">{c.course.name}</p>
                                    <p className="text-sm text-gray-500 truncate">
                                        {c.course.department}
                                    </p>
                                </div>
                                <span
                                    className="px-3 py-1 text-sm font-medium rounded-full"
                                    style={{
                                        backgroundColor: "var(--button-color)",
                                        color: "var(--foreground)",
                                    }}
                                >
                                    {c.grade || "In Progress"}
                                </span>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                                            <span>Stress</span>
                                            <span>
                                                {
                                                    metricLabels[
                                                        currentMetrics.get(c.courseId)?.stress ?? 2
                                                    ]
                                                }
                                            </span>
                                        </div>
                                        <div className="mt-1 w-44">
                                            <div className="grid grid-cols-5 text-[9px] text-slate-500 leading-none">
                                                {metricTickLabels.map((label) => (
                                                    <span
                                                        key={`stress-${label}`}
                                                        className="text-center whitespace-nowrap"
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={4}
                                                step={1}
                                                value={currentMetrics.get(c.courseId)?.stress ?? 2}
                                                onChange={(event) =>
                                                    updateMetricState(
                                                        c.courseId,
                                                        "stress",
                                                        Number(event.target.value)
                                                    )
                                                }
                                                onMouseUp={(event) =>
                                                    saveMetric(
                                                        c.courseId,
                                                        "stress",
                                                        Number(
                                                            (event.target as HTMLInputElement).value
                                                        )
                                                    )
                                                }
                                                onTouchEnd={(event) =>
                                                    saveMetric(
                                                        c.courseId,
                                                        "stress",
                                                        Number(
                                                            (event.target as HTMLInputElement).value
                                                        )
                                                    )
                                                }
                                                className="mt-1 w-full accent-indigo-500"
                                                aria-label={`Stress for ${c.course.name}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                                            <span>Confidence</span>
                                            <span>
                                                {
                                                    metricLabels[
                                                        currentMetrics.get(c.courseId)
                                                            ?.confidence ?? 2
                                                    ]
                                                }
                                            </span>
                                        </div>
                                        <div className="mt-1 w-44">
                                            <div className="grid grid-cols-5 text-[9px] text-slate-500 leading-none">
                                                {metricTickLabels.map((label) => (
                                                    <span
                                                        key={`confidence-${label}`}
                                                        className="text-center whitespace-nowrap"
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={4}
                                                step={1}
                                                value={
                                                    currentMetrics.get(c.courseId)?.confidence ?? 2
                                                }
                                                onChange={(event) =>
                                                    updateMetricState(
                                                        c.courseId,
                                                        "confidence",
                                                        Number(event.target.value)
                                                    )
                                                }
                                                onMouseUp={(event) =>
                                                    saveMetric(
                                                        c.courseId,
                                                        "confidence",
                                                        Number(
                                                            (event.target as HTMLInputElement).value
                                                        )
                                                    )
                                                }
                                                onTouchEnd={(event) =>
                                                    saveMetric(
                                                        c.courseId,
                                                        "confidence",
                                                        Number(
                                                            (event.target as HTMLInputElement).value
                                                        )
                                                    )
                                                }
                                                className="mt-1 w-full accent-emerald-500"
                                                aria-label={`Confidence for ${c.course.name}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {nextSemesterCourses.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold mb-4">Next Semester</h2>
                    <div className="grid gap-3">
                        {nextSemesterCourses.map((c) => (
                            <div key={c.id} className="border rounded p-3 flex justify-between">
                                <p>{c.course.name}</p>
                                <span className="text-sm text-gray-500">{c.course.department}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <CourseCatalog
                isOpen={isCatalogOpen}
                onToggle={() => setIsCatalogOpen(!isCatalogOpen)}
                courseCatalog={courseCatalog}
            />

            <DebugModal
                open={showDebug}
                debugInfo={debugInfo}
                onClose={() => setShowDebug(false)}
            />

            <DeleteCourseModal
                open={!!courseToDelete}
                courseName={courseToDelete?.name || ""}
                onCancel={cancelDelete}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
