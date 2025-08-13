// Di bagian atas file PredictionPage.jsx
import { mlModelService } from '../services/mlModelService'; // Pastikan path-nya benar

// ... di dalam komponen PredictionPage
const handlePredict = async () => {
    // ... (logika untuk mendapatkan data karyawan)

    setIsPredicting(true);
    setPredictionResult(null);
    try {
        // Panggil service yang baru kita buat
        const result = await mlModelService.predictLeave(employeeData);
        setPredictionResult(result);
    } catch (error) {
        // Tampilkan pesan error kepada pengguna
        console.error(error.message);
        // Ganti alert ini dengan komponen Modal yang sudah Anda buat agar lebih cantik
        alert(error.message); 
    } finally {
        setIsPredicting(false);
    }
};