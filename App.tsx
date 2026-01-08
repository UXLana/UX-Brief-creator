import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BriefState, BriefSection, Comment, User, USERS } from './types';
import { BriefSectionCard } from './components/BriefSectionCard';
import { suggestBriefQuestions } from './services/geminiService';

// Initial Mock Data
const INITIAL_SECTIONS: BriefSection[] = [
  {
    id: 's1',
    title: 'Problem Statement',
    description: 'What user problem are we trying to solve?',
    content: '',
    isLocked: false,
    lastEditedBy: null,
    lastEditedAt: Date.now()
  },
  {
    id: 's2',
    title: 'Target Audience',
    description: 'Who are the primary users for this feature?',
    content: '',
    isLocked: false,
    lastEditedBy: null,
    lastEditedAt: Date.now()
  }
];

const LOCAL_STORAGE_KEY = 'syncbrief_data_v1';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]);
  
  // App State
  const [state, setState] = useState<BriefState>(() => {
    // Attempt to load from localStorage to simulate persistence/sharing
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      title: 'Q3 Mobile App Redesign',
      status: 'draft',
      sections: INITIAL_SECTIONS,
      comments: [],
      updatedAt: Date.now()
    };
  });

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Listen for storage events (Simulate Real-time Sync across tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handlers
  const handleUpdateSection = useCallback((id: string, updates: Partial<BriefSection>) => {
    setState(prev => ({
      ...prev,
      updatedAt: Date.now(),
      sections: prev.sections.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  }, []);

  const handleAddComment = (sectionId: string) => {
    setActiveSectionId(sectionId);
    // Logic to open sidebar or focus input could go here
  };

  const handlePostComment = (text: string) => {
    if (!activeSectionId || !text.trim()) return;
    const newComment: Comment = {
      id: crypto.randomUUID(),
      sectionId: activeSectionId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: text,
      timestamp: Date.now()
    };
    
    setState(prev => ({
      ...prev,
      comments: [...prev.comments, newComment]
    }));
  };

  const handleApprove = () => {
    setState(prev => ({ ...prev, status: 'approved' }));
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleAiSuggestSections = async () => {
    setIsGenerating(true);
    const suggestions = await suggestBriefQuestions();
    
    const newSections: BriefSection[] = suggestions.map((s, i) => ({
      id: `ai-${Date.now()}-${i}`,
      title: s.title,
      description: s.description,
      content: '',
      isLocked: false,
      lastEditedBy: { ...currentUser, name: 'Gemini AI' },
      lastEditedAt: Date.now()
    }));

    setState(prev => ({
      ...prev,
      sections: [...prev.sections, ...newSections]
    }));
    setIsGenerating(false);
  };

  // Derived state
  const isAllLocked = useMemo(() => state.sections.every(s => s.isLocked), [state.sections]);
  const activeComments = useMemo(() => 
    state.comments.filter(c => c.sectionId === activeSectionId).sort((a,b) => b.timestamp - a.timestamp), 
  [state.comments, activeSectionId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] text-slate-800">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {state.title}
              <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium border ${
                state.status === 'approved' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
                {state.status.toUpperCase()}
              </span>
            </h1>
            <p className="text-xs text-gray-500">Last updated {new Date(state.updatedAt).toLocaleTimeString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Simulated Collaborators */}
          <div className="flex items-center -space-x-2">
            {USERS.map(u => (
              <img 
                key={u.id}
                src={u.avatar} 
                alt={u.name} 
                className={`w-8 h-8 rounded-full border-2 border-white cursor-pointer transition-transform hover:scale-110 ${currentUser.id === u.id ? 'ring-2 ring-offset-2 ring-indigo-500 z-10' : 'opacity-70'}`}
                title={`Switch to ${u.name}`}
                onClick={() => setCurrentUser(u)}
              />
            ))}
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 border-2 border-white">
              +2
            </div>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          <button 
            onClick={handleApprove}
            disabled={!isAllLocked || state.status === 'approved'}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm flex items-center gap-2 ${
              state.status === 'approved' 
                ? 'bg-green-600 text-white cursor-default'
                : isAllLocked 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {state.status === 'approved' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Brief Approved
              </>
            ) : (
              <>Lock & Approve</>
            )}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-12 gap-8">
        
        {/* Left: Outline & Tools */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2 space-y-6">
          <div className="sticky top-24">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Brief Outline</h3>
            <nav className="space-y-1">
              {state.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSectionId === section.id 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  } flex justify-between items-center`}
                >
                  <span className="truncate">{section.title}</span>
                  {section.isLocked && <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                </button>
              ))}
            </nav>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
               <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Actions</h3>
               <button 
                onClick={handleAiSuggestSections}
                disabled={isGenerating}
                className="w-full flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
               >
                 {isGenerating ? (
                   <span className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
                 ) : (
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                 )}
                 Add Missing Sections (AI)
               </button>
            </div>
          </div>
        </aside>

        {/* Center: Content */}
        <div className="col-span-12 md:col-span-9 lg:col-span-7 space-y-6">
          {state.sections.map(section => (
            <div key={section.id} id={section.id} onClick={() => setActiveSectionId(section.id)}>
              <BriefSectionCard
                section={section}
                currentUser={currentUser}
                onUpdate={handleUpdateSection}
                onAddComment={handleAddComment}
                isActive={activeSectionId === section.id}
              />
            </div>
          ))}

          {/* New Section Placeholder */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors cursor-pointer group"
               onClick={() => {
                 const id = `new-${Date.now()}`;
                 setState(prev => ({
                   ...prev,
                   sections: [...prev.sections, {
                     id,
                     title: 'New Section',
                     description: 'Describe what this section is for...',
                     content: '',
                     isLocked: false,
                     lastEditedBy: null,
                     lastEditedAt: Date.now()
                   }]
                 }));
               }}
          >
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <p className="text-sm font-medium text-gray-500 group-hover:text-indigo-600">Add Custom Section</p>
          </div>
        </div>

        {/* Right: Activity & Comments */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[calc(100vh-8rem)]">
             <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
               <h3 className="font-semibold text-gray-700">Comments</h3>
               <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                 {activeSectionId ? 'Current Section' : 'Select Section'}
               </span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
               {activeSectionId ? (
                 activeComments.length > 0 ? (
                   activeComments.map(comment => (
                     <div key={comment.id} className="flex gap-3 animate-fadeIn">
                       <img src={comment.userAvatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
                       <div>
                         <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2">
                           <p className="text-xs font-bold text-gray-700 mb-0.5 flex items-center justify-between gap-2">
                              {comment.userName}
                              <span className="font-normal text-gray-400 text-[10px]">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           </p>
                           <p className="text-sm text-gray-700 leading-snug">{comment.text}</p>
                         </div>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-10 text-gray-400">
                     <p>No comments on this section yet.</p>
                     <p className="text-xs mt-2">Tag stakeholders using @name to notify them.</p>
                   </div>
                 )
               ) : (
                 <div className="text-center py-10 text-gray-400">
                   <p>Select a brief section to view or add comments.</p>
                 </div>
               )}
             </div>

             <div className="p-4 border-t border-gray-100">
               <div className="relative">
                 <input 
                   type="text" 
                   disabled={!activeSectionId}
                   placeholder={activeSectionId ? "Write a comment... (use @ to tag)" : "Select a section first"}
                   className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       handlePostComment(e.currentTarget.value);
                       e.currentTarget.value = '';
                     }
                   }}
                 />
                 <button className="absolute right-2 top-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50" disabled={!activeSectionId}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                 </button>
               </div>
             </div>
          </div>
        </aside>
      </main>

      {/* Confetti (Simple CSS implementation) */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex justify-center items-start pt-20">
          <div className="bg-green-500 text-white px-8 py-4 rounded-full shadow-xl animate-bounce">
            🎉 Brief Approved & Locked!
          </div>
        </div>
      )}
    </div>
  );
}