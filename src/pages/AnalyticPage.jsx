import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Download, Award, AlertTriangle, BarChart2 } from 'lucide-react';
import ChartWrapper from '../components/ui/ChartWrapper';
import { exportService } from '../services/apiService';
import { getMonthNumber } from '../utils/helpers';

const AnalyticsPage = ({ data }) => {
    const [selectedMetric, setSelectedMetric] = useState('performance');
    const analyticsData = useMemo(() => { 
        const divisions = {}; 
        data.forEach(employee => { 
            const div = employee.DIVISI || 'N/A'; 
            if (!divisions[div]) { 
                divisions[div] = { name: div, employees: [], totalTardiness: 0, totalLeave: 0 }; 
            } 
            divisions[div].employees.push(employee); 
            divisions[div].totalTardiness += employee.TERLAMBAT; 
            divisions[div].totalLeave += employee.CUTI; 
        }); 
        Object.values(divisions).forEach(div => { 
            const employeeCount = div.employees.length; 
            if (employeeCount > 0) { 
                const avgTardiness = div.totalTardiness / employeeCount; 
                const avgLeave = div.totalLeave / employeeCount; 
                div.avgPerformance = Math.max(0, 100 - (avgTardiness * 5) - (avgLeave * 2)); 
            } else { 
                div.avgPerformance = 0; 
            } 
        }); 
        return divisions; 
    }, [data]);
    
    const topPerformers = useMemo(() => { 
        return [...data].filter(emp => emp.HARI_KERJA > 0).map(emp => ({ 
            ...emp, 
            score: Math.max(0, 100 - (emp.TERLAMBAT * 5) - ((emp.SURAT_DOKTER + emp.IJIN_FULL) * 3)) 
        })).sort((a, b) => b.score - a.score).slice(0, 5); 
    }, [data]);

    const monthlyTrendData = useMemo(() => {
        const monthlyStats = {};
        data.forEach(row => {
            if (!row.BULAN) return;
            if (!monthlyStats[row.BULAN]) {
                monthlyStats[row.BULAN] = { tardiness: 0, absence: 0, workDays: 0, };
            }
            monthlyStats[row.BULAN].tardiness += row.TERLAMBAT;
            monthlyStats[row.BULAN].absence += row.SURAT_DOKTER + row.IJIN_FULL;
            monthlyStats[row.BULAN].workDays += row.HARI_KERJA;
        });

        const sortedMonths = Object.keys(monthlyStats).sort((a, b) => getMonthNumber(a) - getMonthNumber(b));

        return {
            labels: sortedMonths,
            datasets: [
                { label: 'Keterlambatan', data: sortedMonths.map(m => monthlyStats[m].tardiness), borderColor: 'rgba(249, 115, 22, 0.8)', backgroundColor: 'rgba(249, 115, 22, 0.2)', fill: true, tension: 0.3, },
                { label: 'Absensi (Sakit/Izin)', data: sortedMonths.map(m => monthlyStats[m].absence), borderColor: 'rgba(239, 68, 68, 0.8)', backgroundColor: 'rgba(239, 68, 68, 0.2)', fill: true, tension: 0.3, },
                { label: 'Total Hari Kerja', data: sortedMonths.map(m => monthlyStats[m].workDays), borderColor: 'rgba(59, 130, 246, 0.8)', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.3, }
            ]
        };
    }, [data]);

    const monthlyChartOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'top' } } };

    const handleExport = () => {
        const dataToExport = [
            ...Object.values(analyticsData).map(div => ({ 
                'Divisi': div.name, 
                'Skor Performa': div.avgPerformance.toFixed(1), 
                'Jumlah Karyawan': div.employees.length, 
                'Rata-rata Terlambat': (div.employees.length > 0 ? (div.totalTardiness / div.employees.length) : 0).toFixed(1) 
            })),
            {}, // Empty row for separation
            { 'Top 5 Karyawan Terbaik': '' },
            ...topPerformers.map(emp => ({ 'Nama': emp.NAMA, 'Divisi': emp.DIVISI, 'Skor Performa': emp.score.toFixed(1) }))
        ];
        exportService.exportToCsv(dataToExport, 'analisis_insight.csv');
    };

    return (
        <motion.div
            className="space-y-8 printable-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-2xl p-8 text-white flex justify-between items-center">
                <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-8 h-8" />
                        <h2 className="text-3xl font-bold">Analisis & Wawasan</h2>
                    </div>
                    <p className="text-sky-100 text-lg">Analisis mendalam performa kehadiran dan produktivitas tim</p>
                </div>
                <button onClick={handleExport} className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors no-print">
                    <Download size={16} /> Ekspor
                </button>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Tren Kehadiran per Bulan</h3>
                <ChartWrapper 
                    chartId="monthly-trend-chart" 
                    type="line" 
                    data={monthlyTrendData} 
                    options={monthlyChartOptions} 
                    fallbackText={{ 
                        icon: <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-50" />, 
                        text: "Data tidak cukup untuk menampilkan tren bulanan." 
                    }} 
                />
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <div className="flex flex-wrap gap-4 mb-6 no-print">
                    <button 
                        onClick={() => setSelectedMetric('performance')} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedMetric === 'performance' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                    >
                        <Award className="w-4 h-4" /> Performa Divisi
                    </button>
                    <button 
                        onClick={() => setSelectedMetric('trends')} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedMetric === 'trends' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                    >
                        <TrendingUp className="w-4 h-4" /> Tren & Pola
                    </button>
                    <button 
                        onClick={() => setSelectedMetric('risks')} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedMetric === 'risks' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                    >
                        <AlertTriangle className="w-4 h-4" /> Identifikasi Risiko
                    </button>
                </div>
                
                {selectedMetric === 'performance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Skor Kinerja per Divisi</h3>
                            <div className="space-y-4">
                                {Object.values(analyticsData).map(div => (
                                    <div key={div.name} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{div.name}</span>
                                            <span className="text-lg font-bold text-sky-700 dark:text-sky-400">{div.avgPerformance.toFixed(1)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                                            <div 
                                                className="bg-gradient-to-r from-sky-500 to-blue-600 h-2 rounded-full transition-all duration-500" 
                                                style={{ width: `${div.avgPerformance}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {div.employees.length} karyawan • Rata-rata Terlambat: {div.employees.length > 0 ? (div.totalTardiness / div.employees.length).toFixed(1) : 0}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">5 Karyawan Terbaik</h3>
                            <div className="space-y-3">
                                {topPerformers.map((emp, index) => (
                                    <div key={emp.NAMA} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                                index === 0 ? 'bg-yellow-500' : 
                                                index === 1 ? 'bg-gray-400' : 
                                                index === 2 ? 'bg-amber-600' : 'bg-sky-600'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-gray-200">{emp.NAMA}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{emp.DIVISI}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-sky-700 dark:text-sky-400">{emp.score.toFixed(1)}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Skor Kinerja</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {selectedMetric === 'trends' && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-lg">
                            <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2" /> Analisis Tren Kehadiran
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {data.length > 0 ? ((data.reduce((sum, emp) => sum + emp.TERLAMBAT, 0) / data.length)).toFixed(1) : 0}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Terlambat/Karyawan</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {data.length > 0 ? ((data.reduce((sum, emp) => sum + emp.SURAT_DOKTER + emp.IJIN_FULL, 0) / data.length)).toFixed(1) : 0}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Absen/Karyawan</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {data.length > 0 ? ((data.reduce((sum, emp) => sum + emp.CUTI, 0) / data.length)).toFixed(1) : 0}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Cuti/Karyawan</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {selectedMetric === 'risks' && (
                    <div className="space-y-6">
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 p-6 rounded-lg">
                            <h3 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-300 flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2" /> Karyawan Berisiko Tinggi
                            </h3>
                            <div className="space-y-3">
                                {data.filter(emp => emp.TERLAMBAT > 5 || (emp.SURAT_DOKTER + emp.IJIN_FULL) > 3).slice(0, 5).map(emp => (
                                    <div key={emp.NAMA} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-red-200 dark:border-red-800/50">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-gray-200">{emp.NAMA}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{emp.DIVISI} - {emp.JABATAN}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    {emp.TERLAMBAT > 5 && `Terlambat: ${emp.TERLAMBAT}x`}
                                                    {emp.TERLAMBAT > 5 && (emp.SURAT_DOKTER + emp.IJIN_FULL) > 3 && ' • '}
                                                    {(emp.SURAT_DOKTER + emp.IJIN_FULL) > 3 && `Absen: ${emp.SURAT_DOKTER + emp.IJIN_FULL} hari`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AnalyticsPage;
