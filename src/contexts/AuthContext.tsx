import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthModel } from 'pocketbase';
import { pb } from '../lib/pocketbase';


interface AuthContextType {
    user: AuthModel | null;
    isValid: boolean;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthModel | null>(pb.authStore.model);
    const [isValid, setIsValid] = useState<boolean>(pb.authStore.isValid);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Listen to auth state changes
        return pb.authStore.onChange((token, model) => {
            setUser(model);
            setIsValid(!!token);
        }, true);
    }, []);

    useEffect(() => {
        // Sync initial state and finish loading
        setUser(pb.authStore.model);
        setIsValid(pb.authStore.isValid);
        setIsLoading(false);
    }, []);

    const logout = () => {
        pb.authStore.clear();
    };

    return (
        <AuthContext.Provider value={{ user, isValid, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
