import React from 'react';

interface DistractionLogProps {
  log: string;
  onLogChange: (newLog: string) => void;
}

export const DistractionLog: React.FC<DistractionLogProps> = ({ log, onLogChange }) => {
  return (
    <div className="bg-brand-surface p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-2 text-brand-text-primary">방해 요소</h3>
      <p className="text-sm text-brand-text-secondary mb-4">오늘 무엇이 당신의 집중을 방해했나요? 패턴을 파악하기 위해 기록해보세요.</p>
      <textarea
        value={log}
        onChange={(e) => onLogChange(e.target.value)}
        rows={10}
        className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text-primary text-sm"
        placeholder="예: 10:30에 소셜 미디어 확인, 15:00에 전화로 방해받음..."
      />
    </div>
  );
};