"use client";

import { useState, useTransition } from "react";
import { updateStudentProfile } from "@/app/actions/update-profile";

// Define types for our data props
type Item = { id: string; name: string; detail?: string };
type Props = {
  userId: string;
  student: any;
  allClubs: Item[];
  allSports: Item[];
  allCourses: Item[];
};

export default function ProfileEditor({ userId, student, allClubs, allSports, allCourses }: Props) {
  const [isPending, startTransition] = useTransition();

  // Local state for the lists (initialized with what the student already has)
  const [myClubs, setMyClubs] = useState<Item[]>(student.clubs || []);
  const [mySports, setMySports] = useState<Item[]>(student.sports || []);
  const [myCourses, setMyCourses] = useState<Item[]>(student.courses || []);

  // Selection state for the "Add" dropdowns
  const [selectedClubId, setSelectedClubId] = useState("");
  const [selectedSportId, setSelectedSportId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  // Generic helper to add an item
  const addItem = (
    id: string, 
    sourceList: Item[], 
    currentList: Item[], 
    setList: Function, 
    resetSelection: Function
  ) => {
    if (!id) return;
    const itemToAdd = sourceList.find((i) => i.id === id);
    if (itemToAdd && !currentList.some((i) => i.id === id)) {
      setList([...currentList, itemToAdd]);
      resetSelection(""); // Reset dropdown
    }
  };

  // Generic helper to remove an item
  const removeItem = (id: string, currentList: Item[], setList: Function) => {
    setList(currentList.filter((i) => i.id !== id));
  };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      await updateStudentProfile(userId, formData);
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Student Profile</h1>
        <p className="text-gray-600">Manage your academic details and extracurricular involvement.</p>
      </div>

      <form action={handleSubmit} className="space-y-8">
        
        {/* --- HIDDEN INPUTS (This sends the data to the server) --- */}
        {myClubs.map(item => <input key={item.id} type="hidden" name="clubIds" value={item.id} />)}
        {mySports.map(item => <input key={item.id} type="hidden" name="sportIds" value={item.id} />)}
        {myCourses.map(item => <input key={item.id} type="hidden" name="courseIds" value={item.id} />)}

        {/* --- BASIC INFO --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-800">About Me</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Current Grade Level</label>
              <select 
                name="gradeLevel" 
                defaultValue={student.gradeLevel || 9}
                className="w-full border p-2 rounded"
              >
                <option value="9">Freshman (9th)</option>
                <option value="10">Sophomore (10th)</option>
                <option value="11">Junior (11th)</option>
                <option value="12">Senior (12th)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700">Bio</label>
              <textarea 
                name="bio" 
                defaultValue={student.bio || ""} 
                className="w-full border p-2 rounded h-24" 
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>

        {/* --- CLUBS TABLE --- */}
        <SectionTable 
          title="Clubs"
          items={myClubs}
          allItems={allClubs}
          selectedId={selectedClubId}
          onSelect={setSelectedClubId}
          onAdd={() => addItem(selectedClubId, allClubs, myClubs, setMyClubs, setSelectedClubId)}
          onRemove={(id) => removeItem(id, myClubs, setMyClubs)}
          placeholder="Select a club to join..."
        />

        {/* --- SPORTS TABLE --- */}
        <SectionTable 
          title="Sports"
          items={mySports}
          allItems={allSports}
          selectedId={selectedSportId}
          onSelect={setSelectedSportId}
          onAdd={() => addItem(selectedSportId, allSports, mySports, setMySports, setSelectedSportId)}
          onRemove={(id) => removeItem(id, mySports, setMySports)}
          placeholder="Select a sport..."
        />

        {/* --- COURSES TABLE --- */}
        <SectionTable 
          title="Courses"
          items={myCourses}
          allItems={allCourses}
          selectedId={selectedCourseId}
          onSelect={setSelectedCourseId}
          onAdd={() => addItem(selectedCourseId, allCourses, myCourses, setMyCourses, setSelectedCourseId)}
          onRemove={(id) => removeItem(id, myCourses, setMyCourses)}
          placeholder="Select a course..."
        />

        {/* --- SAVE BUTTON WITH SPINNER --- */}
        <div className="fixed bottom-6 right-6 z-10">
          <button 
            type="submit" 
            disabled={isPending}
            className={`
              flex items-center gap-2 px-8 py-4 rounded-full font-bold shadow-xl transition-all
              ${isPending ? "bg-blue-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800 hover:scale-105 text-white"}
            `}
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save Changes</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

// --- REUSABLE TABLE COMPONENT ---
function SectionTable({ title, items, allItems, selectedId, onSelect, onAdd, onRemove, placeholder }: any) {
  // Filter out items already added so they don't show up in dropdown
  const availableItems = allItems.filter((i: any) => !items.some((existing: any) => existing.id === i.id));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-800">{title}</h2>
      
      {/* THE TABLE */}
      {items.length > 0 ? (
        <div className="border rounded-lg overflow-hidden mb-4">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.detail || item.category || item.season || item.department || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic mb-4">No {title.toLowerCase()} selected yet.</p>
      )}

      {/* THE "ADD" ROW */}
      <div className="flex gap-2">
        <select 
          value={selectedId} 
          onChange={(e) => onSelect(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
        >
          <option value="">{placeholder}</option>
          {availableItems.map((item: any) => (
            <option key={item.id} value={item.id}>
              {item.name} {item.detail ? `(${item.detail})` : ""}
            </option>
          ))}
        </select>
        <button 
          type="button"
          onClick={onAdd}
          disabled={!selectedId}
          className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add {title.slice(0, -1)} {/* Slices 's' off 'Clubs' -> 'Club' */}
        </button>
      </div>
    </div>
  );
}