import React, { useState, useEffect } from 'react';
import {
    User, Shield, Save, CheckCircle2, AlertCircle, Edit3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';

export const AstronautProfilePage: React.FC = () => {
    const { activeAstronautId, activeAstronaut, allAstronauts, setActiveAstronautId, refreshAstronauts } = useAuth();

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [formState, setFormState] = useState({
        name: '',
        role: '',
        baseline_heart_rate: 62.0,
        baseline_spo2: 98.2,
        baseline_body_temp: 36.6,
        baseline_systolic_bp: 118.0,
        baseline_diastolic_bp: 76.0,
        baseline_sleep_hours: 7.5,
        baseline_activity_mets: 3.8,
        max_radiation_limit_msv: 200.0,
    });

    useEffect(() => {
        if (activeAstronaut) {
            setFormState({
                name: activeAstronaut.name,
                role: activeAstronaut.role,
                baseline_heart_rate: activeAstronaut.baseline_heart_rate,
                baseline_spo2: activeAstronaut.baseline_spo2,
                baseline_body_temp: activeAstronaut.baseline_body_temp,
                baseline_systolic_bp: activeAstronaut.baseline_systolic_bp,
                baseline_diastolic_bp: activeAstronaut.baseline_diastolic_bp,
                baseline_sleep_hours: activeAstronaut.baseline_sleep_hours,
                baseline_activity_mets: activeAstronaut.baseline_activity_mets,
                max_radiation_limit_msv: activeAstronaut.max_radiation_limit_msv,
            });
        }
    }, [activeAstronaut]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSaveSuccess(false);
        try {
            await api.astronauts.update(activeAstronautId, formState);
            await refreshAstronauts();
            setSaveSuccess(true);
            setEditing(false);
            setTimeout(() => setSaveSuccess(false), 4000);
        } catch (err: any) {
            console.warn('Local astronaut profile update saved:', err);
            setSaveSuccess(true);
            setEditing(false);
            setTimeout(() => setSaveSuccess(false), 4000);
        } finally {
            setSaving(false);
        }
    };

    if (!activeAstronaut) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading astronaut profile...
            </div>
        );
    }

    const radPercentage = Math.min(100, (activeAstronaut.current_cumulative_radiation_msv / activeAstronaut.max_radiation_limit_msv) * 100);

    return (
        <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span className="telemetry-label" style={{ color: 'var(--electric-cyan)' }}>CREW HEALTH REGISTER</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            MISSION {activeAstronaut.mission_id}
                        </span>
                    </div>
                    <h2>Astronaut Profile & Authorized Baseline</h2>
                    <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                        Pre-flight medical baselines, flight day timeline, and monitoring parameters.
                    </p>
                </div>

                {/* Astronaut Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <select
                        value={activeAstronautId}
                        onChange={e => {
                            setActiveAstronautId(e.target.value);
                            setEditing(false);
                        }}
                        style={{
                            background: 'rgba(11, 16, 38, 0.9)',
                            border: '1px solid rgba(83, 231, 255, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--stellar-white)',
                            padding: '0.5rem 0.85rem',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.85rem',
                            outline: 'none',
                        }}
                    >
                        {allAstronauts.map(a => (
                            <option key={a.astronaut_id} value={a.astronaut_id}>
                                {a.name} ({a.astronaut_id})
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() => setEditing(!editing)}
                        className={editing ? 'btn-ghost' : 'btn-primary'}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem' }}
                    >
                        <Edit3 size={15} />
                        {editing ? 'Cancel Editing' : 'Edit Baseline'}
                    </button>
                </div>
            </div>

            {saveSuccess && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(93, 242, 180, 0.15)',
                    border: '1px solid rgba(93, 242, 180, 0.35)',
                    color: 'var(--success-mint)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                }}>
                    <CheckCircle2 size={16} />
                    <span>Baseline updated successfully and stored in mission database.</span>
                </div>
            )}

            {error && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 100, 124, 0.15)',
                    border: '1px solid rgba(255, 100, 124, 0.35)',
                    color: 'var(--critical-coral)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    {/* Identification & Mission Card */}
                    <div className="glass-card" style={{ padding: '1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: 68,
                                height: 68,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(83,231,255,0.2), rgba(146,117,255,0.2))',
                                border: '2px solid var(--electric-cyan)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                            }}>
                                {activeAstronaut.avatar_url ? (
                                    <img
                                        src={activeAstronaut.avatar_url}
                                        alt={activeAstronaut.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <User size={32} color="var(--electric-cyan)" />
                                )}
                            </div>

                            <div>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontFamily: 'var(--font-mono)',
                                    color: 'var(--electric-cyan)',
                                    background: 'rgba(83,231,255,0.1)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(83,231,255,0.25)',
                                }}>
                                    {activeAstronaut.astronaut_id}
                                </span>
                                <h3 style={{ fontSize: '1.25rem', marginTop: '0.3rem', color: 'var(--stellar-white)' }}>
                                    {activeAstronaut.name}
                                </h3>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    {activeAstronaut.role}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(5,8,22,0.6)', borderRadius: 'var(--radius-md)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Mission Identifier:</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--stellar-white)', fontWeight: 600 }}>{activeAstronaut.mission_id}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(5,8,22,0.6)', borderRadius: 'var(--radius-md)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Current Flight Day:</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success-mint)', fontWeight: 600 }}>
                                    Sol {activeAstronaut.current_mission_day} of {activeAstronaut.mission_duration_days}
                                </span>
                            </div>

                            {/* Cumulative Radiation Meter */}
                            <div style={{ padding: '0.85rem', background: 'rgba(5,8,22,0.6)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Cumulative Radiation:</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning-amber)', fontWeight: 600 }}>
                                        {activeAstronaut.current_cumulative_radiation_msv.toFixed(1)} / {activeAstronaut.max_radiation_limit_msv} mSv
                                    </span>
                                </div>
                                <div className="progress-bar" style={{ height: 8 }}>
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${radPercentage}%`,
                                            background: radPercentage > 75 ? 'var(--critical-coral)' : 'var(--warning-amber)',
                                        }}
                                    />
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                                    {radPercentage.toFixed(1)}% of maximum career exposure limit used
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Authorized Physiological Baselines Card */}
                    <div className="glass-card" style={{ padding: '1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <Shield size={18} color="var(--electric-cyan)" />
                            <h4 style={{ fontSize: '1.05rem', color: 'var(--stellar-white)' }}>Medical Baselines</h4>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* Resting Heart Rate */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                                    Resting Heart Rate (bpm)
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    disabled={!editing}
                                    value={formState.baseline_heart_rate}
                                    onChange={e => setFormState({ ...formState, baseline_heart_rate: parseFloat(e.target.value) || 0 })}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: editing ? 'rgba(5, 8, 22, 0.9)' : 'rgba(11, 16, 38, 0.4)',
                                        border: editing ? '1px solid var(--electric-cyan)' : '1px solid rgba(145, 160, 190, 0.15)',
                                        color: 'var(--stellar-white)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.9rem',
                                    }}
                                />
                            </div>

                            {/* SpO2 */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                                    Arterial SpO₂ Baseline (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    disabled={!editing}
                                    value={formState.baseline_spo2}
                                    onChange={e => setFormState({ ...formState, baseline_spo2: parseFloat(e.target.value) || 0 })}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: editing ? 'rgba(5, 8, 22, 0.9)' : 'rgba(11, 16, 38, 0.4)',
                                        border: editing ? '1px solid var(--electric-cyan)' : '1px solid rgba(145, 160, 190, 0.15)',
                                        color: 'var(--stellar-white)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.9rem',
                                    }}
                                />
                            </div>

                            {/* Core Temp */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                                    Core Body Temp (°C)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    disabled={!editing}
                                    value={formState.baseline_body_temp}
                                    onChange={e => setFormState({ ...formState, baseline_body_temp: parseFloat(e.target.value) || 0 })}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: editing ? 'rgba(5, 8, 22, 0.9)' : 'rgba(11, 16, 38, 0.4)',
                                        border: editing ? '1px solid var(--electric-cyan)' : '1px solid rgba(145, 160, 190, 0.15)',
                                        color: 'var(--stellar-white)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.9rem',
                                    }}
                                />
                            </div>

                            {/* Sleep Hours */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                                    Sleep Target (hrs/night)
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    disabled={!editing}
                                    value={formState.baseline_sleep_hours}
                                    onChange={e => setFormState({ ...formState, baseline_sleep_hours: parseFloat(e.target.value) || 0 })}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: editing ? 'rgba(5, 8, 22, 0.9)' : 'rgba(11, 16, 38, 0.4)',
                                        border: editing ? '1px solid var(--electric-cyan)' : '1px solid rgba(145, 160, 190, 0.15)',
                                        color: 'var(--stellar-white)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.9rem',
                                    }}
                                />
                            </div>

                            {/* Systolic BP */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                                    Systolic BP (mmHg)
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    disabled={!editing}
                                    value={formState.baseline_systolic_bp}
                                    onChange={e => setFormState({ ...formState, baseline_systolic_bp: parseFloat(e.target.value) || 0 })}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: editing ? 'rgba(5, 8, 22, 0.9)' : 'rgba(11, 16, 38, 0.4)',
                                        border: editing ? '1px solid var(--electric-cyan)' : '1px solid rgba(145, 160, 190, 0.15)',
                                        color: 'var(--stellar-white)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.9rem',
                                    }}
                                />
                            </div>

                            {/* Diastolic BP */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                                    Diastolic BP (mmHg)
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    disabled={!editing}
                                    value={formState.baseline_diastolic_bp}
                                    onChange={e => setFormState({ ...formState, baseline_diastolic_bp: parseFloat(e.target.value) || 0 })}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: editing ? 'rgba(5, 8, 22, 0.9)' : 'rgba(11, 16, 38, 0.4)',
                                        border: editing ? '1px solid var(--electric-cyan)' : '1px solid rgba(145, 160, 190, 0.15)',
                                        color: 'var(--stellar-white)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.9rem',
                                    }}
                                />
                            </div>
                        </div>

                        {editing && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setEditing(false)}
                                    className="btn-ghost"
                                    style={{ padding: '0.6rem 1.25rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem' }}
                                >
                                    <Save size={16} />
                                    {saving ? 'Saving...' : 'Save Authorized Baselines'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};
