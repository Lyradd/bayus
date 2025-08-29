// import React, { useState, useMemo } from 'react';
// import { LayoutDashboard, TrendingUp, GitCompareArrows, BrainCircuit, Search, ChevronsRight, ChevronsLeft, Printer, Upload } from 'lucide-react';
// import CustomScrollbar from './ui/CustomScrollbar';

// const Sidebar = ({ employees, activeView, onViewChange, onReset, isSidebarCollapsed, onToggleCollapse }) => {
//     const [searchTerm, setSearchTerm] = useState('');

//     const filteredEmployees = useMemo(() => {
//         if (!searchTerm) return employees;
//         return employees.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
//     }, [employees, searchTerm]);

//     return (
//         <div className="bg-slate-800 text-slate-200 flex flex-col h-full">
//             <div className={`p-4 border-b border-slate-700 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
//                 <h1 className={`text-2xl font-bold text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>Dasbor SDM</h1>
//                 <button onClick={onToggleCollapse} className="p-1 rounded-lg hover:bg-slate-700">
//                     {isSidebarCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
//                 </button>
//             </div>
//             <nav className="p-4 space-y-2">
//                 <button onClick={() => onViewChange('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''} ${activeView === 'dashboard' ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>
//                     <LayoutDashboard className="w-5 h-5" />
//                     {!isSidebarCollapsed && <span>Dasbor Umum</span>}
//                 </button>
//                 <button onClick={() => onViewChange('analytics')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''} ${activeView === 'analytics' ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>
//                     <TrendingUp className="w-5 h-5" />
//                     {!isSidebarCollapsed && <span>Analisis & Wawasan</span>}
//                 </button>
//                 <button onClick={() => onViewChange('comparison')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''} ${activeView === 'comparison' ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>
//                     <GitCompareArrows className="w-5 h-5" />
//                     {!isSidebarCollapsed && <span>Perbandingan Periode</span>}
//                 </button>
//                 <button onClick={() => onViewChange('prediction')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''} ${activeView === 'prediction' ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>
//                     <BrainCircuit className="w-5 h-5" />
//                     {!isSidebarCollapsed && <span>Model Prediksi</span>}
//                 </button>
//             </nav>
//             <div className={`flex-grow flex flex-col p-4 border-t border-slate-700 overflow-hidden`}>
//                 <h2 className={`text-sm font-semibold text-slate-400 mb-2 whitespace-nowrap ${isSidebarCollapsed ? 'hidden' : ''}`}>DETAIL KARYAWAN</h2>
//                 <div className={`relative mb-4 ${isSidebarCollapsed ? 'hidden' : ''}`}>
//                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//                     <input type="text" placeholder="Cari karyawan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500" />
//                 </div>
//                 <div className="flex-grow overflow-hidden">
//                     <CustomScrollbar>
//                         <ul className={`space-y-1 pr-2 ${isSidebarCollapsed ? 'hidden' : ''}`}>
//                             {filteredEmployees.map(name => (
//                                 <li key={name}>
//                                     <button onClick={() => onViewChange(name)} className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${activeView === name ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>
//                                         <span className="truncate">{name}</span>
//                                         <ChevronsRight className="w-4 h-4" />
//                                     </button>
//                                 </li>
//                             ))}
//                         </ul>
//                     </CustomScrollbar>
//                 </div>
//             </div>
//             <div className="p-4 mt-auto border-t border-slate-700 space-y-2">
//                  <button onClick={() => window.print()} className={`w-full flex items-center gap-2 py-2 px-5 rounded-xl transition-all duration-300 bg-sky-600 hover:bg-sky-700 text-white font-semibold transform hover:scale-105 shadow hover:shadow-lg ${isSidebarCollapsed ? 'justify-center' : 'justify-center'}`}>
//                     <Printer className="w-5 h-5" />
//                     <span className={isSidebarCollapsed ? 'hidden' : ''}>Cetak Laporan</span>
//                 </button>
//                 <button onClick={onReset} className={`w-full flex items-center gap-2 py-2 px-5 rounded-xl transition-all duration-300 bg-red-500 hover:bg-red-600 text-white font-semibold transform hover:scale-105 shadow hover:shadow-lg ${isSidebarCollapsed ? 'justify-center' : 'justify-center'}`}>
//                     <Upload className="w-5 h-5" />
//                     <span className={isSidebarCollapsed ? 'hidden' : ''}>Unggah Baru</span>
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default Sidebar;
