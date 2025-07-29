import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Upload, Users, Clock, UserX, Calendar, FileText, RefreshCw, X, UserCheck, Sparkles, LoaderCircle, BarChart2, Briefcase, UserMinus, TrendingUp, Award, AlertTriangle, Search, LayoutDashboard, ChevronsRight, Zap, ShieldCheck, Download, GitCompareArrows, ArrowUp, ArrowDown, Minus, Printer, ChevronsLeft, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper: Loads external scripts dynamically
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Helper for chronological month sorting
const monthMapping = {
  'januari': 1, 'jan': 1,
  'februari': 2, 'feb': 2,
  'maret': 3, 'mar': 3,
  'april': 4, 'apr': 4,
  'mei': 5,
  'juni': 6, 'jun': 6,
  'juli': 7, 'jul': 7,
  'agustus': 8, 'agu': 8, 'ags': 8,
  'september': 9, 'sep': 9,
  'oktober': 10, 'okt': 10,
  'november': 11, 'nov': 11,
  'desember': 12, 'des': 12
};
const getMonthNumber = (monthName) => {
    if (!monthName) return 0;
    // Normalize to lowercase and remove extra spaces to match keys in monthMapping
    const lowerMonth = String(monthName).toLowerCase().trim();
    return monthMapping[lowerMonth] || 0;
};


//================================================================
// 1. SERVICES / UTILS
//================================================================

const csvParserService = {
  parse: (file, onComplete, onError) => {
    if (!window.Papa) {
      onError(new Error("PapaParse library is not loaded."));
      return;
    }
    window.Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      delimitersToGuess: [',', '\t', '|', ';'],
      complete: (results) => {
        if (results.errors.length) console.warn('CSV parsing warnings:', results.errors);
        if (!results.data || results.data.length === 0) {
          onError(new Error('File CSV kosong atau tidak memiliki data yang valid.'));
          return;
        }
        
        const normalizedData = results.data.map(row => {
            const normalizedRow = {};
            for (const key in row) {
                normalizedRow[key.toUpperCase().trim().replace(/\s+/g, '_')] = row[key];
            }
            return normalizedRow;
        });

        const firstRow = normalizedData[0];
        const requiredColumns = ['NAMA'];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        if (missingColumns.length > 0) {
          onError(new Error(`Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(', ')}`));
          return;
        }
        
        const processedData = normalizedData.map(csvParserService.processRow).filter(row => row && row.NAMA && row.NAMA.trim() !== '');
        if (processedData.length === 0) {
          onError(new Error('Tidak ada data valid yang ditemukan dalam file CSV.'));
          return;
        }
        onComplete(processedData);
      },
      error: (error) => onError(new Error(`Terjadi kesalahan saat membaca file CSV: ${error.message}`)),
    });
  },

  processRow: (row) => {
    const numericColumns = ['SURAT_DOKTER', 'IJIN_FULL', 'TERLAMBAT', 'CUTI', 'SISA_CUTI', 'HARI_KERJA', 'TAHUN_MASUK', 'LAMA_BEKERJA'];
    const processedRow = { ...row };
    numericColumns.forEach(col => {
      const cleanValue = String(processedRow[col] || '0').replace(/[^\d.-]/g, '');
      processedRow[col] = parseFloat(cleanValue) || 0;
    });
    ['NAMA', 'DIVISI', 'JABATAN', 'BULAN'].forEach(col => {
      if (processedRow[col]) processedRow[col] = String(processedRow[col]).trim();
    });
    return processedRow;
  }
};

const geminiService = {
  getAnalysis: async (prompt) => {
    try {
      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };
      const apiKey = ""; 
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
      const result = await response.json();
      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
          return result.candidates[0].content.parts[0].text;
      } else {
          console.error("Invalid API response structure:", result);
          throw new Error("Struktur respons dari API tidak valid atau tidak berisi teks.");
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error(`Terjadi kesalahan saat mengambil analisis AI: ${error.message}. Mohon coba lagi.`);
    }
  }
};

const exportService = {
  exportToCsv: (data, filename = 'export.csv') => {
    if (!window.Papa) {
      console.error("Layanan ekspor belum siap, silakan coba lagi.");
      return;
    }
    if (!data || data.length === 0) {
      console.error("Tidak ada data untuk diekspor.");
      return;
    }

    const csv = window.Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

//================================================================
// 2. CUSTOM HOOK
//================================================================

const useAttendanceData = (allData) => {
  const getEmployeeByName = useCallback((name) => {
    const records = allData.filter(row => row.NAMA === name);
    if (records.length === 0) return null;
    
    const employeeData = records.reduce((acc, row) => {
        acc.HARI_KERJA += row.HARI_KERJA;
        acc.TERLAMBAT += row.TERLAMBAT;
        acc.SURAT_DOKTER += row.SURAT_DOKTER;
        acc.IJIN_FULL += row.IJIN_FULL;
        acc.CUTI += row.CUTI;
        return acc;
    }, {
        NAMA: name,
        DIVISI: records[0].DIVISI || 'N/A',
        JABATAN: records[0].JABATAN || 'N/A',
        TAHUN_MASUK: records[0].TAHUN_MASUK || 0,
        LAMA_BEKERJA: records[0].LAMA_BEKERJA || 0,
        HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0
    });
    return employeeData;
  }, [allData]);

  const availableMonths = useMemo(() => {
    return [...new Set(allData.map(item => item.BULAN))].filter(Boolean).sort((a, b) => getMonthNumber(a) - getMonthNumber(b));
  }, [allData]);

  const availableEmployees = useMemo(() => {
    return [...new Set(allData.map(item => item.NAMA))].filter(Boolean).sort();
  }, [allData]);

  return { getEmployeeByName, availableMonths, availableEmployees, allData };
};

//================================================================
// 3. UI COMPONENTS
//================================================================

const Skeleton = ({ className }) => <div className={`bg-slate-200 animate-pulse rounded-md ${className}`} />;

const KpiCardSkeleton = () => (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
        </div>
    </div>
);

const ChartSkeleton = () => (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <Skeleton className="h-6 w-1/3 mb-6" />
        <Skeleton className="h-80 w-full" />
    </div>
);

const TableSkeleton = () => (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <Skeleton className="h-6 w-1/3 mb-6" />
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-8 w-1/4" />
                </div>
            ))}
        </div>
    </div>
);

const OverallDashboardSkeleton = () => (
    <div className="space-y-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3"><ChartSkeleton /></div>
            <div className="lg:col-span-2"><ChartSkeleton /></div>
        </div>
        <TableSkeleton />
    </div>
);

const AiAnalysisSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <br />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/6" />
    </div>
);


