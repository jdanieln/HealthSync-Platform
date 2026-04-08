import { apiClient } from './apiClient';

export const appointmentService = {
    getAppointments: (currentUser) => {
        return apiClient.get('/api/appointments', currentUser);
    },
    createAppointment: (data, currentUser) => {
        return apiClient.post('/api/appointments', data, currentUser);
    },
    updateAppointmentStatus: (id, status, currentUser) => {
        return apiClient.put(`/api/appointments/${id}`, { status }, currentUser);
    }
};
