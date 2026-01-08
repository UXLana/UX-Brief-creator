import React, { useState, useCallback } from 'react';
import { BriefSection, User } from '../types';
import { refineText } from '../services/geminiService';

interface Props {
  section: BriefSection;
  currentUser: User;
  onUpdate: (id: string, updates: Partial<BriefSection>) => void;
  onAddComment: (sectionId: string) => void;
  isActive: boolean;
}

export const BriefSectionCard: React.FC<Props> = ({ 
  section, 
  currentUser, 
  onUpdate,
  onAddComment,
  isActive
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(section.id, {
      content: e.target.value,
      lastEditedBy: currentUser,
      lastEditedAt: Date.now()
    });
  };

  const handleAiRefine = async () => {
    if (!section.content.trim()) return;
    setIsAiLoading(true);
    const newContent = await refineText(section.content, section.title);
    onUpdate(section.id, {
      content: newContent,
      lastEditedBy: { ...currentUser, name: `${currentUser.name} (via AI)` },
      lastEditedAt: Date.now()
    });
    setIsAiLoading(false);
  };

  const toggleLock = () => {
    onUpdate(section.id, { isLocked: !section.isLocked });
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-gray-300'}`}>
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
        <div className="flex-1">
          {isEditingTitle ? (
            <input
              type="text"
              className="w-full text-lg font-semibold text-gray-900 bg-transparent border-b-2 border-indigo-500 focus:outline-none"
              value={section.title}
              onChange={(e) => onUpdate(section.id, { title: e.target.value })}
              onBlur={() => setIsEditingTitle(false)}
              autoFocus
            />
          ) : (
            <h3 
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 flex items-center gap-2"
              onClick={() => !section.isLocked && setIsEditingTitle(true)}
              title="Click to edit question"
            >
              {section.title}
              {!section.isLocked && <span className="text-xs font-normal text-gray-400 opacity-0 group-hover:opacity-100">(Edit)</span>}
            </h3>
          )}
          <p className="text-sm text-gray-500 mt-1">{section.description}</p>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
           {section.isLocked ? (
             <button onClick={toggleLock} className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 hover:bg-amber-100">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               Locked
             </button>
           ) : (
             <button onClick={toggleLock} className="text-gray-400 hover:text-gray-600 p-1" title="Lock Section">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
             </button>
           )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 relative">
        <textarea
          disabled={section.isLocked || isAiLoading}
          value={section.content}
          onChange={handleContentChange}
          placeholder="Enter details here..."
          className={`w-full min-h-[120px] resize-y bg-transparent focus:outline-none text-gray-700 leading-relaxed disabled:opacity-70 disabled:cursor-not-allowed ${section.isLocked ? 'bg-gray-50' : ''}`}
        />
        
        {/* Actions Bar */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {!section.isLocked && (
              <button 
                onClick={handleAiRefine}
                disabled={isAiLoading || !section.content}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                {isAiLoading ? (
                  <span className="animate-spin h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )}
                AI Polish
              </button>
            )}
            <button 
              onClick={() => onAddComment(section.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
              Comment
            </button>
          </div>

          {section.lastEditedBy && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Updated {new Date(section.lastEditedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                <img src={section.lastEditedBy.avatar} alt="User" className="w-4 h-4 rounded-full" />
                <span className="font-medium text-gray-600">{section.lastEditedBy.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};