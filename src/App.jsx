import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext } from 'react';
import { Upload, Users, Clock, UserX, Calendar, FileText, RefreshCw, X, UserCheck, Sparkles, LoaderCircle, BarChart2, Briefcase, UserMinus, TrendingUp, Award, AlertTriangle, Search, LayoutDashboard, ChevronsRight, Zap, Download, GitCompareArrows, ArrowUp, ArrowDown, Minus, Printer, ChevronsLeft, ChevronDown, Moon, Sun, BrainCircuit, DollarSign, Target, Info, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

//================================================================
// CONTEXT SETUP
//================================================================

const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e) => {
            setTheme(e.matches ? 'dark' : 'light');
        };

        try {
             mediaQuery.addEventListener('change', handleChange);
        } catch (e) {
             mediaQuery.addListener(handleChange);
        }

        return () => {
            try {
                mediaQuery.removeEventListener('change', handleChange);
            } catch (e) {
                mediaQuery.removeListener(handleChange);
            }
        };
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

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
        // FIX: Provide a more descriptive error message on failure
        script.onerror = () => reject(new Error(`Gagal memuat skrip: ${src}`));
        document.head.appendChild(script);
    });
};

const monthMapping = {
    'januari': 1, 'jan': 1, 'februari': 2, 'feb': 2, 'maret': 3, 'mar': 3, 'april': 4, 'apr': 4, 'mei': 5,
    'juni': 6, 'jun': 6, 'juli': 7, 'jul': 7, 'agustus': 8, 'agu': 8, 'ags': 8, 'aug': 8, 'september': 9, 'sep': 9,
    'oktober': 10, 'okt': 10, 'november': 11, 'nov': 11, 'desember': 12, 'des': 12, 'dec': 12, 'december': 12
};
const getMonthNumber = (monthName) => {
    if (!monthName) return 0;
    const lowerMonth = String(monthName).toLowerCase().trim();
    return monthMapping[lowerMonth] || 0;
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
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
        const numericColumns = ['SURAT_DOKTER', 'IJIN_FULL', 'TERLAMBAT', 'CUTI', 'SISA_CUTI', 'HARI_KERJA', 'TAHUN_MASUK', 'LAMA_BEKERJA', 'GAJI_POKOK', 'TAHUN'];
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
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
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
    },
    exportToPdf: (title, headers, data, filename = 'laporan.pdf') => {
        // FIX: Add check for autoTable plugin
        if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.jsPDF.autoTable) {
            console.error("Layanan ekspor PDF belum siap, plugin autoTable mungkin gagal dimuat.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Laporan dibuat pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);

        doc.autoTable({
            head: [headers],
            body: data,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
        });

        doc.save(filename);
    }
};

