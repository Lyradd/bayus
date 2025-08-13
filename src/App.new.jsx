import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext, useReducer } from 'react';
import { Upload, Users, Clock, UserX, Calendar, FileText, RefreshCw, X, UserCheck, Sparkles, LoaderCircle, BarChart2, Briefcase, UserMinus, TrendingUp, Award, AlertTriangle, Search, LayoutDashboard, ChevronsRight, Zap, ShieldCheck, Download, GitCompareArrows, ArrowUp, ArrowDown, Minus, Printer, ChevronsLeft, ChevronDown, Bell, Settings, Moon, Sun, Filter, Eye, EyeOff, ChevronRight, Star, Target, Activity, Database, Globe, Layers, Plus, Edit, Trash2, Save, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ================================================================
// CONTEXTS & PROVIDERS
// ================================================================

const ThemeContext = createContext();
const NotificationContext = createContext();
const DataContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hr-dashboard-theme') || 'light';
    }
    return 'light';
  });
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (typeof window !== 'undefined') {
      localStorage.setItem('hr-dashboard-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

// ================================================================
// HELPER FUNCTIONS
// ================================================================

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
    const lowerMonth = String(monthName).toLowerCase().trim();
    return monthMapping[lowerMonth] || 0;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

// ================================================================
// ADVANCED CUSTOM HOOKS
// ================================================================

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const useIntersectionObserver = (options) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    if (ref.current) observer.observe(ref.current);
    
    return () => {
        if(ref.current) {
            observer.unobserve(ref.current);
        }
    };
  }, [options]);

  return [ref, isIntersecting];
};

