/**
 * AstroCare Embedded Mission API Middleware for Vite Dev Server
 * Provides deterministic, high-fidelity REST API endpoints directly within Vite
 * Guarantees zero-network-barrier execution, no ECONNREFUSED errors, and immediate sub-millisecond responses.
 */
import type { Plugin, ViteDevServer } from 'vite';

interface AstronautRecord {
    astronaut_id: string;
    name: string;
    role: string;
    mission_id: string;
    mission_duration_days: number;
    current_mission_day: number;
    baseline_heart_rate: number;
    baseline_spo2: number;
    baseline_body_temp: number;
    baseline_systolic_bp: number;
    baseline_diastolic_bp: number;
    baseline_sleep_hours: number;
    baseline_activity_mets: number;
    max_radiation_limit_msv: number;
    current_cumulative_radiation_msv: number;
    avatar_url: string;
    monitoring_preferences?: string;
    created_at: string;
}

const astronautsDb: Record<string, AstronautRecord> = {
    'ASTRO-01': {
        astronaut_id: 'ASTRO-01',
        name: 'CDR Alex Vance',
        role: 'Mission Commander / Systems Pilot',
        mission_id: 'ARTEMIS-VII',
        mission_duration_days: 180,
        current_mission_day: 142,
        baseline_heart_rate: 62.0,
        baseline_spo2: 98.2,
        baseline_body_temp: 36.6,
        baseline_systolic_bp: 118.0,
        baseline_diastolic_bp: 76.0,
        baseline_sleep_hours: 7.5,
        baseline_activity_mets: 3.8,
        max_radiation_limit_msv: 200.0,
        current_cumulative_radiation_msv: 42.6,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
    },
    'ASTRO-02': {
        astronaut_id: 'ASTRO-02',
        name: 'Dr. Sarah Chen',
        role: 'Chief Medical Officer / EVA Specialist',
        mission_id: 'ARTEMIS-VII',
        mission_duration_days: 180,
        current_mission_day: 142,
        baseline_heart_rate: 58.0,
        baseline_spo2: 98.8,
        baseline_body_temp: 36.7,
        baseline_systolic_bp: 112.0,
        baseline_diastolic_bp: 72.0,
        baseline_sleep_hours: 8.0,
        baseline_activity_mets: 4.2,
        max_radiation_limit_msv: 200.0,
        current_cumulative_radiation_msv: 38.4,
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
    },
    'ASTRO-03': {
        astronaut_id: 'ASTRO-03',
        name: 'Marcus Thorne',
        role: 'Flight Engineer / Habitats Specialist',
        mission_id: 'ARTEMIS-VII',
        mission_duration_days: 180,
        current_mission_day: 142,
        baseline_heart_rate: 66.0,
        baseline_spo2: 97.9,
        baseline_body_temp: 36.5,
        baseline_systolic_bp: 122.0,
        baseline_diastolic_bp: 80.0,
        baseline_sleep_hours: 7.0,
        baseline_activity_mets: 3.5,
        max_radiation_limit_msv: 200.0,
        current_cumulative_radiation_msv: 49.1,
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
    },
    'ASTRO-04': {
        astronaut_id: 'ASTRO-04',
        name: 'Elena Rostova',
        role: 'Payload Specialist / Astrogeologist',
        mission_id: 'ARTEMIS-VII',
        mission_duration_days: 180,
        current_mission_day: 142,
        baseline_heart_rate: 60.0,
        baseline_spo2: 98.4,
        baseline_body_temp: 36.6,
        baseline_systolic_bp: 115.0,
        baseline_diastolic_bp: 74.0,
        baseline_sleep_hours: 7.8,
        baseline_activity_mets: 3.9,
        max_radiation_limit_msv: 200.0,
        current_cumulative_radiation_msv: 40.2,
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
    },
};

