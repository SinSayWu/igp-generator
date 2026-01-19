"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getAdminData, getAllStudents, getStudentIGPData } from "@/app/actions/get-admin-data";
import ClassesGrid from "./classes/ClassesGrid";
import { StudentCourseData, CourseCatalogItem } from "./types";

export default function AdminOverview({ userId, courseCatalog }: { userId: string, courseCatalog: CourseCatalogItem[] }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"dashboard" | "students" | "single_student">("dashboard");
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [loadingStudent, setLoadingStudent] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function load() {
            const adminData = await getAdminData(userId);
            setData(adminData);
            setLoading(false);
        }
        load();
    }, [userId]);

    const handleManageCatalog = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log("Uploading file:", file.name);
            // In a real app, you'd send this to an action
            alert(`File "${file.name}" selected for upload. (Upload logic would go here)`);
        }
    };

    const handleViewStudents = async () => {
        setLoading(true);
        const allStudents = await getAllStudents();
        setStudents(allStudents);
        setView("students");
        setLoading(false);
    };

    const handleSelectStudent = async (studentId: string) => {
        setLoadingStudent(true);
        const studentData = await getStudentIGPData(studentId);
        setSelectedStudent(studentData);
        setView("single_student");
        setLoadingStudent(false);
    };

    if (loading) return <div className="p-8 animate-pulse text-gray-400 font-bold uppercase tracking-widest text-center">Loading Admin Dashboard...</div>;
    if (!data) return <div className="p-8 text-red-600">Error: Admin record not found.</div>;

    const { admin, stats } = data;

    return (
        <div className="max-w-7xl mx-auto pt-4 flex flex-col gap-8" style={{ fontFamily: "var(--font-raleway)" }}>
            {/* Header / Navigation Breadcrumbs */}
            <div className="flex justify-between items-center bg-white border border-black p-6 rounded-xl">
                <div>
                    <h1 className="text-3xl font-black text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>Admin Dashboard</h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        {view === "dashboard" ? `Managing ${admin.school?.name || "School System"}` : 
                         view === "students" ? "Student IGP Directory" : 
                         `Viewing IGP: ${selectedStudent?.user?.firstName} ${selectedStudent?.user?.lastName}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    {view !== "dashboard" && (
                        <button 
                            onClick={() => setView("dashboard")}
                            className="px-4 py-2 border border-black rounded-lg font-bold text-xs uppercase hover:bg-black hover:text-white transition-all"
                        >
                            Back to Stats
                        </button>
                    )}
                    {view === "single_student" && (
                        <button 
                            onClick={() => setView("students")}
                            className="px-4 py-2 border border-black rounded-lg font-bold text-xs uppercase hover:bg-black hover:text-white transition-all"
                        >
                            Back to Student List
                        </button>
                    )}
                </div>
            </div>

            {view === "dashboard" && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border border-black p-8 rounded-xl flex flex-col items-center justify-center text-center group hover:bg-gray-50 transition-colors">
                            <span className="text-gray-400 text-[10px] font-black tracking-[0.2em] mb-2 uppercase">Total Students</span>
                            <span className="text-5xl font-black text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>{stats.studentCount}</span>
                            <span className="mt-2 text-xs font-bold uppercase text-black">Active Profiles</span>
                        </div>
                        <div className="bg-white border border-black p-8 rounded-xl flex flex-col items-center justify-center text-center group hover:bg-gray-50 transition-colors">
                            <span className="text-gray-400 text-[10px] font-black tracking-[0.2em] mb-2 uppercase">Total Clubs</span>
                            <span className="text-5xl font-black text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>{stats.clubCount}</span>
                            <span className="mt-2 text-xs font-bold uppercase text-black">Organizations</span>
                        </div>
                        <div className="bg-white border border-black p-8 rounded-xl flex flex-col items-center justify-center text-center group hover:bg-gray-50 transition-colors">
                            <span className="text-gray-400 text-[10px] font-black tracking-[0.2em] mb-2 uppercase">Total Sports</span>
                            <span className="text-5xl font-black text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>{stats.sportCount}</span>
                            <span className="mt-2 text-xs font-bold uppercase text-black">Programs</span>
                        </div>
                    </div>

                    {/* Quick Tools */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white border border-black p-8 rounded-xl flex flex-col gap-6">
                            <h2 className="text-xl font-black uppercase tracking-tight border-b border-black/5 pb-4" style={{ fontFamily: "var(--font-poppins)" }}>Management Tools</h2>
                            <div className="flex flex-col gap-3">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={handleFileUpload}
                                    accept=".csv,.xlsx,.json"
                                />
                                <button 
                                    onClick={handleManageCatalog}
                                    className="w-full text-left p-4 bg-white border border-black rounded-xl font-bold uppercase text-sm flex justify-between items-center group hover:bg-[var(--button-color)] transition-all active:scale-[0.98]"
                                >
                                    <span>Manage Course Catalog</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                                <button 
                                    onClick={handleViewStudents}
                                    className="w-full text-left p-4 bg-white border border-black rounded-xl font-bold uppercase text-sm flex justify-between items-center group hover:bg-[var(--button-color)] transition-all active:scale-[0.98]"
                                >
                                    <span>View Student IGPs</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                                <button className="w-full text-left p-4 bg-white border border-black rounded-xl font-bold uppercase text-sm flex justify-between items-center group hover:bg-gray-50 transition-all opacity-40 cursor-not-allowed">
                                    <span>Update School Settings</span>
                                    <span>🔒</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-black p-8 rounded-xl flex flex-col gap-6 text-black">
                            <h2 className="text-xl font-black uppercase tracking-tight border-b border-black/10 pb-4" style={{ fontFamily: "var(--font-poppins)" }}>Security & Status</h2>
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">System Status</span>
                                    <span className="text-xs font-bold uppercase text-green-600">Online</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Student School Code</span>
                                    <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{admin.school?.schoolStudentCode}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Admin School Code</span>
                                    <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{admin.school?.schoolAdminCode}</span>
                                </div>
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-black/5">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
                                        Administrators can manage the school's course catalog and view student academic trajectories. 
                                        Sensitive student data is protected by school-level codes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {view === "students" && (
                <div className="bg-white border border-black rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-black bg-gray-50 flex justify-between items-center">
                        <h2 className="font-black uppercase tracking-tight text-xl" style={{ fontFamily: "var(--font-poppins)" }}>All Students</h2>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{students.length} Records found</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-black">
                                    <th className="p-4 font-black uppercase text-[10px] border-r border-black/5">Name</th>
                                    <th className="p-4 font-black uppercase text-[10px] border-r border-black/5">Grade</th>
                                    <th className="p-4 font-black uppercase text-[10px] border-r border-black/5">Plan</th>
                                    <th className="p-4 font-black uppercase text-[10px]">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s, i) => (
                                    <tr key={i} className="border-b last:border-0 border-black/5 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold border-r border-black/5">{s.user.lastName}, {s.user.firstName}</td>
                                        <td className="p-4 text-center border-r border-black/5 font-bold uppercase text-xs">{s.gradeLevel}th</td>
                                        <td className="p-4 border-r border-black/5 italic text-gray-500 text-xs">{s.postHighSchoolPlan || "Not set"}</td>
                                        <td className="p-4">
                                            <button 
                                                onClick={() => handleSelectStudent(s.userId)}
                                                className="px-3 py-1.5 bg-[var(--button-color)] border border-black rounded-lg font-bold text-[10px] uppercase hover:bg-[var(--button-color-2)] transition-all"
                                            >
                                                View IGP
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-gray-400 font-bold italic">No student records found in your school.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === "single_student" && selectedStudent && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                    <div className="bg-white border border-black p-8 rounded-xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-4xl font-black text-black leading-none mb-2 uppercase tracking-tighter" style={{ fontFamily: "var(--font-poppins)" }}>
                                    {selectedStudent.user?.firstName} {selectedStudent.user?.lastName}
                                </h1>
                                <p className="text-sm font-bold text-[#d70026] uppercase tracking-[0.2em]">
                                    {selectedStudent.gradeLevel}th Grade • {selectedStudent.postHighSchoolPlan || "Academic Plan"}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Update</p>
                                <p className="font-bold text-xs">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Student Course Chart (ClassesGrid) */}
                        <div className="mt-10 border-t border-black pt-10">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-3" style={{ fontFamily: "var(--font-poppins)" }}>
                                4-Year Academic Path
                            </h3>
                            <div className="student-grid-wrapper bg-gray-50 p-4 rounded-2xl border border-black/5">
                                <SingleStudentGrid 
                                    student={selectedStudent} 
                                    courseCatalog={courseCatalog} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper wrapper to build the grid data (basically what PATH tab does)
function SingleStudentGrid({ student, courseCatalog }: { student: any, courseCatalog: CourseCatalogItem[] }) {
    const courses = student.studentCourses || [];
    const currentGrade = student.gradeLevel || 9;

    const courseMap = useMemo(() => {
        const map: Record<string, CourseCatalogItem> = {};
        courseCatalog.forEach((c) => {
            map[c.name] = c;
        });
        return map;
    }, [courseCatalog]);

    const scheduleByGrade = useMemo(() => {
        const schedule: Record<string, StudentCourseData[]> = {
            MS: [], "9": [], "10": [], "11": [], "12": [],
        };

        courses.forEach((c: any) => {
            let assignedGradeKey = "";
            const gl = c.gradeLevel;

            if (gl !== null && gl !== undefined) {
                if (gl < 9) assignedGradeKey = "MS";
                else assignedGradeKey = gl.toString();
            } else {
                const catalogEntry = courseMap[c.course.name];
                if (c.status === "IN_PROGRESS") {
                    assignedGradeKey = currentGrade < 9 ? "MS" : currentGrade.toString();
                } else if (c.status === "PLANNED") {
                    const next = currentGrade + 1;
                    assignedGradeKey = next < 9 ? "MS" : next.toString();
                } else if (c.status === "COMPLETED") {
                    if (catalogEntry?.availableGrades?.length) {
                        const minGrade = Math.min(...catalogEntry.availableGrades);
                        assignedGradeKey = minGrade >= 9 ? minGrade.toString() : "9";
                    } else {
                        assignedGradeKey = Math.max(9, currentGrade - 1).toString();
                    }
                }
            }

            if (assignedGradeKey && schedule[assignedGradeKey]) {
                schedule[assignedGradeKey].push(c);
            } else if (["0", "7", "8"].includes(assignedGradeKey)) {
                schedule["MS"].push(c);
            }
        });

        return schedule;
    }, [courses, courseMap, currentGrade]);

    return (
        <ClassesGrid
            scheduleByGrade={scheduleByGrade}
            courseMap={courseMap}
            onDeleteRequest={() => {}}
            onAddCourse={() => {}}
            onEditCourse={() => {}}
            currentGrade={currentGrade}
            generatingFuture={false}
        />
    );
}
