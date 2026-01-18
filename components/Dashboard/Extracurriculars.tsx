"use client";

import { ClubData, SportData } from "./types";

type ExtracurricularsProps = {
    clubs: ClubData[];
    sports: SportData[];
};

export default function Extracurriculars({ clubs, sports }: ExtracurricularsProps) {
    const totalActivities = clubs.length + sports.length;

    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold">Extracurriculars</h2>
                <p className="text-gray-600">
                    Monitor your clubs, sports, volunteer work, and other activities to balance your
                    schedule.
                </p>
            </div>

            {/* Summary / Overview */}
            <div className="grid grid-cols-3 gap-6 border rounded-lg p-6">
                <div>
                    <p className="text-sm text-gray-500">Total Activities</p>
                    <p className="text-2xl font-bold">{totalActivities}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Clubs</p>
                    <p className="text-2xl font-bold">{clubs.length}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Sports</p>
                    <p className="text-2xl font-bold">{sports.length}</p>
                </div>
            </div>

            {/* Clubs */}
            <section>
                <h2 className="text-xl font-bold mb-4">Clubs & Activities</h2>
                {clubs.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400">
                        No clubs added yet. Add clubs from your Profile page.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {clubs.map((club) => (
                            <div
                                key={club.id}
                                className="border rounded-lg p-4 flex flex-col gap-2"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg">{club.name}</h3>
                                        <div className="flex gap-2 text-sm text-gray-500 items-center">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium text-xs">
                                                {club.category}
                                            </span>
                                            {(club.teacherLeader || club.studentLeaders) && (
                                                <span className="text-gray-300">|</span>
                                            )}
                                            {club.teacherLeader && (
                                                <span>
                                                    <span className="font-semibold">Sponsor:</span>{" "}
                                                    {club.teacherLeader}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span
                                        className="px-3 py-1 text-sm font-medium rounded-full shrink-0"
                                        style={{
                                            backgroundColor: "var(--button-color)",
                                            color: "var(--foreground)",
                                        }}
                                    >
                                        Club
                                    </span>
                                </div>

                                {club.description && (
                                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                        {club.description}
                                    </p>
                                )}

                                {club.studentLeaders && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span className="font-semibold text-gray-600">
                                            Student Leaders:
                                        </span>{" "}
                                        {club.studentLeaders}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Sports */}
            <section>
                <h2 className="text-xl font-bold mb-4">Sports</h2>
                {sports.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400">
                        No sports added yet. Add sports from your Profile page.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {sports.map((sport) => (
                            <div
                                key={sport.id}
                                className="border rounded-lg p-4 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold">{sport.name}</p>
                                    <p className="text-sm text-gray-500">{sport.season}</p>
                                </div>
                                <span
                                    className="px-3 py-1 text-sm font-medium rounded-full"
                                    style={{
                                        backgroundColor: "var(--button-color)",
                                        color: "var(--foreground)",
                                    }}
                                >
                                    Sport
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
