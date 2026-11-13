import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Activity, Brain, Bell, Database,
    Info, Settings, ChevronLeft, ChevronRight, Satellite,
    Upload, Clock, FileText, User, Cpu, LogOut, Stethoscope, UserCheck, BookOpen
} from 'lucide-react';
import { AstroCareLogo } from './Logo';
import { useAuth } from '@/context/AuthContext';

const SIDEBAR_ITEMS = [
    { icon: LayoutDashboard, label: 'Mission Overview', to: '/dashboard', exact: true },
    { icon: Activity, label: 'Health Analytics', to: '/dashboard/analytics' },
    { icon: Brain, label: 'AI Anomaly Detection', to: '/dashboard/ai' },
    { icon: Bell, label: 'Alert Center', to: '/dashboard/alerts' },
    { icon: User, label: 'Astronaut Profile', to: '/dashboard/profile' },
    { icon: FileText, label: 'Mission Reports', to: '/dashboard/reports' },
    { icon: Cpu, label: 'Data Simulator', to: '/dashboard/simulator' },
    { icon: Database, label: 'Telemetry Archive', to: '/dashboard/telemetry' },
    { icon: Upload, label: 'Data Import', to: '/dashboard/import' },
    { icon: Clock, label: 'Mission Timeline', to: '/dashboard/timeline' },
    { icon: Satellite, label: 'Dataset Info', to: '/dashboard/dataset' },
    { icon: BookOpen, label: 'NASA & CSA Research', to: '/dashboard/research' },
    { icon: Info, label: 'Project Story', to: '/dashboard/about' },
    { icon: Settings, label: 'Settings', to: '/dashboard/settings' },
];

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

export const DashboardSidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
    const location = useLocation();
    const { user, logout } = useAuth();

    return (
        <aside
            role="navigation"
            aria-label="Dashboard navigation"
            style={{
                width: collapsed ? 64 : 240,
                minHeight: '100vh',
                background: 'rgba(11,16,38,0.96)',
                borderRight: '1px solid rgba(145,160,190,0.12)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: 0,
                transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)',
                zIndex: 100,
                flexShrink: 0,
                overflow: 'hidden',
            }}
        >
            {/* Project Logo (AstroCare preserved) */}
            <div style={{ padding: collapsed ? '1rem 0' : '1.25rem 1rem', borderBottom: '1px solid rgba(145,160,190,0.1)', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
                {collapsed ? (
                    <AstroCareLogo size={28} showText={false} />
                ) : (
                    <AstroCareLogo size={28} />
                )}
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
                {SIDEBAR_ITEMS.map(item => {
                    const isActive = (item as any).exact
                        ? location.pathname === item.to
                        : location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            title={collapsed ? item.label : undefined}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: collapsed ? '0.65rem' : '0.6rem 0.75rem',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '2px',
                                textDecoration: 'none',
                                color: isActive ? 'var(--electric-cyan)' : 'var(--text-secondary)',
                                background: isActive ? 'rgba(83,231,255,0.08)' : 'transparent',
                                borderLeft: isActive ? '2px solid var(--electric-cyan)' : '2px solid transparent',
                                transition: 'all 150ms',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                fontSize: '0.85rem',
                                fontWeight: isActive ? 600 : 400,
                            }}
                        >
                            <Icon size={16} style={{ flexShrink: 0 }} />
                            {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile Badge / Login Status */}
            {!collapsed && (
                <div style={{
                    padding: '0.75rem',
                    borderTop: '1px solid rgba(145,160,190,0.1)',
                    margin: '0 0.5rem 0.5rem',
                }}>
                    <div className="glass-card" style={{ padding: '0.65rem', borderRadius: 'var(--radius-md)', background: 'rgba(5, 8, 22, 0.7)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                {user?.role === 'medical_team' ? (
                                    <Stethoscope size={15} color="var(--aurora-violet)" style={{ flexShrink: 0 }} />
                                ) : (
                                    <UserCheck size={15} color="var(--electric-cyan)" style={{ flexShrink: 0 }} />
                                )}
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--stellar-white)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                        {user?.full_name || 'Crew Member'}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                        {user?.role === 'medical_team' ? 'FLIGHT SURGEON' : 'ASTRONAUT VIEW'}
                                    </div>
                                </div>
                            </div>

                            <Link
                                to="/login"
                                title="Switch Role or Login"
                                style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                            >
                                <LogOut size={13} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Mission status footer */}
            {!collapsed && (
                <div style={{
                    padding: '0 0.75rem 0.5rem',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--success-mint)',
                    }}>
                        <span className="status-dot active" />
                        <span>ARTEMIS VII • ACTIVE</span>
                    </div>
                </div>
            )}

            {/* Collapse toggle */}
            <button
                onClick={onToggle}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0.75rem', borderTop: '1px solid rgba(145,160,190,0.1)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', transition: 'color 150ms',
                    width: '100%',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--electric-cyan)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
        </aside>
    );
};
