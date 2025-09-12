

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ScheduleEntry, Subject, Goal, ReviewLog, DistractionLog, Review } from '../types.ts';
import { TargetIcon, ChartBarIcon, ChartBarIconSolid, FireIcon, FireIconSolid, BookmarkIcon, BookmarkIconSolid, CogIcon } from './Icons.tsx';
import { GoalManager } from './GoalManager.tsx';

interface StatisticsProps {
  schedule: ScheduleEntry[];
  subjects: Subject[];
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  reviews: ReviewLog;
  setReviews: React.Dispatch<React.SetStateAction<ReviewLog>>;
  distractions: DistractionLog;
}

type Period = 'day' | 'week' | 'month';
type StatTab = 'dashboard' | 'streak' | 'review';

const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const tailwindColorToHex = (tailwindColor: string): string => {
    const colorMap: { [key: string]: string } = { 'blue-100': '#dbeafe', 'yellow-100': '#fef3c7', 'green-100': '#dcfce7', 'purple-100': '#f3e8ff', 'slate-200': '#e2e8f0', 'red-100': '#fee2e2', 'orange-100': '#ffedd5', 'amber-100': '#fef3c7', 'lime-100': '#ecfccb', 'emerald-100': '#d1fae5', 'teal-100': '#ccfbf1', 'cyan-100': '#cffafe', 'sky-100': '#e0f2fe', 'indigo-100': '#e0e7ff', 'violet-100': '#ede9fe', 'fuchsia-100': '#fae8ff', 'pink-100': '#fce7f3', 'rose-100': '#ffe4e6' };
    const key = tailwindColor.replace('bg-', '');
    return colorMap[key] || '#8884d8';
};

const processDataForPeriod = (schedule: ScheduleEntry[], subjects: Subject[], period: Period, currentDate: Date) => {
    const currentYYYYMMDD = toYYYYMMDD(currentDate);

    const filteredSchedule = schedule.filter(entry => {
        const entryDateStr = entry.id.substring(0, 10);
        
        switch (period) {
            case 'day': 
                return entryDateStr === currentYYYYMMDD;
            case 'week': {
                // Using T00:00:00 to ensure it parses as local time, not UTC.
                const entryDate = new Date(entryDateStr + 'T00:00:00');
                if (isNaN(entryDate.getTime())) return false;

                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - startOfWeek.getDay());
                startOfWeek.setHours(0,0,0,0);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23,59,59,999);
                return entryDate >= startOfWeek && entryDate <= endOfWeek;
            }
            case 'month':
                return entryDateStr.substring(0, 7) === currentYYYYMMDD.substring(0, 7);
            default: return false;
        }
    });

    const stats = new Map<string, { name: string, color: string, hours: number }>();
    subjects.forEach(s => stats.set(s.id, { name: s.name, color: tailwindColorToHex(s.color), hours: 0 }));

    filteredSchedule.forEach(entry => {
        if (stats.has(entry.subjectId)) {
            stats.get(entry.subjectId)!.hours += 1;
        }
    });

    const chartData = Array.from(stats.values()).filter(d => d.hours > 0);
    const totalHours = chartData.reduce((acc, curr) => acc + curr.hours, 0);

    return { chartData, totalHours, filteredSchedule };
};

