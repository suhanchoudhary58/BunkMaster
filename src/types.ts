export interface Subject {
  id: string;
  name: string;
  code?: string;
  attended: number;
  missed: number;
  targetPercentage: number; // e.g. 75
  type?: 'lecture' | 'lab';
}

export type ClassState = 'regular' | 'cancelled' | 'extra' | 'rescheduled';

export interface ClassItem {
  id: string;
  subjectId: string;
  subjectName: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  room?: string;
  teacher?: string;
  state: ClassState;
  rescheduledDate?: string; // YYYY-MM-DD or custom text
  rescheduledTime?: string; // HH:MM
}

export interface DayLog {
  id: string;
  date: string; // YYYY-MM-DD
  subjectId: string;
  status: 'present' | 'absent' | 'cancelled';
  classId?: string; // Optional reference to standard timetable item
}

export interface SmartMessage {
  id: string;
  category: 'excellent' | 'safe' | 'warning' | 'critical';
  text: string;
  subtext?: string;
  subjectId?: string;
}

export interface UserPreferences {
  name: string;
  globalTarget: number;
  theme: 'light' | 'dark';
  semesterBreak?: boolean;
}
