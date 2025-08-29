// import React, { useState, useMemo, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Users, Clock, UserX, Calendar, UserCheck, Briefcase, Sparkles, Download, Zap } from 'lucide-react';
// import { useAttendanceData } from '../hooks/useAttendanceData';
// import { exportService } from '../services/apiService';
// import KpiCard from '../components/ui/KpiCard';
// import ChartWrapper from '../components/ui/ChartWrapper';
// import AnimatedDropdown from '../components/ui/AnimatedDropdown';

// const OverallDashboard = ({ data, onAnalyzeIndividual, onAnalyzeOverall, isAiLoading }) => {
//     const [selectedMonth, setSelectedMonth] = useState('semua');
//     const [selectedEmployee, setSelectedEmployee] = useState('semua');
//     const [selectedDivision, setSelectedDivision] = useState('semua');
//     const [expandedDivision, setExpandedDivision] = useState(null);
//     const { availableMonths, availableEmployees, availableDivisions } = useAttendanceData(data);

//     const filteredAvailableEmployees = useMemo(() => {
//         if (selectedDivision === 'semua') return availableEmployees;
//         const employeesInDivision = data.filter(item => item.DIVISI === selectedDivision).map(item => item.NAMA);
//         return [...new Set(employeesInDivision)].sort();
//     }, [data, selectedDivision, availableEmployees]);

//     useEffect(() => {
//         if (selectedEmployee !== 'semua' && !filteredAvailableEmployees.includes(selectedEmployee)) {
//             setSelectedEmployee('semua');
//         }
//     }, [selectedDivision, selectedEmployee, filteredAvailableEmployees]);

//     const { kpis, topTardiness, absenceDistribution, tableData, divisionalAnalysis, deepInsights } = useMemo(() => {
//         let filtered = data;
//         if (selectedMonth !== 'semua') filtered = filtered.filter(item => item.BULAN === selectedMonth);
//         if (selectedEmployee !== 'semua') filtered = filtered.filter(item => item.NAMA === selectedEmployee);
//         if (selectedDivision !== 'semua') filtered = filtered.filter(item => item.DIVISI === selectedDivision);

//         const aggregated = Array.from(filtered.reduce((map, row) => {
//             const name = row.NAMA;
//             if (!name) return map;
//             if (!map.has(name)) {
//                 map.set(name, { NAMA: name, DIVISI: row.DIVISI || 'N/A', JABATAN: row.JABATAN || 'N/A', TAHUN_MASUK: row.TAHUN_MASUK || 0, LAMA_BEKERJA: row.LAMA_BEKERJA || 0, HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0 });
//             }
//             const stats = map.get(name);
//             stats.HARI_KERJA += row.HARI_KERJA;
//             stats.TERLAMBAT += row.TERLAMBAT;
//             stats.SURAT_DOKTER += row.SURAT_DOKTER;
//             stats.IJIN_FULL += row.IJIN_FULL;
//             stats.CUTI += row.CUTI;
//             return map;
//         }, new Map()).values());

//         const kpisData = {
//             totalEmployees: new Set(filtered.map(item => item.NAMA)).size,
//             totalTardiness: filtered.reduce((sum, item) => sum + item.TERLAMBAT, 0),
//             totalAbsence: filtered.reduce((sum, item) => sum + item.SURAT_DOKTER + item.IJIN_FULL, 0),
//             totalWorkDays: filtered.reduce((sum, item) => sum + item.HARI_KERJA, 0)
//         };

//         const topTardinessData = [...aggregated].sort((a, b) => b.TERLAMBAT - a.TERLAMBAT).slice(0, 10);
//         const absenceDistributionData = { sakit: filtered.reduce((sum, item) => sum + item.SURAT_DOKTER, 0), izin: filtered.reduce((sum, item) => sum + item.IJIN_FULL, 0), cuti: filtered.reduce((sum, item) => sum + item.CUTI, 0) };
//         const tableData = [...aggregated].sort((a, b) => a.NAMA.localeCompare(b.NAMA));
        
//         const divisionalAnalysisData = Object.values(aggregated.reduce((acc, emp) => {
//             const div = emp.DIVISI || 'N/A';
//             if (!acc[div]) acc[div] = { name: div, employeeCount: 0, totalTardiness: 0, totalLeave: 0, totalAbsence: 0 };
//             acc[div].employeeCount++;
//             acc[div].totalTardiness += emp.TERLAMBAT;
//             acc[div].totalAbsence += emp.SURAT_DOKTER + emp.IJIN_FULL;
//             acc[div].totalLeave += emp.CUTI;
//             return acc;
//         }, {})).sort((a, b) => a.name.localeCompare(b.name));

