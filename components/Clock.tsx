import React, { useState, useEffect } from 'react';

export const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };
  const formattedDate = time.toLocaleDateString('ko-KR', dateOptions);

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');

  return (
    <div className="bg-brand-surface p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center select-none">
      <p className="text-sm font-medium text-brand-text-secondary mb-2">
        {formattedDate}
      </p>
      <div className="flex items-baseline justify-center font-mono text-brand-text-primary tracking-tight">
        <span className="text-6xl font-bold">{formattedHours}</span>
        <span className="text-5xl font-semibold mx-1">:</span>
        <span className="text-6xl font-bold">{minutes}</span>
        <span className="text-xl font-semibold ml-2">{ampm}</span>
      </div>
    </div>
  );
};