import type { CourseCatalogItem } from "../types";

type CourseCatalogProps = {
    isOpen: boolean;
    onToggle: () => void;
    courseCatalog: CourseCatalogItem[];
};

export default function CourseCatalog({ isOpen, onToggle, courseCatalog }: CourseCatalogProps) {
    return (
        <section className="pt-8 border-t border-gray-200">
            <div
                className="flex justify-between items-center cursor-pointer mb-6 select-none rounded-xl px-4 py-3 transition-all border border-transparent hover:bg-slate-200/80 hover:border-slate-300 hover:shadow-md"
                onClick={onToggle}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onToggle();
                    }
                }}
            >
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span>📚</span> Course Catalog
                </h2>
                <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg transition-colors flex items-center gap-2"
                >
                    {isOpen ? "Hide Catalog" : "Show Catalog"}
                    <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
                </button>
            </div>

            {isOpen && (
                <div className="overflow-x-auto border rounded-xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wide">
                            <tr>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Course Name</th>
                                <th className="px-6 py-4">Level</th>
                                <th className="px-6 py-4">Credits</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {courseCatalog.map((course) => (
                                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-indigo-600">
                                        {course.department || "General"}
                                    </td>
                                    <td className="px-6 py-3 font-bold text-gray-800">
                                        {course.name}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-bold ${
                                                course.level?.includes("AP")
                                                    ? "bg-purple-100 text-purple-700"
                                                    : course.level?.includes("Honors")
                                                      ? "bg-blue-100 text-blue-700"
                                                      : "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {course.level || "Regular"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">
                                        {course.credits || "—"}
                                    </td>
                                </tr>
                            ))}
                            {courseCatalog.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-gray-400 italic"
                                    >
                                        No courses found in catalog.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
