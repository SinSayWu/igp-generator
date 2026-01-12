"use client";

import { useState, useTransition } from "react";
import { updateStudentProfile } from "@/app/actions/update-profile";
// We import the specific types from Prisma so TS knows exactly what fields exist
import { Club, Sport, Course, Student, College, NationwideAct, Program } from "@prisma/client";

// --- TYPES ---
type StudentWithRelations = Student & {
  clubs: Club[];
  sports: Sport[];
  courses: Course[];
  targetColleges: College[];
  nationwideActs: NationwideAct[];
  focusPrograms: Program[]; // <--- NEW RELATION
};

type Props = {
  userId: string;
  student: StudentWithRelations;
  allClubs: Club[];
  allSports: Sport[];
  allCourses: Course[];
  allColleges: College[];
  allNationwideActs: NationwideAct[];
  allPrograms: Program[]; // <--- NEW PROP
};

interface SelectableItem {
  id: string;
  name: string;
  detail?: string | null;
}

// Union type for the raw items we might pass to tables
type RawActivityItem = Club | Sport | Course;

export default function ProfileEditor({ 
  userId, student, allClubs, allSports, allCourses, allColleges, allNationwideActs, allPrograms 
}: Props) {
  const [isPending, startTransition] = useTransition();

  // --- STATE ---
  const [plan, setPlan] = useState(student.postHighSchoolPlan || "");
  const [ncaa, setNcaa] = useState(student.interestedInNCAA);
  
  // Nationwide Acts State
  const [selectedNationwideIds, setSelectedNationwideIds] = useState<string[]>(
    student.nationwideActs.map(act => act.id)
  );

  const handleNationwideToggle = (id: string) => {
    setSelectedNationwideIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Program/Pathways State
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>(
    student.focusPrograms.map(p => p.id)
  );

  const handleProgramToggle = (id: string) => {
    setSelectedProgramIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // College Selection State
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>(
    student.targetColleges.map(c => c.id)
  );

  const handleCollegeToggle = (id: string) => {
    setSelectedCollegeIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  // --- ACTIVITY TABLE HELPERS ---
  const getDetail = (item: RawActivityItem): string | null => {
    if ("category" in item) return item.category;
    if ("season" in item) return item.season;
    if ("department" in item) return item.department;
    return null;
  };

  const formatItem = (item: RawActivityItem): SelectableItem => {
    return { id: item.id, name: item.name, detail: getDetail(item) };
  };

  const [myClubs, setMyClubs] = useState<SelectableItem[]>(student.clubs.map(formatItem));
  const [mySports, setMySports] = useState<SelectableItem[]>(student.sports.map(formatItem));
  const [myCourses, setMyCourses] = useState<SelectableItem[]>(student.courses.map(formatItem));

  // Dropdown states for activities
  const [selClub, setSelClub] = useState("");
  const [selSport, setSelSport] = useState("");
  const [selCourse, setSelCourse] = useState("");

  // STRICTLY TYPED Add Helper
  const addItem = (
    id: string, 
    sourceList: RawActivityItem[], 
    currentList: SelectableItem[], 
    setList: (items: SelectableItem[]) => void, 
    reset: (val: string) => void
  ) => {
    const raw = sourceList.find((i) => i.id === id);
    if (raw && !currentList.some(i => i.id === id)) {
      setList([...currentList, formatItem(raw)]);
      reset("");
    }
  };

  // STRICTLY TYPED Remove Helper
  const removeItem = (
    id: string, 
    currentList: SelectableItem[], 
    setList: (items: SelectableItem[]) => void
  ) => {
    setList(currentList.filter(i => i.id !== id));
  };

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await updateStudentProfile(userId, formData);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
        <p className="text-gray-600">Update your IGP, interests, and future plans.</p>
      </div>

      <form action={handleSubmit} className="space-y-8">
        
        {/* Hidden Inputs for Relations */}
        {myClubs.map(i => <input key={i.id} type="hidden" name="clubIds" value={i.id} />)}
        {mySports.map(i => <input key={i.id} type="hidden" name="sportIds" value={i.id} />)}
        {myCourses.map(i => <input key={i.id} type="hidden" name="courseIds" value={i.id} />)}
        
        {/* Hidden Inputs for Nationwide Acts */}
        {selectedNationwideIds.map(id => <input key={id} type="hidden" name="nationwideActIds" value={id} />)}
        
        {/* Hidden Inputs for Programs */}
        {selectedProgramIds.map(id => <input key={id} type="hidden" name="programIds" value={id} />)}

        {/* ================= SECTION 1: BIO ================= */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">About Me</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Grade Level</label>
              <select name="gradeLevel" defaultValue={student.gradeLevel || 9} className="w-full border p-2 rounded-lg">
                <option value="9">Freshman (9th)</option>
                <option value="10">Sophomore (10th)</option>
                <option value="11">Junior (11th)</option>
                <option value="12">Senior (12th)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
              <textarea name="bio" defaultValue={student.bio || ""} className="w-full border p-2 rounded-lg h-24" placeholder="Tell us about yourself..." />
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: PATHWAYS & PROGRAMS (NEW) ================= */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Pathways & Elective Focus</h2>
          <p className="text-sm text-gray-500 mb-4">Select the specialized programs or pathways you are currently pursuing at your school.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allPrograms.map((prog) => {
              const isSelected = selectedProgramIds.includes(prog.id);
              return (
                <div 
                  key={prog.id}
                  onClick={() => handleProgramToggle(prog.id)}
                  className={`
                    cursor-pointer p-4 rounded-lg border transition-all select-none
                    ${isSelected ? "bg-indigo-50 border-indigo-500 shadow-sm" : "border-gray-200 hover:bg-gray-50"}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-400"}`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-bold ${isSelected ? "text-indigo-900" : "text-gray-800"}`}>{prog.name}</h3>
                      {prog.description && <p className="text-xs text-gray-500 mt-1">{prog.description}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= SECTION 3: NATIONWIDE PROGRAMS ================= */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Nationwide Organizations</h2>
          <p className="text-sm text-gray-500 mb-4">Select any major national organizations you are actively involved in.</p>
          
          <div className="flex flex-wrap gap-3">
            {allNationwideActs.map((act) => {
              const isSelected = selectedNationwideIds.includes(act.id);
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => handleNationwideToggle(act.id)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-bold transition-all
                    ${isSelected ? act.color + " shadow-md scale-105" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}
                  `}
                >
                  {act.name}
                  {isSelected && <span className="ml-2">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= SECTION 4: FUTURE PLANS ================= */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Post-High School Plans</h2>

          <select 
            name="postHighSchoolPlan" 
            value={plan} 
            onChange={(e) => setPlan(e.target.value)}
            className="w-full border p-2 rounded-lg mb-6"
          >
            <option value="">-- Select a Plan --</option>
            <option value="College">Four-Year College / University</option>
            <option value="Vocational">Technical College / Vocational</option>
            <option value="Workforce">Workforce</option>
            <option value="Military">Military</option>
          </select>

          {/* COLLEGE SELECTION GRID */}
          {(plan === "College" || plan === "Vocational") && (
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
              <label className="block text-sm font-bold text-blue-900 mb-3">
                Select Target Colleges
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allColleges
                  // --- FILTERING LOGIC ---
                  .filter((college) => {
                    // 1. If Vocational, only show Technical colleges
                    if (plan === "Vocational") return college.type === "Technical";
                    
                    // 2. If College, only show Universities
                    if (plan === "College") return college.type === "University";
                    
                    // 3. Fallback (Show all if something weird happens)
                    return true;
                  })
                  .map((college) => {
                    const isChecked = selectedCollegeIds.includes(college.id);
                    return (
                      <div key={college.id} className={`p-4 rounded-lg border transition-all ${isChecked ? "bg-white border-blue-500 shadow-sm" : "border-transparent hover:bg-white/50"}`}>
                        {/* Checkbox Line */}
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="collegeIds" 
                            value={college.id}
                            checked={isChecked}
                            onChange={() => handleCollegeToggle(college.id)}
                            className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-gray-800 text-lg">{college.name}</span>
                        </label>

                        {/* REQUIREMENTS & SUGGESTIONS DISPLAY */}
                        {isChecked && (
                          <div className="mt-3 ml-8 text-xs text-gray-600 space-y-3 border-l-2 border-gray-100 pl-3">
                            
                            {/* 1. Absolute Requirements */}
                            <div>
                              <p className="font-bold text-red-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span>
                                Minimum Requirements
                              </p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {college.requirements.map((req, i) => (
                                  <li key={i}>{req}</li>
                                ))}
                              </ul>
                            </div>

                            {/* 2. Suggestions (Rigor) - Only show if they exist */}
                            {college.suggestions.length > 0 && (
                              <div>
                                <p className="font-bold text-green-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                                  Rigor & Recommendations
                                </p>
                                <ul className="list-disc pl-4 space-y-0.5">
                                  {college.suggestions.map((sug, i) => (
                                    <li key={i}>{sug}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* NCAA Toggle */}
              <div className="mt-6 pt-4 border-t border-blue-200 flex items-center space-x-3">
                <input 
                  type="checkbox" name="interestedInNCAA" 
                  checked={ncaa} onChange={(e) => setNcaa(e.target.checked)}
                  className="h-5 w-5 rounded text-blue-600"
                />
                <span className="text-sm font-medium text-gray-800">I am interested in NCAA Sports Recruiting</span>
              </div>
            </div>
          )}
        </div>

        {/* ================= SECTION 5: ACTIVITIES ================= */}
        
        <SectionTable 
          title="Sports" items={mySports} allRawItems={allSports} 
          selectedId={selSport} onSelect={setSelSport} 
          onAdd={() => addItem(selSport, allSports, mySports, setMySports, setSelSport)} 
          onRemove={(id) => removeItem(id, mySports, setMySports)} 
          placeholder="Select a sport..." 
        />

        <SectionTable 
          title="Clubs" items={myClubs} allRawItems={allClubs} 
          selectedId={selClub} onSelect={setSelClub} 
          onAdd={() => addItem(selClub, allClubs, myClubs, setMyClubs, setSelClub)} 
          onRemove={(id) => removeItem(id, myClubs, setMyClubs)} 
          placeholder="Select a club..." 
        />

        <SectionTable 
          title="Courses" items={myCourses} allRawItems={allCourses} 
          selectedId={selCourse} onSelect={setSelCourse} 
          onAdd={() => addItem(selCourse, allCourses, myCourses, setMyCourses, setSelCourse)} 
          onRemove={(id) => removeItem(id, myCourses, setMyCourses)} 
          placeholder="Add a course..." 
        />

        {/* SAVE BUTTON */}
        <div className="fixed bottom-6 right-6 z-10">
          <button type="submit" disabled={isPending} className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold shadow-xl transition-all ${isPending ? "bg-blue-400" : "bg-blue-700 hover:scale-105"} text-white`}>
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- REUSABLE TABLE COMPONENT (STRICTLY TYPED) ---
interface SectionTableProps {
  title: string;
  items: SelectableItem[];
  allRawItems: RawActivityItem[]; // Uses the Union Type defined above
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  placeholder: string;
}

function SectionTable({ title, items, allRawItems, selectedId, onSelect, onAdd, onRemove, placeholder }: SectionTableProps) {
  // Filter out items already selected
  const availableItems = allRawItems.filter((raw) => !items.some((existing) => existing.id === raw.id));

  // Type-safe helper to get the extra info string
  const getDetail = (item: RawActivityItem) => {
    if ("category" in item) return item.category;
    if ("season" in item) return item.season;
    if ("department" in item) return item.department;
    return "";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
      {items.length > 0 && (
        <div className="border rounded-lg overflow-hidden mb-4">
          <table className="w-full text-left">
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.detail}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => onRemove(item.id)} className="text-red-600 text-sm font-medium hover:underline">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2">
        <select value={selectedId} onChange={(e) => onSelect(e.target.value)} className="flex-1 border p-2 rounded-lg text-sm">
          <option value="">{placeholder}</option>
          {availableItems.map((item) => <option key={item.id} value={item.id}>{item.name} ({getDetail(item)})</option>)}
        </select>
        <button type="button" onClick={onAdd} disabled={!selectedId} className="bg-gray-800 text-white px-4 rounded-lg text-sm font-medium disabled:opacity-50">Add</button>
      </div>
    </div>
  );
}