const FileUploadScreen = ({ onFileSelect, isLoading, scriptsLoaded }) => {
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); const files = e.dataTransfer.files; if (files && files.length > 0) onFileSelect(files[0]); }, [onFileSelect]);
  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); if (e.currentTarget.contains(e.relatedTarget)) return; setDragOver(false); }, []);
  const handleFileInputChange = useCallback((e) => { if (e.target.files && e.target.files.length > 0) { onFileSelect(e.target.files[0]); e.target.value = null; } }, [onFileSelect]);
  
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen"><div className="text-center mb-12"><FileText className="w-16 h-16 mx-auto text-sky-600 mb-4" /><h1 className="text-5xl md:text-6xl font-bold text-sky-900 mb-6">Dashboard Analisis</h1><h2 className="text-3xl md:text-4xl font-semibold text-gray-700 mb-4">Absensi Karyawan</h2><p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">Unggah file CSV Anda untuk mendapatkan wawasan mendalam dan analisis AI tentang pola kehadiran tim Anda.</p></div><div className="max-w-2xl w-full mx-auto">{!scriptsLoaded ? (<div className="text-center"><div className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm"><RefreshCw className="w-5 h-5 mr-3 animate-spin text-sky-600" /><span className="text-gray-600">Mempersiapkan aplikasi...</span></div></div>) : (<div className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group ${dragOver ? 'border-sky-500 bg-sky-50 scale-105' : 'border-gray-300 hover:border-sky-600 hover:bg-white'}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => document.getElementById('file-input')?.click()}><input type="file" id="file-input" className="hidden" accept=".csv" onChange={handleFileInputChange} disabled={!scriptsLoaded} /><div className="flex flex-col items-center"><div className={`p-4 rounded-full mb-6 transition-all duration-300 ${dragOver ? 'bg-sky-100 scale-110' : 'bg-gray-100 group-hover:bg-sky-100'}`}><Upload className={`w-12 h-12 transition-colors duration-300 ${dragOver ? 'text-sky-600' : 'text-gray-400 group-hover:text-sky-600'}`} /></div><h3 className="text-2xl font-semibold text-gray-800 mb-2">{dragOver ? 'Lepaskan file di sini' : 'Seret & lepas file CSV'}</h3><p className="text-gray-500 mb-6">atau</p><button className="bg-sky-700 hover:bg-sky-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">Pilih File</button><p className="text-sm text-gray-500 mt-4">Mendukung file CSV maks. 10MB</p></div></div>)}{isLoading && (<div className="text-center mt-8"><div className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm"><RefreshCw className="w-5 h-5 mr-3 animate-spin text-sky-600" /><span className="text-gray-600">Memproses data...</span></div></div>)}</div></div>
  );
};

const KpiCard = ({ icon, title, value, unit, colorClass, small = false }) => (
    <div className={`bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 ${small ? 'p-4' : 'p-6'}`}>
        <div className={`p-3 rounded-xl ${colorClass.bg} ${small ? 'p-2' : 'p-3'}`}>
            {React.cloneElement(icon, { className: ` ${colorClass.text} ${small ? 'w-6 h-6' : 'w-8 h-8'}` })}
        </div>
        <div>
            <p className={`text-gray-600 font-medium ${small ? 'text-xs' : 'text-sm'}`}>{title}</p>
            <p className={`font-bold text-gray-800 ${small ? 'text-2xl' : 'text-3xl'}`}>{value} {unit && <span className={small ? 'text-base' : 'text-lg'}>{unit}</span>}</p>
        </div>
    </div>
);

const ChartWrapper = ({ chartId, type, data, options, fallbackText }) => {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  useEffect(() => { if (!window.Chart || !canvasRef.current) return; if (chartRef.current) chartRef.current.destroy(); if (!data || (data.datasets && data.datasets.every(ds => ds.data.every(d => d === 0)))) { return; } try { chartRef.current = new window.Chart(canvasRef.current, { type, data, options }); } catch (error) { console.error("Chart.js error:", error); } return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } }; }, [type, data, options]);
  const hasData = data && data.datasets && data.datasets.some(ds => ds.data.some(d => d > 0));
  return (<div className="h-80 w-full">{hasData ? (<canvas id={chartId} ref={canvasRef}></canvas>) : (<div className="flex items-center justify-center h-full text-gray-400"><div className="text-center">{fallbackText.icon}<p>{fallbackText.text}</p></div></div>)}</div>);
};

