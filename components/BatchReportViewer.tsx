'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { saveEvaluation, type EvaluatedCriteria } from '@/app/actions/save-evaluation';


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
  manualEvaluation?: EvaluatedCriteria;
}


interface BatchReportViewerProps {
  students: StudentOutput[];
}

export default function BatchReportViewer({ students: initialStudents }: BatchReportViewerProps) {
  const [students, setStudents] = useState(initialStudents);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedStudent = students[selectedIndex];
  
  // Local state for the current evaluation to allow editing before saving
  const [evaluation, setEvaluation] = useState<EvaluatedCriteria>({
    metGradReqs: false,
    interestsAligned: false,
    rigorPreserved: false,
    scheduleFeasible: false,
    clubAlignment: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Reset/Load evaluation when switching students
  useEffect(() => {
    if (selectedStudent) {
      setEvaluation(selectedStudent.manualEvaluation || {
        metGradReqs: false,
        interestsAligned: false,
        rigorPreserved: false,
        scheduleFeasible: false,
        clubAlignment: false,
      });
      setSaveStatus('idle');
    }
  }, [selectedStudent]);

  const handleCheckboxChange = (key: keyof EvaluatedCriteria) => {
    setEvaluation(prev => ({ ...prev, [key]: !prev[key] }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!selectedStudent) return;
    setIsSaving(true);
    const result = await saveEvaluation(selectedStudent.id, evaluation);
    setIsSaving(false);
    
    if (result.success) {
      setSaveStatus('success');
      // Update local students state to reflect the saved change
      setStudents(prev => prev.map((s, i) => 
        i === selectedIndex ? { ...s, manualEvaluation: evaluation } : s
      ));
    } else {
      setSaveStatus('error');
    }
  };

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
          <header className="border-b border-slate-200 pb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {selectedStudent.name} 
                <span className="ml-3 text-sm font-normal text-slate-400 font-mono">({selectedStudent.id})</span>
              </h1>
            </div>

            {/* Manual Evaluation Box */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg shadow-sm min-w-[300px]">
              <h4 className="font-semibold text-slate-700 mb-3 text-sm">Manual Evaluation</h4>
              <div className="space-y-2 text-sm text-slate-600">
                {[
                  { key: 'metGradReqs', label: 'Met Graduation Requirements' },
                  { key: 'interestsAligned', label: 'Courses Aligned with Interests' },
                  { key: 'rigorPreserved', label: 'Preservation of Course Rigor' },
                  { key: 'scheduleFeasible', label: 'Schedule Feasibility' },
                  { key: 'clubAlignment', label: 'Club/Opp Alignment' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={evaluation[key as keyof EvaluatedCriteria]}
                      onChange={() => handleCheckboxChange(key as keyof EvaluatedCriteria)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Evaluation'}
                </button>
                {saveStatus === 'success' && <span className="text-xs text-green-600 font-medium">Saved!</span>}
                {saveStatus === 'error' && <span className="text-xs text-red-600 font-medium">Failed</span>}
              </div>
            </div>
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
