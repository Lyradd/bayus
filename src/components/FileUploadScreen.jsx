// import React, { useState, useCallback } from 'react';
// import { Upload, FileText, RefreshCw } from 'lucide-react';

// export const FileUploadScreen = ({ onFileSelect, isLoading, scriptsLoaded }) => {
//     const [dragOver, setDragOver] = useState(false);
//     const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); const files = e.dataTransfer.files; if (files && files.length > 0) onFileSelect(files[0]); }, [onFileSelect]);
//     const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
//     const handleDragLeave = useCallback((e) => { e.preventDefault(); if (e.currentTarget.contains(e.relatedTarget)) return; setDragOver(false); }, []);
//     const handleFileInputChange = useCallback((e) => { if (e.target.files && e.target.files.length > 0) { onFileSelect(e.target.files[0]); e.target.value = null; } }, [onFileSelect]);

//     return (
//         <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300">
//             <div className="text-center mb-12">
//                 <FileText className="w-16 h-16 mx-auto text-sky-600 dark:text-sky-400 mb-4" />
//                 <h1 className="text-5xl md:text-6xl font-bold text-sky-900 dark:text-white mb-6">Dasbor Analisis</h1>
//                 <h2 className="text-3xl md:text-4xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Absensi Karyawan</h2>
//                 <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">Unggah file CSV Anda untuk mendapatkan wawasan mendalam dan analisis AI tentang pola kehadiran tim Anda.</p>
//             </div>
//             <div className="max-w-2xl w-full mx-auto">
//                 {!scriptsLoaded ? (
//                     <div className="text-center">
//                         <div className="inline-flex items-center px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm">
//                             <RefreshCw className="w-5 h-5 mr-3 animate-spin text-sky-600 dark:text-sky-400" />
//                             <span className="text-gray-600 dark:text-gray-300">Mempersiapkan aplikasi...</span>
//                         </div>
//                     </div>
//                 ) : (
//                     <div
//                         className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group ${dragOver ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 scale-105' : 'border-gray-300 dark:border-gray-600 hover:border-sky-600 dark:hover:border-sky-400 hover:bg-white dark:hover:bg-slate-800'}`}
//                         onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
//                         onClick={() => document.getElementById('file-input')?.click()}
//                     >
//                         <input type="file" id="file-input" className="hidden" accept=".csv" onChange={handleFileInputChange} disabled={!scriptsLoaded} />
//                         <div className="flex flex-col items-center">
//                             <div className={`p-4 rounded-full mb-6 transition-all duration-300 ${dragOver ? 'bg-sky-100 dark:bg-sky-900 scale-110' : 'bg-gray-100 dark:bg-slate-700 group-hover:bg-sky-100 dark:group-hover:bg-sky-900'}`}>
//                                 <Upload className={`w-12 h-12 transition-colors duration-300 ${dragOver ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-sky-600 dark:group-hover:text-sky-400'}`} />
//                             </div>
//                             <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{dragOver ? 'Lepaskan file di sini' : 'Seret & lepas file CSV'}</h3>
//                             <p className="text-gray-500 dark:text-gray-400 mb-6">atau</p>
//                             <button className="bg-sky-700 hover:bg-sky-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">Pilih File</button>
//                             <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Mendukung file CSV maks. 10MB</p>
//                         </div>
//                     </div>
//                 )}
//                 {isLoading && (
//                     <div className="text-center mt-8">
//                         <div className="inline-flex items-center px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm">
//                             <RefreshCw className="w-5 h-5 mr-3 animate-spin text-sky-600 dark:text-sky-400" />
//                             <span className="text-gray-600 dark:text-gray-300">Memproses data...</span>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default FileUploadScreen;
