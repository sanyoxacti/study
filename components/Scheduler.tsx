import React, { useState, useMemo, useCallback } from 'react';
import type { ScheduleEntry, Subject, DistractionLog, MemoItem } from '../types.ts';
import { HOURS } from '../constants.ts';
import { ScheduleBlockModal } from './ScheduleBlockModal.tsx';
import { DistractionLog as DistractionLogComponent } from './DistractionLog.tsx';
import { PencilIcon, CheckIcon } from './Icons.tsx';
import { SubjectManager } from './SubjectManager.tsx';
import { Clock } from './Clock.tsx';
import { TodoList } from './TodoList.tsx';

const getHourFromAmPm = (hourStr: string) => {
    const [ampm, time] = hourStr.split(' ');
    let [hour] = time.split(':').map(Number);
    if (ampm === '오후' && hour !== 12) hour += 12;
    if (ampm === '오전' && hour === 12) hour = 0;
    return hour;
};

const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type ScheduleGroup = {
    start: number, 
    end: number, 
    entry: ScheduleEntry, 
    subject: Subject | undefined, 
    isNew?: boolean, 
    isExiting?: boolean
};

interface SchedulerProps {
  selectedDate: Date;
  schedule: ScheduleEntry[];
  subjects: Subject[];
  distractions: DistractionLog;
  todos: { [date: string]: MemoItem[] };
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  setDistractions: React.Dispatch<React.SetStateAction<DistractionLog>>;
  setTodos: React.Dispatch<React.SetStateAction<{ [date: string]: MemoItem[] }>>;
}

