import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const processToken = (token) => {
        const decoded = jwtDecode(token);
        
        return {
            userId: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
            username: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
            role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
        };
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                setUser(processToken(token));
            } catch (error) {
                console.error("Invalid token", error);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const response = await api.post('/Users/login', { username, password });
        
        const token = response.data.token;
        localStorage.setItem('token', token); 
        
        setUser(processToken(token)); 
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login'; 
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children} 
        </AuthContext.Provider>
    );
};