import React, { useState } from 'react';
import { Calendar, Plus, Sparkles, Trash2, Edit2, Check, X, AlertTriangle, HelpCircle } from 'lucide-react';
import { Subject, ClassItem, ClassState } from '../types';

interface ScheduleViewProps {
  subjects: Subject[];
  classes: ClassItem[];
  onAddClass: (newClass: Omit<ClassItem, 'id'>) => void;
  onRemoveClass: (classId: string) => void;
  onUpdateClassState: (classId: string, state: ClassState, updates?: Partial<ClassItem>) => void;
  onOpenScanner: () => void;
  onAddSubject?: (name: string, code: string, target: number) => Subject;
}

type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export default function ScheduleView({
  subjects,
  classes,
  onAddClass,
  onRemoveClass,
  onUpdateClassState,
  onOpenScanner,
  onAddSubject
}: ScheduleViewProps) {
  const [selectedDay, setSelectedDay] = useState<WeekDay>('Monday');
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newRoom, setNewRoom] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [newClassState, setNewClassState] = useState<ClassState>('regular');

  // Inline dynamic subject builder State
  const [isCreatingNewSubject, setIsCreatingNewSubject] = useState(false);
  const [inlineSubjectName, setInlineSubjectName] = useState('');
  const [inlineSubjectCode, setInlineSubjectCode] = useState('');

  const daysList: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Filter classes for selected day
  const filteredClasses = classes
    .filter(cls => cls.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectId) return;

    const matchedSub = subjects.find(s => s.id === newSubjectId);
    if (!matchedSub) return;

    onAddClass({
      subjectId: newSubjectId,
      subjectName: matchedSub.name,
      day: selectedDay,
      startTime: newStartTime,
      endTime: newEndTime,
      room: newRoom,
      teacher: newTeacher,
      state: newClassState
    });

    // Reset Form
    setNewSubjectId('');
    setNewRoom('');
    setNewTeacher('');
    setIsAddingSlot(false);
  };

  const handleCreateInlineSubject = () => {
    if (!inlineSubjectName.trim()) return;
    if (onAddSubject) {
      const newSub = onAddSubject(inlineSubjectName.trim(), inlineSubjectCode.trim(), 75);
      setNewSubjectId(newSub.id);
      setIsCreatingNewSubject(false);
      setInlineSubjectName('');
      setInlineSubjectCode('');
    }
  };

  return (
    <div id="schedule-view-container" className="space-y-6 pb-24 animate-fade-in text-bunk-text-light dark:text-bunk-text-dark">
      
      {/* Header section with scanner and action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">Weekly Timetable</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1">Class Schedules</h2>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            id="ai-scan-schedule-btn"
            onClick={onOpenScanner}
            className="flex-1 sm:flex-initial px-4 py-2 bg-bunk-accent dark:bg-bunk-accent-dark text-white rounded-xl text-sm font-semibold hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            AI Scan Schedule
          </button>
          
          <button
            id="add-manual-slot-btn"
            onClick={() => {
              setNewClassState('regular');
              // Toggle or switch state
              if (isAddingSlot && newClassState === 'regular') {
                setIsAddingSlot(false);
              } else {
                setIsAddingSlot(true);
              }
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isAddingSlot && newClassState === 'regular'
                ? 'bg-neutral-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-bunk-accent dark:text-bunk-accent-dark'
                : 'border-bunk-border-light dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            Add Manual Slot
          </button>

          <button
            id="add-extra-class-btn"
            onClick={() => {
              setNewClassState('extra');
              // Toggle or switch state
              if (isAddingSlot && newClassState === 'extra') {
                setIsAddingSlot(false);
              } else {
                setIsAddingSlot(true);
              }
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isAddingSlot && newClassState === 'extra'
                ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700/50 text-[#C56E4A]'
                : 'border-bunk-border-light dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 text-amber-600 dark:text-amber-500'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            Add Extra Class
          </button>
        </div>
      </div>

      {/* Manual Slot Creator Drawer/Card */}
      {isAddingSlot && (
        <form id="schedule-creator-form" onSubmit={handleCreateSlot} className="bunk-card p-6 bg-white dark:bg-zinc-900 border border-bunk-border-light dark:border-zinc-800 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-bunk-border-light dark:border-zinc-800 pb-3">
            <h4 className="font-bold text-sm uppercase tracking-wide text-bunk-sub-light dark:text-bunk-sub-dark flex items-center gap-2">
              {newClassState === 'extra' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>New Extra Class ({selectedDay})</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#2E5E4E]" />
                  <span>New Schedule Slot ({selectedDay})</span>
                </>
              )}
            </h4>
            <button type="button" onClick={() => setIsAddingSlot(false)} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              {!isCreatingNewSubject ? (
                <>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">Subject Course</label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewSubject(true)}
                      className="text-[10px] text-[#2E5E4E] dark:text-[#6ba18f] hover:underline font-extrabold cursor-pointer uppercase tracking-wider"
                    >
                      + Create New
                    </button>
                  </div>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full text-sm border border-bunk-border-light dark:border-zinc-800 rounded-xl p-2.5 bg-bunk-bg-light dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark"
                    required
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </>
              ) : (
                <div className="space-y-2 p-3 bg-neutral-50/70 dark:bg-zinc-950/40 border border-dashed border-bunk-border-light dark:border-zinc-800 rounded-xl animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#C56E4A]">Quick Subject Creator</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewSubject(false)}
                      className="text-[9px] text-[#6B6B6B] dark:text-zinc-400 hover:underline font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Use Dropdown
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Chemistry"
                    value={inlineSubjectName}
                    onChange={(e) => setInlineSubjectName(e.target.value)}
                    className="w-full text-xs font-semibold p-2 border border-bunk-border-light dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-bunk-text-light dark:text-bunk-text-dark focus:outline-none focus:border-[#C56E4A]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. CH101)"
                    value={inlineSubjectCode}
                    onChange={(e) => setInlineSubjectCode(e.target.value)}
                    className="w-full text-xs p-2 border border-bunk-border-light dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-bunk-text-light dark:text-bunk-text-dark focus:outline-none"
                  />
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewSubject(false)}
                      className="px-2 py-1 text-[9px] border border-bunk-border-light dark:border-zinc-700 rounded-md hover:bg-neutral-50 dark:hover:bg-zinc-800 cursor-pointer uppercase font-extrabold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateInlineSubject}
                      className="px-2 py-1 text-[9px] bg-[#2E5E4E] dark:bg-[#4E7A69] text-white rounded-md hover:opacity-90 cursor-pointer uppercase font-extrabold"
                    >
                      Create & Select
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">Start Time</label>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full text-sm border border-bunk-border-light dark:border-zinc-800 rounded-xl p-2 bg-bunk-bg-light dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">End Time</label>
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full text-sm border border-bunk-border-light dark:border-zinc-800 rounded-xl p-2 bg-bunk-bg-light dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">Room / Lab</label>
              <input
                type="text"
                placeholder="e.g. Lab 3, Hall B"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="w-full text-sm border border-bunk-border-light dark:border-zinc-800 rounded-xl p-2.5 bg-bunk-bg-light dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">Teacher / Professor</label>
              <input
                type="text"
                placeholder="e.g. Dr. Roberts"
                value={newTeacher}
                onChange={(e) => setNewTeacher(e.target.value)}
                className="w-full text-sm border border-bunk-border-light dark:border-zinc-800 rounded-xl p-2.5 bg-bunk-bg-light dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingSlot(false)}
              className="px-4 py-2 border border-bunk-border-light dark:border-zinc-800 text-xs font-semibold rounded-xl text-bunk-text-light dark:text-bunk-text-dark hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2E5E4E] dark:bg-[#4E7A69] text-white text-xs font-semibold rounded-xl hover:opacity-95 shadow-sm"
            >
              Save Schedule Slot
            </button>
          </div>
        </form>
      )}

      {/* Week Day Horizontal Chooser */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full">
        {daysList.map(d => {
          const isSelected = selectedDay === d;
          const count = classes.filter(cls => cls.day === d).length;

          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold tracking-tight transition-all duration-300 flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-white dark:bg-bunk-card-dark text-bunk-accent dark:text-bunk-accent-dark border border-bunk-border-light dark:border-zinc-700 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              {d.slice(0, 3)}
              {count > 0 && (
                <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-mono font-bold ${
                  isSelected ? 'bg-bunk-accent dark:bg-bunk-accent-dark text-white' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timetable List view */}
      <div className="space-y-4">
        {filteredClasses.length === 0 ? (
          /* Empty State Illustration */
          <div className="bunk-card p-12 text-center flex flex-col items-center justify-center space-y-4 bg-white dark:bg-zinc-900/40">
            <div className="p-4 bg-bunk-bg-light dark:bg-zinc-800/40 rounded-full">
              <Calendar className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="max-w-sm space-y-1">
              <p className="font-bold text-base tracking-tight">No classes scheduled on {selectedDay}</p>
              <p className="text-xs text-bunk-sub-light dark:text-bunk-sub-dark leading-relaxed">
                Import your university timetable screenshot with our smart AI Scanner to fill the weekly schedule automatically, or add classes manually.
              </p>
            </div>
            <button
              onClick={onOpenScanner}
              className="px-4 py-2 bg-[#2E5E4E] text-white hover:opacity-95 transition-all text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Upload screenshot to parse
            </button>
          </div>
        ) : (
          filteredClasses.map((cls) => {
            return (
              <div
                key={cls.id}
                className="bunk-card p-5 bg-white dark:bg-bunk-card-dark flex flex-col justify-between gap-1 relative transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
                  {/* Left contents */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-bunk-sub-light dark:text-bunk-sub-dark bg-bunk-bg-light dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                        {cls.startTime} - {cls.endTime}
                      </span>
                      {cls.room && (
                        <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 bg-neutral-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          {cls.room}
                        </span>
                      )}
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        cls.state === 'regular' ? 'bg-[#7D9A7B]/15 text-[#7D9A7B]' :
                        cls.state === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                        cls.state === 'extra' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {cls.state === 'rescheduled' && cls.rescheduledDate
                          ? `Rescheduled: ${cls.rescheduledDate}${cls.rescheduledTime ? ` @ ${cls.rescheduledTime}` : ''}`
                          : cls.state === 'extra'
                          ? 'Extra Class'
                          : `${cls.state} Session`
                        }
                      </span>
                    </div>
                    
                    <div className="space-y-0.5">
                      <h4 className={`text-lg font-extrabold tracking-tight ${cls.state === 'cancelled' ? 'line-through opacity-40' : ''}`}>
                        {cls.subjectName}
                      </h4>
                      {cls.teacher && (
                        <p className="text-xs text-bunk-sub-light dark:text-bunk-sub-dark font-medium">Lecturer: {cls.teacher}</p>
                      )}
                    </div>
                  </div>

                  {/* Right controls */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800 justify-end">
                    <span className="text-[10px] text-bunk-sub-light dark:text-bunk-sub-dark font-mono font-medium hidden md:inline">Change Class Condition:</span>
                    <select
                      value={cls.state}
                      onChange={(e) => onUpdateClassState(cls.id, e.target.value as ClassState)}
                      className="text-xs border border-bunk-border-light dark:border-zinc-700 bg-bunk-bg-light dark:bg-zinc-900 rounded-lg p-1.5 focus:outline-none focus:border-bunk-accent text-bunk-text-light dark:text-bunk-text-dark font-semibold cursor-pointer"
                    >
                      <option value="regular">Regular</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="extra">Extra Hour</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>

                    <button
                      onClick={() => onRemoveClass(cls.id)}
                      className="p-2 border border-red-200 dark:border-red-950/40 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors tooltip shrink-0 cursor-pointer"
                      title="Remove session class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rescheduled details editor section */}
                {cls.state === 'rescheduled' && (
                  <div className="mt-4 pt-4 border-t border-dashed border-bunk-border-light dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-lg">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#C56E4A] block">
                        New Rescheduled Date
                      </label>
                      <input
                        type="date"
                        value={cls.rescheduledDate || ''}
                        onChange={(e) => onUpdateClassState(cls.id, 'rescheduled', { rescheduledDate: e.target.value })}
                        className="w-full text-xs border border-bunk-border-light dark:border-zinc-700 rounded-xl p-2.5 bg-bunk-bg-light dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark font-semibold focus:outline-none focus:border-[#C56E4A]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#C56E4A] block">
                        New Rescheduled Time
                      </label>
                      <input
                        type="time"
                        value={cls.rescheduledTime || ''}
                        onChange={(e) => onUpdateClassState(cls.id, 'rescheduled', { rescheduledTime: e.target.value })}
                        className="w-full text-xs border border-bunk-border-light dark:border-zinc-700 rounded-xl p-2.5 bg-bunk-bg-light dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark font-semibold focus:outline-none focus:border-[#C56E4A]"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
