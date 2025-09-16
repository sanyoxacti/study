import React, { useState, useEffect, useRef } from 'react';
import type { MemoItem } from '../types.ts';
import { TrashIcon, PlusIcon } from './Icons.tsx';

interface TodoListProps {
  todos: MemoItem[];
  onTodosChange: (newTodos: MemoItem[]) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ todos, onTodosChange }) => {
  const [newTodoText, setNewTodoText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    if (listRef.current) {
        const textareas = listRef.current.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        });
    }
  }, [todos]);

  const handleAddTodo = () => {
    if (newTodoText.trim() === '') return;
    const newTodo: MemoItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
    };
    onTodosChange([...todos, newTodo]);
    setNewTodoText('');
  };
  
  const handleTodoTextChange = (id: string, text: string) => {
    onTodosChange(todos.map(todo => todo.id === id ? { ...todo, text } : todo));
  };
  
  const handleTodoToggle = (id: string) => {
    onTodosChange(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
  };
  
  const handleDeleteTodo = (id: string) => {
    onTodosChange(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="bg-brand-surface p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-brand-text-primary">오늘의 목표</h3>
      <div ref={listRef} className="space-y-2 max-h-60 overflow-y-auto pr-2 mb-3">
        {todos.map((item) => (
          <div key={item.id} className="flex items-start gap-2 group">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => handleTodoToggle(item.id)}
              className="w-5 h-5 rounded text-brand-primary bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500 focus:ring-brand-primary focus:ring-2 flex-shrink-0 mt-1"
            />
            <textarea
              rows={1}
              value={item.text}
              onChange={(e) => handleTodoTextChange(item.id, e.target.value)}
              onInput={handleTextareaInput}
              className={`flex-grow bg-transparent text-sm p-1 rounded-md focus:outline-none focus:bg-white dark:focus:bg-slate-800 ${item.completed ? 'line-through text-brand-text-secondary' : 'text-brand-text-primary'} resize-none overflow-hidden`}
              placeholder="목표..."
            />
            <button onClick={() => handleDeleteTodo(item.id)} className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1">
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-slate-200 dark:border-slate-700 pt-3">
        <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            placeholder="새 목표 추가..."
            className="flex-grow bg-slate-100 dark:bg-slate-700 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <button onClick={handleAddTodo} className="p-2 bg-brand-primary text-white rounded-md hover:bg-opacity-90 transition-colors flex-shrink-0">
            <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};