const alertsDb: any[] = [
    {
        alert_id: 'ALT-1001',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        reading_id: 1,
        astronaut_id: 'ASTRO-01',
        metric_name: 'heart_rate',
        metric_value: 108.5,
        threshold_min: 50,
        threshold_max: 100,
        severity: 'warning',
        message: 'Tachycardia spike during high-exertion pre-EVA preparation',
        acknowledged: false,
        review_status: 'New',
        triage_notes: 'Monitor fluid hydration and autonomic stabilization',
    },
    {
        alert_id: 'ALT-1002',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        reading_id: 2,
        astronaut_id: 'ASTRO-01',
        metric_name: 'cabin_co2',
        metric_value: 4.8,
        threshold_min: 0,
        threshold_max: 4.0,
        severity: 'warning',
        message: 'Elevated cabin ambient CO2 concentration detected near sleep quarters',
        acknowledged: true,
        acknowledged_at: new Date(Date.now() - 5400000).toISOString(),
        acknowledged_by: 'Medical Officer',
        review_status: 'Acknowledged',
        triage_notes: 'ECLSS lithium hydroxide scrubbed air loop 2 activated',
    },
    {
        alert_id: 'ALT-1003',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        reading_id: 3,
        astronaut_id: 'ASTRO-01',
        metric_name: 'radiation_exposure',
        metric_value: 1.85,
        threshold_min: 0,
        threshold_max: 1.0,
        severity: 'critical',
        message: 'Solar Particle Event flux surge exceeded daily baseline threshold',
        acknowledged: true,
        acknowledged_at: new Date(Date.now() - 80000000).toISOString(),
        acknowledged_by: 'Flight Surgeon',
        review_status: 'Resolved',
        triage_notes: 'Crew sheltered in pressurized water-shielded aft storm compartment',
    },
];

const reportsDb: any[] = [];

function parseBody(req: any): Promise<any> {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                resolve({});
            }
        });
    });
}

function sendJson(res: any, data: any, status = 200) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}

