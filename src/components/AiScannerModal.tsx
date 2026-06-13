import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Sparkles, Check, AlertCircle, Edit, Calendar } from 'lucide-react';
import { Subject, ClassItem } from '../types';

interface AiScannerModalProps {
  onClose: () => void;
  onImport: (newSubjects: Subject[], newClasses: ClassItem[]) => void;
}

export default function AiScannerModal({ onClose, onImport }: AiScannerModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scannedData, setScannedData] = useState<{
    subjects: { name: string; code: string }[];
    timetable: {
      subjectName: string;
      day: string;
      startTime: string;
      endTime: string;
      room: string;
      teacher: string;
    }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingTexts = [
    'Reading metadata and file boundaries...',
    'Analyzing visual class grids and schedules...',
    'Extracting subject details and teachers...',
    'Compiling calendar coordinates...',
    'Preparing final preview routine...'
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const isImage = selectedFile.type.startsWith('image/');
    const isPdf = selectedFile.type === 'application/pdf';

    if (!isImage && !isPdf) {
      setError('Unsupported file type. Please upload a clear image or screenshot.');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const startScanning = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
    }, 1800);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const raw = reader.result as string;
          const base64 = raw.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;

      const response = await fetch('/api/scan-timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: file.type,
        }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Server processing failed');
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Validate result fields
        const extraction = result.data;
        if (!extraction.subjects || !Array.isArray(extraction.subjects)) {
          extraction.subjects = [];
        }
        if (!extraction.timetable || !Array.isArray(extraction.timetable)) {
          extraction.timetable = [];
        }
        setScannedData(extraction);
      } else {
        throw new Error('AI could not interpret table. Please check quality or add manually.');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while connecting with BunkMaster AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImport = () => {
    if (!scannedData) return;

    // Build unique subjects
    const newSubjects: Subject[] = scannedData.subjects.map((sub, idx) => ({
      id: `sub-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      name: sub.name || 'Untitled Class',
      code: sub.code || '',
      attended: 0,
      missed: 0,
      targetPercentage: 75
    }));

    // Build classes tied to subjectId
    const newClasses: ClassItem[] = scannedData.timetable.map((cls, idx) => {
      // find match in new subjects
      const matchSub = newSubjects.find(s => s.name.toLowerCase() === cls.subjectName.toLowerCase());
      const subjectId = matchSub ? matchSub.id : `sub-scanned-${idx}-${Date.now()}`;
      
      // If no subject, add it
      if (!matchSub) {
        newSubjects.push({
          id: subjectId,
          name: cls.subjectName || 'Untitled Class',
          code: '',
          attended: 0,
          missed: 0,
          targetPercentage: 75
        });
      }

      // Check day
      let cleanDay: any = 'Monday';
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const matchedDay = days.find(d => d.toLowerCase() === cls.day?.trim().toLowerCase());
      if (matchedDay) cleanDay = matchedDay;

      return {
        id: `class-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        subjectId,
        subjectName: cls.subjectName,
        day: cleanDay,
        startTime: cls.startTime || '09:00',
        endTime: cls.endTime || '10:00',
        room: cls.room || '',
        teacher: cls.teacher || '',
        state: 'regular'
      };
    });

    onImport(newSubjects, newClasses);
  };

  const handleEditSubject = (index: number, field: 'name' | 'code', value: string) => {
    if (!scannedData) return;
    const updatedSubs = [...scannedData.subjects];
    updatedSubs[index] = { ...updatedSubs[index], [field]: value };
    setScannedData({ ...scannedData, subjects: updatedSubs });
  };

  const handleEditClass = (index: number, field: string, value: string) => {
    if (!scannedData) return;
    const updatedClasses = [...scannedData.timetable];
    updatedClasses[index] = { ...updatedClasses[index], [field]: value };
    setScannedData({ ...scannedData, timetable: updatedClasses });
  };

  const handleRemoveClassItem = (index: number) => {
    if (!scannedData) return;
    const updatedClasses = scannedData.timetable.filter((_, i) => i !== index);
    setScannedData({ ...scannedData, timetable: updatedClasses });
  };

  return (
    <div id="ai-scanner-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[85vh] bg-bunk-bg-light dark:bg-bunk-bg-dark rounded-2xl overflow-hidden flex flex-col border border-bunk-border-light dark:border-zinc-800 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-bunk-border-light dark:border-zinc-800 bg-white dark:bg-bunk-card-dark">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-bunk-accent dark:text-bunk-accent-dark" />
            <h3 className="font-semibold text-lg text-bunk-text-light dark:text-bunk-text-dark tracking-tight">AI Timetable Scan</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5 text-bunk-sub-light dark:text-bunk-sub-dark" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!scannedData ? (
            <div className="space-y-6">
              <div className="bg-white/60 dark:bg-zinc-800/30 p-4 rounded-xl border border-bunk-border-light dark:border-zinc-800 text-sm leading-relaxed text-bunk-sub-light dark:text-bunk-sub-dark">
                <span className="font-semibold text-bunk-text-light dark:text-bunk-text-dark">How it works: </span> 
                Take a clean screenshot or photo of your university schedule and drag it here. Our academic assistant automatically labels days, schedules, and topic classes so you bypass manual setup steps.
              </div>

              {!loading ? (
                <>
                  {/* Drop zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerUpload}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-bunk-accent bg-bunk-accent/5 dark:bg-bunk-accent-dark/5'
                        : 'border-bunk-border-light dark:border-zinc-800 hover:border-bunk-accent dark:hover:border-bunk-accent-dark'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleChange}
                      className="hidden"
                      accept="image/*,application/pdf"
                    />

                    <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm mb-4 border border-bunk-border-light dark:border-zinc-700">
                      <Upload className="w-6 h-6 text-bunk-accent dark:text-bunk-accent-dark" />
                    </div>

                    {file ? (
                      <div className="text-center">
                        <p className="font-medium text-bunk-text-light dark:text-bunk-text-dark">{file.name}</p>
                        <p className="text-xs text-bunk-sub-light dark:text-bunk-sub-dark mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="font-medium text-bunk-text-light dark:text-bunk-text-dark">Choose timetable screenshot</p>
                        <p className="text-xs text-bunk-sub-light dark:text-bunk-sub-dark mt-1">
                          PNG, JPG or PDF up to 10MB • Drag and drop here
                        </p>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-xl border border-red-100 dark:border-red-900/40 text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  {file && (
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setFile(null)}
                        className="px-5 py-2.5 rounded-xl border border-bunk-border-light dark:border-zinc-800 text-sm font-medium hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                      >
                        Reset File
                      </button>
                      <button
                        onClick={startScanning}
                        className="px-5 py-2.5 rounded-xl bg-bunk-accent dark:bg-bunk-accent-dark text-white text-sm font-medium hover:opacity-95 transition-opacity flex items-center gap-2 shadow-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        AIGenerate Routines
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Loading State */
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-bunk-accent dark:text-bunk-accent-dark animate-spin" />
                    <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-semibold text-bunk-text-light dark:text-bunk-text-dark">BunkMaster AI Processing</p>
                    <p className="text-sm text-bunk-sub-light dark:text-bunk-sub-dark min-h-[20px] transition-all px-6 duration-300 animate-pulse font-mono">
                      {loadingTexts[loadingStep]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Results & Editing state */
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-sm flex gap-2">
                <Check className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Timetable scanned successfully!</p>
                  <p className="text-xs mt-0.5 opacity-90">Please review the extracted subjects and classes below. You can edit any field before importing them into your active directory.</p>
                </div>
              </div>

              {/* Identified Subjects */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-bunk-sub-light dark:text-bunk-sub-dark flex items-center gap-1.5">
                  Extracted Subjects ({scannedData.subjects.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {scannedData.subjects.map((sub, sIdx) => (
                    <div key={sIdx} className="p-3 bg-white dark:bg-zinc-900 border border-bunk-border-light dark:border-zinc-800 rounded-xl flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => handleEditSubject(sIdx, 'name', e.target.value)}
                          className="w-full text-sm font-semibold bg-transparent border-b border-transparent focus:border-bunk-accent focus:outline-none py-0.5"
                          placeholder="Subject Name"
                        />
                        <input
                          type="text"
                          value={sub.code}
                          onChange={(e) => handleEditSubject(sIdx, 'code', e.target.value)}
                          className="w-full text-xs text-bunk-sub-light dark:text-bunk-sub-dark bg-transparent border-b border-transparent focus:border-bunk-accent focus:outline-none py-0.5 font-mono"
                          placeholder="Subject Code"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scheduled Slots */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-bunk-sub-light dark:text-bunk-sub-dark">
                  Routine Timetable Slots ({scannedData.timetable.length})
                </h4>
                <div className="border border-bunk-border-light dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-bunk-border-light dark:divide-zinc-800">
                  {scannedData.timetable.map((cls, cIdx) => (
                    <div key={cIdx} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2.5 w-full">
                        <div>
                          <label className="text-[10px] text-bunk-sub-light dark:text-bunk-sub-dark uppercase tracking-wider font-semibold">Subject</label>
                          <select
                            value={cls.subjectName}
                            onChange={(e) => handleEditClass(cIdx, 'subjectName', e.target.value)}
                            className="bg-transparent border border-bunk-border-light dark:border-zinc-800 text-xs font-medium rounded p-1 w-full dark:bg-zinc-900"
                          >
                            {scannedData.subjects.map((s, i) => (
                              <option key={i} value={s.name}>{s.name}</option>
                            ))}
                            {!scannedData.subjects.some(s => s.name === cls.subjectName) && (
                              <option value={cls.subjectName}>{cls.subjectName}</option>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-bunk-sub-light dark:text-bunk-sub-dark uppercase tracking-wider font-semibold">Day</label>
                          <select
                            value={cls.day}
                            onChange={(e) => handleEditClass(cIdx, 'day', e.target.value)}
                            className="bg-transparent border border-bunk-border-light dark:border-zinc-800 text-xs rounded p-1 w-full dark:bg-zinc-900"
                          >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-bunk-sub-light dark:text-bunk-sub-dark uppercase tracking-wider font-semibold">Time Slot</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={cls.startTime}
                              onChange={(e) => handleEditClass(cIdx, 'startTime', e.target.value)}
                              className="text-center font-mono text-xs w-12 border border-bunk-border-light dark:border-zinc-800 p-0.5 bg-transparent rounded"
                            />
                            <span className="text-[10px] text-bunk-sub-light dark:text-bunk-sub-dark">-</span>
                            <input
                              type="text"
                              value={cls.endTime}
                              onChange={(e) => handleEditClass(cIdx, 'endTime', e.target.value)}
                              className="text-center font-mono text-xs w-12 border border-bunk-border-light dark:border-zinc-800 p-0.5 bg-transparent rounded"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-bunk-sub-light dark:text-bunk-sub-dark uppercase tracking-wider font-semibold">Room & Coach</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={cls.room || ''}
                              onChange={(e) => handleEditClass(cIdx, 'room', e.target.value)}
                              className="w-1/2 text-xs border border-bunk-border-light dark:border-zinc-800 p-0.5 bg-transparent rounded text-center"
                              placeholder="Room"
                            />
                            <input
                              type="text"
                              value={cls.teacher || ''}
                              onChange={(e) => handleEditClass(cIdx, 'teacher', e.target.value)}
                              className="w-1/2 text-xs border border-bunk-border-light dark:border-zinc-800 p-0.5 bg-transparent rounded text-center"
                              placeholder="Teacher"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveClassItem(cIdx)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 self-end sm:self-center shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end gap-3 pt-4 border-t border-bunk-border-light dark:border-zinc-800">
                <button
                  onClick={() => setScannedData(null)}
                  className="px-5 py-2.5 rounded-xl border border-bunk-border-light dark:border-zinc-800 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Clear Results
                </button>
                <button
                  onClick={handleSaveImport}
                  className="px-5 py-2.5 rounded-xl bg-bunk-accent dark:bg-bunk-accent-dark text-white text-sm font-medium hover:opacity-95 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Import Into Directory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