const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyPress = (event) => {
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;
      
      Object.entries(shortcuts).forEach(([shortcut, callback]) => {
        const [targetKey, needsModifier] = shortcut.split('+');
        if (key === targetKey && (!needsModifier || modifier)) {
          event.preventDefault();
          callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
};

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// ================================================================
// UI COMPONENTS
// ================================================================

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  if (!notifications.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.5 }}
            className={`p-4 rounded-lg shadow-lg max-w-sm flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              notification.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            {notification.type === 'info' && <Info className="w-5 h-5" />}
            <span className="flex-1 text-sm">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </motion.button>
  );
};

const AnimatedCounter = ({ value, duration = 2000, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

const FloatingActionButton = ({ children, onClick, className = "", tooltip = "" }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`fixed bottom-6 right-6 w-14 h-14 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 ${className}`}
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
      title={tooltip}
    >
      {children}
    </motion.button>
  );
};

const InteractiveCard = ({ children, className = "", onClick, ...props }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm cursor-pointer ${className}`}
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      {...props}
    >
      <motion.div
        animate={{ scale: isHovered ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <LoaderCircle className={`animate-spin text-sky-600 ${sizeClasses[size]}`} />
    </div>
  );
};

const ProgressBar = ({ progress, className = '', showPercentage = true }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <motion.div
        className="bg-sky-600 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {showPercentage && (
        <div className="text-xs text-gray-600 mt-1 text-right">
          {progress.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

// ================================================================
// SKELETON COMPONENTS
// ================================================================

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

// ================================================================
// SERVICES
// ================================================================

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
      const apiKey = "AIzaSyD7Q1TluheHo7v1prT-stWnzHuQgG-LHZw"; 
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
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

  exportToJson: (data, filename = 'export.json') => {
    if (!data || data.length === 0) {
      console.error("Tidak ada data untuk diekspor.");
      return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
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

  exportToPdf: (elementId, filename = 'report.pdf') => {
    // This would require a PDF library, but for now we'll use the browser's print functionality
    window.print();
  }
};

// ================================================================
// CUSTOM HOOKS
// ================================================================

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

  const availableDivisions = useMemo(() => {
    return [...new Set(allData.map(item => item.DIVISI))].filter(Boolean).sort();
  }, [allData]);

  return { getEmployeeByName, availableMonths, availableEmployees, availableDivisions, allData };
};

// ================================================================
// MAIN COMPONENTS
// ================================================================

const FileUploadScreen = ({ onFileSelect, isLoading, scriptsLoaded }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleDrop = useCallback((e) => { 
    e.preventDefault(); 
    setDragOver(false); 
    const files = e.dataTransfer.files; 
    if (files && files.length > 0) onFileSelect(files[0]); 
  }, [onFileSelect]);
  
  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); if (e.currentTarget.contains(e.relatedTarget)) return; setDragOver(false); }, []);
  const handleFileInputChange = useCallback((e) => { if (e.target.files && e.target.files.length > 0) { onFileSelect(e.target.files[0]); e.target.value = null; } }, [onFileSelect]);
  
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 15;
        });
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setUploadProgress(0);
    }
  }, [isLoading]);

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <FileText className="w-16 h-16 mx-auto text-sky-600 mb-4" />
        </motion.div>
        <motion.h1 
          className="text-5xl md:text-6xl font-bold text-sky-900 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Dashboard Analisis
        </motion.h1>
        <motion.h2 
          className="text-3xl md:text-4xl font-semibold text-gray-700 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Absensi Karyawan
        </motion.h2>
        <motion.p 
          className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Unggah file CSV Anda untuk mendapatkan wawasan mendalam dan analisis AI tentang pola kehadiran tim Anda.
        </motion.p>
      </div>
      
      <motion.div 
        className="max-w-2xl w-full mx-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {!scriptsLoaded ? (
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm">
              <RefreshCw className="w-5 h-5 mr-3 animate-spin text-sky-600" />
              <span className="text-gray-600">Mempersiapkan aplikasi...</span>
            </div>
          </div>
        ) : (
          <div 
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group ${
              dragOver ? 'border-sky-500 bg-sky-50 scale-105' : 'border-gray-300 hover:border-sky-600 hover:bg-white'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input 
              type="file" 
              id="file-input" 
              className="hidden" 
              accept=".csv" 
              onChange={handleFileInputChange} 
              disabled={!scriptsLoaded} 
            />
            <div className="flex flex-col items-center">
              <div className={`p-4 rounded-full mb-6 transition-all duration-300 ${
                dragOver ? 'bg-sky-100 scale-110' : 'bg-gray-100 group-hover:bg-sky-100'
              }`}>
                <Upload className={`w-12 h-12 transition-colors duration-300 ${
                  dragOver ? 'text-sky-600' : 'text-gray-400 group-hover:text-sky-600'
                }`} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                {dragOver ? 'Lepaskan file di sini' : 'Seret & lepas file CSV'}
              </h3>
              <p className="text-gray-500 mb-6">atau</p>
              <button className="bg-sky-700 hover:bg-sky-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                Pilih File
              </button>
              <p className="text-sm text-gray-500 mt-4">Mendukung file CSV maks. 10MB</p>
            </div>
          </div>
        )}
        
        {isLoading && (
          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="inline-flex flex-col items-center px-6 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm max-w-sm mx-auto">
              <RefreshCw className="w-8 h-8 mb-3 animate-spin text-sky-600" />
              <span className="text-gray-600 font-medium mb-3">Memproses data...</span>
              <div className="w-full">
                <ProgressBar progress={uploadProgress} showPercentage={false} />
              </div>
              <span className="text-xs text-gray-500 mt-2">
                {uploadProgress < 30 ? 'Membaca file...' : 
                 uploadProgress < 60 ? 'Memvalidasi data...' : 
                 uploadProgress < 90 ? 'Memproses...' : 'Hampir selesai...'}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

const KpiCard = ({ icon, title, value, unit, colorClass, small = false, trend = null, onClick = null }) => (
  <motion.div 
    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm flex items-center gap-4 transition-all duration-200 ${
      small ? 'p-4' : 'p-6'
    } ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}`}
    whileHover={onClick ? { y: -2 } : {}}
    onClick={onClick}
  >
    <div className={`rounded-xl ${colorClass.bg} ${small ? 'p-2' : 'p-3'}`}>
      {React.cloneElement(icon, { className: `${colorClass.text} ${small ? 'w-6 h-6' : 'w-8 h-8'}` })}
    </div>
    <div className="flex-1">
      <p className={`text-gray-600 dark:text-gray-300 font-medium ${small ? 'text-xs' : 'text-sm'}`}>
        {title}
      </p>
      <div className="flex items-center gap-2">
        <p className={`font-bold text-gray-800 dark:text-gray-100 ${small ? 'text-2xl' : 'text-3xl'}`}>
          <AnimatedCounter value={value} />
          {unit && <span className={small ? 'text-base' : 'text-lg'}> {unit}</span>}
        </p>
        {trend && (
          <div className={`flex items-center text-xs ${
            trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-500'
          }`}>
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : 
             trend < 0 ? <ArrowDown className="w-3 h-3" /> : 
             <Minus className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

const ChartWrapper = ({ chartId, type, data, options, fallbackText, className = "" }) => {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  
  useEffect(() => { 
    if (!window.Chart || !canvasRef.current) return; 
    if (chartRef.current) chartRef.current.destroy(); 
    if (!data || (data.datasets && data.datasets.every(ds => ds.data.every(d => d === 0)))) { 
      return; 
    } 
    try { 
      chartRef.current = new window.Chart(canvasRef.current, { type, data, options }); 
    } catch (error) { 
      console.error("Chart.js error:", error); 
    } 
    return () => { 
      if (chartRef.current) { 
        chartRef.current.destroy(); 
        chartRef.current = null; 
      } 
    }; 
  }, [type, data, options]);
  
  const hasData = data && data.datasets && data.datasets.some(ds => ds.data.some(d => d > 0));
  
  return (
    <div className={`h-80 w-full ${className}`}>
      {hasData ? (
        <canvas id={chartId} ref={canvasRef}></canvas>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            {fallbackText.icon}
            <p className="mt-2">{fallbackText.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Modal = ({ show, title, message, onClose, type = 'info' }) => { 
  if (!show) return null; 
  
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      default: return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {getIcon()}
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{message}</p>
          </div>
          <div className="flex justify-end p-4 bg-gray-50 dark:bg-gray-700 rounded-b-2xl">
            <button 
              onClick={onClose} 
              className="bg-sky-700 hover:bg-sky-800 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              OK
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  ); 
};

const AiAnalysisModal = ({ show, title, content, isLoading, onClose }) => { 
  if (!show) return null; 
  
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-sky-900 dark:text-sky-100 flex items-center gap-3">
              <Sparkles className="text-orange-500"/>
              {title}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {isLoading ? (
              <AiAnalysisSkeleton />
            ) : (
              <div 
                className="prose prose-sm md:prose-base max-w-none text-gray-700 dark:text-gray-300" 
                dangerouslySetInnerHTML={{ 
                  __html: content
                    .replace(/### \*\*(.*?)\*\*/g, `<h3 class="text-lg font-semibold text-sky-800 dark:text-sky-200 mt-4 mb-2">$1</h3>`)
                    .replace(/\*\*(.*?)\*\*/g, `<strong class="text-gray-900 dark:text-gray-100">$1</strong>`)
                    .replace(/\n/g, `<br />`) 
                }}
              />
            )}
          </div>
          <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-2xl">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Zap className="w-4 h-4" />
              <span>Powered by Gemini AI</span>
            </div>
            <div className="flex gap-3">
              {!isLoading && (
                <button 
                  onClick={() => exportService.exportToJson([{ title, content, timestamp: new Date().toISOString() }], 'ai-analysis.json')}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Simpan
                </button>
              )}
              <button 
                onClick={onClose} 
                className="bg-sky-700 hover:bg-sky-800 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  ); 
};

const AnimatedDropdown = ({ options, selectedValue, onValueChange, placeholder, includeAllOption = false, disabled = false }) => {
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
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-sky-500 flex justify-between items-center transition-colors ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
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
                        className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                        {includeAllOption && (
                            <li
                                onClick={() => handleSelect('semua')}
                                className="px-4 py-2 hover:bg-sky-100 dark:hover:bg-sky-900 cursor-pointer text-gray-800 dark:text-gray-200"
                            >
                                {placeholder}
                            </li>
                        )}
                        {options.map(option => (
                            <li
                                key={option}
                                onClick={() => handleSelect(option)}
                                className="px-4 py-2 hover:bg-sky-100 dark:hover:bg-sky-900 cursor-pointer text-gray-800 dark:text-gray-200"
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

const SearchableTable = ({ data, columns, onRowClick, searchPlaceholder = "Cari...", itemsPerPage = 10 }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm) return data;
    
    return data.filter(item =>
      columns.some(column =>
        String(item[column.key] || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    );
  }, [data, debouncedSearchTerm, columns]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left bg-white dark:bg-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                  }`}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortConfig.key === column.key && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUp className="w-4 h-4" /> : 
                        <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${
                  onRowClick ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' : ''
                }`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className="p-3 text-gray-700 dark:text-gray-300">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} dari {sortedData.length} data
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Sebelumnya
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === i + 1
                    ? 'bg-sky-600 text-white'
                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const EmployeeDetailView = ({ employee, onAnalyze, isAiLoading }) => {
    if (!employee) {
        return (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Pilih karyawan dari sidebar untuk melihat detail.</p>
            </div>
          </div>
        );
    }

    const attendanceScore = Math.max(0, 100 - (employee.TERLAMBAT * 2) - ((employee.SURAT_DOKTER + employee.IJIN_FULL) * 1.5));
    
    return (
        <motion.div 
            className="space-y-8 printable-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Employee Header */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {employee.NAMA.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-sky-900 dark:text-sky-100">{employee.NAMA}</h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300">{employee.JABATAN} • {employee.DIVISI}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                <span>Lama Bekerja: {employee.LAMA_BEKERJA || 'N/A'} tahun</span>
                                <span>•</span>
                                <span>Skor Kehadiran: <strong className={attendanceScore >= 80 ? 'text-green-600' : attendanceScore >= 60 ? 'text-yellow-600' : 'text-red-600'}>{attendanceScore.toFixed(1)}</strong></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => exportService.exportToCsv([employee], `detail_${employee.NAMA}.csv`)}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 no-print"
                        >
                            <Download className="w-4 h-4" />
                            Ekspor
                        </button>
                        <button 
                            onClick={() => onAnalyze(employee)} 
                            disabled={isAiLoading} 
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg no-print"
                        >
                            <Sparkles className="w-5 h-5" />
                            {isAiLoading ? 'Menganalisis...' : 'Analisis AI Personal'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Employee KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    icon={<Clock />} 
                    title="Total Terlambat" 
                    value={employee.TERLAMBAT} 
                    unit="kali" 
                    colorClass={{ bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-600 dark:text-orange-400' }} 
                    small 
                />
                <KpiCard 
                    icon={<UserX />} 
                    title="Total Absen Sakit" 
                    value={employee.SURAT_DOKTER} 
                    unit="hari" 
                    colorClass={{ bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-600 dark:text-red-400' }} 
                    small 
                />
                <KpiCard 
                    icon={<UserMinus />} 
                    title="Total Absen Izin" 
                    value={employee.IJIN_FULL} 
                    unit="hari" 
                    colorClass={{ bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-600 dark:text-yellow-400' }} 
                    small 
                />
                <KpiCard 
                    icon={<Calendar />} 
                    title="Total Cuti" 
                    value={employee.CUTI} 
                    unit="hari" 
                    colorClass={{ bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-400' }} 
                    small 
                />
            </div>

            {/* Performance Chart */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100">Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Attendance Score</h4>
                        <div className="relative">
                            <div className="w-32 h-32 mx-auto">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        className="text-gray-200 dark:text-gray-600"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${attendanceScore * 2.51} 251`}
                                        className={attendanceScore >= 80 ? 'text-green-500' : attendanceScore >= 60 ? 'text-yellow-500' : 'text-red-500'}
                                    />
                                </svg>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">{attendanceScore.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Tingkat Kehadiran</span>
                            <span className="font-semibold">{employee.HARI_KERJA > 0 ? ((employee.HARI_KERJA - employee.TERLAMBAT - employee.SURAT_DOKTER - employee.IJIN_FULL) / employee.HARI_KERJA * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Kedisiplinan</span>
                            <span className="font-semibold">{employee.TERLAMBAT === 0 ? '100' : Math.max(0, 100 - (employee.TERLAMBAT * 10)).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Konsistensi</span>
                            <span className="font-semibold">{employee.HARI_KERJA > 0 ? (employee.HARI_KERJA / (employee.HARI_KERJA + employee.CUTI) * 100).toFixed(1) : 0}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Further Details */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100">Ringkasan Kehadiran</h3>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        Selama periode yang dipilih, <strong className="text-sky-800 dark:text-sky-200">{employee.NAMA}</strong> telah bekerja selama <strong className="text-sky-800 dark:text-sky-200">{employee.HARI_KERJA}</strong> hari. 
                        Karyawan ini tercatat terlambat sebanyak <strong className="text-orange-600">{employee.TERLAMBAT}</strong> kali dan mengambil total <strong className="text-red-600">{employee.SURAT_DOKTER + employee.IJIN_FULL}</strong> hari absen di luar cuti resmi.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                        Dengan skor kehadiran <strong className={attendanceScore >= 80 ? 'text-green-600' : attendanceScore >= 60 ? 'text-yellow-600' : 'text-red-600'}>{attendanceScore.toFixed(1)}</strong>, 
                        karyawan ini termasuk dalam kategori {attendanceScore >= 80 ? 'Sangat Baik' : attendanceScore >= 60 ? 'Baik' : 'Perlu Perbaikan'}. 
                        Analisis lebih mendalam dapat memberikan wawasan tentang pola kehadiran dan potensi area untuk peningkatan produktivitas.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const AnalyticsPage = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const [selectedDivision, setSelectedDivision] = useState('semua');
  const { availableDivisions } = useAttendanceData(data);
  
  const analyticsData = useMemo(() => { 
    const filteredData = selectedDivision === 'semua' ? data : data.filter(emp => emp.DIVISI === selectedDivision);
    const divisions = {}; 
    filteredData.forEach(employee => { 
      const div = employee.DIVISI || 'N/A'; 
      if (!divisions[div]) { 
        divisions[div] = { name: div, employees: [], totalTardiness: 0, totalLeave: 0, totalAbsence: 0 }; 
      } 
      divisions[div].employees.push(employee); 
      divisions[div].totalTardiness += employee.TERLAMBAT; 
      divisions[div].totalLeave += employee.CUTI; 
      divisions[div].totalAbsence += employee.SURAT_DOKTER + employee.IJIN_FULL;
    }); 
    Object.values(divisions).forEach(div => { 
      const employeeCount = div.employees.length; 
      if (employeeCount > 0) { 
        const avgTardiness = div.totalTardiness / employeeCount; 
        const avgLeave = div.totalLeave / employeeCount; 
        div.avgPerformance = Math.max(0, 100 - (avgTardiness * 5) - (avgLeave * 2)); 
        div.avgTardiness = avgTardiness;
        div.avgAbsence = div.totalAbsence / employeeCount;
      } else { 
        div.avgPerformance = 0; 
        div.avgTardiness = 0;
        div.avgAbsence = 0;
      } 
    }); 
    return divisions; 
  }, [data, selectedDivision]);
  
  const topPerformers = useMemo(() => { 
    const filteredData = selectedDivision === 'semua' ? data : data.filter(emp => emp.DIVISI === selectedDivision);
    return [...filteredData].filter(emp => emp.HARI_KERJA > 0).map(emp => ({ 
      ...emp, 
      score: Math.max(0, 100 - (emp.TERLAMBAT * 5) - ((emp.SURAT_DOKTER + emp.IJIN_FULL) * 3)) 
    })).sort((a, b) => b.score - a.score).slice(0, 10); 
  }, [data, selectedDivision]);

  const monthlyTrendData = useMemo(() => {
    const filteredData = selectedDivision === 'semua' ? data : data.filter(emp => emp.DIVISI === selectedDivision);
    const monthlyStats = {};
    filteredData.forEach(row => {
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
  }, [data, selectedDivision]);

  const monthlyChartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    scales: { 
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
        ticks: { color: '#6b7280' }
      },
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
        ticks: { color: '#6b7280' }
      }
    }, 
    plugins: { 
      legend: { 
        position: 'top',
        labels: { color: '#374151' }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f3f4f6',
        bodyColor: '#f3f4f6'
      }
    } 
  };
  
  const handleExport = () => {
    const dataToExport = [
      ...Object.values(analyticsData).map(div => ({
        'Divisi': div.name,
        'Skor Performa': div.avgPerformance.toFixed(1),
        'Jumlah Karyawan': div.employees.length,
        'Rata-rata Terlambat': div.avgTardiness.toFixed(1),
        'Rata-rata Absensi': div.avgAbsence.toFixed(1)
      })),
      {}, // Empty row for separation
      { 'Top 10 Karyawan Terbaik': '' },
      ...topPerformers.map(emp => ({
        'Nama': emp.NAMA,
        'Divisi': emp.DIVISI,
        'Skor Performa': emp.score.toFixed(1),
        'Total Terlambat': emp.TERLAMBAT,
        'Total Absensi': emp.SURAT_DOKTER + emp.IJIN_FULL
      }))
    ];
    exportService.exportToCsv(dataToExport, `analisis_insight_${selectedDivision}.csv`);
  };

  return (
    <motion.div 
      className="space-y-8 printable-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 dark:from-sky-800 dark:to-blue-900 rounded-2xl p-8 text-white flex justify-between items-center">
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8" />
            <h2 className="text-3xl font-bold">Analytics & Insights</h2>
          </div>
          <p className="text-sky-100 text-lg">Analisis mendalam performa kehadiran dan produktivitas tim</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button 
            onClick={handleExport} 
            className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors no-print"
          >
            <Download size={16}/> Ekspor
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm no-print">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-sky-600" />
            <label className="font-medium text-gray-700 dark:text-gray-300">Filter Divisi:</label>
          </div>
          <div className="flex-1 max-w-xs">
            <AnimatedDropdown 
              options={availableDivisions} 
              selectedValue={selectedDivision} 
              onValueChange={setSelectedDivision}
              placeholder="Semua Divisi"
              includeAllOption={true}
            />
          </div>
        </div>
      </div>
    
      {/* Monthly Trend Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100">Tren Kehadiran per Bulan</h3>
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

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 mb-6 no-print">
          <button 
            onClick={() => setSelectedMetric('performance')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedMetric === 'performance' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Award className="w-4 h-4" /> Performa Divisi
          </button>
          <button 
            onClick={() => setSelectedMetric('trends')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedMetric === 'trends' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Tren & Pola
          </button>
          <button 
            onClick={() => setSelectedMetric('risks')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedMetric === 'risks' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Identifikasi Risiko
          </button>
        </div>
        
        {selectedMetric === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100">Performance Score per Divisi</h3>
              <div className="space-y-4">
                {Object.values(analyticsData).map(div => (
                  <div key={div.name} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{div.name}</span>
                      <span className="text-lg font-bold text-sky-700 dark:text-sky-300">{div.avgPerformance.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <motion.div 
                        className="bg-gradient-to-r from-sky-500 to-blue-600 h-2 rounded-full transition-all duration-500" 
                        initial={{ width: 0 }}
                        animate={{ width: `${div.avgPerformance}%` }}
                        transition={{ delay: 0.2, duration: 1 }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {div.employees.length} karyawan • Avg Terlambat: {div.avgTardiness.toFixed(1)} • Avg Absensi: {div.avgAbsence.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100">Top 10 Karyawan Terbaik</h3>
              <div className="space-y-3">
                {topPerformers.map((emp, index) => (
                  <motion.div 
                    key={emp.NAMA} 
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-amber-600' : 
                        'bg-sky-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{emp.NAMA}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{emp.DIVISI}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-sky-700 dark:text-sky-300">{emp.score.toFixed(1)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Performance Score</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {selectedMetric === 'trends' && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" /> Analisis Tren Kehadiran
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    <AnimatedCounter value={data.length > 0 ? ((data.reduce((sum, emp) => sum + emp.TERLAMBAT, 0) / data.length)) : 0} suffix="" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Terlambat/Karyawan</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    <AnimatedCounter value={data.length > 0 ? ((data.reduce((sum, emp) => sum + emp.SURAT_DOKTER + emp.IJIN_FULL, 0) / data.length)) : 0} suffix="" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Absen/Karyawan</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    <AnimatedCounter value={data.length > 0 ? ((data.reduce((sum, emp) => sum + emp.CUTI, 0) / data.length)) : 0} suffix="" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Cuti/Karyawan</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedMetric === 'risks' && (
          <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-200 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" /> Karyawan Berisiko Tinggi
              </h3>
              <div className="space-y-3">
                {data.filter(emp => emp.TERLAMBAT > 5 || (emp.SURAT_DOKTER + emp.IJIN_FULL) > 3).slice(0, 10).map((emp, index) => (
                  <motion.div 
                    key={emp.NAMA} 
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{emp.NAMA}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{emp.DIVISI} - {emp.JABATAN}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                          {emp.TERLAMBAT > 5 && (
                            <span className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                              Terlambat: {emp.TERLAMBAT}x
                            </span>
                          )}
                          {(emp.SURAT_DOKTER + emp.IJIN_FULL) > 3 && (
                            <span className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                              Absen: {emp.SURAT_DOKTER + emp.IJIN_FULL} hari
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
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
      employees: new Set(monthData.map(row => row.NAMA)).size,
      avgTardiness: monthData.length > 0 ? monthData.reduce((sum, row) => sum + row.TERLAMBAT, 0) / new Set(monthData.map(row => row.NAMA)).size : 0,
      avgAbsence: monthData.length > 0 ? monthData.reduce((sum, row) => sum + row.SURAT_DOKTER + row.IJIN_FULL, 0) / new Set(monthData.map(row => row.NAMA)).size : 0
    };
  }, [data]);

  const statsA = useMemo(() => periodA ? getMonthStats(periodA) : null, [periodA, getMonthStats]);
  const statsB = useMemo(() => periodB ? getMonthStats(periodB) : null, [periodB, getMonthStats]);

  const getChangeIcon = (valueA, valueB) => {
    if (Math.abs(valueA - valueB) < 0.1) return <Minus className="w-4 h-4 text-gray-500" />;
    return valueA < valueB ? <ArrowUp className="w-4 h-4 text-red-500" /> : <ArrowDown className="w-4 h-4 text-green-500" />;
  };

  const getChangeColor = (valueA, valueB, isGoodWhenLower = true) => {
    if (Math.abs(valueA - valueB) < 0.1) return "text-gray-500";
    const isIncreasing = valueB > valueA;
    if (isGoodWhenLower) {
      return isIncreasing ? "text-red-500" : "text-green-500";
    } else {
      return isIncreasing ? "text-green-500" : "text-red-500";
    }
  };

  const getChangePercentage = (valueA, valueB) => {
    if (valueA === 0) return valueB > 0 ? '+∞' : '0';
    return (((valueB - valueA) / valueA) * 100).toFixed(1);
  };

  const handleAnalyze = () => {
    if (!statsA || !statsB) return;
    onAnalyze({ periodA, periodB, statsA, statsB });
  };

  const handleExport = () => {
    if (!statsA || !statsB) return;
    const comparisonData = [
      { Metrik: 'Periode', [periodA]: periodA, [periodB]: periodB },
      { Metrik: 'Total Keterlambatan', [periodA]: statsA.tardiness, [periodB]: statsB.tardiness },
      { Metrik: 'Total Absensi', [periodA]: statsA.absence, [periodB]: statsB.absence },
      { Metrik: 'Total Hari Kerja', [periodA]: statsA.workDays, [periodB]: statsB.workDays },
      { Metrik: 'Jumlah Karyawan', [periodA]: statsA.employees, [periodB]: statsB.employees },
      { Metrik: 'Rata-rata Terlambat/Karyawan', [periodA]: statsA.avgTardiness.toFixed(2), [periodB]: statsB.avgTardiness.toFixed(2) },
      { Metrik: 'Rata-rata Absen/Karyawan', [periodA]: statsA.avgAbsence.toFixed(2), [periodB]: statsB.avgAbsence.toFixed(2) }
    ];
    exportService.exportToCsv(comparisonData, `perbandingan_${periodA}_vs_${periodB}.csv`);
  };

  return (
    <motion.div 
      className="space-y-8 printable-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 dark:from-sky-800 dark:to-blue-900 rounded-2xl p-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <GitCompareArrows className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Perbandingan Periode</h2>
            </div>
            <p className="text-sky-100 text-lg">Bandingkan data kehadiran antara dua periode untuk mengidentifikasi tren dan perubahan</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {statsA && statsB && (
              <button 
                onClick={handleExport} 
                className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors no-print"
              >
                <Download size={16}/> Ekspor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm no-print">
        <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100">Pilih Periode untuk Dibandingkan</h3>
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
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Period A Stats */}
            <motion.div 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100 flex items-center">
                <div className="w-3 h-3 bg-sky-600 rounded-full mr-3"></div>
                Periode A: {periodA}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Total Keterlambatan</span>
                  <span className="font-bold text-orange-600">{statsA.tardiness} kali</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Total Absensi</span>
                  <span className="font-bold text-red-600">{statsA.absence} hari</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Total Hari Kerja</span>
                  <span className="font-bold text-green-600">{statsA.workDays} hari</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Jumlah Karyawan</span>
                  <span className="font-bold text-sky-600">{statsA.employees} orang</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Avg Terlambat/Karyawan</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{statsA.avgTardiness.toFixed(1)}</span>
                </div>
              </div>
            </motion.div>

            {/* Period B Stats */}
            <motion.div 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100 flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                Periode B: {periodB}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Total Keterlambatan</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-600">{statsB.tardiness} kali</span>
                    {getChangeIcon(statsA.tardiness, statsB.tardiness)}
                    <span className={`text-sm font-medium ${getChangeColor(statsA.tardiness, statsB.tardiness)}`}>
                      ({statsB.tardiness - statsA.tardiness > 0 ? '+' : ''}{statsB.tardiness - statsA.tardiness})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Total Absensi</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-600">{statsB.absence} hari</span>
                    {getChangeIcon(statsA.absence, statsB.absence)}
                    <span className={`text-sm font-medium ${getChangeColor(statsA.absence, statsB.absence)}`}>
                      ({statsB.absence - statsA.absence > 0 ? '+' : ''}{statsB.absence - statsA.absence})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Total Hari Kerja</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600">{statsB.workDays} hari</span>
                    {getChangeIcon(statsA.workDays, statsB.workDays)}
                    <span className={`text-sm font-medium ${getChangeColor(statsA.workDays, statsB.workDays, false)}`}>
                      ({statsB.workDays - statsA.workDays > 0 ? '+' : ''}{statsB.workDays - statsA.workDays})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Jumlah Karyawan</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-600">{statsB.employees} orang</span>
                    {getChangeIcon(statsA.employees, statsB.employees)}
                    <span className={`text-sm font-medium ${getChangeColor(statsA.employees, statsB.employees, false)}`}>
                      ({statsB.employees - statsA.employees > 0 ? '+' : ''}{statsB.employees - statsA.employees})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Avg Terlambat/Karyawan</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{statsB.avgTardiness.toFixed(1)}</span>
                    {getChangeIcon(statsA.avgTardiness, statsB.avgTardiness)}
                    <span className={`text-sm font-medium ${getChangeColor(statsA.avgTardiness, statsB.avgTardiness)}`}>
                      ({getChangePercentage(statsA.avgTardiness, statsB.avgTardiness)}%)
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Visual Comparison Chart */}
          <motion.div 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100">Perbandingan Visual</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Keterlambatan</h4>
                <div className="flex justify-center items-end gap-4 h-32">
                  <div className="bg-sky-500 rounded-t text-white text-xs p-2 flex flex-col justify-end" style={{height: `${Math.max(20, (statsA.tardiness / Math.max(statsA.tardiness, statsB.tardiness, 1)) * 100)}%`}}>
                    <span className="font-bold">{statsA.tardiness}</span>
                    <span className="text-xs opacity-75">{periodA}</span>
                  </div>
                  <div className="bg-blue-600 rounded-t text-white text-xs p-2 flex flex-col justify-end" style={{height: `${Math.max(20, (statsB.tardiness / Math.max(statsA.tardiness, statsB.tardiness, 1)) * 100)}%`}}>
                    <span className="font-bold">{statsB.tardiness}</span>
                    <span className="text-xs opacity-75">{periodB}</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Absensi</h4>
                <div className="flex justify-center items-end gap-4 h-32">
                  <div className="bg-red-500 rounded-t text-white text-xs p-2 flex flex-col justify-end" style={{height: `${Math.max(20, (statsA.absence / Math.max(statsA.absence, statsB.absence, 1)) * 100)}%`}}>
                    <span className="font-bold">{statsA.absence}</span>
                    <span className="text-xs opacity-75">{periodA}</span>
                  </div>
                  <div className="bg-red-700 rounded-t text-white text-xs p-2 flex flex-col justify-end" style={{height: `${Math.max(20, (statsB.absence / Math.max(statsA.absence, statsB.absence, 1)) * 100)}%`}}>
                    <span className="font-bold">{statsB.absence}</span>
                    <span className="text-xs opacity-75">{periodB}</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Hari Kerja</h4>
                <div className="flex justify-center items-end gap-4 h-32">
                  <div className="bg-green-500 rounded-t text-white text-xs p-2 flex flex-col justify-end" style={{height: `${Math.max(20, (statsA.workDays / Math.max(statsA.workDays, statsB.workDays, 1)) * 100)}%`}}>
                    <span className="font-bold">{statsA.workDays}</span>
                    <span className="text-xs opacity-75">{periodA}</span>
                  </div>
                  <div className="bg-green-700 rounded-t text-white text-xs p-2 flex flex-col justify-end" style={{height: `${Math.max(20, (statsB.workDays / Math.max(statsA.workDays, statsB.workDays, 1)) * 100)}%`}}>
                    <span className="font-bold">{statsB.workDays}</span>
                    <span className="text-xs opacity-75">{periodB}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Summary & Insights */}
          <motion.div 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100">Ringkasan Perubahan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Perubahan Positif</h4>
                <div className="space-y-2">
                  {statsB.tardiness < statsA.tardiness && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Keterlambatan menurun {(statsA.tardiness - statsB.tardiness)} kali</span>
                    </div>
                  )}
                  {statsB.absence < statsA.absence && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Absensi menurun {(statsA.absence - statsB.absence)} hari</span>
                    </div>
                  )}
                  {statsB.workDays > statsA.workDays && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Hari kerja meningkat {(statsB.workDays - statsA.workDays)} hari</span>
                    </div>
                  )}
                  {statsB.employees > statsA.employees && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Jumlah karyawan bertambah {(statsB.employees - statsA.employees)} orang</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Area Perhatian</h4>
                <div className="space-y-2">
                  {statsB.tardiness > statsA.tardiness && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Keterlambatan meningkat {(statsB.tardiness - statsA.tardiness)} kali</span>
                    </div>
                  )}
                  {statsB.absence > statsA.absence && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Absensi meningkat {(statsB.absence - statsA.absence)} hari</span>
                    </div>
                  )}
                  {statsB.workDays < statsA.workDays && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Hari kerja menurun {(statsA.workDays - statsB.workDays)} hari</span>
                    </div>
                  )}
                  {statsB.avgTardiness > statsA.avgTardiness && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Rata-rata keterlambatan per karyawan meningkat</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

const OverallDashboard = ({ data, onAnalyzeIndividual, onAnalyzeOverall, isAiLoading }) => {
    const [selectedMonth, setSelectedMonth] = useState('semua');
    const [selectedEmployee, setSelectedEmployee] = useState('semua');
    const [selectedDivision, setSelectedDivision] = useState('semua');
    const [expandedDivision, setExpandedDivision] = useState(null);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
    
    const useFilteredData = (allData, month, employee, division) => {
        return useMemo(() => {
            let filtered = allData;
            if (month !== 'semua') filtered = filtered.filter(item => item.BULAN === month);
            if (employee !== 'semua') filtered = filtered.filter(item => item.NAMA === employee);
            if (division !== 'semua') filtered = filtered.filter(item => item.DIVISI === division);
            
            const aggregated = Array.from(filtered.reduce((map, row) => {
                const name = row.NAMA;
                if (!name) return map;
                if (!map.has(name)) {
                    map.set(name, { 
                        NAMA: name, 
                        DIVISI: row.DIVISI || 'N/A', 
                        JABATAN: row.JABATAN || 'N/A', 
                        TAHUN_MASUK: row.TAHUN_MASUK || 0, 
                        LAMA_BEKERJA: row.LAMA_BEKERJA || 0, 
                        HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0 
                    });
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
                totalWorkDays: filtered.reduce((sum, item) => sum + item.HARI_KERJA, 0),
                totalSickLeave: filtered.reduce((sum, item) => sum + item.SURAT_DOKTER, 0),
                totalPermissionLeave: filtered.reduce((sum, item) => sum + item.IJIN_FULL, 0),
                totalVacation: filtered.reduce((sum, item) => sum + item.CUTI, 0)
            };

            const topTardiness = [...aggregated].sort((a, b) => b.TERLAMBAT - a.TERLAMBAT).slice(0, 10);
            const absenceDistribution = { 
                sakit: kpis.totalSickLeave, 
                izin: kpis.totalPermissionLeave, 
                cuti: kpis.totalVacation 
            };
            
            const tableData = [...aggregated].sort((a, b) => a.NAMA.localeCompare(b.NAMA));
            
            const divisionalAnalysis = Object.values(aggregated.reduce((acc, emp) => {
                const div = emp.DIVISI || 'N/A';
                if (!acc[div]) acc[div] = { 
                    name: div, 
                    employeeCount: 0, 
                    totalTardiness: 0, 
                    totalLeave: 0, 
                    totalAbsence: 0,
                    avgPerformance: 0,
                    employees: []
                };
                acc[div].employeeCount++;
                acc[div].totalTardiness += emp.TERLAMBAT;
                acc[div].totalAbsence += emp.SURAT_DOKTER + emp.IJIN_FULL;
                acc[div].totalLeave += emp.CUTI;
                acc[div].employees.push(emp);
                return acc;
            }, {})).map(div => ({
                ...div,
                avgPerformance: Math.max(0, 100 - (div.totalTardiness / div.employeeCount * 5) - (div.totalAbsence / div.employeeCount * 3))
            })).sort((a, b) => a.name.localeCompare(b.name));

            const deepInsights = (() => {
                if (aggregated.length === 0) return null;

                const tenureGroups = {
                    new: { totalTardiness: 0, count: 0 },
                    mid: { totalTardiness: 0, count: 0 },
                    senior: { totalTardiness: 0, count: 0 },
                };
                
                aggregated.forEach(emp => {
                    const tenure = emp.LAMA_BEKERJA > 0 ? emp.LAMA_BEKERJA : (emp.TAHUN_MASUK > 0 ? new Date().getFullYear() - emp.TAHUN_MASUK : 0);
                    if (tenure < 2) { 
                        tenureGroups.new.totalTardiness += emp.TERLAMBAT; 
                        tenureGroups.new.count++; 
                    } else if (tenure <= 5) { 
                        tenureGroups.mid.totalTardiness += emp.TERLAMBAT; 
                        tenureGroups.mid.count++; 
                    } else { 
                        tenureGroups.senior.totalTardiness += emp.TERLAMBAT; 
                        tenureGroups.senior.count++; 
                    }
                });
                
                const avgNew = tenureGroups.new.count > 0 ? (tenureGroups.new.totalTardiness / tenureGroups.new.count) : 0;
                const avgMid = tenureGroups.mid.count > 0 ? (tenureGroups.mid.totalTardiness / tenureGroups.mid.count) : 0;
                const avgSenior = tenureGroups.senior.count > 0 ? (tenureGroups.senior.totalTardiness / tenureGroups.senior.count) : 0;
                
                let tenureTardinessMessage = `Rata-rata keterlambatan: Karyawan baru (${avgNew.toFixed(1)}x), Mid-level (${avgMid.toFixed(1)}x), Senior (${avgSenior.toFixed(1)}x).`;
                
                if (avgNew > avgMid && avgNew > avgSenior) { 
                    tenureTardinessMessage += " Karyawan baru cenderung lebih sering terlambat."; 
                } else if (avgSenior > avgMid && avgSenior > avgNew) { 
                    tenureTardinessMessage += " Karyawan senior cenderung lebih sering terlambat."; 
                } else { 
                    tenureTardinessMessage += " Tidak ada korelasi jelas antara lama kerja dan keterlambatan."; 
                }

                const divPerf = divisionalAnalysis.map(div => ({ 
                    ...div, 
                    avgTardiness: div.employeeCount > 0 ? div.totalTardiness / div.employeeCount : 0 
                })).sort((a, b) => a.avgTardiness - b.avgTardiness);
                
                const bestDivision = divPerf.length > 0 ? divPerf[0] : null;
                const worstDivision = divPerf.length > 1 ? divPerf[divPerf.length - 1] : null;

                const sortedByDiscipline = [...aggregated].sort((a, b) => (a.TERLAMBAT + a.IJIN_FULL) - (b.TERLAMBAT + b.IJIN_FULL));
                const bestEmployee = sortedByDiscipline.length > 0 ? sortedByDiscipline[0] : null;

                return { tenureTardiness: tenureTardinessMessage, bestDivision, worstDivision, bestEmployee };
            })();
            
            return { kpis, topTardiness, absenceDistribution, tableData, divisionalAnalysis, deepInsights };
        }, [allData, month, employee, division]);
    };

    const { kpis, topTardiness, absenceDistribution, tableData, divisionalAnalysis, deepInsights } = useFilteredData(data, selectedMonth, selectedEmployee, selectedDivision);
    const { availableMonths, availableEmployees, availableDivisions } = useAttendanceData(data);

    const tableColumns = [
        { 
            key: 'NAMA', 
            label: 'Nama Karyawan', 
            sortable: true,
            render: (value, row) => <div className="font-medium">{value}</div>
        },
        { 
            key: 'DIVISI', 
            label: 'Divisi', 
            sortable: true,
            render: (value) => <span className="px-2 py-1 bg-sky-100 text-sky-800 rounded-full text-xs">{value}</span>
        },
        { 
            key: 'JABATAN', 
            label: 'Jabatan', 
            sortable: true 
        },
        { 
            key: 'TERLAMBAT', 
            label: 'Terlambat', 
            sortable: true,
            render: (value) => <span className={`font-bold ${value > 5 ? 'text-red-600' : value > 2 ? 'text-yellow-600' : 'text-green-600'}`}>{value}</span>
        },
        { 
            key: 'SURAT_DOKTER', 
            label: 'Sakit', 
            sortable: true,
            render: (value) => <span className="text-red-600">{value}</span>
        },
        { 
            key: 'IJIN_FULL', 
            label: 'Izin', 
            sortable: true,
            render: (value) => <span className="text-yellow-600">{value}</span>
        },
        { 
            key: 'CUTI', 
            label: 'Cuti', 
            sortable: true,
            render: (value) => <span className="text-blue-600">{value}</span>
        },
        { 
            key: 'actions', 
            label: 'Aksi', 
            sortable: false,
            render: (_, row) => (
                <button 
                    onClick={() => onAnalyzeIndividual(row)} 
                    disabled={isAiLoading} 
                    className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1 px-3 text-xs rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                >
                    <Sparkles size={12}/> Analisis
                </button>
            )
        }
    ];

    const tardinessChartOptions = { 
        responsive: true, 
        maintainAspectRatio: false, 
        indexAxis: 'y', 
        scales: { 
            x: { 
                beginAtZero: true, 
                grid: { color: 'rgba(0, 0, 0, 0.05)' }, 
                ticks: { color: '#4b5563' } 
            }, 
            y: { 
                grid: { display: false }, 
                ticks: { color: '#4b5563' } 
            } 
        }, 
        plugins: { 
            legend: { display: false }, 
            tooltip: { 
                backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                titleColor: '#f3f4f6', 
                bodyColor: '#f3f4f6', 
                callbacks: { 
                    title: (ctx) => topTardiness[ctx[0].dataIndex]?.NAMA || '' 
                } 
            } 
        } 
    };
    
    const tardinessChartData = { 
        labels: topTardiness.map(item => item.NAMA.length > 15 ? item.NAMA.substring(0, 15) + '...' : item.NAMA), 
        datasets: [{ 
            label: 'Jumlah Keterlambatan', 
            data: topTardiness.map(item => item.TERLAMBAT), 
            backgroundColor: 'rgba(3, 105, 161, 0.8)', 
            borderColor: 'rgba(3, 105, 161, 1)', 
            borderWidth: 1, 
            borderRadius: 6 
        }] 
    };
    
    const totalAbsence = Object.values(absenceDistribution).reduce((a, b) => a + b, 0);
    const absenceChartOptions = { 
        responsive: true, 
        maintainAspectRatio: false, 
        cutout: '70%', 
        plugins: { 
            legend: { 
                position: 'bottom', 
                labels: { color: '#4b5563', padding: 20 } 
            }, 
            tooltip: { 
                backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                titleColor: '#f3f4f6', 
                bodyColor: '#f3f4f6', 
                callbacks: { 
                    label: (ctx) => `${ctx.label}: ${ctx.formattedValue} hari (${(totalAbsence > 0 ? ((ctx.parsed * 100) / totalAbsence).toFixed(1) : 0)}%)` 
                } 
            } 
        } 
    };
    
    const absenceChartData = { 
        labels: ['Sakit (Surat Dokter)', 'Izin', 'Cuti'], 
        datasets: [{ 
            label: 'Jumlah Hari', 
            data: [absenceDistribution.sakit, absenceDistribution.izin, absenceDistribution.cuti], 
            backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(249, 115, 22, 0.8)', 'rgba(59, 130, 246, 0.8)'], 
            borderColor: ['#ffffff', '#ffffff', '#ffffff'], 
            borderWidth: 4 
        }] 
    };

    const handleOverallAnalysisClick = () => {
        onAnalyzeOverall({ 
            kpis, 
            chartData: { topTardiness, absenceDistribution }, 
            selectedMonth, 
            selectedEmployee, 
            selectedDivision,
            filters: {
                month: selectedMonth,
                employee: selectedEmployee,
                division: selectedDivision
            }
        });
    };

    const handleDivisionClick = (divisionName) => {
        setExpandedDivision(prev => (prev === divisionName ? null : divisionName));
    };
    
    const handleExport = () => {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `rekap_absensi_${selectedMonth}_${selectedDivision}_${timestamp}.csv`;
        exportService.exportToCsv(tableData, filename);
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
            {/* Header with Filters */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm no-print">
                <div className="flex flex-col space-y-6">
                    {/* Filter Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-sky-700 flex-shrink-0" />
                            <label className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap text-sm">Bulan:</label>
                            <div className="flex-1 min-w-0">
                                <AnimatedDropdown 
                                    options={availableMonths} 
                                    selectedValue={selectedMonth} 
                                    onValueChange={setSelectedMonth} 
                                    placeholder="Semua" 
                                    includeAllOption={true} 
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-sky-700 flex-shrink-0" />
                            <label className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap text-sm">Divisi:</label>
                            <div className="flex-1 min-w-0">
                                <AnimatedDropdown 
                                    options={availableDivisions} 
                                    selectedValue={selectedDivision} 
                                    onValueChange={setSelectedDivision} 
                                    placeholder="Semua" 
                                    includeAllOption={true} 
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-sky-700 flex-shrink-0" />
                            <label className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap text-sm">Karyawan:</label>
                            <div className="flex-1 min-w-0">
                                <AnimatedDropdown 
                                    options={availableEmployees} 
                                    selectedValue={selectedEmployee} 
                                    onValueChange={setSelectedEmployee} 
                                    placeholder="Semua" 
                                    includeAllOption={true} 
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-sky-700 flex-shrink-0" />
                            <label className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap text-sm">Tampilan:</label>
                            <div className="flex-1 min-w-0">
                                <AnimatedDropdown 
                                    options={['cards', 'table']} 
                                    selectedValue={viewMode} 
                                    onValueChange={setViewMode} 
                                    placeholder="Cards" 
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={handleOverallAnalysisClick} 
                            disabled={isAiLoading} 
                            className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg"
                        >
                            <Sparkles className="w-5 h-5" />
                            {isAiLoading ? 'Menganalisis...' : 'Analisis AI Umum'}
                        </button>
                        <button 
                            onClick={handleExport} 
                            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 shadow hover:shadow-lg"
                        >
                            <Download size={16}/> Ekspor Data
                        </button>
                        <ThemeToggle />
                    </div>
                </div>
            </div>
            
            {/* KPI Cards */}
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}>
                    <KpiCard 
                        icon={<Users />} 
                        title="Total Karyawan" 
                        value={kpis.totalEmployees} 
                        colorClass={{ bg: 'bg-sky-100 dark:bg-sky-900', text: 'text-sky-700 dark:text-sky-400' }} 
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <KpiCard 
                        icon={<Clock />} 
                        title="Total Keterlambatan" 
                        value={kpis.totalTardiness} 
                        unit="kali" 
                        colorClass={{ bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-600 dark:text-orange-400' }} 
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <KpiCard 
                        icon={<UserX />} 
                        title="Total Absensi" 
                        value={kpis.totalAbsence} 
                        unit="hari" 
                        colorClass={{ bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-600 dark:text-red-400' }} 
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <KpiCard 
                        icon={<Calendar />} 
                        title="Total Hari Kerja" 
                        value={kpis.totalWorkDays} 
                        colorClass={{ bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-600 dark:text-green-400' }} 
                    />
                </motion.div>
            </motion.div>
            
            {/* Deep Insights Section */}
            {deepInsights && (
                <motion.div 
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-100 flex items-center gap-2">
                        <Zap className="text-yellow-500"/> Insight Mendalam
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Korelasi Lama Bekerja & Keterlambatan</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{deepInsights.tenureTardiness}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Divisi Paling Disiplin</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {deepInsights.bestDivision ? 
                                    `${deepInsights.bestDivision.name} (Rata-rata telat: ${deepInsights.bestDivision.avgTardiness?.toFixed(1) || 0}x)` : 
                                    'N/A'
                                }
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Karyawan Paling Disiplin</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {deepInsights.bestEmployee ? 
                                    `${deepInsights.bestEmployee.NAMA} (Telat: ${deepInsights.bestEmployee.TERLAMBAT}x)` : 
                                    'N/A'
                                }
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Divisi Perlu Perhatian</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {deepInsights.worstDivision && deepInsights.worstDivision.name !== deepInsights.bestDivision?.name ? 
                                    `${deepInsights.worstDivision.name} (Rata-rata telat: ${deepInsights.worstDivision.avgTardiness?.toFixed(1) || 0}x)` : 
                                    'Semua divisi menunjukkan performa serupa.'
                                }
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <motion.div 
                    className="lg:col-span-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 className="text-xl font-semibold mb-6 text-sky-900 dark:text-sky-100 flex items-center">
                        <div className="w-3 h-3 bg-sky-600 rounded-full mr-3"></div>
                        Top 10 Karyawan Terlambat
                    </h3>
                    <ChartWrapper 
                        chartId="chart-tardiness" 
                        type="bar" 
                        data={tardinessChartData} 
                        options={tardinessChartOptions} 
                        fallbackText={{
                            icon: <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />, 
                            text: "Tidak ada data keterlambatan"
                        }} 
                    />
                </motion.div>
                <motion.div 
                    className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h3 className="text-xl font-semibold mb-6 text-sky-900 dark:text-sky-100 flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                        Distribusi Tipe Absensi
                    </h3>
                    <ChartWrapper 
                        chartId="chart-absence" 
                        type="doughnut" 
                        data={absenceChartData} 
                        options={absenceChartOptions} 
                        fallbackText={{
                            icon: <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />, 
                            text: "Tidak ada data absensi"
                        }} 
                    />
                </motion.div>
            </div>
            
            {/* Employee Data Section */}
            {viewMode === 'table' ? (
                <motion.div 
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h3 className="text-xl font-semibold mb-6 text-sky-900 dark:text-sky-100">Data Karyawan</h3>
                    <SearchableTable 
                        data={tableData}
                        columns={tableColumns}
                        searchPlaceholder="Cari nama karyawan..."
                        itemsPerPage={15}
                    />
                </motion.div>
            ) : (
                /* Divisional Analysis Section */
                <motion.div 
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h3 className="text-xl font-semibold mb-6 text-sky-900 dark:text-sky-100">Analisis per Divisi</h3>
                    <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                        {divisionalAnalysis.map((div, index) => (
                            <motion.div key={div.name} variants={itemVariants} custom={index}>
                                <InteractiveCard
                                    onClick={() => handleDivisionClick(div.name)} 
                                    className={`transition-all duration-300 ${expandedDivision === div.name ? 'ring-2 ring-sky-500 shadow-lg' : 'hover:border-sky-400'}`}
                                >
                                    <h4 className="font-semibold text-lg text-sky-800 dark:text-sky-200 mb-3 flex items-center">
                                        <Briefcase size={20} className="mr-2"/>
                                        {div.name}
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                                <Users size={14} className="mr-2"/>Jml Karyawan
                                            </span>
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{div.employeeCount}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                                <Clock size={14} className="mr-2"/>Total Terlambat
                                            </span>
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{div.totalTardiness} kali</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                                <Target size={14} className="mr-2"/>Skor Performa
                                            </span>
                                            <span className={`font-bold ${div.avgPerformance >= 80 ? 'text-green-600' : div.avgPerformance >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {div.avgPerformance.toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <motion.div 
                                                className={`h-2 rounded-full ${div.avgPerformance >= 80 ? 'bg-green-500' : div.avgPerformance >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${div.avgPerformance}%` }}
                                                transition={{ delay: 0.5 + (index * 0.1), duration: 1 }}
                                            />
                                        </div>
                                    </div>
                                </InteractiveCard>
                            </motion.div>
                        ))}
                    </motion.div>
                    
                    <AnimatePresence>
                        {expandedDivision && (
                            <motion.div 
                                className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-6"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-semibold text-sky-900 dark:text-sky-100">Detail Karyawan Divisi: {expandedDivision}</h4>
                                    <button 
                                        onClick={() => {
                                            const divisionEmployees = tableData.filter(emp => emp.DIVISI === expandedDivision);
                                            exportService.exportToCsv(divisionEmployees, `detail_divisi_${expandedDivision}.csv`);
                                        }} 
                                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 text-xs rounded-lg flex items-center gap-1 no-print transition-colors"
                                    >
                                        <Download size={14}/> Ekspor Divisi
                                    </button>
                                </div>
                                <SearchableTable 
                                    data={tableData.filter(emp => emp.DIVISI === expandedDivision)}
                                    columns={tableColumns}
                                    searchPlaceholder={`Cari karyawan di ${expandedDivision}...`}
                                    itemsPerPage={10}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Floating Action Button */}
            <FloatingActionButton
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                tooltip="Kembali ke atas"
            >
                <ArrowUp className="w-6 h-6" />
            </FloatingActionButton>
        </motion.div>
    );
};

const Sidebar = ({ employees, activeView, onViewChange, onReset, isSidebarCollapsed, onToggleCollapse }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { theme } = useTheme();
    
    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return employees;
        return employees.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [employees, searchTerm]);

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard Umum' },
        { id: 'analytics', icon: TrendingUp, label: 'Analisis & Insight' },
        { id: 'comparison', icon: GitCompareArrows, label: 'Perbandingan Periode' }
    ];

    return (
        <div className={`bg-slate-800 dark:bg-slate-900 text-slate-200 flex flex-col h-full transition-all duration-300 ${isSidebarCollapsed ? 'shadow-xl' : 'shadow-lg'}`}>
            <div className={`p-4 border-b border-slate-700 dark:border-slate-600 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                 <motion.h1 
                    className={`text-2xl font-bold text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}
                    initial={false}
                    animate={{ 
                        width: isSidebarCollapsed ? 0 : 'auto',
                        opacity: isSidebarCollapsed ? 0 : 1 
                    }}
                >
                    Dashboard HR
                </motion.h1>
                <motion.button 
                    onClick={onToggleCollapse} 
                    className="p-2 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {isSidebarCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
                </motion.button>
            </div>
            
            <nav className="p-4 space-y-2">
                {menuItems.map((item, index) => (
                    <motion.button 
                        key={item.id}
                        onClick={() => onViewChange(item.id)} 
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${isSidebarCollapsed ? 'justify-center' : ''} ${
                            activeView === item.id ? 'bg-sky-600 text-white shadow-md' : 'hover:bg-slate-700 dark:hover:bg-slate-600'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <item.icon className="w-5 h-5" />
                        {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
                    </motion.button>
                ))}
            </nav>
            
            <div className={`flex-grow flex flex-col p-4 border-t border-slate-700 dark:border-slate-600 overflow-hidden`}>
                <AnimatePresence>
                    {!isSidebarCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <h2 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                DETAIL KARYAWAN ({employees.length})
                            </h2>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Cari karyawan..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="w-full bg-slate-700 dark:bg-slate-800 border border-slate-600 dark:border-slate-500 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all" 
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <motion.ul 
                    className={`flex-grow space-y-1 overflow-y-auto custom-scrollbar ${isSidebarCollapsed ? 'hidden' : ''}`}
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.05
                            }
                        }
                    }}
                >
                    <AnimatePresence>
                        {filteredEmployees.map((name, index) => (
                            <motion.li 
                                key={name}
                                variants={{
                                    hidden: { opacity: 0, x: -10 },
                                    visible: { opacity: 1, x: 0 }
                                }}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                transition={{ delay: index * 0.02 }}
                            >
                                <button 
                                    onClick={() => onViewChange(name)} 
                                    className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                                        activeView === name ? 'bg-sky-600 text-white shadow-md' : 'hover:bg-slate-700 dark:hover:bg-slate-600 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                            activeView === name ? 'bg-white text-sky-600' : 'bg-slate-600 text-slate-200'
                                        }`}>
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate text-sm">{name}</span>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
                                        activeView === name ? 'rotate-90' : 'group-hover:translate-x-1'
                                    }`} />
                                </button>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </motion.ul>
            </div>
            
            <div className="p-4 mt-auto border-t border-slate-700 dark:border-slate-600 space-y-3">
                <motion.button 
                    onClick={() => window.print()} 
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 bg-sky-600 hover:bg-sky-700 text-white font-semibold transform hover:scale-105 shadow hover:shadow-lg ${
                        isSidebarCollapsed ? 'justify-center' : 'justify-center'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Printer className="w-5 h-5" />
                    <span className={isSidebarCollapsed ? 'hidden' : ''}>Cetak Laporan</span>
                </motion.button>
                <motion.button 
                    onClick={onReset} 
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 bg-red-500 hover:bg-red-600 text-white font-semibold transform hover:scale-105 shadow hover:shadow-lg ${
                        isSidebarCollapsed ? 'justify-center' : 'justify-center'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Upload className="w-5 h-5" />
                    <span className={isSidebarCollapsed ? 'hidden' : ''}>Unggah Baru</span>
                </motion.button>
            </div>
        </div>
    );
};

const DashboardLayout = ({ data, onReset, onAnalyzeIndividual, onAnalyzeOverall, isAiLoading, onAnalyzeComparison, isLoading }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const { getEmployeeByName, availableEmployees, availableMonths } = useAttendanceData(data);
    const { addNotification } = useNotification();

    const selectedEmployeeData = useMemo(() => {
        if (activeView !== 'dashboard' && activeView !== 'analytics' && activeView !== 'comparison') {
            return getEmployeeByName(activeView);
        }
        return null;
    }, [activeView, getEmployeeByName]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        'ctrl+/': () => setIsSidebarCollapsed(prev => !prev),
        'ctrl+h': () => setActiveView('dashboard'),
        'ctrl+a': () => setActiveView('analytics'),
        'ctrl+c': () => setActiveView('comparison'),
        'ctrl+p': () => window.print(),
        'ctrl+r': () => onReset()
    });

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
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
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
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
            <main className="flex-1 p-8 overflow-y-auto print-main custom-scrollbar">
                <AnimatePresence mode="wait">
                    {activeView === 'dashboard' && (
                        <OverallDashboard 
                            key="dashboard" 
                            data={data} 
                            onAnalyzeIndividual={onAnalyzeIndividual} 
                            onAnalyzeOverall={onAnalyzeOverall} 
                            isAiLoading={isAiLoading} 
                        />
                    )}
                    {activeView === 'analytics' && (
                        <AnalyticsPage 
                            key="analytics" 
                            data={data} 
                        />
                    )}
                    {activeView === 'comparison' && (
                        <ComparisonPage 
                            key="comparison" 
                            data={data} 
                            availableMonths={availableMonths} 
                            onAnalyze={onAnalyzeComparison} 
                            isAiLoading={isAiLoading} 
                        />
                    )}
                    {selectedEmployeeData && (
                        <EmployeeDetailView 
                            key={selectedEmployeeData.NAMA} 
                            employee={selectedEmployeeData} 
                            onAnalyze={onAnalyzeIndividual} 
                            isAiLoading={isAiLoading} 
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

// ================================================================
// MAIN APP COMPONENT
// ================================================================

const App = () => {
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [allData, setAllData] = useState([]);
    const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '', type: 'error' });
    const [aiModal, setAiModal] = useState({ show: false, title: '', content: '', isLoading: false });

    // Load external dependencies
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

    const showError = useCallback((message, title = 'Pemberitahuan', type = 'error') => { 
        setErrorModal({ show: true, title, message, type }); 
    }, []);

    const hideError = useCallback(() => setErrorModal({ show: false, title: '', message: '', type: 'error' }), []);

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

        // Simulate processing time with progress
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
        }, 1000); // Add some delay for better UX
    }, [validateFile, scriptsLoaded, showError]);

    const resetDashboard = useCallback(() => { 
        setAllData([]); 
        setShowDashboard(false); 
        setAiModal({ show: false, title: '', content: '', isLoading: false });
    }, []);

    const handleGetOverallAnalysis = useCallback(async (analysisData) => {
        setAiModal({ show: true, title: 'Analisis & Rekomendasi Umum', content: '', isLoading: true });
        
        const { kpis, chartData, filters } = analysisData;
        const filterInfo = filters.month === 'semua' ? 'semua periode' : `bulan ${filters.month}`;
        const employeeInfo = filters.employee === 'semua' ? 'seluruh karyawan' : `karyawan bernama ${filters.employee}`;
        const divisionInfo = filters.division === 'semua' ? 'semua divisi' : `divisi ${filters.division}`;
        
        const prompt = `Anda adalah seorang analis HR senior. Berdasarkan data absensi untuk ${filterInfo} yang mencakup ${employeeInfo} dari ${divisionInfo}, berikan analisis komprehensif dalam format markdown Bahasa Indonesia:

**Data Ringkas:** 
- Total Karyawan: ${kpis.totalEmployees} orang
- Total Keterlambatan: ${kpis.totalTardiness} kali
- Total Absensi: ${kpis.totalAbsence} hari
- Total Hari Kerja: ${kpis.totalWorkDays} hari

**Distribusi Absensi:** 
- Sakit: ${chartData.absenceDistribution.sakit} hari
- Izin: ${chartData.absenceDistribution.izin} hari  
- Cuti: ${chartData.absenceDistribution.cuti} hari

**Karyawan Paling Sering Terlambat:** ${JSON.stringify(chartData.topTardiness.slice(0, 5).map(e => ({ nama: e.NAMA, total: e.TERLAMBAT })))}

### **Analisis Situasi Terkini**
(Berikan penilaian objektif tentang kondisi kehadiran saat ini berdasarkan data)

### **Insight Utama & Pola yang Teridentifikasi**
(Identifikasi 3-4 pola atau tren penting dari data)

### **Rekomendasi Strategis**
(Berikan 4-5 rekomendasi konkret dan dapat ditindaklanjuti untuk manajemen)

### **Prioritas Tindakan Jangka Pendek**
(1-2 aksi yang harus segera dilakukan dalam 1-2 minggu ke depan)`;

        try { 
            const result = await geminiService.getAnalysis(prompt); 
            setAiModal(prev => ({ ...prev, content: result, isLoading: false })); 
        } catch (error) { 
            setAiModal(prev => ({ ...prev, content: `<p class="text-red-500">${error.message}</p>`, isLoading: false })); 
        }
    }, []);

    const handleGetIndividualAnalysis = useCallback(async (employee) => {
        setAiModal({ show: true, title: `Analisis Kinerja: ${employee.NAMA}`, content: '', isLoading: true });
        
        const lamaBekerjaString = employee.LAMA_BEKERJA > 0 ? `${employee.LAMA_BEKERJA} tahun` : 
                                 (employee.TAHUN_MASUK > 0 ? `${new Date().getFullYear() - employee.TAHUN_MASUK} tahun (Masuk ${employee.TAHUN_MASUK})` : 'N/A');
        
        const attendanceRate = employee.HARI_KERJA > 0 ? ((employee.HARI_KERJA - employee.TERLAMBAT - employee.SURAT_DOKTER - employee.IJIN_FULL) / employee.HARI_KERJA * 100).toFixed(1) : 0;
        
        const prompt = `Anda adalah seorang Manajer HR yang sedang melakukan review kinerja individual. Analisis karyawan berikut:

**Profil Karyawan:**
- Nama: ${employee.NAMA}
- Divisi: ${employee.DIVISI}
- Jabatan: ${employee.JABATAN}
- Lama Bekerja: ${lamaBekerjaString}

**Data Kehadiran (Periode Aktif):**
- Total Hari Kerja: ${employee.HARI_KERJA} hari
- Keterlambatan: ${employee.TERLAMBAT} kali
- Absen Sakit: ${employee.SURAT_DOKTER} hari
- Absen Izin: ${employee.IJIN_FULL} hari
- Cuti Diambil: ${employee.CUTI} hari
- Tingkat Kehadiran: ${attendanceRate}%

### **Assessment Kinerja Kehadiran**
(Berikan penilaian objektif tentang performa kehadiran karyawan ini)

### **Strengths (Kekuatan)**
(2-3 poin positif yang dapat dipertahankan)

### **Areas for Improvement (Area Pengembangan)**
(1-2 area spesifik yang perlu ditingkatkan dengan alasan yang jelas)

### **Recommended Actions (Rekomendasi Tindakan)**
(2-3 langkah konkret yang dapat diambil oleh karyawan dan supervisor)

### **Follow-up Plan (Rencana Tindak Lanjut)**
(Timeline dan milestone untuk evaluasi berikutnya)`;

        try { 
            const result = await geminiService.getAnalysis(prompt); 
            setAiModal(prev => ({ ...prev, content: result, isLoading: false })); 
        } catch (error) { 
            setAiModal(prev => ({ ...prev, content: `<p class="text-red-500">${error.message}</p>`, isLoading: false })); 
        }
    }, []);

    const handleGetComparisonAnalysis = useCallback(async ({ periodA, periodB, statsA, statsB }) => {
        setAiModal({ show: true, title: `Analisis Perbandingan: ${periodA} vs ${periodB}`, content: '', isLoading: true });
        
        const prompt = `Anda adalah seorang analis HR senior. Lakukan analisis perbandingan mendalam antara dua periode:

**Periode A (${periodA}):**
- Keterlambatan: ${statsA.tardiness} kali
- Absensi: ${statsA.absence} hari  
- Hari Kerja: ${statsA.workDays} hari
- Karyawan: ${statsA.employees} orang
- Avg Terlambat/Karyawan: ${statsA.avgTardiness.toFixed(2)}

**Periode B (${periodB}):**
- Keterlambatan: ${statsB.tardiness} kali (+${statsB.tardiness - statsA.tardiness})
- Absensi: ${statsB.absence} hari (+${statsB.absence - statsA.absence})
- Hari Kerja: ${statsB.workDays} hari (+${statsB.workDays - statsA.workDays})
- Karyawan: ${statsB.employees} orang (+${statsB.employees - statsA.employees})
- Avg Terlambat/Karyawan: ${statsB.avgTardiness.toFixed(2)}

### **Executive Summary**
(Ringkasan perubahan paling signifikan dalam 2-3 kalimat)

### **Key Performance Indicators Analysis**
(Analisis mendalam terhadap perubahan KPI utama dengan interpretasi bisnis)

### **Trend Analysis & Root Cause**
(Identifikasi tren dan kemungkinan penyebab perubahan yang terjadi)

### **Impact Assessment**
(Penilaian dampak perubahan terhadap produktivitas dan operasional)

### **Strategic Recommendations**
(3-4 rekomendasi strategis berdasarkan hasil perbandingan)

### **Action Plan & Timeline**
(Rencana aksi konkret dengan timeline yang jelas)`;

        try { 
            const result = await geminiService.getAnalysis(prompt); 
            setAiModal(prev => ({ ...prev, content: result, isLoading: false })); 
        } catch (error) { 
            setAiModal(prev => ({ ...prev, content: `<p class="text-red-500">${error.message}</p>`, isLoading: false })); 
        }
    }, []);

    // Print styles component
    const PrintStyles = () => (
        <style>{`
            @media print {
                body {
                    background-color: #fff !important;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
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
                    page-break-inside: avoid;
                }
                .bg-white {
                    box-shadow: none !important;
                    border: 1px solid #eee !important;
                }
                .dark .bg-white {
                    background-color: #fff !important;
                    color: #000 !important;
                }
                .custom-scrollbar {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                @page {
                    margin: 1cm;
                    size: A4;
                }
            }
            .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
            }
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: rgba(148, 163, 184, 0.5);
                border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: rgba(148, 163, 184, 0.7);
            }
        `}</style>
    );

    if (!showDashboard) {
        return (
            <ThemeProvider>
                <NotificationProvider>
                    <PrintStyles />
                    <FileUploadScreen 
                        onFileSelect={handleFileSelect} 
                        isLoading={isLoading} 
                        scriptsLoaded={scriptsLoaded} 
                    />
                    <Modal 
                        show={errorModal.show} 
                        title={errorModal.title} 
                        message={errorModal.message} 
                        type={errorModal.type}
                        onClose={hideError} 
                    />
                    <NotificationContainer />
                </NotificationProvider>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <NotificationProvider>
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
                <Modal 
                    show={errorModal.show} 
                    title={errorModal.title} 
                    message={errorModal.message} 
                    type={errorModal.type}
                    onClose={hideError} 
                />
                <AiAnalysisModal 
                    show={aiModal.show} 
                    title={aiModal.title} 
                    content={aiModal.content} 
                    isLoading={aiModal.isLoading} 
                    onClose={() => setAiModal({ show: false, title: '', content: '', isLoading: false })} 
                />
                <NotificationContainer />
            </NotificationProvider>
        </ThemeProvider>
    );
};

export default App;