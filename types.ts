
export interface MemoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export interface ScheduleEntry {
  id:string; // Format: 'YYYY-MM-DD-HH'
  subjectId: string;
  memo?: MemoItem[];
  isNew?: boolean;
  isExiting?: boolean;
}

export interface DistractionLog {
  [date: string]: string; // Format: { 'YYYY-MM-DD': 'Distraction notes...' }
}

export interface Goal {
  id: string;
  subjectId: string;
  period: 'week' | 'month';
  startDate: string; // YYYY-MM-DD format of the first day of the period
  description: string;
}

export interface Review {
  notes: string;
}

export interface ReviewLog {
  [id: string]: Review; // id format: 'YYYY-WW' for week, 'YYYY-MM' for month
}

export interface AppData {
  subjects: Subject[];
  schedule: ScheduleEntry[];
  distractions: DistractionLog;
  goals: Goal[];
  dailyGoal: number; // in hours
  reviews: ReviewLog;
  todos: { [date: string]: MemoItem[] };
}

export enum View {
  Scheduler,
  Statistics,
}