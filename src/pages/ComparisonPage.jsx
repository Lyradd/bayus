import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GitCompareArrows, Sparkles, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import AnimatedDropdown from '../components/ui/AnimatedDropdown';

const ComparisonPage = ({ data, availableMonths, onAnalyze, isAiLoading }) => {
    const [periodA, setPeriodA] = useState('');
    const [periodB, setPeriodB] = useState('');

    const getMonthStats = useCallback((month) => {
        const monthData = data.filter(row => row.BULAN === month);
        return {
            tardiness: monthData.reduce((sum, row) => sum + row.TERLAMBAT, 0),
            absence: monthData.reduce((sum, row) => sum + row.SURAT_DOKTER + row.IJIN_FULL, 0),
            workDays: monthData.reduce((sum, row) => sum + row.HARI_KERJA, 0),
            employees: new Set(monthData.map(row => row.NAMA)).size
        };
    }, [data]);

    const statsA = useMemo(() => periodA ? getMonthStats(periodA) : null, [periodA, getMonthStats]);
    const statsB = useMemo(() => periodB ? getMonthStats(periodB) : null, [periodB, getMonthStats]);

    const getChangeIcon = (valueA, valueB) => {
        if (valueA === valueB) return <Minus className="w-4 h-4 text-gray-500" />;
        return valueA < valueB ? <ArrowUp className="w-4 h-4 text-red-500" /> : <ArrowDown className="w-4 h-4 text-green-500" />;
    };

    const getChangeColor = (valueA, valueB, isGoodWhenLower = true) => {
        if (valueA === valueB) return "text-gray-500 dark:text-gray-400";
        const isIncreasing = valueB > valueA;
        if (isGoodWhenLower) {
            return isIncreasing ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400";
        } else {
            return isIncreasing ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400";
        }
    };

    const handleAnalyze = () => {
        if (!statsA || !statsB) return;
        onAnalyze({ periodA, periodB, statsA, statsB });
    };

    return (
        <motion.div
            className="space-y-8 printable-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <GitCompareArrows className="w-8 h-8" />
                    <h2 className="text-3xl font-bold">Perbandingan Periode</h2>
                </div>
                <p className="text-sky-100 text-lg">Bandingkan data kehadiran antara dua periode untuk mengidentifikasi tren dan perubahan</p>
            </div>

            {/* Period Selection */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm no-print transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Pilih Periode untuk Dibandingkan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Periode A</label>
                        <AnimatedDropdown
                            options={availableMonths}
                            selectedValue={periodA}
                            onValueChange={setPeriodA}
                            placeholder="Pilih periode..."
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Periode B</label>
                        <AnimatedDropdown
                            options={availableMonths}
                            selectedValue={periodB}
                            onValueChange={setPeriodB}
                            placeholder="Pilih periode..."
                        />
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={!periodA || !periodB || isAiLoading || periodA === periodB}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg"
                    >
                        <Sparkles className="w-5 h-5" />
                        {isAiLoading ? 'Menganalisis...' : 'Analisis AI'}
                    </button>
                </div>
            </div>

            {/* Comparison Results */}
            {statsA && statsB && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Period A Stats */}
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                        <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Periode A: {periodA}</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Total Keterlambatan</span>
                                <span className="font-bold text-orange-600 dark:text-orange-400">{statsA.tardiness} kali</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Total Absensi</span>
                                <span className="font-bold text-red-600 dark:text-red-400">{statsA.absence} hari</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Total Hari Kerja</span>
                                <span className="font-bold text-green-600 dark:text-green-400">{statsA.workDays} hari</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Jumlah Karyawan</span>
                                <span className="font-bold text-sky-600 dark:text-sky-400">{statsA.employees} orang</span>
                            </div>
                        </div>
                    </div>

                    {/* Period B Stats */}
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                        <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Periode B: {periodB}</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Total Keterlambatan</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-orange-600 dark:text-orange-400">{statsB.tardiness} kali</span>
                                    {getChangeIcon(statsA.tardiness, statsB.tardiness)}
                                    <span className={`text-sm font-medium ${getChangeColor(statsA.tardiness, statsB.tardiness)}`}>
                                        ({statsB.tardiness - statsA.tardiness > 0 ? '+' : ''}{statsB.tardiness - statsA.tardiness})
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Total Absensi</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-red-600 dark:text-red-400">{statsB.absence} hari</span>
                                    {getChangeIcon(statsA.absence, statsB.absence)}
                                    <span className={`text-sm font-medium ${getChangeColor(statsA.absence, statsB.absence)}`}>
                                        ({statsB.absence - statsA.absence > 0 ? '+' : ''}{statsB.absence - statsA.absence})
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Total Hari Kerja</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-green-600 dark:text-green-400">{statsB.workDays} hari</span>
                                    {getChangeIcon(statsA.workDays, statsB.workDays)}
                                    <span className={`text-sm font-medium ${getChangeColor(statsA.workDays, statsB.workDays, false)}`}>
                                        ({statsB.workDays - statsA.workDays > 0 ? '+' : ''}{statsB.workDays - statsA.workDays})
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Jumlah Karyawan</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sky-600 dark:text-sky-400">{statsB.employees} orang</span>
                                    {getChangeIcon(statsA.employees, statsB.employees)}
                                    <span className={`text-sm font-medium ${getChangeColor(statsA.employees, statsB.employees, false)}`}>
                                        ({statsB.employees - statsA.employees > 0 ? '+' : ''}{statsB.employees - statsA.employees})
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default ComparisonPage;
