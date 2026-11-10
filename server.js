// ResQGrid Server Entrypoint
// Zero-Bloat Emergency Response & Disaster Management Platform
// Region: Chennai, Tamil Nadu

const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');

// Native zero-bloat .env loader (Node 20+)
try {
    const envFile = path.join(__dirname, '.env');
    if (fs.existsSync(envFile) && process.loadEnvFile) {
        process.loadEnvFile(envFile);
    }
} catch (e) {
    // .env is optional
}
const { compressionMiddleware, cacheControlMiddleware } = require('./middleware/compression');
const { initDatabase } = require('./database/init-db');
const { handleSSEConnection } = require('./services/sseService');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const teamRoutes = require('./routes/teamRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable HTTP GZIP/Brotli compression
app.use(compressionMiddleware);

// Cache headers for static and dynamic responses
app.use(cacheControlMiddleware);

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Static file hosting (public directory)
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
}));

// Server-Sent Events (SSE) Live Notification Pipeline
app.get('/api/notifications/stream', handleSSEConnection);

// Mount REST API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/analytics', analyticsRoutes);

// Healthcheck & System Info
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        system: 'ResQGrid Disaster Management Platform',
        region: 'Chennai, Tamil Nadu',
        engine: require('./database/db').getEngine(),
        timestamp: new Date().toISOString()
    });
});

// Secure Mapbox Configuration Endpoint (Passes Access Token to authorized frontend)
app.get('/api/config/mapbox', (req, res) => {
    const token = process.env.MAPBOX_ACCESS_TOKEN || '';
    res.json({
        success: true,
        hasToken: Boolean(token && token !== 'YOUR_MAPBOX_ACCESS_TOKEN_HERE'),
        token: token,
        defaultCenter: [80.2707, 13.0827], // [lng, lat] for Mapbox GL
        defaultZoom: 12,
        style: 'mapbox://styles/mapbox/light-v11',
        region: 'Chennai, Tamil Nadu'
    });
});

/**
 * Live GIS Map Data — Combined incidents + team positions in a single request (zero-bloat)
 * Returns only the fields needed for map rendering; no heavy payloads.
 * GET /api/map/live-data
 */
app.get('/api/map/live-data', async (req, res) => {
    try {
        const db = require('./database/db');

        const incidents = await db.all(
            `SELECT i.id, i.title, i.category, i.severity, i.risk_score,
                    i.status, i.latitude, i.longitude, i.location_name,
                    i.people_affected, i.is_sos, i.assigned_team_id,
                    t.name as team_name
             FROM incidents i
             LEFT JOIN teams t ON i.assigned_team_id = t.id
             WHERE i.status NOT IN ('RESOLVED', 'MERGED', 'REJECTED')
             ORDER BY i.risk_score DESC
             LIMIT 60`
        );

        const teams = await db.all(
            `SELECT t.id, t.name, t.specialization, t.status,
                    t.current_latitude, t.current_longitude, t.contact_number,
                    (SELECT i.id FROM incidents i WHERE i.assigned_team_id = t.id
                     AND i.status NOT IN ('RESOLVED','MERGED','REJECTED')
                     ORDER BY i.risk_score DESC LIMIT 1) as active_incident_id,
                    (SELECT i.title FROM incidents i WHERE i.assigned_team_id = t.id
                     AND i.status NOT IN ('RESOLVED','MERGED','REJECTED')
                     ORDER BY i.risk_score DESC LIMIT 1) as active_incident_title
             FROM teams t
             WHERE t.current_latitude IS NOT NULL AND t.current_longitude IS NOT NULL`
        );

        res.json({ success: true, incidents, teams });
    } catch (err) {
        console.error('[Map Live Data] Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Crawler Directive: Strict robots.txt for search engine crawlers
app.get('/robots.txt', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const robotsTxt = [
        'User-agent: *',
        'Allow: /',
        'Allow: /report',
        'Allow: /sitemap.xml',
        'Disallow: /admin',
        'Disallow: /team',
        'Disallow: /api/',
        'Disallow: /uploads/',
        '',
        `Sitemap: ${baseUrl}/sitemap.xml`
    ].join('\n');

    res.type('text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(robotsTxt);
});

// Crawler Directive: Automated sitemap.xml with live public incident bulletin URLs
app.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
        const db = require('./database/db');
        const nowIso = new Date().toISOString().split('T')[0];

        // Fetch recent verified incidents for search engine indexation
        const publicIncidents = await db.all(
            `SELECT id, updated_at FROM incidents 
             WHERE status IN ('REPORTED', 'VERIFIED', 'ASSIGNED', 'RESPONDING', 'RESOLVED')
             ORDER BY updated_at DESC LIMIT 30`
        );

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Core Public Portals
        xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
        xml += `  <url>\n    <loc>${baseUrl}/#citizen</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
        xml += `  <url>\n    <loc>${baseUrl}/#map</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>always</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

        // Dynamic Incident Bulletins
        for (const inc of publicIncidents) {
            const dateStr = (inc.updated_at ? new Date(inc.updated_at) : new Date()).toISOString().split('T')[0];
            xml += `  <url>\n    <loc>${baseUrl}/#incident-${inc.id}</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        }

        xml += `</urlset>`;

        res.type('application/xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (err) {
        console.error('[Sitemap XML Error]', err);
        res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
});

// Dynamic Meta Tags & Single-Page Dashboard SSR Routing
const indexHtmlTemplate = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        const baseUrl = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
        const canonicalUrl = `${baseUrl}${req.path === '/' ? '' : req.path}`;

        // Dynamic Open Graph & Canonical injection
        let enrichedHtml = indexHtmlTemplate
            .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonicalUrl}"`)
            .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${canonicalUrl}"`);

        // Check if an incident query is requested (e.g., /?incident=6 or /incident/6)
        const incidentMatch = req.path.match(/\/incident\/(\d+)/) || (req.query && req.query.incident ? [null, req.query.incident] : null);
        if (incidentMatch) {
            const incId = incidentMatch[1];
            enrichedHtml = enrichedHtml
                .replace(
                    /<title>.*?<\/title>/,
                    `<title>Emergency Alert #${incId} • ResQGrid Disaster Response</title>`
                )
                .replace(
                    /<meta name="description" content="[^"]*"/,
                    `<meta name="description" content="Live Emergency Incident #${incId} tracking and response status in the Chennai Metropolitan Region via ResQGrid."`
                );
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(enrichedHtml);
    }
    next();
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[ResQGrid Server Error]', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error occurred.'
    });
});

// Initialize database and start server
async function startServer() {
    try {
        await initDatabase();
        const server = app.listen(PORT, () => {
            console.log(`=======================================================`);
            console.log(`🛡️  ResQGrid Emergency Management Server running!`);
            console.log(`📍  Target Region: Chennai, Tamil Nadu`);
            console.log(`🌐  Local URL:    http://localhost:${PORT}`);
            console.log(`⚡  Live SSE:     http://localhost:${PORT}/api/notifications/stream`);
            console.log(`=======================================================`);
        });

        const shutdown = () => {
            console.log('\n[ResQGrid] Gracefully stopping server...');
            server.close(() => {
                console.log('[ResQGrid] Process terminated.');
                process.exit(0);
            });
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    } catch (err) {
        console.error('[ResQGrid Critical] Failed to initialize server:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;
