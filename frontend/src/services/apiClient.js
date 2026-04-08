const API_URL = import.meta.env.VITE_API_URL;

class ApiClient {
    async request(endpoint, options = {}) {
        let headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (options.currentUser) {
            try {
                const token = await options.currentUser.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
            } catch (err) {
                console.error("Error getting ID token", err);
            }
        }

        const config = {
            ...options,
            headers
        };
        
        // Remove currentUser from fetch config since it's not a native fetch option
        delete config.currentUser;

        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        const isJson = response.headers.get("content-type")?.includes("application/json");
        const data = isJson ? await response.json() : null;

        if (!response.ok) {
            const error = (data && data.error) || response.statusText;
            throw new Error(error);
        }

        return data;
    }

    get(endpoint, currentUser) {
        return this.request(endpoint, { method: 'GET', currentUser });
    }

    post(endpoint, body, currentUser) {
        return this.request(endpoint, { method: 'POST', body: JSON.stringify(body), currentUser });
    }

    put(endpoint, body, currentUser) {
        return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body), currentUser });
    }

    delete(endpoint, currentUser) {
        return this.request(endpoint, { method: 'DELETE', currentUser });
    }
}

export const apiClient = new ApiClient();
