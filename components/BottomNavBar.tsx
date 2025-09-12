
import React from 'react';
import { View } from '../types.ts';
import { CalendarIcon, ChartBarIcon, CalendarIconSolid, ChartBarIconSolid } from './Icons.tsx';

interface BottomNavBarProps {
  currentView: View;
  setView: (view: View) => void;
}

const navItems = [
  { view: View.Scheduler, label: '플래너', Icon: CalendarIcon, SolidIcon: CalendarIconSolid },
  { view: View.Statistics, label: '통계', Icon: ChartBarIcon, SolidIcon: ChartBarIconSolid },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentView, setView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-brand-surface border-t border-slate-200 dark:border-slate-800 shadow-lg flex justify-around items-center z-40">
      {navItems.map(({ view, label, Icon, SolidIcon }) => {
        const isActive = currentView === view;
        return (
          <button
            key={label}
            onClick={() => setView(view)}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-20 transition-colors rounded-lg ${
              isActive ? 'text-brand-text-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            {isActive ? <SolidIcon className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
            <span className={`text-xs font-semibold ${isActive ? 'text-brand-text-primary' : 'text-brand-text-secondary'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};