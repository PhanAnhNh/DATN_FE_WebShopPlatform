import { useState, useEffect, useCallback } from 'react';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const updateAuthState = useCallback(() => {
        const token = localStorage.getItem("user_token");
        const userData = localStorage.getItem("user_data") || localStorage.getItem("user");
        
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } catch (e) {
                setUser(null);
                setIsAuthenticated(false);
            }
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
        setLoading(false);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_data");
        
        // Xóa tất cả cache
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
            if (key.startsWith('home_') || key.startsWith('sidebar_')) {
                sessionStorage.removeItem(key);
            }
        });
        
        setUser(null);
        setIsAuthenticated(false);
        
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }, []);

    useEffect(() => {
        updateAuthState();
        
        const handleStorageChange = (e) => {
            if (e.key === 'user_token' || e.key === 'user_data' || e.key === 'user') {
                updateAuthState();
            }
        };
        
        const handleLogoutEvent = () => {
            setUser(null);
            setIsAuthenticated(false);
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userLoggedOut', handleLogoutEvent);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userLoggedOut', handleLogoutEvent);
        };
    }, [updateAuthState]);

    return { user, isAuthenticated, loading, logout, updateAuthState };
};