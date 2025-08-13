// import { useCallback, useMemo } from 'react';
// import { getMonthNumber } from '../utils/helpers';

// export const useAttendanceData = (allData) => {
//     const getEmployeeByName = useCallback((name) => {
//         const records = allData.filter(row => row.NAMA === name);
//         if (records.length === 0) return null;

//         const employeeData = records.reduce((acc, row) => {
//             acc.HARI_KERJA += row.HARI_KERJA;
//             acc.TERLAMBAT += row.TERLAMBAT;
//             acc.SURAT_DOKTER += row.SURAT_DOKTER;
//             acc.IJIN_FULL += row.IJIN_FULL;
//             acc.CUTI += row.CUTI;
//             if(row.SISA_CUTI) acc.SISA_CUTI = row.SISA_CUTI;
//             return acc;
//         }, {
//             NAMA: name,
//             DIVISI: records[0].DIVISI || 'N/A',
//             JABATAN: records[0].JABATAN || 'N/A',
//             TAHUN_MASUK: records[0].TAHUN_MASUK || 0,
//             LAMA_BEKERJA: records[0].LAMA_BEKERJA || 0,
//             HARI_KERJA: 0, TERLAMBAT: 0, SURAT_DOKTER: 0, IJIN_FULL: 0, CUTI: 0, SISA_CUTI: records[0].SISA_CUTI || 0
//         });
//         return employeeData;
//     }, [allData]);

//     const availableMonths = useMemo(() => {
//         return [...new Set(allData.map(item => item.BULAN))].filter(Boolean).sort((a, b) => getMonthNumber(a) - getMonthNumber(b));
//     }, [allData]);

//     const availableEmployees = useMemo(() => {
//         return [...new Set(allData.map(item => item.NAMA))].filter(Boolean).sort();
//     }, [allData]);
    
//     const availableDivisions = useMemo(() => {
//         return [...new Set(allData.map(item => item.DIVISI))].filter(Boolean).sort();
//     }, [allData]);

//     return { getEmployeeByName, availableMonths, availableEmployees, availableDivisions, allData };
// };
