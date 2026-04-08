import { apiClient } from './apiClient';

export const diagnosisService = {
    createDiagnosis: (data, currentUser) => {
        return apiClient.post('/api/diagnoses', data, currentUser);
    },
    getPatientDiagnoses: (patientId, currentUser) => {
        return apiClient.get(`/api/diagnoses/patient/${patientId}`, currentUser);
    }
};
