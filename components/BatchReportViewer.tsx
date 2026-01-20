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
  profile?: {
    grade: number;
    difficulty: string;
    interests: string[];
    additional_factors: {
      bio: string;
      postsecondary_goal: string;
      career_interest: string;
      sports: string[];
      clubs: string[];
    };
    program_intent: {
      band: boolean;
      orchestra: boolean;
      visual_arts: boolean;
      jrotc: boolean;
      weightlifting: boolean;
    };
  };
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
    metGradReqs: { value: false, comment: '' },
    interestsAligned: { value: false, comment: '' },
    rigorPreserved: { value: false, comment: '' },
    scheduleFeasible: { value: false, comment: '' },
    clubAlignment: { value: false, comment: '' },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Reset/Load evaluation when switching students
  useEffect(() => {
    if (selectedStudent) {
      if (selectedStudent.manualEvaluation) {
          // Ensure structure matches new type (migration helper if needed, but assuming fresh start is safer)
          setEvaluation(selectedStudent.manualEvaluation);
      } else {
        setEvaluation({
            metGradReqs: { value: false, comment: '' },
            interestsAligned: { value: false, comment: '' },
            rigorPreserved: { value: false, comment: '' },
            scheduleFeasible: { value: false, comment: '' },
            clubAlignment: { value: false, comment: '' },
        });
      }
      setSaveStatus('idle');
    }
  }, [selectedStudent]);

  const handleCheckboxChange = (key: keyof EvaluatedCriteria) => {
    setEvaluation(prev => ({ 
        ...prev, 
        [key]: { ...prev[key], value: !prev[key].value } 
    }));
    setSaveStatus('idle');
  };

  const handleCommentChange = (key: keyof EvaluatedCriteria, comment: string) => {
    setEvaluation(prev => ({ 
        ...prev, 
        [key]: { ...prev[key], comment } 
    }));
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

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Center: Report Content */}
        <main className="flex-1 h-full overflow-y-auto bg-slate-50 p-8 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-10 pb-20">

          
          {/* Header */}
          <header className="border-b border-slate-200 pb-6">
            <h1 className="text-3xl font-bold text-slate-900">
              {selectedStudent.name} 
              <span className="ml-3 text-sm font-normal text-slate-400 font-mono">({selectedStudent.id})</span>
            </h1>
          </header>

          {/* New Profile Section */}
          {selectedStudent.profile && (
            <section>
               <h3 className="text-xl font-semibold text-blue-600 border-l-4 border-blue-600 pl-3 mb-4">
                📋 Student Profile
              </h3>
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                   <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bio / Description</h4>
                    <p className="text-slate-700 italic border-l-2 border-slate-200 pl-3">
                      "{selectedStudent.profile.additional_factors.bio}"
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Grade Level</h4>
                      <p className="text-slate-800 font-medium">{selectedStudent.profile.grade}th Grade</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Course Rigor</h4>
                      <p className="text-slate-800 font-medium">{selectedStudent.profile.difficulty}</p>
                    </div>
                     <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Post-Secondary</h4>
                      <p className="text-slate-800 font-medium">{selectedStudent.profile.additional_factors.postsecondary_goal}</p>
                    </div>
                     <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Career Interest</h4>
                      <p className="text-slate-800 font-medium">{selectedStudent.profile.additional_factors.career_interest || "Undecided"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedStudent.profile.interests.length > 0 && (
                     <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.profile.interests.map(i => (
                          <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs border border-indigo-100 font-medium">
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedStudent.profile.additional_factors.sports.length > 0  || selectedStudent.profile.additional_factors.clubs.length > 0) && (
                     <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Activities</h4>
                       <div className="flex flex-wrap gap-2">
                        {selectedStudent.profile.additional_factors.sports.map(s => (
                           <span key={s} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs border border-orange-100 font-medium">
                            {s} (Sport)
                          </span>
                        ))}
                         {selectedStudent.profile.additional_factors.clubs.map(c => (
                           <span key={c} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs border border-purple-100 font-medium">
                            {c} (Club)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.entries(selectedStudent.profile.program_intent).some(([_, isActive]) => isActive) && (
                     <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Pathways</h4>
                       <div className="flex flex-wrap gap-2">
                         {Object.entries(selectedStudent.profile.program_intent).filter(([_, isActive]) => isActive).map(([key]) => (
                            <span key={key} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200 capitalize">
                              {key.replace('_', ' ')}
                            </span>
                         ))}
                       </div>
                    </div>
                  )}

                </div>
              </div>
            </section>
          )}
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

        {/* Right Sidebar: Evaluation Panel */}
        <aside className="w-96 bg-white border-l border-slate-200 shadow-xl z-10 flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <h2 className="font-bold text-lg text-slate-800">Manual Evaluation</h2>
             <p className="text-xs text-slate-500 mt-1">Review the AI output and grade accordingly.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {[
                  { key: 'metGradReqs', label: 'Met Graduation Requirements', desc: 'Does the schedule meet all credit requirements?' },
                  { key: 'interestsAligned', label: 'Interests Aligned', desc: 'Do courses match the student\'s stated interests?' },
                  { key: 'rigorPreserved', label: 'Rigor Preserved', desc: 'Is the course difficulty appropriate?' },
                  { key: 'scheduleFeasible', label: 'Schedule Feasibility', desc: 'Is the course load realistic?' },
                  { key: 'clubAlignment', label: 'Club/Opp Alignment', desc: 'Are recommendations relevant?' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="group">
                    <label className="flex items-start gap-3 cursor-pointer hover:text-blue-700 transition-colors mb-2">
                        <div className="pt-0.5">
                           <input
                            type="checkbox"
                            checked={evaluation[key as keyof EvaluatedCriteria].value}
                            onChange={() => handleCheckboxChange(key as keyof EvaluatedCriteria)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                           <span className="font-semibold text-sm text-slate-800 block">{label}</span>
                           <span className="text-xs text-slate-400 font-normal block">{desc}</span>
                        </div>
                    </label>
                    <div className="pl-8">
                       <textarea 
                        placeholder={`Notes on ${label.toLowerCase()}...`}
                        value={evaluation[key as keyof EvaluatedCriteria].comment}
                        onChange={(e) => handleCommentChange(key as keyof EvaluatedCriteria, e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none text-slate-700 bg-slate-50 resize-y min-h-[60px]"
                    />
                    </div>
                  </div>
                ))}
          </div>

          <div className="p-6 border-t border-slate-200 bg-slate-50">
             <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Evaluation'}
              </button>
              
              <div className="mt-3 text-center h-5">
                   {saveStatus === 'success' && <span className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">✓ Saved successfully</span>}
                   {saveStatus === 'error' && <span className="text-sm text-red-600 font-medium">Failed to save</span>}
              </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

