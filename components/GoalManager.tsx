import React, { useState } from 'react';
import type { Subject, Goal } from '../types.ts';
import { PlusIcon, TrashIcon } from './Icons.tsx';

interface GoalManagerProps {
  subjects: Subject[];
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  onClose: () => void;
}

const getWeekStartDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setHours(0,0,0,0);
    return new Date(d.setDate(diff));
};

const getMonthStartDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const GoalManager: React.FC<GoalManagerProps> = ({ subjects, goals, setGoals, onClose }) => {
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [subjectId, setSubjectId] = useState(subjects.length > 0 ? subjects[0].id : '');

  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  const handleAddGoal = () => {
    if (description.trim() === '' || !subjectId) {
        alert("과목을 선택하고 목표를 입력해주세요.");
        return;
    }

    const now = new Date();
    const startDate = period === 'week' ? getWeekStartDate(now) : getMonthStartDate(now);
    const startDateString = startDate.toISOString().slice(0, 10);

    const existingGoal = goals.find(g => 
        g.subjectId === subjectId && 
        g.period === period &&
        g.description.trim() === description.trim()
    );

    if (existingGoal) {
        alert(`이미 동일한 목표가 존재합니다.`);
        return;
    }

    const newGoal: Omit<Goal, 'id' | 'targetHours'> = {
        subjectId,
        period,
        startDate: startDateString,
        description: description.trim(),
    };

    setGoals(prev => [...prev, { ...newGoal, id: Date.now().toString() }]);
    setDescription('');
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-lg text-brand-text-primary">
        <h2 className="text-2xl font-bold mb-6 text-center">목표 관리</h2>

        <div className="mb-6 border-b border-slate-200 dark:border-slate-700 pb-6">
            <h3 className="text-lg font-semibold mb-3">새 목표 추가</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                    <label htmlFor="goal-subject" className="block text-sm font-medium text-brand-text-secondary mb-1">과목</label>
                    <select
                        id="goal-subject"
                        value={subjectId}
                        onChange={e => setSubjectId(e.target.value)}
                        className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">기간</label>
                    <div className="flex gap-1 rounded-lg p-1 bg-slate-100 dark:bg-slate-800">
                        <button onClick={() => setPeriod('week')} className={`w-full px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${period === 'week' ? 'bg-brand-surface shadow-sm text-brand-text-primary' : 'text-brand-text-secondary hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                            이번 주
                        </button>
                        <button onClick={() => setPeriod('month')} className={`w-full px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${period === 'month' ? 'bg-brand-surface shadow-sm text-brand-text-primary' : 'text-brand-text-secondary hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                            이번 달
                        </button>
                    </div>
                </div>
            </div>
            <div>
                 <label htmlFor="goal-description" className="block text-sm font-medium text-brand-text-secondary mb-1">목표 내용</label>
                <textarea
                    id="goal-description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm"
                    placeholder="예: 민법 1회독, 객관식 100문제 풀기"
                />
            </div>
            <button 
                onClick={handleAddGoal} 
                className="mt-4 w-full bg-brand-primary hover:bg-slate-700 dark:bg-slate-300 dark:hover:bg-slate-400 text-white dark:text-slate-900 font-bold p-2 rounded-md flex items-center justify-center gap-2 transition-colors"
            >
                <PlusIcon className="w-5 h-5" />
                목표 추가
            </button>
        </div>

        <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
            <h3 className="text-lg font-semibold mb-2">진행중인 목표</h3>
            {goals.length > 0 ? goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 ${subjectMap.get(goal.subjectId)?.color}`}></div>
                        <p className="font-semibold truncate text-sm" title={goal.description}>
                            {goal.description}
                        </p>
                    </div>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            )) : <p className="text-brand-text-secondary text-sm text-center py-4">진행중인 목표가 없습니다.</p>}
        </div>
        
        <div className="mt-8 text-center">
            <button onClick={onClose} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-brand-text-primary font-bold py-2 px-6 rounded-lg transition-colors">
                완료
            </button>
        </div>
      </div>
    </div>
  );
};