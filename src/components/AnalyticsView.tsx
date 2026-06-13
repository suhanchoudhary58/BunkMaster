import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckSquare, ShieldCheck, HelpCircle } from 'lucide-react';
import { Subject, ClassItem } from '../types';
import { calculateSubjectMetrics, calculateOverallMetrics } from '../utils/calculations';

interface AnalyticsViewProps {
  subjects: Subject[];
  classes: ClassItem[];
}

export default function AnalyticsView({ subjects, classes }: AnalyticsViewProps) {
  
  // Calculate overall
  const overall = calculateOverallMetrics(subjects, 75);

  // Identify risk subjects (those sitting below their target, or within 3% of it)
  const riskSubjects = subjects.map(sub => {
    const metrics = calculateSubjectMetrics(sub);
    const difference = metrics.percentage - sub.targetPercentage;
    return {
      subject: sub,
      metrics,
      difference,
      isAtRisk: difference <= 3
    };
  }).filter(item => item.isAtRisk);

  // Subject health analysis lists
  const excellentCount = subjects.filter(sub => {
    const metrics = calculateSubjectMetrics(sub);
    return metrics.percentage >= 85;
  }).length;

  const safeCount = subjects.filter(sub => {
    const metrics = calculateSubjectMetrics(sub);
    return metrics.percentage >= sub.targetPercentage && metrics.percentage < 85;
  }).length;

  const warningCount = subjects.filter(sub => {
    const metrics = calculateSubjectMetrics(sub);
    return metrics.percentage < sub.targetPercentage;
  }).length;

  return (
    <div id="analytics-view-container" className="space-y-6 pb-24 animate-fade-in text-bunk-text-light dark:text-bunk-text-dark">
      
      {/* Header Panel */}
      <div>
        <span className="text-xs uppercase tracking-widest font-semibold text-bunk-sub-light dark:text-bunk-sub-dark">Academic Insights</span>
        <h2 className="text-3xl font-extrabold tracking-tight mt-1">Analytics Overview</h2>
      </div>

      {/* Grid structure: Overview cards & comparative charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Comparative Bars card */}
        <div className="bunk-card p-6 bg-white dark:bg-bunk-card-dark col-span-1 lg:col-span-2 space-y-6">
          <div className="space-y-1">
            <h4 className="font-bold text-sm uppercase tracking-wide text-bunk-sub-light dark:text-bunk-sub-dark font-mono flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-bunk-accent" />
              Syllabus Health Progression
            </h4>
            <p className="text-xs text-bunk-sub-light dark:text-bunk-sub-dark">Actual attendance percentage comparison against your targets.</p>
          </div>

          <div className="space-y-5">
            {subjects.length === 0 ? (
              <p className="text-xs italic text-zinc-400 py-6 text-center">Add subjects in default logs to see progression comparisons.</p>
            ) : (
              subjects.map(sub => {
                const metrics = calculateSubjectMetrics(sub);
                const isMeetingTarget = metrics.percentage >= sub.targetPercentage;

                return (
                  <div key={sub.id} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-bunk-text-light dark:text-bunk-text-dark">{sub.name}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-zinc-400">Target: {sub.targetPercentage}%</span>
                        <span className="text-zinc-300">|</span>
                        <span className={`font-bold ${isMeetingTarget ? 'text-[#2E5E4E] dark:text-[#4E7A69]' : 'text-[#C56E4A]'}`}>
                          {metrics.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress with marked target line */}
                    <div className="relative w-full bg-neutral-100 dark:bg-zinc-800/60 h-4 rounded-md overflow-hidden">
                      {/* Attended bar */}
                      <div
                        className="h-full rounded-l transition-all duration-500"
                        style={{
                          width: `${Math.min(100, metrics.percentage)}%`,
                          backgroundColor: isMeetingTarget ? '#7D9A7B' : '#C56E4A'
                        }}
                      />
                      
                      {/* Target Indicator Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-zinc-400 dark:bg-zinc-500 z-10"
                        style={{ left: `${sub.targetPercentage}%` }}
                        title={`Target Marker: ${sub.targetPercentage}%`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dynamic Future Predictor card */}
        <div className="bunk-card p-6 bg-white dark:bg-bunk-card-dark col-span-1 space-y-6">
          <div className="space-y-1">
            <h4 className="font-bold text-sm uppercase tracking-wide text-bunk-sub-light dark:text-bunk-sub-dark font-mono flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#7D9A7B]" />
              Simulation Models
            </h4>
            <p className="text-xs text-bunk-sub-light dark:text-bunk-sub-dark">Predicted status outcome after the next 5 class cycles.</p>
          </div>

          <div className="space-y-4">
            {subjects.length === 0 ? (
              <p className="text-xs italic text-zinc-400 py-6 text-center">Add subject list to simulate mathematical future models.</p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-zinc-800 text-xs">
                {subjects.slice(0, 3).map(sub => {
                  const currentTotal = sub.attended + sub.missed;
                  // If we attend next 5 classesconsecutively
                  const attendedPct = currentTotal === 0 ? 100 : Math.round(((sub.attended + 5) / (currentTotal + 5)) * 100);
                  // If we bunk next 5 classes consecutively
                  const bunkedPct = currentTotal === 0 ? 0 : Math.round((sub.attended / (currentTotal + 5)) * 100);

                  return (
                    <div key={sub.id} className="py-3 space-y-2">
                      <p className="font-bold text-bunk-text-light dark:text-bunk-text-dark">{sub.name}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-mono">
                        <div className="p-2 border border-emerald-100 dark:border-emerald-950/20 bg-[#7D9A7B]/5 rounded-lg">
                          <span className="text-[#7D9A7B] font-bold">100% attendance</span>
                          <p className="text-sm font-black text-emerald-800 dark:text-emerald-400 mt-1">{attendedPct}%</p>
                        </div>
                        
                        <div className="p-2 border border-red-100 dark:border-red-950/20 bg-red-500/5 rounded-lg">
                          <span className="text-red-500 font-bold">Safe skip bunking</span>
                          <p className="text-sm font-black text-red-700 dark:text-red-400 mt-1">{bunkedPct}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Danger Zone Risk Indicators list card */}
      <div className="bunk-card p-6 bg-white dark:bg-bunk-card-dark space-y-4">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-bunk-sub-light dark:text-bunk-sub-dark font-mono flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#C56E4A]" />
            Bunk-Risk Indices
          </h4>
          <p className="text-xs text-bunk-sub-light dark:text-bunk-sub-dark">Courses sit critically below target thresholds or within tight marginal boundaries.</p>
        </div>

        {riskSubjects.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-[#7D9A7B]/10 rounded-xl border border-[#7D9A7B]/20 text-xs font-semibold text-[#7D9A7B]">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            Clear horizon! All academic course tracks are comfortably above target limits.
          </div>
        ) : (
          <div className="space-y-3">
            {riskSubjects.map(({ subject, metrics, difference }) => {
              const isBelow = difference < 0;

              return (
                <div key={subject.id} className="p-3 bg-neutral-50 dark:bg-zinc-900 border border-bunk-border-light dark:border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-bunk-text-light dark:text-bunk-text-dark">{subject.name}</p>
                    <p className="text-[10px] text-bunk-sub-light dark:text-bunk-sub-dark font-medium">
                      {isBelow 
                        ? `Sitting ${Math.abs(difference)}% BELOW target threshold.` 
                        : `Vulnerable! Standing only ${difference}% above target boundary.`
                      }
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`font-mono font-bold font-black text-sm ${isBelow ? 'text-red-500' : 'text-[#C56E4A]'}`}>
                      {metrics.percentage}%
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-mono">Target: {subject.targetPercentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
