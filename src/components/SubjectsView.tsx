import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Edit2, CheckCircle2, XCircle, Undo2, Sliders, ChevronDown, ChevronUp, History, Percent, Check, X } from 'lucide-react';
import { Subject, DayLog } from '../types';
import { calculateSubjectMetrics } from '../utils/calculations';
import { motion, AnimatePresence } from 'motion/react';

interface SwipeableLogItemProps {
  key?: string;
  log: DayLog;
  onDelete: (id: string) => void;
}

function SwipeableLogItem({ log, onDelete }: SwipeableLogItemProps) {
  return (
    <motion.div
      key={log.id}
      layout
      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
      className="relative overflow-hidden group border-b last:border-0 border-neutral-100 dark:border-zinc-800"
    >
      {/* Background/Underlay Delete Action */}
      <div className="absolute inset-0 bg-red-600 dark:bg-red-750 flex items-center justify-end px-4 text-white">
        <div className="flex items-center gap-1.5 font-bold font-mono text-[10px] uppercase tracking-wider">
          <Trash2 className="w-3.5 h-3.5" />
          <span>Release to delete</span>
        </div>
      </div>

      {/* Draggable Foreground */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -300, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.02 }}
        onDragEnd={(_, info) => {
          // If swiped left past -95px, trigger delete.
          if (info.offset.x < -95) {
            onDelete(log.id);
          }
        }}
        className="p-2.5 flex justify-between items-center bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800/20 font-mono text-xs relative z-10 select-none touch-pan-y"
      >
        <span className="text-zinc-650 dark:text-zinc-400 font-medium">{log.date}</span>
        <div className="flex items-center gap-3">
          <span className={`font-semibold uppercase tracking-wider text-[10px] rounded px-1.5 py-0.5 ${
            log.status === 'present' ? 'bg-[#7D9A7B]/10 text-[#7D9A7B]' : 'bg-red-500/10 text-red-500'
          }`}>
            {log.status}
          </span>
          <button
            onClick={() => onDelete(log.id)}
            className="text-zinc-400 hover:text-red-500 p-0.5 relative z-20 cursor-pointer hidden sm:block"
            title="Undo / Delete log"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface SubjectsViewProps {
  subjects: Subject[];
  logs: DayLog[];
  onAddSubject: (name: string, code: string, target: number) => void;
  onUpdateSubjectAttendance: (subjectId: string, attended: number, missed: number) => void;
  onUpdateSubjectTarget: (subjectId: string, target: number) => void;
  onDeleteSubject: (subjectId: string) => void;
  onLogRetroactive: (subjectId: string, status: 'present' | 'absent', dateString: string) => void;
  onDeleteLog: (logId: string) => void;
}

export default function SubjectsView({
  subjects,
  logs,
  onAddSubject,
  onUpdateSubjectAttendance,
  onUpdateSubjectTarget,
  onDeleteSubject,
  onLogRetroactive,
  onDeleteLog
}: SubjectsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newTarget, setNewTarget] = useState(75);

  const [expandedLogsId, setExpandedLogsId] = useState<string | null>(null);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [tempTarget, setTempTarget] = useState<number>(75);

  const [retroDate, setRetroDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddSubject(newName.trim(), newCode.trim(), newTarget);
    setNewName('');
    setNewCode('');
    setIsAdding(false);
  };

  const handleSaveTarget = (subId: string) => {
    onUpdateSubjectTarget(subId, tempTarget);
    setEditingTargetId(null);
  };

  const getHealthTag = (status: 'excellent' | 'safe' | 'warning' | 'critical') => {
    switch (status) {
      case 'excellent':
        return 'bg-[#7D9A7B]/15 text-[#7D9A7B] border-[#7D9A7B]/20';
      case 'safe':
        return 'bg-[#2E5E4E]/10 text-[#2E5E4E] dark:text-[#4E7A69] border-[#2E5E4E]/20';
      case 'warning':
        return 'bg-amber-500/10 text-[#C56E4A] border-amber-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20';
    }
  };

  return (
    <div id="subjects-view-container" className="space-y-6 pb-24 animate-fade-in text-bunk-text-light dark:text-bunk-text-dark">
      
      {/* Header Column */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">Subject Directory</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1">Manage Courses</h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-[#2E5E4E] dark:bg-[#4E7A69] text-white rounded-xl text-sm font-semibold hover:opacity-95 transition-opacity flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {/* Manual creation form card */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bunk-card p-6 bg-white dark:bg-zinc-900 border border-bunk-border-light dark:border-zinc-800 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-bunk-border-light dark:border-zinc-800 pb-3">
            <h4 className="font-bold text-sm uppercase tracking-wide text-bunk-sub-light dark:text-bunk-sub-dark">Create New Academic Course</h4>
            <button type="button" onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 col-span-1">
              <label className="text-xs font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">Course Title</label>
              <input
                type="text"
                placeholder="e.g. Chemical Engineering, Physics"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-sm border border-bunk-border-light dark:border-zinc-800 rounded-xl p-2.5 bg-bunk-bg-light dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark"
                required
              />
            </div>

            <div className="space-y-1 col-span-1">
              <label className="text-xs font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">Subject code / label</label>
              <input
                type="text"
                placeholder="e.g. PHY-101"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full text-sm border border-bunk-border-light dark:border-zinc-800 rounded-xl p-2.5 bg-bunk-bg-light dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark font-mono"
              />
            </div>

            <div className="space-y-1 col-span-1">
              <label className="text-xs font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">Target Attendance Preset</label>
              <select
                value={newTarget}
                onChange={(e) => setNewTarget(Number(e.target.value))}
                className="w-full text-sm border border-bunk-border-light dark:border-zinc-800 rounded-xl p-2.5 bg-bunk-bg-light dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark"
              >
                <option value={75}>75% (Minimum Standard)</option>
                <option value={80}>80% (Safe Cushion)</option>
                <option value={85}>85% (Distinction)</option>
                <option value={90}>90% (Scholarship Tier)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-bunk-border-light dark:border-zinc-800 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2E5E4E] text-white text-xs font-semibold rounded-xl hover:opacity-95 shadow-sm"
            >
              Add Course Material
            </button>
          </div>
        </form>
      )}

      {/* Main Subjects Card Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map(sub => {
          const metrics = calculateSubjectMetrics(sub);
          const isLogsExpanded = expandedLogsId === sub.id;
          const isEditingTarget = editingTargetId === sub.id;
          const subjectLogs = logs.filter(log => log.subjectId === sub.id);

          return (
            <div key={sub.id} className="bunk-card flex flex-col bg-white dark:bg-bunk-card-dark border border-bunk-border-light dark:border-zinc-800/80 animate-fade-in relative">
              
              {/* Header Box of Subject Card */}
              <div className="p-6 border-b border-bunk-border-light dark:border-zinc-85 border-dashed">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    {sub.code && (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-bunk-sub-light dark:text-bunk-sub-dark">
                        {sub.code}
                      </span>
                    )}
                    <h3 className="text-xl font-extrabold tracking-tight text-bunk-text-light dark:text-bunk-text-dark">
                      {sub.name}
                    </h3>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0 gap-1.5">
                    <span className="text-3xl font-black font-mono tracking-tighter">
                      {metrics.percentage}%
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getHealthTag(metrics.healthStatus)}`}>
                      {metrics.healthStatus}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-100 dark:bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, metrics.percentage)}%`,
                      backgroundColor: metrics.percentage >= sub.targetPercentage ? '#2E5E4E' : '#C56E4A'
                    }}
                  />
                </div>
              </div>

              {/* Core numbers of Subject Card */}
              <div className="p-6 grid grid-cols-2 gap-x-4 border-b border-bunk-border-light dark:border-zinc-800 px-6 py-4">
                <div className="flex justify-between items-center py-2 border-r border-bunk-border-light dark:border-zinc-800 pr-4">
                  <div className="space-y-0.5">
                    <span className="text-xs text-bunk-sub-light dark:text-bunk-sub-dark font-medium">Attended</span>
                    <p className="text-xl font-bold font-mono text-zinc-800 dark:text-zinc-100">{sub.attended}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onUpdateSubjectAttendance(sub.id, sub.attended + 1, sub.missed)}
                      className="p-1 rounded bg-neutral-50 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-700 min-w-[24px] text-xs font-bold font-mono"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => onUpdateSubjectAttendance(sub.id, Math.max(0, sub.attended - 1), sub.missed)}
                      className="p-1 rounded bg-neutral-50 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-700 min-w-[24px] text-xs font-bold"
                    >
                      -1
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 pl-4">
                  <div className="space-y-0.5">
                    <span className="text-xs text-bunk-sub-light dark:text-bunk-sub-dark font-medium font-mono">Missed</span>
                    <p className="text-xl font-bold font-mono text-[#C56E4A]">{sub.missed}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onUpdateSubjectAttendance(sub.id, sub.attended, sub.missed + 1)}
                      className="p-1 rounded bg-neutral-50 dark:bg-zinc-800 text-[#C56E4A] hover:bg-neutral-100 dark:hover:bg-zinc-700 min-w-[24px] text-xs font-bold font-mono"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => onUpdateSubjectAttendance(sub.id, sub.attended, Math.max(0, sub.missed - 1))}
                      className="p-1 rounded bg-neutral-50 dark:bg-zinc-800 text-[#C56E4A] hover:bg-neutral-100 dark:hover:bg-zinc-700 min-w-[24px] text-xs font-bold font-mono"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>

              {/* Bunk advice in Plain Language */}
              <div className="p-6 bg-bunk-bg-light/40 dark:bg-zinc-900/10 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-bunk-border-light dark:border-zinc-80 my-0.5">
                <div className="space-y-0.5 flex-1">
                  {metrics.canBunk > 0 ? (
                    <p className="text-sm font-bold text-[#2E5E4E] dark:text-[#4E7A69]">
                      Can miss {metrics.canBunk} more lectures safely.
                    </p>
                  ) : metrics.needToAttend > 0 ? (
                    <p className="text-sm font-bold text-[#C56E4A]">
                      Attend next {metrics.needToAttend} classes to reach {sub.targetPercentage}%.
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-[#7D9A7B] font-mono">
                      Critically aligned on target percentage limits.
                    </p>
                  )}
                  <p className="text-[10px] text-bunk-sub-light dark:text-bunk-sub-dark font-medium">
                    Calculated on standard requirements & registered total {metrics.total} classes.
                  </p>
                </div>

                <div className="shrink-0 flex items-center">
                  {isEditingTarget ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="50"
                        max="95"
                        value={tempTarget}
                        onChange={(e) => setTempTarget(Number(e.target.value))}
                        className="w-12 text-xs border border-bunk-border-light dark:border-zinc-700 bg-white dark:bg-zinc-800 text-bunk-text-light dark:text-bunk-text-dark font-mono p-1 rounded-md text-center"
                      />
                      <button onClick={() => handleSaveTarget(sub.id)} className="p-1 text-emerald-600 rounded hover:bg-neutral-100 dark:hover:bg-zinc-800">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingTargetId(null)} className="p-1 text-red-500 rounded hover:bg-neutral-100 dark:hover:bg-zinc-800">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTargetId(sub.id);
                        setTempTarget(sub.targetPercentage);
                      }}
                      className="text-[10px] bg-neutral-50 hover:bg-neutral-100 dark:hover:bg-zinc-800 p-1.5 rounded-lg flex items-center gap-1 border border-bunk-border-light dark:border-zinc-700 font-semibold text-zinc-500"
                    >
                      <Sliders className="w-3 h-3" />
                      Target: {sub.targetPercentage}%
                    </button>
                  )}
                </div>
              </div>

              {/* Lower panel triggers (Logs, Delete etc.) */}
              <div className="px-6 py-3 flex justify-between items-center text-xs border-t border-dashed border-bunk-border-light dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/10">
                <button
                  onClick={() => setExpandedLogsId(isLogsExpanded ? null : sub.id)}
                  className="flex items-center gap-1.5 font-bold hover:text-zinc-900 text-zinc-500 hover:underline"
                >
                  <History className="w-3.5 h-3.5" />
                  Logs / Attendance Checklist
                  {isLogsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {confirmDeleteId === sub.id ? (
                  <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-955/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider font-mono">Delete?</span>
                    <button
                      onClick={() => {
                        onDeleteSubject(sub.id);
                        setConfirmDeleteId(null);
                      }}
                      className="px-1.5 py-0.5 bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold rounded cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[9px] font-bold rounded cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(sub.id)}
                    className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                    title="Remove Course Material"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Expandable retroactive logging list and state history */}
              {isLogsExpanded && (
                <div className="p-6 bg-bunk-bg-light/60 dark:bg-zinc-900/30 border-t border-bunk-border-light dark:border-zinc-800 space-y-4 animate-fade-in text-xs">
                  
                  {/* Action row to Log retro attendance */}
                  <div className="space-y-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-bunk-border-light dark:border-zinc-800">
                    <p className="font-semibold text-bunk-text-light dark:text-bunk-text-dark">Log Custom Retroactive attendance</p>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="date"
                        value={retroDate}
                        onChange={(e) => setRetroDate(e.target.value)}
                        className="w-full sm:w-auto p-1.5 border border-bunk-border-light dark:border-zinc-700 rounded text-xs text-bunk-text-light dark:text-bunk-text-dark bg-transparent"
                      />
                      <div className="flex gap-1.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => onLogRetroactive(sub.id, 'present', retroDate)}
                          className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#2E5E4E] hover:opacity-95 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Check className="w-3 h-3" /> Present
                        </button>
                        <button
                          type="button"
                          onClick={() => onLogRetroactive(sub.id, 'absent', retroDate)}
                          className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#C56E4A] hover:opacity-95 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                        >
                          <X className="w-3 h-3" /> Absent
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Log list */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-bunk-sub-light dark:text-bunk-sub-dark">Logged Sessions checklist</p>
                      <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-400 italic">← Swipe left to delete</span>
                    </div>
                    {subjectLogs.length === 0 ? (
                      <p className="text-zinc-400 italic py-2 pl-1 font-mono">No sessions logged manually for this subject yet.</p>
                    ) : (
                      <div className="max-h-[180px] overflow-y-auto border border-bunk-border-light dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-x-hidden">
                        <AnimatePresence initial={false}>
                          {subjectLogs.map(log => (
                            <SwipeableLogItem key={log.id} log={log} onDelete={onDeleteLog} />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
