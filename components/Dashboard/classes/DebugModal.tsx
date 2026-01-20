import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type DebugInfo = { draft: string; audit: string };

type DebugModalProps = {
    open: boolean;
    debugInfo: DebugInfo | null;
    onClose: () => void;
};

export default function DebugModal({ open, debugInfo, onClose }: DebugModalProps) {
    if (!open || !debugInfo) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] h-[80vh] relative z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">🧠 AI Train of Thought</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-row gap-4">
                    <div className="w-1/2 flex flex-col min-h-0 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="p-3 border-b border-gray-200 bg-gray-100/50 flex justify-between items-center">
                            <span className="font-semibold text-sm text-gray-700">
                                Step 1: The Planner (Draft)
                            </span>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                                Model: GPT-4o
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <div className="prose prose-slate max-w-none text-xs">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {debugInfo.draft}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    <div className="w-1/2 flex flex-col min-h-0 bg-indigo-50/50 rounded-xl border border-indigo-200">
                        <div className="p-3 border-b border-indigo-200 bg-indigo-100/50 flex justify-between items-center">
                            <span className="font-semibold text-sm text-indigo-900">
                                Step 2: The Auditor (Validation)
                            </span>
                            <span className="text-xs text-indigo-600 bg-white px-2 py-1 rounded border border-indigo-200">
                                Checking for Req.
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <div className="prose prose-indigo max-w-none text-xs">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {debugInfo.audit}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