//         const deepInsightsData = (() => {
//             if (aggregated.length === 0) return null;
//             const tenureGroups = { new: { totalTardiness: 0, count: 0 }, mid: { totalTardiness: 0, count: 0 }, senior: { totalTardiness: 0, count: 0 } };
//             aggregated.forEach(emp => {
//                 const tenure = emp.LAMA_BEKERJA > 0 ? emp.LAMA_BEKERJA : (emp.TAHUN_MASUK > 0 ? new Date().getFullYear() - emp.TAHUN_MASUK : 0);
//                 if (tenure < 2) { tenureGroups.new.totalTardiness += emp.TERLAMBAT; tenureGroups.new.count++; }
//                 else if (tenure <= 5) { tenureGroups.mid.totalTardiness += emp.TERLAMBAT; tenureGroups.mid.count++; }
//                 else { tenureGroups.senior.totalTardiness += emp.TERLAMBAT; tenureGroups.senior.count++; }
//             });
//             const avgNew = tenureGroups.new.count > 0 ? (tenureGroups.new.totalTardiness / tenureGroups.new.count) : 0;
//             const avgMid = tenureGroups.mid.count > 0 ? (tenureGroups.mid.totalTardiness / tenureGroups.mid.count) : 0;
//             const avgSenior = tenureGroups.senior.count > 0 ? (tenureGroups.senior.totalTardiness / tenureGroups.senior.count) : 0;
//             let tenureTardinessMessage = `Rata-rata keterlambatan: Karyawan baru (${avgNew.toFixed(1)}x), Mid-level (${avgMid.toFixed(1)}x), Senior (${avgSenior.toFixed(1)}x).`;
//             if (avgNew > avgMid && avgNew > avgSenior) { tenureTardinessMessage += " Karyawan baru cenderung lebih sering terlambat."; }
//             else if (avgSenior > avgMid && avgSenior > avgNew) { tenureTardinessMessage += " Karyawan senior cenderung lebih sering terlambat."; }
//             else { tenureTardinessMessage += " Tidak ada korelasi jelas antara lama kerja dan keterlambatan."; }
//             const divPerf = divisionalAnalysisData.map(div => ({ ...div, avgTardiness: div.employeeCount > 0 ? div.totalTardiness / div.employeeCount : 0 })).sort((a, b) => a.avgTardiness - b.avgTardiness);
//             const bestDivision = divPerf.length > 0 ? divPerf[0] : null;
//             const worstDivision = divPerf.length > 1 ? divPerf[divPerf.length - 1] : null;
//             const sortedByDiscipline = [...aggregated].sort((a, b) => (a.TERLAMBAT + a.IJIN_FULL) - (b.TERLAMBAT + b.IJIN_FULL));
//             const bestEmployee = sortedByDiscipline.length > 0 ? sortedByDiscipline[0] : null;
//             return { tenureTardiness: tenureTardinessMessage, bestDivision, worstDivision, bestEmployee };
//         })();

//         return { kpis: kpisData, topTardiness: topTardinessData, absenceDistribution: absenceDistributionData, tableData, divisionalAnalysis: divisionalAnalysisData, deepInsights: deepInsightsData };
//     }, [data, selectedMonth, selectedEmployee, selectedDivision]);

//     const tardinessChartData = { 
//         labels: topTardiness.map(item => item.NAMA.length > 15 ? item.NAMA.substring(0, 15) + '...' : item.NAMA), 
//         datasets: [{ 
//             label: 'Jumlah Keterlambatan', 
//             data: topTardiness.map(item => item.TERLAMBAT), 
//             backgroundColor: 'rgba(3, 105, 161, 0.8)', 
//             borderColor: 'rgba(3, 105, 161, 1)', 
//             borderWidth: 1, 
//             borderRadius: 6 
//         }] 
//     };
//     const totalAbsence = Object.values(absenceDistribution).reduce((a, b) => a + b, 0);
//     const absenceChartData = { 
//         labels: ['Sakit (Surat Dokter)', 'Izin', 'Cuti'], 
//         datasets: [{ 
//             label: 'Jumlah Hari', 
//             data: [absenceDistribution.sakit, absenceDistribution.izin, absenceDistribution.cuti], 
//             backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(249, 115, 22, 0.8)', 'rgba(59, 130, 246, 0.8)'], 
//             borderColor: ['#ffffff', '#ffffff', '#ffffff'], 
//             borderWidth: 4 
//         }] 
//     };

