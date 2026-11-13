import React, { useState, useEffect, useCallback } from 'react';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { api } from '@/services/api';
import type { TimeSeriesPoint } from '@/types';

const METRICS = [
    { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', color: '#FF647C' },
    { key: 'spo2', label: 'SpO₂', unit: '%', color: '#53E7FF' },
    { key: 'body_temp', label: 'Body Temp', unit: '°C', color: '#FFCA72' },
    { key: 'resp_rate', label: 'Resp Rate', unit: 'br/min', color: '#9275FF' },
    { key: 'systolic_bp', label: 'Systolic BP', unit: 'mmHg', color: '#5DF2B4' },
    { key: 'diastolic_bp', label: 'Diastolic BP', unit: 'mmHg', color: '#FF8B53' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) return (
        <div style={{ background: 'rgba(11,16,38,0.97)', border: '1px solid rgba(83,231,255,0.2)', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            {payload.map((p: any) => (
                <div key={p.dataKey} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: p.color }}>
                    {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
                </div>
            ))}
        </div>
    );
    return null;
};

export const MissionDataPage: React.FC = () => {
    const [selectedMetric, setSelectedMetric] = useState('heart_rate');
    const [tsData, setTsData] = useState<TimeSeriesPoint[]>([]);
    const [tsLoading, setTsLoading] = useState(false);
    const [readings, setReadings] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [tableLoading, setTableLoading] = useState(false);
    const [compareMetrics, setCompareMetrics] = useState<string[]>(['heart_rate', 'spo2']);
    const [compareData, setCompareData] = useState<any[]>([]);

    const loadTimeSeries = useCallback(async () => {
        setTsLoading(true);
        try {
            const r = await api.timeSeries(selectedMetric, undefined, undefined, 300);
            setTsData(r.data || r.points || []);
        } catch {
            setTsData([]);
        } finally { setTsLoading(false); }
    }, [selectedMetric]);

    const loadTable = useCallback(async () => {
        setTableLoading(true);
        try {
            const r = await api.readings({ page, page_size: 20, search: search || undefined, order: 'desc' });
            setReadings(r.readings);
            setTotal(r.total);
        } catch { } finally { setTableLoading(false); }
    }, [page, search]);

    const loadCompare = useCallback(async () => {
        if (compareMetrics.length === 0) {
            setCompareData([]);
            return;
        }
        try {
            const results = await Promise.all(compareMetrics.map(m => api.timeSeries(m, undefined, undefined, 200)));
            // Normalize: backend returns 'points', fallback to 'data'
            const normalized = results.map(r => r.data || r.points || []);
            // Merge by index
            const merged: any[] = [];
            const len = Math.max(...normalized.map(r => r.length));
            for (let i = 0; i < len; i++) {
                const point: any = { ts: normalized[0]?.[i]?.timestamp?.slice(5, 16) || i };
                compareMetrics.forEach((m, j) => { point[m] = normalized[j]?.[i]?.value ?? null; });
                merged.push(point);
            }
            setCompareData(merged);
        } catch { }
    }, [compareMetrics]);

    useEffect(() => { loadTimeSeries(); }, [loadTimeSeries]);
    useEffect(() => { loadTable(); }, [loadTable]);
    useEffect(() => { loadCompare(); }, [loadCompare]);

    const metricInfo = METRICS.find(m => m.key === selectedMetric)!;

    const exportCSV = () => {
        if (!readings.length) return;
        const cols = Object.keys(readings[0]);
        const csv = [cols.join(','), ...readings.map(r => cols.map(c => r[c] ?? '').join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `astrocare_readings_page${page}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>HISTORICAL DATA</div>
                <h2 style={{ margin: 0 }}>Mission <span className="text-cyan">Data Explorer</span></h2>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
                    Physiological trends, distribution analysis, and historical records
                </p>
            </div>

            {/* Trend chart */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h4>Physiological Trend</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {METRICS.map(m => (
                            <button
                                key={m.key}
                                className={`btn btn-sm ${selectedMetric === m.key ? 'btn-primary' : 'btn-ghost'}`}
                                style={selectedMetric === m.key ? { background: m.color, color: '#050816' } : {}}
                                onClick={() => setSelectedMetric(m.key)}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
                {tsLoading ? (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="spinner" />
                    </div>
                ) : tsData.length === 0 ? (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        No data available for {metricInfo.label}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={tsData.map(d => ({ ...d, label: d.timestamp.slice(5, 16) }))}>
                            <defs>
                                <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={metricInfo.color} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={metricInfo.color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(145,160,190,0.1)" />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#91A0BE', fontFamily: 'JetBrains Mono' }} tickLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10, fill: '#91A0BE', fontFamily: 'JetBrains Mono' }} tickLine={false}
                                label={{ value: metricInfo.unit, angle: -90, position: 'insideLeft', fill: '#91A0BE', fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="value" name={`${metricInfo.label} (${metricInfo.unit})`}
                                stroke={metricInfo.color} fill={`url(#grad-${selectedMetric})`} strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Multi-metric comparison */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4>Multi-Metric Comparison <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(normalized values shown)</span></h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {METRICS.map(m => (
                            <button
                                key={m.key}
                                className="btn btn-sm"
                                style={{
                                    background: compareMetrics.includes(m.key) ? `${m.color}25` : 'transparent',
                                    border: `1px solid ${compareMetrics.includes(m.key) ? m.color : 'rgba(145,160,190,0.2)'}`,
                                    color: compareMetrics.includes(m.key) ? m.color : 'var(--text-muted)',
                                    fontSize: '0.72rem',
                                }}
                                onClick={() => setCompareMetrics(prev =>
                                    prev.includes(m.key) ? prev.filter(x => x !== m.key) : [...prev, m.key]
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={compareData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(145,160,190,0.08)" />
                        <XAxis dataKey="ts" tick={{ fontSize: 9, fill: '#91A0BE', fontFamily: 'JetBrains Mono' }} tickLine={false} interval={30} />
                        <YAxis tick={{ fontSize: 9, fill: '#91A0BE', fontFamily: 'JetBrains Mono' }} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }} />
                        {compareMetrics.map(mKey => {
                            const meta = METRICS.find(m => m.key === mKey);
                            return meta ? (
                                <Line key={mKey} type="monotone" dataKey={mKey} name={`${meta.label} (${meta.unit})`}
                                    stroke={meta.color} strokeWidth={1.5} dot={false} connectNulls />
                            ) : null;
                        })}
                    </LineChart>
                </ResponsiveContainer>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Note: Multiple metrics with different units are plotted on a shared axis for pattern comparison only. Units differ — see individual metric charts for absolute values.
                </p>
            </div>

            {/* Historical records table */}
            <div className="glass-card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h4>Historical Records <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>({total.toLocaleString()} total)</span></h4>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={13} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
                            <input
                                className="input"
                                style={{ paddingLeft: 30, width: 180, fontSize: '0.85rem', padding: '0.35rem 0.5rem 0.35rem 30px' }}
                                placeholder="Search..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>
                            <Download size={13} /> Export CSV
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {tableLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Timestamp</th>
                                    <th>Heart Rate (bpm)</th>
                                    <th>SpO₂ (%)</th>
                                    <th>Temp (°C)</th>
                                    <th>Resp (br/min)</th>
                                    <th>Sys BP</th>
                                    <th>Dia BP</th>
                                    <th>Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {readings.map(r => (
                                    <tr key={r.id}>
                                        <td className="mono-val">{r.id}</td>
                                        <td className="mono-val" style={{ fontSize: '0.78rem' }}>{r.timestamp}</td>
                                        <td className="mono-val">{r.heart_rate ?? '—'}</td>
                                        <td className="mono-val">{r.spo2 ?? '—'}</td>
                                        <td className="mono-val">{r.body_temp ?? '—'}</td>
                                        <td className="mono-val">{r.resp_rate ?? '—'}</td>
                                        <td className="mono-val">{r.systolic_bp ?? '—'}</td>
                                        <td className="mono-val">{r.diastolic_bp ?? '—'}</td>
                                        <td><span className="badge badge-muted">{r.source}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Page {page} of {Math.max(1, Math.ceil(total / 20))}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
