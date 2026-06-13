import React, { useRef, useState } from 'react';
import { User, Shield, Info, Download, Upload, RotateCcw, Check, Sparkles, Monitor, Sun, Moon } from 'lucide-react';
import { UserPreferences, Subject, ClassItem, DayLog } from '../types';

interface ProfileViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  onClearAllData: () => void;
  onImportAllData: (data: { subjects: Subject[]; classes: ClassItem[]; logs: DayLog[]; preferences: UserPreferences }) => void;
  subjects: Subject[];
  classes: ClassItem[];
  logs: DayLog[];
}

export default function ProfileView({
  preferences,
  onUpdatePreferences,
  onClearAllData,
  onImportAllData,
  subjects,
  classes,
  logs
}: ProfileViewProps) {
  const [name, setName] = useState(preferences.name);
  const [globalTarget, setGlobalTarget] = useState(preferences.globalTarget);
  const [theme, setTheme] = useState(preferences.theme);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences({ name, globalTarget, theme });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExport = () => {
    const backupObj = {
      subjects,
      classes,
      logs,
      preferences
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `BunkMaster_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.subjects && json.classes && json.logs && json.preferences) {
          onImportAllData(json);
          alert('Backup database imported successfully!');
          window.location.reload();
        } else {
          alert('Invalid backup file formatting. Ensure it is a valid BunkMaster companion export.');
        }
      } catch (err) {
        alert('Could not parse backup file JSON.');
      }
    };
    reader.readAsText(file);
  };

  const toggleTheme = (val: 'light' | 'dark') => {
    setTheme(val);
    onUpdatePreferences({ theme: val });
  };

  return (
    <div id="profile-view-container" className="space-y-6 pb-24 animate-fade-in text-bunk-text-light dark:text-bunk-text-dark">
      
      {/* Header section */}
      <div>
        <span className="text-xs uppercase tracking-widest font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">Account Station</span>
        <h2 className="text-3xl font-extrabold tracking-tight mt-1">Preferences & Backup</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card details */}
        <div className="bunk-card p-6 bg-white dark:bg-bunk-card-dark col-span-1 md:col-span-2 space-y-6">
          <div className="space-y-1">
            <h4 className="font-bold text-sm uppercase tracking-wide text-bunk-sub-light dark:text-bunk-sub-dark font-mono flex items-center gap-1.5">
              <User className="w-4 h-4 text-bunk-accent" />
              Student Profile
            </h4>
            <p className="text-xs text-bunk-sub-light dark:text-bunk-sub-dark">Custom identity label for system greetings & calculations.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Student Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm font-medium text-bunk-text-light dark:text-bunk-text-dark border border-bunk-border-light dark:border-zinc-700 bg-bunk-bg-light dark:bg-zinc-900 rounded-xl p-2.5 focus:outline-none focus:border-bunk-accent"
                placeholder="Alex Miller"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Global Minimum Attendance Target (%)</label>
              <select
                value={globalTarget}
                onChange={(e) => setGlobalTarget(Number(e.target.value))}
                className="w-full text-sm font-medium text-bunk-text-light dark:text-bunk-text-dark border border-bunk-border-light dark:border-zinc-700 bg-bunk-bg-light dark:bg-zinc-900 rounded-xl p-2.5 focus:outline-none focus:border-bunk-accent"
              >
                <option value={75} className="bg-white dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark">75% (Standard University Limit)</option>
                <option value={80} className="bg-white dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark">80% (Recommended Buffer Limit)</option>
                <option value={85} className="bg-white dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark">85% (Distinction Mark)</option>
                <option value={90} className="bg-white dark:bg-zinc-900 text-bunk-text-light dark:text-bunk-text-dark">90% (Scholarship Tier)</option>
              </select>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Used as standard comparison limits when creating new courses or calculating risk indexes.</p>
            </div>

            {/* Visual themes switcher */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Aesthetic Visual Mode</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleTheme('light')}
                  className={`flex-1 p-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    preferences.theme === 'light'
                      ? 'bg-bunk-accent text-white border-bunk-accent shadow-sm'
                      : 'border-bunk-border-light dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Muji Calm Light
                </button>
                <button
                  type="button"
                  onClick={() => toggleTheme('dark')}
                  className={`flex-1 p-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    preferences.theme === 'dark'
                      ? 'bg-[#4E7A69] text-white border-[#4E7A69] shadow-sm'
                      : 'border-bunk-border-light dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Studio Soft Dark
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-bunk-accent dark:bg-bunk-accent-dark text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:opacity-95 shadow-sm"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 animate-bounce" />
                    Settings Saved!
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Database backup card actions */}
        <div className="bunk-card p-6 bg-white dark:bg-bunk-card-dark col-span-1 space-y-6">
          <div className="space-y-1">
            <h4 className="font-bold text-sm uppercase tracking-wide text-bunk-sub-light dark:text-bunk-sub-dark font-mono flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#7D9A7B]" />
              Data Operations
            </h4>
            <p className="text-xs text-bunk-sub-light dark:text-bunk-sub-dark">Manage back-up files and clear active caches.</p>
          </div>

          <div className="space-y-2.5 text-xs font-semibold">
            <button
              onClick={handleExport}
              className="w-full p-3 border border-bunk-border-light dark:border-zinc-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-800 text-left flex items-center gap-2.5 text-zinc-600 dark:text-zinc-350 transition-colors"
            >
              <Download className="w-4 h-4 text-zinc-500" />
              Export BackUp File
            </button>

            <button
              onClick={handleImportTrigger}
              className="w-full p-3 border border-bunk-border-light dark:border-zinc-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-800 text-left flex items-center gap-2.5 text-zinc-600 dark:text-zinc-350 transition-colors"
            >
              <Upload className="w-4 h-4 text-zinc-500" />
              Import BackUp File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />

            {showConfirmReset ? (
              <div className="p-3 border border-red-200 dark:border-red-950/40 bg-red-50/40 dark:bg-red-950/10 rounded-xl space-y-2.5">
                <p className="text-[11px] font-bold text-[#C56E4A] leading-normal uppercase tracking-wider font-mono">
                  Confirm Database Purge?
                </p>
                <p className="text-[10px] text-zinc-500 font-medium">
                  This actions clears all subjects, timetables, and logs permanently.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onClearAllData();
                      setShowConfirmReset(false);
                    }}
                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] uppercase font-bold tracking-widest rounded-lg cursor-pointer text-center"
                  >
                    Yes, Purge
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 py-2 border border-bunk-border-light dark:border-zinc-700 text-zinc-500 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-[10px] uppercase font-bold tracking-widest rounded-lg cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full p-3 border border-red-100 dark:border-red-950/20 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/25 text-left flex items-center gap-2.5 text-red-500 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset BunkMaster
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Info card disclaimer */}
      <div className="bunk-card p-5 bg-[#7D9A7B]/5 border-[#7D9A7B]/20 text-xs flex gap-2 w-full leading-relaxed text-[#7D9A7B] font-semibold">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p>Product Integrity System Notice</p>
          <p className="opacity-95 font-medium mt-0.5 text-bunk-text-light/80 dark:text-bunk-text-dark/80">
            BunkMaster saves your schedules, academic subjects, and logged check-ins entirely on your device with high-grade localized caches. We transmit zero analytical profiles to outside networks to respect academic privacy parameters.
          </p>
        </div>
      </div>

    </div>
  );
}
