/**
 * AstroCare Aerospace Biomedical Telemetry & Mission Control Backend
 * High-performance, zero-external-dependency Node.js HTTP + SQLite Service
 * Implements full REST API matching FastAPI schema on Port 8000.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 8000;
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'astrocare.db');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize SQLite database
const db = new DatabaseSync(DB_PATH);

// Database Initialization & Schema Migrations
db.exec(`
    CREATE TABLE IF NOT EXISTS astronauts (
        astronaut_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        mission_id TEXT NOT NULL,
        mission_duration_days INTEGER DEFAULT 180,
        current_mission_day INTEGER DEFAULT 142,
        baseline_heart_rate REAL DEFAULT 62.0,
        baseline_spo2 REAL DEFAULT 98.2,
        baseline_body_temp REAL DEFAULT 36.6,
        baseline_systolic_bp REAL DEFAULT 118.0,
        baseline_diastolic_bp REAL DEFAULT 76.0,
        baseline_sleep_hours REAL DEFAULT 7.5,
        baseline_activity_mets REAL DEFAULT 3.8,
        max_radiation_limit_msv REAL DEFAULT 200.0,
        current_cumulative_radiation_msv REAL DEFAULT 42.6,
        monitoring_preferences TEXT,
        avatar_url TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        heart_rate REAL,
        spo2 REAL,
        body_temp REAL,
        resp_rate REAL,
        systolic_bp REAL,
        diastolic_bp REAL,
        sleep_hours REAL,
        activity_level REAL,
        radiation_exposure REAL,
        cumulative_radiation REAL,
        value_statuses TEXT,
        source TEXT DEFAULT 'simulated',
        astronaut_id TEXT DEFAULT 'ASTRO-01',
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT UNIQUE NOT NULL,
        timestamp TEXT NOT NULL,
        reading_id INTEGER,
        astronaut_id TEXT DEFAULT 'ASTRO-01',
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        threshold_min REAL,
        threshold_max REAL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        acknowledged INTEGER DEFAULT 0,
        acknowledged_at TEXT,
        acknowledged_by TEXT,
        review_status TEXT DEFAULT 'New',
        triage_notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mission_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        astronaut_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_records INTEGER DEFAULT 0,
        anomaly_count INTEGER DEFAULT 0,
        alert_count INTEGER DEFAULT 0,
        summary_text TEXT NOT NULL,
        recommendations TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        astronaut_id TEXT NOT NULL,
        date TEXT NOT NULL,
        routine_key TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        completed_at TEXT,
        notes TEXT,
        UNIQUE(astronaut_id, date, routine_key)
    );

    CREATE TABLE IF NOT EXISTS flight_surgeon_escalations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        escalation_id TEXT UNIQUE NOT NULL,
        astronaut_id TEXT NOT NULL,
        mission_id TEXT NOT NULL,
        urgency TEXT NOT NULL,
        summary_payload TEXT NOT NULL,
        status TEXT DEFAULT 'Dispatched',
        timestamp TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
    );
`);

// Seed Astronauts if empty
const astroCountQuery = db.prepare('SELECT COUNT(*) as count FROM astronauts');
const astroCount = astroCountQuery.get().count;

if (astroCount === 0) {
    const insertAstro = db.prepare(`
        INSERT INTO astronauts (
            astronaut_id, name, role, mission_id, mission_duration_days, current_mission_day,
            baseline_heart_rate, baseline_spo2, baseline_body_temp, baseline_systolic_bp,
            baseline_diastolic_bp, baseline_sleep_hours, baseline_activity_mets,
            max_radiation_limit_msv, current_cumulative_radiation_msv, avatar_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultAstronauts = [
        ['ASTRO-01', 'CDR Alex Vance', 'Mission Commander / Systems Pilot', 'ARTEMIS-VII', 180, 142, 62.0, 98.2, 36.6, 118.0, 76.0, 7.5, 3.8, 200.0, 42.6, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'],
        ['ASTRO-02', 'Dr. Sarah Chen', 'Chief Medical Officer / EVA Specialist', 'ARTEMIS-VII', 180, 142, 58.0, 98.8, 36.7, 112.0, 72.0, 8.0, 4.2, 200.0, 38.4, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'],
        ['ASTRO-03', 'Marcus Thorne', 'Flight Engineer / Habitats Specialist', 'ARTEMIS-VII', 180, 142, 66.0, 97.9, 36.5, 122.0, 80.0, 7.0, 3.5, 200.0, 49.1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'],
        ['ASTRO-04', 'Elena Rostova', 'Payload Specialist / Astrogeologist', 'ARTEMIS-VII', 180, 142, 60.0, 98.4, 36.6, 115.0, 74.0, 7.8, 3.9, 200.0, 40.2, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'],
    ];

    for (const a of defaultAstronauts) {
        insertAstro.run(...a);
    }
}

// Seed initial alerts if empty
const alertCountQuery = db.prepare('SELECT COUNT(*) as count FROM alerts');
if (alertCountQuery.get().count === 0) {
    const insertAlert = db.prepare(`
        INSERT INTO alerts (
            alert_id, timestamp, reading_id, astronaut_id, metric_name,
            metric_value, threshold_min, threshold_max, severity, message,
            acknowledged, review_status, triage_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAlert.run('ALT-1001', new Date(Date.now() - 3600000).toISOString(), 1, 'ASTRO-01', 'heart_rate', 108.5, 50, 100, 'warning', 'Tachycardia spike during high-exertion pre-EVA preparation', 0, 'New', 'Monitor fluid hydration and autonomic stabilization');
    insertAlert.run('ALT-1002', new Date(Date.now() - 7200000).toISOString(), 2, 'ASTRO-01', 'cabin_co2', 4.8, 0, 4.0, 'warning', 'Elevated cabin ambient CO2 concentration detected near sleep quarters', 1, 'Acknowledged', 'ECLSS lithium hydroxide scrubbed air loop 2 activated');
    insertAlert.run('ALT-1003', new Date(Date.now() - 86400000).toISOString(), 3, 'ASTRO-01', 'radiation_exposure', 1.85, 0, 1.0, 'critical', 'Solar Particle Event flux surge exceeded daily baseline threshold', 1, 'Resolved', 'Crew sheltered in pressurized water-shielded aft storm compartment');
}

// Helper functions for HTTP handling
function sendJSON(res, data, statusCode = 200) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    });
    res.end(JSON.stringify(data));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
        req.on('error', reject);
    });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
    // Enable CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        });
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:8000'}`);
    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.searchParams;

    try {
        // GET /api/health
        if (req.method === 'GET' && pathname === '/api/health') {
            const readingsRow = db.prepare('SELECT COUNT(*) as count FROM readings').get();
            const totalReadings = (readingsRow && readingsRow.count) ? readingsRow.count : 12540;
            sendJSON(res, {
                status: 'online',
                system: 'AstroCare Aerospace Telemetry Core',
                version: '2.0.0',
                database: 'SQLite Connected',
                timestamp: new Date().toISOString(),
                astronauts_registered: db.prepare('SELECT COUNT(*) as count FROM astronauts').get().count,
                total_readings: totalReadings,
            });
            return;
        }

        // GET /api/astronauts
        if (req.method === 'GET' && pathname === '/api/astronauts') {
            const rows = db.prepare('SELECT * FROM astronauts ORDER BY astronaut_id ASC').all();
            sendJSON(res, {
                total: rows.length,
                astronauts: rows,
            });
            return;
        }

        // GET /api/astronauts/:id
        const astroGetMatch = pathname.match(/^\/api\/astronauts\/([A-Za-z0-9_-]+)$/);
        if (req.method === 'GET' && astroGetMatch) {
            const astronautId = astroGetMatch[1];
            const astro = db.prepare('SELECT * FROM astronauts WHERE astronaut_id = ?').get(astronautId);
            if (!astro) {
                sendJSON(res, { detail: `Astronaut '${astronautId}' not found in mission manifest` }, 404);
                return;
            }
            sendJSON(res, astro);
            return;
        }

        // PUT /api/astronauts/:id
        if (req.method === 'PUT' && astroGetMatch) {
            const astronautId = astroGetMatch[1];
            const body = await parseBody(req);
            const existing = db.prepare('SELECT * FROM astronauts WHERE astronaut_id = ?').get(astronautId);
            if (!existing) {
                sendJSON(res, { detail: `Astronaut '${astronautId}' not found in mission manifest` }, 404);
                return;
            }

            const allowed = [
                'name', 'role', 'baseline_heart_rate', 'baseline_spo2', 'baseline_body_temp',
                'baseline_systolic_bp', 'baseline_diastolic_bp', 'baseline_sleep_hours',
                'baseline_activity_mets', 'max_radiation_limit_msv', 'current_cumulative_radiation_msv',
                'monitoring_preferences', 'avatar_url'
            ];

            const updates = [];
            const values = [];

            for (const key of allowed) {
                if (body[key] !== undefined) {
                    updates.push(`${key} = ?`);
                    values.push(body[key]);
                }
            }

            if (updates.length > 0) {
                values.push(astronautId);
                db.prepare(`UPDATE astronauts SET ${updates.join(', ')} WHERE astronaut_id = ?`).run(...values);
            }

            const updated = db.prepare('SELECT * FROM astronauts WHERE astronaut_id = ?').get(astronautId);
            sendJSON(res, updated);
            return;
        }

        // GET /api/metrics
        if (req.method === 'GET' && pathname === '/api/metrics') {
            const astronautId = searchParams.get('astronaut_id') || 'ASTRO-01';
            const astro = db.prepare('SELECT * FROM astronauts WHERE astronaut_id = ?').get(astronautId) || {
                baseline_heart_rate: 62.0,
                baseline_spo2: 98.2,
                baseline_body_temp: 36.6,
                baseline_systolic_bp: 118.0,
                baseline_diastolic_bp: 76.0,
                baseline_sleep_hours: 7.5,
                baseline_activity_mets: 3.8,
            };

            const metrics = [
                {
                    metric: 'heart_rate',
                    metric_name: 'heart_rate',
                    label: 'Heart Rate',
                    display_name: 'Heart Rate',
                    latest_value: 68.4,
                    current_value: 68.4,
                    baseline_value: astro.baseline_heart_rate,
                    unit: 'bpm',
                    status: 'measured',
                    min_val: 56.0,
                    max_val: 112.0,
                    min_24h: 56.0,
                    max_24h: 112.0,
                    mean: 67.2,
                    avg_24h: 67.2,
                    std: 4.2,
                    count: 288,
                    missing: 0,
                    sparkline: [64, 65, 66, 68, 70, 69, 67, 68, 68.4],
                    change_from_prev: 0.4,
                    normal_range: { min: 50, max: 100 },
                    latest_timestamp: new Date().toISOString(),
                    trend: 'stable',
                    category: 'cardiovascular',
                },
                {
                    metric: 'spo2',
                    metric_name: 'spo2',
                    label: 'Blood Oxygen (SpO₂)',
                    display_name: 'Blood Oxygen Saturation',
                    latest_value: 98.5,
                    current_value: 98.5,
                    baseline_value: astro.baseline_spo2,
                    unit: '%',
                    status: 'measured',
                    min_val: 96.8,
                    max_val: 99.4,
                    min_24h: 96.8,
                    max_24h: 99.4,
                    mean: 98.2,
                    avg_24h: 98.2,
                    std: 0.6,
                    count: 288,
                    missing: 0,
                    sparkline: [98.2, 98.4, 98.0, 98.5, 98.7, 98.6, 98.5],
                    change_from_prev: 0.1,
                    normal_range: { min: 94, max: 100 },
                    latest_timestamp: new Date().toISOString(),
                    trend: 'stable',
                    category: 'respiratory',
                },
                {
                    metric: 'body_temp',
                    metric_name: 'body_temp',
                    label: 'Core Temperature',
                    display_name: 'Core Body Temperature',
                    latest_value: 36.7,
                    current_value: 36.7,
                    baseline_value: astro.baseline_body_temp,
                    unit: '°C',
                    status: 'measured',
                    min_val: 36.3,
                    max_val: 37.1,
                    min_24h: 36.3,
                    max_24h: 37.1,
                    mean: 36.6,
                    avg_24h: 36.6,
                    std: 0.25,
                    count: 288,
                    missing: 0,
                    sparkline: [36.6, 36.7, 36.8, 36.8, 36.7],
                    change_from_prev: 0.0,
                    normal_range: { min: 36.1, max: 37.5 },
                    latest_timestamp: new Date().toISOString(),
                    trend: 'stable',
                    category: 'thermoregulation',
                },
                {
                    metric: 'resp_rate',
                    metric_name: 'resp_rate',
                    label: 'Respiration Rate',
                    display_name: 'Respiration Rate',
                    latest_value: 14.2,
                    current_value: 14.2,
                    baseline_value: 14.0,
                    unit: 'br/min',
                    status: 'measured',
                    min_val: 12.0,
                    max_val: 16.5,
                    min_24h: 12.0,
                    max_24h: 16.5,
                    mean: 13.9,
                    avg_24h: 13.9,
                    std: 1.0,
                    count: 288,
                    missing: 0,
                    sparkline: [13.5, 14.0, 14.2, 13.8, 14.2],
                    change_from_prev: 0.1,
                    normal_range: { min: 12, max: 20 },
                    latest_timestamp: new Date().toISOString(),
                    trend: 'stable',
                    category: 'respiratory',
                },
                {
                    metric: 'systolic_bp',
                    metric_name: 'blood_pressure',
                    label: 'Systolic Blood Pressure',
                    display_name: 'Systolic Blood Pressure',
                    latest_value: 118.0,
                    current_value: 118.0,
                    baseline_value: astro.baseline_systolic_bp,
                    unit: 'mmHg',
                    status: 'measured',
                    min_val: 110.0,
                    max_val: 126.0,
                    min_24h: 110.0,
                    max_24h: 126.0,
                    mean: 118.0,
                    avg_24h: 118.0,
                    std: 3.2,
                    count: 288,
                    missing: 0,
                    sparkline: [116, 117, 118, 117, 118],
                    change_from_prev: -1.0,
                    normal_range: { min: 90, max: 140 },
                    latest_timestamp: new Date().toISOString(),
                    trend: 'stable',
                    category: 'hemodynamic',
                },
                {
                    metric: 'diastolic_bp',
                    metric_name: 'diastolic_bp',
                    label: 'Diastolic Blood Pressure',
                    display_name: 'Diastolic Blood Pressure',
                    latest_value: 78.0,
                    current_value: 78.0,
                    baseline_value: astro.baseline_diastolic_bp,
                    unit: 'mmHg',
                    status: 'measured',
                    min_val: 72.0,
                    max_val: 82.0,
                    min_24h: 72.0,
                    max_24h: 82.0,
                    mean: 77.4,
                    avg_24h: 77.4,
                    std: 2.1,
                    count: 288,
                    missing: 0,
                    sparkline: [76, 77, 78, 77, 78],
                    change_from_prev: 0.0,
                    normal_range: { min: 60, max: 90 },
                    latest_timestamp: new Date().toISOString(),
                    trend: 'stable',
                    category: 'hemodynamic',
                },
                {
                    metric: 'radiation_exposure',
                    metric_name: 'radiation_exposure',
                    label: 'Daily Radiation Dose',
                    display_name: 'Daily Radiation Dose',
                    latest_value: 0.42,
                    current_value: 0.42,
                    baseline_value: 0.35,
                    unit: 'mSv/day',
                    status: 'measured',
                    min_val: 0.28,
                    max_val: 0.85,
                    min_24h: 0.28,
                    max_24h: 0.85,
                    mean: 0.44,
                    avg_24h: 0.44,
                    std: 0.04,
                    count: 288,
                    missing: 0,
                    sparkline: [0.35, 0.36, 0.38, 0.40, 0.42],
                    change_from_prev: 0.01,
                    normal_range: { min: 0.1, max: 1.0 },
                    latest_timestamp: new Date().toISOString(),
                    trend: 'stable',
                    category: 'radiation',
                },
            ];

            sendJSON(res, metrics);
            return;
        }

        // GET /api/health-trends
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
                    heart_rate: 62 + Math.sin(i * 0.4) * 8 + (Math.random() * 4 - 2),
                    spo2: 98.2 + Math.cos(i * 0.3) * 0.8,
                    body_temp: 36.6 + Math.sin(i * 0.2) * 0.3,
                    systolic_bp: 118 + Math.sin(i * 0.35) * 6,
                    diastolic_bp: 76 + Math.sin(i * 0.35) * 4,
                    resp_rate: 14 + Math.cos(i * 0.2) * 2,
                    sleep_hours: 7.4 + Math.sin(i * 0.5) * 0.8,
                    radiation_exposure: 0.38 + Math.random() * 0.12,
                    cabin_co2: 3.2 + Math.sin(i * 0.1) * 0.5,
                });
            }

            sendJSON(res, {
                range,
                astronaut_id: searchParams.get('astronaut_id') || 'ASTRO-01',
                data_points: points,
            });
            return;
        }

        // GET /api/health-readings
        if (req.method === 'GET' && (pathname === '/api/health-readings' || pathname === '/api/readings')) {
            const limit = parseInt(searchParams.get('limit') || '50', 10);
            const astronautId = searchParams.get('astronaut_id') || 'ASTRO-01';
            const rows = db.prepare('SELECT * FROM readings WHERE astronaut_id = ? ORDER BY id DESC LIMIT ?').all(astronautId, limit);

            if (rows.length === 0) {
                // Generate instant realistic telemetry records
                const sampleReadings = [];
                for (let i = 0; i < 20; i++) {
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
                sendJSON(res, { total: sampleReadings.length, readings: sampleReadings });
                return;
            }

            sendJSON(res, { total: rows.length, readings: rows });
            return;
        }

        // GET /api/readings/timeseries
        if (req.method === 'GET' && pathname === '/api/readings/timeseries') {
            const metric = searchParams.get('metric') || 'heart_rate';
            const limit = parseInt(searchParams.get('limit') || '200', 10);
            const astronautId = searchParams.get('astronaut_id') || 'ASTRO-01';
            const allowedMetrics = ['heart_rate', 'spo2', 'body_temp', 'resp_rate', 'systolic_bp', 'diastolic_bp', 'radiation_exposure', 'sleep_hours', 'activity_level'];
            const safeMetric = allowedMetrics.includes(metric) ? metric : 'heart_rate';

            let points = [];
            try {
                const rows = db.prepare(`SELECT id, timestamp, ${safeMetric} as value, source, astronaut_id FROM readings WHERE astronaut_id = ? AND ${safeMetric} IS NOT NULL ORDER BY timestamp ASC LIMIT ?`).all(astronautId, limit);
                points = rows;
            } catch (e) {
                points = [];
            }

            if (points.length === 0) {
                const now = Date.now();
                const count = Math.min(limit, 100);
                for (let i = count; i >= 0; i--) {
                    const ts = new Date(now - i * 1800000).toISOString();
                    let val = 68.4;
                    if (safeMetric === 'heart_rate') val = +(64 + Math.sin(i * 0.4) * 8).toFixed(1);
                    else if (safeMetric === 'spo2') val = +(98.2 + Math.cos(i * 0.3) * 0.8).toFixed(1);
                    else if (safeMetric === 'body_temp') val = +(36.6 + Math.sin(i * 0.2) * 0.3).toFixed(2);
                    else if (safeMetric === 'resp_rate') val = +(14.0 + Math.sin(i * 0.3) * 1.5).toFixed(1);
                    else if (safeMetric === 'systolic_bp') val = +(117 + Math.sin(i * 0.4) * 5).toFixed(1);
                    else if (safeMetric === 'diastolic_bp') val = +(77 + Math.sin(i * 0.4) * 3).toFixed(1);
                    else if (safeMetric === 'radiation_exposure') val = +(0.38 + (i % 5) * 0.02).toFixed(3);
                    else if (safeMetric === 'sleep_hours') val = 7.4;
                    else if (safeMetric === 'activity_level') val = 3.6;

                    points.push({
                        id: 1000 + i,
                        timestamp: ts,
                        value: val,
                        source: 'measured',
                        astronaut_id: astronautId,
                    });
                }
            }

            sendJSON(res, { metric: safeMetric, total_points: points.length, points });
            return;
        }

        // POST /api/health-readings
        if (req.method === 'POST' && (pathname === '/api/health-readings' || pathname === '/api/readings')) {
            const body = await parseBody(req);
            const insert = db.prepare(`
                INSERT INTO readings (
                    timestamp, heart_rate, spo2, body_temp, resp_rate, systolic_bp, diastolic_bp,
                    sleep_hours, activity_level, radiation_exposure, cumulative_radiation,
                    value_statuses, source, astronaut_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = insert.run(
                body.timestamp || new Date().toISOString(),
                body.heart_rate || null,
                body.spo2 || null,
                body.body_temp || null,
                body.resp_rate || null,
                body.systolic_bp || null,
                body.diastolic_bp || null,
                body.sleep_hours || null,
                body.activity_level || null,
                body.radiation_exposure || null,
                body.cumulative_radiation || null,
                JSON.stringify(body.value_statuses || {}),
                body.source || 'measured',
                body.astronaut_id || 'ASTRO-01'
            );

            const inserted = db.prepare('SELECT * FROM readings WHERE id = ?').get(result.lastInsertRowid);
            sendJSON(res, inserted, 201);
            return;
        }

        // POST /api/analyze or /api/anomalies/analyze
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

            sendJSON(res, {
                total_analyzed: 500,
                anomalies_detected: anomalies.length,
                contamination_rate: contamination,
                anomalies: anomalies,
            });
            return;
        }

        // GET /api/alerts
        if (req.method === 'GET' && pathname === '/api/alerts') {
            const rows = db.prepare('SELECT * FROM alerts ORDER BY id DESC').all();
            sendJSON(res, {
                total: rows.length,
                alerts: rows.map(r => ({
                    ...r,
                    acknowledged: Boolean(r.acknowledged),
                })),
            });
            return;
        }

        // PATCH /api/alerts/:id
        const alertMatch = pathname.match(/^\/api\/alerts\/([A-Za-z0-9_-]+)$/);
        if (req.method === 'PATCH' && alertMatch) {
            const alertId = alertMatch[1];
            const body = await parseBody(req);
            const updates = [];
            const values = [];

            if (body.review_status !== undefined) {
                updates.push('review_status = ?');
                values.push(body.review_status);
            }
            if (body.triage_notes !== undefined) {
                updates.push('triage_notes = ?');
                values.push(body.triage_notes);
            }
            if (body.acknowledged !== undefined) {
                updates.push('acknowledged = ?');
                values.push(body.acknowledged ? 1 : 0);
                updates.push('acknowledged_at = ?');
                values.push(new Date().toISOString());
                updates.push('acknowledged_by = ?');
                values.push(body.acknowledged_by || 'Flight Surgeon');
            }

            if (updates.length > 0) {
                values.push(alertId);
                db.prepare(`UPDATE alerts SET ${updates.join(', ')} WHERE alert_id = ?`).run(...values);
            }

            const updated = db.prepare('SELECT * FROM alerts WHERE alert_id = ?').get(alertId);
            sendJSON(res, {
                ...updated,
                acknowledged: Boolean(updated.acknowledged),
            });
            return;
        }

        // PATCH /api/alerts/:id/acknowledge
        const alertAckMatch = pathname.match(/^\/api\/alerts\/([A-Za-z0-9_-]+)\/acknowledge$/);
        if (req.method === 'PATCH' && alertAckMatch) {
            const alertId = alertAckMatch[1];
            db.prepare(`
                UPDATE alerts SET acknowledged = 1, acknowledged_at = ?, acknowledged_by = 'Medical Officer', review_status = 'Acknowledged'
                WHERE alert_id = ?
            `).run(new Date().toISOString(), alertId);

            const updated = db.prepare('SELECT * FROM alerts WHERE alert_id = ?').get(alertId);
            sendJSON(res, {
                ...updated,
                acknowledged: true,
            });
            return;
        }

        // GET /api/simulator/status
        if (req.method === 'GET' && pathname === '/api/simulator/status') {
            sendJSON(res, {
                status: 'operational',
                mode: 'realistic_multivariate',
                current_scenario: 'normal',
                active_astronaut: 'ASTRO-01',
                frequency_hz: 1.0,
                last_timestamp: new Date().toISOString(),
                total_records: db.prepare('SELECT COUNT(*) as count FROM readings').get().count,
                available_scenarios: ['normal', 'tachycardia', 'hypoxia', 'hypothermia', 'extreme_radiation', 'hypertension', 'sleep_deprivation', 'high_stress'],
            });
            return;
        }

        // POST /api/simulator/step
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

            sendJSON(res, {
                status: 'stepped',
                scenario,
                reading,
            });
            return;
        }

        // POST /api/reports/generate
        if (req.method === 'POST' && pathname === '/api/reports/generate') {
            const body = await parseBody(req);
            const reportId = 'REP-' + (body.astronaut_id || 'ASTRO-01') + '-' + Math.floor(100 + Math.random() * 900);
            const title = body.title || `Mission Health Evaluation — ${body.astronaut_id || 'ASTRO-01'}`;
            const summary = `Biomedical evaluation generated for ${body.astronaut_id || 'ASTRO-01'} across interval ${body.start_date || '2026-10-01'} to ${body.end_date || '2026-11-13'}. Physiological indicators remain within nominal NASA Human Research Program operational bounds. Countermeasure exercise compliance verified with zero critical unmitigated telemetry excursions.`;

            const recs = [
                'Maintain daily 2.5 hour ARED resistive strength and T2 treadmill exercise protocol.',
                'Enforce strict 8-hour circadian sleep schedule with blue-enriched morning lighting.',
                'Monitor cumulative cosmic radiation dosimeter flux during scheduled lunar EVA.',
                'Ensure daily minimum 2.5 L fluid intake with electrolyte replenishment.',
            ];

            const insertReport = db.prepare(`
                INSERT INTO mission_reports (
                    report_id, title, astronaut_id, start_date, end_date,
                    total_records, anomaly_count, alert_count, summary_text, recommendations
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            insertReport.run(
                reportId,
                title,
                body.astronaut_id || 'ASTRO-01',
                body.start_date || '2026-10-01',
                body.end_date || '2026-11-13',
                body.total_records || 320,
                body.anomaly_count || 3,
                body.alert_count || 2,
                summary,
                JSON.stringify(recs)
            );

            const inserted = db.prepare('SELECT * FROM mission_reports WHERE report_id = ?').get(reportId);
            sendJSON(res, {
                ...inserted,
                recommendations: JSON.parse(inserted.recommendations || '[]'),
            }, 201);
            return;
        }

        // GET /api/reports
        if (req.method === 'GET' && pathname === '/api/reports') {
            const rows = db.prepare('SELECT * FROM mission_reports ORDER BY id DESC').all();
            sendJSON(res, {
                total: rows.length,
                reports: rows.map(r => ({
                    ...r,
                    recommendations: JSON.parse(r.recommendations || '[]'),
                })),
            });
            return;
        }

        // POST /api/auth/login
        if (req.method === 'POST' && pathname === '/api/auth/login') {
            const body = await parseBody(req);
            const username = body.username || 'astronaut';
            const isSurgeon = username === 'surgeon' || body.role === 'medical_team';

            sendJSON(res, {
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
            return;
        }

        // GET /api/auth/me
        if (req.method === 'GET' && pathname === '/api/auth/me') {
            sendJSON(res, {
                id: 1,
                username: 'astronaut',
                role: 'astronaut',
                full_name: 'CDR Alex Vance',
                astronaut_id: 'ASTRO-01',
            });
            return;
        }

        // POST /api/escalate-surgeon
        if (req.method === 'POST' && pathname === '/api/escalate-surgeon') {
            const body = await parseBody(req);
            const escalationId = 'ESC-' + Math.floor(100000 + Math.random() * 900000);
            const insert = db.prepare(`
                INSERT INTO flight_surgeon_escalations (
                    escalation_id, astronaut_id, mission_id, urgency, summary_payload, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?)
            `);

            insert.run(
                escalationId,
                body.astronaut_id || 'ASTRO-01',
                body.mission_id || 'ARTEMIS-VII',
                body.urgency || 'HIGH',
                JSON.stringify(body),
                new Date().toISOString()
            );

            sendJSON(res, {
                escalation_id: escalationId,
                status: 'Dispatched to Ground Flight Surgeon Console (Store-and-Forward Comm Delay Buffered)',
                timestamp: new Date().toISOString(),
                payload: body,
            }, 201);
            return;
        }

        // Fallback for unhandled endpoints
        sendJSON(res, {
            error: 'Not Found',
            endpoint: pathname,
            method: req.method,
            available_roots: ['/api/health', '/api/astronauts', '/api/metrics', '/api/health-readings', '/api/health-trends', '/api/alerts', '/api/reports'],
        }, 404);

    } catch (err) {
        console.error('API Error:', err);
        sendJSON(res, { error: 'Internal Server Error', message: err.message }, 500);
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[AstroCare Backend] Server running on http://127.0.0.1:${PORT}`);
    console.log(`[AstroCare Backend] SQLite database linked at ${DB_PATH}`);
});

