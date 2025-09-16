import React, { useState, useEffect } from 'react';
import type { ScheduleEntry, Subject, MemoItem } from '../types.ts';
import { TrashIcon, CheckIcon, PlusIcon } from './Icons.tsx';

interface ScheduleBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Pick<ScheduleEntry, 'subjectId' | 'memo'>) => void;
  onDelete: () => void;
  subjects: Subject[];
  entry: Omit<ScheduleEntry, 'id'> | null;
  entryTitle: string;
}

export const ScheduleBlockModal: React.FC<ScheduleBlockModalProps> = ({ isOpen, onClose, onSave, onDelete, subjects, entry, entryTitle }) => {
  const [subjectId, setSubjectId] = useState('');
  const [memo, setMemo] = useState<MemoItem[]>([]);
  const [newMemoText, setNewMemoText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (entry) {
        setSubjectId(entry.subjectId || (subjects.length > 0 ? subjects[0].id : ''));
        setMemo(entry.memo || []);
        setIsEditing(!!entry.subjectId);
    } else {
        setSubjectId(subjects.length > 0 ? subjects[0].id : '');
        setMemo([]);
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
  
  const handleAddMemo = () => {
    if (newMemoText.trim() === '') return;
    const newMemoItem: MemoItem = {
      id: Date.now().toString(),
      text: newMemoText.trim(),
      completed: false,
    };
    setMemo([...memo, newMemoItem]);
    setNewMemoText('');
  };

  const handleMemoTextChange = (id: string, text: string) => {
    setMemo(memo.map(item => item.id === id ? { ...item, text } : item));
  };

  const handleMemoToggle = (id: string) => {
    setMemo(memo.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleDeleteMemo = (id: string) => {
    setMemo(memo.filter(item => item.id !== id));
  };


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

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <label className="block text-sm font-medium text-brand-text-secondary mb-2">메모 / 할 일</label>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 mb-2">
             {memo.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleMemoToggle(item.id)}
                    className="w-5 h-5 rounded text-brand-primary bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500 focus:ring-brand-primary focus:ring-2 flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleMemoTextChange(item.id, e.target.value)}
                    className={`flex-grow bg-transparent text-sm p-1 rounded-md focus:outline-none focus:bg-white dark:focus:bg-slate-800 ${item.completed ? 'line-through text-brand-text-secondary' : ''}`}
                  />
                  <button onClick={() => handleDeleteMemo(item.id)} className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
             ))}
          </div>
          <div className="flex items-center gap-2">
            <input
                type="text"
                value={newMemoText}
                onChange={(e) => setNewMemoText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMemo()}
                placeholder="새 항목 추가..."
                className="flex-grow bg-slate-100 dark:bg-slate-700 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <button onClick={handleAddMemo} className="p-2 bg-brand-primary text-white rounded-md hover:bg-opacity-90 transition-colors flex-shrink-0">
                <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-6">
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