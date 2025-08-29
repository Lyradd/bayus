// import React, { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { BrainCircuit, Zap, LoaderCircle } from 'lucide-react';
// import { useAttendanceData } from '../hooks/useAttendanceData';
// import { mlModelService } from '../services/apiService';
// import AnimatedDropdown from '../components/ui/AnimatedDropdown';

// const PredictionPage = ({ data, availableEmployees }) => {
//     const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
//     const [isPredicting, setIsPredicting] = useState(false);
//     const [predictionResult, setPredictionResult] = useState(null);
//     const { getEmployeeByName } = useAttendanceData(data);

//     const handlePredict = async () => {
//         if (!selectedEmployeeName) return;
        
//         const employeeData = getEmployeeByName(selectedEmployeeName);
//         if (!employeeData) return;

//         setIsPredicting(true);
//         setPredictionResult(null); // Reset previous result
//         const result = await mlModelService.predictLeave(employeeData);
//         setPredictionResult(result);
//         setIsPredicting(false);
//     };

//     return (
//         <motion.div
//             className="space-y-8"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//             transition={{ duration: 0.3 }}
//         >
//             <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-2xl p-8 text-white">
//                 <div className="flex items-center gap-3 mb-4">
//                     <BrainCircuit className="w-8 h-8" />
//                     <h2 className="text-3xl font-bold">Model Prediksi Cuti Karyawan</h2>
//                 </div>
//                 <p className="text-sky-100 text-lg">Gunakan model prediktif untuk mengantisipasi kemungkinan karyawan mengambil cuti.</p>
//             </div>

//             {/* Prediction Controls */}
//             <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors duration-300">
//                 <h3 className="text-xl font-semibold mb-4 text-sky-900 dark:text-sky-300">Jalankan Prediksi</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
//                     <div className="md:col-span-2">
//                         <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Pilih Karyawan</label>
//                         <AnimatedDropdown
//                             options={availableEmployees}
//                             selectedValue={selectedEmployeeName}
//                             onValueChange={setSelectedEmployeeName}
//                             placeholder="Pilih nama karyawan..."
//                         />
//                     </div>
//                     <button
//                         onClick={handlePredict}
//                         disabled={!selectedEmployeeName || isPredicting}
//                         className="bg-sky-700 hover:bg-sky-800 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-lg"
//                     >
//                         {isPredicting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
//                         {isPredicting ? 'Memprediksi...' : 'Jalankan Prediksi'}
//                     </button>
//                 </div>
//             </div>

//             {/* Prediction Result */}
//             <AnimatePresence>
//                 {isPredicting && (
//                     <motion.div 
//                         className="text-center"
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         exit={{ opacity: 0, y: -10 }}
//                     >
//                         <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
//                             <LoaderCircle className="w-12 h-12 text-sky-600 dark:text-sky-400 mx-auto animate-spin mb-4" />
//                             <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Menganalisis Pola...</h3>
//                             <p className="text-gray-600 dark:text-gray-400">Model sedang memproses data historis untuk {selectedEmployeeName}.</p>
//                         </div>
//                     </motion.div>
//                 )}
//                 {predictionResult && (
//                     <motion.div
//                         className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden"
//                         initial={{ opacity: 0, scale: 0.95 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         transition={{ duration: 0.5, ease: "easeOut" }}
//                     >
//                         <div className="p-8">
//                             <h3 className="text-2xl font-bold text-sky-900 dark:text-white mb-2">Hasil Prediksi untuk {selectedEmployeeName}</h3>
//                             <div className="flex flex-col md:flex-row items-center gap-8 mt-6">
//                                 <div className="text-center">
//                                     <p className="text-gray-600 dark:text-gray-400 text-lg">Kemungkinan Cuti</p>
//                                     <p className={`text-5xl font-bold ${predictionResult.colorClass}`}>{predictionResult.prediction}</p>
//                                     <p className="text-2xl font-medium text-gray-700 dark:text-gray-300 mt-1">({predictionResult.probability})</p>
//                                 </div>
//                                 <div className="flex-1 w-full">
//                                     <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">Faktor-faktor Utama yang Mempengaruhi:</h4>
//                                     <ul className="space-y-2">
//                                         {predictionResult.reasons.map((reason, index) => (
//                                             <motion.li 
//                                                 key={index}
//                                                 className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
//                                                 initial={{ opacity: 0, x: -10 }}
//                                                 animate={{ opacity: 1, x: 0 }}
//                                                 transition={{ delay: 0.2 + index * 0.1 }}
//                                             >
//                                                 <div className={`w-2 h-2 mt-1.5 rounded-full ${predictionResult.prediction === 'Kemungkinan Rendah' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
//                                                 <span className="text-gray-700 dark:text-gray-300">{reason}</span>
//                                             </motion.li>
//                                         ))}
//                                     </ul>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="bg-gray-50 dark:bg-slate-800/50 px-8 py-4">
//                             <p className="text-sm text-gray-500 dark:text-gray-400">
//                                 <strong>Disclaimer:</strong> Prediksi ini dibuat berdasarkan model simulasi dan data historis yang tersedia. Gunakan sebagai salah satu pertimbangan dalam pengambilan keputusan.
//                             </p>
//                         </div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//         </motion.div>
//     );
// };

// export default PredictionPage;
