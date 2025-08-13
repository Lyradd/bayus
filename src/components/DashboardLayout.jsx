// import React, { useState, useMemo } from 'react';
// import { AnimatePresence } from 'framer-motion';
// import Sidebar from './Sidebar';
// import { CustomScrollbar } from './ui/CustomScrollbar';
// import { useAttendanceData } from '../hooks/useAttendanceData';
// import OverallDashboard from '../pages/OverallDashboard';
// import AnalyticsPage from '../pages/AnalyticPage';
// import ComparisonPage from '../pages/ComparisonPage';
// import PredictionPage from '../pages/PredictionPage';
// import EmployeeDetailView from '../pages/EmployeeDetailView';
// import { OverallDashboardSkeleton } from './ui/Skeletons';

// const DashboardLayout = ({ 
//     data, 
//     onReset, 
//     onAnalyzeIndividual, 
//     onAnalyzeOverall, 
//     isAiLoading, 
//     onAnalyzeComparison, 
//     isLoading,
//     activeView,
//     onViewChange,
//     selectedEmployee,
//     onEmployeeSelect,
//     isSidebarCollapsed,
//     onToggleSidebar
// }) => {
//     const { availableEmployees, availableMonths, availableDivisions } = useAttendanceData(data);

//     const selectedEmployeeData = useMemo(() => {
//         if (selectedEmployee && !['dashboard', 'analytics', 'comparison', 'prediction'].includes(selectedEmployee)) {
//             return selectedEmployee;
//         }
//         return null;
//     }, [selectedEmployee]);

//     if (isLoading) {
//         return (
//             <div className="flex h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
//                 <aside className={`flex-shrink-0 no-print transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
//                     <Sidebar
//                         employees={[]}
//                         activeView={activeView}
//                         onViewChange={onViewChange}
//                         onReset={onReset}
//                         isSidebarCollapsed={isSidebarCollapsed}
//                         onToggleCollapse={onToggleSidebar}
//                     />
//                 </aside>
//                 <main className="flex-1 p-8 overflow-y-auto">
//                     <OverallDashboardSkeleton />
//                 </main>
//             </div>
//         );
//     }

//     return (
//         <div className="flex h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
//             <aside className={`flex-shrink-0 no-print transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
//                 <Sidebar
//                     employees={availableEmployees}
//                     activeView={activeView}
//                     onViewChange={onViewChange}
//                     onReset={onReset}
//                     isSidebarCollapsed={isSidebarCollapsed}
//                     onToggleCollapse={onToggleSidebar}
//                     selectedEmployee={selectedEmployee}
//                     onEmployeeSelect={onEmployeeSelect}
//                 />
//             </aside>
//             <main className="flex-1 overflow-hidden">
//                 <CustomScrollbar>
//                     <div className="p-8 print-main">
//                         <AnimatePresence mode="wait">
//                             {activeView === 'dashboard' && (
//                                 <OverallDashboard 
//                                     key="dashboard" 
//                                     data={data} 
//                                     onAnalyzeIndividual={onAnalyzeIndividual} 
//                                     onAnalyzeOverall={onAnalyzeOverall} 
//                                     isAiLoading={isAiLoading} 
//                                 />
//                             )}
//                             {activeView === 'analytics' && (
//                                 <AnalyticsPage 
//                                     key="analytics" 
//                                     data={data} 
//                                 />
//                             )}
//                             {activeView === 'comparison' && (
//                                 <ComparisonPage 
//                                     key="comparison" 
//                                     data={data} 
//                                     availableMonths={availableMonths} 
//                                     onAnalyze={onAnalyzeComparison} 
//                                     isAiLoading={isAiLoading} 
//                                 />
//                             )}
//                             {activeView === 'prediction' && (
//                                 <PredictionPage 
//                                     key="prediction" 
//                                     data={data} 
//                                     availableEmployees={availableEmployees} 
//                                 />
//                             )}
//                             {selectedEmployeeData && (
//                                 <EmployeeDetailView 
//                                     key={selectedEmployeeData} 
//                                     employeeName={selectedEmployeeData}
//                                     allData={data}
//                                     onAnalyze={onAnalyzeIndividual} 
//                                     isAiLoading={isAiLoading} 
//                                 />
//                             )}
//                         </AnimatePresence>
//                     </div>
//                 </CustomScrollbar>
//             </main>
//         </div>
//     );
// };

// export default DashboardLayout;
