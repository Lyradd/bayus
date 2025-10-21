import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext } from 'react';
import { Upload, Users, Clock, UserX, Calendar, FileText, RefreshCw, X, UserCheck, Sparkles, LoaderCircle, BarChart2, Briefcase, UserMinus, TrendingUp, Award, AlertTriangle, Search, LayoutDashboard, ChevronsRight, Zap, Download, GitCompareArrows, ArrowUp, ArrowDown, Minus, Printer, ChevronsLeft, ChevronDown, Moon, Sun, BrainCircuit, DollarSign, Target, TrendingDown, ChevronsUpDown } from 'lucide-react';import { motion, AnimatePresence } from 'framer-motion';

//================================================================
// ROUTER SETUP (React Router Simulation)
//================================================================
const RouterContext = createContext({});

const RouterProvider = ({ children }) => {
    const [location, setLocation] = useState({
        pathname: window.location.hash.substring(1) || "/",
    });

    useEffect(() => {
        const handleHashChange = () => {
            setLocation({ pathname: window.location.hash.substring(1) || "/" });
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const navigate = useCallback((to) => {
        window.location.hash = to;
    }, []);

    const value = useMemo(() => ({ location, navigate }), [location, navigate]);

    return (
        <RouterContext.Provider value={value}>
            {children}
        </RouterContext.Provider>
    );
};

const useLocation = () => useContext(RouterContext).location;
const useNavigate = () => useContext(RouterContext).navigate;

const Link = ({ to, children, className, ...props }) => {
    const navigate = useNavigate();
    const { location } = useContext(RouterContext);
    
    const handleClick = (e) => {
        e.preventDefault();
        navigate(to);
    };

    const isActive = location.pathname === to;
    const activeClass = 'bg-sky-600 text-white';
    const inactiveClass = 'hover:bg-slate-700';

    return (
        <a href={`#${to}`} onClick={handleClick} className={`${className} ${isActive ? activeClass : inactiveClass}`} {...props}>
            {children}
        </a>
    );
};

const Routes = ({ children }) => {
    const { location } = useContext(RouterContext);
    let matchedChild = null;

    React.Children.forEach(children, child => {
        if (matchedChild) return;

        const pathSegments = child.props.path.split('/').filter(Boolean);
        const locationSegments = location.pathname.split('/').filter(Boolean);

        if (pathSegments.length !== locationSegments.length && !child.props.path.includes(':')) {
            return;
        }
        
        const params = {};
        const isMatch = pathSegments.every((segment, i) => {
            if (segment.startsWith(':')) {
                if (locationSegments[i]) {
                    params[segment.substring(1)] = decodeURIComponent(locationSegments[i]);
                    return true;
                }
                return false;
            }
            return segment === locationSegments[i];
        });

        if (isMatch) {
            matchedChild = React.cloneElement(child, { params });
        }
    });
    
    if (!matchedChild) {
         React.Children.forEach(children, child => {
            if(child.props.path === '/') {
                matchedChild = React.cloneElement(child, { params: {} });
            }
         });
    }

    return matchedChild;
};

const Route = ({ element, params }) => {
    return React.cloneElement(element, { params });
};

const useParams = () => {
    const { location } = useContext(RouterContext);
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if(pathSegments[0] === 'employee' && pathSegments[1]){
        return { employeeName: decodeURIComponent(pathSegments[1]) };
    }
    return {}; 
};

//================================================================
// CONTEXT SETUP
//================================================================

const useTheme = () => ({ theme: 'light' });

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
    // Di dalam const csvParserService
    processRow: (row) => {
        const numericColumns = ['SURAT_DOKTER', 'IJIN_FULL', 'TERLAMBAT', 'CUTI', 'SISA_CUTI', 'HARI_KERJA', 'HARI_KERJA_KOTOR', 'TAHUN_MASUK', 'LAMA_BEKERJA', 'GAJI_POKOK', 'TAHUN', 'CASHBON', 'UANG_JABATAN'];
        const processedRow = { ...row };
        
        numericColumns.forEach(col => {
            const cleanValue = String(processedRow[col] || '0')
                                .replace(',', '.')
                                .replace(/[^\d.-]/g, ''); 
                                
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
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            
            if (!apiKey) {
                throw new Error("API Key Gemini tidak ditemukan. Pastikan variabel VITE_GEMINI_API_KEY sudah diatur.");
            }
            
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            
            const baseUrl = import.meta.env.VITE_GEMINI_API_URL;
            const apiUrl = `${baseUrl}?key=${apiKey}`;

            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (!response.ok) {
                const errorBody = await response.text();
                console.error("API Error Body:", errorBody);
                throw new Error(`API call failed with status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Invalid API response structure:", result);
                throw new Error("Struktur respons dari API tidak valid.");
            }
        } catch (error) {
            console.error("Gemini API Error:", error);
            return `**Terjadi Kesalahan pada Analisis AI:**\n\n${error.message}\n\n*Pastikan API Key sudah benar dan memiliki kuota.*`;
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

const mlModelService = {
    predictLeave: async (employee) => {
        console.log("Running local prediction for:", employee);
        return new Promise(resolve => {
            setTimeout(() => {
                const tardiness = employee.TERLAMBAT || 0;
                const sickness = employee.SURAT_DOKTER || 0;
                const permit = employee.IJIN_FULL || 0;
                let predictedLeave = 0;
                predictedLeave += tardiness * 0.15;
                predictedLeave += (sickness + permit) * 0.25;
                const finalPrediction = Math.max(0, predictedLeave);
                console.log(`Prediction result: ${finalPrediction}`);
                resolve({ prediksi_cuti_bulan_depan: finalPrediction });
            }, 1500);
        });
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
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background-color: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
        html.light .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; }
        html.light .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        html.dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
        html.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #64748b; }
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
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300">
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-sky-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                    <FileText className="w-9 h-9 md:w-10 md:h-10 text-sky-600 dark:text-sky-400" />
                    <span>Dashboard Analisis</span>
                </h1>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Absensi Karyawan</h2>
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
                className="mt-12 max-w-4xl w-full text-center"
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
                        <p className="text-sm text-gray-600 dark:text-gray-400">Dapatkan wawasan dan rekomendasi yang mendalam berdasarkan data yang diinput.</p>
                    </div>
                    <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                        <div className="p-3 bg-sky-100 dark:bg-sky-900/50 rounded-full mb-4">
                            <BarChart2 className="w-8 h-8 text-sky-500 dark:text-sky-400" />
                        </div>
                        <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Visualisasi Interaktif</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Visualisasi data kehadiran melalui grafik dan bagan yang dinamis dan mudah dipahami.</p>
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

const KpiCard = React.memo(({ icon, title, value, unit, colorClass, small = false }) => (
    <div className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-colors duration-300 ${small ? 'p-4' : 'p-6'}`}>
        <div className={`p-3 rounded-xl ${colorClass.bg} ${small ? 'p-2' : 'p-3'}`}>
            {React.cloneElement(icon, { className: ` ${colorClass.text} ${small ? 'w-6 h-6' : 'w-8 h-8'}` })}
        </div>
        <div>
            <p className={`text-gray-600 dark:text-gray-400 font-medium ${small ? 'text-xs' : 'text-sm'}`}>{title}</p>
            <p className={`font-bold text-gray-800 dark:text-gray-200 ${small ? 'text-2xl' : 'text-3xl'}`}>{value} {unit && <span className={small ? 'text-base' : 'text-lg'}>{unit}</span>}</p>
        </div>
    </div>
));

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

const EmployeeSalaryCalculator = ({ employeeData, numberOfMonths, selectedMonth }) => {
    const salaryDetails = useMemo(() => {
        if (!employeeData) {
            return {
                basicSalary: 0, mealAllowance: 0, transportAllowance: 0, incentive: 0, thr: 0,
                totalAllowances: 0, grossSalary: 0, lateDeduction: 0,
                permitDeduction: 0, cashbonDeduction: 0, totalDeductions: 0, finalSalary: 0
            };
        }
        const mealAllowance = (employeeData.HARI_KERJA || 0) * 20000;
        const transportAllowance = (employeeData.HARI_KERJA || 0) * 10000;
        const incentive = 100000 * numberOfMonths;
        
        const isMarch = getMonthNumber(selectedMonth) === 3;
        const thr = isMarch ? (employeeData.GAJI_POKOK || 0) : 0;
        const positionAllowance = employeeData.UANG_JABATAN || 0;

        const totalAllowances = mealAllowance + transportAllowance + incentive + thr + positionAllowance;

        const lateDeduction = (employeeData.TERLAMBAT || 0) * 5000;
        const permitDeduction = (employeeData.IJIN_FULL || 0) * 10000;
        const cashbonDeduction = employeeData.CASHBON || 0;
        const totalDeductions = lateDeduction + permitDeduction + cashbonDeduction;

        const basicSalary = employeeData.GAJI_POKOK || 0;
        const grossSalary = basicSalary + totalAllowances;
        const finalSalary = grossSalary - totalDeductions;

        return {
            basicSalary, mealAllowance, transportAllowance, incentive, thr, positionAllowance, totalAllowances,
            grossSalary, lateDeduction, permitDeduction, cashbonDeduction, totalDeductions, finalSalary,
            numberOfMonths
        };
    }, [employeeData, numberOfMonths, selectedMonth]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

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
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tunjangan Jabatan</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatCurrency(salaryDetails.positionAllowance)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-baseline">
                           <span className="text-sm text-gray-600 dark:text-gray-400">Tunjangan Makan</span>
                           <span className="text-xs font-normal ml-2 text-gray-500 dark:text-gray-400">({employeeData.HARI_KERJA} x 20,000)</span>
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatCurrency(salaryDetails.mealAllowance)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-baseline">
                           <span className="text-sm text-gray-600 dark:text-gray-400">Tunjangan Transport</span>
                           <span className="text-xs font-normal ml-2 text-gray-500 dark:text-gray-400">({employeeData.HARI_KERJA} x 10,000)</span>
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatCurrency(salaryDetails.transportAllowance)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Insentif ({salaryDetails.numberOfMonths} bulan)</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatCurrency(salaryDetails.incentive)}</span>
                    </div>
                    {salaryDetails.thr > 0 && (
                        <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Tunjangan Hari Raya (THR)</span>
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">{formatCurrency(salaryDetails.thr)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg mt-2">
                        <span className="font-bold text-green-800 dark:text-green-300">Total Gaji Kotor</span>
                        <span className="font-bold text-green-800 dark:text-green-300">{formatCurrency(salaryDetails.grossSalary)}</span>
                    </div>
                </div>

                {/* Potongan */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-slate-700">Potongan</h4>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-baseline">
                           <span className="text-sm text-gray-600 dark:text-gray-400">Potongan Terlambat</span>
                           <span className="text-xs font-normal ml-2 text-gray-500 dark:text-gray-400">({employeeData.TERLAMBAT} x 5,000)</span>
                        </div>
                        <span className="text-sm font-medium text-orange-600 dark:text-orange-400">(-) {formatCurrency(salaryDetails.lateDeduction)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-baseline">
                           <span className="text-sm text-gray-600 dark:text-gray-400">Potongan Izin</span>
                           <span className="text-xs font-normal ml-2 text-gray-500 dark:text-gray-400">({employeeData.IJIN_FULL} x 10,000)</span>
                        </div>
                        <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">(-) {formatCurrency(salaryDetails.permitDeduction)}</span>
                    </div>
                     <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-baseline">
                           <span className="text-sm text-gray-600 dark:text-gray-400">Potongan Cashbon</span>
                        </div>
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">(-) {formatCurrency(salaryDetails.cashbonDeduction)}</span>
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

const EmployeeDetailView = ({ params, allData, onAnalyze, isAiLoading }) => {
    const { theme } = useTheme();
    const [selectedYear, setSelectedYear] = useState('semua');
    const [selectedMonth, setSelectedMonth] = useState('semua');
    
    const employeeName = params.employeeName;

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
                UANG_JABATAN: latestRecord.UANG_JABATAN || 0,
                HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0,
                SISA_CUTI: baseData.SISA_CUTI || 0,
                CASHBON: baseData.CASHBON || 0,
            };
        }

        const latestRecord = recordsToProcess.sort((a,b) => getMonthNumber(b.BULAN) - getMonthNumber(a.BULAN))[0] || {};

        return recordsToProcess.reduce((acc, row) => {
            acc.HARI_KERJA += row.HARI_KERJA;
            acc.HARI_KERJA_KOTOR += row.HARI_KERJA_KOTOR || 0;
            acc.TERLAMBAT += row.TERLAMBAT;
            acc.SURAT_DOKTER += row.SURAT_DOKTER;
            acc.IJIN_FULL += row.IJIN_FULL;
            acc.CUTI += row.CUTI;
            acc.CASHBON += row.CASHBON || 0;
            if (row.UANG_JABATAN) {
                acc.UANG_JABATAN = row.UANG_JABATAN;
            }
            return acc;
        }, { 
            NAMA: employeeName,
            DIVISI: latestRecord.DIVISI || 'N/A',
            JABATAN: latestRecord.JABATAN || 'N/A',
            TAHUN_MASUK: latestRecord.TAHUN_MASUK || 0,
            LAMA_BEKERJA: latestRecord.LAMA_BEKERJA || 0,
            GAJI_POKOK: latestRecord.GAJI_POKOK || 0,
            HARI_KERJA: 0, HARI_KERJA_KOTOR: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0,
            SISA_CUTI: latestRecord.SISA_CUTI || 0,
            CASHBON: 0,
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
        if (displayData.HARI_KERJA_KOTOR > 0) {
            return `Selama periode yang dipilih, ${displayData.NAMA} telah bekerja selama 
                    <strong class="text-green-600 dark:text-green-400">${displayData.HARI_KERJA}</strong> hari dari total 
                    <strong class="text-sky-800 dark:text-sky-400">${displayData.HARI_KERJA_KOTOR}</strong> hari kerja. 
                    Karyawan ini tercatat terlambat sebanyak 
                    <strong class="text-orange-600 dark:text-orange-400">${displayData.TERLAMBAT}</strong> kali dan mengambil total 
                    <strong class="text-red-600 dark:text-red-400">${displayData.SURAT_DOKTER + displayData.IJIN_FULL}</strong> hari absen (sakit/izin). 
                    Sisa cuti yang dimiliki adalah <strong class="text-blue-600 dark:text-blue-400">${displayData.SISA_CUTI}</strong> hari.`;
        }
        return `Tidak ada data kehadiran untuk ${displayData.NAMA} pada periode yang dipilih.`;
    }, [displayData]);
    
    const performanceChartData = useMemo(() => {
        const score = performanceMetrics.score;
        const isDark = theme === 'dark';
        const trackColor = isDark ? '#334155' : '#e2e8f0';
        const scoreColor = score > 80 ? '#22c55e' : score > 60 ? '#f59e0b' : '#ef4444';
        
        return {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [scoreColor, trackColor],
                borderColor: [isDark ? '#1e293b' : '#ffffff', isDark ? '#1e293b' : '#ffffff'],
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
            
            <EmployeeSalaryCalculator employeeData={displayData} numberOfMonths={numberOfMonthsForIncentive} selectedMonth={selectedMonth} />
        </motion.div>
    );
};

const AnalyticsPage = ({ data }) => {
    const [selectedMetric, setSelectedMetric] = useState('performance');

    const aggregatedData = useMemo(() => {
        const employeeMap = new Map();
        data.forEach(row => {
            if (!row.NAMA) return;
            if (!employeeMap.has(row.NAMA)) {
                employeeMap.set(row.NAMA, { NAMA: row.NAMA, DIVISI: row.DIVISI || 'N/A', JABATAN: row.JABATAN || 'N/A', HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0 });
            }
            const stats = employeeMap.get(row.NAMA);
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
            { 'Analisis Performa Divisi': '' },
            ...Object.values(analyticsData).map(div => ({ 
                'Divisi': div.name, 
                'Skor Performa': div.avgPerformance.toFixed(1), 
                'Jumlah Karyawan': div.employees.length, 
                'Rata-rata Terlambat': (div.employees.length > 0 ? (div.totalTardiness / div.employees.length) : 0).toFixed(1) 
            })),
            {}, 
            { 'Top 5 Karyawan Terbaik': '' },
            ...topPerformers.map(emp => ({ 
                'Nama': emp.NAMA, 
                'Divisi': emp.DIVISI, 
                'Skor Performa': emp.score.toFixed(1) 
            }))
        ];
        exportService.exportToCsv(dataToExport, 'analisis_insight.csv');
    };

    const metrics = [
        { key: 'performance', icon: <Award className="w-4 h-4" />, text: 'Performa Divisi' },
        { key: 'trends', icon: <TrendingUp className="w-4 h-4" />, text: 'Tren & Pola' },
        { key: 'risks', icon: <AlertTriangle className="w-4 h-4" />, text: 'Identifikasi Risiko' }
    ];

    const PerformanceContent = (
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
                                <div className="bg-gradient-to-r from-sky-500 to-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${div.avgPerformance}%` }}></div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{div.employees.length} karyawan • Rata-rata Terlambat: {(div.employees.length > 0 ? (div.totalTardiness / div.employees.length) : 0).toFixed(1)}</div>
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
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-sky-600'}`}>{index + 1}</div>
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
    );

    const TrendsContent = (
        <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" /> Analisis Tren Kehadiran
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {aggregatedData.length > 0 ? (aggregatedData.reduce((sum, emp) => sum + emp.TERLAMBAT, 0) / aggregatedData.length).toFixed(1) : 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Terlambat (jam) / Karyawan</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {aggregatedData.length > 0 ? (aggregatedData.reduce((sum, emp) => sum + emp.SURAT_DOKTER + emp.IJIN_FULL, 0) / aggregatedData.length).toFixed(1) : 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Absen (hari) / Karyawan</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {aggregatedData.length > 0 ? (aggregatedData.reduce((sum, emp) => sum + emp.CUTI, 0) / aggregatedData.length).toFixed(1) : 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Cuti (hari) / Karyawan</div>
                    </div>
                </div>
            </div>
        </div>
    );
    
    const RisksContent = (
        <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-300 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" /> Karyawan Berisiko Tinggi
                </h3>
                <div className="space-y-3">
                    {aggregatedData.filter(emp => emp.TERLAMBAT > 5 || (emp.SURAT_DOKTER + emp.IJIN_FULL) > 3).slice(0, 5).map(emp => (
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
    );

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
            
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Tren Kehadiran per Bulan</h3>
                <div className="h-80">
                    <ChartWrapper chartId="monthly-trend-chart" type="line" data={monthlyTrendData} options={monthlyChartOptions} fallbackText={{ icon: <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-50" />, text: "Data tidak cukup untuk menampilkan tren bulanan." }} />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <div className="flex flex-wrap gap-4 mb-6 no-print">
                    {metrics.map(metric => (
                        <button
                            key={metric.key}
                            onClick={() => setSelectedMetric(metric.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                selectedMetric === metric.key
                                    ? 'bg-sky-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            {metric.icon} {metric.text}
                        </button>
                    ))}
                </div>
                
                {selectedMetric === 'performance' && PerformanceContent}
                {selectedMetric === 'trends' && TrendsContent}
                {selectedMetric === 'risks' && RisksContent}
            </div>
        </motion.div>
    );
};

const ComparisonPage = ({ data, availableYears, availableMonths, onAnalyze, isAiLoading }) => {
    const [yearA, setYearA] = useState('');
    const [monthA, setMonthA] = useState('');
    const [yearB, setYearB] = useState('');
    const [monthB, setMonthB] = useState('');

    const getStats = useCallback((year, month) => {
        let filteredData = data;
        if (year && year !== 'semua') {
            filteredData = filteredData.filter(row => row.TAHUN === year);
        }
        if (month && month !== 'semua') {
            filteredData = filteredData.filter(row => row.BULAN === month);
        }
        
        return {
            tardiness: filteredData.reduce((sum, row) => sum + row.TERLAMBAT, 0),
            totalAbsen: filteredData.reduce((sum, row) => sum + row.SURAT_DOKTER + row.IJIN_FULL, 0),
            totalCuti: filteredData.reduce((sum, row) => sum + row.CUTI, 0),
            employees: new Set(filteredData.map(row => row.NAMA)).size,
        };
    }, [data]);

    const statsA = useMemo(() => yearA && monthA ? getStats(yearA, monthA) : null, [yearA, monthA, getStats]);
    const statsB = useMemo(() => yearB && monthB ? getStats(yearB, monthB) : null, [yearB, monthB, getStats]);

    const getChangeIcon = (valueA, valueB, isGoodWhenLower = true) => {
        if (valueA === valueB) return <Minus className="w-4 h-4 text-gray-500" />;
        const isBetter = isGoodWhenLower ? valueB < valueA : valueB > valueA;
        return isBetter ? <ArrowDown className="w-4 h-4 text-green-500" /> : <ArrowUp className="w-4 h-4 text-red-500" />;
    };

    const getChangeColor = (valueA, valueB, isGoodWhenLower = true) => {
        if (valueA === valueB) return "text-gray-500 dark:text-gray-400";
        const isBetter = isGoodWhenLower ? valueB < valueA : valueB > valueA;
        return isBetter ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400";
    };

    const handleAnalyze = () => {
        if (!statsA || !statsB) return;
        const periodAString = `${monthA} ${yearA}`;
        const periodBString = `${monthB} ${yearB}`;
        
        // Prompt ini sekarang menjadi bagian dari handleAnalyze
        const promptData = {
            periodA: periodAString,
            periodB: periodBString,
            statsA: {
                tardiness: statsA.tardiness,
                totalAbsen: statsA.totalAbsen,
                totalCuti: statsA.totalCuti,
                employees: statsA.employees,
            },
            statsB: {
                tardiness: statsB.tardiness,
                totalAbsen: statsB.totalAbsen,
                totalCuti: statsB.totalCuti,
                employees: statsB.employees,
            }
        };
        onAnalyze(promptData); // Mengirim objek ke fungsi onAnalyze
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

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm no-print transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Pilih Periode untuk Dibandingkan</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tahun A</label>
                            <AnimatedDropdown options={availableYears} selectedValue={yearA} onValueChange={setYearA} placeholder="Pilih tahun..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bulan A</label>
                            <AnimatedDropdown options={availableMonths} selectedValue={monthA} onValueChange={setMonthA} placeholder="Pilih bulan..." />
                        </div>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tahun B</label>
                            <AnimatedDropdown options={availableYears} selectedValue={yearB} onValueChange={setYearB} placeholder="Pilih tahun..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bulan B</label>
                            <AnimatedDropdown options={availableMonths} selectedValue={monthB} onValueChange={setMonthB} placeholder="Pilih bulan..." />
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

            {statsA && statsB && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                        <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Periode A: {monthA || 'N/A'} {yearA || 'N/A'}</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Total Keterlambatan</span>
                                <span className="font-bold text-orange-600 dark:text-orange-400">{statsA.tardiness} kali</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Total Absen (Sakit/Izin)</span>
                                <span className="font-bold text-red-600 dark:text-red-400">{statsA.totalAbsen} hari</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Total Cuti</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{statsA.totalCuti} hari</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Jumlah Karyawan</span>
                                <span className="font-bold text-sky-600 dark:text-sky-400">{statsA.employees} orang</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                        <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Periode B: {monthB || 'N/A'} {yearB || 'N/A'}</h3>
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
                                <span className="text-gray-600 dark:text-gray-400">Total Absen (Sakit/Izin)</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-red-600 dark:text-red-400">{statsB.totalAbsen} hari</span>
                                    {getChangeIcon(statsA.totalAbsen, statsB.totalAbsen)}
                                    <span className={`text-sm font-medium ${getChangeColor(statsA.totalAbsen, statsB.totalAbsen)}`}>
                                        ({statsB.totalAbsen - statsA.totalAbsen > 0 ? '+' : ''}{statsB.totalAbsen - statsA.totalAbsen})
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Total Cuti</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{statsB.totalCuti} hari</span>
                                    {getChangeIcon(statsA.totalCuti, statsB.totalCuti)}
                                    <span className={`text-sm font-medium ${getChangeColor(statsA.totalCuti, statsB.totalCuti)}`}>
                                        ({statsB.totalCuti - statsA.totalCuti > 0 ? '+' : ''}{statsB.totalCuti - statsA.totalCuti})
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">Jumlah Karyawan</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sky-600 dark:text-sky-400">{statsB.employees} orang</span>
                                    {getChangeIcon(statsA.employees, statsB.employees, false)}
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

const ToolsPage = ({ data, availableEmployees, showError }) => {
    const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
    const [isPredicting, setIsPredicting] = useState(false);
    const [predictionResult, setPredictionResult] = useState(null);
    const resultsRef = useRef(null);

    const handlePredict = async () => {
        if (!selectedEmployeeName) {
            showError("Harap pilih seorang karyawan untuk prediksi.", "Input Tidak Lengkap");
            return;
        }

        const employeeRecords = data.filter(row => row.NAMA === selectedEmployeeName);
        if (employeeRecords.length === 0) {
            showError("Tidak ada data yang ditemukan untuk karyawan yang dipilih.", "Data Tidak Ditemukan");
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
        } catch (error) {
            showError(error.message, 'Kesalahan Prediksi');
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
                <p className="text-sky-100 text-lg">Prediksi Cuti menggunakan model Machine Learning.</p>
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
                            {predictionResult.prediksi_cuti_bulan_depan.toFixed(1)}
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

//===================
// 3. UI COMPONENTS
//===================

const NotFoundPage = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertTriangle className="w-16 h-16 text-orange-500 mb-4" />
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white">404 - Halaman Tidak Ditemukan</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Maaf, halaman yang Anda cari tidak ada.</p>
        <Link to="/dashboard" className="mt-6 bg-sky-600 text-white font-semibold py-2 px-6 rounded-lg">
            Kembali ke Dashboard
        </Link>
    </div>
);

const SortIndicator = ({ columnKey, sortConfig }) => {
    if (sortConfig.key !== columnKey) {
        return <ChevronsUpDown size={16} className="text-slate-400 group-hover:text-slate-500" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUp size={16} className="text-sky-600 dark:text-sky-400" />;
    }
    return <ArrowDown size={16} className="text-sky-600 dark:text-sky-400" />;
};

const PayrollPage = ({ data, availableYears, availableMonths }) => {
    const [selectedYear, setSelectedYear] = useState(availableYears[0] || '');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'NAMA', direction: 'ascending' });

    const payrollData = useMemo(() => {
        let filteredData = data;
        if (selectedYear && selectedYear !== 'semua') {
            filteredData = filteredData.filter(row => row.TAHUN === selectedYear);
        }
        if (selectedMonth && selectedMonth !== 'semua') {
            filteredData = filteredData.filter(row => row.BULAN === selectedMonth);
        }

        const employeeData = Array.from(filteredData.reduce((map, row) => {
            const name = row.NAMA;
            if (!map.has(name)) {
                map.set(name, {
                    NAMA: name,
                    DIVISI: row.DIVISI || 'N/A',
                    GAJI_POKOK: row.GAJI_POKOK || 0,
                    UANG_JABATAN: row.UANG_JABATAN || 0,
                    HARI_KERJA: 0,
                    TERLAMBAT: 0,
                    IJIN_FULL: 0,
                    CASHBON: 0,
                });
            }
            const stats = map.get(name);
            stats.HARI_KERJA += row.HARI_KERJA || 0;
            stats.TERLAMBAT += row.TERLAMBAT || 0;
            stats.IJIN_FULL += row.IJIN_FULL || 0;
            stats.CASHBON += row.CASHBON || 0;
            if (row.UANG_JABATAN) {
                stats.UANG_JABATAN = row.UANG_JABATAN;
            }
            return map;
        }, new Map()).values());

        return employeeData.map(emp => {
            const mealAllowance = emp.HARI_KERJA * 20000;
            const transportAllowance = emp.HARI_KERJA * 10000;
            const incentive = emp.HARI_KERJA > 0 ? 100000 : 0;
            const isMarch = getMonthNumber(selectedMonth) === 3;
            const thr = isMarch ? emp.GAJI_POKOK : 0;
            const positionAllowance = emp.UANG_JABATAN || 0;
            
            const totalAllowances = mealAllowance + transportAllowance + incentive + thr + positionAllowance;
            const grossSalary = emp.GAJI_POKOK + totalAllowances;
            
            const lateDeduction = emp.TERLAMBAT * 5000;
            const permitDeduction = emp.IJIN_FULL * 10000;
            const cashbonDeduction = emp.CASHBON;
            const totalDeductions = lateDeduction + permitDeduction + cashbonDeduction;
            
            const netSalary = grossSalary - totalDeductions;
            
            return {
                ...emp,
                positionAllowance,
                totalAllowances,
                thr,
                grossSalary,
                totalDeductions,
                netSalary
            };
        });
    }, [data, selectedYear, selectedMonth]);

    const sortedPayrollData = useMemo(() => {
        let sortableItems = [...payrollData];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [payrollData, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const totals = useMemo(() => {
        return payrollData.reduce((acc, curr) => {
            acc.totalPokok += curr.GAJI_POKOK;
            acc.totalPositionAllowance += curr.positionAllowance;
            acc.totalTunjangan += curr.totalAllowances;
            acc.totalPendapatan += curr.grossSalary;
            acc.totalPotongan += curr.totalDeductions;
            acc.totalBersih += curr.netSalary;
            return acc;
        }, {
            totalPokok: 0,
            totalPositionAllowance: 0,
            totalTunjangan: 0,
            totalPendapatan: 0,
            totalPotongan: 0,
            totalBersih: 0
        });
    }, [payrollData]);
    
    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    const handleExport = () => {
        const dataToExport = payrollData.map(emp => ({
            'Nama Karyawan': emp.NAMA,
            'Divisi': emp.DIVISI,
            'Gaji Pokok': emp.GAJI_POKOK,
            'Tunjangan Jabatan': emp.positionAllowance,
            'Tunjangan Lain': emp.totalAllowances - emp.thr - emp.positionAllowance,
            'THR': emp.thr,
            'Total Pendapatan': emp.grossSalary,
            'Total Potongan': emp.totalDeductions,
            'Gaji Bersih': emp.netSalary
        }));
        exportService.exportToCsv(dataToExport, `ringkasan_gaji_${selectedMonth || 'semua'}_${selectedYear || 'semua'}.csv`);
    };

    return (
        <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-sky-900 dark:text-white flex items-center gap-3">
                            <DollarSign /> Ringkasan Gaji Karyawan
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">Ringkasan penggajian berdasarkan periode yang dipilih.</p>
                    </div>
                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 no-print">
                        <div className="w-full sm:w-40">
                            <AnimatedDropdown options={availableYears} selectedValue={selectedYear} onValueChange={setSelectedYear} placeholder="Pilih Tahun" />
                        </div>
                        <div className="w-full sm:w-40">
                            <AnimatedDropdown options={availableMonths} selectedValue={selectedMonth} onValueChange={setSelectedMonth} placeholder="Semua Bulan" includeAllOption={true} />
                        </div>
                        <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <Download size={16} /> Ekspor
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard icon={<DollarSign />} title="Total Gaji Dibayarkan" value={formatCurrency(totals.totalBersih)} colorClass={{ bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400' }} />
                <KpiCard icon={<TrendingUp />} title="Total Tunjangan & THR" value={formatCurrency(totals.totalTunjangan)} colorClass={{ bg: 'bg-sky-100 dark:bg-sky-900/50', text: 'text-sky-600 dark:text-sky-400' }} />
                <KpiCard icon={<TrendingDown />} title="Total Potongan" value={formatCurrency(totals.totalPotongan)} colorClass={{ bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-600 dark:text-orange-400' }} />
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr className="border-b-2 border-gray-200 dark:border-slate-700">
                                <th 
                                    className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600/50 transition-colors group"
                                    onClick={() => requestSort('NAMA')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Nama Karyawan</span>
                                        <SortIndicator columnKey="NAMA" sortConfig={sortConfig} />
                                    </div>
                                </th>
                                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Gaji Pokok</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Uang Jabatan</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Tunjangan Lain</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">THR</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Total Pendapatan</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Total Potongan</th>
                                <th 
                                    className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600/50 transition-colors group"
                                    onClick={() => requestSort('netSalary')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        <span>Gaji Bersih</span>
                                        <SortIndicator columnKey="netSalary" sortConfig={sortConfig} />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPayrollData.map(employee => (
                                <tr key={employee.NAMA} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                                        <div>{employee.NAMA}</div>
                                        <div className="text-xs text-gray-500">{employee.DIVISI}</div>
                                    </td>
                                    <td className="p-4 text-right text-gray-700 dark:text-gray-300">{formatCurrency(employee.GAJI_POKOK)}</td>
                                    <td className="p-4 text-right text-gray-700 dark:text-gray-300">{formatCurrency(employee.positionAllowance)}</td>
                                    <td className="p-4 text-right text-gray-700 dark:text-gray-300">{formatCurrency(employee.totalAllowances - employee.thr - employee.positionAllowance)}</td>
                                    <td className="p-4 text-right text-gray-700 dark:text-gray-300">{formatCurrency(employee.thr)}</td>
                                    <td className="p-4 text-right font-semibold text-sky-700 dark:text-sky-400">{formatCurrency(employee.grossSalary)}</td>
                                    <td className="p-4 text-right text-orange-600 dark:text-orange-400">(-) {formatCurrency(employee.totalDeductions)}</td>
                                    <td className="p-4 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(employee.netSalary)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-slate-700">
                            <tr className="font-bold text-gray-800 dark:text-gray-200">
                                <td className="p-4">Total</td>
                                <td className="p-4 text-right">{formatCurrency(totals.totalPokok)}</td>
                                <td className="p-4 text-right">{formatCurrency(totals.totalPositionAllowance)}</td>
                                <td className="p-4 text-right">{formatCurrency(totals.totalTunjangan - totals.totalPositionAllowance)}</td>
                                <td className="p-4 text-right"></td>
                                <td className="p-4 text-right">{formatCurrency(totals.totalPendapatan)}</td>
                                <td className="p-4 text-right">(-) {formatCurrency(totals.totalPotongan)}</td>
                                <td className="p-4 text-right">{formatCurrency(totals.totalBersih)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};


const OverallDashboard = ({ data, onAnalyzeIndividual, onAnalyzeOverall, isAiLoading }) => {
    const [selectedYear, setSelectedYear] = useState('semua');
    const [selectedMonth, setSelectedMonth] = useState('semua');
    const [selectedEmployee, setSelectedEmployee] = useState('semua');
    const [selectedDivision, setSelectedDivision] = useState('semua');
    const [expandedDivision, setExpandedDivision] = useState(null);
    const { availableYears, availableMonths, availableEmployees, availableDivisions } = useAttendanceData(data);
    const navigate = useNavigate();

    const filteredAvailableEmployees = useMemo(() => {
        if (selectedDivision === 'semua') {
            return availableEmployees;
        }
        const employeesInDivision = data
            .filter(item => item.DIVISI === selectedDivision)
            .map(item => item.NAMA);
        return [...new Set(employeesInDivision)].sort();
    }, [data, selectedDivision, availableEmployees]);

    useEffect(() => {
        if (selectedEmployee !== 'semua' && !filteredAvailableEmployees.includes(selectedEmployee)) {
            setSelectedEmployee('semua');
        }
    }, [selectedDivision, selectedEmployee, filteredAvailableEmployees]);

    const useFilteredData = (allData, year, month, employee, division) => {
        return useMemo(() => {
            let filtered = allData;
            if (year !== 'semua') filtered = filtered.filter(item => item.TAHUN === year);
            if (month !== 'semua') filtered = filtered.filter(item => item.BULAN === month);
            if (employee !== 'semua') filtered = filtered.filter(item => item.NAMA === employee);
            if (division !== 'semua') filtered = filtered.filter(item => item.DIVISI === division);

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
                    new: { totalTardiness: 0, count: 0 }, 
                    mid: { totalTardiness: 0, count: 0 }, 
                    senior: { totalTardiness: 0, count: 0 },
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
        }, [allData, year, month, employee, division]);
    };

    const { kpis, topTardiness, absenceDistribution, tableData, divisionalAnalysis, deepInsights } = useFilteredData(data, selectedYear, selectedMonth, selectedEmployee, selectedDivision);

    const tardinessChartOptions = { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true }, y: { grid: { display: false } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (ctx) => topTardiness[ctx[0].dataIndex]?.NAMA || '' } } } };
    const tardinessChartData = { labels: topTardiness.map(item => item.NAMA.length > 15 ? item.NAMA.substring(0, 15) + '...' : item.NAMA), datasets: [{ label: 'Jumlah Keterlambatan', data: topTardiness.map(item => item.TERLAMBAT), backgroundColor: 'rgba(3, 105, 161, 0.8)', borderColor: 'rgba(3, 105, 161, 1)', borderWidth: 1, borderRadius: 6 }] };
    const totalAbsence = Object.values(absenceDistribution).reduce((a, b) => a + b, 0);
    const absenceChartOptions = { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', padding: 20 }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.formattedValue} hari (${(totalAbsence > 0 ? ((ctx.parsed * 100) / totalAbsence).toFixed(1) : 0)}%)` } } } };
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
    
    const handleAnalyzeIndividualClick = (employee) => {
        navigate(`/employee/${encodeURIComponent(employee.NAMA)}`);
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm no-print transition-colors duration-300">
                <div className="flex flex-col lg:flex-row flex-wrap gap-6 items-center">
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-4 gap-6">
                         <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="w-6 h-6 text-sky-700 dark:text-sky-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <AnimatedDropdown options={availableYears} selectedValue={selectedYear} onValueChange={setSelectedYear} placeholder="Semua Tahun" includeAllOption={true} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="w-6 h-6 text-sky-700 dark:text-sky-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <AnimatedDropdown options={availableMonths} selectedValue={selectedMonth} onValueChange={setSelectedMonth} placeholder="Semua Bulan" includeAllOption={true} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                            <Briefcase className="w-6 h-6 text-sky-700 dark:text-sky-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <AnimatedDropdown options={availableDivisions} selectedValue={selectedDivision} onValueChange={setSelectedDivision} placeholder="Semua Divisi" includeAllOption={true} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                            <UserCheck className="w-6 h-6 text-sky-700 dark:text-sky-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <AnimatedDropdown options={filteredAvailableEmployees} selectedValue={selectedEmployee} onValueChange={setSelectedEmployee} placeholder="Semua Karyawan" includeAllOption={true} />
                            </div>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button onClick={handleOverallAnalysisClick} disabled={isAiLoading} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg">
                            <Sparkles className="w-5 h-5" />
                            {isAiLoading ? 'Menganalisis...' : 'Analisis Umum'}
                        </button>
                        <button onClick={handleExport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 shadow hover:shadow-lg">
                            <Download size={16} /> Ekspor Data
                        </button>
                    </div>
                </div>
            </div>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><KpiCard icon={<Users />} title="Total Karyawan" value={kpis.totalEmployees} colorClass={{ bg: 'bg-sky-100 dark:bg-sky-900/50', text: 'text-sky-700 dark:text-sky-400' }} /></motion.div>
                <motion.div variants={itemVariants}><KpiCard icon={<Clock />} title="Total Keterlambatan" value={kpis.totalTardiness} unit="kali" colorClass={{ bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-600 dark:text-orange-400' }} /></motion.div>
                <motion.div variants={itemVariants}><KpiCard icon={<UserX />} title="Total Absensi" value={kpis.totalAbsence} unit="hari" colorClass={{ bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-400' }} /></motion.div>
                <motion.div variants={itemVariants}><KpiCard icon={<Calendar />} title="Total Hari Kerja" value={kpis.totalWorkDays} colorClass={{ bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400' }} /></motion.div>
            </motion.div>

            {deepInsights && (
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                    <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300 flex items-center gap-2">
                        <Zap className="text-yellow-500" /> Wawasan Mendalam
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">Korelasi Lama Bekerja & Keterlambatan</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{deepInsights.tenureTardiness}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">Divisi Paling Disiplin</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{deepInsights.bestDivision ? `${deepInsights.bestDivision.name} (Rata-rata telat: ${deepInsights.bestDivision.avgTardiness.toFixed(1)}x)` : 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">Karyawan Paling Disiplin</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{deepInsights.bestEmployee ? `${deepInsights.bestEmployee.NAMA} (Telat: ${deepInsights.bestEmployee.TERLAMBAT}x)` : 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">Divisi Perlu Perhatian</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{deepInsights.worstDivision && deepInsights.worstDivision.name !== deepInsights.bestDivision.name ? `${deepInsights.worstDivision.name} (Rata-rata telat: ${deepInsights.worstDivision.avgTardiness.toFixed(1)}x)` : 'Semua divisi menunjukkan performa serupa.'}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300 flex flex-col">
                    <h3 className="text-xl font-semibold mb-6 text-sky-900 dark:text-sky-300 flex items-center flex-shrink-0">
                        <div className="w-3 h-3 bg-sky-600 rounded-full mr-3"></div>
                        10 Karyawan Paling Sering Terlambat
                    </h3>
                    <div className="flex-grow h-80">
                        <ChartWrapper chartId="chart-tardiness" type="bar" data={tardinessChartData} options={tardinessChartOptions} fallbackText={{ icon: <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />, text: "Tidak ada data keterlambatan" }} />
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300 flex flex-col">
                    <h3 className="text-xl font-semibold mb-6 text-sky-900 dark:text-sky-300 flex items-center flex-shrink-0">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                        Distribusi Tipe Absensi
                    </h3>
                    <div className="flex-grow h-80">
                        <ChartWrapper chartId="chart-absence" type="doughnut" data={absenceChartData} options={absenceChartOptions} fallbackText={{ icon: <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />, text: "Tidak ada data absensi" }} />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-6 text-sky-900 dark:text-sky-300">Analisis per Divisi</h3>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                    {divisionalAnalysis.map(div => (
                        <motion.div key={div.name} variants={itemVariants}>
                            <div onClick={() => handleDivisionClick(div.name)} className={`bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${expandedDivision === div.name ? 'ring-2 ring-sky-500' : 'hover:border-sky-400'}`}>
                                <h4 className="font-semibold text-lg text-sky-800 dark:text-sky-400 mb-3 flex items-center">
                                    <Briefcase size={20} className="mr-2" />
                                    {div.name}
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                            <Users size={14} className="mr-2" />Jml Karyawan
                                        </span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{div.employeeCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                            <Clock size={14} className="mr-2" />Total Terlambat
                                        </span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{div.totalTardiness} kali</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                            <Clock size={14} className="mr-2" />Rata-rata Terlambat
                                        </span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{div.employeeCount > 0 ? (div.totalTardiness / div.employeeCount).toFixed(1) : 0} / kary.</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                            <UserMinus size={14} className="mr-2" />Total Cuti
                                        </span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{div.totalLeave} hari</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
                <AnimatePresence>
                    {expandedDivision && (
                        <motion.div
                            className="mt-6 border-t dark:border-slate-700 pt-6"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold text-sky-900 dark:text-sky-300">Detail Karyawan Divisi: {expandedDivision}</h4>
                                <button onClick={() => exportService.exportToCsv(tableData.filter(emp => emp.DIVISI === expandedDivision), `detail_divisi_${expandedDivision}.csv`)} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 text-xs rounded-lg flex items-center gap-1 no-print">
                                    <Download size={14} /> Ekspor Divisi
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                                            <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Nama Karyawan</th>
                                            <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center">Terlambat</th>
                                            <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center">Absen (Sakit/Izin)</th>
                                            <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center no-print">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.filter(emp => emp.DIVISI === expandedDivision).map(employee => (
                                            <tr key={employee.NAMA} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                                <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{employee.NAMA}</td>
                                                <td className="p-3 text-center text-gray-700 dark:text-gray-300">{employee.TERLAMBAT}</td>
                                                <td className="p-3 text-center text-gray-700 dark:text-gray-300">{employee.SURAT_DOKTER + employee.IJIN_FULL}</td>
                                                <td className="p-3 no-print flex justify-center items-center">
                                                    <button onClick={() => handleAnalyzeIndividualClick(employee)} disabled={isAiLoading} className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1 px-3 text-xs rounded-lg transition-all flex items-center gap-1 disabled:opacity-50">
                                                        <Sparkles size={14} /> Analisis
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


const Sidebar = ({ employees, onReset, isSidebarCollapsed, onToggleCollapse, onGeneratePdf }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return employees;
        return employees.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [employees, searchTerm]);

    return (
        <div className="bg-slate-800 text-slate-200 flex flex-col h-full">
            <div className={`p-4 border-b border-slate-700 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                <h1 className={`text-2xl font-bold text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>Dasbor SDM</h1>
                <button onClick={onToggleCollapse} className="p-1 rounded-lg hover:bg-slate-700">
                    {isSidebarCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
                </button>
            </div>
            <nav className="p-4 space-y-2">
                <Link to="/dashboard" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <LayoutDashboard className="w-5 h-5" />
                    {!isSidebarCollapsed && <span>Dasbor Umum</span>}
                </Link>
                <Link to="/analytics" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <TrendingUp className="w-5 h-5" />
                    {!isSidebarCollapsed && <span>Analisis & Wawasan</span>}
                </Link>
                <Link to="/comparison" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <GitCompareArrows className="w-5 h-5" />
                    {!isSidebarCollapsed && <span>Perbandingan Periode</span>}
                </Link>
                <Link to="/tools" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <BrainCircuit className="w-5 h-5" />
                    {!isSidebarCollapsed && <span>Alat & Prediksi</span>}
                </Link>
                <Link to="/payroll" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <DollarSign className="w-5 h-5" />
                    {!isSidebarCollapsed && <span>Ringkasan Gaji</span>}
                 </Link>
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
                            {filteredEmployees.map(name => (
                                <li key={name}>
                                    <Link to={`/employee/${encodeURIComponent(name)}`} className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors`}>
                                        <span className="truncate">{name}</span>
                                        <ChevronsRight className="w-4 h-4" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </CustomScrollbar>
                </div>
            </div>
            <div className="p-4 mt-auto border-t border-slate-700 space-y-3">
                <motion.button
                    onClick={onGeneratePdf}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className={`w-full flex items-center py-2.5 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-sky-500 to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-400 ${
                        isSidebarCollapsed ? 'justify-center px-3' : 'justify-start px-4 gap-3'
                    }`}
                >
                    <Printer className="w-5 h-5 flex-shrink-0" />
                    <span className={`truncate transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                        Cetak Laporan
                    </span>
                </motion.button>
                <motion.button
                    onClick={onReset}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className={`w-full flex items-center py-2.5 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-red-500 to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-400 ${
                        isSidebarCollapsed ? 'justify-center px-3' : 'justify-start px-4 gap-3'
                    }`}
                >
                    <Upload className="w-5 h-5 flex-shrink-0" />
                    <span className={`truncate transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                        Unggah Baru
                    </span>
                </motion.button>
            </div>
        </div>
    );
};

const DashboardLayout = ({ data, onReset, onAnalyzeIndividual, onAnalyzeOverall, isAiLoading, onAnalyzeComparison, isLoading, showError }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { availableEmployees, availableYears, availableMonths } = useAttendanceData(data);
    const contentRef = useRef(null);

    const handleGeneratePdf = () => {
        const input = contentRef.current;
        if (!input) {
            showError("Tidak dapat menemukan konten untuk membuat PDF.", "Kesalahan Ekspor");
            return;
        }
        if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
            showError("Library PDF belum siap. Coba lagi sesaat.", "Kesalahan Ekspor");
            return;
        }

        const { jsPDF } = window.jspdf;
        
        const pageTitleElement = input.querySelector('h2');
        const pageTitle = pageTitleElement ? pageTitleElement.innerText.trim().replace(/\s+/g, '_') : 'Laporan';
        const fileName = `${pageTitle}-${new Date().toISOString().slice(0, 10)}.pdf`;

        const elementsToHide = input.querySelectorAll('.no-print');
        elementsToHide.forEach(el => el.style.display = 'none');

        // Terapkan tema terang sementara untuk hasil cetak yang bersih
        const root = window.document.documentElement;
        const originalTheme = root.className;
        root.className = 'light'; // Paksa mode terang

        html2canvas(input, {
            scale: 2, 
            useCORS: true,
            logging: false,
            onclone: (document) => {
                const clonedContent = document.querySelector('.print-main');
                if (clonedContent) {
                    clonedContent.style.height = 'auto';
                    clonedContent.style.overflow = 'visible';
                }
            }
        }).then(canvas => {
            elementsToHide.forEach(el => el.style.display = '');
            root.className = originalTheme;
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;

            const pdf = new jsPDF('p', 'mm', 'a4');
            let position = 0;

            // Tambahkan halaman pertama
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Tambahkan halaman berikutnya jika kontennya panjang
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            pdf.save(fileName);

        }).catch(err => {
            // Pastikan UI kembali normal jika terjadi error
            elementsToHide.forEach(el => el.style.display = '');
            root.className = originalTheme;
            showError("Gagal membuat PDF: " + err.message, "Kesalahan Ekspor");
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
                <aside className={`flex-shrink-0 no-print transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
                    <Sidebar
                        employees={[]}
                        onReset={onReset}
                        isSidebarCollapsed={isSidebarCollapsed}
                        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        onGeneratePdf={() => {}}
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
                    onReset={onReset}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onGeneratePdf={handleGeneratePdf}
                />
            </aside>
            <main className="flex-1 overflow-hidden">
                <CustomScrollbar>
                    <div className="p-8 print-main" ref={contentRef}>
                        <AnimatePresence mode="wait">
                            <Routes>
                                <Route path="/dashboard" element={<OverallDashboard key="dashboard" data={data} onAnalyzeIndividual={onAnalyzeIndividual} onAnalyzeOverall={onAnalyzeOverall} isAiLoading={isAiLoading} />} />
                                <Route path="/analytics" element={<AnalyticsPage key="analytics" data={data} />} />
                                <Route path="/comparison" element={<ComparisonPage key="comparison" data={data} availableYears={availableYears} availableMonths={availableMonths} onAnalyze={onAnalyzeComparison} isAiLoading={isAiLoading} />} />
                                <Route path="/tools" element={<ToolsPage key="tools" data={data} availableEmployees={availableEmployees} showError={showError} />} />
                                <Route path="/payroll" element={<PayrollPage key="payroll" data={data} availableYears={availableYears} availableMonths={availableMonths} />} />
                                <Route path="/employee/:employeeName" element={<EmployeeDetailView key="employee" allData={data} onAnalyze={onAnalyzeIndividual} isAiLoading={isAiLoading} />} />
                                <Route path="/" element={<OverallDashboard key="dashboard" data={data} onAnalyzeIndividual={onAnalyzeIndividual} onAnalyzeOverall={onAnalyzeOverall} isAiLoading={isAiLoading} />} />
                                 <Route path="*" element={<NotFoundPage />} /> {/* Catch-all route for 404 */}
                            </Routes>
                        </AnimatePresence>
                    </div>
                </CustomScrollbar>
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
                if (window.Papa && window.Chart && window.jspdf && window.html2canvas) {
                    setScriptsLoaded(true);
                    return;
                }
                await Promise.all([
                    loadScript("https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js"),
                    loadScript("https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"),
                    loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
                    loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js")
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
                    // Navigate to dashboard on successful upload
                    window.location.hash = "/dashboard";
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
        window.location.hash = "";
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
         body { background-color: #fff !important; }
         .no-print { display: none !important; }
         .print-main { padding: 0 !important; margin: 0 !important; overflow: visible !important; height: auto !important; }
         .printable-content, .bg-white, .bg-slate-50 { box-shadow: none !important; border: 1px solid #eee !important; }
         .dark\\:bg-slate-800, .dark\\:bg-slate-900 { background-color: #fff !important; }
         .dark\\:text-white, .dark\\:text-slate-200, .dark\\:text-slate-300, .dark\\:text-sky-300 { color: #1e293b !important; }
       }
     `}</style>
    );

    return (
        <>
            <GlobalScrollbarStyles />
            <PrintStyles />
            {showDashboard ? (
                <DashboardLayout
                    data={allData}
                    onReset={resetDashboard}
                    onAnalyzeIndividual={handleGetIndividualAnalysis}
                    onAnalyzeOverall={handleGetOverallAnalysis}
                    onAnalyzeComparison={handleGetComparisonAnalysis}
                    isAiLoading={aiModal.isLoading}
                    isLoading={isLoading}
                    showError={showError}
                />
            ) : (
                <FileUploadScreen onFileSelect={handleFileSelect} isLoading={isLoading} scriptsLoaded={scriptsLoaded} />
            )}
            {/* <ThemeToggleFAB /> */}
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
        <RouterProvider>
            <App />
        </RouterProvider>
);

export default Root;