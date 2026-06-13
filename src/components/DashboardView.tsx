import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Calendar, ChevronRight, UserPlus, BookOpen, Clock, HeartHandshake, CalendarOff, X } from 'lucide-react';
import { Subject, ClassItem, DayLog, UserPreferences, ClassState } from '../types';
import { calculateSubjectMetrics, calculateOverallMetrics, SubjectMetrics, OverallMetrics } from '../utils/calculations';

interface DashboardViewProps {
  subjects: Subject[];
  classes: ClassItem[];
  logs: DayLog[];
  preferences: UserPreferences;
  onLogAttendance: (subjectId: string, status: 'present' | 'absent', classId?: string) => void;
  onNavigateToTab: (tab: 'home' | 'schedule' | 'subjects' | 'analytics' | 'profile') => void;
  onUpdateClassState: (classId: string, state: ClassState, updates?: Partial<ClassItem>) => void;
  onAddClass?: (newClass: Omit<ClassItem, 'id'>) => void;
  onDeleteLog?: (logId: string) => void;
}

export default function DashboardView({
  subjects,
  classes,
  logs,
  preferences,
  onLogAttendance,
  onNavigateToTab,
  onUpdateClassState,
  onAddClass,
  onDeleteLog
}: DashboardViewProps) {
  const [reschedulingId, setReschedulingId] = React.useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState('');
  const [rescheduleTime, setRescheduleTime] = React.useState('');

  // Quick Extra Class State
  const [isAddingQuickExtra, setIsAddingQuickExtra] = React.useState(false);
  const [quickSubjectId, setQuickSubjectId] = React.useState('');
  const [quickStartTime, setQuickStartTime] = React.useState('10:00');
  const [quickEndTime, setQuickEndTime] = React.useState('11:00');
  const [quickRoom, setQuickRoom] = React.useState('');

  const handleCreateQuickExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSubjectId || !onAddClass) return;

    const matchedSub = subjects.find(s => s.id === quickSubjectId);
    if (!matchedSub) return;

    onAddClass({
      subjectId: quickSubjectId,
      subjectName: matchedSub.name,
      day: currentDayName,
      startTime: quickStartTime,
      endTime: quickEndTime,
      room: quickRoom,
      teacher: '',
      state: 'extra'
    });

    // Reset and close
    setQuickSubjectId('');
    setQuickRoom('');
    setIsAddingQuickExtra(false);
  };
  
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Days mapping
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = days[new Date().getDay()] as ClassItem['day'];

  // Overall calculations
  const overall = calculateOverallMetrics(subjects, preferences.globalTarget);

  // Today's classes from the schedule
  const todayClasses = classes
    .filter(cls => cls.day === currentDayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Build subject lookup
  const getSubjectMetrics = (subjectId: string): SubjectMetrics | null => {
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return null;
    return calculateSubjectMetrics(sub);
  };

  // Smart Insights List
  const getSmartInsights = () => {
    const list: { text: string; subtext: string; type: 'excellent' | 'safe' | 'warning' | 'critical' }[] = [];
    
    subjects.forEach(sub => {
      const metrics = calculateSubjectMetrics(sub);
      if (metrics.canBunk > 0) {
        list.push({
          text: `You can miss ${metrics.canBunk} more ${sub.name} class${metrics.canBunk > 1 ? 'es' : ''} safely.`,
          subtext: `Current: ${metrics.percentage}% (Target: ${sub.targetPercentage}%)`,
          type: metrics.healthStatus
        });
      } else if (metrics.needToAttend > 0) {
        list.push({
          text: `Attend the next ${metrics.needToAttend} ${sub.name} classes to return above ${sub.targetPercentage}%.`,
          subtext: `Currently at ${metrics.percentage}%, below your target.`,
          type: 'warning'
        });
      } else {
        list.push({
          text: `${sub.name} is exactly at your target range.`,
          subtext: `Keep attending consecutive sessions to secure safe status.`,
          type: 'safe'
        });
      }
    });

    return list.slice(0, 3); // show top 3 insights
  };

  const insights = getSmartInsights();

  // Status color mapper
  const getHealthColors = (status: OverallMetrics['healthStatus']) => {
    switch (status) {
      case 'excellent':
        return {
          bg: 'bg-[#7D9A7B]/10 dark:bg-emerald-950/20',
          text: 'text-[#7D9A7B] dark:text-[#7D9A7B]',
          label: 'Excellent Zone',
          border: 'border-[#7D9A7B]/20'
        };
      case 'safe':
        return {
          bg: 'bg-[#2E5E4E]/10 dark:bg-[#4E7A69]/20',
          text: 'text-[#2E5E4E] dark:text-[#4E7A69]',
          label: 'Safe Zone',
          border: 'border-[#2E5E4E]/20'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/10',
          text: 'text-[#C56E4A] dark:text-[#C56E4A]',
          label: 'Warning Zone',
          border: 'border-amber-500/20'
        };
      case 'critical':
        return {
          bg: 'bg-red-500/10 dark:bg-red-500/10',
          text: 'text-red-500 dark:text-red-400',
          label: 'Critical Danger',
          border: 'border-red-500/20'
        };
    }
  };

  const currentHealth = getHealthColors(overall.healthStatus);

  return (
    <div id="dashboard-view-container" className="space-y-12 pb-24 animate-fade-in text-bunk-text-light dark:text-bunk-text-dark">
      
      <main className="flex flex-col lg:flex-row gap-12 lg:items-stretch">
        {/* Left Column: Hero Metric & Health */}
        <section className="lg:w-1/2 flex flex-col justify-between gap-8 sm:gap-10">
          <div>
            <p className="text-xs sm:text-sm text-bunk-sub-light dark:text-zinc-400 uppercase tracking-[0.2em] mb-2 font-bold select-none">
              {getGreeting()}, {preferences.name || 'Aris'}
            </p>
            <h1 className="text-[100px] sm:text-[140px] leading-none font-black tracking-tighter text-bunk-text-light dark:text-bunk-text-dark select-none">
              {overall.percentage}%
            </h1>
            
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={`px-4 py-1.5 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm ${
                overall.percentage >= preferences.globalTarget 
                  ? 'bg-[#2E5E4E] dark:bg-[#4E7A69]' 
                  : 'bg-[#C56E4A]'
              }`}>
                {currentHealth.label}
              </span>
              <span className="text-xs sm:text-sm text-bunk-sub-light dark:text-zinc-400 font-medium">
                Overall attendance is {overall.percentage >= preferences.globalTarget ? 'healthy' : 'at risk'}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-bunk-card-dark rounded-[20px] p-6 sm:p-8 border border-bunk-border-light dark:border-zinc-800 shadow-sm space-y-6 lg:mt-auto">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-bunk-sub-light dark:text-zinc-400 font-mono">
              Smart Academic Insight
            </h3>
            <p className="text-xl sm:text-2xl font-bold leading-snug text-bunk-text-light dark:text-bunk-text-dark">
              {insights.length > 0 ? (
                <span>
                  You may miss <span className="text-[#C56E4A] font-extrabold">{insights[0].text.match(/\d+/) ? `${insights[0].text.match(/\d+/)} more class` : 'sessions'}</span> safely without dropping below your target.
                </span>
              ) : (
                <span>Setup your academic courses to activate dynamic predictive calculations.</span>
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigateToTab('schedule')}
                className="bg-[#2E5E4E] dark:bg-[#4E7A69] text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:opacity-90 transition-all shadow-sm"
              >
                Plan a Bunk
              </button>
              <button
                onClick={() => onNavigateToTab('subjects')}
                className="border border-bunk-border-light dark:border-zinc-700 text-bunk-text-light dark:text-bunk-text-dark px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Subject Details
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Schedule & Subject Health */}
        <section className="lg:w-1/2 flex flex-col gap-8">
          
          {/* Today's Schedule Card */}
          <div className="bg-white dark:bg-bunk-card-dark rounded-[20px] p-6 sm:p-8 border border-bunk-border-light dark:border-zinc-800 shadow-sm flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-8 border-b border-dashed border-bunk-border-light dark:border-zinc-800 pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-bunk-sub-light dark:text-zinc-400">
                  Today's Schedule
                </h3>
                {onAddClass && subjects.length > 0 && (
                  <button
                    id="dashboard-add-extra-class-btn"
                    onClick={() => setIsAddingQuickExtra(!isAddingQuickExtra)}
                    className="px-2 py-0.5 border border-amber-300 dark:border-amber-700/50 bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:opacity-90 active:scale-95 text-[9px] uppercase font-extrabold tracking-wider rounded transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Quick Extra Class</span>
                  </button>
                )}
              </div>
              <span className="text-[10px] tracking-widest uppercase font-mono text-zinc-500 dark:text-zinc-400 font-bold hidden sm:inline">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' })}
              </span>
            </div>

            {isAddingQuickExtra && (
              <form onSubmit={handleCreateQuickExtra} className="mb-6 p-4 bg-neutral-50/70 dark:bg-zinc-950/40 border border-dashed border-amber-500/30 rounded-xl space-y-3 animate-fade-in text-left">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-zinc-800/80">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C56E4A]">
                    Add Surprise Extra Class Today
                  </span>
                  <button type="button" onClick={() => setIsAddingQuickExtra(false)} className="text-zinc-400 hover:text-zinc-655 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#6B6B6B] dark:text-zinc-500 font-mono">Select Subject</label>
                    <select
                      value={quickSubjectId}
                      onChange={(e) => setQuickSubjectId(e.target.value)}
                      className="w-full text-xs font-semibold p-2 border border-bunk-border-light dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-900 rounded-lg text-bunk-text-light dark:text-bunk-text-dark focus:outline-none"
                      required
                    >
                      <option value="">Choose subject...</option>
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#6B6B6B] dark:text-zinc-500 font-mono">Room / Laboratory</label>
                    <input
                      type="text"
                      placeholder="e.g. Hall C, Lab 2"
                      value={quickRoom}
                      onChange={(e) => setQuickRoom(e.target.value)}
                      className="w-full text-xs font-semibold p-2 border border-bunk-border-light dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-900 rounded-lg text-bunk-text-light dark:text-bunk-text-dark focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#6B6B6B] dark:text-zinc-500 font-mono">Start Time</label>
                    <input
                      type="time"
                      value={quickStartTime}
                      onChange={(e) => setQuickStartTime(e.target.value)}
                      className="w-full text-xs font-semibold p-2 border border-bunk-border-light dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-900 rounded-lg text-bunk-text-light dark:text-bunk-text-dark focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#6B6B6B] dark:text-zinc-500 font-mono">End Time</label>
                    <input
                      type="time"
                      value={quickEndTime}
                      onChange={(e) => setQuickEndTime(e.target.value)}
                      className="w-full text-xs font-semibold p-2 border border-bunk-border-light dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-900 rounded-lg text-bunk-text-light dark:text-bunk-text-dark focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end text-[10px] font-bold uppercase tracking-widest pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingQuickExtra(false)}
                    className="px-3 py-1.5 border border-bunk-border-light dark:border-zinc-700 rounded-md hover:bg-neutral-50 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#2E5E4E] dark:bg-[#4E7A69] text-white rounded-md hover:opacity-90 cursor-pointer"
                  >
                    Insert Extra Class
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-6">
              {preferences.semesterBreak ? (
                <div className="py-10 text-center flex flex-col items-center justify-center p-5 bg-[#7D9A7B]/5 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-[#7D9A7B]/25">
                  <span className="text-3xl mb-2 select-none">🌴</span>
                  <p className="font-bold text-xs uppercase tracking-wider text-[#7D9A7B] font-mono">Semester Break Enabled</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-xs leading-relaxed">
                    Attendance notifications and schedule alerts are automatically muted. Enjoy your vacation!
                  </p>
                </div>
              ) : todayClasses.length === 0 ? (
                <div className="py-8 text-center text-bunk-sub-light dark:text-zinc-400 text-xs italic">
                  No scheduled classes today. Enjoy your study break!
                </div>
              ) : (
                todayClasses.map((cls) => {
                  const isCancelled = cls.state === 'cancelled';
                  const isRescheduled = cls.state === 'rescheduled';
                  const subMetrics = getSubjectMetrics(cls.subjectId);
                  const sub = subjects.find(s => s.id === cls.subjectId);
                  const targetPct = sub ? sub.targetPercentage : preferences.globalTarget;
                  // Sequential pairing algorithm to support multiple classes/day correctly
                  const isDoneAndStatus = (() => {
                    const todayLogsForSub = logs.filter(log => log.subjectId === cls.subjectId && log.date === new Date().toISOString().split('T')[0]);
                    
                    // 1. Direct matching by classId
                    const exactLog = todayLogsForSub.find(log => log.classId === cls.id);
                    if (exactLog) {
                      return { done: true, status: exactLog.status, logId: exactLog.id };
                    }
                    
                    // 2. Generic log pairing fallback
                    const todayClassesForSub = todayClasses.filter(c => c.subjectId === cls.subjectId && c.state !== 'cancelled');
                    
                    // Filter logs that are generic (not bound to any existing classes of today)
                    const unmatchedLogs = todayLogsForSub.filter(log => {
                      if (log.classId) {
                        const clsExists = todayClassesForSub.some(c => c.id === log.classId);
                        if (clsExists) return false;
                      }
                      return true;
                    });

                    // Classes of today that aren't exact-matched by other logs
                    const unmatchedClasses = todayClassesForSub.filter(c => !todayLogsForSub.some(log => log.classId === c.id));
                    
                    const classIndex = unmatchedClasses.findIndex(c => c.id === cls.id);
                    if (classIndex !== -1 && classIndex < unmatchedLogs.length) {
                      const matchingLog = unmatchedLogs[classIndex];
                      return { done: true, status: matchingLog.status, logId: matchingLog.id };
                    }

                    return { done: false, status: null, logId: null };
                  })();

                  const isDone = isDoneAndStatus.done;

                  // Formats a YYYY-MM-DD date to a clean, non-wrapping format (e.g., Jun 13)
                  const getRescheduledLabel = () => {
                    if (!cls.rescheduledDate) return 'Rescheduled';
                    try {
                      const parts = cls.rescheduledDate.split('-');
                      if (parts.length === 3) {
                        const year = parseInt(parts[0], 10);
                        const monthIndex = parseInt(parts[1], 10) - 1;
                        const day = parseInt(parts[2], 10);
                        const d = new Date(year, monthIndex, day);
                        if (!isNaN(d.getTime())) {
                          const shortMonth = d.toLocaleDateString('en-US', { month: 'short' });
                          return `Rescheduled: ${shortMonth} ${day}${cls.rescheduledTime ? ` @ ${cls.rescheduledTime}` : ''}`;
                        }
                      }
                    } catch (e) {
                      // ignore and fallback
                    }
                    return `Rescheduled: ${cls.rescheduledDate}${cls.rescheduledTime ? ` @ ${cls.rescheduledTime}` : ''}`;
                  };

                  return (
                    <div key={cls.id} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3 text-xs w-full">
                        {/* Time & Subject Label */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="font-mono text-[#6B6B6B] dark:text-zinc-400 w-10 font-semibold shrink-0">
                            {cls.startTime}
                          </span>
                          
                          {/* Hairline spacer only visible from tablet/desktop screens up */}
                          <div className="hidden sm:block flex-1 h-[1px] bg-bunk-border-light dark:bg-zinc-800" />
                          
                          <div className="flex flex-col text-left min-w-0">
                            <span className={`font-bold text-sm text-bunk-text-light dark:text-bunk-text-dark truncate ${isCancelled ? 'line-through opacity-45' : ''}`} title={cls.subjectName}>
                              {cls.subjectName}
                            </span>
                            <span className={`text-[10px] uppercase font-bold tracking-wider truncate ${
                              isCancelled 
                                ? 'text-red-500' 
                                : isRescheduled
                                ? 'text-blue-500'
                                : cls.state === 'extra'
                                ? 'text-amber-600 dark:text-amber-500'
                                : isDone 
                                ? (isDoneAndStatus.status === 'present' ? 'text-emerald-600 dark:text-[#7D9A7B]' : 'text-red-500')
                                : subMetrics && subMetrics.percentage >= targetPct 
                                ? 'text-[#7D9A7B]' 
                                : 'text-[#C56E4A]'
                            }`}>
                              {isCancelled 
                                ? 'Cancelled' 
                                : isRescheduled
                                ? getRescheduledLabel()
                                : isDone 
                                ? (isDoneAndStatus.status === 'present' ? 'Attended' : 'Skipped')
                                : cls.state === 'extra'
                                ? 'Extra Class'
                                : subMetrics && subMetrics.percentage >= targetPct 
                                ? 'Safe to miss' 
                                : 'Must Attend'
                              }
                            </span>
                          </div>
                        </div>

                        {/* Action buttons on the right */}
                        {isDone ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded border ${
                              isDoneAndStatus.status === 'present'
                                ? 'bg-[#7D9A7B]/10 border-[#7D9A7B]/20 text-[#7D9A7B]'
                                : 'bg-red-500/10 border-red-200 dark:border-red-950/20 text-red-500'
                            }`}>
                              {isDoneAndStatus.status === 'present' ? 'Attended' : 'Skipped'}
                            </span>
                            {onDeleteLog && isDoneAndStatus.logId && (
                              <button
                                onClick={() => onDeleteLog(isDoneAndStatus.logId!)}
                                className="px-2 py-1 text-[9px] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-350 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 cursor-pointer transition-all uppercase font-mono font-bold tracking-wider"
                                title="Undo and reset status"
                              >
                                Undo
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-1.5 sm:gap-2 shrink-0 items-center">
                            {isCancelled ? (
                              <button
                                onClick={() => onUpdateClassState(cls.id, 'regular')}
                                className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-950/20 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-wider font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 border border-dashed border-zinc-200 dark:border-zinc-700"
                                title="Restore / Uncancel class"
                              >
                                Restore
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => onLogAttendance(cls.subjectId, 'present', cls.id)}
                                  className="p-1 sm:p-1.5 rounded-full hover:bg-[#7D9A7B]/10 text-[#7D9A7B] cursor-pointer transition-all active:scale-90"
                                  title="Check In"
                                >
                                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (isRescheduled) {
                                      onUpdateClassState(cls.id, 'regular');
                                    } else {
                                      setReschedulingId(cls.id);
                                      setRescheduleDate(cls.rescheduledDate || new Date().toISOString().split('T')[0]);
                                      setRescheduleTime(cls.rescheduledTime || cls.startTime);
                                    }
                                  }}
                                  className={`p-1 sm:p-1.5 rounded-full cursor-pointer transition-all active:scale-90 ${
                                    isRescheduled
                                      ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                                      : 'hover:bg-blue-500/10 text-blue-500'
                                  }`}
                                  title={isRescheduled ? "Reset schedule state to Regular" : "Reschedule Class"}
                                >
                                  <Calendar className="w-5 h-5 shrink-0" />
                                </button>

                                <button
                                  onClick={() => onUpdateClassState(cls.id, 'cancelled')}
                                  className="p-1 sm:p-1.5 rounded-full hover:bg-red-500/10 text-red-500 cursor-pointer transition-all active:scale-90"
                                  title="Cancel Class"
                                >
                                  <CalendarOff className="w-5 h-5 shrink-0" />
                                </button>

                                <button
                                  onClick={() => onLogAttendance(cls.subjectId, 'absent', cls.id)}
                                  className="p-1 sm:p-1.5 rounded-full hover:bg-[#C56E4A]/10 text-[#C56E4A] cursor-pointer transition-all active:scale-90"
                                  title="Skip"
                                >
                                  <XCircle className="w-5 h-5 shrink-0" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inline rescheduler control panel */}
                      {reschedulingId === cls.id && (
                        <div className="w-full mt-2 p-3 bg-neutral-50/70 dark:bg-zinc-950/40 border border-dashed border-bunk-border-light dark:border-zinc-800 rounded-xl space-y-3 animate-fade-in text-left">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C56E4A]">
                            Configure Rescheduling - {cls.subjectName}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#6B6B6B] dark:text-zinc-500 font-mono">New Date</label>
                              <input
                                id={`reschedule-date-input-${cls.id}`}
                                type="date"
                                value={rescheduleDate}
                                onChange={(e) => setRescheduleDate(e.target.value)}
                                className="w-full text-xs font-semibold p-2 border border-bunk-border-light dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-bunk-text-light dark:text-bunk-text-dark focus:outline-none focus:border-[#C56E4A]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#6B6B6B] dark:text-zinc-500 font-mono">New Time</label>
                              <input
                                id={`reschedule-time-input-${cls.id}`}
                                type="time"
                                value={rescheduleTime}
                                onChange={(e) => setRescheduleTime(e.target.value)}
                                className="w-full text-xs font-semibold p-2 border border-bunk-border-light dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-bunk-text-light dark:text-bunk-text-dark focus:outline-none focus:border-[#C56E4A]"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end text-[10px] font-bold uppercase tracking-widest">
                            <button
                              id={`reschedule-cancel-btn-${cls.id}`}
                              onClick={() => setReschedulingId(null)}
                              className="px-3 py-1.5 border border-bunk-border-light dark:border-zinc-700 rounded-md hover:bg-neutral-50 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              id={`reschedule-save-btn-${cls.id}`}
                              onClick={() => {
                                onUpdateClassState(cls.id, 'rescheduled', {
                                  rescheduledDate: rescheduleDate,
                                  rescheduledTime: rescheduleTime
                                });
                                setReschedulingId(null);
                              }}
                              className="px-3.5 py-1.5 bg-[#2E5E4E] dark:bg-[#4E7A69] text-white rounded-md hover:opacity-90 cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Subject Grid from mockup */}
          <div className="grid grid-cols-2 gap-4">
            {subjects.slice(0, 2).map((sub) => {
              const metrics = calculateSubjectMetrics(sub);
              const isSafe = metrics.percentage >= sub.targetPercentage;
              
              return (
                <div key={sub.id} className="bg-white dark:bg-bunk-card-dark p-6 rounded-[20px] border border-bunk-border-light dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-bunk-sub-light dark:text-zinc-400 mb-1">
                      {sub.code || sub.name.split(' ').map(w => w[0]).join('').slice(0, 4)}
                    </p>
                    <p className="text-2xl font-black font-mono tracking-tight text-bunk-text-light dark:text-bunk-text-dark">
                      {metrics.percentage}%
                    </p>
                  </div>
                  <p className={`text-[11px] font-medium mt-4 italic ${
                    isSafe ? 'text-[#7D9A7B]' : 'text-[#C56E4A]'
                  }`}>
                    {isSafe ? `${metrics.canBunk} bunks remaining` : `At risk: Attend next ${metrics.needToAttend}`}
                  </p>
                </div>
              );
            })}
            
            {subjects.length < 2 && (
              <div className="col-span-2 bg-white dark:bg-bunk-card-dark p-6 rounded-[20px] border border-dashed border-bunk-border-light dark:border-zinc-800 text-center flex flex-col justify-center items-center py-8">
                <p className="text-xs text-bunk-sub-light dark:text-zinc-400 font-medium font-mono">ADDITIONAL SUBJECT CHANNELS</p>
                <button 
                  onClick={() => onNavigateToTab('subjects')} 
                  className="text-[10px] font-bold uppercase tracking-widest mt-2 text-[#2E5E4E] dark:text-[#4E7A69] hover:underline cursor-pointer"
                >
                  + Add Course Materials
                </button>
              </div>
            )}
          </div>

        </section>
      </main>

      {/* Decorative footer mimicking the mockup precisely */}
      <footer className="mt-12 pt-6 border-t border-bunk-border-light dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] dark:text-zinc-500 gap-4">
        <div className="flex gap-8">
          <span>Session: {new Date().getFullYear()} ACTIVE</span>
          <span>Target Limit: {preferences.globalTarget}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#7D9A7B] animate-pulse"></div>
          <span>Cloud Sync Active</span>
        </div>
      </footer>

    </div>
  );
}