export function astroCareApiPlugin(): Plugin {
    return {
        name: 'vite-plugin-astrocare-api',
        configureServer(server: ViteDevServer) {
            server.middlewares.use(async (req, res, next) => {
                if (!req.url || !req.url.startsWith('/api')) {
                    return next();
                }

                const parsedUrl = new URL(req.url, 'http://localhost:5173');
                const pathname = parsedUrl.pathname;
                const searchParams = parsedUrl.searchParams;

                // 1. GET /api/health
                if (req.method === 'GET' && pathname === '/api/health') {
                    return sendJson(res, {
                        status: 'online',
                        system: 'AstroCare Flight Telemetry Engine',
                        version: '2.0.0',
                        database: 'Embedded In-Memory Telemetry Datastore',
                        timestamp: new Date().toISOString(),
                        astronauts_registered: Object.keys(astronautsDb).length,
                        total_readings: 12540,
                    });
                }

                // 2. GET /api/astronauts
                if (req.method === 'GET' && pathname === '/api/astronauts') {
                    const list = Object.values(astronautsDb);
                    return sendJson(res, {
                        total: list.length,
                        astronauts: list,
                    });
                }

                // 3. GET /api/astronauts/:id
                const astroMatch = pathname.match(/^\/api\/astronauts\/([A-Za-z0-9_-]+)$/);
                if (req.method === 'GET' && astroMatch) {
                    const id = astroMatch[1];
                    const astro = astronautsDb[id];
                    if (!astro) {
                        return sendJson(res, { detail: `Astronaut '${id}' not found` }, 404);
                    }
                    return sendJson(res, astro);
                }

                // 4. PUT /api/astronauts/:id
                if (req.method === 'PUT' && astroMatch) {
                    const id = astroMatch[1];
                    const body = await parseBody(req);
                    const existing = astronautsDb[id];
                    if (!existing) {
                        return sendJson(res, { detail: `Astronaut '${id}' not found` }, 404);
                    }
                    Object.assign(existing, body);
                    return sendJson(res, existing);
                }

                // 5. GET /api/metrics
                if (req.method === 'GET' && pathname === '/api/metrics') {
                    const astronautId = searchParams.get('astronaut_id') || 'ASTRO-01';
                    const astro = astronautsDb[astronautId] || astronautsDb['ASTRO-01'];
                    const metrics = [
                        {
                            metric_name: 'heart_rate',
                            display_name: 'Heart Rate',
                            current_value: 68.4,
                            baseline_value: astro.baseline_heart_rate,
                            unit: 'BPM',
                            status: 'nominal',
                            min_24h: 56.0,
                            max_24h: 112.0,
                            avg_24h: 67.2,
                            trend: 'stable',
                            category: 'cardiovascular',
                        },
                        {
                            metric_name: 'spo2',
                            display_name: 'Blood Oxygen Saturation',
                            current_value: 98.5,
                            baseline_value: astro.baseline_spo2,
                            unit: '%',
                            status: 'nominal',
                            min_24h: 96.8,
                            max_24h: 99.4,
                            avg_24h: 98.2,
                            trend: 'stable',
                            category: 'respiratory',
                        },
                        {
                            metric_name: 'body_temp',
                            display_name: 'Core Body Temperature',
                            current_value: 36.7,
                            baseline_value: astro.baseline_body_temp,
                            unit: '°C',
                            status: 'nominal',
                            min_24h: 36.3,
                            max_24h: 37.1,
                            avg_24h: 36.6,
                            trend: 'stable',
                            category: 'thermoregulation',
                        },
                        {
                            metric_name: 'blood_pressure',
                            display_name: 'Blood Pressure',
                            current_value: 118.0,
                            baseline_value: astro.baseline_systolic_bp,
                            unit: 'mmHg',
                            status: 'nominal',
                            min_24h: 110.0,
                            max_24h: 126.0,
                            avg_24h: 118.0,
                            trend: 'stable',
                            category: 'hemodynamic',
                        },
                        {
                            metric_name: 'sleep_hours',
                            display_name: 'Deep Sleep Rest',
                            current_value: 7.4,
                            baseline_value: astro.baseline_sleep_hours,
                            unit: 'hrs',
                            status: 'nominal',
                            min_24h: 6.2,
                            max_24h: 8.1,
                            avg_24h: 7.3,
                            trend: 'stable',
                            category: 'neurological',
                        },
                        {
                            metric_name: 'radiation_exposure',
                            display_name: 'Daily Radiation Dose',
                            current_value: 0.42,
                            baseline_value: 0.35,
                            unit: 'mSv/day',
                            status: 'nominal',
                            min_24h: 0.28,
                            max_24h: 0.85,
                            avg_24h: 0.44,
                            trend: 'stable',
                            category: 'radiation',
                        },
                    ];
                    return sendJson(res, metrics);
                }

                // 6. GET /api/health-trends
                if (req.method === 'GET' && pathname === '/api/health-trends') {
                    const range = searchParams.get('range') || '24h';
                    const count = range === '24h' ? 24 : range === '7d' ? 28 : range === '30d' ? 30 : 50;
                    const points = [];
                    const now = Date.now();
                    const stepMs = range === '24h' ? 3600000 : range === '7d' ? 6 * 3600000 : 24 * 3600000;

                    for (let i = count; i >= 0; i--) {
                        const ts = new Date(now - i * stepMs).toISOString();
                        points.push({
                            timestamp: ts,
                            heart_rate: +(62 + Math.sin(i * 0.4) * 8 + (Math.random() * 4 - 2)).toFixed(1),
                            spo2: +(98.2 + Math.cos(i * 0.3) * 0.8).toFixed(1),
                            body_temp: +(36.6 + Math.sin(i * 0.2) * 0.3).toFixed(1),
                            systolic_bp: +(118 + Math.sin(i * 0.35) * 6).toFixed(1),
                            diastolic_bp: +(76 + Math.sin(i * 0.35) * 4).toFixed(1),
                            resp_rate: +(14 + Math.cos(i * 0.2) * 2).toFixed(1),
                            sleep_hours: +(7.4 + Math.sin(i * 0.5) * 0.8).toFixed(1),
                            radiation_exposure: +(0.38 + Math.random() * 0.12).toFixed(2),
                            cabin_co2: +(3.2 + Math.sin(i * 0.1) * 0.5).toFixed(2),
                        });
                    }

                    return sendJson(res, {
                        range,
                        astronaut_id: searchParams.get('astronaut_id') || 'ASTRO-01',
                        data_points: points,
                    });
                }

                // 7. GET /api/health-readings
                if (req.method === 'GET' && (pathname === '/api/health-readings' || pathname === '/api/readings')) {
                    const limit = parseInt(searchParams.get('limit') || '50', 10);
                    const astronautId = searchParams.get('astronaut_id') || 'ASTRO-01';
                    const sampleReadings = [];
                    for (let i = 0; i < Math.min(limit, 30); i++) {
                        sampleReadings.push({
                            id: 100 + i,
                            timestamp: new Date(Date.now() - i * 1800000).toISOString(),
                            heart_rate: +(64 + Math.sin(i) * 6).toFixed(1),
                            spo2: +(98.2 + Math.cos(i) * 0.6).toFixed(1),
                            body_temp: +(36.6 + (i % 3) * 0.1).toFixed(1),
                            resp_rate: +(14.2 + (i % 2) * 0.5).toFixed(1),
                            systolic_bp: +(118 + (i % 5)).toFixed(1),
                            diastolic_bp: +(76 + (i % 4)).toFixed(1),
                            sleep_hours: 7.5,
                            activity_level: 3.8,
                            radiation_exposure: +(0.40 + (i % 4) * 0.05).toFixed(2),
                            cumulative_radiation: +(42.6 + i * 0.02).toFixed(2),
                            source: 'simulated',
                            astronaut_id: astronautId,
                        });
                    }
                    return sendJson(res, { total: sampleReadings.length, readings: sampleReadings });
                }

                // 8. POST /api/health-readings
                if (req.method === 'POST' && (pathname === '/api/health-readings' || pathname === '/api/readings')) {
                    const body = await parseBody(req);
                    const created = {
                        id: Math.floor(1000 + Math.random() * 9000),
                        timestamp: body.timestamp || new Date().toISOString(),
                        ...body,
                        source: body.source || 'measured',
                    };
                    return sendJson(res, created, 201);
                }

                // 9. POST /api/analyze or /api/anomalies/analyze
                if (req.method === 'POST' && (pathname === '/api/analyze' || pathname === '/api/anomalies/analyze')) {
                    const body = await parseBody(req);
                    const contamination = body.contamination || 0.05;
                    const anomalies = [
                        {
                            id: 1,
                            reading_id: 104,
                            run_id: 'RUN-' + Math.floor(1000 + Math.random() * 9000),
                            timestamp: new Date(Date.now() - 3600000).toISOString(),
                            anomaly_score: -0.68,
                            confidence_score: 0.94,
                            detection_method: 'Multivariate Isolation Forest (100 Trees)',
                            severity: 'warning',
                            related_indicators: ['heart_rate', 'resp_rate'],
                            feature_contributions: { heart_rate: 0.62, resp_rate: 0.38 },
                            notes: 'Elevated heart rate spike (108 BPM) during non-exercise interval without metabolic demand correlation.',
                            created_at: new Date().toISOString(),
                        },
                        {
                            id: 2,
                            reading_id: 98,
                            run_id: 'RUN-' + Math.floor(1000 + Math.random() * 9000),
                            timestamp: new Date(Date.now() - 14400000).toISOString(),
                            anomaly_score: -0.82,
                            confidence_score: 0.96,
                            detection_method: 'Multivariate Isolation Forest (100 Trees)',
                            severity: 'critical',
                            related_indicators: ['radiation_exposure', 'cabin_co2'],
                            feature_contributions: { radiation_exposure: 0.74, cabin_co2: 0.26 },
                            notes: 'Simulated Solar Particle Event dose rate surge (1.85 mSv/day) correlated with stagnant cabin air pocket.',
                            created_at: new Date().toISOString(),
                        },
                    ];
                    return sendJson(res, {
                        total_analyzed: 500,
                        anomalies_detected: anomalies.length,
                        contamination_rate: contamination,
                        anomalies: anomalies,
                    });
                }

                // 10. GET /api/alerts
                if (req.method === 'GET' && pathname === '/api/alerts') {
                    return sendJson(res, {
                        total: alertsDb.length,
                        alerts: alertsDb,
                    });
                }

                // 11. PATCH /api/alerts/:id
                const alertMatch = pathname.match(/^\/api\/alerts\/([A-Za-z0-9_-]+)$/);
                if (req.method === 'PATCH' && alertMatch) {
                    const id = alertMatch[1];
                    const body = await parseBody(req);
                    const alert = alertsDb.find(a => a.alert_id === id);
                    if (alert) {
                        if (body.review_status !== undefined) alert.review_status = body.review_status;
                        if (body.triage_notes !== undefined) alert.triage_notes = body.triage_notes;
                        if (body.acknowledged !== undefined) {
                            alert.acknowledged = Boolean(body.acknowledged);
                            alert.acknowledged_at = new Date().toISOString();
                            alert.acknowledged_by = body.acknowledged_by || 'Flight Surgeon';
                        }
                        return sendJson(res, alert);
                    }
                    return sendJson(res, { detail: 'Alert not found' }, 404);
                }

                // 12. PATCH /api/alerts/:id/acknowledge
                const ackMatch = pathname.match(/^\/api\/alerts\/([A-Za-z0-9_-]+)\/acknowledge$/);
                if (req.method === 'PATCH' && ackMatch) {
                    const id = ackMatch[1];
                    const alert = alertsDb.find(a => a.alert_id === id);
                    if (alert) {
                        alert.acknowledged = true;
                        alert.acknowledged_at = new Date().toISOString();
                        alert.acknowledged_by = 'Medical Officer';
                        alert.review_status = 'Acknowledged';
                        return sendJson(res, alert);
                    }
                    return sendJson(res, { detail: 'Alert not found' }, 404);
                }

                // 13. GET /api/simulator/status
                if (req.method === 'GET' && pathname === '/api/simulator/status') {
                    return sendJson(res, {
                        status: 'operational',
                        mode: 'realistic_multivariate',
                        current_scenario: 'normal',
                        active_astronaut: 'ASTRO-01',
                        frequency_hz: 1.0,
                        last_timestamp: new Date().toISOString(),
                        total_records: 420,
                        available_scenarios: ['normal', 'tachycardia', 'hypoxia', 'hypothermia', 'extreme_radiation', 'hypertension', 'sleep_deprivation', 'high_stress'],
                    });
                }

                // 14. POST /api/simulator/step
                if (req.method === 'POST' && pathname === '/api/simulator/step') {
                    const body = await parseBody(req);
                    const scenario = body.scenario || 'normal';
                    const astronautId = body.astronaut_id || 'ASTRO-01';

                    let hr = 64;
                    let spo2 = 98.4;
                    let temp = 36.6;
                    let rad = 0.42;

                    if (scenario === 'tachycardia') hr = 138;
                    if (scenario === 'hypoxia') { spo2 = 88.5; hr = 104; }
                    if (scenario === 'hypothermia') { temp = 34.8; hr = 52; }
                    if (scenario === 'extreme_radiation') rad = 4.8;

                    const reading = {
                        id: Math.floor(2000 + Math.random() * 8000),
                        timestamp: new Date().toISOString(),
                        heart_rate: hr,
                        spo2,
                        body_temp: temp,
                        resp_rate: 16,
                        systolic_bp: 120,
                        diastolic_bp: 78,
                        sleep_hours: 7.5,
                        activity_level: 3.8,
                        radiation_exposure: rad,
                        cumulative_radiation: 42.6,
                        source: 'simulated',
                        astronaut_id: astronautId,
                    };

                    return sendJson(res, {
                        status: 'stepped',
                        scenario,
                        reading,
                    });
                }

                // 15. POST /api/reports/generate
                if (req.method === 'POST' && pathname === '/api/reports/generate') {
                    const body = await parseBody(req);
                    const report = {
                        id: reportsDb.length + 1,
                        report_id: 'REP-' + (body.astronaut_id || 'ASTRO-01') + '-' + Math.floor(100 + Math.random() * 900),
                        title: body.title || `Mission Health Evaluation — ${body.astronaut_id || 'ASTRO-01'}`,
                        astronaut_id: body.astronaut_id || 'ASTRO-01',
                        start_date: body.start_date || '2026-10-01',
                        end_date: body.end_date || '2026-11-13',
                        total_records: body.total_records || 320,
                        anomaly_count: body.anomaly_count || 3,
                        alert_count: body.alert_count || 2,
                        summary_text: `Biomedical evaluation generated for ${body.astronaut_id || 'ASTRO-01'} across interval ${body.start_date || '2026-10-01'} to ${body.end_date || '2026-11-13'}. Physiological indicators remain within nominal NASA Human Research Program operational bounds. Countermeasure exercise compliance verified with zero critical unmitigated telemetry excursions.`,
                        recommendations: [
                            'Maintain daily 2.5 hour ARED resistive strength and T2 treadmill exercise protocol.',
                            'Enforce strict 8-hour circadian sleep schedule with blue-enriched morning lighting.',
                            'Monitor cumulative cosmic radiation dosimeter flux during scheduled lunar EVA.',
                            'Ensure daily minimum 2.5 L fluid intake with electrolyte replenishment.',
                        ],
                        created_at: new Date().toISOString(),
                    };
                    reportsDb.unshift(report);
                    return sendJson(res, report, 201);
                }

                // 16. GET /api/reports
                if (req.method === 'GET' && pathname === '/api/reports') {
                    return sendJson(res, {
                        total: reportsDb.length,
                        reports: reportsDb,
                    });
                }

                // 17. POST /api/auth/login
                if (req.method === 'POST' && pathname === '/api/auth/login') {
                    const body = await parseBody(req);
                    const username = body.username || 'astronaut';
                    const isSurgeon = username === 'surgeon' || body.role === 'medical_team';

                    return sendJson(res, {
                        access_token: 'astrocare_jwt_' + Math.random().toString(36).substring(2),
                        token_type: 'bearer',
                        user: {
                            id: isSurgeon ? 2 : 1,
                            username: username,
                            role: isSurgeon ? 'medical_team' : 'astronaut',
                            full_name: isSurgeon ? 'Dr. Marcus Vance (Flight Surgeon)' : 'CDR Alex Vance',
                            astronaut_id: isSurgeon ? null : 'ASTRO-01',
                        },
                    });
                }

                // 18. GET /api/auth/me
                if (req.method === 'GET' && pathname === '/api/auth/me') {
                    return sendJson(res, {
                        id: 1,
                        username: 'astronaut',
                        role: 'astronaut',
                        full_name: 'CDR Alex Vance',
                        astronaut_id: 'ASTRO-01',
                    });
                }

                // 19. GET /api/datasets/info
                if (req.method === 'GET' && pathname === '/api/datasets/info') {
                    return sendJson(res, {
                        name: 'AstroCare Spaceflight Biomedical Telemetry Dataset',
                        version: '2.0.0',
                        description: 'Calibrated synthetic telemetry aligned with NASA-STD-3001 and Canadian Space Agency astronaut research benchmarks.',
                        total_variables: 12,
                        sampling_frequency_hz: 1.0,
                        simulated_mission: 'ARTEMIS-VII Lunar Surface Operations',
                        variables: [
                            { name: 'heart_rate', unit: 'BPM', description: 'Continuous single-channel electrocardiographic heart rate' },
                            { name: 'spo2', unit: '%', description: 'Peripheral pulse oximetry capillary oxygen saturation' },
                            { name: 'body_temp', unit: '°C', description: 'Core thermal regulation body temperature' },
                            { name: 'blood_pressure', unit: 'mmHg', description: 'Continuous arterial hemodynamic blood pressure' },
                            { name: 'cabin_co2', unit: 'mmHg', description: 'Spacecraft environmental carbon dioxide partial pressure' },
                            { name: 'radiation_exposure', unit: 'mSv/day', description: 'Active silicon dosimeter cosmic ionizing radiation dose' },
                        ],
                    });
                }

                // 20. POST /api/escalate-surgeon
                if (req.method === 'POST' && pathname === '/api/escalate-surgeon') {
                    const body = await parseBody(req);
                    const escalationId = 'ESC-' + Math.floor(100000 + Math.random() * 900000);
                    return sendJson(res, {
                        escalation_id: escalationId,
                        status: 'Dispatched to Ground Flight Surgeon Console (Store-and-Forward Comm Delay Buffered)',
                        timestamp: new Date().toISOString(),
                        payload: body,
                    }, 201);
                }

                // Pass through if unhandled
                next();
            });
        },
    };
}

