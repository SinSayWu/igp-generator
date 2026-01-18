type SummaryCardsProps = {
    currentCount: number;
    completedCount: number;
    nextCount: number;
    plannedCount: number;
};

export default function SummaryCards({
    currentCount,
    completedCount,
    nextCount,
    plannedCount,
}: SummaryCardsProps) {
    return (
        <div className="grid grid-cols-4 gap-6 border rounded-lg p-6">
            <div>
                <p className="text-sm text-gray-500">Current Classes</p>
                <p className="text-2xl font-bold">{currentCount}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Completed Classes</p>
                <p className="text-2xl font-bold">{completedCount}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Next Semester</p>
                <p className="text-2xl font-bold">{nextCount}</p>
            </div>
            <div>
                <p className="text-sm text-indigo-500 font-semibold">Planned / Future</p>
                <p className="text-2xl font-bold text-indigo-600">{plannedCount}</p>
            </div>
        </div>
    );
}
