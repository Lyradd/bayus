// import React, { useState, useMemo } from 'react';
// import { motion } from 'framer-motion';
// import { Clock, UserX, UserMinus, Calendar, Award, Sparkles } from 'lucide-react';
// import { getMonthNumber } from '../utils/helpers';
// import KpiCard from '../components/ui/KpiCard';
// import ChartWrapper from '../components/ui/ChartWrapper';
// import AnimatedDropdown from '../components/ui/AnimatedDropdown';

// const EmployeeDetailView = ({ employeeName, allData, onAnalyze, isAiLoading }) => {
//     const [selectedMonth, setSelectedMonth] = useState('semua');

//     const employeeAllRecords = useMemo(() => {
//         return allData.filter(row => row.NAMA === employeeName);
//     }, [allData, employeeName]);

//     const availableMonths = useMemo(() => {
//         const months = new Set(employeeAllRecords.map(item => item.BULAN));
//         return [...months].filter(Boolean).sort((a, b) => getMonthNumber(a) - getMonthNumber(b));
//     }, [employeeAllRecords]);

//     const displayData = useMemo(() => {
//         const recordsToProcess = selectedMonth === 'semua' 
//             ? employeeAllRecords 
//             : employeeAllRecords.filter(row => row.BULAN === selectedMonth);

//         if (recordsToProcess.length === 0) {
//             const baseData = employeeAllRecords[0] || {};
//             return {
//                 NAMA: employeeName,
//                 DIVISI: baseData.DIVISI || 'N/A',
//                 JABATAN: baseData.JABATAN || 'N/A',
//                 TAHUN_MASUK: baseData.TAHUN_MASUK || 0,
//                 LAMA_BEKERJA: baseData.LAMA_BEKERJA || 0,
//                 HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0,
//             };
//         }

//         return recordsToProcess.reduce((acc, row, index) => {
//             if (index === 0) {
//                 acc.NAMA = row.NAMA;
//                 acc.DIVISI = row.DIVISI || 'N/A';
//                 acc.JABATAN = row.JABATAN || 'N/A';
//                 acc.TAHUN_MASUK = row.TAHUN_MASUK || 0;
//                 acc.LAMA_BEKERJA = row.LAMA_BEKERJA || 0;
//             }
//             acc.HARI_KERJA += row.HARI_KERJA;
//             acc.TERLAMBAT += row.TERLAMBAT;
//             acc.SURAT_DOKTER += row.SURAT_DOKTER;
//             acc.IJIN_FULL += row.IJIN_FULL;
//             acc.CUTI += row.CUTI;
//             return acc;
//         }, { HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0 });
//     }, [employeeName, employeeAllRecords, selectedMonth]);

//     const performanceMetrics = useMemo(() => {
//         const score = Math.max(0, Math.round(100 - (displayData.TERLAMBAT * 5) - ((displayData.SURAT_DOKTER + displayData.IJIN_FULL) * 3)));
//         const totalDays = displayData.HARI_KERJA + displayData.SURAT_DOKTER + displayData.IJIN_FULL;
//         const attendanceRate = totalDays > 0 ? (displayData.HARI_KERJA / totalDays) * 100 : 0;
//         const disciplineScore = Math.max(0, 100 - (displayData.TERLAMBAT * 5));
//         const consistencyRate = attendanceRate; // Simplified for now
//         return { score, attendanceRate, disciplineScore, consistencyRate };
//     }, [displayData]);
    
//     const tenureString = useMemo(() => {
//         if (displayData.LAMA_BEKERJA > 0) return `${displayData.LAMA_BEKERJA} tahun`;
//         if (displayData.TAHUN_MASUK > 0) return `${new Date().getFullYear() - displayData.TAHUN_MASUK} tahun`;
//         return 'N/A';
//     }, [displayData]);

//     const summaryHTML = useMemo(() => {
//         if (displayData.HARI_KERJA > 0) {
//             return `Selama periode yang dipilih, ${displayData.NAMA} telah bekerja selama <strong class="text-sky-800 dark:text-sky-400">${displayData.HARI_KERJA}</strong> hari. Karyawan ini tercatat terlambat sebanyak <strong class="text-orange-600 dark:text-orange-400">${displayData.TERLAMBAT}</strong> kali dan mengambil total <strong class="text-red-600 dark:text-red-400">${displayData.SURAT_DOKTER + displayData.IJIN_FULL}</strong> hari absen di luar cuti resmi.`;
//         }
//         return `Tidak ada data kehadiran untuk ${displayData.NAMA} pada periode ${selectedMonth}.`;
//     }, [displayData, selectedMonth]);

//     const performanceChartData = useMemo(() => {
//         const score = performanceMetrics.score;
//         const trackColor = '#e2e8f0'; // slate-200
//         const scoreColor = score > 80 ? '#22c55e' : score > 60 ? '#f59e0b' : '#ef4444'; // green-500, amber-500, red-500
        
