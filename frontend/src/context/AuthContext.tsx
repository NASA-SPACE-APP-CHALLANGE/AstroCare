import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Astronaut } from '@/types';
import { api } from '@/services/api';

interface AuthContextType {
    user: User | null;
    activeAstronautId: string;
    activeAstronaut: Astronaut | null;
    allAstronauts: Astronaut[];
    login: (username: string, password: string) => Promise<boolean>;
    loginAsRole: (role: 'astronaut' | 'medical_team') => Promise<void>;
    logout: () => void;
    setActiveAstronautId: (id: string) => void;
    refreshAstronauts: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('astrovital_user');
        return saved ? JSON.parse(saved) : {
            id: 1,
            username: 'astronaut',
            role: 'astronaut',
            full_name: 'CDR Alex Vance',
            astronaut_id: 'ASTRO-01',
        };
    });

    const [activeAstronautId, setActiveAstronautId] = useState<string>('ASTRO-01');
    const [allAstronauts, setAllAstronauts] = useState<Astronaut[]>([]);
    const [activeAstronaut, setActiveAstronaut] = useState<Astronaut | null>(null);

    const refreshAstronauts = async () => {
        try {
            const data = await api.astronauts.list();
            setAllAstronauts(data.astronauts);
            const found = data.astronauts.find(a => a.astronaut_id === activeAstronautId);
            if (found) setActiveAstronaut(found);
            else if (data.astronauts.length > 0) setActiveAstronaut(data.astronauts[0]);
        } catch (err) {
            console.error('Failed to load astronauts', err);
        }
    };

    useEffect(() => {
        refreshAstronauts();
    }, [activeAstronautId]);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const res = await api.auth.login({ username, password });
            setUser(res.user);
            localStorage.setItem('astrovital_user', JSON.stringify(res.user));
            if (res.user.astronaut_id) {
                setActiveAstronautId(res.user.astronaut_id);
            }
            return true;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    };

    const loginAsRole = async (role: 'astronaut' | 'medical_team') => {
        const username = role === 'astronaut' ? 'astronaut' : 'surgeon';
        const password = role === 'astronaut' ? 'astro2025' : 'medical2025';
        await login(username, password);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('astrovital_user');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                activeAstronautId,
                activeAstronaut,
                allAstronauts,
                login,
                loginAsRole,
                logout,
                setActiveAstronautId,
                refreshAstronauts,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
