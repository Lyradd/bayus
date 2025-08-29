// import React from 'react';
// import { X, Sparkles } from 'lucide-react';
// import { CustomScrollbar } from './CustomScrollbar';

// const AiAnalysisModal = ({ show, title, content, isLoading, onClose }) => {
//     if (!show) return null;
    
//     return (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//             <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-colors duration-300">
//                 <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
//                     <h3 className="text-xl font-semibold text-sky-900 dark:text-sky-300 flex items-center gap-3">
//                         <Sparkles className="text-orange-500" />
//                 1            {title}
//                     </h3>
//                     <button 
//                         onClick={onClose} 
//                         className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
//                     >
//                         <X className="w-5 h-5" />
//                     </button>
//                 </div>
//                 <div className="p-6 flex-1 overflow-hidden">
//                     <CustomScrollbar>
//                         {isLoading ? (
//                             <div className="space-y-4">
//                                 <div className="animate-pulse">
//                                     <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
//                                     <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2"></div>
//                                     <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6 mb-2"></div>
//                                     <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2"></div>
//                                     <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/6"></div>
//                                 </div>
//                                 <div className="animate-pulse">
//                                     <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
//                                     <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2"></div>
//                                     <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
//                                     <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
//                                 </div>
//                             </div>
//                         ) : (
//                             <div 
//                                 className="prose prose-sm md:prose-base max-w-none text-gray-700 dark:text-gray-300 dark:prose-invert" 
//                                 dangerouslySetInnerHTML={{ 
//                                     __html: content
//                                         .replace(/### \*\*(.*?)\*\*/g, `<h3 class="text-lg font-semibold text-sky-800 dark:text-sky-400 mt-4 mb-2">$1</h3>`)
//                                         .replace(/\*\*(.*?)\*\*/g, `<strong class="text-gray-900 dark:text-white">$1</strong>`)
//                                         .replace(/\n/g, `<br />`) 
//                                 }}
//                             />
//                         )}
//                     </CustomScrollbar>
//                 </div>
//                 <div className="flex justify-end p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
//                     <button 
//                         onClick={onClose} 
//                         className="bg-sky-700 hover:bg-sky-800 text-white font-medium py-2 px-6 rounded-lg"
//                     >
//                         Tutup
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default AiAnalysisModal;
