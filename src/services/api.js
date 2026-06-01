import axios from 'axios';

const api = axios.create({
    baseURL: 'https://localhost:7023', 
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {

            const requestUrl = error.config.url.toLowerCase();
            
            if (requestUrl.endsWith('/login') || requestUrl.includes('auth/login')) {
                return Promise.reject(error);
            }
            
            console.warn("Unauthorized! Token may be expired or invalid.");
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);

export default api;
