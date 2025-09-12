import React, { useState, useEffect, useCallback } from 'react';
import type { Subject } from '../types.ts';
import { AVAILABLE_COLORS } from '../constants.ts';
import { TrashIcon, PlusIcon } from './Icons.tsx';
import { GoogleGenAI, Type } from "@google/genai";

interface SubjectManagerProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  onClose: () => void;
}

const useDebounce = (value: string, delay: number): string => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


export const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects, setSubjects, onClose }) => {
  const [newSubjectName, setNewSubjectName] = useState('');

  const getFirstAvailableColor = useCallback(() => {
    const usedColors = subjects.map(s => s.color);
    return AVAILABLE_COLORS.find(c => !usedColors.includes(c.color)) || AVAILABLE_COLORS[0];
  }, [subjects]);

  const [selectedColor, setSelectedColor] = useState(getFirstAvailableColor());
  const [isSuggestingColor, setIsSuggestingColor] = useState(false);
  const debouncedSubjectName = useDebounce(newSubjectName, 500);

  const getSuggestedColor = useCallback(async (subjectName: string) => {
    if (!subjectName) return;
    setIsSuggestingColor(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const usedColors = subjects.map(s => s.color);
      const availableColorOptions = AVAILABLE_COLORS.filter(c => !usedColors.includes(c.color));
      
      const colorEnumForApi = (availableColorOptions.length > 0 ? availableColorOptions : AVAILABLE_COLORS).map(c => c.color);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Study subject: "${subjectName}". Based on this subject, recommend the most suitable color class from the list of choices.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              colorClass: {
                type: Type.STRING,
                description: "The recommended color class from the provided list.",
                enum: colorEnumForApi,
              },
            },
            required: ["colorClass"],
          },
        },
      });

      const jsonStr = response.text.trim();
      const result = JSON.parse(jsonStr);

      if (result.colorClass) {
        const suggestedColor = AVAILABLE_COLORS.find(c => c.color === result.colorClass);
        if (suggestedColor) {
          setSelectedColor(suggestedColor);
        }
      }
    } catch (error) {
      console.error("Error fetching color suggestion:", error);
    } finally {
      setIsSuggestingColor(false);
    }
  }, [subjects]);

  useEffect(() => {
    if (debouncedSubjectName.trim()) {
      getSuggestedColor(debouncedSubjectName.trim());
    }
  }, [debouncedSubjectName, getSuggestedColor]);

  useEffect(() => {
    const usedColors = subjects.map(s => s.color);
    if (usedColors.includes(selectedColor.color)) {
        setSelectedColor(getFirstAvailableColor());
    }
  }, [subjects, selectedColor, getFirstAvailableColor]);

  const handleAddSubject = () => {
    if (newSubjectName.trim() === '') return;
    const newSubject: Subject = {
      id: Date.now().toString(),
      name: newSubjectName.trim(),
      color: selectedColor.color,
      textColor: selectedColor.textColor,
    };
    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    setNewSubjectName('');

    const usedColorsAfterAdd = updatedSubjects.map(s => s.color);
    const firstAvailable = AVAILABLE_COLORS.find(c => !usedColorsAfterAdd.includes(c.color));
    setSelectedColor(firstAvailable || AVAILABLE_COLORS[0]);
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };
  
  const handleUpdateSubjectName = (id: string, name: string) => {
    setSubjects(subjects.map(s => s.id === id ? {...s, name} : s));
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-md text-brand-text-primary">
        <h2 className="text-2xl font-bold mb-6 text-center">과목 관리</h2>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {subjects.map((subject) => (
            <div key={subject.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
              <div className={`w-8 h-8 rounded-full ${subject.color}`}></div>
              <input 
                type="text" 
                value={subject.name}
                onChange={(e) => handleUpdateSubjectName(subject.id, e.target.value)}
                className="flex-grow bg-transparent border-b-2 border-slate-300 dark:border-slate-600 focus:border-brand-primary focus:outline-none p-1"
              />
              <button onClick={() => handleDeleteSubject(subject.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                <TrashIcon className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold mb-3">새 과목 추가</h3>
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="과목 이름"
                    className="flex-grow bg-slate-100 dark:bg-slate-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <button onClick={handleAddSubject} className="bg-brand-primary hover:bg-slate-700 dark:bg-slate-300 dark:hover:bg-slate-400 text-white dark:text-slate-900 font-bold p-2 rounded-md flex items-center justify-center gap-2 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    추가
                </button>
            </div>
            <div className="mt-4">
                <p className="mb-2 text-sm text-slate-500">색상:</p>
                <div className={`flex flex-wrap gap-2 ${isSuggestingColor ? 'animate-pulse' : ''}`}>
                    {AVAILABLE_COLORS.map(c => (
                        <button key={c.color} onClick={() => setSelectedColor(c)} className={`w-8 h-8 rounded-full ${c.color} transition-transform transform hover:scale-110 ${selectedColor.color === c.color ? 'ring-2 ring-offset-2 ring-offset-brand-surface ring-brand-primary' : ''}`}></button>
                    ))}
                </div>
            </div>
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