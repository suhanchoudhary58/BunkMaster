import { Subject } from '../types';

export interface SubjectMetrics {
  percentage: number;
  total: number;
  canBunk: number;
  needToAttend: number;
  healthStatus: 'excellent' | 'safe' | 'warning' | 'critical';
}

export function calculateSubjectMetrics(subject: Subject): SubjectMetrics {
  const { attended, missed, targetPercentage } = subject;
  const total = attended + missed;
  const percentage = total === 0 ? 0 : Math.round((attended / total) * 100);

  let healthStatus: 'excellent' | 'safe' | 'warning' | 'critical' = 'safe';

  if (total === 0) {
    healthStatus = 'excellent'; // default pristine state
  } else if (percentage >= 85) {
    healthStatus = 'excellent';
  } else if (percentage >= targetPercentage) {
    healthStatus = 'safe';
  } else if (percentage >= targetPercentage - 10) {
    healthStatus = 'warning';
  } else {
    healthStatus = 'critical';
  }

  // Calculate safe skips (how many we can miss to remain above or at targetPercentage)
  // attended / (attended + missed + x) >= targetPercentage / 100
  // x <= (attended * (100 - targetPercentage) - targetPercentage * missed) / targetPercentage
  let canBunk = 0;
  if (total > 0 && percentage >= targetPercentage) {
    const val = (attended * (100 - targetPercentage) - targetPercentage * missed) / targetPercentage;
    canBunk = Math.floor(val);
    if (canBunk < 0) canBunk = 0;
  }

  // Calculate required consecutive attends to regain target percentage
  // (attended + y) / (attended + missed + y) >= targetPercentage / 100
  // y >= (targetPercentage * (attended + missed) - 100 * attended) / (100 - targetPercentage)
  let needToAttend = 0;
  if (total > 0 && percentage < targetPercentage) {
    const numer = targetPercentage * (attended + missed) - 100 * attended;
    const denom = 100 - targetPercentage;
    needToAttend = Math.ceil(numer / denom);
    if (needToAttend < 0) needToAttend = 0;
  }

  return {
    percentage,
    total,
    canBunk,
    needToAttend,
    healthStatus,
  };
}

export interface OverallMetrics {
  attended: number;
  missed: number;
  total: number;
  percentage: number;
  healthStatus: 'excellent' | 'safe' | 'warning' | 'critical';
}

export function calculateOverallMetrics(subjects: Subject[], globalTarget: number): OverallMetrics {
  if (subjects.length === 0) {
    return { attended: 0, missed: 0, total: 0, percentage: 100, healthStatus: 'excellent' };
  }

  let totalAttended = 0;
  let totalMissed = 0;

  subjects.forEach(s => {
    totalAttended += s.attended;
    totalMissed += s.missed;
  });

  const total = totalAttended + totalMissed;
  const percentage = total === 0 ? 0 : Math.round((totalAttended / total) * 100);

  let healthStatus: 'excellent' | 'safe' | 'warning' | 'critical' = 'safe';

  if (total === 0) {
    healthStatus = 'excellent';
  } else if (percentage >= 85) {
    healthStatus = 'excellent';
  } else if (percentage >= globalTarget) {
    healthStatus = 'safe';
  } else if (percentage >= globalTarget - 10) {
    healthStatus = 'warning';
  } else {
    healthStatus = 'critical';
  }

  return {
    attended: totalAttended,
    missed: totalMissed,
    total,
    percentage,
    healthStatus,
  };
}