export const Scheduler: React.FC<SchedulerProps> = ({ selectedDate, schedule, subjects, distractions, todos, setSchedule, setSubjects, setDistractions, setTodos }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedEntryTitle, setSelectedEntryTitle] = useState('');
  
  const [draggedGroup, setDraggedGroup] = useState<ScheduleGroup | null>(null);
  const [resizingGroup, setResizingGroup] = useState<ScheduleGroup | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);

  const yyyymmdd = toYYYYMMDD(selectedDate);

  const openModal = (hourStr: string, title?: string) => {
    const hour24 = getHourFromAmPm(hourStr).toString().padStart(2, '0');
    setSelectedEntryId(`${yyyymmdd}-${hour24}`);
    setSelectedEntryTitle(title || `${hourStr}`);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleSave = (entryData: Pick<ScheduleEntry, 'subjectId' | 'memo'>) => {
    if (!selectedEntryId) return;
    const clickedHour = parseInt(selectedEntryId.slice(11, 13));
    const group = groupedSchedule.find(g => clickedHour >= g.start && clickedHour < g.end);

    if (group) { // Editing a whole group
        const entryIdsInGroup = Array.from({ length: group.end - group.start }, (_, i) => `${yyyymmdd}-${(group.start + i).toString().padStart(2, '0')}`);
        setSchedule(prev => prev.map(e => entryIdsInGroup.includes(e.id) ? { ...e, ...entryData, isNew: false } : e));
    } else { // Adding a new single entry
        setSchedule(prev => [...prev.filter(e => e.id !== selectedEntryId), { ...entryData, id: selectedEntryId, isNew: true }]);
    }
  };

  const handleDelete = () => {
    if (!selectedEntryId) return;
    const clickedHour = parseInt(selectedEntryId.slice(11, 13));
    const group = groupedSchedule.find(g => clickedHour >= g.start && clickedHour < g.end);
    
    const idsToDelete = group ? Array.from({ length: group.end - group.start }, (_, i) => `${yyyymmdd}-${(group.start + i).toString().padStart(2, '0')}`) : [selectedEntryId];

    setSchedule(current => current.map(e => idsToDelete.includes(e.id) ? { ...e, isExiting: true } : e));
    setTimeout(() => setSchedule(current => current.filter(e => !idsToDelete.includes(e.id))), 300);
  };

  const handleToggleMemo = useCallback((group: ScheduleGroup, memoId: string) => {
    const entryIdsInGroup = Array.from({ length: group.end - group.start }, (_, i) => `${yyyymmdd}-${(group.start + i).toString().padStart(2, '0')}`);
    
    setSchedule(prev => 
        prev.map(entry => {
            if (entryIdsInGroup.includes(entry.id) && entry.memo) {
                const newMemo = entry.memo.map(memoItem => 
                    memoItem.id === memoId 
                        ? { ...memoItem, completed: !memoItem.completed } 
                        : memoItem
                );
                return { ...entry, memo: newMemo, isNew: false };
            }
            return entry;
        })
    );
  }, [setSchedule, yyyymmdd]);
  
  const handleTodosChange = (newTodos: MemoItem[]) => {
    setTodos(prev => ({ ...prev, [yyyymmdd]: newTodos }));
  };

  const groupedSchedule = useMemo(() => {
      const entriesForDate = schedule.filter((e: ScheduleEntry) => e.id.startsWith(yyyymmdd));
      const entryMap = new Map(entriesForDate.map((e: ScheduleEntry) => [parseInt(e.id.slice(11, 13)), e]));
      const groups: ScheduleGroup[] = [];
      
      for(let i=8; i < 25; i++) {
        const entry = entryMap.get(i);
        if(entry) {
            const lastGroup = groups[groups.length - 1];
            if(lastGroup && lastGroup.end === i && lastGroup.entry.subjectId === entry.subjectId && JSON.stringify(lastGroup.entry.memo || []) === JSON.stringify(entry.memo || []) && !lastGroup.isExiting && !entry.isExiting) {
                lastGroup.end = i + 1;
                lastGroup.isNew = lastGroup.isNew || entry.isNew;
            } else {
                const subject = subjects.find((s: Subject) => s.id === entry.subjectId);
                groups.push({ start: i, end: i + 1, entry, subject, isNew: entry.isNew, isExiting: entry.isExiting });
            }
        }
      }
      return groups;
  }, [schedule, subjects, yyyymmdd]);

  const occupiedHours = useMemo(() => {
    const hours = new Set<number>();
    groupedSchedule.forEach(group => {
        for (let i = group.start; i < group.end; i++) hours.add(i);
    });
    return hours;
  }, [groupedSchedule]);

  const handleDragStart = (e: React.DragEvent, group: ScheduleGroup, type: 'move' | 'resize') => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', group.entry.id);
    if (type === 'move') {
      setDraggedGroup(group);
    } else {
        e.stopPropagation();
        setResizingGroup(group);
    }
  };

  const handleDragEnd = () => {
    setDraggedGroup(null);
    setResizingGroup(null);
    setDragOverHour(null);
  };

  const handleDrop = useCallback((targetHour: number) => {
    if (draggedGroup) {
        // Move operation
        const duration = draggedGroup.end - draggedGroup.start;
        for (let i = 0; i < duration; i++) {
            if (occupiedHours.has(targetHour + i) && !(targetHour + i >= draggedGroup.start && targetHour + i < draggedGroup.end)) {
                return; // Collision detected
            }
        }
        const oldIds = Array.from({ length: duration }, (_, i) => `${yyyymmdd}-${(draggedGroup.start + i).toString().padStart(2, '0')}`);
        const newEntries = oldIds.map((_, i) => ({
            ...draggedGroup.entry,
            id: `${yyyymmdd}-${(targetHour + i).toString().padStart(2, '0')}`,
            isNew: false
        }));
        setSchedule((prev: ScheduleEntry[]) => [...prev.filter(item => !oldIds.includes(item.id)), ...newEntries]);

    } else if (resizingGroup) {
        // Resize operation
        const newEndHour = targetHour + 1;
        // A block must be at least 1 hour long.
        if (newEndHour <= resizingGroup.start) {
            return;
        }

        const currentEndHour = resizingGroup.end;

        if (newEndHour > currentEndHour) { // Extending
            // Check for collisions in the new extended part
            for (let i = currentEndHour; i < newEndHour; i++) {
                if (occupiedHours.has(i)) {
                    return; // Collision detected
                }
            }
            const newEntries = Array.from({ length: newEndHour - currentEndHour }, (_, i) => ({
                ...resizingGroup.entry,
                id: `${yyyymmdd}-${(currentEndHour + i).toString().padStart(2, '0')}`,
                isNew: false, // Not a brand new block
            }));
            setSchedule(prev => [...prev, ...newEntries]);
        } else if (newEndHour < currentEndHour) { // Shrinking
            // Find IDs to remove
            const idsToDelete = Array.from({ length: currentEndHour - newEndHour }, (_, i) => `${yyyymmdd}-${(newEndHour + i).toString().padStart(2, '0')}`);
            
            // Trigger exit animation
            setSchedule(current => current.map(e => idsToDelete.includes(e.id) ? { ...e, isExiting: true } : e));
            
            // Actually remove from state after animation
            setTimeout(() => {
                setSchedule(current => current.filter(e => !idsToDelete.includes(e.id)));
            }, 300);
        }
        // If newEndHour === currentEndHour, do nothing.
    }
  }, [draggedGroup, resizingGroup, yyyymmdd, occupiedHours, setSchedule]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-brand-text-primary">{selectedDate.toLocaleDateString('ko-KR', { weekday: 'long' })}</h2>
        <p className="text-brand-text-secondary">{selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-brand-surface p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="relative">
            {groupedSchedule.map(group => {
                const top = (group.start - 8) * 6 + 'rem';
                const height = (group.end - group.start) * 6 + 'rem';
                const isDragging = draggedGroup?.entry.id === group.entry.id;
                const isResizing = resizingGroup?.entry.id === group.entry.id;

                return (
                    <div 
                        key={`${group.start}-${group.entry.id}`} 
                        className={`absolute left-16 sm:left-20 right-0 p-1 transition-all duration-300 ease-in-out group ${isDragging ? 'opacity-50' : ''} ${(group.isExiting ? 'schedule-block-exit' : (group.isNew ? 'schedule-block-enter' : ''))}`}
                        style={{ top, height, pointerEvents: isResizing ? 'none' : 'auto' }}
                        draggable={!group.isExiting}
                        onDragStart={(e) => handleDragStart(e, group, 'move')}
                        onDragEnd={handleDragEnd}
                    >
                       <div className={`relative w-full h-full rounded-lg cursor-grab p-3 flex flex-row gap-4 overflow-hidden ${group.subject?.color} ${group.subject?.textColor}`} onClick={() => !group.isExiting && openModal(HOURS[group.start - 8], `${HOURS[group.start - 8]} - ${HOURS[group.end - 8] || '오전 01:00'}`)}>
                            {/* Left Part: Subject and Time */}
                            <div className="flex-shrink-0 w-24">
                                <p className="font-bold text-sm break-words">{group.subject?.name}</p>
                                <p className="text-xs opacity-80 mt-1">{`${HOURS[group.start - 8]} - ${HOURS[group.end - 8] || '오전 01:00'}`}</p>
                            </div>
                            
                            {/* Right Part: Memo List */}
                            {group.entry.memo && group.entry.memo.length > 0 && (
                                <div className="flex-grow overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                                    <div className="space-y-1 text-xs opacity-90">
                                        {group.entry.memo.map(item => (
                                            <div 
                                                key={item.id} 
                                                className="flex items-start gap-1.5 cursor-pointer p-1 -m-1 rounded hover:bg-black/10 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleMemo(group, item.id);
                                                }}
                                            >
                                                <div className={`w-3 h-3 mt-0.5 flex-shrink-0 rounded-sm flex items-center justify-center ${item.completed ? 'bg-black/20' : 'border border-current'}`}>
                                                    {item.completed && <CheckIcon className="w-2 h-2 text-white"/>}
                                                </div>
                                                <span className={`${item.completed ? 'line-through opacity-70' : ''} break-all`}>{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resize Handle */}
                            <div 
                                draggable={!group.isExiting}
                                onDragStart={(e) => handleDragStart(e, group, 'resize')}
                                onDragEnd={handleDragEnd}
                                className="absolute bottom-0 left-0 w-full h-4 cursor-ns-resize flex justify-center items-end opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ pointerEvents: 'auto' }}
                            >
                                <div className="w-8 h-1 bg-black/30 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                );
            })}
            {HOURS.map((hour, index) => {
              const hour24 = index + 8;
              const isOccupied = occupiedHours.has(hour24);

              const isResizableTarget = resizingGroup && hour24 >= resizingGroup.start;
              const isMovableTarget = draggedGroup && !isOccupied;

              const isDroppable = isResizableTarget || isMovableTarget;
              const isDropTarget = dragOverHour === hour24 && isDroppable;

              return (
                <div key={hour} className="flex items-stretch h-24 border-t border-slate-200 dark:border-slate-700 first:border-t-0">
                  <div className="w-16 sm:w-20 text-right text-xs text-brand-text-secondary py-1 pr-2 sm:pr-4"><span>{hour}</span></div>
                  <div className="flex-1"
                       onDragOver={(e) => {
                           e.preventDefault();
                           if (isDroppable) {
                               setDragOverHour(hour24);
                           }
                       }}
                       onDragLeave={() => setDragOverHour(null)}
                       onDrop={() => { 
                           if(isDroppable) {
                               handleDrop(hour24); 
                           }
                           setDragOverHour(null); 
                       }} >
                    <div onClick={() => !isOccupied && openModal(hour)} 
                        className={`w-full h-full rounded-md transition-colors ${
                            isDropTarget ? 'bg-sky-200 dark:bg-sky-800' : 
                            (!isOccupied ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : '')
                        }`}>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-1 flex flex-col gap-8">
            <Clock />
            <TodoList todos={todos[yyyymmdd] || []} onTodosChange={handleTodosChange} />
            <button onClick={() => setIsSubjectManagerOpen(true)} className="w-full flex items-center justify-center gap-2 bg-brand-surface hover:bg-slate-100 dark:hover:bg-slate-700 text-brand-text-primary font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm border border-slate-200 dark:border-slate-700">
                <PencilIcon className="w-5 h-5"/>과목 관리
            </button>
            <DistractionLogComponent log={distractions[yyyymmdd] || ''} onLogChange={(newLog: string) => setDistractions((prev: DistractionLog) => ({...prev, [yyyymmdd]: newLog}))} />
        </div>
      </div>

      <ScheduleBlockModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} onDelete={handleDelete} subjects={subjects} entry={selectedEntryId ? schedule.find((e: ScheduleEntry) => e.id === selectedEntryId) || {subjectId: '', memo: []} : null} entryTitle={selectedEntryTitle} />
      {isSubjectManagerOpen && <SubjectManager subjects={subjects} setSubjects={setSubjects} onClose={() => setIsSubjectManagerOpen(false)} />}
    </div>
  );
};