//     const tardinessChartOptions = { 
//         responsive: true, 
//         maintainAspectRatio: false, 
//         indexAxis: 'y', 
//         scales: { 
//             x: { beginAtZero: true }, 
//             y: { grid: { display: false } } 
//         }, 
//         plugins: { 
//             legend: { display: false }, 
//             tooltip: { 
//                 callbacks: { 
//                     title: (ctx) => topTardiness[ctx[0].dataIndex]?.NAMA || '' 
//                 } 
//             } 
//         } 
//     };
//     const absenceChartOptions = { 
//         responsive: true, 
//         maintainAspectRatio: false, 
//         cutout: '70%', 
//         plugins: { 
//             legend: { position: 'bottom', padding: 20 }, 
//             tooltip: { 
//                 callbacks: { 
//                     label: (ctx) => `${ctx.label}: ${ctx.formattedValue} hari (${(totalAbsence > 0 ? ((ctx.parsed * 100) / totalAbsence).toFixed(1) : 0)}%)` 
//                 } 
//             } 
//         } 
//     };

//     const handleOverallAnalysisClick = () => {
//         onAnalyzeOverall({ kpis, chartData: { topTardiness, absenceDistribution }, selectedMonth, selectedEmployee });
//     };

//     const handleDivisionClick = (divisionName) => {
//         setExpandedDivision(prev => (prev === divisionName ? null : divisionName));
//     };

//     const handleExport = () => {
//         exportService.exportToCsv(tableData, `rekap_absensi_${selectedMonth}.csv`);
//     };

//     const containerVariants = {
//         hidden: { opacity: 0 },
//         visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
//     };

//     const itemVariants = {
//         hidden: { y: 20, opacity: 0 },
//         visible: { y: 0, opacity: 1 }
//     };

//     return (
//         <motion.div
//             className="space-y-8"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//             transition={{ duration: 0.3 }}
//         >
//             <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm no-print transition-colors duration-300">
//                 <div className="flex flex-col lg:flex-row flex-wrap gap-6 items-center">
//                     {/* Filters */}
//                     <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
//                         <div className="flex items-center gap-2 min-w-0">
//                             <Calendar className="w-6 h-6 text-sky-700 dark:text-sky-400 flex-shrink-0" />
//                             <div className="flex-1 min-w-0">
//                                 <AnimatedDropdown 
//                                     options={availableMonths} 
//                                     selectedValue={selectedMonth} 
//                                     onValueChange={setSelectedMonth} 
//                                     placeholder="Semua Bulan" 
//                                     includeAllOption={true} 
//                                 />
//                             </div>
//                         </div>
//                         <div className="flex items-center gap-2 min-w-0">
//                             <Briefcase className="w-6 h-6 text-sky-700 dark:text-sky-400 flex-shrink-0" />
//                             <div className="flex-1 min-w-0">
//                                 <AnimatedDropdown 
//                                     options={availableDivisions} 
//                                     selectedValue={selectedDivision} 
//                                     onValueChange={setSelectedDivision} 
//                                     placeholder="Semua Divisi" 
//                                     includeAllOption={true} 
//                                 />
//                             </div>
//                         </div>
//                         <div className="flex items-center gap-2 min-w-0">
//                             <UserCheck className="w-6 h-6 text-sky-700 dark:text-sky-400 flex-shrink-0" />
//                             <div className="flex-1 min-w-0">
//                                 <AnimatedDropdown 
//                                     options={filteredAvailableEmployees} 
//                                     selectedValue={selectedEmployee} 
//                                     onValueChange={setSelectedEmployee} 
//                                     placeholder="Semua Karyawan" 
//                                     includeAllOption={true} 
//                                 />
//                             </div>
//                         </div>
//                     </div>
//                     {/* Buttons */}
//                     <div className="flex-shrink-0 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
//                         <button 
//                             onClick={handleOverallAnalysisClick} 
//                             disabled={isAiLoading} 
//                             className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg"
//                         >
//                             <Sparkles className="w-5 h-5" />
//                             {isAiLoading ? 'Menganalisis...' : 'Analisis Umum'}
//                         </button>
//                         <button 
//                             onClick={handleExport} 
//                             className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 shadow hover:shadow-lg"
//                         >
//                             <Download size={16} /> Ekspor Data
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" animate="visible">
//                 <motion.div variants={itemVariants}>
//                     <KpiCard 
//                         icon={<Users />} 
//                         title="Total Karyawan" 
//                         value={kpis.totalEmployees} 
//                         colorClass={{ bg: 'bg-sky-100 dark:bg-sky-900/50', text: 'text-sky-700 dark:text-sky-400' }} 
//                     />
//                 </motion.div>
//                 <motion.div variants={itemVariants}>
//                     <KpiCard 
//                         icon={<Clock />} 
//                         title="Total Keterlambatan" 
//                         value={kpis.totalTardiness} 
//                         unit="kali" 
//                         colorClass={{ bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-600 dark:text-orange-400' }} 
//                     />
//                 </motion.div>
//                 <motion.div variants={itemVariants}>
//                     <KpiCard 
//                         icon={<UserX />} 
//                         title="Total Absensi" 
//                         value={kpis.totalAbsence} 
//                         unit="hari" 
//                         colorClass={{ bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-400' }} 
//                     />
//                 </motion.div>
//                 <motion.div variants={itemVariants}>
//                     <KpiCard 
//                         icon={<Calendar />} 
//                         title="Total Hari Kerja" 
//                         value={kpis.totalWorkDays} 
//                         colorClass={{ bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400' }} 
//                     />
//                 </motion.div>
//             </motion.div>

