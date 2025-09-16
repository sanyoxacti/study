import type { Subject } from './types.ts';

export const HOURS: string[] = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 8;
  const ampm = hour >= 12 && hour < 24 ? '오후' : '오전';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${ampm} ${displayHour.toString().padStart(2, '0')}:00`;
});

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: '1', name: '민법', color: 'bg-blue-100', textColor: 'text-blue-800' },
  { id: '2', name: '사회보험법', color: 'bg-green-100', textColor: 'text-green-800' },
  { id: '3', name: '노동1차', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { id: '4', name: '경영학', color: 'bg-purple-100', textColor: 'text-purple-800' },
  { id: '5', name: '노동법', color: 'bg-red-100', textColor: 'text-red-800' },
  { id: '6', name: '행쟁', color: 'bg-orange-100', textColor: 'text-orange-800' },
  { id: '7', name: '인사', color: 'bg-teal-100', textColor: 'text-teal-800' },
  { id: '8', name: '경조', color: 'bg-pink-100', textColor: 'text-pink-800' },
];

export const AVAILABLE_COLORS = [
    { color: 'bg-slate-200', textColor: 'text-slate-800' },
    { color: 'bg-red-100', textColor: 'text-red-800' },
    { color: 'bg-orange-100', textColor: 'text-orange-800' },
    { color: 'bg-amber-100', textColor: 'text-amber-800' },
    { color: 'bg-yellow-100', textColor: 'text-yellow-800' },
    { color: 'bg-lime-100', textColor: 'text-lime-800' },
    { color: 'bg-green-100', textColor: 'text-green-800' },
    { color: 'bg-emerald-100', textColor: 'text-emerald-800' },
    { color: 'bg-teal-100', textColor: 'text-teal-800' },
    { color: 'bg-cyan-100', textColor: 'text-cyan-800' },
    { color: 'bg-sky-100', textColor: 'text-sky-800' },
    { color: 'bg-blue-100', textColor: 'text-blue-800' },
    { color: 'bg-indigo-100', textColor: 'text-indigo-800' },
    { color: 'bg-violet-100', textColor: 'text-violet-800' },
    { color: 'bg-purple-100', textColor: 'text-purple-800' },
    { color: 'bg-fuchsia-100', textColor: 'text-fuchsia-800' },
    { color: 'bg-pink-100', textColor: 'text-pink-800' },
    { color: 'bg-rose-100', textColor: 'text-rose-800' },
];