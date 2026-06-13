import React, { useState, useEffect } from 'react';
import { defaultPreferences, defaultSubjects, defaultClasses } from './utils/sampleData';
import { Subject, ClassItem, DayLog, UserPreferences, ClassState } from './types';
import BottomNav, { ActiveTab } from './components/BottomNav';
import DashboardView from './components/DashboardView';
import ScheduleView from './components/ScheduleView';
import SubjectsView from './components/SubjectsView';
import AnalyticsView from './components/AnalyticsView';
import ProfileView from './components/ProfileView';
import AiScannerModal from './components/AiScannerModal';
import BrandLogo from './components/BrandLogo';
import { Calendar, Heart, ShieldAlert, Sparkles } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Core Databases (lazy initialized from localStorage)
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('bunk_subjects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.some((s: any) => s.id === 'sub-physics' || s.id === 'sub-maths' || s.id === 'sub-chem')) {
          return [];
        }
        return parsed;
      } catch (e) {
        return defaultSubjects;
      }
    }
    return defaultSubjects;
  });

  const [classes, setClasses] = useState<ClassItem[]>(() => {
    const saved = localStorage.getItem('bunk_classes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.some((c: any) => c.subjectId === 'sub-physics' || c.id === 'class-1' || c.id === 'class-2')) {
          return [];
        }
        return parsed;
      } catch (e) {
        return defaultClasses;
      }
    }
    return defaultClasses;
  });

  const [logs, setLogs] = useState<DayLog[]>(() => {
    const saved = localStorage.getItem('bunk_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean logs associated with legacy subjects
        if (parsed.some((l: any) => l.subjectId === 'sub-physics' || l.subjectId === 'sub-maths' || l.subjectId === 'sub-chem')) {
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('bunk_preferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  // Modal open trigger
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Sync to local storage when state changes
  useEffect(() => {
    localStorage.setItem('bunk_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('bunk_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('bunk_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('bunk_preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Synchronize system theme classes
  useEffect(() => {
    const root = window.document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.theme]);

  // --- Handlers & Operations ---

  // Log a dynamic attendance event (e.g., today's scheduled hour)
  const handleLogAttendance = (subjectId: string, status: 'present' | 'absent', classId?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Add new audit log
    const newLog: DayLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: todayStr,
      subjectId,
      status,
      classId
    };

    setLogs(prev => [newLog, ...prev]);

    // Fast-adjust raw totals directly on subject structure for immediate UI calculations
    setSubjects(prev =>
      prev.map(sub => {
        if (sub.id === subjectId) {
          return {
            ...sub,
            attended: status === 'present' ? sub.attended + 1 : sub.attended,
            missed: status === 'absent' ? sub.missed + 1 : sub.missed
          };
        }
        return sub;
      })
    );
  };

  // Log retroactive attendance manually on a custom date
  const handleLogRetroactive = (subjectId: string, status: 'present' | 'absent', dateString: string) => {
    const cleanDate = dateString || new Date().toISOString().split('T')[0];

    const newLog: DayLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: cleanDate,
      subjectId,
      status
    };

    setLogs(prev => [newLog, ...prev]);

    setSubjects(prev =>
      prev.map(sub => {
        if (sub.id === subjectId) {
          return {
            ...sub,
            attended: status === 'present' ? sub.attended + 1 : sub.attended,
            missed: status === 'absent' ? sub.missed + 1 : sub.missed
          };
        }
        return sub;
      })
    );
  };

  // Delete/Undo an attendance log entry
  const handleDeleteLog = (logId: string) => {
    const matchLog = logs.find(l => l.id === logId);
    if (!matchLog) return;

    // Subtract from raw subject score counter
    setSubjects(prev =>
      prev.map(sub => {
        if (sub.id === matchLog.subjectId) {
          return {
            ...sub,
            attended: matchLog.status === 'present' ? Math.max(0, sub.attended - 1) : sub.attended,
            missed: matchLog.status === 'absent' ? Math.max(0, sub.missed - 1) : sub.missed
          };
        }
        return sub;
      })
    );

    setLogs(prev => prev.filter(l => l.id !== logId));
  };

  // Adjust raw attended/missed sums on a subject card
  const handleUpdateSubjectAttendance = (subjectId: string, attended: number, missed: number) => {
    setSubjects(prev =>
      prev.map(sub => {
        if (sub.id === subjectId) {
          return { ...sub, attended, missed };
        }
        return sub;
      })
    );
  };

  // Adjust target percentage threshold on a subject card
  const handleUpdateSubjectTarget = (subjectId: string, target: number) => {
    setSubjects(prev =>
      prev.map(sub => {
        if (sub.id === subjectId) {
          return { ...sub, targetPercentage: target };
        }
        return sub;
      })
    );
  };

  // Adjust subject type/format
  const handleUpdateSubjectType = (subjectId: string, type: 'lecture' | 'lab') => {
    setSubjects(prev =>
      prev.map(sub => {
        if (sub.id === subjectId) {
          return { ...sub, type };
        }
        return sub;
      })
    );
  };

  // Delete subject
  const handleDeleteSubject = (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    // clean schedule links
    setClasses(prev => prev.filter(c => c.subjectId !== subjectId));
    // clean logs
    setLogs(prev => prev.filter(l => l.subjectId !== subjectId));
  };

  // Create course manually
  const handleAddSubject = (name: string, code: string, target: number, type?: 'lecture' | 'lab'): Subject => {
    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name,
      code: code || undefined,
      attended: 0,
      missed: 0,
      targetPercentage: target || preferences.globalTarget,
      type: type || 'lecture'
    };
    setSubjects(prev => [...prev, newSub]);
    return newSub;
  };

  // Add individual timetable slot manually
  const handleAddClass = (newClass: Omit<ClassItem, 'id'>) => {
    const slot: ClassItem = {
      ...newClass,
      id: `class-${Date.now()}`
    };
    setClasses(prev => [...prev, slot]);
  };

  // Delete individual timetable slot
  const handleRemoveClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
  };

  // Update schedule status type (cancelled, extra etc.)
  const handleUpdateClassState = (classId: string, state: ClassState, updates?: Partial<ClassItem>) => {
    setClasses(prev =>
      prev.map(c => {
        if (c.id === classId) {
          return { ...c, state, ...updates };
        }
        return c;
      })
    );
  };

  // Preferences updates
  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updated }));
  };

  // Data reset function
  const handleClearAllData = () => {
    localStorage.removeItem('bunk_subjects');
    localStorage.removeItem('bunk_classes');
    localStorage.removeItem('bunk_logs');
    localStorage.removeItem('bunk_preferences');
    localStorage.clear();

    setSubjects([]);
    setClasses([]);
    setLogs([]);
    setPreferences({
      name: '',
      globalTarget: 75,
      theme: 'light'
    });
    setActiveTab('home');
  };

  // Import completed backup obj
  const handleImportAllData = (backup: {
    subjects: Subject[];
    classes: ClassItem[];
    logs: DayLog[];
    preferences: UserPreferences;
  }) => {
    setSubjects(backup.subjects);
    setClasses(backup.classes);
    setLogs(backup.logs);
    setPreferences(backup.preferences);
  };

  // Import subjects & schedules scanned in OCR
  const handleImportScannedData = (scannedSubjects: Subject[], scannedClasses: ClassItem[]) => {
    // Merge brand new subjects
    setSubjects(prev => {
      // Avoid duplicate subject names
      const existingNames = new Set(prev.map(s => s.name.toLowerCase()));
      const filteredNew = scannedSubjects.filter(s => !existingNames.has(s.name.toLowerCase()));
      return [...prev, ...filteredNew];
    });

    // Merge new schedule routines
    setClasses(prev => [...prev, ...scannedClasses]);
    
    // Switch to schedule view to see results
    setIsScannerOpen(false);
    setActiveTab('schedule');
  };

  // Renders correct active tab component
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <DashboardView
            subjects={subjects}
            classes={classes}
            logs={logs}
            preferences={preferences}
            onLogAttendance={handleLogAttendance}
            onNavigateToTab={setActiveTab}
            onUpdateClassState={handleUpdateClassState}
            onAddClass={handleAddClass}
            onDeleteLog={handleDeleteLog}
          />
        );
      case 'schedule':
        return (
          <ScheduleView
            subjects={subjects}
            classes={classes}
            onAddClass={handleAddClass}
            onRemoveClass={handleRemoveClass}
            onUpdateClassState={handleUpdateClassState}
            onOpenScanner={() => setIsScannerOpen(true)}
            onAddSubject={handleAddSubject}
          />
        );
      case 'subjects':
        return (
          <SubjectsView
            subjects={subjects}
            logs={logs}
            onAddSubject={handleAddSubject}
            onUpdateSubjectAttendance={handleUpdateSubjectAttendance}
            onUpdateSubjectTarget={handleUpdateSubjectTarget}
            onUpdateSubjectType={handleUpdateSubjectType}
            onDeleteSubject={handleDeleteSubject}
            onLogRetroactive={handleLogRetroactive}
            onDeleteLog={handleDeleteLog}
          />
        );
      case 'analytics':
        return <AnalyticsView subjects={subjects} classes={classes} />;
      case 'profile':
        return (
          <ProfileView
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onClearAllData={handleClearAllData}
            onImportAllData={handleImportAllData}
            subjects={subjects}
            classes={classes}
            logs={logs}
          />
        );
    }
  };

  return (
    <div className="min-h-screen pb-safe-bottom bg-bunk-bg-light dark:bg-bunk-bg-dark transition-colors duration-300">
      
      {/* Visual background texture for premium Japanese Zen paper layout */}
      <div className="absolute inset-0 bg-[radial-gradient(#ebe5d9_1px,transparent_1px)] dark:bg-[radial-gradient(#303030_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-45"></div>

      {/* Primary Container wrapper */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 pb-20 relative z-10">
        
        {/* Artistic Flair Header Navigation */}
        <header className="flex justify-between items-center mb-8 sm:mb-12 border-b border-bunk-border-light dark:border-zinc-800/80 pb-6 gap-4">
          <div className="flex items-center gap-4 sm:gap-8 bg-transparent">
            <BrandLogo size="md" onClick={() => setActiveTab('home')} />
            <nav className="hidden sm:flex flex-wrap justify-center gap-4 sm:gap-6 text-xs font-bold text-bunk-sub-light dark:text-zinc-400 uppercase tracking-widest">
              <button
                onClick={() => setActiveTab('home')}
                className={`pb-1 transition-colors cursor-pointer ${activeTab === 'home' ? 'text-bunk-text-light dark:text-bunk-text-dark border-b border-bunk-text-light dark:border-bunk-text-dark' : 'hover:text-bunk-text-light dark:hover:text-bunk-text-dark'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`pb-1 transition-colors cursor-pointer ${activeTab === 'schedule' ? 'text-bunk-text-light dark:text-bunk-text-dark border-b border-bunk-text-light dark:border-bunk-text-dark' : 'hover:text-bunk-text-light dark:hover:text-bunk-text-dark'}`}
              >
                Schedule
              </button>
              <button
                onClick={() => setActiveTab('subjects')}
                className={`pb-1 transition-colors cursor-pointer ${activeTab === 'subjects' ? 'text-bunk-text-light dark:text-bunk-text-dark border-b border-bunk-text-light dark:border-bunk-text-dark' : 'hover:text-bunk-text-light dark:hover:text-bunk-text-dark'}`}
              >
                Subjects
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`pb-1 transition-colors cursor-pointer ${activeTab === 'analytics' ? 'text-bunk-text-light dark:text-bunk-text-dark border-b border-bunk-text-light dark:border-bunk-text-dark' : 'hover:text-bunk-text-light dark:hover:text-bunk-text-dark'}`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-1 transition-colors cursor-pointer ${activeTab === 'profile' ? 'text-bunk-text-light dark:text-bunk-text-dark border-b border-bunk-text-light dark:border-bunk-text-dark' : 'hover:text-bunk-text-light dark:hover:text-bunk-text-dark'}`}
              >
                Settings
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-bunk-border-light dark:border-zinc-700 flex items-center justify-center text-xs font-bold uppercase shadow-sm text-bunk-text-light dark:text-bunk-text-dark">
              {preferences.name ? preferences.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AR'}
            </div>
          </div>
        </header>

        {/* Dynamic Warning Header if any subject is below target limit */}
        {!preferences.semesterBreak && subjects.some(s => {
          const total = s.attended + s.missed;
          const pct = total === 0 ? 100 : Math.round((s.attended / total) * 100);
          return total > 0 && pct < s.targetPercentage;
        }) && activeTab === 'home' && (
          <div className="mb-6 p-4 bg-amber-500/10 dark:bg-amber-500/5 text-[#C56E4A] rounded-2xl border border-amber-500/20 text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Some course attendance has fallen under safety targets. Verify recovery guidelines.</span>
            </div>
            <button
              onClick={() => setActiveTab('subjects')}
              className="px-2.5 py-1 bg-amber-500/15 rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-amber-500/25 shrink-0"
            >
              Verify Now
            </button>
          </div>
        )}

        {/* Tab view injection mounting point */}
        <main className="relative">
          {renderTabContent()}
        </main>
      </div>

      {/* Docked bottom Navigation hub (hidden on large displays where top header is best) */}
      <div className="sm:hidden">
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>

      {/* AI Timetable Scanner popup */}
      {isScannerOpen && (
        <AiScannerModal
          onClose={() => setIsScannerOpen(false)}
          onImport={handleImportScannedData}
        />
      )}
    </div>
  );
}