const Dashboard: React.FC<Omit<StatisticsProps, 'dailyGoal' | 'setDailyGoal' | 'reviews' | 'setReviews' | 'distractions'>> = ({ schedule, subjects, goals, setGoals }) => {
    const [period, setPeriod] = useState<Period>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isGoalManagerOpen, setIsGoalManagerOpen] = useState(false);
  
    const { chartData, totalHours } = useMemo(() => processDataForPeriod(schedule, subjects, period, currentDate), [schedule, subjects, period, currentDate]);
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  
    const getWeekStartDate = (date: Date) => {
        const d = new Date(date);
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0,0,0,0);
        return d;
    };
  
    const getMonthStartDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
    
    const now = new Date();
    const startOfCurrentWeek = getWeekStartDate(now).toISOString().slice(0, 10);
    const startOfCurrentMonth = getMonthStartDate(now).toISOString().slice(0, 10);
  
    const activeWeeklyGoals = goals.filter(g => g.period === 'week' && g.startDate === startOfCurrentWeek);
    const activeMonthlyGoals = goals.filter(g => g.period === 'month' && g.startDate === startOfCurrentMonth);
  
    const scheduleBySubject = useMemo(() => {
        const now = new Date();
        const startOfWeek = getWeekStartDate(now);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);
        
        const startOfMonth = getMonthStartDate(now);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          
        return schedule.reduce((acc, entry) => {
          const date = new Date(entry.id.substring(0, 10) + 'T00:00:00');
          if (date >= startOfWeek && date <= endOfWeek) {
              acc.week[entry.subjectId] = (acc.week[entry.subjectId] || 0) + 1;
          }
          if (date >= startOfMonth && date <= endOfMonth) {
              acc.month[entry.subjectId] = (acc.month[entry.subjectId] || 0) + 1;
          }
          return acc;
        }, { week: {} as Record<string, number>, month: {} as Record<string, number> });
    }, [schedule]);
    
    const getPeriodLabel = () => {
        switch(period) {
            case 'day': return currentDate.toLocaleDateString('ko-KR');
            case 'week': 
              const start = new Date(currentDate);
              start.setDate(currentDate.getDate() - start.getDay());
              const end = new Date(start);
              end.setDate(start.getDate() + 6);
              return `${start.toLocaleDateString('ko-KR')} ~ ${end.toLocaleDateString('ko-KR')}`;
            case 'month': return currentDate.toLocaleString('ko-KR', { month: 'long', year: 'numeric' });
        }
    }
    
    const navigateDate = (amount: number) => {
      setCurrentDate(prev => {
          const next = new Date(prev);
          if (period === 'day') next.setDate(prev.getDate() + amount);
          if (period === 'week') next.setDate(prev.getDate() + (7*amount));
          if (period === 'month') next.setMonth(prev.getMonth() + amount);
          return next;
      });
    }
    
    const renderLegend = (props: any) => {
        const { payload } = props;
        return (
            <ul className="flex flex-col gap-2 mt-4">
                {payload.map((entry: any, index: number) => (
                    <li key={`item-${index}`} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: entry.color}}></div>
                        <span className="text-sm text-brand-text-secondary">{entry.value} ({entry.payload.hours}시간)</span>
                    </li>
                ))}
            </ul>
        )
    }
    
    const tooltipStyle = { backgroundColor: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-accent)', borderRadius: '0.5rem', color: 'var(--color-brand-text-primary)' };
  
    const renderGoalProgress = (goal: Goal) => {
      const subject = subjectMap.get(goal.subjectId);
      if (!subject) return null;
      const studiedHours = (goal.period === 'week' ? scheduleBySubject.week[goal.subjectId] : scheduleBySubject.month[goal.subjectId]) || 0;
      
      return (
        <div key={goal.id} className="flex items-start gap-3">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${subject.color}`}></div>
          <div className="flex-grow overflow-hidden">
              <p className="text-sm font-medium text-brand-text-primary" title={goal.description}>{goal.description}</p>
              <p className="text-xs text-brand-text-secondary">{subject.name} | {studiedHours.toFixed(1)} 시간 공부함</p>
          </div>
        </div>
      );
    };
  
    return <>
        <div className="bg-brand-surface p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-1 rounded-lg p-1 bg-slate-100 dark:bg-slate-800">
            {(['day', 'week', 'month'] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${period === p ? 'bg-brand-surface shadow-sm text-brand-text-primary' : 'text-brand-text-secondary hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                {p === 'day' ? '일' : p === 'week' ? '주' : '월'}
                </button>
            ))}
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => navigateDate(-1)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-brand-text-secondary">{'<'}</button>
                <span className="font-semibold text-sm text-brand-text-primary min-w-[240px] text-center">{getPeriodLabel()}</span>
                <button onClick={() => navigateDate(1)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-brand-text-secondary">{'>'}</button>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-2 text-left p-6 bg-brand-surface rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <p className="text-lg text-brand-text-secondary">총 공부 시간</p>
                <p className="text-6xl font-bold text-brand-text-primary">{totalHours}</p>
            </div>
            <div className="flex flex-col gap-4">
                <div className="bg-brand-surface p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-md font-semibold mb-3 text-brand-text-primary">주간 목표</h3>
                    <div className="space-y-3">{activeWeeklyGoals.length > 0 ? activeWeeklyGoals.map(renderGoalProgress) : <p className="text-center text-brand-text-secondary text-xs py-2">이번 주 목표가 없습니다.</p>}</div>
                </div>
                <div className="bg-brand-surface p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-md font-semibold mb-3 text-brand-text-primary">월간 목표</h3>
                    <div className="space-y-3">{activeMonthlyGoals.length > 0 ? activeMonthlyGoals.map(renderGoalProgress) : <p className="text-center text-brand-text-secondary text-xs py-2">이번 달 목표가 없습니다.</p>}</div>
                </div>
                <button onClick={() => setIsGoalManagerOpen(true)} className="w-full flex items-center justify-center gap-2 bg-brand-surface hover:bg-slate-100 dark:hover:bg-slate-700 text-brand-text-primary font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm border border-slate-200 dark:border-slate-700"><TargetIcon className="w-5 h-5"/>목표 관리</button>
            </div>
        </div>
        {chartData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-brand-surface p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4">과목별 분석</h3>
                    <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={chartData} dataKey="hours" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} fill="#8884d8" paddingAngle={5}>{chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie>
                        <Tooltip contentStyle={tooltipStyle}/>
                        <Legend content={renderLegend} />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-brand-surface p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4">과목별 분석</h3>
                    <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: 'rgba(100, 116, 139, 0.2)'}} contentStyle={tooltipStyle}/>
                        <Bar dataKey="hours" name="시간" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        ) : <div className="text-center py-16 bg-brand-surface rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"><p className="text-brand-text-secondary text-lg">이 기간에 기록된 학습 데이터가 없습니다.</p><p className="text-slate-400 dark:text-slate-500 mt-2">플래너로 이동하여 일정을 추가하세요!</p></div>}
        {isGoalManagerOpen && <GoalManager subjects={subjects} goals={goals} setGoals={setGoals} onClose={() => setIsGoalManagerOpen(false)} />}
    </>;
};

const StreakView: React.FC<Pick<StatisticsProps, 'schedule' | 'dailyGoal' | 'setDailyGoal'>> = ({ schedule, dailyGoal, setDailyGoal }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempGoal, setTempGoal] = useState(dailyGoal);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const studyHoursByDate = useMemo(() => {
        const map: Record<string, number> = {};
        schedule.forEach(entry => {
            const dateStr = entry.id.substring(0, 10);
            map[dateStr] = (map[dateStr] || 0) + 1;
        });
        return map;
    }, [schedule]);

    const calendarData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

        const endDate = new Date(lastDayOfMonth);
        endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

        const data = [];
        let day = new Date(startDate);

        while (day <= endDate) {
            const dateStr = toYYYYMMDD(day);
            data.push({
                date: new Date(day),
                hours: studyHoursByDate[dateStr] || 0,
                isCurrentMonth: day.getMonth() === month,
            });
            day.setDate(day.getDate() + 1);
        }
        return data;
    }, [currentMonth, studyHoursByDate]);

    const currentStreak = useMemo(() => {
        let streak = 0;
        let day = new Date();
        
        while(true) {
            const dateStr = toYYYYMMDD(day);
            if ((studyHoursByDate[dateStr] || 0) >= dailyGoal) {
                streak++;
                day.setDate(day.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }, [studyHoursByDate, dailyGoal]);

    const getColorClass = (hours: number) => {
        if (hours === 0) return 'bg-slate-100 dark:bg-slate-800';
        if (hours < dailyGoal * 0.5) return 'bg-emerald-200 dark:bg-emerald-900';
        if (hours < dailyGoal) return 'bg-emerald-400 dark:bg-emerald-700';
        return 'bg-emerald-600 dark:bg-emerald-500';
    };
    
    const getTextColorForDay = (day: { hours: number; isCurrentMonth: boolean; }) => {
        if (!day.isCurrentMonth) return 'text-slate-400 dark:text-slate-600';
        if (day.hours === 0) return 'text-brand-text-secondary';
        if (day.hours < dailyGoal * 0.5) return 'text-emerald-800 dark:text-emerald-200';
        return 'text-white';
    };

    const navigateMonth = (amount: number) => {
      setCurrentMonth(prev => {
          const next = new Date(prev);
          next.setMonth(prev.getMonth() + amount);
          return next;
      });
    };

    return <>
        <div className="bg-brand-surface p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-semibold text-brand-text-primary">🔥 현재 {currentStreak}일 연속 공부 중!</h3>
                <p className="text-sm text-brand-text-secondary">일일 목표: {dailyGoal}시간</p>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full text-brand-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <CogIcon className="w-6 h-6" />
            </button>
        </div>
        <div className="bg-brand-surface p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigateMonth(-1)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-brand-text-secondary">{'<'}</button>
                <h4 className="font-semibold text-lg text-brand-text-primary">{currentMonth.toLocaleString('ko-KR', { year: 'numeric', month: 'long' })}</h4>
                <button onClick={() => navigateMonth(1)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-brand-text-secondary">{'>'}</button>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => <div key={day} className="text-center text-xs text-brand-text-secondary font-semibold pb-2">{day}</div>)}
                {calendarData.map((day, i) =>
                    <div 
                        key={i} 
                        className={`w-full aspect-square rounded-md flex items-center justify-center ${day.isCurrentMonth ? getColorClass(day.hours) : 'bg-transparent'}`}
                        title={day.date ? `${day.date.toLocaleDateString('ko-KR')}: ${day.hours}시간` : ''}
                    >
                        <span className={`text-xs font-semibold ${getTextColorForDay(day)}`}>
                            {day.date?.getDate()}
                        </span>
                    </div>
                )}
            </div>
            <div className="flex justify-end items-center gap-2 mt-4 text-xs text-brand-text-secondary">
                Less
                <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800"></div>
                <div className="w-4 h-4 rounded bg-emerald-200 dark:bg-emerald-900"></div>
                <div className="w-4 h-4 rounded bg-emerald-400 dark:bg-emerald-700"></div>
                <div className="w-4 h-4 rounded bg-emerald-600 dark:bg-emerald-500"></div>
                More
            </div>
        </div>
        {isSettingsOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-sm">
                    <h3 className="text-xl font-bold mb-4">일일 목표 설정</h3>
                    <p className="text-sm text-brand-text-secondary mb-4">연속 학습일을 기록하기 위한 일일 최소 학습 시간을 설정하세요.</p>
                    <div className="flex items-center gap-4">
                        <input type="range" min="1" max="12" value={tempGoal} onChange={e => setTempGoal(Number(e.target.value))} className="w-full" />
                        <span className="font-bold text-lg w-16 text-center">{tempGoal} 시간</span>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => { setIsSettingsOpen(false); setTempGoal(dailyGoal); }} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-brand-text-primary font-bold py-2 px-4 rounded-lg">취소</button>
                        <button onClick={() => { setDailyGoal(tempGoal); setIsSettingsOpen(false); }} className="bg-brand-primary hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg">저장</button>
                    </div>
                </div>
            </div>
        )}
    </>;
};

const ReviewView: React.FC<Pick<StatisticsProps, 'schedule' | 'subjects' | 'distractions' | 'reviews' | 'setReviews'>> = ({ schedule, subjects, distractions, reviews, setReviews }) => {
    const [period, setPeriod] = useState<'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());

    const getWeekId = useCallback((d: Date) => {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((date.valueOf() - yearStart.valueOf()) / 86400000) + 1)/7);
        return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }, []);

    const getMonthId = useCallback((d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, []);

    const reviewId = useMemo(() => (period === 'week' ? getWeekId(currentDate) : getMonthId(currentDate)), [period, currentDate, getWeekId, getMonthId]);
    
    const { chartData, totalHours, filteredSchedule } = useMemo(() => {
        return processDataForPeriod(schedule, subjects, period, currentDate);
    }, [schedule, subjects, period, currentDate]);

    const frequentDistractions = useMemo(() => {
        const periodDates = new Set(filteredSchedule.map(e => e.id.substring(0, 10)));
        const text = Object.entries(distractions)
            .filter(([date]) => periodDates.has(date))
            .map(([, log]) => log)
            .join(' ');

        if (!text.trim()) return [];
        const stopWords = new Set(['및', '등', '이', '그', '저', '것', '수', '때', '좀', '더', '잘']);
        const wordCounts: Record<string, number> = {};
        text.toLowerCase().split(/[\s,.\-!?"“'”]+/g).forEach(word => {
            if (word && word.length > 1 && !stopWords.has(word) && isNaN(Number(word))) {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        });
        return Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    }, [filteredSchedule, distractions]);

    const navigateDate = (amount: number) => {
        setCurrentDate(prev => {
            const next = new Date(prev);
            if (period === 'week') next.setDate(prev.getDate() + (7 * amount));
            if (period === 'month') next.setMonth(prev.getMonth() + amount);
            return next;
        });
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newNotes = e.target.value;
        setReviews(prev => ({
            ...prev,
            [reviewId]: { ...prev[reviewId], notes: newNotes }
        }));
    };

    const getPeriodLabel = () => {
        if (period === 'week') {
            const start = new Date(currentDate);
            start.setDate(currentDate.getDate() - currentDate.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return `${start.toLocaleDateString('ko-KR')} ~ ${end.toLocaleDateString('ko-KR')}`;
        }
        return currentDate.toLocaleString('ko-KR', { month: 'long', year: 'numeric' });
    };

    return <>
        <div className="bg-brand-surface p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-1 rounded-lg p-1 bg-slate-100 dark:bg-slate-800">
                {(['week', 'month'] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${period === p ? 'bg-brand-surface shadow-sm text-brand-text-primary' : 'text-brand-text-secondary hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                        {p === 'week' ? '주간' : '월간'} 회고
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => navigateDate(-1)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-brand-text-secondary">{'<'}</button>
                <span className="font-semibold text-sm text-brand-text-primary w-48 text-center">{getPeriodLabel()}</span>
                <button onClick={() => navigateDate(1)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-brand-text-secondary">{'>'}</button>
            </div>
        </div>
        {totalHours > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <div className="bg-brand-surface p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold mb-4">기간 요약</h3>
                        <div className="space-y-2 text-brand-text-primary">
                            <div className="flex justify-between"><span className="text-brand-text-secondary">총 공부 시간:</span> <span className="font-bold">{totalHours} 시간</span></div>
                        </div>
                    </div>
                     <div className="bg-brand-surface p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold mb-4">주요 방해 요소</h3>
                        {frequentDistractions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {frequentDistractions.map(word => <span key={word} className="bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-1 rounded-full">{word}</span>)}
                            </div>
                        ) : <p className="text-sm text-brand-text-secondary">기록된 방해 요소가 없습니다.</p>}
                    </div>
                    <div className="bg-brand-surface p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold mb-4">과목별 분석</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={60} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} contentStyle={{ backgroundColor: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-accent)', borderRadius: '0.5rem' }}/>
                                <Bar dataKey="hours" name="시간" radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-brand-surface p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                     <h3 className="text-lg font-semibold mb-4">회고 및 메모</h3>
                     <textarea value={reviews[reviewId]?.notes || ''} onChange={handleNotesChange} rows={15} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text-primary text-sm" placeholder="이번 기간의 학습에 대해 자유롭게 기록해보세요..."></textarea>
                </div>
            </div>
        ) : (
             <div className="text-center py-16 bg-brand-surface rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <p className="text-brand-text-secondary text-lg">이 기간에 기록된 학습 데이터가 없습니다.</p>
                <p className="text-slate-400 dark:text-slate-500 mt-2">다음 기간의 회고를 위해 꾸준히 기록해보세요!</p>
            </div>
        )}
    </>;
};


export const Statistics: React.FC<StatisticsProps> = (props) => {
    const [activeTab, setActiveTab] = useState<StatTab>('dashboard');

    const tabs: { id: StatTab, label: string, Icon: React.FC<any>, SolidIcon: React.FC<any> }[] = [
        { id: 'dashboard', label: '대시보드', Icon: ChartBarIcon, SolidIcon: ChartBarIconSolid },
        { id: 'streak', label: '학습 잔디', Icon: FireIcon, SolidIcon: FireIconSolid },
        { id: 'review', label: '회고', Icon: BookmarkIcon, SolidIcon: BookmarkIconSolid },
    ];
    
    return (
        <div className="container mx-auto p-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-brand-text-primary text-center mb-6">통계 및 분석</h2>

            <div className="mb-6 border-b border-slate-200 dark:border-slate-700 flex justify-center">
                {tabs.map(({ id, label, Icon, SolidIcon }) => {
                    const isActive = activeTab === id;
                    return (
                        <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${isActive ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'}`}>
                           {isActive ? <SolidIcon className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                           {label}
                        </button>
                    )
                })}
            </div>

            {activeTab === 'dashboard' && <Dashboard {...props} />}
            {activeTab === 'streak' && <StreakView {...props} />}
            {activeTab === 'review' && <ReviewView {...props} />}
        </div>
    );
};