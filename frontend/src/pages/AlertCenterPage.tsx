import React, { useState, useEffect, useCallback } from 'react';
import {
    Check, Search, AlertTriangle, Info,
    XOctagon, Stethoscope, CheckCircle2,
    MessageSquare, ChevronRight, X
} from 'lucide-react';
import { api } from '@/services/api';
import type { Alert } from '@/types';

const SEVERITY_META: Record<string, { icon: React.ElementType; color: string; badge: string }> = {
    critical: { icon: XOctagon, color: 'var(--critical-coral)', badge: 'badge-critical' },
    warning: { icon: AlertTriangle, color: 'var(--warning-amber)', badge: 'badge-warning' },
    info: { icon: Info, color: 'var(--electric-cyan)', badge: 'badge-info' },
};

export const AlertCenterPage: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState<string | undefined>(undefined);
    const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

    // Modal state for triaging/reviewing an alert
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'dismissed' | 'escalated'>('reviewed');
    const [updating, setUpdating] = useState(false);

    const loadAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.alerts({
                search: search || undefined,
                severity: severityFilter,
                alert_type: typeFilter,
                review_status: statusFilter,
                limit: 100,
            });
            setAlerts(r.alerts);
            setTotal(r.total);
        } catch (e) {
            console.error('Failed to load alerts', e);
        } finally {
            setLoading(false);
        }
    }, [search, severityFilter, typeFilter, statusFilter]);

    useEffect(() => {
        loadAlerts();
    }, [loadAlerts]);

    const handleOpenTriage = (alert: Alert) => {
        setSelectedAlert(alert);
        setReviewNotes(alert.reviewer_notes || '');
        setReviewStatus((alert.review_status as any) || 'reviewed');
    };

    const handleSaveTriage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAlert) return;
        setUpdating(true);
        try {
            const updated = await api.updateAlert(selectedAlert.alert_id, {
                acknowledged: true,
                reviewer_notes: reviewNotes,
                review_status: reviewStatus,
            });
            setAlerts(prev => prev.map(a => a.alert_id === updated.alert_id ? updated : a));
            setSelectedAlert(null);
        } catch (e) {
            console.error('Triage error', e);
        } finally {
            setUpdating(false);
        }
    };

    const handleQuickAcknowledge = async (alertId: string) => {
        try {
            await api.acknowledgeAlert(alertId);
            setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, acknowledged: true, review_status: 'reviewed' } : a));
        } catch (e) {
            console.error('Quick acknowledge error', e);
        }
    };

    const counts = {
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
        health: alerts.filter(a => a.alert_type === 'health_concern').length,
        data_quality: alerts.filter(a => a.alert_type === 'data_quality').length,
        unacked: alerts.filter(a => !a.acknowledged).length,
    };

    return (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>ALERT TRIAGE & SAFETY OPERATIONS</div>
                    <h2 style={{ margin: 0 }}>Mission Alert <span className="text-warning">Center</span></h2>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Rule-based and Isolation Forest alerts distinguishing physiological health concerns from sensor data quality issues.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {counts.unacked > 0 && (
                        <span className="badge badge-warning">{counts.unacked} PENDING TRIAGE</span>
                    )}
                    <span className="badge badge-critical">{counts.critical} CRITICAL</span>
                    <span className="badge badge-warning">{counts.warning} REVIEW</span>
                    <span className="badge badge-info">{counts.info} INFO</span>
                </div>
            </div>

            {/* Non-Diagnostic Disclaimer */}
            <div className="glass-card" style={{ padding: '0.75rem 1rem', background: 'rgba(255,202,114,0.05)', border: '1px solid rgba(255,202,114,0.18)' }}>
                <p style={{ fontSize: '0.78rem', margin: 0, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--warning-amber)' }}>Research Prototype Notice:</strong> Alerts and severity levels are generated from algorithmic anomaly detection and configurable demonstration thresholds. They require appropriate clinical review and are not a certified medical diagnostic system.
                </p>
            </div>

            {/* Filters Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
                    <input
                        className="input"
                        style={{ paddingLeft: 30, width: 220, padding: '0.45rem 0.5rem 0.45rem 30px', fontSize: '0.85rem' }}
                        placeholder="Search alerts or actions..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Severity Filter */}
                <select
                    className="select"
                    style={{ width: 140, padding: '0.45rem 0.6rem', fontSize: '0.85rem' }}
                    value={severityFilter || ''}
                    onChange={e => setSeverityFilter(e.target.value || undefined)}
                >
                    <option value="">All Severities</option>
                    <option value="critical">Critical Only</option>
                    <option value="warning">Review Required</option>
                    <option value="info">Informational</option>
                </select>

                {/* Alert Type Filter (Health vs Data Quality) */}
                <select
                    className="select"
                    style={{ width: 160, padding: '0.45rem 0.6rem', fontSize: '0.85rem' }}
                    value={typeFilter || ''}
                    onChange={e => setTypeFilter(e.target.value || undefined)}
                >
                    <option value="">All Alert Types</option>
                    <option value="health_concern">Health Concerns</option>
                    <option value="data_quality">Sensor Data Quality</option>
                </select>

                {/* Status Filter */}
                <select
                    className="select"
                    style={{ width: 140, padding: '0.45rem 0.6rem', fontSize: '0.85rem' }}
                    value={statusFilter || ''}
                    onChange={e => setStatusFilter(e.target.value || undefined)}
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="dismissed">Dismissed</option>
                    <option value="escalated">Escalated</option>
                </select>

                <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Showing {alerts.length} of {total} alerts
                </div>
            </div>

            {/* Alerts List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div className="spinner" />
                </div>
            ) : alerts.length === 0 ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <CheckCircle2 size={36} color="var(--success-mint)" style={{ margin: '0 auto 1rem' }} />
                    <h4 style={{ color: 'var(--stellar-white)', marginBottom: '0.4rem' }}>Zero Active Alerts Matching Filter</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        All physiological telemetry intervals conform to expected microgravity baselines.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {alerts.map(a => {
                        const meta = SEVERITY_META[a.severity] || SEVERITY_META.info;
                        const Icon = meta.icon;
                        const isHealth = a.alert_type === 'health_concern';

                        return (
                            <div
                                key={a.alert_id}
                                className="glass-card"
                                style={{
                                    padding: '1.25rem',
                                    borderLeft: `4px solid ${meta.color}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <div style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            background: `${meta.color}20`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Icon size={16} color={meta.color} />
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--stellar-white)', fontSize: '0.95rem' }}>
                                                    {a.metric?.replace('_', ' ').toUpperCase()} FLAG
                                                </span>
                                                <span className={`badge ${meta.badge}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                                    {a.severity}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: isHealth ? 'rgba(83,231,255,0.1)' : 'rgba(145,160,190,0.15)',
                                                    color: isHealth ? 'var(--electric-cyan)' : 'var(--text-muted)',
                                                    border: isHealth ? '1px solid rgba(83,231,255,0.25)' : '1px solid rgba(145,160,190,0.25)',
                                                }}>
                                                    {isHealth ? 'PHYSIOLOGICAL' : 'SENSOR QUALITY'}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: a.review_status === 'escalated' ? 'rgba(255,100,124,0.15)' : 'rgba(93,242,180,0.1)',
                                                    color: a.review_status === 'escalated' ? 'var(--critical-coral)' : 'var(--success-mint)',
                                                }}>
                                                    STATUS: {a.review_status?.toUpperCase() || 'PENDING'}
                                                </span>
                                            </div>

                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                                                TIMESTAMP: {a.timestamp} • ALERT ID: {a.alert_id}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleOpenTriage(a)}
                                            className="btn btn-outline btn-sm"
                                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                        >
                                            <MessageSquare size={13} />
                                            Clinical Review
                                        </button>

                                        {!a.acknowledged && (
                                            <button
                                                onClick={() => handleQuickAcknowledge(a.alert_id)}
                                                className="btn btn-primary btn-sm"
                                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                            >
                                                <Check size={13} />
                                                Acknowledge
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Explanation */}
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, background: 'rgba(5, 8, 22, 0.4)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                    {a.explanation}
                                </div>

                                {/* Suggested Next Step */}
                                {a.suggested_action && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.5rem',
                                        fontSize: '0.78rem',
                                        color: 'var(--electric-cyan)',
                                        fontFamily: 'var(--font-mono)',
                                    }}>
                                        <ChevronRight size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                                        <span>
                                            <strong>Suggested Protocol:</strong> {a.suggested_action}
                                        </span>
                                    </div>
                                )}

                                {a.reviewer_notes && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        background: 'rgba(83,231,255,0.05)',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid rgba(83,231,255,0.15)',
                                    }}>
                                        <strong style={{ color: 'var(--electric-cyan)' }}>Doctor's Review Note:</strong> {a.reviewer_notes}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Clinical Triage Modal */}
            {selectedAlert && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(5, 8, 22, 0.85)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem',
                }}>
                    <div style={{
                        background: 'rgba(11, 16, 38, 0.98)',
                        border: '1px solid rgba(83, 231, 255, 0.3)',
                        borderRadius: 'var(--radius-lg)',
                        width: '100%',
                        maxWidth: 540,
                        padding: '1.75rem',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Stethoscope size={20} color="var(--electric-cyan)" />
                                <h3 style={{ fontSize: '1.15rem', color: 'var(--stellar-white)', margin: 0 }}>
                                    Flight Surgeon Triage Record
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedAlert(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Alert ID: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--electric-cyan)' }}>{selectedAlert.alert_id}</span> • Metric: <strong>{selectedAlert.metric}</strong>
                        </div>

                        <div style={{ background: 'rgba(5, 8, 22, 0.6)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                            {selectedAlert.explanation}
                        </div>

                        <form onSubmit={handleSaveTriage}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                                    TRIAGE STATUS
                                </label>
                                <select
                                    value={reviewStatus}
                                    onChange={e => setReviewStatus(e.target.value as any)}
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'rgba(5, 8, 22, 0.9)',
                                        border: '1px solid rgba(145, 160, 190, 0.25)',
                                        color: 'var(--stellar-white)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    <option value="reviewed">Reviewed & Nominal (Cleared)</option>
                                    <option value="dismissed">Dismissed (Artifact / Sensor Dropout)</option>
                                    <option value="escalated">Escalated to Flight Surgeon & Crew</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                                    CLINICAL REVIEWER NOTES
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Enter clinical assessment, sensor lead verification, or countermeasure directives..."
                                    value={reviewNotes}
                                    onChange={e => setReviewNotes(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'rgba(5, 8, 22, 0.9)',
                                        border: '1px solid rgba(145, 160, 190, 0.25)',
                                        color: 'var(--stellar-white)',
                                        fontFamily: 'var(--font-sans)',
                                        fontSize: '0.85rem',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedAlert(null)}
                                    className="btn-ghost"
                                    style={{ padding: '0.6rem 1rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="btn-primary"
                                    style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <Check size={16} />
                                    {updating ? 'Saving...' : 'Save Triage Action'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
