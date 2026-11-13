import React, { useState, useEffect, useCallback } from 'react';
import {
    RefreshCw, Pause, Play, Satellite,
    Zap, Bell, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { MetricCard } from '@/components/MetricCard';
import type { MetricStats, Alert } from '@/types';

const MISSION_START = new Date('2025-01-01T00:00:00Z');

function formatElapsed(ms: number) {
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${d}D ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const DashboardOverview: React.FC = () => {
    const { activeAstronautId, activeAstronaut, allAstronauts, setActiveAstronautId } = useAuth();

    const [metrics, setMetrics] = useState<MetricStats[]>([]);
    const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [paused, setPaused] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(() => new Date());
    const [elapsed, setElapsed] = useState('');
    const [stepping, setStepping] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [m, a] = await Promise.all([
                api.metrics(activeAstronautId),
                api.alerts({ limit: 4, acknowledged: false }),
            ]);
            setMetrics(m);
            setRecentAlerts(a.alerts);
            setLastUpdate(new Date());
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    }, [activeAstronautId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (paused) return;
        const id = setInterval(loadData, 20000);
        return () => clearInterval(id);
    }, [paused, loadData]);

    useEffect(() => {
        const id = setInterval(() => {
            setElapsed(formatElapsed(Date.now() - MISSION_START.getTime()));
        }, 1000);
        return () => clearInterval(id);
    }, []);

    const handleQuickStep = async (scenario = 'normal') => {
        setStepping(true);
        try {
            await api.simulator.step(scenario, activeAstronautId);
            await loadData();
        } catch (err) {
            console.error('Quick step error', err);
        } finally {
            setStepping(false);
        }
    };

    const handleAcknowledgeAlert = async (alertId: string) => {
        try {
            await api.acknowledgeAlert(alertId);
            setRecentAlerts(prev => prev.filter(al => al.alert_id !== alertId));
        } catch (err) {
            console.error('Acknowledge error', err);
        }
    };

    return (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Mission Console Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span className="section-eyebrow">MISSION CONSOLE</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--electric-cyan)' }}>
                            {activeAstronaut?.mission_id || 'ARTEMIS-VII'} / SOL {activeAstronaut?.current_mission_day || 142}
                        </span>
                    </div>
                    <h2 style={{ margin: 0 }}>
                        Astronaut Health <span className="text-cyan">Dashboard</span>
                    </h2>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Real-time physiological telemetry monitoring, AI anomaly detection, and spaceflight countermeasures.
                    </p>
                </div>

                {/* Controls & Astronaut Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <select
                        value={activeAstronautId}
                        onChange={e => setActiveAstronautId(e.target.value)}
                        style={{
                            background: 'rgba(11, 16, 38, 0.9)',
                            border: '1px solid rgba(83, 231, 255, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--stellar-white)',
                            padding: '0.45rem 0.8rem',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem',
                            outline: 'none',
                        }}
                    >
                        {allAstronauts.map(a => (
                            <option key={a.astronaut_id} value={a.astronaut_id}>
                                {a.name} ({a.astronaut_id})
                            </option>
                        ))}
                    </select>

                    <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        UPDATED {lastUpdate.toLocaleTimeString()}
                    </div>

                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setPaused(!paused)}
                        aria-label={paused ? 'Resume Telemetry' : 'Pause Telemetry'}
                    >
                        {paused ? <Play size={13} /> : <Pause size={13} />}
                        {paused ? 'Resume' : 'Pause'}
                    </button>

                    <button
                        className="btn btn-outline btn-sm"
                        onClick={loadData}
                        disabled={loading}
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Space Station Environmental Telemetry Strip */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                padding: '0.85rem 1.25rem',
                background: 'rgba(11, 16, 38, 0.85)',
                border: '1px solid rgba(83, 231, 255, 0.2)',
                borderRadius: 'var(--radius-md)',
                alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="status-dot active" />
                    <div>
                        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>HABITAT ENVIRONMENT</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--success-mint)', fontFamily: 'var(--font-mono)' }}>NOMINAL CABIN ATM</div>
                    </div>
                </div>

                <div>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>CABIN O₂ CONCENTRATION</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--electric-cyan)', fontFamily: 'var(--font-mono)' }}>21.2% [MEASURED]</div>
                </div>

                <div>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>CABIN TOTAL PRESSURE</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--stellar-white)', fontFamily: 'var(--font-mono)' }}>101.3 kPa [MEASURED]</div>
                </div>

                <div>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ORBITAL REGIME</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--aurora-violet)', fontFamily: 'var(--font-mono)' }}>408 KM LEO / 16 ORBITS/DAY</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <span style={{
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255, 202, 114, 0.1)',
                        color: 'var(--warning-amber)',
                        border: '1px solid rgba(255, 202, 114, 0.25)',
                    }}>
                        SIMULATED PHYSIOLOGICAL DEMO
                    </span>
                </div>
            </div>

            {/* Astronaut Profile Card + Quick Simulator Step Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* Active Crew Member Card */}
                <div className="glass-card" style={{ padding: '1.25rem', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{
                            width: 62,
                            height: 62,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(83,231,255,0.2), rgba(146,117,255,0.2))',
                            border: '2px solid var(--electric-cyan)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                        }}>
                            {activeAstronaut?.avatar_url ? (
                                <img src={activeAstronaut.avatar_url} alt={activeAstronaut.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Satellite size={28} color="var(--electric-cyan)" />
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div className="section-eyebrow" style={{ marginBottom: '0.2rem' }}>ACTIVE CREW MEMBER</div>
                            <h3 style={{ margin: '0 0 0.2rem', color: 'var(--electric-cyan)', fontSize: '1.25rem' }}>
                                {activeAstronaut?.name || 'CDR Alex Vance'}
                            </h3>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {activeAstronaut?.role || 'Mission Commander'} • {activeAstronaut?.astronaut_id || 'ASTRO-01'}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.65rem' }}>
                                <div>
                                    <div className="telemetry-label">MISSION STATUS</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--success-mint)', fontWeight: 600 }}>
                                        ACTIVE MONITORING
                                    </div>
                                </div>

                                <div>
                                    <div className="telemetry-label">FLIGHT DAY</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--stellar-white)', fontWeight: 600 }}>
                                        Day {activeAstronaut?.current_mission_day || 142} of {activeAstronaut?.mission_duration_days || 180}
                                    </div>
                                </div>

                                <div>
                                    <div className="telemetry-label">MISSION ELAPSED</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--electric-cyan)', fontWeight: 600 }}>
                                        {elapsed}
                                    </div>
                                </div>

                                <div>
                                    <div className="telemetry-label">CUMULATIVE DOSE</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--warning-amber)', fontWeight: 600 }}>
                                        {activeAstronaut?.current_cumulative_radiation_msv?.toFixed(1) || 42.6} mSv
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Link
                            to="/dashboard/profile"
                            className="btn btn-outline btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}
                        >
                            View Baseline <ArrowRight size={12} />
                        </Link>
                    </div>
                </div>

                {/* Quick Simulator Controls Card */}
                <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <Zap size={16} color="var(--electric-cyan)" />
                            <h4 style={{ fontSize: '0.95rem', color: 'var(--stellar-white)', margin: 0 }}>Simulator Quick Trigger</h4>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                            Generate the next 30-min data packet to test anomaly detection in real time.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button
                            onClick={() => handleQuickStep('normal')}
                            disabled={stepping}
                            className="btn-primary"
                            style={{ padding: '0.55rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                            <FastForwardIcon />
                            {stepping ? 'Generating...' : '+30 Min Step (Circadian Normal)'}
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleQuickStep('tachycardia')}
                                disabled={stepping}
                                className="btn-ghost"
                                style={{ padding: '0.45rem', fontSize: '0.72rem', color: 'var(--critical-coral)', border: '1px solid rgba(255,100,124,0.3)' }}
                            >
                                + Inject Tachycardia
                            </button>
                            <button
                                onClick={() => handleQuickStep('hypoxia')}
                                disabled={stepping}
                                className="btn-ghost"
                                style={{ padding: '0.45rem', fontSize: '0.72rem', color: 'var(--electric-cyan)', border: '1px solid rgba(83,231,255,0.3)' }}
                            >
                                + Inject SpO₂ Dip
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vital Health Telemetry — All 7 Indicators */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div className="section-eyebrow">PHYSIOLOGICAL INDICATORS — LATEST READINGS</div>
                    <Link
                        to="/dashboard/analytics"
                        style={{ fontSize: '0.8rem', color: 'var(--electric-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                        Open Full Trend Analytics <ArrowRight size={12} />
                    </Link>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <div className="spinner" />
                    </div>
                ) : metrics.length === 0 ? (
                    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <p>No metric data available. Ensure the backend is running and data is seeded.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {metrics.map(m => <MetricCard key={m.metric} metric={m} />)}
                    </div>
                )}
            </div>

            {/* Recent Alerts & Quick Triage Strip */}
            {recentAlerts.length > 0 && (
                <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(255, 100, 124, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Bell size={18} color="var(--critical-coral)" />
                            <h4 style={{ fontSize: '1rem', color: 'var(--stellar-white)', margin: 0 }}>
                                Active Telemetry Alerts ({recentAlerts.length})
                            </h4>
                        </div>
                        <Link
                            to="/dashboard/alerts"
                            style={{ fontSize: '0.8rem', color: 'var(--electric-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                            Open Alert Center <ArrowRight size={12} />
                        </Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                        {recentAlerts.map(a => (
                            <div
                                key={a.alert_id}
                                style={{
                                    padding: '0.85rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: a.severity === 'critical' ? 'rgba(255, 100, 124, 0.1)' : 'rgba(255, 202, 114, 0.1)',
                                    border: a.severity === 'critical' ? '1px solid rgba(255, 100, 124, 0.3)' : '1px solid rgba(255, 202, 114, 0.3)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem',
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontFamily: 'var(--font-mono)',
                                            color: a.severity === 'critical' ? 'var(--critical-coral)' : 'var(--warning-amber)',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                        }}>
                                            {a.severity} • {a.metric?.replace('_', ' ')}
                                        </span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                            {a.timestamp?.split(' ')[1]}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                        {a.explanation}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        Type: {a.alert_type === 'health_concern' ? 'Physiological' : 'Sensor Issue'}
                                    </span>
                                    <button
                                        onClick={() => handleAcknowledgeAlert(a.alert_id)}
                                        className="btn-ghost"
                                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', color: 'var(--success-mint)' }}
                                    >
                                        Acknowledge
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const FastForwardIcon = () => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 19 22 12 13 5 13 19" />
        <polygon points="2 19 11 12 2 5 2 19" />
    </svg>
);
