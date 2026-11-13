import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, Astronaut } from '@/types';
import { api } from '@/services/api';
import { AuthContext } from './auth-types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('astrovital_user');
            return saved ? JSON.parse(saved) : {
                id: 1,
                username: 'astronaut',
                role: 'astronaut',
                full_name: 'CDR Alex Vance',
                astronaut_id: 'ASTRO-01',
            };
        } catch {
            return {
                id: 1,
                username: 'astronaut',
                role: 'astronaut',
                full_name: 'CDR Alex Vance',
                astronaut_id: 'ASTRO-01',
            };
        }
    });

    const [activeAstronautId, setActiveAstronautId] = useState<string>('ASTRO-01');
    const [allAstronauts, setAllAstronauts] = useState<Astronaut[]>([]);
    const [activeAstronaut, setActiveAstronaut] = useState<Astronaut | null>(null);

    const refreshAstronauts = useCallback(async () => {
        try {
            const data = await api.astronauts.list();
            setAllAstronauts(data.astronauts);
            const found = data.astronauts.find(a => a.astronaut_id === activeAstronautId);
            if (found) setActiveAstronaut(found);
            else if (data.astronauts.length > 0) setActiveAstronaut(data.astronauts[0]);
        } catch (err) {
            console.error('Failed to load astronauts', err);
        }
    }, [activeAstronautId]);

    useEffect(() => {
        let mounted = true;
        api.astronauts.list().then(data => {
            if (!mounted) return;
            setAllAstronauts(data.astronauts);
            const found = data.astronauts.find(a => a.astronaut_id === activeAstronautId);
            if (found) setActiveAstronaut(found);
            else if (data.astronauts.length > 0) setActiveAstronaut(data.astronauts[0]);
        }).catch(err => {
            console.error('Failed to load astronauts on mount', err);
        });
        return () => { mounted = false; };
    }, [activeAstronautId]);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
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
    }, []);

    const loginAsRole = useCallback(async (role: 'astronaut' | 'medical_team') => {
        const username = role === 'astronaut' ? 'astronaut' : 'surgeon';
        const password = role === 'astronaut' ? 'astro2025' : 'medical2025';
        await login(username, password);
    }, [login]);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('astrovital_user');
    }, []);

    const contextValue = useMemo(() => ({
        user,
        activeAstronautId,
        activeAstronaut,
        allAstronauts,
        login,
        loginAsRole,
        logout,
        setActiveAstronautId,
        refreshAstronauts,
    }), [user, activeAstronautId, activeAstronaut, allAstronauts, login, loginAsRole, logout, refreshAstronauts]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
