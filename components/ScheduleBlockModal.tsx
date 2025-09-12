import React, { useState, useEffect } from 'react';
import type { ScheduleEntry, Subject } from '../types.ts';
import { TrashIcon, CheckIcon } from './Icons.tsx';

interface ScheduleBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<ScheduleEntry, 'id'>) => void;
  onDelete: () => void;
  subjects: Subject[];
  entry: Omit<ScheduleEntry, 'id'> | null;
  entryTitle: string;
}

export const ScheduleBlockModal: React.FC<ScheduleBlockModalProps> = ({ isOpen, onClose, onSave, onDelete, subjects, entry, entryTitle }) => {
  const [subjectId, setSubjectId] = useState('');
  const [memo, setMemo] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (entry && entry.subjectId) {
      setSubjectId(entry.subjectId);
      setMemo(entry.memo);
      setIsEditing(true);
    } else {
      setSubjectId(subjects.length > 0 ? subjects[0].id : '');
      setMemo(entry ? entry.memo : '');
      setIsEditing(false);
    }
  }, [entry, subjects]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!subjectId) {
        alert("과목을 선택해주세요.");
        return;
    }
    onSave({ subjectId, memo });
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  }

  const subject = subjects.find(s => s.id === subjectId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4" onClick={onClose}>
      <div className="bg-brand-surface rounded-2xl shadow-2xl p-6 w-full max-w-sm text-brand-text-primary" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-xl font-bold">{isEditing ? subject?.name : '새 세션'}</h2>
                <p className="text-sm text-brand-text-secondary">{entryTitle}</p>
            </div>
            <div className="flex items-center gap-2">
                 <button onClick={handleSave} className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors">
                    <CheckIcon className="w-6 h-6"/>
                </button>
            </div>
        </div>

        {!isEditing && (
             <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-brand-text-secondary mb-1">과목</label>
                <select
                    id="subject"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                    {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                </select>
            </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="memo" className="block text-sm font-medium text-brand-text-secondary mb-1">세션 피드백 및 메모</label>
          <textarea
            id="memo"
            rows={5}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm"
            placeholder="새로운 미적분 정리를 배웠습니다. 적분 복습이 필요합니다."
          />
        </div>
        
        <div className="flex justify-between items-center">
            {isEditing ? (
                 <button onClick={handleDelete} className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-2 px-3 py-2 rounded-md text-sm">
                    <TrashIcon className="w-5 h-5"/>
                    세션 삭제
                </button>
            ) : <div />}
             <button onClick={onClose} className="text-sm text-brand-text-secondary hover:text-brand-text-primary">
              취소
            </button>
        </div>
      </div>
    </div>
  );
};