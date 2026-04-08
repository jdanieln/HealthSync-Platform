import { apiClient } from './apiClient';

export const patientService = {
    getPatients: (currentUser) => {
        return apiClient.get('/api/doctors/patients', currentUser);
    }
};

export const userService = {
    getUsers: (currentUser) => {
        return apiClient.get('/api/admin/users', currentUser);
    },
    createUser: (data, currentUser) => {
        return apiClient.post('/api/admin/users', data, currentUser);
    },
    updateUser: (uid, data, currentUser) => {
        return apiClient.put(`/api/admin/users/${uid}`, data, currentUser);
    },
    deleteUser: (uid, currentUser) => {
        return apiClient.delete(`/api/admin/users/${uid}`, currentUser);
    }
};
