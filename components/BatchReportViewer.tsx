'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Recommendation {
  id: string;
  name?: string; // for clubs
  title?: string; // for opportunities
  organization?: string;
  justification?: string;
  matchReason?: string;
  actionPlan: string;
  generatedTags?: string[];
}

interface StudentOutput {
  name: string;
  id: string;
  courseGen: {
    schedule: {
      schedule: {
        [grade: string]: string[];
      };
    };
    analysis: string;
  };
  clubRecs: {
    thought_process: string;
    recommendations: Recommendation[];
  };
  oppRecs: {
    recommendations: Recommendation[];
  };
  pathSummary: string;
}

interface BatchReportViewerProps {
  students: StudentOutput[];
}

export default function BatchReportViewer({ students }: BatchReportViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedStudent = students[selectedIndex];

  if (!selectedStudent) return <div className="p-10">No students found.</div>;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-slate-200 flex flex-col shrink-0 h-full overflow-y-auto border-r border-slate-700">
        <div className="p-6 font-bold text-xl border-b border-slate-700 text-white">
          Batch AI Results
        </div>
        <ul className="flex-1 overflow-y-auto">
          {students.map((student, idx) => (
            <li
              key={student.id}
              onClick={() => setSelectedIndex(idx)}
              className={`cursor-pointer px-6 py-4 border-b border-slate-700 transition-colors hover:bg-slate-700 ${
                idx === selectedIndex ? 'bg-slate-700 text-white border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="font-medium">{student.name}</div>
              <div className="text-xs text-slate-400 truncate">{student.id}</div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Header */}
          <header className="border-b border-slate-200 pb-6">
            <h1 className="text-3xl font-bold text-slate-900">
              {selectedStudent.name} 
              <span className="ml-3 text-sm font-normal text-slate-400 font-mono">({selectedStudent.id})</span>
            </h1>
          </header>

          {/* Path Summary */}
          <section>
            <h3 className="text-xl font-semibold text-blue-600 border-l-4 border-blue-600 pl-3 mb-4">
              Path Summary (College Plan)
            </h3>
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm leading-relaxed text-slate-700">
                <ReactMarkdown>{selectedStudent.pathSummary || 'No summary available.'}</ReactMarkdown>
            </div>
          </section>

          {/* Course Plan */}
          <section>
            <h3 className="text-xl font-semibold text-blue-600 border-l-4 border-blue-600 pl-3 mb-4">
              4-Year Course Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {Object.entries(selectedStudent.courseGen?.schedule?.schedule || {}).map(([grade, courses]) => (
                <div key={grade} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-center text-slate-700">
                    Grade {grade}
                  </div>
                  <ul className="p-4 list-disc list-inside text-sm space-y-1 text-slate-600">
                    {(courses as string[]).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <details className="group">
              <summary className="cursor-pointer text-sm text-slate-500 hover:text-blue-600 select-none">
                View Generation Analysis & Debug Info
              </summary>
              <div className="mt-2 text-xs font-mono bg-slate-100 p-4 rounded border border-slate-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                <ReactMarkdown>{selectedStudent.courseGen?.analysis}</ReactMarkdown>
              </div>
            </details>
          </section>

          {/* Club Recommendations */}
          <section>
            <h3 className="text-xl font-semibold text-blue-600 border-l-4 border-blue-600 pl-3 mb-4">
              Club Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedStudent.clubRecs?.recommendations?.map((rec) => (
                <div key={rec.id} className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="px-5 py-3 border-b border-slate-100 font-semibold text-lg bg-slate-50/50">
                    {rec.name}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-sm text-slate-600 mb-4 flex-1">
                      <span className="font-semibold text-slate-700">Why: </span>
                      {rec.justification}
                    </p>
                    <div className="mt-auto pt-3 border-t border-slate-100 text-sm text-emerald-600 font-medium bg-emerald-50/50 -mx-5 -mb-5 p-4 rounded-b-lg">
                      Details: {rec.actionPlan}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Opportunity Recommendations */}
          <section>
            <h3 className="text-xl font-semibold text-blue-600 border-l-4 border-blue-600 pl-3 mb-4">
              Opportunity Recommendations
            </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedStudent.oppRecs?.recommendations?.map((rec) => (
                <div key={rec.id} className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="font-semibold text-lg leading-tight mb-1">{rec.title}</div>
                    {rec.organization && <div className="text-sm text-slate-500">@ {rec.organization}</div>}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {rec.generatedTags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium border border-blue-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 mb-4 flex-1">
                       <span className="font-semibold text-slate-700">Match: </span>
                       {rec.matchReason}
                    </p>
                     <div className="mt-auto pt-3 border-t border-slate-100 text-sm text-emerald-600 font-medium bg-emerald-50/50 -mx-5 -mb-5 p-4 rounded-b-lg">
                      Action: {rec.actionPlan}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
