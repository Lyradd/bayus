// export const loadScript = (src) => {
//     return new Promise((resolve, reject) => {
//         if (document.querySelector(`script[src="${src}"]`)) {
//             resolve();
//             return;
//         }
//         const script = document.createElement('script');
//         script.src = src;
//         script.async = true;
//         script.onload = resolve;
//         script.onerror = reject;
//         document.head.appendChild(script);
//     });
// };

// export const csvParserService = {
//     parse: (file, onComplete, onError) => {
//         if (!window.Papa) {
//             onError(new Error("PapaParse library is not loaded."));
//             return;
//         }
//         window.Papa.parse(file, {
//             header: true,
//             skipEmptyLines: true,
//             dynamicTyping: false,
//             delimitersToGuess: [',', '\t', '|', ';'],
//             complete: (results) => {
//                 if (results.errors.length) console.warn('CSV parsing warnings:', results.errors);
//                 if (!results.data || results.data.length === 0) {
//                     onError(new Error('File CSV kosong atau tidak memiliki data yang valid.'));
//                     return;
//                 }
//                 const normalizedData = results.data.map(row => {
//                     const normalizedRow = {};
//                     for (const key in row) {
//                         normalizedRow[key.toUpperCase().trim().replace(/\s+/g, '_')] = row[key];
//                     }
//                     return normalizedRow;
//                 });
//                 const firstRow = normalizedData[0];
//                 const requiredColumns = ['NAMA'];
//                 const missingColumns = requiredColumns.filter(col => !(col in firstRow));
//                 if (missingColumns.length > 0) {
//                     onError(new Error(`Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(', ')}`));
//                     return;
//                 }
//                 const processedData = normalizedData.map(csvParserService.processRow).filter(row => row && row.NAMA && row.NAMA.trim() !== '');
//                 if (processedData.length === 0) {
//                     onError(new Error('Tidak ada data valid yang ditemukan dalam file CSV.'));
//                     return;
//                 }
//                 onComplete(processedData);
//             },
//             error: (error) => onError(new Error(`Terjadi kesalahan saat membaca file CSV: ${error.message}`)),
//         });
//     },
//     processRow: (row) => {
//         const numericColumns = ['SURAT_DOKTER', 'IJIN_FULL', 'TERLAMBAT', 'CUTI', 'SISA_CUTI', 'HARI_KERJA', 'HARI_KERJA_KOTOR', 'TAHUN_MASUK', 'LAMA_BEKERJA', 'GAJI_POKOK', 'TAHUN', 'CASHBON'];
//         const processedRow = { ...row };
//         numericColumns.forEach(col => {
//             const cleanValue = String(processedRow[col] || '0').replace(/[^\d.-]/g, '');
//             processedRow[col] = parseFloat(cleanValue) || 0;
//         });
//         ['NAMA', 'DIVISI', 'JABATAN', 'BULAN'].forEach(col => {
//             if (processedRow[col]) processedRow[col] = String(processedRow[col]).trim();
//         });
//         return processedRow;
//     }
// };

// export const geminiService = {
//     getAnalysis: async (prompt) => {
//         try {
//             const apiKey = "";
//             const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
//             const payload = { contents: chatHistory };
//             const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
//             const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
//             if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
//             const result = await response.json();
//             if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
//                 return result.candidates[0].content.parts[0].text;
//             } else {
//                 console.error("Invalid API response structure:", result);
//                 throw new Error("Struktur respons dari API tidak valid atau tidak berisi teks.");
//             }
//         } catch (error) {
//             console.error("Gemini API Error:", error);
//             throw new Error(`Terjadi kesalahan saat mengambil analisis AI: ${error.message}. Mohon coba lagi.`);
//         }
//     }
// };

// export const exportService = {
//     exportToCsv: (data, filename = 'export.csv') => {
//         if (!window.Papa) {
//             console.error("Layanan ekspor belum siap, silakan coba lagi.");
//             return;
//         }
//         if (!data || data.length === 0) {
//             console.error("Tidak ada data untuk diekspor.");
//             return;
//         }
//         const csv = window.Papa.unparse(data);
//         const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//         const link = document.createElement("a");
//         if (link.download !== undefined) {
//             const url = URL.createObjectURL(blob);
//             link.setAttribute("href", url);
//             link.setAttribute("download", filename);
//             link.style.visibility = 'hidden';
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//         }
//     }
// };

// export const mlModelService = {
//     predictLeave: async (employee) => {
//         return new Promise(resolve => {
//             setTimeout(() => {
//                 const tardiness = employee.TERLAMBAT || 0;
//                 const sickness = employee.SURAT_DOKTER || 0;
//                 const permit = employee.IJIN_FULL || 0;
//                 let predictedLeave = 0;
//                 predictedLeave += tardiness * 0.15;
//                 predictedLeave += (sickness + permit) * 0.25;
//                 const finalPrediction = Math.max(0, predictedLeave);
//                 resolve({ prediksi_cuti_bulan_depan: finalPrediction });
//             }, 1500);
//         });
//     }
// };