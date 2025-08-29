// Di bagian atas file PredictionPage.jsx
import { mlModelService } from '../services/mlModelService';

const handlePredict = async () => {

    setIsPredicting(true);
    setPredictionResult(null);
    try {
        const result = await mlModelService.predictLeave(employeeData);
        setPredictionResult(result);
    } catch (error) {
        console.error(error.message);
        alert(error.message); 
    } finally {
        setIsPredicting(false);
    }
};