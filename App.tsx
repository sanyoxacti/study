

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import type { AppData, ScheduleEntry, Subject, DistractionLog, Goal, ReviewLog, MemoItem } from './types.ts';
import { View } from './types.ts';
import { Scheduler } from './components/Scheduler.tsx';
import { Statistics } from './components/Statistics.tsx';
import { DEFAULT_SUBJECTS } from './constants.ts';
import { BottomNavBar } from './components/BottomNavBar.tsx';
import { MoonIcon, SunIcon } from './components/Icons.tsx';

const App: React.FC = () => {
  const [appData, setAppData] = useLocalStorage<AppData>('studyForNaData', {
    subjects: DEFAULT_SUBJECTS,
    schedule: [],
    distractions: {},
    goals: [],
    dailyGoal: 1,
    reviews: {},
    todos: {},
  });
  
  const [view, setView] = useState<View>(View.Scheduler);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setSubjects = (subjects: Subject[] | ((prev: Subject[]) => Subject[])) => {
    setAppData(prev => ({ ...prev, subjects: typeof subjects === 'function' ? subjects(prev.subjects) : subjects }));
  };

  const setSchedule = (schedule: ScheduleEntry[] | ((prev: ScheduleEntry[]) => ScheduleEntry[])) => {
    setAppData(prev => ({ ...prev, schedule: typeof schedule === 'function' ? schedule(prev.schedule) : schedule }));
  };

  const setDistractions = (distractions: DistractionLog | ((prev: DistractionLog) => DistractionLog)) => {
    setAppData(prev => ({...prev, distractions: typeof distractions === 'function' ? distractions(prev.distractions) : distractions }));
  }
  
  const setGoals = (goals: Goal[] | ((prev: Goal[]) => Goal[])) => {
    setAppData(prev => ({...prev, goals: typeof goals === 'function' ? goals(prev.goals) : goals }));
  }

  const setDailyGoal = (goal: number) => {
    setAppData(prev => ({...prev, dailyGoal: goal}));
  };

  const setReviews = (reviews: ReviewLog | ((prev: ReviewLog) => ReviewLog)) => {
    setAppData(prev => ({...prev, reviews: typeof reviews === 'function' ? reviews(prev.reviews) : reviews }));
  };
  
  const setTodos = (todos: { [date: string]: MemoItem[] } | ((prev: { [date: string]: MemoItem[] }) => { [date: string]: MemoItem[] })) => {
    setAppData(prev => ({...prev, todos: typeof todos === 'function' ? todos(prev.todos) : todos }));
  };


  const handleDateChange = (offset: number) => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + offset);
      return newDate;
    });
  };

  const isDateToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const renderView = () => {
    switch(view) {
      case View.Scheduler:
        return (
          <Scheduler
            selectedDate={selectedDate}
            schedule={appData.schedule}
            subjects={appData.subjects}
            distractions={appData.distractions}
            todos={appData.todos}
            setSchedule={setSchedule as React.Dispatch<React.SetStateAction<ScheduleEntry[]>>}
            setSubjects={setSubjects as React.Dispatch<React.SetStateAction<Subject[]>>}
            setDistractions={setDistractions as React.Dispatch<React.SetStateAction<DistractionLog>>}
            setTodos={setTodos as React.Dispatch<React.SetStateAction<{ [date: string]: MemoItem[] }>>}
          />
        );
      case View.Statistics:
        return <Statistics 
                  schedule={appData.schedule} 
                  subjects={appData.subjects} 
                  goals={appData.goals}
                  setGoals={setGoals as React.Dispatch<React.SetStateAction<Goal[]>>}
                  dailyGoal={appData.dailyGoal}
                  setDailyGoal={setDailyGoal}
                  reviews={appData.reviews}
                  setReviews={setReviews as React.Dispatch<React.SetStateAction<ReviewLog>>}
                  distractions={appData.distractions}
                />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary pb-24">
      <header className="bg-brand-surface/80 backdrop-blur-lg sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-brand-text-primary">나를 위한 공부</h1>
            <div className="flex items-center gap-4">
                {view === View.Scheduler && (
                    <div className="flex items-center gap-1">
                        <button onClick={() => handleDateChange(-1)} className="px-2 sm:px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors text-brand-text-secondary dark:text-slate-400">
                            &lt;
                        </button>
                        <button 
                            onClick={() => setSelectedDate(new Date())} 
                            className={`px-2 sm:px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors ${
                                isDateToday(selectedDate)
                                ? 'font-semibold text-brand-text-primary'
                                : 'text-brand-text-secondary dark:text-slate-400'
                            }`}
                        >
                            오늘
                        </button>
                        <button onClick={() => handleDateChange(1)} className="px-2 sm:px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors text-brand-text-secondary dark:text-slate-400">
                            &gt;
                        </button>
                    </div>
                )}
                 <button onClick={toggleTheme} className="p-2 rounded-full text-brand-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                  </button>
            </div>
          </div>
        </div>
      </header>
      <main>
        {renderView()}
      </main>
      <BottomNavBar currentView={view} setView={setView} />
    </div>
  );
};

export default App;