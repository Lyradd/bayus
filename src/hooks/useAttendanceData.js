import { useMemo, useCallback } from 'react';

const monthMapping = {
    'januari': 1, 'jan': 1, 'februari': 2, 'feb': 2, 'maret': 3, 'mar': 3, 'april': 4, 'apr': 4, 'mei': 5,
    'juni': 6, 'jun': 6, 'juli': 7, 'jul': 7, 'agustus': 8, 'agu': 8, 'ags': 8, 'aug': 8, 'september': 9, 'sep': 9,
    'oktober': 10, 'okt': 10, 'november': 11, 'nov': 11, 'desember': 12, 'des': 12, 'dec': 12, 'december': 12
};

export const getMonthNumber = (monthName) => {
    if (!monthName) return 0;
    const lowerMonth = String(monthName).toLowerCase().trim();
    return monthMapping[lowerMonth] || 0;
};

export const useAttendanceData = (allData) => {
    const getEmployeeByName = useCallback((name) => {
        const records = allData.filter(row => row.NAMA === name);
        if (records.length === 0) return null;

        return records.reduce((acc, row) => {
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