//             {/* Deep Insights Section */}
//             {deepInsights && (
//                 <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
//                     <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300 flex items-center gap-2">
//                         <Zap className="text-yellow-500" /> Wawasan Mendalam
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
//                         <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
//                             <p className="font-semibold text-slate-700 dark:text-slate-200">Korelasi Lama Bekerja & Keterlambatan</p>
//                             <p className="text-sm text-slate-600 dark:text-slate-400">{deepInsights.tenureTardiness}</p>
//                         </div>
//                         <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
//                             <p className="font-semibold text-slate-700 dark:text-slate-200">Divisi Paling Disiplin</p>
//                             <p className="text-sm text-slate-600 dark:text-slate-400">
//                                 {deepInsights.bestDivision ? `${deepInsights.bestDivision.name} (Rata-rata telat: ${deepInsights.bestDivision.avgTardiness.toFixed(1)}x)` : 'N/A'}
//                             </p>
//                         </div>
//                         <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
//                             <p className="font-semibold text-slate-700 dark:text-slate-200">Karyawan Paling Disiplin</p>
//                             <p className="text-sm text-slate-600 dark:text-slate-400">
//                                 {deepInsights.bestEmployee ? `${deepInsights.bestEmployee.NAMA} (Telat: ${deepInsights.bestEmployee.TERLAMBAT}x)` : 'N/A'}
//                             </p>
//                         </div>
//                         <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
//                             <p className="font-semibold text-slate-700 dark:text-slate-200">Divisi Perlu Perhatian</p>
//                             <p className="text-sm text-slate-600 dark:text-slate-400">
//                                 {deepInsights.worstDivision && deepInsights.worstDivision.name !== deepInsights.bestDivision.name ? 
//                                     `${deepInsights.worstDivision.name} (Rata-rata telat: ${deepInsights.worstDivision.avgTardiness.toFixed(1)}x)` : 
//                                     'Semua divisi menunjukkan performa serupa.'
//                                 }
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
//                 <div className="lg:col-span-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300 flex flex-col">
//                     <h3 className="text-xl font-semibold mb-6 text-sky-900 dark:text-sky-300 flex items-center flex-shrink-0">
//                         <div className="w-3 h-3 bg-sky-600 rounded-full mr-3"></div>
//                         10 Karyawan Paling Sering Terlambat
//                     </h3>
//                     <div className="flex-grow h-80">
//                         <ChartWrapper 
//                             chartId="chart-tardiness" 
//                             type="bar" 
//                             data={tardinessChartData} 
//                             options={tardinessChartOptions} 
//                             fallbackText={{ 
//                                 icon: <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />, 
//                                 text: "Tidak ada data keterlambatan" 
//                             }} 
//                         />
//                     </div>
//                 </div>
//                 <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300 flex flex-col">
//                     <h3 className="text-xl font-semibold mb-6 text-sky-900 dark:text-sky-300 flex items-center flex-shrink-0">
//                         <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
//                         Distribusi Tipe Absensi
//                     </h3>
//                     <div className="flex-grow h-80">
//                         <ChartWrapper 
//                             chartId="chart-absence" 
//                             type="doughnut" 
//                             data={absenceChartData} 
//                             options={absenceChartOptions} 
//                             fallbackText={{ 
//                                 icon: <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />, 
//                                 text: "Tidak ada data absensi" 
//                             }} 
//                         />
//                     </div>
//                 </div>
//             </div>