const Modal = ({ show, title, message, onClose }) => { if (!show) return null; return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"><div className="flex justify-between items-center p-6 border-b border-gray-200"><h3 className="text-xl font-semibold text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div><div className="p-6"><p className="text-gray-600 leading-relaxed">{message}</p></div><div className="flex justify-end p-4 bg-gray-50 rounded-b-2xl"><button onClick={onClose} className="bg-sky-700 hover:bg-sky-800 text-white font-medium py-2 px-6 rounded-lg">OK</button></div></div></div>); };
const AiAnalysisModal = ({ show, title, content, isLoading, onClose }) => { if (!show) return null; return (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"><div className="flex justify-between items-center p-6 border-b border-gray-200"><h3 className="text-xl font-semibold text-sky-900 flex items-center gap-3"><Sparkles className="text-orange-500"/>{title}</h3><button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div><div className="p-6 overflow-y-auto">{isLoading ? <AiAnalysisSkeleton /> : (<div className="prose prose-sm md:prose-base max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: content.replace(/### \*\*(.*?)\*\*/g, `<h3 class="text-lg font-semibold text-sky-800 mt-4 mb-2">$1</h3>`).replace(/\*\*(.*?)\*\*/g, `<strong class="text-gray-900">$1</strong>`).replace(/\n/g, `<br />`) }}></div>)}</div><div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl"><button onClick={onClose} className="bg-sky-700 hover:bg-sky-800 text-white font-medium py-2 px-6 rounded-lg">Tutup</button></div></div></div>); };

const AnimatedDropdown = ({ options, selectedValue, onValueChange, placeholder, includeAllOption = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (value) => {
        onValueChange(value);
        setIsOpen(false);
    };

    const displayValue = !selectedValue || selectedValue === 'semua' ? placeholder : selectedValue;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-800 rounded-xl px-4 py-2 focus:ring-2 focus:ring-sky-500 flex justify-between items-center"
            >
                <span className="truncate">{displayValue}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="w-5 h-5" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                        {includeAllOption && (
                            <li
                                onClick={() => handleSelect('semua')}
                                className="px-4 py-2 hover:bg-sky-100 cursor-pointer"
                            >
                                {placeholder}
                            </li>
                        )}
                        {options.map(option => (
                            <li
                                key={option}
                                onClick={() => handleSelect(option)}
                                className="px-4 py-2 hover:bg-sky-100 cursor-pointer"
                            >
                                {option}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

const EmployeeDetailView = ({ employee, onAnalyze, isAiLoading }) => {
    if (!employee) {
        return <div className="flex items-center justify-center h-full text-gray-500">Pilih karyawan dari sidebar untuk melihat detail.</div>;
    }

    return (
        <motion.div 
            className="space-y-8 printable-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Employee Header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-sky-900">{employee.NAMA}</h2>
                        <p className="text-lg text-gray-600">{employee.JABATAN} • {employee.DIVISI}</p>
                    </div>
                    <button onClick={() => onAnalyze(employee)} disabled={isAiLoading} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg no-print">
                        <Sparkles className="w-5 h-5" />
                        {isAiLoading ? 'Menganalisis...' : 'Analisis AI Personal'}
                    </button>
                </div>
            </div>

            {/* Employee KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard icon={<Clock />} title="Total Terlambat" value={employee.TERLAMBAT} unit="kali" colorClass={{ bg: 'bg-orange-100', text: 'text-orange-600' }} small />
                <KpiCard icon={<UserX />} title="Total Absen Sakit" value={employee.SURAT_DOKTER} unit="hari" colorClass={{ bg: 'bg-red-100', text: 'text-red-600' }} small />
                <KpiCard icon={<UserMinus />} title="Total Absen Izin" value={employee.IJIN_FULL} unit="hari" colorClass={{ bg: 'bg-yellow-100', text: 'text-yellow-600' }} small />
                <KpiCard icon={<Calendar />} title="Total Cuti" value={employee.CUTI} unit="hari" colorClass={{ bg: 'bg-blue-100', text: 'text-blue-600' }} small />
            </div>

            {/* Further Details */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-sky-900">Ringkasan Kehadiran</h3>
                <p className="text-gray-700 leading-relaxed">
                    Selama periode yang dipilih, {employee.NAMA} telah bekerja selama <strong className="text-sky-800">{employee.HARI_KERJA}</strong> hari. 
                    Karyawan ini tercatat terlambat sebanyak <strong className="text-orange-600">{employee.TERLAMBAT}</strong> kali dan mengambil total <strong className="text-red-600">{employee.SURAT_DOKTER + employee.IJIN_FULL}</strong> hari absen di luar cuti resmi.
                    Analisis lebih mendalam dapat memberikan wawasan tentang pola kehadiran dan potensi area untuk peningkatan produktivitas.
                </p>
            </div>
        </motion.div>
    );
};

const AnalyticsPage = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const analyticsData = useMemo(() => { const divisions = {}; data.forEach(employee => { const div = employee.DIVISI || 'N/A'; if (!divisions[div]) { divisions[div] = { name: div, employees: [], totalTardiness: 0, totalLeave: 0 }; } divisions[div].employees.push(employee); divisions[div].totalTardiness += employee.TERLAMBAT; divisions[div].totalLeave += employee.CUTI; }); Object.values(divisions).forEach(div => { const employeeCount = div.employees.length; if (employeeCount > 0) { const avgTardiness = div.totalTardiness / employeeCount; const avgLeave = div.totalLeave / employeeCount; div.avgPerformance = Math.max(0, 100 - (avgTardiness * 5) - (avgLeave * 2)); } else { div.avgPerformance = 0; } }); return divisions; }, [data]);
  const topPerformers = useMemo(() => { return [...data].filter(emp => emp.HARI_KERJA > 0).map(emp => ({ ...emp, score: Math.max(0, 100 - (emp.TERLAMBAT * 5) - ((emp.SURAT_DOKTER + emp.IJIN_FULL) * 3)) })).sort((a, b) => b.score - a.score).slice(0, 5); }, [data]);

  const monthlyTrendData = useMemo(() => {
    const monthlyStats = {};
    data.forEach(row => {
        if (!row.BULAN) return;
        if (!monthlyStats[row.BULAN]) {
            monthlyStats[row.BULAN] = {
                tardiness: 0,
                absence: 0,
                workDays: 0,
            };
        }
        monthlyStats[row.BULAN].tardiness += row.TERLAMBAT;
        monthlyStats[row.BULAN].absence += row.SURAT_DOKTER + row.IJIN_FULL;
        monthlyStats[row.BULAN].workDays += row.HARI_KERJA;
    });

    const sortedMonths = Object.keys(monthlyStats).sort((a, b) => getMonthNumber(a) - getMonthNumber(b));
    
    return {
        labels: sortedMonths,
        datasets: [
            {
                label: 'Keterlambatan',
                data: sortedMonths.map(m => monthlyStats[m].tardiness),
                borderColor: 'rgba(249, 115, 22, 0.8)',
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                fill: true,
                tension: 0.3,
            },
            {
                label: 'Absensi (Sakit/Izin)',
                data: sortedMonths.map(m => monthlyStats[m].absence),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                fill: true,
                tension: 0.3,
            },
            {
                label: 'Total Hari Kerja',
                data: sortedMonths.map(m => monthlyStats[m].workDays),
                borderColor: 'rgba(59, 130, 246, 0.8)',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                fill: true,
                tension: 0.3,
            }
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
      ...topPerformers.map(emp => ({
        'Nama': emp.NAMA,
        'Divisi': emp.DIVISI,
        'Skor Performa': emp.score.toFixed(1)
      }))
    ];
    exportService.exportToCsv(dataToExport, 'analisis_insight.csv');
  };

  return (<motion.div 
    className="space-y-8 printable-content"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
  <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-2xl p-8 text-white flex justify-between items-center"><div className="flex-grow"><div className="flex items-center gap-3 mb-4"><TrendingUp className="w-8 h-8" /><h2 className="text-3xl font-bold">Analytics & Insights</h2></div><p className="text-sky-100 text-lg">Analisis mendalam performa kehadiran dan produktivitas tim</p></div><button onClick={handleExport} className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors no-print"><Download size={16}/> Ekspor</button></div>
    
    {/* Monthly Trend Chart */}
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-sky-900">Tren Kehadiran per Bulan</h3>
        <ChartWrapper chartId="monthly-trend-chart" type="line" data={monthlyTrendData} options={monthlyChartOptions} fallbackText={{icon: <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-50" />, text: "Data tidak cukup untuk menampilkan tren bulanan."}} />
    </div>

  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"><div className="flex flex-wrap gap-4 mb-6 no-print"><button onClick={() => setSelectedMetric('performance')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedMetric === 'performance' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Award className="w-4 h-4" /> Performa Divisi</button><button onClick={() => setSelectedMetric('trends')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedMetric === 'trends' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><TrendingUp className="w-4 h-4" /> Tren & Pola</button><button onClick={() => setSelectedMetric('risks')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedMetric === 'risks' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><AlertTriangle className="w-4 h-4" /> Identifikasi Risiko</button></div>{selectedMetric === 'performance' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div><h3 className="text-xl font-semibold mb-4 text-sky-900">Performance Score per Divisi</h3><div className="space-y-4">{Object.values(analyticsData).map(div => (<div key={div.name} className="bg-gray-50 p-4 rounded-lg"><div className="flex justify-between items-center mb-2"><span className="font-medium text-gray-800">{div.name}</span><span className="text-lg font-bold text-sky-700">{div.avgPerformance.toFixed(1)}</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-gradient-to-r from-sky-500 to-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${div.avgPerformance}%` }}></div></div><div className="text-sm text-gray-600 mt-1">{div.employees.length} karyawan • Avg Terlambat: {div.employees.length > 0 ? (div.totalTardiness / div.employees.length).toFixed(1) : 0}</div></div>))}</div></div><div><h3 className="text-xl font-semibold mb-4 text-sky-900">Top 5 Karyawan Terbaik</h3><div className="space-y-3">{topPerformers.map((emp, index) => (<div key={emp.NAMA} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-sky-600'}`}>{index + 1}</div><div><p className="font-medium text-gray-800">{emp.NAMA}</p><p className="text-sm text-gray-600">{emp.DIVISI}</p></div></div><div className="text-right"><p className="text-lg font-bold text-sky-700">{emp.score.toFixed(1)}</p><p className="text-xs text-gray-500">Performance Score</p></div></div>))}</div></div></div>)}{selectedMetric === 'trends' && (<div className="space-y-6"><div className="bg-gray-50 p-6 rounded-lg"><h3 className="text-xl font-semibold mb-4 text-sky-900 flex items-center"><TrendingUp className="w-5 h-5 mr-2" /> Analisis Tren Kehadiran</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="text-center"><div className="text-2xl font-bold text-orange-600">{data.length > 0 ? ((data.reduce((sum, emp) => sum + emp.TERLAMBAT, 0) / data.length)).toFixed(1) : 0}</div><div className="text-sm text-gray-600">Rata-rata Terlambat/Karyawan</div></div><div className="text-center"><div className="text-2xl font-bold text-red-600">{data.length > 0 ? ((data.reduce((sum, emp) => sum + emp.SURAT_DOKTER + emp.IJIN_FULL, 0) / data.length)).toFixed(1) : 0}</div><div className="text-sm text-gray-600">Rata-rata Absen/Karyawan</div></div><div className="text-center"><div className="text-2xl font-bold text-blue-600">{data.length > 0 ? ((data.reduce((sum, emp) => sum + emp.CUTI, 0) / data.length)).toFixed(1) : 0}</div><div className="text-sm text-gray-600">Rata-rata Cuti/Karyawan</div></div></div></div></div>)}{selectedMetric === 'risks' && (<div className="space-y-6"><div className="bg-red-50 border border-red-200 p-6 rounded-lg"><h3 className="text-xl font-semibold mb-4 text-red-800 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Karyawan Berisiko Tinggi</h3><div className="space-y-3">{data.filter(emp => emp.TERLAMBAT > 5 || (emp.SURAT_DOKTER + emp.IJIN_FULL) > 3).slice(0, 5).map(emp => (<div key={emp.NAMA} className="bg-white p-4 rounded-lg border border-red-200"><div className="flex justify-between items-center"><div><p className="font-medium text-gray-800">{emp.NAMA}</p><p className="text-sm text-gray-600">{emp.DIVISI} - {emp.JABATAN}</p></div><div className="text-right"><p className="text-sm text-red-600">{emp.TERLAMBAT > 5 && `Terlambat: ${emp.TERLAMBAT}x`}{emp.TERLAMBAT > 5 && (emp.SURAT_DOKTER + emp.IJIN_FULL) > 3 && ' • '}{(emp.SURAT_DOKTER + emp.IJIN_FULL) > 3 && `Absen: ${emp.SURAT_DOKTER + emp.IJIN_FULL} hari`}</p></div></div></div>))}</div></div></div>)}</div></motion.div>);
};

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
    if (valueA === valueB) return "text-gray-500";
    const isIncreasing = valueB > valueA;
    if (isGoodWhenLower) {
      return isIncreasing ? "text-red-500" : "text-green-500";
    } else {
      return isIncreasing ? "text-green-500" : "text-red-500";
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
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm no-print">
        <h3 className="text-xl font-semibold mb-4 text-sky-900">Pilih Periode untuk Dibandingkan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Periode A</label>
            <AnimatedDropdown 
              options={availableMonths} 
              selectedValue={periodA} 
              onValueChange={setPeriodA}
              placeholder="Pilih periode..."
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Periode B</label>
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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-sky-900">Periode A: {periodA}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Keterlambatan</span>
                <span className="font-bold text-orange-600">{statsA.tardiness} kali</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Absensi</span>
                <span className="font-bold text-red-600">{statsA.absence} hari</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Hari Kerja</span>
                <span className="font-bold text-green-600">{statsA.workDays} hari</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Jumlah Karyawan</span>
                <span className="font-bold text-sky-600">{statsA.employees} orang</span>
              </div>
            </div>
          </div>

          {/* Period B Stats */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-sky-900">Periode B: {periodB}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Keterlambatan</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-600">{statsB.tardiness} kali</span>
                  {getChangeIcon(statsA.tardiness, statsB.tardiness)}
                  <span className={`text-sm font-medium ${getChangeColor(statsA.tardiness, statsB.tardiness)}`}>
                    ({statsB.tardiness - statsA.tardiness > 0 ? '+' : ''}{statsB.tardiness - statsA.tardiness})
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Absensi</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-600">{statsB.absence} hari</span>
                  {getChangeIcon(statsA.absence, statsB.absence)}
                  <span className={`text-sm font-medium ${getChangeColor(statsA.absence, statsB.absence)}`}>
                    ({statsB.absence - statsA.absence > 0 ? '+' : ''}{statsB.absence - statsA.absence})
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Hari Kerja</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-600">{statsB.workDays} hari</span>
                  {getChangeIcon(statsA.workDays, statsB.workDays)}
                  <span className={`text-sm font-medium ${getChangeColor(statsA.workDays, statsB.workDays, false)}`}>
                    ({statsB.workDays - statsA.workDays > 0 ? '+' : ''}{statsB.workDays - statsA.workDays})
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Jumlah Karyawan</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sky-600">{statsB.employees} orang</span>
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

const OverallDashboard = ({ data, onAnalyzeIndividual, onAnalyzeOverall, isAiLoading }) => {
    const [selectedMonth, setSelectedMonth] = useState('semua');
    const [selectedEmployee, setSelectedEmployee] = useState('semua');
    const [expandedDivision, setExpandedDivision] = useState(null);
    
    // This hook is now specific to this filtered view
    const useFilteredData = (allData, month, employee) => {
        return useMemo(() => {
            let filtered = allData;
            if (month !== 'semua') filtered = filtered.filter(item => item.BULAN === month);
            if (employee !== 'semua') filtered = filtered.filter(item => item.NAMA === employee);
            
            const aggregated = Array.from(filtered.reduce((map, row) => {
                const name = row.NAMA;
                if (!name) return map;
                if (!map.has(name)) {
                    map.set(name, { NAMA: name, DIVISI: row.DIVISI || 'N/A', JABATAN: row.JABATAN || 'N/A', TAHUN_MASUK: row.TAHUN_MASUK || 0, LAMA_BEKERJA: row.LAMA_BEKERJA || 0, HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0 });
                }
                const stats = map.get(name);
                stats.HARI_KERJA += row.HARI_KERJA;
                stats.TERLAMBAT += row.TERLAMBAT;
                stats.SURAT_DOKTER += row.SURAT_DOKTER;
                stats.IJIN_FULL += row.IJIN_FULL;
                stats.CUTI += row.CUTI;
                return map;
            }, new Map()).values());

            const kpis = {
                totalEmployees: new Set(filtered.map(item => item.NAMA)).size,
                totalTardiness: filtered.reduce((sum, item) => sum + item.TERLAMBAT, 0),
                totalAbsence: filtered.reduce((sum, item) => sum + item.SURAT_DOKTER + item.IJIN_FULL, 0),
                totalWorkDays: filtered.reduce((sum, item) => sum + item.HARI_KERJA, 0)
            };

            const topTardiness = [...aggregated].sort((a, b) => b.TERLAMBAT - a.TERLAMBAT).slice(0, 10);
            const absenceDistribution = { sakit: filtered.reduce((sum, item) => sum + item.SURAT_DOKTER, 0), izin: filtered.reduce((sum, item) => sum + item.IJIN_FULL, 0), cuti: filtered.reduce((sum, item) => sum + item.CUTI, 0) };
            
            const tableData = [...aggregated].sort((a, b) => a.NAMA.localeCompare(b.NAMA));
            
            const divisionalAnalysis = Object.values(aggregated.reduce((acc, emp) => {
                const div = emp.DIVISI || 'N/A';
                if (!acc[div]) acc[div] = { name: div, employeeCount: 0, totalTardiness: 0, totalLeave: 0, totalAbsence: 0 };
                acc[div].employeeCount++;
                acc[div].totalTardiness += emp.TERLAMBAT;
                acc[div].totalAbsence += emp.SURAT_DOKTER + emp.IJIN_FULL;
                acc[div].totalLeave += emp.CUTI;
                return acc;
            }, {})).sort((a, b) => a.name.localeCompare(b.name));

            const deepInsights = (() => {
                if (aggregated.length === 0) return null;

                const tenureGroups = {
                    new: { totalTardiness: 0, count: 0 }, // < 2 years
                    mid: { totalTardiness: 0, count: 0 }, // 2-5 years
                    senior: { totalTardiness: 0, count: 0 }, // > 5 years
                };
                aggregated.forEach(emp => {
                    const tenure = emp.LAMA_BEKERJA > 0 ? emp.LAMA_BEKERJA : (emp.TAHUN_MASUK > 0 ? new Date().getFullYear() - emp.TAHUN_MASUK : 0);
                    if (tenure < 2) { tenureGroups.new.totalTardiness += emp.TERLAMBAT; tenureGroups.new.count++; }
                    else if (tenure <= 5) { tenureGroups.mid.totalTardiness += emp.TERLAMBAT; tenureGroups.mid.count++; }
                    else { tenureGroups.senior.totalTardiness += emp.TERLAMBAT; tenureGroups.senior.count++; }
                });
                const avgNew = tenureGroups.new.count > 0 ? (tenureGroups.new.totalTardiness / tenureGroups.new.count) : 0;
                const avgMid = tenureGroups.mid.count > 0 ? (tenureGroups.mid.totalTardiness / tenureGroups.mid.count) : 0;
                const avgSenior = tenureGroups.senior.count > 0 ? (tenureGroups.senior.totalTardiness / tenureGroups.senior.count) : 0;
                let tenureTardinessMessage = `Rata-rata keterlambatan: Karyawan baru (${avgNew.toFixed(1)}x), Mid-level (${avgMid.toFixed(1)}x), Senior (${avgSenior.toFixed(1)}x).`;
                if (avgNew > avgMid && avgNew > avgSenior) { tenureTardinessMessage += " Karyawan baru cenderung lebih sering terlambat."; }
                else if (avgSenior > avgMid && avgSenior > avgNew) { tenureTardinessMessage += " Karyawan senior cenderung lebih sering terlambat."; }
                else { tenureTardinessMessage += " Tidak ada korelasi jelas antara lama kerja dan keterlambatan."; }

                const divPerf = divisionalAnalysis.map(div => ({ ...div, avgTardiness: div.employeeCount > 0 ? div.totalTardiness / div.employeeCount : 0 })).sort((a, b) => a.avgTardiness - b.avgTardiness);
                const bestDivision = divPerf.length > 0 ? divPerf[0] : null;
                const worstDivision = divPerf.length > 1 ? divPerf[divPerf.length - 1] : null;

                const sortedByDiscipline = [...aggregated].sort((a, b) => (a.TERLAMBAT + a.IJIN_FULL) - (b.TERLAMBAT + b.IJIN_FULL));
                const bestEmployee = sortedByDiscipline.length > 0 ? sortedByDiscipline[0] : null;

                return { tenureTardiness: tenureTardinessMessage, bestDivision, worstDivision, bestEmployee };
            })();
            
            return { kpis, topTardiness, absenceDistribution, tableData, divisionalAnalysis, deepInsights };
        }, [allData, month, employee]);
    };

    const { kpis, topTardiness, absenceDistribution, tableData, divisionalAnalysis, deepInsights } = useFilteredData(data, selectedMonth, selectedEmployee);
    const { availableMonths, availableEmployees } = useAttendanceData(data);

    const tardinessChartOptions = { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#4b5563' } }, y: { grid: { display: false }, ticks: { color: '#4b5563' } } }, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(17, 24, 39, 0.95)', titleColor: '#f3f4f6', bodyColor: '#f3f4f6', callbacks: { title: (ctx) => topTardiness[ctx[0].dataIndex]?.NAMA || '' } } } };
    const tardinessChartData = { labels: topTardiness.map(item => item.NAMA.length > 15 ? item.NAMA.substring(0, 15) + '...' : item.NAMA), datasets: [{ label: 'Jumlah Keterlambatan', data: topTardiness.map(item => item.TERLAMBAT), backgroundColor: 'rgba(3, 105, 161, 0.8)', borderColor: 'rgba(3, 105, 161, 1)', borderWidth: 1, borderRadius: 6 }] };
    const totalAbsence = Object.values(absenceDistribution).reduce((a, b) => a + b, 0);
    const absenceChartOptions = { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#4b5563', padding: 20 } }, tooltip: { backgroundColor: 'rgba(17, 24, 39, 0.95)', titleColor: '#f3f4f6', bodyColor: '#f3f4f6', callbacks: { label: (ctx) => `${ctx.label}: ${ctx.formattedValue} hari (${(totalAbsence > 0 ? ((ctx.parsed * 100) / totalAbsence).toFixed(1) : 0)}%)` } } } };
    const absenceChartData = { labels: ['Sakit (Surat Dokter)', 'Izin', 'Cuti'], datasets: [{ label: 'Jumlah Hari', data: [absenceDistribution.sakit, absenceDistribution.izin, absenceDistribution.cuti], backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(249, 115, 22, 0.8)', 'rgba(59, 130, 246, 0.8)'], borderColor: ['#ffffff', '#ffffff', '#ffffff'], borderWidth: 4 }] };

    const handleOverallAnalysisClick = () => {
        onAnalyzeOverall({ kpis, chartData: { topTardiness, absenceDistribution }, selectedMonth, selectedEmployee });
    };

    const handleDivisionClick = (divisionName) => {
        setExpandedDivision(prev => (prev === divisionName ? null : divisionName));
    };
    
    const handleExport = () => {
        exportService.exportToCsv(tableData, `rekap_absensi_${selectedMonth}.csv`);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm no-print">
                <div className="flex flex-col lg:flex-row flex-wrap gap-6 items-center">
                    {/* Filters */}
                    <div className="flex-1 w-full flex flex-col sm:flex-row gap-6">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Calendar className="w-6 h-6 text-sky-700 flex-shrink-0" />
                            <label htmlFor="month-filter" className="text-gray-700 font-medium whitespace-nowrap">Bulan:</label>
                            <div className="flex-1 min-w-0">
                                <AnimatedDropdown options={availableMonths} selectedValue={selectedMonth} onValueChange={setSelectedMonth} placeholder="Semua" includeAllOption={true} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <UserCheck className="w-6 h-6 text-sky-700 flex-shrink-0" />
                            <label htmlFor="employee-filter" className="text-gray-700 font-medium whitespace-nowrap">Karyawan:</label>
                            <div className="flex-1 min-w-0">
                                <AnimatedDropdown options={availableEmployees} selectedValue={selectedEmployee} onValueChange={setSelectedEmployee} placeholder="Semua" includeAllOption={true} />
                            </div>
                        </div>
                    </div>
                    {/* Buttons */}
                    <div className="flex-shrink-0 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                         <button onClick={handleOverallAnalysisClick} disabled={isAiLoading} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg">
                            <Sparkles className="w-5 h-5" />
                            {isAiLoading ? 'Menganalisis...' : 'Analisis Umum'}
                        </button>
                        <button onClick={handleExport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 shadow hover:shadow-lg">
                            <Download size={16}/> Ekspor Data
                        </button>
                    </div>
                </div>
            </div>
            
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><KpiCard icon={<Users />} title="Total Karyawan" value={kpis.totalEmployees} colorClass={{ bg: 'bg-sky-100', text: 'text-sky-700' }} /></motion.div>
                <motion.div variants={itemVariants}><KpiCard icon={<Clock />} title="Total Keterlambatan" value={kpis.totalTardiness} unit="kali" colorClass={{ bg: 'bg-orange-100', text: 'text-orange-600' }} /></motion.div>
                <motion.div variants={itemVariants}><KpiCard icon={<UserX />} title="Total Absensi" value={kpis.totalAbsence} unit="hari" colorClass={{ bg: 'bg-red-100', text: 'text-red-600' }} /></motion.div>
                <motion.div variants={itemVariants}><KpiCard icon={<Calendar />} title="Total Hari Kerja" value={kpis.totalWorkDays} colorClass={{ bg: 'bg-green-100', text: 'text-green-600' }} /></motion.div>
            </motion.div>
            
            {/* Deep Insights Section */}
            {deepInsights && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-sky-900 flex items-center gap-2">
                        <Zap className="text-yellow-500"/> Insight Mendalam
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                            <p className="font-semibold text-slate-700">Korelasi Lama Bekerja & Keterlambatan</p>
                            <p className="text-sm text-slate-600">{deepInsights.tenureTardiness}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                            <p className="font-semibold text-slate-700">Divisi Paling Disiplin</p>
                            <p className="text-sm text-slate-600">{deepInsights.bestDivision ? `${deepInsights.bestDivision.name} (Rata-rata telat: ${deepInsights.bestDivision.avgTardiness.toFixed(1)}x)` : 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                            <p className="font-semibold text-slate-700">Karyawan Paling Disiplin</p>
                            <p className="text-sm text-slate-600">{deepInsights.bestEmployee ? `${deepInsights.bestEmployee.NAMA} (Telat: ${deepInsights.bestEmployee.TERLAMBAT}x)` : 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                            <p className="font-semibold text-slate-700">Divisi Perlu Perhatian</p>
                            <p className="text-sm text-slate-600">{deepInsights.worstDivision && deepInsights.worstDivision.name !== deepInsights.bestDivision.name ? `${deepInsights.worstDivision.name} (Rata-rata telat: ${deepInsights.worstDivision.avgTardiness.toFixed(1)}x)` : 'Semua divisi menunjukkan performa serupa.'}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold mb-6 text-sky-900 flex items-center">
                        <div className="w-3 h-3 bg-sky-600 rounded-full mr-3"></div>
                        Top 10 Karyawan Terlambat
                    </h3>
                    <ChartWrapper chartId="chart-tardiness" type="bar" data={tardinessChartData} options={tardinessChartOptions} fallbackText={{icon: <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />, text: "Tidak ada data keterlambatan"}} />
                </div>
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold mb-6 text-sky-900 flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                        Distribusi Tipe Absensi
                    </h3>
                    <ChartWrapper chartId="chart-absence" type="doughnut" data={absenceChartData} options={absenceChartOptions} fallbackText={{icon: <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />, text: "Tidak ada data absensi"}} />
                </div>
            </div>
            
            {/* Divisional Analysis Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-6 text-sky-900">Analisis per Divisi</h3>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                    {divisionalAnalysis.map(div => (
                        <motion.div key={div.name} variants={itemVariants}>
                            <div onClick={() => handleDivisionClick(div.name)} className={`bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-pointer transition-all duration-300 ${expandedDivision === div.name ? 'ring-2 ring-sky-500' : 'hover:border-sky-400'}`}>
                                <h4 className="font-semibold text-lg text-sky-800 mb-3 flex items-center">
                                    <Briefcase size={20} className="mr-2"/>
                                    {div.name}
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 flex items-center">
                                            <Users size={14} className="mr-2"/>Jml Karyawan
                                        </span>
                                        <span className="font-medium text-gray-800">{div.employeeCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 flex items-center">
                                            <Clock size={14} className="mr-2"/>Total Terlambat
                                        </span>
                                        <span className="font-medium text-gray-800">{div.totalTardiness} kali</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 flex items-center">
                                            <Clock size={14} className="mr-2"/>Rata-rata Terlambat
                                        </span>
                                        <span className="font-medium text-gray-800">{div.employeeCount > 0 ? (div.totalTardiness / div.employeeCount).toFixed(1) : 0} / kary.</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 flex items-center">
                                            <UserMinus size={14} className="mr-2"/>Total Cuti
                                        </span>
                                        <span className="font-medium text-gray-800">{div.totalLeave} hari</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
                <AnimatePresence>
                {expandedDivision && (
                    <motion.div 
                        className="mt-6 border-t pt-6"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-sky-900">Detail Karyawan Divisi: {expandedDivision}</h4>
                            <button onClick={() => exportService.exportToCsv(tableData.filter(emp => emp.DIVISI === expandedDivision), `detail_divisi_${expandedDivision}.csv`)} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 text-xs rounded-lg flex items-center gap-1 no-print">
                                <Download size={14}/> Ekspor Divisi
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                                        <th className="p-3 text-sm font-semibold text-gray-600">Nama Karyawan</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 text-center">Terlambat</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 text-center">Absen (Sakit/Izin)</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 text-center no-print">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.filter(emp => emp.DIVISI === expandedDivision).map(employee => (
                                        <tr key={employee.NAMA} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="p-3 font-medium text-gray-800">{employee.NAMA}</td>
                                            <td className="p-3 text-center text-gray-700">{employee.TERLAMBAT}</td>
                                            <td className="p-3 text-center text-gray-700">{employee.SURAT_DOKTER + employee.IJIN_FULL}</td>
                                            <td className="p-3 no-print flex justify-center items-center">
                                                <button onClick={() => onAnalyzeIndividual(employee)} disabled={isAiLoading} className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1 px-3 text-xs rounded-lg transition-all flex items-center gap-1 disabled:opacity-50">
                                                    <Sparkles size={14}/> Analisis
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};


const Sidebar = ({ employees, activeView, onViewChange, onReset, isSidebarCollapsed, onToggleCollapse }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return employees;
        return employees.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [employees, searchTerm]);

    return (
        <div className="bg-slate-800 text-slate-200 flex flex-col h-full">
            <div className={`p-4 border-b border-slate-700 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                 <h1 className={`text-2xl font-bold text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>Dashboard HR</h1>
                <button onClick={onToggleCollapse} className="p-1 rounded-lg hover:bg-slate-700">
                    {isSidebarCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
                </button>
            </div>
            <nav className="p-4 space-y-2">
                <button onClick={() => onViewChange('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed && 'justify-center'} ${activeView === 'dashboard' ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>
                    <LayoutDashboard className="w-5 h-5" />
                    {!isSidebarCollapsed && <span>Dashboard Umum</span>}
                </button>
                <button onClick={() => onViewChange('analytics')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed && 'justify-center'} ${activeView === 'analytics' ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>
                    <TrendingUp className="w-5 h-5" />
                    {!isSidebarCollapsed && <span>Analisis & Insight</span>}
                </button>
                <button onClick={() => onViewChange('comparison')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed && 'justify-center'} ${activeView === 'comparison' ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>
                    <GitCompareArrows className="w-5 h-5" />
                    {!isSidebarCollapsed && <span>Perbandingan Periode</span>}
                </button>
            </nav>
            <div className={`flex-grow flex flex-col p-4 border-t border-slate-700 overflow-hidden`}>
                <h2 className={`text-sm font-semibold text-slate-400 mb-2 whitespace-nowrap ${isSidebarCollapsed ? 'hidden' : ''}`}>DETAIL KARYAWAN</h2>
                <div className={`relative mb-4 ${isSidebarCollapsed ? 'hidden' : ''}`}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" placeholder="Cari karyawan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <ul className={`flex-grow space-y-1 overflow-y-auto ${isSidebarCollapsed ? 'hidden' : ''}`}>
                    {filteredEmployees.map(name => (
                        <li key={name}>
                            <button onClick={() => onViewChange(name)} className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${activeView === name ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>
                                <span>{name}</span>
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="p-4 mt-auto border-t border-slate-700 space-y-2">
                <button onClick={() => window.print()} className={`w-full flex items-center gap-2 py-2 px-5 rounded-xl transition-all duration-300 bg-sky-600 hover:bg-sky-700 text-white font-semibold transform hover:scale-105 shadow hover:shadow-lg ${isSidebarCollapsed ? 'justify-center' : 'justify-center'}`}>
                    <Printer className="w-5 h-5" />
                    <span className={isSidebarCollapsed ? 'hidden' : ''}>Cetak Laporan</span>
                </button>
                <button onClick={onReset} className={`w-full flex items-center gap-2 py-2 px-5 rounded-xl transition-all duration-300 bg-red-500 hover:bg-red-600 text-white font-semibold transform hover:scale-105 shadow hover:shadow-lg ${isSidebarCollapsed ? 'justify-center' : 'justify-center'}`}>
                    <Upload className="w-5 h-5" />
                    <span className={isSidebarCollapsed ? 'hidden' : ''}>Unggah Baru</span>
                </button>
            </div>
        </div>
    );
};

const DashboardLayout = ({ data, onReset, onAnalyzeIndividual, onAnalyzeOverall, isAiLoading, onAnalyzeComparison, isLoading }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'analytics', 'comparison', or employee name
    const { getEmployeeByName, availableEmployees, availableMonths } = useAttendanceData(data);

    const selectedEmployeeData = useMemo(() => {
        if (activeView !== 'dashboard' && activeView !== 'analytics' && activeView !== 'comparison') {
            return getEmployeeByName(activeView);
        }
        return null;
    }, [activeView, getEmployeeByName]);

    if (isLoading) {
        return (
            <div className="flex h-screen bg-slate-100">
                <aside className={`flex-shrink-0 no-print transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
                    <Sidebar 
                        employees={[]} 
                        activeView={activeView} 
                        onViewChange={setActiveView} 
                        onReset={onReset}
                        isSidebarCollapsed={isSidebarCollapsed}
                        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    />
                </aside>
                <main className="flex-1 p-8 overflow-y-auto">
                    <OverallDashboardSkeleton />
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-100">
            <aside className={`flex-shrink-0 no-print transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
                <Sidebar 
                    employees={availableEmployees} 
                    activeView={activeView} 
                    onViewChange={setActiveView} 
                    onReset={onReset}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
            </aside>
            <main className="flex-1 p-8 overflow-y-auto print-main">
                <AnimatePresence mode="wait">
                    {activeView === 'dashboard' && <OverallDashboard key="dashboard" data={data} onAnalyzeIndividual={onAnalyzeIndividual} onAnalyzeOverall={onAnalyzeOverall} isAiLoading={isAiLoading} />}
                    {activeView === 'analytics' && <AnalyticsPage key="analytics" data={data} />}
                    {activeView === 'comparison' && <ComparisonPage key="comparison" data={data} availableMonths={availableMonths} onAnalyze={onAnalyzeComparison} isAiLoading={isAiLoading} />}
                    {selectedEmployeeData && <EmployeeDetailView key={selectedEmployeeData.NAMA} employee={selectedEmployeeData} onAnalyze={onAnalyzeIndividual} isAiLoading={isAiLoading} />}
                </AnimatePresence>
            </main>
        </div>
    );
};


//================================================================
// 4. MAIN APP COMPONENT (CONTROLLER)
//================================================================

const App = () => {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [allData, setAllData] = useState([]);
  const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '' });
  const [aiModal, setAiModal] = useState({ show: false, title: '', content: '', isLoading: false });

  useEffect(() => { 
    const loadDependencies = async () => { 
      try { 
        if (window.Papa && window.Chart) { 
          setScriptsLoaded(true); 
          return; 
        } 
        await Promise.all([ 
          loadScript("https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js"), 
          loadScript("https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js") 
        ]); 
        setScriptsLoaded(true); 
      } catch (error) { 
        console.error("Failed to load scripts:", error); 
        showError("Gagal memuat library eksternal. Silakan muat ulang halaman.", "Kesalahan Pemuatan"); 
      } 
    }; 
    loadDependencies(); 
  }, []);
  
  const showError = useCallback((message, title = 'Pemberitahuan') => { 
    setErrorModal({ show: true, title, message }); 
  }, []);
  
  const hideError = useCallback(() => setErrorModal({ show: false, title: '', message: '' }), []);
  
  const validateFile = useCallback((file) => { 
    if (!file) { 
      showError('Tidak ada file yang dipilih.', 'File Tidak Valid'); 
      return false; 
    } 
    if (!file.name.toLowerCase().endsWith('.csv')) { 
      showError('Format file tidak valid. Harap unggah file dengan format .csv', 'Format Salah'); 
      return false; 
    } 
    if (file.size > 10 * 1024 * 1024) { 
      showError('Ukuran file terlalu besar. Maksimal 10MB.', 'File Terlalu Besar'); 
      return false; 
    } 
    return true; 
  }, [showError]);
  
  const handleFileSelect = useCallback((file) => { 
    if (!scriptsLoaded || !validateFile(file)) return; 
    setIsLoading(true);

    setTimeout(() => {
        csvParserService.parse( 
          file, 
          (processedData) => { 
            setAllData(processedData); 
            setShowDashboard(true);
            setIsLoading(false); 
          }, 
          (error) => { 
            setIsLoading(false); 
            showError(error.message, 'Kesalahan Parsing'); 
          } 
        ); 
    }, 500);
  }, [validateFile, scriptsLoaded, showError]);
  
  const resetDashboard = useCallback(() => { 
    setAllData([]); 
    setShowDashboard(false); 
  }, []);

  const handleGetOverallAnalysis = useCallback(async ({ kpis, chartData, selectedMonth, selectedEmployee }) => {
    setAiModal({ show: true, title: 'Analisis & Rekomendasi Umum', content: '', isLoading: true });
    const filterInfo = selectedMonth === 'semua' ? 'semua periode' : `bulan ${selectedMonth}`;
    const employeeInfo = selectedEmployee === 'semua' ? 'seluruh karyawan' : `karyawan bernama ${selectedEmployee}`;
    const prompt = `Anda adalah seorang analis HR. Berdasarkan data absensi untuk ${filterInfo} yang mencakup ${employeeInfo}, berikan analisis dalam format markdown Bahasa Indonesia:
      - **Data Ringkas:** Total Karyawan: ${kpis.totalEmployees}, Total Keterlambatan: ${kpis.totalTardiness} kali, Total Absensi: ${kpis.totalAbsence} hari.
      - **Distribusi Absensi:** Sakit ${chartData.absenceDistribution.sakit} hari, Izin ${chartData.absenceDistribution.izin} hari, Cuti ${chartData.absenceDistribution.cuti} hari.
      - **Karyawan Paling Sering Terlambat:** ${JSON.stringify(chartData.topTardiness.map(e => ({ nama: e.NAMA, total: e.TERLAMBAT })))}
      ### **Insight Utama per Divisi**
      (Analisis singkat kekuatan dan kelemahan tiap divisi berdasarkan data di atas)
      ### **Rekomendasi Aksi Umum**
      (3 rekomendasi konkret untuk manajemen guna meningkatkan kehadiran secara keseluruhan)`;
    try { 
      const result = await geminiService.getAnalysis(prompt); 
      setAiModal(prev => ({ ...prev, content: result, isLoading: false })); 
    } catch (error) { 
      setAiModal(prev => ({ ...prev, content: `<p class="text-red-500">${error.message}</p>`, isLoading: false })); 
    }
  }, []);
  
  const handleGetIndividualAnalysis = useCallback(async (employee) => {
      setAiModal({ show: true, title: `Analisis Kinerja: ${employee.NAMA}`, content: '', isLoading: true });
      const lamaBekerjaString = employee.LAMA_BEKERJA > 0 ? `${employee.LAMA_BEKERJA} tahun` : (employee.TAHUN_MASUK > 0 ? `${new Date().getFullYear() - employee.TAHUN_MASUK} tahun (Masuk ${employee.TAHUN_MASUK})` : 'N/A');
      const prompt = `
      Anda adalah seorang Manajer HR yang sedang melakukan review kinerja. Berdasarkan data absensi karyawan berikut:
      - **Nama:** ${employee.NAMA} - **Divisi:** ${employee.DIVISI} - **Jabatan:** ${employee.JABATAN}
      - **Lama Bekerja:** ${lamaBekerjaString} - **Total Hari Kerja (Filter Aktif):** ${employee.HARI_KERJA} hari
      - **Total Keterlambatan:** ${employee.TERLAMBAT} kali - **Total Absen Sakit:** ${employee.SURAT_DOKTER} hari
      - **Total Absen Izin:** ${employee.IJIN_FULL} hari - **Total Cuti Diambil:** ${employee.CUTI} hari
      Tolong berikan analisis kinerja individu dalam format markdown Bahasa Indonesia:
      ### **Ringkasan Kinerja Kehadiran**
      (Berikan ringkasan singkat tentang pola kehadiran karyawan ini.)
      ### **Poin Positif (Kekuatan)**
      (Sebutkan 2-3 poin kekuatan utama dari karyawan ini berdasarkan data.)
      ### **Area untuk Peningkatan**
      (Sebutkan 1-2 area utama yang perlu ditingkatkan.)
      ### **Rekomendasi & Langkah Selanjutnya**
      (Berikan 1-2 rekomendasi yang dapat ditindaklanjuti untuk karyawan ini.)`;
      try { 
        const result = await geminiService.getAnalysis(prompt); 
        setAiModal(prev => ({ ...prev, content: result, isLoading: false })); 
      } catch (error) { 
        setAiModal(prev => ({ ...prev, content: `<p class="text-red-500">${error.message}</p>`, isLoading: false })); 
      }
  }, []);

  const handleGetComparisonAnalysis = useCallback(async ({ periodA, periodB, statsA, statsB }) => {
      setAiModal({ show: true, title: `Analisis Perbandingan: ${periodA} vs ${periodB}`, content: '', isLoading: true });
      const prompt = `
      Anda adalah seorang analis HR. Lakukan analisis perbandingan data kehadiran antara dua periode: ${periodA} (Periode A) dan ${periodB} (Periode B).

      **Data Periode A (${periodA}):**
      - Total Keterlambatan: ${statsA.tardiness} kali
      - Total Absensi (Sakit/Izin): ${statsA.absence} hari
      - Total Hari Kerja: ${statsA.workDays} hari
      - Jumlah Karyawan: ${statsA.employees} orang

      **Data Periode B (${periodB}):**
      - Total Keterlambatan: ${statsB.tardiness} kali
      - Total Absensi (Sakit/Izin): ${statsB.absence} hari
      - Total Hari Kerja: ${statsB.workDays} hari
      - Jumlah Karyawan: ${statsB.employees} orang

      Berdasarkan data di atas, berikan analisis dalam format markdown Bahasa Indonesia:
      ### **Ringkasan Perbandingan**
      (Bandingkan metrik utama secara singkat. Sebutkan apakah ada peningkatan atau penurunan pada keterlambatan dan absensi.)
      ### **Insight Utama**
      (Identifikasi 2-3 perubahan paling signifikan antara dua periode. Apakah ada tren yang muncul?)
      ### **Rekomendasi Aksi**
      (Berikan 1-2 rekomendasi konkret berdasarkan perbandingan data. Misalnya, jika keterlambatan meningkat, apa yang harus dilakukan?)`;
      try { 
        const result = await geminiService.getAnalysis(prompt); 
        setAiModal(prev => ({ ...prev, content: result, isLoading: false })); 
      } catch (error) { 
        setAiModal(prev => ({ ...prev, content: `<p class="text-red-500">${error.message}</p>`, isLoading: false })); 
      }
  }, []);

  const PrintStyles = () => (
    <style>{`
      @media print {
        body {
          background-color: #fff !important;
        }
        .no-print {
          display: none !important;
        }
        .print-main {
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
          height: auto !important;
        }
        .printable-content {
          box-shadow: none !important;
          border: 1px solid #ddd !important;
        }
        .bg-white {
           box-shadow: none !important;
           border: 1px solid #eee !important;
        }
      }
    `}</style>
  );

  if (!showDashboard) {
    return (
      <>
        <FileUploadScreen onFileSelect={handleFileSelect} isLoading={isLoading} scriptsLoaded={scriptsLoaded} />
        <Modal show={errorModal.show} title={errorModal.title} message={errorModal.message} onClose={hideError} />
      </>
    );
  }

  return (
    <>
      <PrintStyles />
      <DashboardLayout 
        data={allData} 
        onReset={resetDashboard}
        onAnalyzeIndividual={handleGetIndividualAnalysis}
        onAnalyzeOverall={handleGetOverallAnalysis}
        onAnalyzeComparison={handleGetComparisonAnalysis}
        isAiLoading={aiModal.isLoading}
        isLoading={isLoading}
      />
      <Modal show={errorModal.show} title={errorModal.title} message={errorModal.message} onClose={hideError} />
      <AiAnalysisModal 
        show={aiModal.show} 
        title={aiModal.title} 
        content={aiModal.content} 
        isLoading={aiModal.isLoading} 
        onClose={() => setAiModal({ show: false, title: '', content: '', isLoading: false })} 
      />
    </>
  );
};

export default App;