const mlModelService = {
    predictLeave: async (employee) => {
        const FASTAPI_URL = 'http://127.0.0.1:8000/predict';

        const payload = {
            surat_dokter: employee.SURAT_DOKTER || 0,
            ijin_full: employee.IJIN_FULL || 0,
            terlambat: employee.TERLAMBAT || 0,
            cuti: employee.CUTI || 0,
            sisa_cuti: employee.SISA_CUTI || 0,
            hari_kerja: employee.HARI_KERJA || 0,
            bulan: new Date().getMonth() + 1,
            tahun: new Date().getFullYear(),
            tahun_masuk: employee.TAHUN_MASUK || 0,
            lama_bekerja: employee.LAMA_BEKERJA || 0,
            divisi: employee.DIVISI || 'N/A',
            jabatan: employee.JABATAN || 'N/A'
        };
        
        console.log("Mengirim payload ke FastAPI:", payload);

        try {
            const response = await fetch(FASTAPI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 422 && errorData.detail) {
                    const errorMessages = errorData.detail.map(err => `Field '${err.loc[1]}' ${err.msg}`).join('; ');
                    throw new Error(`Data yang dikirim tidak valid. Detail: ${errorMessages}`);
                }
                throw new Error(errorData.detail || `Terjadi kesalahan pada server: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error("ML Model Service Error:", error);
            throw error;
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
            if(row.SISA_CUTI) acc.SISA_CUTI = row.SISA_CUTI;
            if(row.TAHUN_MASUK) acc.TAHUN_MASUK = row.TAHUN_MASUK;
            if(row.LAMA_BEKERJA) acc.LAMA_BEKERJA = row.LAMA_BEKERJA;
            return acc;
        }, {
            NAMA: name,
            DIVISI: records[0].DIVISI || 'N/A',
            JABATAN: records[0].JABATAN || 'N/A',
            TAHUN_MASUK: records[0].TAHUN_MASUK || 0,
            LAMA_BEKERJA: records[0].LAMA_BEKERJA || 0,
            GAJI_POKOK: records[0].GAJI_POKOK || 0,
            HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0, SISA_CUTI: records[0].SISA_CUTI || 0
        });
        return employeeData;
    }, [allData]);

    const availableYears = useMemo(() => {
        return [...new Set(allData.map(item => item.TAHUN))].filter(Boolean).sort((a, b) => b - a);
    }, [allData]);

    const availableMonths = useMemo(() => {
        return [...new Set(allData.map(item => item.BULAN))].filter(Boolean).sort((a, b) => getMonthNumber(a) - getMonthNumber(b));
    }, [allData]);

    const availableEmployees = useMemo(() => {
        return [...new Set(allData.map(item => item.NAMA))].filter(Boolean).sort();
    }, [allData]);
    
    const availableDivisions = useMemo(() => {
        return [...new Set(allData.map(item => item.DIVISI))].filter(Boolean).sort();
    }, [allData]);

    return { getEmployeeByName, availableYears, availableMonths, availableEmployees, availableDivisions, allData };
};

//================================================================
// 3. UI COMPONENTS
//================================================================

const GlobalScrollbarStyles = () => {
    const scrollbarStyles = `
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background-color: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            border-radius: 10px;
            border: 2px solid transparent;
            background-clip: content-box;
        }

        /* Light Theme Scrollbar */
        .light .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #cbd5e1; /* slate-300 */
        }
        .light .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #94a3b8; /* slate-400 */
        }

        /* Dark Theme Scrollbar */
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #475569; /* slate-600 */
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #64748b; /* slate-500 */
        }
    `;

    return <style>{scrollbarStyles}</style>;
};

const CustomScrollbar = ({ children, className, ...props }) => {
    return (
        <div className={`custom-scrollbar h-full overflow-y-auto ${className || ''}`} {...props}>
            {children}
        </div>
    );
};

const Skeleton = ({ className }) => <div className={`bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md ${className}`} />;

const KpiCardSkeleton = () => (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
        </div>
    </div>
);

const ChartSkeleton = () => (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <Skeleton className="h-6 w-1/3 mb-6" />
        <Skeleton className="h-80 w-full" />
    </div>
);

const TableSkeleton = () => (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
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
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
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
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300 overflow-y-auto">
            <div className="text-center mb-12">
                <FileText className="w-16 h-16 mx-auto text-sky-600 dark:text-sky-400 mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold text-sky-900 dark:text-white mb-6">Dashboard Analisis</h1>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Absensi Karyawan</h2>
                <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">Unggah file CSV Anda untuk mendapatkan wawasan mendalam dan analisis AI tentang pola kehadiran tim Anda.</p>
            </div>
            <div className="max-w-2xl w-full mx-auto">
                {!scriptsLoaded ? (
                    <div className="text-center">
                        <div className="inline-flex items-center px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm">
                            <RefreshCw className="w-5 h-5 mr-3 animate-spin text-sky-600 dark:text-sky-400" />
                            <span className="text-gray-600 dark:text-gray-300">Mempersiapkan aplikasi...</span>
                        </div>
                    </div>
                ) : (
                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group ${dragOver ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 scale-105' : 'border-gray-300 dark:border-gray-600 hover:border-sky-600 dark:hover:border-sky-400 hover:bg-white dark:hover:bg-slate-800'}`}
                        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <input type="file" id="file-input" className="hidden" accept=".csv" onChange={handleFileInputChange} disabled={!scriptsLoaded} />
                        <div className="flex flex-col items-center">
                            <div className={`p-3 rounded-full mb-4 transition-all duration-300 ${dragOver ? 'bg-sky-100 dark:bg-sky-900 scale-110' : 'bg-gray-100 dark:bg-slate-700 group-hover:bg-sky-100 dark:group-hover:bg-sky-900'}`}>
                                <Upload className={`w-10 h-10 transition-colors duration-300 ${dragOver ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-sky-600 dark:group-hover:text-sky-400'}`} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{dragOver ? 'Lepaskan file di sini' : 'Seret & lepas file CSV'}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">atau</p>
                            <button className="bg-sky-700 hover:bg-sky-800 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">Pilih File</button>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Mendukung file CSV maks. 10MB</p>
                        </div>
                    </div>
                )}
                {isLoading && (
                    <div className="text-center mt-8">
                        <div className="inline-flex items-center px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm">
                            <RefreshCw className="w-5 h-5 mr-3 animate-spin text-sky-600 dark:text-sky-400" />
                            <span className="text-gray-600 dark:text-gray-300">Memproses data...</span>
                        </div>
                    </div>
                )}
            </div>
            
            <motion.div 
                className="mt-20 max-w-4xl w-full text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-8">Fitur Unggulan Kami</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-full mb-4">
                            <Sparkles className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                        </div>
                        <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Analisis AI Mendalam</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Dapatkan wawasan dan rekomendasi yang dapat ditindaklanjuti secara otomatis dari data Anda.</p>
                    </div>
                    <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                        <div className="p-3 bg-sky-100 dark:bg-sky-900/50 rounded-full mb-4">
                            <BarChart2 className="w-8 h-8 text-sky-500 dark:text-sky-400" />
                        </div>
                        <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Visualisasi Interaktif</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Jelajahi data kehadiran melalui grafik dan bagan yang dinamis dan mudah dipahami.</p>
                    </div>
                    <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full mb-4">
                            <BrainCircuit className="w-8 h-8 text-green-500 dark:text-green-400" />
                        </div>
                        <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Prediksi Cuti</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Antisipasi kebutuhan cuti karyawan dengan model prediktif berbasis machine learning.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const KpiCard = ({ icon, title, value, unit, colorClass, small = false }) => (
    <div className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-colors duration-300 ${small ? 'p-4' : 'p-6'}`}>
        <div className={`p-3 rounded-xl ${colorClass.bg} ${small ? 'p-2' : 'p-3'}`}>
            {React.cloneElement(icon, { className: ` ${colorClass.text} ${small ? 'w-6 h-6' : 'w-8 h-8'}` })}
        </div>
        <div>
            <p className={`text-gray-600 dark:text-gray-400 font-medium ${small ? 'text-xs' : 'text-sm'}`}>{title}</p>
            <p className={`font-bold text-gray-800 dark:text-gray-200 ${small ? 'text-2xl' : 'text-3xl'}`}>{value} {unit && <span className={small ? 'text-base' : 'text-lg'}>{unit}</span>}</p>
        </div>
    </div>
);

const ChartWrapper = ({ chartId, type, data, options, fallbackText }) => {
    const chartRef = useRef(null);
    const canvasRef = useRef(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (!window.Chart || !canvasRef.current) return;
        if (chartRef.current) chartRef.current.destroy();
        if (!data || (data.datasets && data.datasets.every(ds => ds.data.every(d => d === 0)))) {
            return;
        }

        const isDark = theme === 'dark';
        const tickColor = isDark ? '#9ca3af' : '#4b5563';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        const legendColor = isDark ? '#d1d5db' : '#374151';
        const tooltipBgColor = isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(17, 24, 39, 0.95)';

        const finalOptions = JSON.parse(JSON.stringify(options));

        finalOptions.plugins = {
            ...finalOptions.plugins,
            legend: {
                ...finalOptions.plugins?.legend,
                labels: {
                    ...finalOptions.plugins?.legend?.labels,
                    color: legendColor,
                },
            },
            tooltip: {
                ...finalOptions.plugins?.tooltip,
                backgroundColor: tooltipBgColor,
                titleColor: '#f3f4f6',
                bodyColor: '#f3f4f6',
            },
        };

        if (finalOptions.scales) {
            Object.keys(finalOptions.scales).forEach((axis) => {
                finalOptions.scales[axis] = {
                    ...finalOptions.scales[axis],
                    ticks: {
                        ...finalOptions.scales[axis]?.ticks,
                        color: tickColor,
                    },
                    grid: {
                        ...finalOptions.scales[axis]?.grid,
                        color: gridColor,
                    },
                };
            });
        }

        try {
            chartRef.current = new window.Chart(canvasRef.current, { type, data, options: finalOptions });
        } catch (error) {
            console.error("Chart.js error:", error);
        }
        
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [type, data, options, theme]);

    const hasData = data && data.datasets && data.datasets.some(ds => ds.data.some(d => d > 0));
    return (
        <div className="h-full w-full relative">
            {hasData ? (
                <canvas id={chartId} ref={canvasRef}></canvas>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                    <div className="text-center">
                        {fallbackText.icon}
                        <p>{fallbackText.text}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const Modal = ({ show, title, message, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-300">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{message}</p>
                </div>
                <div className="flex justify-end p-4 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
                    <button onClick={onClose} className="bg-sky-700 hover:bg-sky-800 text-white font-medium py-2 px-6 rounded-lg">OK</button>
                </div>
            </div>
        </div>
    );
};

const AiAnalysisModal = ({ show, title, content, isLoading, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-colors duration-300">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-sky-900 dark:text-sky-300 flex items-center gap-3">
                        <Sparkles className="text-orange-500" />{title}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading ? <AiAnalysisSkeleton /> : (
                        <div className="prose prose-sm md:prose-base max-w-none text-gray-700 dark:text-gray-300 dark:prose-invert" dangerouslySetInnerHTML={{ __html: content.replace(/### \*\*(.*?)\*\*/g, `<h3 class="text-lg font-semibold text-sky-800 dark:text-sky-400 mt-4 mb-2">$1</h3>`).replace(/\*\*(.*?)\*\*/g, `<strong class="text-gray-900 dark:text-white">$1</strong>`).replace(/\n/g, `<br />`) }}></div>
                    )}
                </div>
                <div className="flex justify-end p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
                    <button onClick={onClose} className="bg-sky-700 hover:bg-sky-800 text-white font-medium py-2 px-6 rounded-lg">Tutup</button>
                </div>
            </div>
        </div>
    );
};

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
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-sky-500 flex justify-between items-center transition-colors duration-300"
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
                        className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar"
                    >
                        {includeAllOption && (
                            <li
                                onClick={() => handleSelect('semua')}
                                className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-sky-100 dark:hover:bg-sky-800 cursor-pointer"
                            >
                                {placeholder}
                            </li>
                        )}
                        {options.map(option => (
                            <li
                                key={option}
                                onClick={() => handleSelect(option)}
                                className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-sky-100 dark:hover:bg-sky-800 cursor-pointer"
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

const SearchableDropdown = ({ options, selectedValue, onValueChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
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
        setSearchTerm("");
    };

    const filteredOptions = useMemo(() =>
        options.filter(option =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
        ), [options, searchTerm]);

    const displayValue = selectedValue || placeholder;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-sky-500 flex justify-between items-center transition-colors duration-300"
            >
                <span className="truncate">{displayValue}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="w-5 h-5" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg"
                    >
                        <div className="p-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama..."
                                    className="w-full bg-slate-100 dark:bg-slate-600 border-none rounded-md pl-9 pr-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <ul className="max-h-52 overflow-y-auto custom-scrollbar">
                            {filteredOptions.length > 0 ? filteredOptions.map(option => (
                                <li
                                    key={option}
                                    onClick={() => handleSelect(option)}
                                    className="px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-sky-100 dark:hover:bg-sky-800 cursor-pointer"
                                >
                                    {option}
                                </li>
                            )) : (
                                <li className="px-4 py-2 text-gray-500 text-sm">Tidak ada hasil</li>
                            )}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const EmployeeSalaryCalculator = ({ employeeData, numberOfMonths }) => {
    const salaryDetails = useMemo(() => {
        if (!employeeData) {
            return {
                basicSalary: 0, mealAllowance: 0, transportAllowance: 0, incentive: 0,
                totalAllowances: 0, grossSalary: 0, lateDeduction: 0, sickDeduction: 0,
                permitDeduction: 0, totalDeductions: 0, finalSalary: 0
            };
        }
        const mealAllowance = (employeeData.HARI_KERJA || 0) * 20000;
        const transportAllowance = (employeeData.HARI_KERJA || 0) * 10000;
        const incentive = 100000 * numberOfMonths;
        const totalAllowances = mealAllowance + transportAllowance + incentive;

        const lateDeduction = (employeeData.TERLAMBAT || 0) * 5000;
        const sickDeduction = (employeeData.SURAT_DOKTER || 0) * 10000;
        const permitDeduction = (employeeData.IJIN_FULL || 0) * 10000;
        const totalDeductions = lateDeduction + sickDeduction + permitDeduction;

        const basicSalary = employeeData.GAJI_POKOK || 0;
        const grossSalary = basicSalary + totalAllowances;
        const finalSalary = grossSalary - totalDeductions;

        return {
            basicSalary, mealAllowance, transportAllowance, incentive, totalAllowances,
            grossSalary, lateDeduction, sickDeduction, permitDeduction, totalDeductions, finalSalary,
            numberOfMonths
        };
    }, [employeeData, numberOfMonths]);

    if (!employeeData || employeeData.HARI_KERJA === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
            <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-500" />
                Kalkulator Gaji & Denda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Pendapatan */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-slate-700">Pendapatan</h4>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Gaji Pokok</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatCurrency(salaryDetails.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tunjangan Makan</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatCurrency(salaryDetails.mealAllowance)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tunjangan Transport</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatCurrency(salaryDetails.transportAllowance)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Insentif ({salaryDetails.numberOfMonths} bulan)</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatCurrency(salaryDetails.incentive)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg mt-2">
                        <span className="font-bold text-green-800 dark:text-green-300">Total Gaji Kotor</span>
                        <span className="font-bold text-green-800 dark:text-green-300">{formatCurrency(salaryDetails.grossSalary)}</span>
                    </div>
                </div>

                {/* Potongan */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-slate-700">Potongan</h4>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Potongan Terlambat</span>
                        <span className="text-sm font-medium text-orange-600 dark:text-orange-400">(-) {formatCurrency(salaryDetails.lateDeduction)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Potongan Sakit</span>
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">(-) {formatCurrency(salaryDetails.sickDeduction)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Potongan Izin</span>
                        <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">(-) {formatCurrency(salaryDetails.permitDeduction)}</span>
                    </div>
                     <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg mt-2">
                        <span className="font-bold text-red-800 dark:text-red-300">Total Potongan</span>
                        <span className="font-bold text-red-800 dark:text-red-300">(-) {formatCurrency(salaryDetails.totalDeductions)}</span>
                    </div>
                </div>
            </div>
            {/* Gaji Akhir */}
            <div className="flex justify-between items-center p-4 bg-sky-100 dark:bg-sky-900/50 rounded-lg mt-6">
                <span className="font-bold text-lg text-sky-800 dark:text-sky-300">Estimasi Gaji Akhir (Take-Home Pay)</span>
                <span className="font-bold text-xl text-sky-800 dark:text-sky-300">{formatCurrency(salaryDetails.finalSalary)}</span>
            </div>
        </div>
    );
};

const EmployeeDetailView = ({ employeeName, allData, onAnalyze, isAiLoading }) => {
    const { theme } = useTheme();
    const [selectedYear, setSelectedYear] = useState('semua');
    const [selectedMonth, setSelectedMonth] = useState('semua');

    const employeeAllRecords = useMemo(() => {
        return allData.filter(row => row.NAMA === employeeName);
    }, [allData, employeeName]);

    const availableYears = useMemo(() => {
        return [...new Set(employeeAllRecords.map(item => item.TAHUN))].filter(Boolean).sort((a, b) => b - a);
    }, [employeeAllRecords]);
    
    const availableMonths = useMemo(() => {
        let records = employeeAllRecords;
        if (selectedYear !== 'semua') {
            records = records.filter(item => item.TAHUN === selectedYear);
        }
        const months = new Set(records.map(item => item.BULAN));
        return [...months].filter(Boolean).sort((a, b) => getMonthNumber(a) - getMonthNumber(b));
    }, [employeeAllRecords, selectedYear]);

    useEffect(() => {
        if (selectedMonth !== 'semua' && !availableMonths.includes(selectedMonth)) {
            setSelectedMonth('semua');
        }
    }, [selectedYear, selectedMonth, availableMonths]);

    const displayData = useMemo(() => {
        let recordsToProcess = employeeAllRecords;

        if (selectedYear !== 'semua') {
            recordsToProcess = recordsToProcess.filter(row => row.TAHUN === selectedYear);
        }
        if (selectedMonth !== 'semua') {
            recordsToProcess = recordsToProcess.filter(row => row.BULAN === selectedMonth);
        }

        if (recordsToProcess.length === 0) {
            const baseData = employeeAllRecords[0] || {};
            return {
                NAMA: employeeName,
                DIVISI: baseData.DIVISI || 'N/A',
                JABATAN: baseData.JABATAN || 'N/A',
                TAHUN_MASUK: baseData.TAHUN_MASUK || 0,
                LAMA_BEKERJA: baseData.LAMA_BEKERJA || 0,
                GAJI_POKOK: baseData.GAJI_POKOK || 0,
                HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0,
            };
        }

        const latestRecord = recordsToProcess.sort((a,b) => getMonthNumber(b.BULAN) - getMonthNumber(a.BULAN))[0] || {};

        return recordsToProcess.reduce((acc, row) => {
            acc.HARI_KERJA += row.HARI_KERJA;
            acc.TERLAMBAT += row.TERLAMBAT;
            acc.SURAT_DOKTER += row.SURAT_DOKTER;
            acc.IJIN_FULL += row.IJIN_FULL;
            acc.CUTI += row.CUTI;
            return acc;
        }, { 
            NAMA: employeeName,
            DIVISI: latestRecord.DIVISI || 'N/A',
            JABATAN: latestRecord.JABATAN || 'N/A',
            TAHUN_MASUK: latestRecord.TAHUN_MASUK || 0,
            LAMA_BEKERJA: latestRecord.LAMA_BEKERJA || 0,
            GAJI_POKOK: latestRecord.GAJI_POKOK || 0,
            HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0 
        });
    }, [employeeName, employeeAllRecords, selectedYear, selectedMonth]);

    const numberOfMonthsForIncentive = useMemo(() => {
        if (selectedMonth !== 'semua') {
            return 1;
        }
        let recordsToProcess = employeeAllRecords;
        if (selectedYear !== 'semua') {
            recordsToProcess = recordsToProcess.filter(row => row.TAHUN === selectedYear);
        }
        const uniqueMonths = new Set(recordsToProcess.map(item => item.BULAN));
        return uniqueMonths.size > 0 ? uniqueMonths.size : 1;
    }, [selectedYear, selectedMonth, employeeAllRecords]);

    const performanceMetrics = useMemo(() => {
        const score = Math.max(0, Math.round(100 - (displayData.TERLAMBAT * 2) - ((displayData.SURAT_DOKTER + displayData.IJIN_FULL) * 1.5)));
        const totalDays = displayData.HARI_KERJA + displayData.SURAT_DOKTER + displayData.IJIN_FULL;
        const attendanceRate = totalDays > 0 ? (displayData.HARI_KERJA / totalDays) * 100 : 0;
        const disciplineScore = Math.max(0, 100 - (displayData.TERLAMBAT * 2));
        const consistencyRate = attendanceRate;
        return { score, attendanceRate, disciplineScore, consistencyRate };
    }, [displayData]);
    
    const tenureString = useMemo(() => {
        if (displayData.LAMA_BEKERJA > 0) return `${displayData.LAMA_BEKERJA} tahun`;
        if (displayData.TAHUN_MASUK > 0) return `${new Date().getFullYear() - displayData.TAHUN_MASUK} tahun`;
        return 'N/A';
    }, [displayData]);

    const summaryHTML = useMemo(() => {
        if (displayData.HARI_KERJA > 0) {
            return `Selama periode yang dipilih, ${displayData.NAMA} telah bekerja selama <strong class="text-sky-800 dark:text-sky-400">${displayData.HARI_KERJA}</strong> hari. Karyawan ini tercatat terlambat sebanyak <strong class="text-orange-600 dark:text-orange-400">${displayData.TERLAMBAT}</strong> kali dan mengambil total <strong class="text-red-600 dark:text-red-400">${displayData.SURAT_DOKTER + displayData.IJIN_FULL}</strong> hari absen di luar cuti resmi.`;
        }
        return `Tidak ada data kehadiran untuk ${displayData.NAMA} pada periode yang dipilih.`;
    }, [displayData, selectedMonth, selectedYear]);

    const performanceChartData = useMemo(() => {
        const score = performanceMetrics.score;
        const isDark = theme === 'dark';
        const trackColor = isDark ? '#334155' : '#e2e8f0'; // slate-700 : slate-200
        const scoreColor = score > 80 ? '#22c55e' : score > 60 ? '#f59e0b' : '#ef4444'; // green-500, amber-500, red-500
        
        return {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [scoreColor, trackColor],
                borderColor: [isDark ? '#1e293b' : '#ffffff', isDark ? '#1e293b' : '#ffffff'], // slate-800 : white
                borderWidth: 4,
                circumference: 360,
            }]
        };
    }, [performanceMetrics.score, theme]);

    const performanceChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        }
    };

    const handleExportPdf = () => {
        const headers = ["Metrik", "Nilai"];
        const data = [
            ["Nama", displayData.NAMA],
            ["Jabatan", displayData.JABATAN],
            ["Divisi", displayData.DIVISI],
            ["Periode", `${selectedMonth}, ${selectedYear}`],
            ["Total Hari Kerja", `${displayData.HARI_KERJA} hari`],
            ["Total Terlambat", `${displayData.TERLAMBAT} kali`],
            ["Total Absen Sakit", `${displayData.SURAT_DOKTER} hari`],
            ["Total Absen Izin", `${displayData.IJIN_FULL} hari`],
            ["Skor Kinerja", `${performanceMetrics.score}`],
        ];
        exportService.exportToPdf(`Laporan Kinerja - ${employeeName}`, headers, data, `laporan_${employeeName}.pdf`);
    };

    if (!displayData) {
        return <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Memuat data karyawan...</div>;
    }

    return (
        <motion.div
            className="space-y-8 printable-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-sky-900 dark:text-white">{displayData.NAMA}</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">{displayData.JABATAN} • {displayData.DIVISI} • {tenureString}</p>
                    </div>
                   <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 no-print">
                        <div className="w-full sm:w-40">
                            <AnimatedDropdown options={availableYears} selectedValue={selectedYear} onValueChange={setSelectedYear} placeholder="Semua Tahun" includeAllOption={true} />
                        </div>
                        <div className="w-full sm:w-40">
                            <AnimatedDropdown options={availableMonths} selectedValue={selectedMonth} onValueChange={setSelectedMonth} placeholder="Semua Bulan" includeAllOption={true} />
                        </div>
                        <button onClick={handleExportPdf} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2">
                            <Download size={16} /> Ekspor PDF
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <KpiCard icon={<Clock />} title="Total Terlambat" value={displayData.TERLAMBAT} unit="kali" colorClass={{ bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-600 dark:text-orange-400' }} small />
                    <KpiCard icon={<UserX />} title="Total Absen Sakit" value={displayData.SURAT_DOKTER} unit="hari" colorClass={{ bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-400' }} small />
                    <KpiCard icon={<UserMinus />} title="Total Absen Izin" value={displayData.IJIN_FULL} unit="hari" colorClass={{ bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-600 dark:text-yellow-400' }} small />
                    <KpiCard icon={<Calendar />} title="Total Cuti" value={displayData.CUTI} unit="hari" colorClass={{ bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400' }} small />
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                    <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Performance Overview</h3>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                        <div className="relative h-32 w-32 flex-shrink-0">
                            <ChartWrapper chartId="performance-doughnut" type="doughnut" data={performanceChartData} options={performanceChartOptions} fallbackText={{ icon: <Award />, text: "N/A" }} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-4xl font-bold text-slate-800 dark:text-slate-200">{performanceMetrics.score}</span>
                            </div>
                        </div>
                        <div className="w-full sm:w-auto flex-grow space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kehadiran</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">{performanceMetrics.attendanceRate.toFixed(1)}%</span>
                            </div>
                           <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kedisiplinan</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">{performanceMetrics.disciplineScore.toFixed(1)}%</span>
                            </div>
                           <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Konsistensi</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">{performanceMetrics.consistencyRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                   <button onClick={() => onAnalyze(displayData)} disabled={isAiLoading} className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg no-print">
                        <Sparkles className="w-5 h-5" />
                        {isAiLoading ? 'Menganalisis...' : 'Analisis AI'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Ringkasan Kehadiran ({selectedYear === 'semua' ? 'Semua Tahun' : selectedYear}, {selectedMonth === 'semua' ? 'Semua Bulan' : selectedMonth})</h3>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: summaryHTML }} />
            </div>
            
            <EmployeeSalaryCalculator employeeData={displayData} numberOfMonths={numberOfMonthsForIncentive} />
        </motion.div>
    );
};

const AnalyticsPage = ({ data }) => {
    const [selectedMetric, setSelectedMetric] = useState('performance');
    const { availableEmployees } = useAttendanceData(data);

    const aggregatedData = useMemo(() => {
        const employeeMap = new Map();
        data.forEach(row => {
            const name = row.NAMA;
            if (!name) return;

            if (!employeeMap.has(name)) {
                employeeMap.set(name, {
                    NAMA: name,
                    DIVISI: row.DIVISI || 'N/A',
                    JABATAN: row.JABATAN || 'N/A',
                    HARI_KERJA: 0,
                    TERLAMBAT: 0,
                    SURAT_DOKTER: 0,
                    IJIN_FULL: 0,
                    CUTI: 0,
                });
            }
            const stats = employeeMap.get(name);
            stats.HARI_KERJA += row.HARI_KERJA || 0;
            stats.TERLAMBAT += row.TERLAMBAT || 0;
            stats.SURAT_DOKTER += row.SURAT_DOKTER || 0;
            stats.IJIN_FULL += row.IJIN_FULL || 0;
            stats.CUTI += row.CUTI || 0;
        });
        return Array.from(employeeMap.values());
    }, [data]);

    const analyticsData = useMemo(() => {
        const divisions = {};
        aggregatedData.forEach(employee => {
            const div = employee.DIVISI || 'N/A';
            if (!divisions[div]) {
                divisions[div] = { name: div, employees: [], totalTardiness: 0, totalLeave: 0, totalWorkDays: 0, totalAbsence: 0 };
            }
            divisions[div].employees.push(employee);
            divisions[div].totalTardiness += employee.TERLAMBAT;
            divisions[div].totalLeave += employee.CUTI;
            divisions[div].totalWorkDays += employee.HARI_KERJA;
            divisions[div].totalAbsence += employee.SURAT_DOKTER + employee.IJIN_FULL;
        });

        Object.values(divisions).forEach(div => {
            const { totalWorkDays, totalTardiness, totalAbsence } = div;
            if (totalWorkDays > 0) {
                const tardinessRate = (totalTardiness / totalWorkDays) * 100;
                const absenceRate = (totalAbsence / (totalWorkDays + totalAbsence)) * 100;
                const score = 100 - (tardinessRate * 2) - (absenceRate * 4);
                div.avgPerformance = Math.max(0, score);
            } else {
                div.avgPerformance = 0;
            }
        });
        return divisions;
    }, [aggregatedData]);

    const topPerformers = useMemo(() => {
        return [...aggregatedData]
            .filter(emp => emp.HARI_KERJA > 0)
            .map(emp => ({ ...emp, score: Math.max(0, 100 - (emp.TERLAMBAT * 2) - ((emp.SURAT_DOKTER + emp.IJIN_FULL) * 1.5)) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }, [aggregatedData]);

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
            ...Object.values(analyticsData).map(div => ({ 'Divisi': div.name, 'Skor Performa': div.avgPerformance.toFixed(1), 'Jumlah Karyawan': div.employees.length, 'Rata-rata Terlambat': (div.employees.length > 0 ? (div.totalTardiness / div.employees.length) : 0).toFixed(1) })),
            {}, // Empty row for separation
            { 'Top 5 Karyawan Terbaik': '' },
            ...topPerformers.map(emp => ({ 'Nama': emp.NAMA, 'Divisi': emp.DIVISI, 'Skor Performa': emp.score.toFixed(1) }))
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
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-2xl p-8 text-white flex justify-between items-center"><div className="flex-grow"><div className="flex items-center gap-3 mb-4"><TrendingUp className="w-8 h-8" /><h2 className="text-3xl font-bold">Analisis & Wawasan</h2></div><p className="text-sky-100 text-lg">Analisis mendalam performa kehadiran dan produktivitas tim</p></div><button onClick={handleExport} className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors no-print"><Download size={16} /> Ekspor</button></div>
        
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
            <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Tren Kehadiran per Bulan</h3>
            <div className="h-80">
                <ChartWrapper chartId="monthly-trend-chart" type="line" data={monthlyTrendData} options={monthlyChartOptions} fallbackText={{ icon: <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-50" />, text: "Data tidak cukup untuk menampilkan tren bulanan." }} />
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300"><div className="flex flex-wrap gap-4 mb-6 no-print"><button onClick={() => setSelectedMetric('performance')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedMetric === 'performance' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'}`}><Award className="w-4 h-4" /> Performa Divisi</button><button onClick={() => setSelectedMetric('trends')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedMetric === 'trends' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'}`}><TrendingUp className="w-4 h-4" /> Tren & Pola</button><button onClick={() => setSelectedMetric('risks')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedMetric === 'risks' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'}`}><AlertTriangle className="w-4 h-4" /> Identifikasi Risiko</button></div>{selectedMetric === 'performance' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div><h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Skor Kinerja per Divisi</h3><div className="space-y-4">{Object.values(analyticsData).map(div => (<div key={div.name} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg"><div className="flex justify-between items-center mb-2"><span className="font-medium text-gray-800 dark:text-gray-200">{div.name}</span><span className="text-lg font-bold text-sky-700 dark:text-sky-400">{div.avgPerformance.toFixed(1)}</span></div><div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2"><div className="bg-gradient-to-r from-sky-500 to-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${div.avgPerformance}%` }}></div></div><div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{div.employees.length} karyawan • Rata-rata Terlambat: {div.employees.length > 0 ? (div.totalTardiness / div.employees.length).toFixed(1) : 0}</div></div>))}</div></div><div><h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">5 Karyawan Terbaik</h3><div className="space-y-3">{topPerformers.map((emp, index) => (<div key={emp.NAMA} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-sky-600'}`}>{index + 1}</div><div><p className="font-medium text-gray-800 dark:text-gray-200">{emp.NAMA}</p><p className="text-sm text-gray-600 dark:text-gray-400">{emp.DIVISI}</p></div></div><div className="text-right"><p className="text-lg font-bold text-sky-700 dark:text-sky-400">{emp.score.toFixed(1)}</p><p className="text-xs text-gray-500 dark:text-gray-400">Skor Kinerja</p></div></div>))}</div></div></div>)}{selectedMetric === 'trends' && (<div className="space-y-6"><div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-lg"><h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300 flex items-center"><TrendingUp className="w-5 h-5 mr-2" /> Analisis Tren Kehadiran</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="text-center"><div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{aggregatedData.length > 0 ? ((aggregatedData.reduce((sum, emp) => sum + emp.TERLAMBAT, 0) / aggregatedData.length)).toFixed(1) : 0}</div><div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Terlambat/Karyawan</div></div><div className="text-center"><div className="text-2xl font-bold text-red-600 dark:text-red-400">{aggregatedData.length > 0 ? ((aggregatedData.reduce((sum, emp) => sum + emp.SURAT_DOKTER + emp.IJIN_FULL, 0) / aggregatedData.length)).toFixed(1) : 0}</div><div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Absen/Karyawan</div></div><div className="text-center"><div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{aggregatedData.length > 0 ? ((aggregatedData.reduce((sum, emp) => sum + emp.CUTI, 0) / aggregatedData.length)).toFixed(1) : 0}</div><div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Cuti/Karyawan</div></div></div></div></div>)}{selectedMetric === 'risks' && (<div className="space-y-6"><div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 p-6 rounded-lg"><h3 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-300 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Karyawan Berisiko Tinggi</h3><div className="space-y-3">{aggregatedData.filter(emp => emp.TERLAMBAT > 5 || (emp.SURAT_DOKTER + emp.IJIN_FULL) > 3).slice(0, 5).map(emp => (<div key={emp.NAMA} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-red-200 dark:border-red-800/50"><div className="flex justify-between items-center"><div><p className="font-medium text-gray-800 dark:text-gray-200">{emp.NAMA}</p><p className="text-sm text-gray-600 dark:text-gray-400">{emp.DIVISI} - {emp.JABATAN}</p></div><div className="text-right"><p className="text-sm text-red-600 dark:text-red-400">{emp.TERLAMBAT > 5 && `Terlambat: ${emp.TERLAMBAT}x`}{emp.TERLAMBAT > 5 && (emp.SURAT_DOKTER + emp.IJIN_FULL) > 3 && ' • '}{(emp.SURAT_DOKTER + emp.IJIN_FULL) > 3 && `Absen: ${emp.SURAT_DOKTER + emp.IJIN_FULL} hari`}</p></div></div></div>))}</div></div></div>)}</div></motion.div>);
};

const ComparisonPage = ({ data, availableYears, availableMonths, onAnalyze, isAiLoading }) => {
    const [yearA, setYearA] = useState('');
    const [monthA, setMonthA] = useState('');
    const [yearB, setYearB] = useState('');
    const [monthB, setMonthB] = useState('');

    const getStats = useCallback((year, month) => {
        let filteredData = data;
        if (year !== 'semua') {
            filteredData = filteredData.filter(row => row.TAHUN === year);
        }
        if (month !== 'semua') {
            filteredData = filteredData.filter(row => row.BULAN === month);
        }
        
        return {
            tardiness: filteredData.reduce((sum, row) => sum + row.TERLAMBAT, 0),
            absence: filteredData.reduce((sum, row) => sum + row.SURAT_DOKTER + row.IJIN_FULL, 0),
            workDays: filteredData.reduce((sum, row) => sum + row.HARI_KERJA, 0),
            employees: new Set(filteredData.map(row => row.NAMA)).size
        };
    }, [data]);

    const statsA = useMemo(() => yearA && monthA ? getStats(yearA, monthA) : null, [yearA, monthA, getStats]);
    const statsB = useMemo(() => yearB && monthB ? getStats(yearB, monthB) : null, [yearB, monthB, getStats]);

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
        const periodAString = `${monthA} ${yearA}`;
        const periodBString = `${monthB} ${yearB}`;
        onAnalyze({ periodA: periodAString, periodB: periodBString, statsA, statsB });
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Tahun A</label>
                            <AnimatedDropdown options={availableYears} selectedValue={yearA} onValueChange={setYearA} placeholder="Pilih tahun..." includeAllOption={true} />
                        </div>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Bulan A</label>
                            <AnimatedDropdown options={availableMonths} selectedValue={monthA} onValueChange={setMonthA} placeholder="Pilih bulan..." includeAllOption={true}/>
                        </div>
                    </div>
                     <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Tahun B</label>
                            <AnimatedDropdown options={availableYears} selectedValue={yearB} onValueChange={setYearB} placeholder="Pilih tahun..." includeAllOption={true} />
                        </div>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Bulan B</label>
                            <AnimatedDropdown options={availableMonths} selectedValue={monthB} onValueChange={setMonthB} placeholder="Pilih bulan..." includeAllOption={true}/>
                        </div>
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={!yearA || !monthA || !yearB || !monthB || isAiLoading}
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
                        <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Periode A: {monthA} {yearA}</h3>
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
                        <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Periode B: {monthB} {yearB}</h3>
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

const ToolsPage = ({ data, availableEmployees, showToast }) => {
    const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
    const [isPredicting, setIsPredicting] = useState(false);
    const [predictionResult, setPredictionResult] = useState(null);
    const resultsRef = useRef(null);

    const handlePredict = async () => {
        if (!selectedEmployeeName) {
            showToast("Harap pilih seorang karyawan untuk prediksi.", "error");
            return;
        }

        const employeeRecords = data.filter(row => row.NAMA === selectedEmployeeName);
        if (employeeRecords.length === 0) {
            showToast("Tidak ada data yang ditemukan untuk karyawan yang dipilih.", "error");
            return;
        }

        const sortedRecords = [...employeeRecords].sort((a, b) => {
            if (b.TAHUN !== a.TAHUN) {
                return b.TAHUN - a.TAHUN;
            }
            return getMonthNumber(b.BULAN) - getMonthNumber(a.BULAN);
        });

        const latestMonthData = sortedRecords[0];

        setIsPredicting(true);
        setPredictionResult(null);
        try {
            const result = await mlModelService.predictLeave(latestMonthData);
            setPredictionResult(result);
            showToast(`Prediksi untuk ${selectedEmployeeName} berhasil dibuat.`, 'success');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setIsPredicting(false);
        }
    };

    useEffect(() => {
        if (predictionResult && resultsRef.current) {
            setTimeout(() => {
                 resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100); 
        }
    }, [predictionResult]);

    return (
        <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <BrainCircuit className="w-8 h-8" />
                    <h2 className="text-3xl font-bold">Alat & Prediksi</h2>
                </div>
                <p className="text-sky-100 text-lg">Gunakan alat prediktif untuk perencanaan SDM yang lebih baik.</p>
            </div>

            {/* Prediction Controls */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Jalankan Prediksi Cuti</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Pilih Karyawan</label>
                        <SearchableDropdown
                            options={availableEmployees}
                            selectedValue={selectedEmployeeName}
                            onValueChange={setSelectedEmployeeName}
                            placeholder="Pilih atau cari nama karyawan..."
                        />
                    </div>
                    <button
                        onClick={handlePredict}
                        disabled={!selectedEmployeeName || isPredicting}
                        className="bg-sky-700 hover:bg-sky-800 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg"
                    >
                        {isPredicting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        {isPredicting ? 'Memprediksi...' : 'Jalankan Prediksi'}
                    </button>
                </div>
            </div>

            {/* Prediction Result */}
            <AnimatePresence>
            {isPredicting && (
                <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
                        <LoaderCircle className="w-12 h-12 text-sky-600 dark:text-sky-400 mx-auto animate-spin mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Menganalisis Pola...</h3>
                        <p className="text-gray-600 dark:text-gray-400">Model sedang memproses data historis untuk {selectedEmployeeName}.</p>
                    </div>
                </motion.div>
            )}
            {predictionResult && (
                <motion.div
                    ref={resultsRef}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <div className="p-8 text-center">
                        <h3 className="text-2xl font-bold text-sky-900 dark:text-white mb-2">Hasil Prediksi untuk {selectedEmployeeName}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">Prediksi Jumlah Cuti Bulan Depan</p>
                        <p className="text-7xl font-bold text-sky-600 dark:text-sky-400">
                            {predictionResult.prediksi_cuti_bulan_depan}
                            <span className="text-4xl font-medium text-gray-500 dark:text-gray-400 ml-2">hari</span>
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800/50 px-8 py-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            <strong>Disclaimer:</strong> Prediksi ini dibuat berdasarkan model machine learning dan data historis. Gunakan sebagai salah satu pertimbangan dalam pengambilan keputusan.
                        </p>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
            
            <div className="bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <BrainCircuit className="w-8 h-8 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-sky-900 dark:text-sky-300 mb-1">Bagaimana Prediksi Ini Bekerja?</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Model ini menggunakan data historis karyawan yang Anda pilih (seperti total absensi, keterlambatan, dan sisa cuti) dan membandingkannya dengan pola yang telah dipelajari dari seluruh data absensi perusahaan untuk memprediksi kemungkinan jumlah cuti yang akan diambil pada BULAN berikutnya.
                        </p>
                    </div>
                </div>
            </div>

        </motion.div>
    );
};

const PayrollPage = ({ data, availableYears, availableMonths }) => {
    const [selectedYear, setSelectedYear] = useState(availableYears[0] || '');
    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');

    const payrollData = useMemo(() => {
        if (!selectedYear || !selectedMonth) return [];

        const filteredData = data.filter(row => row.TAHUN === selectedYear && row.BULAN === selectedMonth);

        const employeeMap = new Map();
        filteredData.forEach(row => {
            const name = row.NAMA;
            if (!employeeMap.has(name)) {
                employeeMap.set(name, {
                    NAMA: name,
                    DIVISI: row.DIVISI || 'N/A',
                    GAJI_POKOK: row.GAJI_POKOK || 0,
                    HARI_KERJA: 0,
                    TERLAMBAT: 0,
                    SURAT_DOKTER: 0,
                    IJIN_FULL: 0,
                });
            }
            const stats = employeeMap.get(name);
            stats.HARI_KERJA += row.HARI_KERJA;
            stats.TERLAMBAT += row.TERLAMBAT;
            stats.SURAT_DOKTER += row.SURAT_DOKTER;
            stats.IJIN_FULL += row.IJIN_FULL;
        });

        return Array.from(employeeMap.values()).map(emp => {
            const mealAllowance = emp.HARI_KERJA * 20000;
            const transportAllowance = emp.HARI_KERJA * 10000;
            const incentive = 100000; // Monthly incentive
            const totalAllowances = mealAllowance + transportAllowance + incentive;

            const lateDeduction = emp.TERLAMBAT * 5000;
            const sickDeduction = emp.SURAT_DOKTER * 10000;
            const permitDeduction = emp.IJIN_FULL * 10000;
            const totalDeductions = lateDeduction + sickDeduction + permitDeduction;

            const grossSalary = emp.GAJI_POKOK + totalAllowances;
            const finalSalary = grossSalary - totalDeductions;

            return {
                ...emp,
                totalAllowances,
                totalDeductions,
                finalSalary
            };
        });
    }, [data, selectedYear, selectedMonth]);

    const handleExportPdf = () => {
        const headers = ["Nama Karyawan", "Gaji Pokok", "Tunjangan", "Potongan", "Gaji Akhir"];
        const body = payrollData.map(emp => [
            emp.NAMA,
            formatCurrency(emp.GAJI_POKOK),
            formatCurrency(emp.totalAllowances),
            formatCurrency(emp.totalDeductions),
            formatCurrency(emp.finalSalary)
        ]);
        exportService.exportToPdf(`Laporan Gaji ${selectedMonth} ${selectedYear}`, headers, body, `gaji_${selectedMonth}_${selectedYear}.pdf`);
    };

    return (
        <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-8 h-8" />
                    <h2 className="text-3xl font-bold">Laporan Gaji Karyawan</h2>
                </div>
                <p className="text-sky-100 text-lg">Tinjau dan ekspor laporan gaji bulanan untuk seluruh karyawan.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm no-print transition-colors duration-300">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-full sm:w-48">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tahun</label>
                        <AnimatedDropdown options={availableYears} selectedValue={selectedYear} onValueChange={setSelectedYear} placeholder="Pilih Tahun" />
                    </div>
                    <div className="w-full sm:w-48">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bulan</label>
                        <AnimatedDropdown options={availableMonths} selectedValue={selectedMonth} onValueChange={setSelectedMonth} placeholder="Pilih Bulan" />
                    </div>
                    <div className="flex-1" />
                    <button onClick={handleExportPdf} disabled={!payrollData || payrollData.length === 0} className="w-full sm:w-auto mt-4 sm:mt-0 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Download size={16} /> Ekspor PDF
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm transition-colors duration-300 overflow-hidden">
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-sky-900 dark:text-sky-300">Detail Gaji untuk {selectedMonth} {selectedYear}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama Karyawan</th>
                                <th scope="col" className="px-6 py-3 text-right">Gaji Pokok</th>
                                <th scope="col" className="px-6 py-3 text-right">Total Tunjangan</th>
                                <th scope="col" className="px-6 py-3 text-right">Total Potongan</th>
                                <th scope="col" className="px-6 py-3 text-right font-bold">Gaji Akhir</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrollData.length > 0 ? payrollData.map(emp => (
                                <tr key={emp.NAMA} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600/50">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{emp.NAMA}</th>
                                    <td className="px-6 py-4 text-right">{formatCurrency(emp.GAJI_POKOK)}</td>
                                    <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">{formatCurrency(emp.totalAllowances)}</td>
                                    <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">(-) {formatCurrency(emp.totalDeductions)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-sky-800 dark:text-sky-300">{formatCurrency(emp.finalSalary)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        Pilih tahun dan bulan untuk menampilkan data gaji.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};


const Sidebar = ({ employees, activePath, onReset, isSidebarCollapsed, onToggleCollapse }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return employees;
        return employees.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [employees, searchTerm]);

    const NavLink = ({ href, icon, children }) => {
        const isActive = activePath === href.substring(2); // remove '#/'
        return (
            <a href={href} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''} ${isActive ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>
                {icon}
                {!isSidebarCollapsed && children}
            </a>
        );
    };

    return (
        <div className="bg-slate-800 text-slate-200 flex flex-col h-full">
            <div className={`p-4 border-b border-slate-700 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                <h1 className={`text-2xl font-bold text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>Dasbor SDM</h1>
                <button onClick={onToggleCollapse} className="p-1 rounded-lg hover:bg-slate-700">
                    {isSidebarCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
                </button>
            </div>
            <nav className="p-4 space-y-2">
                <NavLink href="#/dashboard" icon={<LayoutDashboard className="w-5 h-5" />}>
                    <span>Dasbor Umum</span>
                </NavLink>
                <NavLink href="#/payroll" icon={<DollarSign className="w-5 h-5" />}>
                    <span>Laporan Gaji</span>
                </NavLink>
                <NavLink href="#/analytics" icon={<TrendingUp className="w-5 h-5" />}>
                    <span>Analisis & Wawasan</span>
                </NavLink>
                <NavLink href="#/comparison" icon={<GitCompareArrows className="w-5 h-5" />}>
                    <span>Perbandingan Periode</span>
                </NavLink>
                <NavLink href="#/tools" icon={<BrainCircuit className="w-5 h-5" />}>
                    <span>Alat & Prediksi</span>
                </NavLink>
            </nav>
            <div className={`flex-grow flex flex-col p-4 border-t border-slate-700 overflow-hidden`}>
                <h2 className={`text-sm font-semibold text-slate-400 mb-2 whitespace-nowrap ${isSidebarCollapsed ? 'hidden' : ''}`}>DETAIL KARYAWAN</h2>
                <div className={`relative mb-4 ${isSidebarCollapsed ? 'hidden' : ''}`}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" placeholder="Cari karyawan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div className="flex-grow overflow-hidden">
                    <CustomScrollbar>
                        <ul className={`space-y-1 pr-2 ${isSidebarCollapsed ? 'hidden' : ''}`}>
                            {filteredEmployees.map(name => {
                                const href = `#/employee/${encodeURIComponent(name)}`;
                                const isActive = activePath === `employee/${encodeURIComponent(name)}`;
                                return (
                                    <li key={name}>
                                        <a href={href} className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>
                                            <span className="truncate">{name}</span>
                                            <ChevronsRight className="w-4 h-4" />
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </CustomScrollbar>
                </div>
            </div>
            <div className="p-4 mt-auto border-t border-slate-700">
                <button onClick={onReset} className={`w-full flex items-center gap-2 py-2 px-5 rounded-xl transition-all duration-300 bg-red-500 hover:bg-red-600 text-white font-semibold transform hover:scale-105 shadow hover:shadow-lg ${isSidebarCollapsed ? 'justify-center' : 'justify-center'}`}>
                    <Upload className="w-5 h-5" />
                    <span className={isSidebarCollapsed ? 'hidden' : ''}>Unggah Baru</span>
                </button>
            </div>
        </div>
    );
};

const ThemeToggleFAB = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 ${
                theme === 'light' 
                ? 'bg-slate-800' 
                : 'bg-white'
            }`}
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {theme === 'light' ? <Moon className="w-6 h-6 text-white" /> : <Sun className="w-6 h-6 text-yellow-500" />}
                </motion.div>
            </AnimatePresence>
        </button>
    );
};


const DashboardLayout = ({ data, onReset, onAnalyzeIndividual, onAnalyzeOverall, isAiLoading, onAnalyzeComparison, isLoading, showToast, location }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { availableEmployees, availableYears, availableMonths } = useAttendanceData(data);

    const renderContent = () => {
        const path = location.substring(2); // remove '#/'
        const employeeMatch = path.match(/^employee\/(.*)/);

        if (employeeMatch) {
            const employeeName = decodeURIComponent(employeeMatch[1]);
            if (availableEmployees.includes(employeeName)) {
                return <EmployeeDetailView key={employeeName} employeeName={employeeName} allData={data} onAnalyze={onAnalyzeIndividual} isAiLoading={isAiLoading} />;
            }
        }
        
        switch (path) {
            case 'payroll':
                return <PayrollPage key="payroll" data={data} availableYears={availableYears} availableMonths={availableMonths} />;
            case 'analytics':
                return <AnalyticsPage key="analytics" data={data} />;
            case 'comparison':
                return <ComparisonPage key="comparison" data={data} availableYears={availableYears} availableMonths={availableMonths} onAnalyze={onAnalyzeComparison} isAiLoading={isAiLoading} />;
            case 'tools':
                return <ToolsPage key="tools" data={data} availableEmployees={availableEmployees} showToast={showToast} />;
            case 'dashboard':
            default:
                return <OverallDashboard key="dashboard" data={data} onAnalyzeIndividual={onAnalyzeIndividual} onAnalyzeOverall={onAnalyzeOverall} isAiLoading={isAiLoading} />;
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
                <aside className={`flex-shrink-0 no-print transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
                    <Sidebar
                        employees={[]}
                        activePath={location.substring(2)}
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
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
            <aside className={`flex-shrink-0 no-print transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
                <Sidebar
                    employees={availableEmployees}
                    activePath={location.substring(2)}
                    onReset={onReset}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
            </aside>
            <main className="flex-1 overflow-hidden">
                <CustomScrollbar>
                    <div className="p-8 print-main">
                        <AnimatePresence mode="wait">
                           {renderContent()}
                        </AnimatePresence>
                    </div>
                </CustomScrollbar>
            </main>
        </div>
    );
};

// --- Toast Notification System ---
const Toast = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [onDismiss]);

    const typeClasses = {
        success: {
            bg: 'bg-green-50 dark:bg-green-900/50',
            border: 'border-green-300 dark:border-green-700',
            iconBg: 'bg-green-100 dark:bg-green-800',
            iconColor: 'text-green-600 dark:text-green-300',
            icon: <CheckCircle className="w-5 h-5" />
        },
        error: {
            bg: 'bg-red-50 dark:bg-red-900/50',
            border: 'border-red-300 dark:border-red-700',
            iconBg: 'bg-red-100 dark:bg-red-800',
            iconColor: 'text-red-600 dark:text-red-300',
            icon: <AlertTriangle className="w-5 h-5" />
        },
    };

    const classes = typeClasses[type] || typeClasses.error;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`w-full ${classes.bg} border ${classes.border} rounded-xl shadow-lg p-4 flex items-start gap-3`}
        >
            <div className={`p-2 rounded-full ${classes.iconBg}`}>
                {React.cloneElement(classes.icon, { className: classes.iconColor })}
            </div>
            <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 pt-1">{message}</p>
            <button onClick={onDismiss} className="p-1 text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 rounded-full">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

const Toaster = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-xs space-y-3">
            <AnimatePresence>
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
                ))}
            </AnimatePresence>
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
    const [toasts, setToasts] = useState([]);
    
    // --- Hash-based Routing State ---
    const [location, setLocation] = useState(window.location.hash || '#/dashboard');

    useEffect(() => {
        const handleHashChange = () => {
            setLocation(window.location.hash || '#/dashboard');
        };
        window.addEventListener('hashchange', handleHashChange);
        // Set initial route if hash is empty
        if (!window.location.hash) {
            window.location.hash = '/dashboard';
        }
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                // FIX: Check for the autoTable plugin on the jsPDF object
                if (window.Papa && window.Chart && window.jspdf && window.jspdf.jsPDF.autoTable) {
                    setScriptsLoaded(true);
                    return;
                }
                
                // FIX: Load scripts with dependencies sequentially
                await Promise.all([
                    loadScript("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"),
                    loadScript("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"),
                ]);
                
                await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
                await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.autotable.min.js");

                setScriptsLoaded(true);
            } catch (error) {
                console.error("Gagal memuat skrip dependensi:", error);
                showError(`${error.message}. Harap periksa koneksi internet Anda dan muat ulang halaman.`, "Kesalahan Pemuatan Skrip");
            }
        };
        loadDependencies();
    }, []);

    const showToast = useCallback((message, type = 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showError = useCallback((message, title = 'Pemberitahuan') => {
        setErrorModal({ show: true, title, message });
    }, []);

    const hideError = useCallback(() => setErrorModal({ show: false, title: '', message: '' }), []);

    const validateFile = useCallback((file) => {
        if (!file) {
            showToast('Tidak ada file yang dipilih.');
            return false;
        }
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showToast('Format file tidak valid. Harap unggah file .csv');
            return false;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('Ukuran file terlalu besar. Maksimal 10MB.');
            return false;
        }
        return true;
    }, [showToast]);

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
        window.location.hash = '/dashboard';
    }, []);

    const handleGetOverallAnalysis = useCallback(async ({ kpis, chartData, selectedMonth, selectedEmployee }) => {
        setAiModal({ show: true, title: 'Analisis & Rekomendasi Umum', content: '', isLoading: true });
        const filterInfo = selectedMonth === 'semua' ? 'semua periode' : `bulan ${selectedMonth}`;
        const employeeInfo = selectedEmployee === 'semua' ? 'seluruh karyawan' : `karyawan bernama ${selectedEmployee}`;
        const prompt = `Anda adalah seorang analis HR. Berdasarkan data absensi untuk ${filterInfo} yang mencakup ${employeeInfo}, berikan analisis dalam format markdown Bahasa Indonesia:
      - **Data Ringkas:** Total Karyawan: ${kpis.totalEmployees}, Total Keterlambatan: ${kpis.totalTardiness} kali, Total Absensi: ${kpis.totalAbsence} hari.
      - **Distribusi Absensi:** Sakit ${chartData.absenceDistribution.sakit} hari, Izin ${chartData.absenceDistribution.izin} hari, Cuti ${chartData.absenceDistribution.cuti} hari.
      - **Karyawan Paling Sering Terlambat:** ${JSON.stringify(chartData.topTardiness.map(e => ({ nama: e.NAMA, total: e.TERLAMBAT })))}
      ### **Wawasan Utama per Divisi**
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
      Anda adalah seorang Manajer SDM yang sedang melakukan tinjauan kinerja. Berdasarkan data absensi karyawan berikut:
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
      ### **Wawasan Utama**
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
         .printable-content, .bg-white, .bg-slate-50 {
           box-shadow: none !important;
           border: 1px solid #eee !important;
         }
         .dark\\:bg-slate-800, .dark\\:bg-slate-900 {
            background-color: #fff !important;
         }
         .dark\\:text-white, .dark\\:text-slate-200, .dark\\:text-slate-300, .dark\\:text-sky-300 {
            color: #1e293b !important;
         }
       }
     `}</style>
    );

    return (
        <>
            <GlobalScrollbarStyles />
            <PrintStyles />
            <Toaster toasts={toasts} removeToast={removeToast} />
            {showDashboard ? (
                <DashboardLayout
                    location={location}
                    data={allData}
                    onReset={resetDashboard}
                    onAnalyzeIndividual={handleGetIndividualAnalysis}
                    onAnalyzeOverall={handleGetOverallAnalysis}
                    onAnalyzeComparison={handleGetComparisonAnalysis}
                    isAiLoading={aiModal.isLoading}
                    isLoading={isLoading}
                    showToast={showToast}
                />
            ) : (
                <FileUploadScreen onFileSelect={handleFileSelect} isLoading={isLoading} scriptsLoaded={scriptsLoaded} />
            )}
            <ThemeToggleFAB />
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

const Root = () => (
    <ThemeProvider>
        <App />
    </ThemeProvider>
);

export default Root;