//             {/* Divisional Analysis Section */}
//             <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
//                 <h3 className="text-xl font-semibold mb-6 text-sky-900 dark:text-sky-300">Analisis per Divisi</h3>
//                 <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants} initial="hidden" animate="visible">
//                     {divisionalAnalysis.map(div => (
//                         <motion.div key={div.name} variants={itemVariants}>
//                             <div 
//                                 onClick={() => handleDivisionClick(div.name)} 
//                                 className={`bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${expandedDivision === div.name ? 'ring-2 ring-sky-500' : 'hover:border-sky-400'}`}
//                             >
//                                 <h4 className="font-semibold text-lg text-sky-800 dark:text-sky-400 mb-3 flex items-center">
//                                     <Briefcase size={20} className="mr-2" />
//                                     {div.name}
//                                 </h4>
//                                 <div className="space-y-2 text-sm">
//                                     <div className="flex justify-between items-center">
//                                         <span className="text-gray-600 dark:text-gray-400 flex items-center">
//                                             <Users size={14} className="mr-2" />Jml Karyawan
//                                         </span>
//                                         <span className="font-medium text-gray-800 dark:text-gray-200">{div.employeeCount}</span>
//                                     </div>
//                                     <div className="flex justify-between items-center">
//                                         <span className="text-gray-600 dark:text-gray-400 flex items-center">
//                                             <Clock size={14} className="mr-2" />Total Terlambat
//                                         </span>
//                                         <span className="font-medium text-gray-800 dark:text-gray-200">{div.totalTardiness} kali</span>
//                                     </div>
//                                     <div className="flex justify-between items-center">
//                                         <span className="text-gray-600 dark:text-gray-400 flex items-center">
//                                             <Clock size={14} className="mr-2" />Rata-rata Terlambat
//                                         </span>
//                                         <span className="font-medium text-gray-800 dark:text-gray-200">
//                                             {div.employeeCount > 0 ? (div.totalTardiness / div.employeeCount).toFixed(1) : 0} / kary.
//                                         </span>
//                                     </div>
//                                     <div className="flex justify-between items-center">
//                                         <span className="text-gray-600 dark:text-gray-400 flex items-center">
//                                             <UserX size={14} className="mr-2" />Total Cuti
//                                         </span>
//                                         <span className="font-medium text-gray-800 dark:text-gray-200">{div.totalLeave} hari</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </motion.div>
//                     ))}
//                 </motion.div>
//                 <AnimatePresence>
//                     {expandedDivision && (
//                         <motion.div
//                             className="mt-6 border-t dark:border-slate-700 pt-6"
//                             initial={{ height: 0, opacity: 0 }}
//                             animate={{ height: 'auto', opacity: 1 }}
//                             exit={{ height: 0, opacity: 0 }}
//                             transition={{ duration: 0.3 }}
//                         >
//                             <div className="flex justify-between items-center mb-4">
//                                 <h4 className="text-lg font-semibold text-sky-900 dark:text-sky-300">
//                                     Detail Karyawan Divisi: {expandedDivision}
//                                 </h4>
//                                 <button 
//                                     onClick={() => exportService.exportToCsv(tableData.filter(emp => emp.DIVISI === expandedDivision), `detail_divisi_${expandedDivision}.csv`)} 
//                                     className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 text-xs rounded-lg flex items-center gap-1 no-print"
//                                 >
//                                     <Download size={14} /> Ekspor Divisi
//                                 </button>
//                             </div>
//                             <div className="overflow-x-auto">
//                                 <table className="w-full text-left">
//                                     <thead>
//                                         <tr className="border-b-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
//                                             <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Nama Karyawan</th>
//                                             <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center">Terlambat</th>
//                                             <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center">Absen (Sakit/Izin)</th>
//                                             <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center no-print">Aksi</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {tableData.filter(emp => emp.DIVISI === expandedDivision).map(employee => (
//                                             <tr key={employee.NAMA} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30">
//                                                 <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{employee.NAMA}</td>
//                                                 <td className="p-3 text-center text-gray-700 dark:text-gray-300">{employee.TERLAMBAT}</td>
//                                                 <td className="p-3 text-center text-gray-700 dark:text-gray-300">{employee.SURAT_DOKTER + employee.IJIN_FULL}</td>
//                                                 <td className="p-3 no-print flex justify-center items-center">
//                                                     <button 
//                                                         onClick={() => onAnalyzeIndividual(employee)} 
//                                                         disabled={isAiLoading} 
//                                                         className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1 px-3 text-xs rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
//                                                     >
//                                                         <Sparkles size={14} /> Analisis
//                                                     </button>
//                                                 </td>
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </motion.div>
//                     )}
//                 </AnimatePresence>
//             </div>
//         </motion.div>
//     );
// };

// export default OverallDashboard;