//         return {
//             datasets: [{
//                 data: [score, 100 - score],
//                 backgroundColor: [scoreColor, trackColor],
//                 borderColor: ['#ffffff', '#ffffff'],
//                 borderWidth: 4,
//                 circumference: 360,
//             }]
//         };
//     }, [performanceMetrics.score]);

//     const performanceChartOptions = {
//         responsive: true,
//         maintainAspectRatio: false,
//         cutout: '80%',
//         plugins: {
//             legend: { display: false },
//             tooltip: { enabled: false }
//         }
//     };

//     if (!displayData) {
//         return <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Memuat data karyawan...</div>;
//     }

//     return (
//         <motion.div
//             className="space-y-8 printable-content"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//             transition={{ duration: 0.3 }}
//         >
//             <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
//                 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//                     <div>
//                         <h2 className="text-3xl font-bold text-sky-900 dark:text-white">{displayData.NAMA}</h2>
//                         <p className="text-lg text-gray-600 dark:text-gray-400">{displayData.JABATAN} • {displayData.DIVISI} • {tenureString}</p>
//                     </div>
//                      <div className="w-full md:w-56 no-print">
//                         <AnimatedDropdown 
//                             options={availableMonths} 
//                             selectedValue={selectedMonth} 
//                             onValueChange={setSelectedMonth} 
//                             placeholder="Semua Bulan" 
//                             includeAllOption={true} 
//                         />
//                     </div>
//                 </div>
//             </div>
            
//             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
//                 <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
//                     <KpiCard 
//                         icon={<Clock />} 
//                         title="Total Terlambat" 
//                         value={displayData.TERLAMBAT} 
//                         unit="kali" 
//                         colorClass={{ bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-600 dark:text-orange-400' }} 
//                         small 
//                     />
//                     <KpiCard 
//                         icon={<UserX />} 
//                         title="Total Absen Sakit" 
//                         value={displayData.SURAT_DOKTER} 
//                         unit="hari" 
//                         colorClass={{ bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-400' }} 
//                         small 
//                     />
//                     <KpiCard 
//                         icon={<UserMinus />} 
//                         title="Total Absen Izin" 
//                         value={displayData.IJIN_FULL} 
//                         unit="hari" 
//                         colorClass={{ bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-600 dark:text-yellow-400' }} 
//                         small 
//                     />
//                     <KpiCard 
//                         icon={<Calendar />} 
//                         title="Total Cuti" 
//                         value={displayData.CUTI} 
//                         unit="hari" 
//                         colorClass={{ bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400' }} 
//                         small 
//                     />
//                 </div>
//                 <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
//                     <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Performance Overview</h3>
//                     <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
//                         <div className="relative h-32 w-32 flex-shrink-0">
//                             <ChartWrapper 
//                                 chartId="performance-doughnut" 
//                                 type="doughnut" 
//                                 data={performanceChartData} 
//                                 options={performanceChartOptions} 
//                                 fallbackText={{ icon: <Award />, text: "N/A" }} 
//                             />
//                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                                 <span className="text-4xl font-bold text-slate-800 dark:text-slate-200">{performanceMetrics.score}</span>
//                             </div>
//                         </div>
//                         <div className="w-full sm:w-auto flex-grow space-y-3">
//                             <div className="flex justify-between items-baseline">
//                                 <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kehadiran</span>
//                                 <span className="font-bold text-gray-800 dark:text-gray-200">{performanceMetrics.attendanceRate.toFixed(1)}%</span>
//                             </div>
//                              <div className="flex justify-between items-baseline">
//                                 <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kedisiplinan</span>
//                                 <span className="font-bold text-gray-800 dark:text-gray-200">{performanceMetrics.disciplineScore.toFixed(1)}%</span>
//                             </div>
//                              <div className="flex justify-between items-baseline">
//                                 <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Konsistensi</span>
//                                 <span className="font-bold text-gray-800 dark:text-gray-200">{performanceMetrics.consistencyRate.toFixed(1)}%</span>
//                             </div>
//                         </div>
//                     </div>
//                      <button 
//                         onClick={() => onAnalyze(displayData)} 
//                         disabled={isAiLoading} 
//                         className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg no-print"
//                     >
//                         <Sparkles className="w-5 h-5" />
//                         {isAiLoading ? 'Menganalisis...' : 'Analisis AI'}
//                     </button>
//                 </div>
//             </div>

//             <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
//                 <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Ringkasan Kehadiran ({selectedMonth === 'semua' ? 'Total' : selectedMonth})</h3>
//                 <div className="text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: summaryHTML }} />
//             </div>
//         </motion.div>
//     );
// };

// export default EmployeeDetailView;
